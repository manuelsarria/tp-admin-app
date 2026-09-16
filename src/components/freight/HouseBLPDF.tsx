import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { defaultForwardingAgent } from '@/lib/hblDefaults'

export interface LclBookingCargoItemForPDF {
  hsCode?: string | null
  description: string
  packages: number
  packageType?: string | null
  grossWeightKg?: number | null
  cbm?: number | null
  marks?: string | null
}

export interface LclBookingForPDF {
  id: string
  hblNumber: string
  shipperName: string
  shipperAddress?: string | null
  clientName: string
  clientAddress?: string | null
  clientRuc?: string | null
  clientDv?: string | null
  clientEmail?: string | null
  notifyParty?: string | null
  notifyAddress?: string | null
  notifyRuc?: string | null
  notifyDv?: string | null
  notifyEmail?: string | null
  notifyPhone?: string | null
  forwardingAgent?: string | null
  origin?: string | null
  portOfLoading: string
  portOfDischarge: string
  placeOfReceipt?: string | null
  placeOfDelivery?: string | null
  preCarriageBy?: string | null
  vessel?: string | null
  voyage?: string | null
  description?: string | null
  marks?: string | null
  packages: number
  packageType: string
  grossWeightKg?: number | null
  cbm?: number | null
  hsCode?: string | null
  freightTerms: string
  freightAmount?: number | null
  freightCurrency: string
  freightDesc?: string | null
  exportReference?: string | null
  documentNumber?: string | null
  blDate?: Date | string | null
  createdAt: Date | string
  omitQr?: boolean
  groupedCargo?: boolean
  cargoItems?: LclBookingCargoItemForPDF[]
  lclContainer?: {
    containerNumber?: string | null
    containerType?: string | null
    seal?: string | null
    etd?: Date | string | null
  } | null
}

interface ApprovalInfo {
  approved: boolean
  selloBase64: string | null
  authorizedBy: string
  authCode: string
  pickupWarehouse?: string | null
}

export interface StampForPDF {
  src: string // data URL (base64) de la imagen del sello
  style: Record<string, any> // estilo de posición absoluta (de anchorToStyle)
}

interface Props {
  booking: LclBookingForPDF
  logoBase64: string | null
  qrBase64?: string | null
  approval?: ApprovalInfo | null
  stamps?: StampForPDF[]
  /// true solo si NotoSansSC se registró; si no, el texto va en la fuente base
  /// y los caracteres chinos salen como cuadritos — pero el PDF sale.
  cjkFont?: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

// Número entero → palabras en inglés (mayúsculas), estilo BL: "ONE HUNDRED AND
// TWELVE". Se usa para la línea "SAY ... ONLY" (total de bultos en letras),
// práctica estándar anti-fraude en los Bills of Lading.
const ONES = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT',
  'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
const SCALES = ['', ' THOUSAND', ' MILLION', ' BILLION']

const threeDigitsToWords = (n: number): string => {
  let str = ''
  const h = Math.floor(n / 100)
  const rest = n % 100
  if (h) str += `${ONES[h]} HUNDRED`
  if (rest) {
    if (str) str += ' AND '
    if (rest < 20) str += ONES[rest]
    else {
      str += TENS[Math.floor(rest / 10)]
      if (rest % 10) str += `-${ONES[rest % 10]}`
    }
  }
  return str
}

const numberToWords = (value: number): string => {
  let n = Math.floor(Math.abs(value))
  if (n === 0) return 'ZERO'
  const groups: number[] = []
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000) }
  let str = ''
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue
    str += (str ? ' ' : '') + threeDigitsToWords(groups[i]) + SCALES[i]
  }
  return str.trim()
}

// Abreviaturas de tipo de bulto → palabra plural para la línea "SAY ... ONLY".
const PKG_WORDS: Record<string, string> = {
  CTNS: 'CARTONS', CTN: 'CARTONS', CARTON: 'CARTONS', CARTONS: 'CARTONS',
  PKG: 'PACKAGES', PKGS: 'PACKAGES', PACKAGE: 'PACKAGES', PACKAGES: 'PACKAGES',
  PLT: 'PALLETS', PLTS: 'PALLETS', PALLET: 'PALLETS', PALLETS: 'PALLETS',
  BOX: 'BOXES', BOXES: 'BOXES', UNIT: 'UNITS', UNITS: 'UNITS',
  BAG: 'BAGS', BAGS: 'BAGS', ROLL: 'ROLLS', ROLLS: 'ROLLS',
}

