// Derived money for OPERACIONES (per-container P&L). Like loans, the totals of
// an operation are NEVER stored — they are always recomputed from the linked
// ledger entries so they can't drift away from the journal.
// All amounts are Float USD, so every derived figure is rounded to 2 decimals.

export const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Canonical key for a free-text `reference`.
 *
 * The owner types the same container two different ways — with two spaces on
 * the income and one on the expense:
 *   "Contenedor [9507100400]: ETA [29/JUNIO]  COLCHON"
 *   "Contenedor [9507100400]: ETA [29/JUNIO] COLCHON"
 * Lowercasing, stripping accents and collapsing every whitespace run to a
 * single space makes both land on the same key. Nothing else is touched:
 * punctuation and brackets are meaningful, and `reference` itself is never
 * modified in the database.
 */
export function normalizeRef(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** First run of 7+ digits in a reference (the container number), else null. */
export function extractContainerNumber(s: string | null | undefined): string | null {
  if (!s) return null
  const m = s.match(/\d{7,}/)
  return m ? m[0] : null
}

export interface OperationEntryLike {
  type: string // LedgerType: INGRESO | EGRESO
  status: string // LedgerStatus: PAGADO | PENDIENTE | PARCIAL | ANULADO
  scope: string // LedgerScope: NEGOCIO | PERSONAL
  amount: number
}

export interface OperationLike {
  entries: OperationEntryLike[]
}

export interface OperationDerived {
  invertido: number
  ingresado: number
  ganancia: number
  margen: number
  movimientos: number
}

/**
 * Only PAGADO + NEGOCIO entries count.
 *
 * PAGADO: money that has not actually moved is not profit.
 * NEGOCIO: the owner pays personal expenses out of business pots, so a
 * personal movement that merely passed through "Contenedores Valdai" must
 * never be charged to a container. Counting it would understate the job.
 */
function counts(e: OperationEntryLike): boolean {
  return e.status === 'PAGADO' && e.scope === 'NEGOCIO'
}

/** invertido = Σ EGRESO, ingresado = Σ INGRESO, ganancia = ingresado - invertido. */
export function computeOperationDerived(op: OperationLike): OperationDerived {
  const relevant = op.entries.filter(counts)
  const invertidoRaw = relevant
    .filter(e => e.type === 'EGRESO')
    .reduce((acc, e) => acc + e.amount, 0)
  const ingresadoRaw = relevant
    .filter(e => e.type === 'INGRESO')
    .reduce((acc, e) => acc + e.amount, 0)
  const gananciaRaw = ingresadoRaw - invertidoRaw

  return {
    invertido: round2(invertidoRaw),
    ingresado: round2(ingresadoRaw),
    ganancia: round2(gananciaRaw),
    // Fraction 0..1 (negative when the job lost money). 0 when nothing came in.
    margen: ingresadoRaw > 0 ? Math.round((gananciaRaw / ingresadoRaw) * 10000) / 10000 : 0,
    movimientos: relevant.length,
  }
}

/** Operation + derived fields, ready to serialize. */
export function withOperationDerived<T extends OperationLike>(op: T): T & OperationDerived {
  return { ...op, ...computeOperationDerived(op) }
}
