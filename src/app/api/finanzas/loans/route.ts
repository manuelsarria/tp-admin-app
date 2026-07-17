import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { withDerived } from '@/lib/loans'

export const dynamic = 'force-dynamic'

const loanSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  kind: z.enum(['PERSONAL', 'BANCARIO', 'PROPIEDAD']).default('PERSONAL'),
  status: z.enum(['ACTIVO', 'PAGADO', 'CANCELADO']).default('ACTIVO'),
  counterparty: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  principal: z.coerce.number().nonnegative('El capital no puede ser negativo'),
  interest: z.coerce.number().nonnegative('El interés no puede ser negativo').default(0),
  totalAmount: z.coerce.number().positive('El total debe ser mayor a cero'),
  downPayment: z.coerce.number().nonnegative('El abono inicial no puede ser negativo').default(0),
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

const filterSchema = z.object({
  status: z.enum(['ACTIVO', 'PAGADO', 'CANCELADO']).optional(),
})

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = filterSchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  const where: any = {}
  if (parsed.data.status) where.status = parsed.data.status

  const loans = await prisma.personalLoan.findMany({
    where,
    include: { payments: { orderBy: { date: 'asc' } } },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({ data: loans.map(withDerived) })
}

export async function POST(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = loanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const created = await prisma.personalLoan.create({
    data: {
      name: d.name,
      kind: d.kind,
      status: d.status,
      counterparty: d.counterparty ?? null,
      reference: d.reference ?? null,
      principal: d.principal,
      interest: d.interest,
      totalAmount: d.totalAmount,
      downPayment: d.downPayment,
      installmentAmount: d.installmentAmount ?? null,
      installmentsTotal: d.installmentsTotal ?? null,
      interestRate: d.interestRate ?? null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      firstPaymentDate: d.firstPaymentDate ? new Date(d.firstPaymentDate) : null,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      unit: d.unit ?? null,
      category: d.category ?? null,
      notes: d.notes ?? null,
      createdById: guard.user.id,
      updatedById: guard.user.id,
    },
    include: { payments: true },
  })
  await logFinanceAudit({
    action: 'loan.create',
    entityId: created.id,
    user: guard.user,
    detail: { name: d.name, kind: d.kind, totalAmount: d.totalAmount },
  })

  return NextResponse.json({ data: withDerived(created) }, { status: 201 })
}
