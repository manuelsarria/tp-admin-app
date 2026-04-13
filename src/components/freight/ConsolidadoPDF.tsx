import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

export interface LclContainerWithBookings {
  id: string
  mblNumber: string
  containerNumber?: string | null
  seal?: string | null
  vessel?: string | null
  voyage?: string | null
  portOfLoading: string
  portOfDischarge: string
  etd?: Date | string | null
  eta?: Date | string | null
  closingDate?: Date | string | null
  status: string
  notes?: string | null
  createdAt: Date | string
  bookings: Array<{
    id: string
    hblNumber: string
    shipperName: string
    clientName: string
    description?: string | null
    packages: number
    packageType: string
    grossWeightKg?: number | null
    cbm?: number | null
    status: string
  }>
}

interface Props {
  container: LclContainerWithBookings
  qrBase64: string
  logoBase64: string | null
}

const RED = '#FACC15'
const DARK = '#0F172A'
const GRAY = '#64748B'
const BORDER = '#CBD5E1'
const LIGHT_BG = '#F8FAFC'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  LOADING: 'En Carga',
  CLOSED: 'Cerrado',
  IN_TRANSIT: 'En Tránsito',
  ARRIVED: 'Llegó a Panamá',
  COMPLETED: 'Completado',
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_WAREHOUSE: 'En Bodega',
  ASSIGNED: 'Asignado',
  SHIPPED: 'Embarcado',
  ARRIVED: 'Llegó',
  DELIVERED: 'Entregado',
}

const fmtDate = (d: Date | string | null | undefined) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: DARK,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottom: `2pt solid ${RED}`,
    paddingBottom: 8,
  },
  logo: { width: 110, height: 30, objectFit: 'contain' },
  headerCenter: { flex: 1, alignItems: 'center' },
  titleBig: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: RED },
  titleSub: { fontSize: 9, color: GRAY, marginTop: 2 },
  mblText: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK, marginTop: 3 },
  headerRight: { alignItems: 'center', width: 80 },
  qrImg: { width: 70, height: 70 },
  qrLabel: { fontSize: 7, color: GRAY, marginTop: 2, textAlign: 'center' },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    border: `1pt solid ${BORDER}`,
    marginBottom: 10,
  },
  infoCell: {
    width: '33.33%',
    padding: '5pt 8pt',
    borderRight: `1pt solid ${BORDER}`,
    borderBottom: `1pt solid ${BORDER}`,
  },
  infoLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: GRAY, textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 8.5, color: DARK },
  infoValueBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: DARK },
  // Summary cards
  summaryRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    border: `1pt solid ${BORDER}`,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  summaryNum: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: RED },
  summaryLabel: { fontSize: 7, color: GRAY, marginTop: 2, textAlign: 'center' },
  // Table
  tableTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 },
  tableWrapper: { border: `1pt solid ${BORDER}` },
  tableHeader: { flexDirection: 'row', backgroundColor: RED },
  th: { padding: '4pt 5pt', color: '#fff', fontSize: 6.5, fontFamily: 'Helvetica-Bold', borderRight: '1pt solid rgba(255,255,255,0.3)' },
  tableRow: { flexDirection: 'row', borderBottom: `1pt solid ${BORDER}`, backgroundColor: '#fff' },
  tableRowAlt: { flexDirection: 'row', borderBottom: `1pt solid ${BORDER}`, backgroundColor: LIGHT_BG },
  td: { padding: '4pt 5pt', fontSize: 7.5, borderRight: `1pt solid ${BORDER}` },
  totalsRow: { flexDirection: 'row', backgroundColor: '#FDECEA', borderTop: `2pt solid ${RED}` },
  totTd: { padding: '4pt 5pt', fontSize: 8, fontFamily: 'Helvetica-Bold', borderRight: `1pt solid ${BORDER}` },
  // Footer
  footer: { marginTop: 16, borderTop: `1pt solid ${BORDER}`, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: GRAY },
})

