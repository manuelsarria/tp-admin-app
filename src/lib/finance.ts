// Pure, framework-agnostic logic for the personal-finance module.
// Used by the API routes (aggregation, insights) and the UI (constants,
// formatting). No Prisma / Next imports here so it stays testable and
// reusable on both server and client.

export type LedgerType = 'INGRESO' | 'EGRESO'
export type LedgerStatus = 'PAGADO' | 'PENDIENTE' | 'PARCIAL' | 'ANULADO'
/**
 * `unit` = which pot the money moved through; `scope` = business vs personal.
 * The owner pays personal expenses out of business pots, so "cuánto deja
 * Valdai" is only right when PERSONAL rows are excluded.
 */
export type LedgerScope = 'NEGOCIO' | 'PERSONAL'

export interface LedgerRow {
  id: string
  date: string | Date
  unit: string
  scope?: LedgerScope
  type: LedgerType
  category: string
  subcategory?: string | null
  method?: string | null
  status: LedgerStatus
  counterparty?: string | null
  reference?: string | null
  description?: string | null
  amount: number
}

// --- Default catalogs (seeded; editable later in the Catálogos tab) ----------

export const DEFAULT_UNITS = [
  'Shippy',
  'TrackingPTY',
  'CNC',
  'Salario Personal',
  'Dividendos Empresa',
  'Contenedores Valdai',
  'Ventas Adicionales',
  'Otro',
]

export const DEFAULT_CATEGORIES = [
  'Venta servicio',
  'Flete',
  'Comida',
  'Combustible',
  'Transporte',
  'Salario',
  'Comisión',
  'Dividendos',
  'Proveedor',
  'Aduana',
  'Bodega',
  'Servicios (luz/agua/internet)',
  'Software / Suscripciones',
  'Mantenimiento',
  'Bancos / Comisiones',
  'Impuestos',
  'Marketing',
  'Otro',
]

export const DEFAULT_METHODS = [
  'Efectivo',
  'Transferencia',
  'ACH',
  'Yappy',
  'Tarjeta',
  'Cheque',
  'Otro',
]

export const STATUSES: LedgerStatus[] = ['PAGADO', 'PENDIENTE', 'PARCIAL', 'ANULADO']
export const TYPES: LedgerType[] = ['INGRESO', 'EGRESO']
export const SCOPES: LedgerScope[] = ['NEGOCIO', 'PERSONAL']

export const SCOPE_LABEL: Record<LedgerScope, string> = {
  NEGOCIO: 'Negocio',
  PERSONAL: 'Personal',
}

export const STATUS_LABEL: Record<LedgerStatus, string> = {
  PAGADO: 'Pagado',
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  ANULADO: 'Anulado',
}

// --- Helpers -----------------------------------------------------------------

export function toDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(v)
}

