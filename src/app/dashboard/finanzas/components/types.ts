// Shape of a ledger entry as returned by /api/finanzas/entries.
export interface Entry {
  id: string
  date: string
  unit: string
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
