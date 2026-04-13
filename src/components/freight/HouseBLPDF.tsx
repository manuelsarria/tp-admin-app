import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

export interface LclBookingForPDF {
  id: string
  hblNumber: string
  shipperName: string
  shipperAddress?: string | null
  clientName: string
  clientAddress?: string | null
  notifyParty?: string | null
  notifyPhone?: string | null
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
  lclContainer?: {
    containerNumber?: string | null
    containerType?: string | null
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

interface Props {
  booking: LclBookingForPDF
  logoBase64: string | null
  qrBase64?: string | null
  approval?: ApprovalInfo | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
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
  lbl: { fontSize: 5.5, lineHeight: 1.2, marginBottom: 2 },
  val: { fontSize: 8, lineHeight: 1.35 },
  valBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', lineHeight: 1.35 },
  valBig: { fontSize: 11, fontFamily: 'Helvetica-Bold' },

  // ─ Cargo table ─
  thCell: { fontSize: 6, fontFamily: 'Helvetica-Bold', padding: '3pt 3pt' },
  tdCell: { fontSize: 7.5, padding: '3pt 3pt', lineHeight: 1.3 },
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

export function HouseBLPDF({ booking, logoBase64, qrBase64, approval }: Props) {
  const date     = fmtDate(booking.blDate || booking.createdAt)
  const isPrepaid = booking.freightTerms !== 'COLLECT'

  const weightLine = booking.grossWeightKg != null
    ? `${booking.grossWeightKg.toFixed(2)} Kgs`
    : ''

  const measLine = booking.cbm != null
    ? `${booking.cbm.toFixed(2)} Cbm`
    : ''

  const containerNumber = booking.lclContainer?.containerNumber || ''
  const containerType = booking.lclContainer?.containerType || ''
  const etd = booking.lclContainer?.etd ? fmtDate(booking.lclContainer.etd) : ''

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
                  value={[booking.clientName, booking.clientAddress].filter(Boolean).join('\n')}
                />
              </View>

              {/* Cell 4 — Notify Party */}
              <View style={{ minHeight: 38 }}>
                <Cell label="4. NOTIFY PARTY / INTERMEDIATE CONSIGNEE (Name and address)">
                  <Text style={[s.val, { marginTop: 2 }]}>
                    {booking.notifyParty || booking.clientName}
                  </Text>
                  {booking.notifyPhone ? (
                    <Text style={[s.val, { marginTop: 2 }]}>
                      Contact:{'\n'}Phone: {booking.notifyPhone} / Fax:
                    </Text>
                  ) : (
                    <Text style={[s.val, { marginTop: 2, color: '#666' }]}>
                      Contact:{'\n'}Phone:  / Fax:
                    </Text>
                  )}
                </Cell>
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
                  <Text style={[s.val, { fontFamily: 'Helvetica-Bold', fontSize: 8.5, marginBottom: 4 }]}>
                    {booking.hblNumber}
                  </Text>
                  <Text style={s.lbl}>DATE</Text>
                  <Text style={[s.val, { fontFamily: 'Helvetica-Bold', fontSize: 10 }]}>
                    {date}
                  </Text>
                </View>

              </View>

              {/* Cell 7 — Forwarding Agent */}
              <View style={{ borderBottom: B, minHeight: 36 }}>
                <Cell
                  label="7. FORWARDING AGENT (Name and address - references)"
                  value={'TP LOGISTICS\nCalle 5ta y Av 3ra, Edif 9570, Loc D2\nPanamá, República de Panamá'}
                />
              </View>

              {/* Cell 8 — Point of Origin */}
              <View style={{ borderBottom: B, minHeight: 18 }}>
                <Cell label="8. POINT (STATE) OF ORIGIN OR FTZ NUMBER" value="" />
              </View>

              {/* Cell 9 — Domestic Routing (fills remaining height of Cell 4) */}
              <View style={{ flex: 1, minHeight: 38 }}>
                <Cell label="9. DOMESTIC ROUTING / EXPORT INSTRUCTION" value="" />
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
                valStyle={{ fontFamily: 'Helvetica-Bold' }}
              />
            </View>
          </View>

          {/* ── Row C: Cells 14 + 15 + 10 ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 25, borderRight: B, minHeight: 20 }}>
              <Cell label="14. EXPORTING CARRIER" value={booking.vessel || ''} valStyle={{ fontFamily: 'Helvetica-Bold' }} />
            </View>
            <View style={{ flex: 40, borderRight: B, minHeight: 20 }}>
              <Cell label="15. PORT OF LOADING / EXPORT" value={booking.portOfLoading} valStyle={{ fontFamily: 'Helvetica-Bold' }} />
            </View>
            <View style={{ flex: 35, minHeight: 20 }}>
              <Cell label="10. LOADING PIER / TERMINAL" value="" />
            </View>
          </View>

          {/* ── Row D: Cells 16 + 17 + 11 + PREPAID/COLLECT ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 25, borderRight: B, minHeight: 20 }}>
              <Cell label="16. FOREIGN PORT OF UNLOADING" value={booking.portOfDischarge} valStyle={{ fontFamily: 'Helvetica-Bold' }} />
            </View>
            <View style={{ flex: 40, borderRight: B, minHeight: 20 }}>
              <Cell label="17. PLACE OF DELIVERY BY PRE-CARRIER" value={booking.placeOfDelivery || booking.portOfDischarge} valStyle={{ fontFamily: 'Helvetica-Bold' }} />
            </View>
            <View style={{ flex: 20, borderRight: B, minHeight: 20 }}>
              <Cell label="11. TYPE OF MOVE" value="" />
            </View>
            <View style={{ flex: 15, minHeight: 20, padding: '3pt 4pt', justifyContent: 'center' }}>
              <Text style={[s.val, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>
                {isPrepaid ? 'PREPAID' : 'COLLECT'}
              </Text>
            </View>
          </View>

          {/* ── Row E: Container Number + Container Type + ETD ── */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 35, borderRight: B, minHeight: 20 }}>
              <Cell label="CONTAINER NUMBER" value={containerNumber} valStyle={{ fontFamily: 'Helvetica-Bold' }} />
            </View>
            <View style={{ flex: 30, borderRight: B, minHeight: 20 }}>
              <Cell label="CONTAINER TYPE" value={containerType} valStyle={{ fontFamily: 'Helvetica-Bold' }} />
            </View>
            <View style={{ flex: 35, minHeight: 20 }}>
              <Cell label="FECHA DE ZARPE (ETD)" value={etd} valStyle={{ fontFamily: 'Helvetica-Bold' }} />
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
              <Text style={s.thCell}>MEASURAMENT</Text>
              <Text style={[s.thCell, { color: '#444' }]}>(22)</Text>
            </View>
          </View>

          {/* Cargo content row */}
          <View style={{ flexDirection: 'row', borderBottom: B, minHeight: 110 }}>
            {/* Marks */}
            <View style={{ flex: 20, borderRight: B, padding: '3pt 3pt' }}>
              <Text style={s.tdCell}>{booking.marks || booking.hblNumber}</Text>
              {booking.voyage && <Text style={[s.tdCell, { marginTop: 2 }]}>{booking.voyage}</Text>}
            </View>
            {/* # Packages */}
            <View style={{ flex: 12, borderRight: B, padding: '3pt 3pt', alignItems: 'center' }}>
              <Text style={[s.tdCell, { fontFamily: 'Helvetica-Bold', fontSize: 9 }]}>
                {booking.packages}
              </Text>
            </View>
            {/* Description */}
            <View style={{ flex: 38, borderRight: B, padding: '3pt 3pt' }}>
              <Text style={s.tdCell}>{booking.description || ''}</Text>
              {booking.hsCode ? (
                <Text style={[s.tdCell, { marginTop: 3 }]}>{booking.hsCode}</Text>
              ) : null}
            </View>
            {/* Weight */}
            <View style={{ flex: 15, borderRight: B, padding: '3pt 3pt', alignItems: 'flex-end' }}>
              <Text style={s.tdCell}>{weightLine}</Text>
            </View>
            {/* Measurement */}
            <View style={{ flex: 15, padding: '3pt 3pt', alignItems: 'flex-end' }}>
              <Text style={s.tdCell}>{measLine}</Text>
            </View>
          </View>

          {/* TOTALS row */}
          <View style={{ flexDirection: 'row', borderBottom: B }}>
            <View style={{ flex: 20, borderRight: B, padding: '3pt 3pt', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5 }}>TOTALS:</Text>
            </View>
            <View style={{ flex: 12, borderRight: B, padding: '3pt 3pt', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8 }}>{booking.packages}</Text>
            </View>
            <View style={{ flex: 38, borderRight: B, padding: '3pt 3pt' }} />
            <View style={{ flex: 15, borderRight: B, padding: '3pt 3pt', alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7 }}>{weightLine}</Text>
            </View>
            <View style={{ flex: 15, padding: '3pt 3pt', alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7 }}>{measLine}</Text>
            </View>
          </View>

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
                <Text style={{ flex: 2, fontSize: 7, padding: '2pt 3pt', borderRight: B }}>
                  {booking.freightDesc || 'FLETE MARITIMO'}
                </Text>
                <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', padding: '2pt 3pt', borderRight: B, textAlign: 'center' }}>
                  {isPrepaid && booking.freightAmount
                    ? `${booking.freightAmount.toFixed(0)}${booking.freightCurrency}`
                    : ''}
                </Text>
                <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', padding: '2pt 3pt', textAlign: 'center' }}>
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
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{date}</Text>
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
                  <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>{booking.hblNumber}</Text>
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
                Autorizado por: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{approval.authorizedBy}</Text>
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

      </Page>
    </Document>
  )
}