const B  = '1pt solid #000'   // standard cell border
const B2 = '1.5pt solid #000' // outer / section border

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#000',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFF',
  },

  // ─ Header ─
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 3,
  },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold' },
  blTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  originalBar: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    borderTop: B2,
    borderBottom: B2,
    paddingVertical: 2,
    marginBottom: 0,
  },

  // ─ Cell primitives ─
  // Los LABELS son el formulario pre-impreso (Helvetica). Los VALORES (lo que se
  // ingresa) van en Courier para el look de máquina de escribir típico de los BL
  // de logística. Courier es más ancho, por eso los tamaños bajan un poco.
  lbl: { fontSize: 5.5, lineHeight: 1.2, marginBottom: 2 },
  val: { fontSize: 7, fontFamily: 'Courier', lineHeight: 1.35 },
  valBold: { fontSize: 7.5, fontFamily: 'Courier-Bold', lineHeight: 1.35 },
  valBig: { fontSize: 10, fontFamily: 'Courier-Bold' },

  // ─ Cargo table ─
  thCell: { fontSize: 6, fontFamily: 'Helvetica-Bold', padding: '3pt 3pt' },
  tdCell: { fontSize: 7, fontFamily: 'Courier', padding: '3pt 3pt', lineHeight: 1.3 },

  // Estilo de texto con glifos CJK. NotoSansSC se registra en tiempo de
  // ejecución (ver lib/pdf/renderHbl). Ojo: @react-pdf NO cae a Helvetica
  // cuando la familia no está registrada — lanza "Font family not registered"
  // y se cae el PDF entero, no solo los caracteres chinos. Por eso el estilo
  // solo se aplica si la fuente llegó a registrarse (`cjkFont`).
  cjkText: { fontFamily: 'NotoSansSC' },
})

// ── Sub-components ────────────────────────────────────────────────────────────

/** Generic cell with optional label + value */
const Cell = ({
  label,
  value,
  style,
  valStyle,
  big,
  children,
}: {
  label?: string
  value?: string | null
  style?: any
  valStyle?: any
  big?: boolean
  children?: React.ReactNode
}) => (
  <View style={[{ padding: '3pt 4pt' }, style]}>
    {label ? <Text style={s.lbl}>{label}</Text> : null}
    {value !== undefined ? (
      <Text style={[big ? s.valBig : s.val, valStyle]}>{value ?? ''}</Text>
    ) : null}
    {children}
  </View>
)

// ── Component ─────────────────────────────────────────────────────────────────

