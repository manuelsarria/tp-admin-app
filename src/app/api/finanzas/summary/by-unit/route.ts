import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess } from '@/lib/finance-auth'
import { round2 } from '@/lib/finance'

export const dynamic = 'force-dynamic'

// Per-unit totals ("Resumen por rubro"). `scope` lets the caller ask
// "cuánto deja Valdai" (?scope=NEGOCIO) without the owner's personal spend
// that merely passed through the same pot.
const filterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  scope: z.enum(['NEGOCIO', 'PERSONAL']).optional(),
})

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = filterSchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  const f = parsed.data

  // Same convention as buildSummary: ANULADO never counts, and only PAGADO
  // rows are realized cash flow.
  const where: any = { status: 'PAGADO' }
  if (f.scope) where.scope = f.scope
  if (f.year) {
    where.date = { gte: new Date(f.year, 0, 1), lte: new Date(f.year, 11, 31, 23, 59, 59) }
  }

  const rows = await prisma.personalLedgerEntry.findMany({
    where,
    select: { unit: true, type: true, amount: true },
  })

  const map = new Map<string, { unit: string; ingresos: number; egresos: number; neto: number; movimientos: number }>()
  for (const r of rows) {
    const amt = Math.abs(Number(r.amount) || 0)
    if (!map.has(r.unit)) map.set(r.unit, { unit: r.unit, ingresos: 0, egresos: 0, neto: 0, movimientos: 0 })
    const u = map.get(r.unit)!
    if (r.type === 'INGRESO') u.ingresos += amt
    else u.egresos += amt
    u.movimientos += 1
  }

  const data = Array.from(map.values())
    .map(u => ({
      unit: u.unit,
      ingresos: round2(u.ingresos),
      egresos: round2(u.egresos),
      neto: round2(u.ingresos - u.egresos),
      movimientos: u.movimientos,
    }))
    .sort((a, b) => b.neto - a.neto || b.ingresos - a.ingresos)

  const totales = {
    ingresos: round2(data.reduce((s, u) => s + u.ingresos, 0)),
    egresos: round2(data.reduce((s, u) => s + u.egresos, 0)),
    neto: round2(data.reduce((s, u) => s + u.neto, 0)),
    movimientos: data.reduce((s, u) => s + u.movimientos, 0),
    unidades: data.length,
  }

  return NextResponse.json({ data, totales })
}
