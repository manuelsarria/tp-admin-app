import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { computeLoanDerived, withDerived, resolvePaymentUnit } from '@/lib/loans'

export const dynamic = 'force-dynamic'

const paymentSchema = z.object({
  date: z.string().or(z.date()),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  kind: z.enum(['CUOTA', 'EXTRAORDINARIO', 'INICIAL', 'AJUSTE']).default('CUOTA'),
  /// Fondo del que salió el dinero; manda sobre la unidad del préstamo.
  sourceUnit: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = paymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const loan = await prisma.personalLoan.findUnique({
    where: { id: params.id },
    include: { payments: true },
  })
  if (!loan) return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 })

  const date = new Date(d.date)
  // The fund that paid takes precedence over the loan's default unit.
  const sourceUnit = d.sourceUnit?.trim() || null
  const unit = resolvePaymentUnit(sourceUnit, loan.unit)

  // Payment + its EGRESO in the daily journal must land together or not at all.
  const payment = await prisma.$transaction(async tx => {
    const entry = await tx.personalLedgerEntry.create({
      data: {
        date,
        unit,
        type: 'EGRESO',
        category: loan.category ?? 'Préstamos',
        method: d.method ?? null,
        status: 'PAGADO',
        counterparty: loan.counterparty ?? null,
        reference: d.reference ?? null,
        description: `Pago ${loan.name}`,
        amount: d.amount,
        createdById: guard.user.id,
        updatedById: guard.user.id,
      },
    })

    return tx.personalLoanPayment.create({
      data: {
        loanId: loan.id,
        date,
        amount: d.amount,
        kind: d.kind,
        sourceUnit,
        method: d.method ?? null,
        reference: d.reference ?? null,
        notes: d.notes ?? null,
        ledgerEntryId: entry.id,
        createdById: guard.user.id,
      },
    })
  })

  // Close the loan once it is fully paid.
  const { balance } = computeLoanDerived({ ...loan, payments: [...loan.payments, payment] })
  if (balance <= 0.01 && loan.status === 'ACTIVO') {
    await prisma.personalLoan.update({
      where: { id: loan.id },
      data: { status: 'PAGADO', updatedById: guard.user.id },
    })
  }

  await logFinanceAudit({
    action: 'loan.payment.create',
    entityId: payment.id,
    user: guard.user,
    detail: { loanId: loan.id, loan: loan.name, amount: d.amount, kind: d.kind, unit, balance },
  })

  const refreshed = await prisma.personalLoan.findUnique({
    where: { id: loan.id },
    include: { payments: { orderBy: { date: 'asc' } } },
  })

  return NextResponse.json(
    { data: payment, loan: refreshed ? withDerived(refreshed) : null },
    { status: 201 }
  )
}