export function HouseBLPDF({ booking, logoBase64, qrBase64, approval, stamps, cjkFont }: Props) {
  // Objeto vacío, no undefined: el arreglo de estilos de @react-pdf no lo acepta.
  const cjk = cjkFont ? s.cjkText : {}
  const date     = fmtDate(booking.blDate || booking.createdAt)
  const isPrepaid = booking.freightTerms !== 'COLLECT'

  // Build the cargo rows shown in the table. Prefer the explicit per-line
  // cargoItems when present; otherwise fall back to a single synthetic row
  // built from the booking-level legacy fields (keeps old HBLs rendering).
  const cargoRows: LclBookingCargoItemForPDF[] =
    booking.cargoItems && booking.cargoItems.length > 0
      ? booking.cargoItems
      : [{
          hsCode: booking.hsCode ?? null,
          description: booking.description ?? '',
          packages: booking.packages,
          packageType: booking.packageType,
          grossWeightKg: booking.grossWeightKg ?? null,
          cbm: booking.cbm ?? null,
          marks: null,
        }]

  const grouped = !!booking.groupedCargo
  const sumPackages = cargoRows.reduce((s, r) => s + (Number(r.packages) || 0), 0)
  const sumWeight   = cargoRows.reduce((s, r) => s + (Number(r.grossWeightKg) || 0), 0)
  const sumCbm      = cargoRows.reduce((s, r) => s + (Number(r.cbm) || 0), 0)
  // En modo agrupado mandan los totales que viene del formulario (booking-level);
  // si no, se derivan sumando las lineas y caen al booking-level como respaldo.
  const totalPackages = grouped ? (booking.packages || sumPackages) : (sumPackages || booking.packages)
  const totalWeight   = grouped ? (booking.grossWeightKg ?? sumWeight) : (sumWeight || (booking.grossWeightKg ?? 0))
  const totalCbm      = grouped ? (booking.cbm ?? sumCbm) : (sumCbm || (booking.cbm ?? 0))

  const weightTotalLine = totalWeight ? `${totalWeight.toFixed(2)} Kgs` : ''
  const measTotalLine   = totalCbm    ? `${totalCbm.toFixed(2)} Cbm`   : ''

  // Línea "SAY ... ONLY": total de bultos en letras (anti-fraude, estándar BL).
  // El tipo de bulto se toma de las líneas de carga; si hay varios distintos,
  // se generaliza a PACKAGES.
  const pkgTypes = Array.from(
    new Set(cargoRows.map(r => (r.packageType || booking.packageType || '').trim().toUpperCase()).filter(Boolean))
  )
  const rawPkgType = pkgTypes.length === 1 ? pkgTypes[0] : 'PACKAGES'
  const pkgWord = PKG_WORDS[rawPkgType] || rawPkgType || 'PACKAGES'
  const sayLine = totalPackages
    ? `SAY ${numberToWords(totalPackages)} (${totalPackages}) ${pkgWord} ONLY`
    : ''

  const containerNumber = booking.lclContainer?.containerNumber || ''
  const containerType = booking.lclContainer?.containerType || ''
  const etd = booking.lclContainer?.etd ? fmtDate(booking.lclContainer.etd) : ''

  // Línea de RUC + DV (formato "RUC: X  DV YY")
  const rucLine = (ruc?: string | null, dv?: string | null) =>
    ruc || dv ? `RUC: ${ruc || ''}${dv ? `  DV ${dv}` : ''}` : null

  const consigneeText = [
    booking.clientName,
    booking.clientAddress,
    rucLine(booking.clientRuc, booking.clientDv),
    booking.clientEmail ? `Email: ${booking.clientEmail}` : null,
  ].filter(Boolean).join('\n')

  const notifyText = [
    booking.notifyParty || booking.clientName,
    booking.notifyAddress,
    rucLine(booking.notifyRuc, booking.notifyDv),
    booking.notifyEmail ? `Email: ${booking.notifyEmail}` : null,
    booking.notifyPhone ? `Tel: ${booking.notifyPhone}` : null,
  ].filter(Boolean).join('\n')

  const forwardingAgentText = booking.forwardingAgent || defaultForwardingAgent(booking.origin)

  // Marks & Numbers por defecto (cuando no se escriben marcas manuales):
  // "<contenedor> / <seal> / <tipo>" + tipo de movimiento CFS-CFS (estándar LCL consolidado).
  const seal = booking.lclContainer?.seal || ''
  const marksDefault = [
    [containerNumber, seal, containerType].filter(Boolean).join(' / '),
    'CFS-CFS',
  ].filter(Boolean).join('\n')

  // Modo agrupado (estilo Master BL): una sola fila con todas las descripciones
  // unidas por " / " y unicamente los totales (sin desglose ni CBM por item).
  const groupedDescription = cargoRows
    .map(r => (r.description || '').split(/\r?\n/).map(t => t.trim()).filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' / ')
  const displayRows: LclBookingCargoItemForPDF[] = grouped
    ? [{
        hsCode: null,
        description: groupedDescription,
        packages: totalPackages,
        packageType: rawPkgType,
        grossWeightKg: totalWeight || null,
        cbm: totalCbm || null,
        marks: booking.marks || marksDefault,
      }]
    : cargoRows

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ══ PAGE HEADER ══ */}
        <View style={s.pageHeader}>
          {logoBase64 ? (
            <Image src={logoBase64} style={{ width: 110, height: 30, objectFit: 'contain' }} />
          ) : (
            <Text style={s.companyName}>TP LOGISTICS</Text>
          )}
          <Text style={s.blTitle}>BILL OF LADING</Text>
        </View>

        <Text style={s.originalBar}>ORIGINAL</Text>

        {/* ══ MAIN GRID (outer border) ══ */}
        <View style={{ border: B2 }}>

          {/* ── Row A: Cells 2/3/4 (left) + Cells 5/5a/6/7/8/9 (right) ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>

            {/* LEFT COLUMN — cells 2, 3, 4 stacked */}
            <View style={{ flex: 55, borderRight: B }}>

              {/* Cell 2 — Exporter */}
              <View style={{ borderBottom: B, minHeight: 52 }}>
                <Cell
                  label="2. EXPORTER (Principal or seller-licensee and address including ZIP Code)"
                  value={[booking.shipperName, booking.shipperAddress].filter(Boolean).join('\n')}
                />
              </View>

              {/* Cell 3 — Consigned To */}
              <View style={{ borderBottom: B, minHeight: 44 }}>
                <Cell
                  label="3. CONSIGNED TO"
                  value={consigneeText}
                />
              </View>

              {/* Cell 4 — Notify Party */}
              <View style={{ minHeight: 38 }}>
                <Cell
                  label="4. NOTIFY PARTY / INTERMEDIATE CONSIGNEE (Name and address)"
                  value={notifyText}
                />
              </View>

            </View>

            {/* RIGHT COLUMN — cells 5, 5a, 6, 7, 8, 9 */}
            <View style={{ flex: 45 }}>

              {/* Row: Cell 5 + Cell 5a (5a spans this row AND the row below) */}
              <View style={{ flexDirection: 'row', borderBottom: B }}>

                {/* Cell 5 top + Cell 6 below it (left 60% of right column) */}
                <View style={{ flex: 60, borderRight: B }}>
                  <View style={{ borderBottom: B, minHeight: 24 }}>
                    <Cell label="5. DOCUMENT NUMBER" value={booking.documentNumber || ''} />
                  </View>
                  <View style={{ minHeight: 22 }}>
                    <Cell label="6. EXPORT REFERENCES" value={booking.exportReference || ''} />
                  </View>
                </View>

                {/* Cell 5a — B/L Number + Date (right 40%, spanning both rows above) */}
                <View style={{ flex: 40, padding: '3pt 4pt' }}>
                  <Text style={s.lbl}>5a. B/L NUMBER</Text>
                  <Text style={[s.val, { fontFamily: 'Courier-Bold', fontSize: 8, marginBottom: 4 }]}>
                    {booking.hblNumber}
                  </Text>
                  <Text style={s.lbl}>DATE</Text>
                  <Text style={[s.val, { fontFamily: 'Courier-Bold', fontSize: 9 }]}>
                    {date}
                  </Text>
                </View>

              </View>

              {/* Cell 7 — Forwarding Agent (ocupa el alto restante de la columna,
                  evita que el texto multilínea se encime con la celda inferior) */}
              <View style={{ flex: 1, minHeight: 92 }}>
                <Cell
                  label="7. FORWARDING AGENT (Name and address - references)"
                  value={forwardingAgentText}
                />
              </View>

            </View>
          </View>

          {/* ── Row B: Cells 12 + 13 ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 25, borderRight: B, minHeight: 20 }}>
              <Cell label="12. PRE- CARRIAGE BY" value={booking.preCarriageBy || ''} />
            </View>
            <View style={{ flex: 75, minHeight: 20 }}>
              <Cell
                label="13. PLACE OF RECEIPT BY PRE-CARRIER"
                value={booking.placeOfReceipt || booking.portOfLoading}
                valStyle={{ fontFamily: 'Courier-Bold' }}
              />
            </View>
          </View>

          {/* ── Row C: Cells 14 (Vessel) + 15 + 10 ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 25, borderRight: B, minHeight: 20 }}>
              <Cell label="14. EXPORTING CARRIER" value={booking.vessel || ''} valStyle={{ fontFamily: 'Courier-Bold' }} />
            </View>
            <View style={{ flex: 40, borderRight: B, minHeight: 20 }}>
              <Cell label="15. PORT OF LOADING / EXPORT" value={booking.portOfLoading} valStyle={{ fontFamily: 'Courier-Bold' }} />
            </View>
            <View style={{ flex: 35, minHeight: 20 }}>
              <Cell label="10. LOADING PIER / TERMINAL" value="" />
            </View>
          </View>

          {/* ── Row D: Cells 16 + 17 + 11 + VOYAGE ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 25, borderRight: B, minHeight: 20 }}>
              <Cell label="16. FOREIGN PORT OF UNLOADING" value={booking.portOfDischarge} valStyle={{ fontFamily: 'Courier-Bold' }} />
            </View>
            <View style={{ flex: 40, borderRight: B, minHeight: 20 }}>
              <Cell label="17. PLACE OF DELIVERY BY PRE-CARRIER" value={booking.placeOfDelivery || booking.portOfDischarge} valStyle={{ fontFamily: 'Courier-Bold' }} />
            </View>
            <View style={{ flex: 20, borderRight: B, minHeight: 20 }}>
              <Cell label="11. TYPE OF MOVE" value="CFS-CFS" />
            </View>
            <View style={{ flex: 15, minHeight: 20 }}>
              <Cell
                label="VOYAGE"
                value={booking.voyage || ''}
                valStyle={{ fontFamily: 'Courier-Bold', fontSize: 7.5 }}
              />
            </View>
          </View>

          {/* ── Row E: Container Number + Container Type + ETD ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 35, borderRight: B, minHeight: 20 }}>
              <Cell label="CONTAINER NUMBER" value={containerNumber} valStyle={{ fontFamily: 'Courier-Bold' }} />
            </View>
            <View style={{ flex: 30, borderRight: B, minHeight: 20 }}>
              <Cell label="CONTAINER TYPE" value={containerType} valStyle={{ fontFamily: 'Courier-Bold' }} />
            </View>
            <View style={{ flex: 35, minHeight: 20 }}>
              <Cell label="FECHA DE ZARPE (ETD)" value={etd} valStyle={{ fontFamily: 'Courier-Bold' }} />
            </View>
          </View>

          {/* ── Cargo Table ── */}
          {/* Table Header */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 20, borderRight: B, padding: '2pt 3pt' }}>
              <Text style={[s.thCell, { textAlign: 'center' }]}>MARKS AND NUMBERS</Text>
              <Text style={[s.thCell, { textAlign: 'center', color: '#444' }]}>(18)</Text>
            </View>
            <View style={{ flex: 12, borderRight: B, padding: '2pt 3pt', alignItems: 'center' }}>
              <Text style={s.thCell}>NUMBER</Text>
              <Text style={s.thCell}>OF PACKAGES</Text>
              <Text style={[s.thCell, { color: '#444' }]}>(19)</Text>
            </View>
            <View style={{ flex: 38, borderRight: B, padding: '2pt 3pt' }}>
              <Text style={s.thCell}>
                DESCRIPTION OF COMMODITIES{' '}
                <Text style={{ fontFamily: 'Helvetica-Oblique' }}>in Schedule B detail</Text>
              </Text>
              <Text style={[s.thCell, { color: '#444' }]}>(20)</Text>
            </View>
            <View style={{ flex: 15, borderRight: B, padding: '2pt 3pt', alignItems: 'center' }}>
              <Text style={s.thCell}>GROSS WEIGHT</Text>
              <Text style={s.thCell}>(Kilos)</Text>
              <Text style={[s.thCell, { color: '#444' }]}>(21)</Text>
            </View>
            <View style={{ flex: 15, padding: '2pt 3pt', alignItems: 'center' }}>
              <Text style={s.thCell}>MEASUREMENT</Text>
              <Text style={[s.thCell, { color: '#444' }]}>(22)</Text>
            </View>
          </View>

          {/* Cargo content rows — one per cargo line item. The shared Marks
              column is rendered as a single tall cell on the first row only. */}
          {displayRows.map((row, idx) => {
            const isFirst = idx === 0
            const isLast  = idx === displayRows.length - 1
            const rowMarks = row.marks || (isFirst ? (booking.marks || marksDefault) : '')
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  borderBottom: isLast ? B : '0.5pt solid #999',
                  minHeight: displayRows.length === 1 ? 90 : 26,
                }}
              >
                <View style={{ flex: 20, borderRight: B, padding: '3pt 3pt' }}>
                  {isFirst ? (
                    <Text style={[s.tdCell, cjk]}>{rowMarks}</Text>
                  ) : null}
                </View>
                <View style={{ flex: 12, borderRight: B, padding: '3pt 3pt', alignItems: 'center' }}>
                  <Text style={[s.tdCell, { fontFamily: 'Courier-Bold', fontSize: 8 }]}>
                    {row.packages || ''}
                  </Text>
                  {row.packageType ? (
                    <Text style={[s.tdCell, { fontSize: 6, color: '#444' }]}>{row.packageType}</Text>
                  ) : null}
                </View>
                <View style={{ flex: 38, borderRight: B, padding: '3pt 3pt' }}>
                  {/* First line: description + HS code at the end (matches the
                      sample format: "涤纶围巾  polyster scarf  6214300000"). */}
                  {(() => {
                    const descLines = (row.description || '')
                      .split(/\r?\n/)
                      .filter(l => l.trim().length > 0)
                    const first = descLines.shift() || ''
                    const firstLine = [first, row.hsCode || ''].filter(Boolean).join('    ')
                    return (
                      <>
                        {firstLine ? (
                          <Text style={[s.tdCell, cjk]}>{firstLine}</Text>
                        ) : null}
                        {descLines.map((line, i) => (
                          <Text key={i} style={[s.tdCell, cjk, { marginTop: 1 }]}>
                            {line}
                          </Text>
                        ))}
                      </>
                    )
                  })()}
                </View>
                <View style={{ flex: 15, borderRight: B, padding: '3pt 3pt', alignItems: 'flex-end' }}>
                  <Text style={s.tdCell}>
                    {row.grossWeightKg != null ? `${row.grossWeightKg.toFixed(2)} Kgs` : ''}
                  </Text>
                </View>
                <View style={{ flex: 15, padding: '3pt 3pt', alignItems: 'flex-end' }}>
                  <Text style={s.tdCell}>
                    {row.cbm != null ? `${row.cbm.toFixed(2)} Cbm` : ''}
                  </Text>
                </View>
              </View>
            )
          })}

          {/* TOTALS row */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 20, borderRight: B, padding: '3pt 3pt', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5 }}>TOTALS:</Text>
            </View>
            <View style={{ flex: 12, borderRight: B, padding: '3pt 3pt', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Courier-Bold', fontSize: 8 }}>{totalPackages}</Text>
            </View>
            <View style={{ flex: 38, borderRight: B, padding: '3pt 3pt' }} />
            <View style={{ flex: 15, borderRight: B, padding: '3pt 3pt', alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Courier-Bold', fontSize: 7 }}>{weightTotalLine}</Text>
            </View>
            <View style={{ flex: 15, padding: '3pt 3pt', alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Courier-Bold', fontSize: 7 }}>{measTotalLine}</Text>
            </View>
          </View>

          {/* "SAY ... ONLY": total de bultos en letras (estándar BL) */}
          {sayLine ? (
            <View style={{ borderBottom: B, padding: '3pt 5pt' }}>
              <Text style={{ fontFamily: 'Courier-Bold', fontSize: 7.5 }}>{sayLine}</Text>
            </View>
          ) : null}

          {/* ── Pre-footer legal text ── */}
          <View style={{ borderBottom: B, padding: '3pt 4pt' }}>
            <Text style={{ fontSize: 5.5, lineHeight: 1.4 }}>
              Carrier has a policy payment, solicitation, or receipt of any rebate, directly or indirectly, which would be unlawful under the United State Shipping Act: 1984 as amended.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', borderBottom: B, padding: '2pt 4pt' }}>
            <Text style={{ fontSize: 6 }}>DECLARED VALUE</Text>
            <Text style={{ fontSize: 6, marginLeft: 12 }}>0,00</Text>
            <Text style={{ fontSize: 6, marginLeft: 20 }}>
              READ CLAUSE 29 HEREOF CONCERNING EXTRA FREIGHT AND CARRIER'S LIMITATIONS OF LIABILITY.
            </Text>
          </View>

          {/* ── Footer: Freight Rates (left) + Received (right) ── */}
          <View style={{ flexDirection: 'row', minHeight: 100 }}>

            {/* LEFT — Freight Rates table */}
            <View style={{ flex: 45, borderRight: B, padding: '3pt 4pt' }}>
              <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 3 }}>
                FREIGHT RATES, CHARGES, WEIGHT  AND / OR MEASUREMENTS
              </Text>
              {/* Table header */}
              <View style={{ flexDirection: 'row', borderTop: B, borderBottom: B }}>
                <Text style={{ flex: 2, fontSize: 6, fontFamily: 'Helvetica-Bold', padding: '2pt 3pt', borderRight: B, textAlign: 'center' }}>
                  SUBJECT TO CORRECTION
                </Text>
                <Text style={{ flex: 1, fontSize: 6, fontFamily: 'Helvetica-Bold', padding: '2pt 3pt', borderRight: B, textAlign: 'center' }}>
                  PREPAID
                </Text>
                <Text style={{ flex: 1, fontSize: 6, fontFamily: 'Helvetica-Bold', padding: '2pt 3pt', textAlign: 'center' }}>
                  COLLECT
                </Text>
              </View>
              {/* Freight row */}
              <View style={{ flexDirection: 'row', borderBottom: B }}>
                <Text style={{ flex: 2, fontSize: 7, fontFamily: 'Courier', padding: '2pt 3pt', borderRight: B }}>
                  {booking.freightDesc || 'FLETE MARITIMO'}
                </Text>
                <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Courier-Bold', padding: '2pt 3pt', borderRight: B, textAlign: 'center' }}>
                  {isPrepaid && booking.freightAmount
                    ? `${booking.freightAmount.toFixed(0)}${booking.freightCurrency}`
                    : ''}
                </Text>
                <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Courier-Bold', padding: '2pt 3pt', textAlign: 'center' }}>
                  {!isPrepaid && booking.freightAmount
                    ? `${booking.freightAmount.toFixed(0)}${booking.freightCurrency}`
                    : ''}
                </Text>
              </View>
            </View>

            {/* RIGHT — Received clause */}
            <View style={{ flex: 55, padding: '3pt 4pt' }}>
              <Text style={{ fontSize: 5.8, lineHeight: 1.45 }}>
                RECEIVED, by the Carrier as described on the reverse hereof (hereinafter called the Carrier) from the above named shipper, the goods, or packages said to contain goods, hereinabove described, in apparent good order and condition unless otherwise noted hereon, to be held and transported subject to all written, typed, printed or stamped provisions of this bill of lading, on this and on the reverse side hereof, to the port or place of discharge named above or so near thereunto as the ship can always safely get and leave always afloat at all stages and conditions of water and weather and there to be delivered or transshipped on payment of the charges hereon.
              </Text>

              {/* Dated + Original + Signature + QR */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, borderTop: B, paddingTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 6 }}>DATED AT:</Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Courier-Bold' }}>{date}</Text>
                  <Text style={{ fontSize: 6, marginTop: 4 }}>SIGNED ON BEHALF OF CARRIER:</Text>
                  <Text style={{ fontSize: 6, marginTop: 4 }}>By:</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>TP LOGISTICS</Text>
                </View>
                {qrBase64 && (
                  <View style={{ alignItems: 'center', marginRight: 8 }}>
                    <Image src={qrBase64} style={{ width: 58, height: 58 }} />
                    <Text style={{ fontSize: 4.5, color: '#666', marginTop: 1, textAlign: 'center' }}>Escanear para validar</Text>
                  </View>
                )}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}>ORIGINAL</Text>
                </View>
              </View>

              {/* Page footer inside box */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTop: B, paddingTop: 3 }}>
                <Text style={{ fontSize: 6 }}>Page 1 of 1</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text style={{ fontSize: 6 }}>B/L No.</Text>
                  <Text style={{ fontSize: 6, fontFamily: 'Courier-Bold' }}>{booking.hblNumber}</Text>
                </View>
              </View>
            </View>

          </View>
        </View>

        {/* ══ AUTHORIZATION STAMP (only when approved) ══ */}
        {approval?.approved && (
          <View style={{
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1.5pt solid #C41E3A',
            borderRadius: 4,
            padding: '6pt 10pt',
          }}>
            {/* Left: Auth code + info */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 5.5, color: '#999', marginBottom: 2 }}>CÓDIGO DE AUTORIZACIÓN</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#C41E3A', letterSpacing: 1.5, marginBottom: 4 }}>
                {approval.authCode}
              </Text>
              <Text style={{ fontSize: 6.5, color: '#333' }}>
                Autorizado por: <Text style={{ fontFamily: 'Courier-Bold' }}>{approval.authorizedBy}</Text>
              </Text>
              {approval.pickupWarehouse && (
                <Text style={{ fontSize: 6, color: '#666', marginTop: 2 }}>
                  Bodega: {approval.pickupWarehouse}
                </Text>
              )}
            </View>

            {/* Right: Stamp image */}
            {approval.selloBase64 && (
              <View style={{ alignItems: 'center' }}>
                <Image src={approval.selloBase64} style={{ width: 72, height: 72, objectFit: 'contain' }} />
              </View>
            )}
          </View>
        )}

        {/* ══ SELLOS SOBREPUESTOS (módulo Panamá) ══ */}
        {/* Posicionados de forma absoluta sobre la página; se dibujan al final
            para quedar "encima" del documento, como un sello físico. */}
        {(stamps || []).map((st, i) => (
          <Image key={i} src={st.src} style={{ objectFit: 'contain', ...st.style }} />
        ))}

      </Page>
    </Document>
  )
}
