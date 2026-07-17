import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess } from '@/lib/finance-auth'
import { round2 } from '@/lib/finance'

export const dynamic = 'force-dynamic'

// "De dónde sale el dinero": egresos only, grouped by unit (which pot) and by
// category (what it was spent on). ?scope=PERSONAL answers "cuánto de lo que
// salió de los potes del negocio era gasto personal".
const filterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  scope: z.enum(['NEGOCIO', 'PERSONAL']).optional(),
})

interface Bucket {
  key: string
  total: number
  pct: number
  movimientos: number
}

function group(rows: { unit: string; category: string; amount: number }[], field: 'unit' | 'category', totalEgresos: number): Bucket[] {
  const map = new Map<string, { total: number; movimientos: number }>()
  for (const r of rows) {
    const key = r[field]
    const b = map.get(key) || { total: 0, movimientos: 0 }
    b.total += Math.abs(Number(r.amount) || 0)
    b.movimientos += 1
    map.set(key, b)
  }
  return Array.from(map.entries())
    .map(([key, b]) => ({
      key,
      total: round2(b.total),
      pct: totalEgresos > 0 ? round2((b.total / totalEgresos) * 100) / 100 : 0,
      movimientos: b.movimientos,
    }))
    .sort((a, b) => b.total - a.total)
}

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = filterSchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  const f = parsed.data

  // Same convention as buildSummary: ANULADO never counts, only PAGADO is cash.
  const where: any = { status: 'PAGADO', type: 'EGRESO' }
  if (f.scope) where.scope = f.scope
  if (f.year) {
    where.date = { gte: new Date(f.year, 0, 1), lte: new Date(f.year, 11, 31, 23, 59, 59) }
  }

  const rows = await prisma.personalLedgerEntry.findMany({
    where,
    select: { unit: true, category: true, amount: true },
  })

  const totalEgresos = rows.reduce((s, r) => s + Math.abs(Number(r.amount) || 0), 0)

  return NextResponse.json({
    totalEgresos: round2(totalEgresos),
    movimientos: rows.length,
    byUnit: group(rows, 'unit', totalEgresos),
    byCategory: group(rows, 'category', totalEgresos),
  })
}
