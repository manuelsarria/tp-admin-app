// Shared logic for grouping FCL shipments into "containers" with the clients
// inside each one, enriched with warehouse/ETA tracking (CargoManagement) and
// upcoming-arrival alerts. Used by both the admin dashboard panel and the
// "Contenedores" view in Admin Carga.

export type TransportType = 'AIR' | 'MAR'

/** Minimal shape of an FCL shipment needed to build container groups. */
export interface FclLike {
  containerNumber?: string | null
  empresaId?: string | null
  empresaName?: string | null
  empresaCode?: string | null
  transportType?: TransportType | null
  totalCbm?: number | null
  totalWeight?: number | null
  misidentified?: boolean | null
  dangerousGoods?: boolean | null
}

/** Minimal shape of a CargoManagement record used to enrich a container. */
export interface CargoMgmtLike {
  id?: string | null
  containerNumber?: string | null
  eta?: string | Date | null
  status?: string | null
  shippingLine?: string | null
  location?: string | null
  referenceNo?: string | null
  departureDate?: string | Date | null
  clients?: Array<{
    companyId?: string | null
    cbm?: number | null
    company?: { id?: string; name?: string | null; company_id?: string | null } | null
  }> | null
}

export interface ContainerClient {
  key: string
  empresaId?: string | null
  empresaName?: string | null
  empresaCode?: string | null
  /** "CODE - NAME", or NAME, or "Sin empresa". */
  display: string
  shipmentCount: number
  totalCbm: number
}

export type ArrivalLevel = 'arrived' | 'imminent' | 'soon' | 'upcoming' | 'none'

export interface ContainerGroup {
  containerNumber: string
  /** CargoManagement record id, when this container is tracked there. */
  cargoId: string | null
  transportType?: TransportType | null
  shippingLine?: string | null
  location?: string | null
  status?: string | null
  statusLabel?: string | null
  referenceNo?: string | null
  eta: Date | null
  clients: ContainerClient[]
  clientCount: number
  shipmentCount: number
  totalCbm: number
  totalWeight: number
  flaggedCount: number
  dgCount: number
  /** Whole days from today until ETA (negative = past). null when no ETA. */
  daysToEta: number | null
  arrivalLevel: ArrivalLevel
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED_IN_WAREHOUSE: 'Recibido en Bodega',
  IN_TRANSIT: 'En tránsito',
  ARRIVED_PANAMA: 'Arribó a Panamá',
  READY_FOR_DELIVERY: 'Listo para Entrega',
}

const ARRIVED_STATUSES = new Set(['ARRIVED_PANAMA', 'READY_FOR_DELIVERY'])

export function statusLabel(status?: string | null): string | null {
  if (!status) return null
  return STATUS_LABELS[status] ?? status
}

