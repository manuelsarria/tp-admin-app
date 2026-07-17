// Derived money for PRÉSTAMOS PERSONALES. The balance of a loan is NEVER
// stored — it is always recomputed from `totalAmount - downPayment - Σpayments`
// so the number can't drift away from the payment history.
// All amounts are Float USD, so every derived figure is rounded to 2 decimals.

export const round2 = (n: number) => Math.round(n * 100) / 100

export interface LoanPaymentLike {
  amount: number
  kind: string
}

/** Fallback unit when neither the payment nor the loan names a fund. */
export const FALLBACK_UNIT = 'Salario Personal'

/**
 * Unit ("fondo") the EGRESO of a payment belongs to. The fund that actually
 * paid wins over the loan's default unit; blanks count as "not set".
 */
export function resolvePaymentUnit(
  sourceUnit?: string | null,
  loanUnit?: string | null
): string {
  return sourceUnit?.trim() || loanUnit?.trim() || FALLBACK_UNIT
}

export interface LoanLike {
  totalAmount: number
  downPayment: number
  payments: LoanPaymentLike[]
}

export interface LoanDerived {
  paid: number
  balance: number
  installmentsPaid: number
  progress: number
}

/** paid = downPayment + Σ payments; balance = totalAmount - paid. */
export function computeLoanDerived(loan: LoanLike): LoanDerived {
  const paidRaw = loan.downPayment + loan.payments.reduce((acc, p) => acc + p.amount, 0)
  const paid = round2(paidRaw)
  const balance = round2(loan.totalAmount - paidRaw)
  const installmentsPaid = loan.payments.filter(p => p.kind === 'CUOTA').length
  const progress = loan.totalAmount > 0
    ? Math.min(1, Math.max(0, Math.round((paidRaw / loan.totalAmount) * 10000) / 10000))
    : 0
  return { paid, balance, installmentsPaid, progress }
}

/** Loan + derived fields, ready to serialize. */
export function withDerived<T extends LoanLike>(loan: T): T & LoanDerived {
  return { ...loan, ...computeLoanDerived(loan) }
}
