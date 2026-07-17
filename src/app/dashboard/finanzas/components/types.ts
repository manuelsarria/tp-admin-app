/**
 * `unit` says WHICH pot the money moved through; `scope` says whether it was a
 * business movement or a personal one (the owner pays personal expenses out of
 * business pots).
 */
export type LedgerScope = 'NEGOCIO' | 'PERSONAL'

export const LEDGER_SCOPE_LABEL: Record<LedgerScope, string> = {
  NEGOCIO: 'Negocio',
  PERSONAL: 'Personal',
}

// Shape of a ledger entry as returned by /api/finanzas/entries.
export interface Entry {
  id: string
  date: string
  unit: string
  scope: LedgerScope
  /** False cuando el `scope` es una suposición del backfill que nadie confirmó. */
  scopeReviewed?: boolean
  type: 'INGRESO' | 'EGRESO'
  category: string
  subcategory: string | null
  method: string | null
  status: 'PAGADO' | 'PENDIENTE' | 'PARCIAL' | 'ANULADO'
  counterparty: string | null
  reference: string | null
  description: string | null
  amount: number
  receiptUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CatalogValues {
  unit: string[]
  category: string[]
  method: string[]
}

// ---------------------------------------------------------------------
// Préstamos personales (/api/finanzas/loans)
// ---------------------------------------------------------------------

export type LoanKind = 'PERSONAL' | 'BANCARIO' | 'PROPIEDAD'
export type LoanStatus = 'ACTIVO' | 'PAGADO' | 'CANCELADO'
export type LoanPaymentKind = 'CUOTA' | 'EXTRAORDINARIO' | 'INICIAL' | 'AJUSTE'

export interface LoanPayment {
  id: string
  date: string
  amount: number
  kind: LoanPaymentKind
  /** Fondo del que salió el dinero; es la `unit` del egreso en el libro. */
  sourceUnit: string | null
  method: string | null
  reference: string | null
  notes: string | null
}

/** A loan as returned by the API: model fields + derived totals + payments. */
export interface Loan {
  id: string
  name: string
  kind: LoanKind
  status: LoanStatus
  counterparty: string | null
  reference: string | null
  principal: number
  interest: number
  totalAmount: number
  downPayment: number
  installmentAmount: number | null
  installmentsTotal: number | null
  interestRate: number | null
  startDate: string | null
  firstPaymentDate: string | null
  dueDate: string | null
  unit: string | null
  category: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  // derived
  paid: number
  balance: number
  installmentsPaid: number
  progress: number
  payments: LoanPayment[]
}

export const LOAN_KIND_LABEL: Record<LoanKind, string> = {
  PERSONAL: 'Personal',
  BANCARIO: 'Bancario',
  PROPIEDAD: 'Propiedad',
}

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  ACTIVO: 'Activo',
  PAGADO: 'Pagado',
  CANCELADO: 'Cancelado',
}

export const LOAN_PAYMENT_KIND_LABEL: Record<LoanPaymentKind, string> = {
  CUOTA: 'Cuota',
  EXTRAORDINARIO: 'Extraordinario',
  INICIAL: 'Abono inicial',
  AJUSTE: 'Ajuste',
}