/** Visual config per arrival-alert level, for chips/badges in the UI. */
export const ARRIVAL_CONFIG: Record<
  ArrivalLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  arrived: { label: 'Arribado', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  imminent: { label: 'Llega pronto', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  soon: { label: 'Próxima llegada', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  upcoming: { label: 'En camino', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  none: { label: 'Sin ETA', color: '#78716C', bg: '#F5F5F4', border: '#E7E5E4' },
}

function norm(v?: string | null): string {
  return (v ?? '').trim().toLowerCase()
}

function toDate(v?: string | Date | null): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function classifyArrival(
  eta: Date | null,
  status: string | null | undefined,
  now: Date
): { level: ArrivalLevel; days: number | null } {
  const days = eta
    ? Math.round((startOfDay(eta) - startOfDay(now)) / 86400000)
    : null
  if (status && ARRIVED_STATUSES.has(status)) return { level: 'arrived', days }
  if (days === null) return { level: 'none', days }
  if (days < 0) return { level: 'arrived', days }
  if (days <= 2) return { level: 'imminent', days }
  if (days <= 7) return { level: 'soon', days }
  return { level: 'upcoming', days }
}

const ARRIVAL_ORDER: Record<ArrivalLevel, number> = {
  imminent: 0,
  soon: 1,
  upcoming: 2,
  arrived: 3,
  none: 4,
}

/**
 * Group FCL shipments by container number, rolling up the clients (companies)
 * whose cargo is inside each container and enriching with ETA/status/naviera
 * from CargoManagement. Shipments without a container number are skipped.
 */
export function buildContainerGroups(
  fcls: FclLike[],
  cargos: CargoMgmtLike[] = [],
  now: Date = new Date()
): ContainerGroup[] {
  // Index cargo-management by container number; prefer a record that has an ETA.
  const cargoByContainer = new Map<string, CargoMgmtLike>()
  for (const c of cargos) {
    const key = norm(c.containerNumber)
    if (!key) continue
    const existing = cargoByContainer.get(key)
    if (!existing || (!existing.eta && c.eta)) cargoByContainer.set(key, c)
  }

  type WorkingGroup = ContainerGroup & { _clients: Map<string, ContainerClient> }
  const groups = new Map<string, WorkingGroup>()

  const newGroup = (cn: string, transportType: TransportType | null): WorkingGroup => ({
    containerNumber: cn,
    cargoId: null,
    transportType,
    shippingLine: null,
    location: null,
    status: null,
    statusLabel: null,
    referenceNo: null,
    eta: null,
    clients: [],
    clientCount: 0,
    shipmentCount: 0,
    totalCbm: 0,
    totalWeight: 0,
    flaggedCount: 0,
    dgCount: 0,
    daysToEta: null,
    arrivalLevel: 'none',
    _clients: new Map(),
  })

  for (const f of fcls) {
    const cn = (f.containerNumber ?? '').trim()
    if (!cn) continue
    const key = cn.toLowerCase()

    let g = groups.get(key)
    if (!g) {
      g = newGroup(cn, f.transportType ?? null)
      groups.set(key, g)
    }

    g.shipmentCount += 1
    g.totalCbm += f.totalCbm || 0
    g.totalWeight += f.totalWeight || 0
    if (f.misidentified) g.flaggedCount += 1
    if (f.dangerousGoods) g.dgCount += 1
    if (!g.transportType && f.transportType) g.transportType = f.transportType

    const clientKey = f.empresaId || norm(f.empresaName) || '—'
    const display = f.empresaCode && f.empresaName
      ? `${f.empresaCode} - ${f.empresaName}`
      : f.empresaName || 'Sin empresa'
    let client = g._clients.get(clientKey)
    if (!client) {
      client = {
        key: clientKey,
        empresaId: f.empresaId ?? null,
        empresaName: f.empresaName ?? null,
        empresaCode: f.empresaCode ?? null,
        display,
        shipmentCount: 0,
        totalCbm: 0,
      }
      g._clients.set(clientKey, client)
    }
    client.shipmentCount += 1
    client.totalCbm += f.totalCbm || 0
  }

  // Seed groups for containers that only exist in CargoManagement (warehouse/
  // transit tracking) and have no FCL cargo linked yet — so every tracked
  // container still shows up with its ETA/status and arrival alert.
  for (const c of cargos) {
    const cn = (c.containerNumber ?? '').trim()
    if (!cn) continue
    const key = cn.toLowerCase()
    if (!groups.has(key)) groups.set(key, newGroup(cn, null))
  }

  const result: ContainerGroup[] = []
  for (const g of groups.values()) {
    const cargo = cargoByContainer.get(g.containerNumber.toLowerCase())
    if (cargo) {
      g.cargoId = cargo.id ?? null
      g.eta = toDate(cargo.eta)
      g.status = cargo.status ?? null
      g.statusLabel = statusLabel(cargo.status)
      g.shippingLine = cargo.shippingLine ?? null
      g.location = cargo.location ?? null
      g.referenceNo = cargo.referenceNo ?? null

      // Merge clients assigned directly on the container (CargoManagement) with
      // any derived from FCL cargo — dedupe by company id.
      for (const cc of cargo.clients ?? []) {
        const id = cc.company?.id || cc.companyId || norm(cc.company?.name)
        if (!id) continue
        let client = g._clients.get(id)
        if (!client) {
          const name = cc.company?.name ?? null
          const code = cc.company?.company_id ?? null
          client = {
            key: id,
            empresaId: cc.companyId ?? cc.company?.id ?? null,
            empresaName: name,
            empresaCode: code,
            display: code && name ? `${code} - ${name}` : name || 'Sin empresa',
            shipmentCount: 0,
            totalCbm: 0,
          }
          g._clients.set(id, client)
        }
        if (cc.cbm) client.totalCbm += cc.cbm
      }
    }
    const { level, days } = classifyArrival(g.eta, g.status, now)
    g.arrivalLevel = level
    g.daysToEta = days

    g.clients = Array.from(g._clients.values()).sort(
      (a, b) => b.totalCbm - a.totalCbm || a.display.localeCompare(b.display)
    )
    g.clientCount = g.clients.length

    const { _clients, ...clean } = g
    result.push(clean)
  }

  return sortContainerGroups(result)
}

/** Sort by arrival urgency, then soonest ETA, then container number. */
export function sortContainerGroups(groups: ContainerGroup[]): ContainerGroup[] {
  return [...groups].sort((a, b) => {
    const ao = ARRIVAL_ORDER[a.arrivalLevel]
    const bo = ARRIVAL_ORDER[b.arrivalLevel]
    if (ao !== bo) return ao - bo
    const ae = a.eta ? a.eta.getTime() : Infinity
    const be = b.eta ? b.eta.getTime() : Infinity
    if (ae !== be) return ae - be
    return a.containerNumber.localeCompare(b.containerNumber)
  })
}

/** Short human label for days-to-arrival, e.g. "Hoy", "Mañana", "en 4 días". */
export function arrivalCountdown(group: ContainerGroup): string | null {
  if (group.arrivalLevel === 'arrived') return 'Arribado'
  if (group.daysToEta === null) return null
  const d = group.daysToEta
  if (d <= 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  return `en ${d} días`
}
