import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { computeLoanDerived, withDerived, resolvePaymentUnit } from '@/lib/loans'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  date: z.string().or(z.date()).optional(),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero').optional(),
  kind: z.enum(['CUOTA', 'EXTRAORDINARIO', 'INICIAL', 'AJUSTE']).optional(),
  /// Fondo del que salió el dinero; manda sobre la unidad del préstamo.
  sourceUnit: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/** Re-evaluates ACTIVO / PAGADO after the payment history changed. */
async function syncLoanStatus(loanId: string, userId: string) {
  const loan = await prisma.personalLoan.findUnique({
    where: { id: loanId },
    include: { payments: { orderBy: { date: 'asc' } } },
  })
  if (!loan) return null

  const derived = computeLoanDerived(loan)
  if (loan.status !== 'CANCELADO') {
    const next = derived.balance <= 0.01 ? 'PAGADO' : 'ACTIVO'
    if (next !== loan.status) {
      const updated = await prisma.personalLoan.update({
        where: { id: loanId },
        data: { status: next, updatedById: userId },
        include: { payments: { orderBy: { date: 'asc' } } },
      })
      return withDerived(updated)
    }
  }
  return withDerived(loan)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string; paymentId: string } }) {
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

  const existing = await prisma.personalLoanPayment.findUnique({ where: { id: params.paymentId } })
  if (!existing || existing.loanId !== params.id) {
    return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  }

  const data: any = {}
  for (const k of ['amount', 'kind', 'method', 'reference', 'notes'] as const) {
    if (d[k] !== undefined) data[k] = d[k]
  }
  if (d.date !== undefined) data.date = new Date(d.date)
  if (d.sourceUnit !== undefined) data.sourceUnit = d.sourceUnit?.trim() || null

  const updated = await prisma.$transaction(async tx => {
    const payment = await tx.personalLoanPayment.update({ where: { id: params.paymentId }, data })

    // Keep the linked journal movement in sync with the payment.
    if (existing.ledgerEntryId) {
      const entryData: any = { updatedById: guard.user.id }
      if (data.amount !== undefined) entryData.amount = data.amount
      if (data.date !== undefined) entryData.date = data.date
      if (data.method !== undefined) entryData.method = data.method
      if (data.reference !== undefined) entryData.reference = data.reference
      // Changing the fund moves the EGRESO to that unit in the journal.
      if (data.sourceUnit !== undefined) {
        const loan = await tx.personalLoan.findUnique({
          where: { id: params.id },
          select: { unit: true },
        })
        entryData.unit = resolvePaymentUnit(data.sourceUnit, loan?.unit)
      }
      await tx.personalLedgerEntry.updateMany({ where: { id: existing.ledgerEntryId }, data: entryData })
    }
    return payment
  })

  const loan = await syncLoanStatus(params.id, guard.user.id)

  await logFinanceAudit({
    action: 'loan.payment.update',
    entityId: params.paymentId,
    user: guard.user,
    detail: { loanId: params.id, changes: data },
  })

  return NextResponse.json({ data: updated, loan })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; paymentId: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const existing = await prisma.personalLoanPayment.findUnique({ where: { id: params.paymentId } })
  if (!existing || existing.loanId !== params.id) {
    return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  }

  await prisma.$transaction(async tx => {
    await tx.personalLoanPayment.delete({ where: { id: params.paymentId } })
    if (existing.ledgerEntryId) {
      await tx.personalLedgerEntry.deleteMany({ where: { id: existing.ledgerEntryId } })
    }
  })

  const loan = await syncLoanStatus(params.id, guard.user.id)

  await logFinanceAudit({
    action: 'loan.payment.delete',
    entityId: params.paymentId,
    user: guard.user,
    detail: existing,
  })

  return NextResponse.json({ ok: true, loan })
}
