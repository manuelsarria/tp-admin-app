import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { withDerived } from '@/lib/loans'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').optional(),
  kind: z.enum(['PERSONAL', 'BANCARIO', 'PROPIEDAD']).optional(),
  status: z.enum(['ACTIVO', 'PAGADO', 'CANCELADO']).optional(),
  counterparty: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  principal: z.coerce.number().nonnegative().optional(),
  interest: z.coerce.number().nonnegative().optional(),
  totalAmount: z.coerce.number().positive('El total debe ser mayor a cero').optional(),
  downPayment: z.coerce.number().nonnegative().optional(),
  installmentAmount: z.coerce.number().nonnegative().optional().nullable(),
  installmentsTotal: z.coerce.number().int().nonnegative().optional().nullable(),
  interestRate: z.coerce.number().optional().nullable(),
  startDate: z.string().or(z.date()).optional().nullable(),
  firstPaymentDate: z.string().or(z.date()).optional().nullable(),
  dueDate: z.string().or(z.date()).optional().nullable(),
  unit: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const loan = await prisma.personalLoan.findUnique({
    where: { id: params.id },
    include: { payments: { orderBy: { date: 'asc' } } },
  })
  if (!loan) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ data: withDerived(loan) })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const data: any = { updatedById: guard.user.id }
  for (const k of [
    'name', 'kind', 'status', 'counterparty', 'reference', 'principal', 'interest',
    'totalAmount', 'downPayment', 'installmentAmount', 'installmentsTotal',
    'interestRate', 'unit', 'category', 'notes',
  ] as const) {
    if (d[k] !== undefined) data[k] = d[k]
  }
  for (const k of ['startDate', 'firstPaymentDate', 'dueDate'] as const) {
    if (d[k] !== undefined) data[k] = d[k] ? new Date(d[k] as string | Date) : null
  }

  try {
    const updated = await prisma.personalLoan.update({
      where: { id: params.id },
      data,
      include: { payments: { orderBy: { date: 'asc' } } },
    })
    await logFinanceAudit({ action: 'loan.update', entityId: params.id, user: guard.user, detail: data })
    return NextResponse.json({ data: withDerived(updated) })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  try {
    const existing = await prisma.personalLoan.findUnique({
      where: { id: params.id },
      include: { payments: true },
    })
    // Payments cascade via the FK; their ledger entries are intentionally kept
    // so the daily journal stays intact.
    await prisma.personalLoan.delete({ where: { id: params.id } })
    await logFinanceAudit({ action: 'loan.delete', entityId: params.id, user: guard.user, detail: existing ?? undefined })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
}