export function ConsolidadoPDF({ container, qrBase64, logoBase64 }: Props) {
  const totalPackages = container.bookings.reduce((s, b) => s + b.packages, 0)
  const totalWeight = container.bookings.reduce((s, b) => s + (b.grossWeightKg ?? 0), 0)
  const totalCbm = container.bookings.reduce((s, b) => s + (b.cbm ?? 0), 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View style={{ width: 120 }}>
            {logoBase64 ? (
              <Image src={logoBase64} style={s.logo} />
            ) : (
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: RED }}>TP LOGISTICS</Text>
            )}
            <Text style={{ fontSize: 6.5, color: GRAY, marginTop: 3 }}>155715816-2-2021 DV36</Text>
            <Text style={{ fontSize: 6.5, color: GRAY }}>Panama, Plaza Mundial Local D2</Text>
            <Text style={{ fontSize: 6.5, color: GRAY }}>Tel: +507 6377-7906</Text>
          </View>
          <View style={s.headerCenter}>
            <Text style={s.titleBig}>CARGO CONSOLIDADO</Text>
            <Text style={s.titleSub}>Master Bill of Lading Summary</Text>
            <Text style={s.mblText}>{container.mblNumber}</Text>
          </View>
          <View style={s.headerRight}>
            <Image src={qrBase64} style={s.qrImg} />
            <Text style={s.qrLabel}>{container.mblNumber}</Text>
          </View>
        </View>

        {/* ── Container Info ── */}
        <View style={s.infoGrid}>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>MBL Number</Text>
            <Text style={s.infoValueBold}>{container.mblNumber}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Container #</Text>
            <Text style={s.infoValue}>{container.containerNumber || '—'}</Text>
          </View>
          <View style={[s.infoCell, { borderRight: 0 }]}>
            <Text style={s.infoLabel}>Estado</Text>
            <Text style={s.infoValueBold}>{STATUS_LABELS[container.status] || container.status}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Vessel</Text>
            <Text style={s.infoValue}>{container.vessel || '—'}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Voyage</Text>
            <Text style={s.infoValue}>{container.voyage || '—'}</Text>
          </View>
          <View style={[s.infoCell, { borderRight: 0 }]}>
            <Text style={s.infoLabel}>Seal</Text>
            <Text style={s.infoValue}>{container.seal || '—'}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Port of Loading</Text>
            <Text style={s.infoValue}>{container.portOfLoading}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Port of Discharge</Text>
            <Text style={s.infoValue}>{container.portOfDischarge}</Text>
          </View>
          <View style={[s.infoCell, { borderRight: 0 }]}>
            <Text style={s.infoLabel}>Closing Date</Text>
            <Text style={s.infoValue}>{fmtDate(container.closingDate)}</Text>
          </View>
          <View style={[s.infoCell, { borderBottom: 0 }]}>
            <Text style={s.infoLabel}>ETD</Text>
            <Text style={s.infoValueBold}>{fmtDate(container.etd)}</Text>
          </View>
          <View style={[s.infoCell, { borderBottom: 0 }]}>
            <Text style={s.infoLabel}>ETA</Text>
            <Text style={s.infoValueBold}>{fmtDate(container.eta)}</Text>
          </View>
          <View style={[s.infoCell, { borderRight: 0, borderBottom: 0 }]}>
            <Text style={s.infoLabel}>Fecha Elaboración</Text>
            <Text style={s.infoValue}>{fmtDate(container.createdAt)}</Text>
          </View>
        </View>

        {/* ── Summary Cards ── */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{container.bookings.length}</Text>
            <Text style={s.summaryLabel}>Bookings / HBLs</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{totalPackages}</Text>
            <Text style={s.summaryLabel}>Total Piezas</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{totalWeight.toFixed(1)}</Text>
            <Text style={s.summaryLabel}>Peso Total (KGS)</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{totalCbm.toFixed(3)}</Text>
            <Text style={s.summaryLabel}>Volumen Total (CBM)</Text>
          </View>
        </View>

        {/* ── Bookings Table ── */}
        <Text style={s.tableTitle}>Detalle de Bookings</Text>
        <View style={s.tableWrapper}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { flex: 0.9 }]}>HBL #</Text>
            <Text style={[s.th, { flex: 1 }]}>Shipper</Text>
            <Text style={[s.th, { flex: 1 }]}>Cliente</Text>
            <Text style={[s.th, { flex: 1.5 }]}>Descripción</Text>
            <Text style={[s.th, { flex: 0.4 }]}>Pkgs</Text>
            <Text style={[s.th, { flex: 0.6 }]}>Peso KGS</Text>
            <Text style={[s.th, { flex: 0.5 }]}>CBM</Text>
            <Text style={[s.th, { flex: 0.7, borderRight: 0 }]}>Estado</Text>
          </View>

          {container.bookings.map((b, i) => (
            <View key={b.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.td, { flex: 0.9, fontFamily: 'Helvetica-Bold', color: RED }]}>{b.hblNumber}</Text>
              <Text style={[s.td, { flex: 1 }]}>{b.shipperName}</Text>
              <Text style={[s.td, { flex: 1 }]}>{b.clientName}</Text>
              <Text style={[s.td, { flex: 1.5, color: GRAY }]}>{b.description || '—'}</Text>
              <Text style={[s.td, { flex: 0.4, textAlign: 'center' }]}>{b.packages} {b.packageType}</Text>
              <Text style={[s.td, { flex: 0.6, textAlign: 'right' }]}>
                {b.grossWeightKg != null ? b.grossWeightKg.toFixed(2) : '—'}
              </Text>
              <Text style={[s.td, { flex: 0.5, textAlign: 'right' }]}>
                {b.cbm != null ? b.cbm.toFixed(3) : '—'}
              </Text>
              <Text style={[s.td, { flex: 0.7, borderRight: 0 }]}>
                {BOOKING_STATUS_LABELS[b.status] || b.status}
              </Text>
            </View>
          ))}

          {/* Totals row */}
          <View style={s.totalsRow}>
            <Text style={[s.totTd, { flex: 0.9 }]}>TOTALES</Text>
            <Text style={[s.totTd, { flex: 1 }]}> </Text>
            <Text style={[s.totTd, { flex: 1 }]}> </Text>
            <Text style={[s.totTd, { flex: 1.5 }]}>{container.bookings.length} HBL(s)</Text>
            <Text style={[s.totTd, { flex: 0.4, textAlign: 'center' }]}>{totalPackages}</Text>
            <Text style={[s.totTd, { flex: 0.6, textAlign: 'right' }]}>{totalWeight.toFixed(2)}</Text>
            <Text style={[s.totTd, { flex: 0.5, textAlign: 'right' }]}>{totalCbm.toFixed(3)}</Text>
            <Text style={[s.totTd, { flex: 0.7, borderRight: 0 }]}> </Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>TP Logistics · 155715816-2-2021 DV36 · Panama</Text>
          <Text style={[s.footerText, { fontFamily: 'Helvetica-Bold' }]}>{container.mblNumber}</Text>
          <Text style={s.footerText}>www.chinacarga.com | import@tplogist.com</Text>
        </View>
      </Page>
    </Document>
  )
}