export function monthKey(v: string | Date): string {
  const d = toDate(v)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${MESES[(m || 1) - 1]} ${y}`
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n || 0)
}

/** A "paid"/realized entry counts toward cash flow; ANULADO never counts. */
function isRealized(r: LedgerRow): boolean {
  return r.status === 'PAGADO'
}
function isPending(r: LedgerRow): boolean {
  return r.status === 'PENDIENTE' || r.status === 'PARCIAL'
}

/** Rows saved before the scope axis existed are business money by default. */
export function rowScope(r: { scope?: LedgerScope | null }): LedgerScope {
  return r.scope === 'PERSONAL' ? 'PERSONAL' : 'NEGOCIO'
}

/** Money is rounded to 2 decimals at the edge of every aggregation. */
export function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}

// --- Summary (Dashboard / Resumen Mensual / Por Unidad) ----------------------

export interface MonthRow {
  key: string
  label: string
  ingresos: number
  egresos: number
  neto: number
}
export interface ScopeTotals {
  ingresos: number
  egresos: number
  neto: number
}
export interface UnitRow {
  unit: string
  ingresos: number
  egresos: number
  neto: number
  pctIngresos: number // share of total income
  pctEgresos: number // share of total expense
  /**
   * Same unit (pot), split by what the money actually was. `negocio` is the
   * one that answers "cuánto deja esta unidad"; `personal` is the owner's
   * spend that merely passed through the pot.
   */
  negocio: ScopeTotals
  personal: ScopeTotals
}
export interface FinanceSummary {
  kpis: {
    ingresos: number
    egresos: number
    flujoNeto: number
    porCobrar: number
    porPagar: number
    mejorMes: { key: string; label: string; neto: number } | null
    transacciones: number
  }
  monthly: MonthRow[]
  byUnit: UnitRow[]
}

export function buildSummary(rows: LedgerRow[]): FinanceSummary {
  let ingresos = 0
  let egresos = 0
  let porCobrar = 0
  let porPagar = 0
  const months = new Map<string, MonthRow>()
  const units = new Map<string, UnitRow>()

  for (const r of rows) {
    const amt = Math.abs(Number(r.amount) || 0)
    if (r.status === 'ANULADO') continue

    if (isPending(r)) {
      if (r.type === 'INGRESO') porCobrar += amt
      else porPagar += amt
    }
    if (!isRealized(r)) continue

    const mk = monthKey(r.date)
    if (!months.has(mk)) months.set(mk, { key: mk, label: monthLabel(mk), ingresos: 0, egresos: 0, neto: 0 })
    const m = months.get(mk)!
    if (!units.has(r.unit)) {
      units.set(r.unit, {
        unit: r.unit,
        ingresos: 0,
        egresos: 0,
        neto: 0,
        pctIngresos: 0,
        pctEgresos: 0,
        negocio: { ingresos: 0, egresos: 0, neto: 0 },
        personal: { ingresos: 0, egresos: 0, neto: 0 },
      })
    }
    const u = units.get(r.unit)!
    const s = rowScope(r) === 'PERSONAL' ? u.personal : u.negocio

    if (r.type === 'INGRESO') {
      ingresos += amt
      m.ingresos += amt
      u.ingresos += amt
      s.ingresos += amt
    } else {
      egresos += amt
      m.egresos += amt
      u.egresos += amt
      s.egresos += amt
    }
    m.neto = m.ingresos - m.egresos
    u.neto = u.ingresos - u.egresos
    s.neto = s.ingresos - s.egresos
  }

  const monthly = Array.from(months.values()).sort((a, b) => a.key.localeCompare(b.key))
  const byUnit = Array.from(units.values()).sort((a, b) => b.egresos - a.egresos || b.ingresos - a.ingresos)
  for (const u of byUnit) {
    u.pctIngresos = ingresos > 0 ? u.ingresos / ingresos : 0
    u.pctEgresos = egresos > 0 ? u.egresos / egresos : 0
    for (const s of [u.negocio, u.personal]) {
      s.ingresos = round2(s.ingresos)
      s.egresos = round2(s.egresos)
      s.neto = round2(s.neto)
    }
  }

  let mejorMes: FinanceSummary['kpis']['mejorMes'] = null
  for (const m of monthly) {
    if (!mejorMes || m.neto > mejorMes.neto) mejorMes = { key: m.key, label: m.label, neto: m.neto }
  }

  return {
    kpis: {
      ingresos,
      egresos,
      flujoNeto: ingresos - egresos,
      porCobrar,
      porPagar,
      mejorMes,
      transacciones: rows.filter(r => r.status !== 'ANULADO').length,
    },
    monthly,
    byUnit,
  }
}

// --- Insights ("contador": gastos hormiga + consejos) ------------------------

export interface AntExpense {
  concept: string // category (+counterparty when distinctive)
  count: number
  total: number
  avg: number
  perMonth: number
  projectedYear: number
}
export interface CategoryTotal {
  category: string
  total: number
  count: number
  pct: number
}
export interface FinanceInsights {
  monthsSpan: number
  topCategories: CategoryTotal[]
  antExpenses: AntExpense[]
  unitConcerns: { unit: string; neto: number; egresos: number }[]
  trend: { category: string; prev: number; last: number; deltaPct: number }[]
  recommendations: string[]
}

const ANT_MAX_AMOUNT = 25 // small ticket
const ANT_MIN_COUNT = 4 // recurring

export function buildInsights(rows: LedgerRow[]): FinanceInsights {
  const expenses = rows.filter(r => r.type === 'EGRESO' && r.status === 'PAGADO')

  // distinct months covered (for monthly averages / projections)
  const monthsSet = new Set(expenses.map(r => monthKey(r.date)))
  const monthsSpan = Math.max(1, monthsSet.size)

  // by category
  const byCat = new Map<string, { total: number; count: number }>()
  for (const r of expenses) {
    const amt = Math.abs(Number(r.amount) || 0)
    const c = byCat.get(r.category) || { total: 0, count: 0 }
    c.total += amt
    c.count += 1
    byCat.set(r.category, c)
  }
  const totalExpense = expenses.reduce((s, r) => s + Math.abs(Number(r.amount) || 0), 0)
  const topCategories: CategoryTotal[] = Array.from(byCat.entries())
    .map(([category, v]) => ({ category, total: v.total, count: v.count, pct: totalExpense > 0 ? v.total / totalExpense : 0 }))
    .sort((a, b) => b.total - a.total)

  // ant expenses: small individual amounts, recurring, grouped by category
  const antMap = new Map<string, { total: number; count: number }>()
  for (const r of expenses) {
    const amt = Math.abs(Number(r.amount) || 0)
    if (amt > 0 && amt <= ANT_MAX_AMOUNT) {
      const c = antMap.get(r.category) || { total: 0, count: 0 }
      c.total += amt
      c.count += 1
      antMap.set(r.category, c)
    }
  }
  const antExpenses: AntExpense[] = Array.from(antMap.entries())
    .filter(([, v]) => v.count >= ANT_MIN_COUNT)
    .map(([concept, v]) => ({
      concept,
      count: v.count,
      total: v.total,
      avg: v.total / v.count,
      perMonth: v.total / monthsSpan,
      projectedYear: (v.total / monthsSpan) * 12,
    }))
    .sort((a, b) => b.total - a.total)

  // unit concerns: net negative units (more egreso than ingreso)
  const unitMap = new Map<string, { ingresos: number; egresos: number }>()
  for (const r of rows) {
    if (r.status !== 'PAGADO') continue
    const amt = Math.abs(Number(r.amount) || 0)
    const u = unitMap.get(r.unit) || { ingresos: 0, egresos: 0 }
    if (r.type === 'INGRESO') u.ingresos += amt
    else u.egresos += amt
    unitMap.set(r.unit, u)
  }
  const unitConcerns = Array.from(unitMap.entries())
    .map(([unit, v]) => ({ unit, neto: v.ingresos - v.egresos, egresos: v.egresos }))
    .filter(u => u.neto < 0 && u.egresos > 0)
    .sort((a, b) => a.neto - b.neto)

  // trend: last month vs previous month, by category (expenses)
  const monthKeys = Array.from(monthsSet).sort()
  const lastK = monthKeys[monthKeys.length - 1]
  const prevK = monthKeys[monthKeys.length - 2]
  const trend: FinanceInsights['trend'] = []
  if (lastK && prevK) {
    const lastByCat = new Map<string, number>()
    const prevByCat = new Map<string, number>()
    for (const r of expenses) {
      const amt = Math.abs(Number(r.amount) || 0)
      const mk = monthKey(r.date)
      if (mk === lastK) lastByCat.set(r.category, (lastByCat.get(r.category) || 0) + amt)
      else if (mk === prevK) prevByCat.set(r.category, (prevByCat.get(r.category) || 0) + amt)
    }
    const cats = new Set([...lastByCat.keys(), ...prevByCat.keys()])
    for (const cat of cats) {
      const last = lastByCat.get(cat) || 0
      const prev = prevByCat.get(cat) || 0
      const deltaPct = prev > 0 ? (last - prev) / prev : last > 0 ? 1 : 0
      if (last - prev > 0 && (prev === 0 || deltaPct >= 0.2)) {
        trend.push({ category: cat, prev, last, deltaPct })
      }
    }
    trend.sort((a, b) => (b.last - b.prev) - (a.last - a.prev))
  }

  // recommendations (rule-based, contador-style)
  const recommendations: string[] = []
  if (antExpenses.length > 0) {
    const top = antExpenses[0]
    const save30 = top.projectedYear * 0.3
    recommendations.push(
      `Tu mayor "gasto hormiga" es ${top.concept}: ${top.count} movimientos pequeños que suman ${formatMoney(top.total)} (~${formatMoney(top.perMonth)}/mes, ${formatMoney(top.projectedYear)}/año). Reduciéndolo 30% ahorrarías ${formatMoney(save30)}/año.`
    )
  }
  if (topCategories[0] && topCategories[0].pct >= 0.4) {
    recommendations.push(
      `El ${(topCategories[0].pct * 100).toFixed(0)}% de tus egresos se concentra en "${topCategories[0].category}" (${formatMoney(topCategories[0].total)}). Conviene negociar o diversificar ese gasto.`
    )
  }
  for (const u of unitConcerns.slice(0, 2)) {
    recommendations.push(
      `La unidad "${u.unit}" está en números rojos: gasta ${formatMoney(u.egresos)} más de lo que ingresa (neto ${formatMoney(u.neto)}). Revisa su rentabilidad.`
    )
  }
  for (const t of trend.slice(0, 2)) {
    const pctTxt = t.prev > 0 ? `+${(t.deltaPct * 100).toFixed(0)}%` : 'nuevo'
    recommendations.push(
      `El gasto en "${t.category}" subió ${pctTxt} respecto al mes anterior (${formatMoney(t.prev)} → ${formatMoney(t.last)}). Vigílalo.`
    )
  }
  if (recommendations.length === 0) {
    recommendations.push('Sin alertas relevantes por ahora. Sigue registrando a diario para obtener consejos más precisos.')
  }

  return { monthsSpan, topCategories, antExpenses, unitConcerns, trend, recommendations }
}
