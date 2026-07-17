import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess } from '@/lib/finance-auth'
import { round2 } from '@/lib/finance'

export const dynamic = 'force-dynamic'

// Month-by-month series for a single unit ("Salario Personal mes a mes",
// "Dividendos mes a mes"). Always returns the 12 months of the year, so the
// UI can chart it without filling gaps.
const filterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  unit: z.string().min(1, 'Unidad requerida'),
  scope: z.enum(['NEGOCIO', 'PERSONAL']).optional(),
})

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = filterSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Parámetros inválidos' }, { status: 400 })
  }
  const f = parsed.data

  // Same convention as buildSummary: ANULADO never counts, only PAGADO is cash.
  const where: any = {
    status: 'PAGADO',
    unit: f.unit,
    date: { gte: new Date(f.year, 0, 1), lte: new Date(f.year, 11, 31, 23, 59, 59) },
  }
  if (f.scope) where.scope = f.scope

  const rows = await prisma.personalLedgerEntry.findMany({
    where,
    select: { date: true, type: true, amount: true },
  })

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    ingresos: 0,
    egresos: 0,
    neto: 0,
  }))

  for (const r of rows) {
    const amt = Math.abs(Number(r.amount) || 0)
    const m = months[new Date(r.date).getMonth()]
    if (!m) continue
    if (r.type === 'INGRESO') m.ingresos += amt
    else m.egresos += amt
  }

  const data = months.map(m => ({
    month: m.month,
    ingresos: round2(m.ingresos),
    egresos: round2(m.egresos),
    neto: round2(m.ingresos - m.egresos),
  }))

  const totales = {
    ingresos: round2(data.reduce((s, m) => s + m.ingresos, 0)),
    egresos: round2(data.reduce((s, m) => s + m.egresos, 0)),
    neto: round2(data.reduce((s, m) => s + m.neto, 0)),
  }

  return NextResponse.json({ data, totales, meta: { year: f.year, unit: f.unit, scope: f.scope ?? null } })
}
