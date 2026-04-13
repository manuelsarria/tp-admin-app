import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ServiceLine {
  service: string
  package: string
  price: number
  qty: number
  amount: number
}

export interface QuoteData {
  quoteNumber: string
  quoteType: 'LCL' | 'FCL'
  tipoServicio: string
  validoDesde: Date | string
  validoHasta: Date | string
  frecuencia?: string | null
  tiempoTransito?: string | null
  lineaNaviera?: string | null
  ruta?: string | null
  cliente: string
  referenciasAdicionales?: string | null
  pesoBruto?: number | null
  volumen?: string | null
  pesoCargable?: number | null
  terminoNegociacion?: string | null
  mercaderia?: string | null
  valorMercancia?: number | null
  valorSeguro?: number | null
  piezas?: number | null
  tipoEmbalaje?: string | null
  dimensiones?: string | null
  tipoContenedor?: string | null
  direccionRecogida?: string | null
  direccionEntrega?: string | null
  servicios: ServiceLine[]
  comentarios?: string | null
  total: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
  n != null ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'

const fmtDate = (d?: Date | string | null) => {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

const val = (v?: string | number | null) => (v != null && v !== '' ? String(v) : '-')

const TERMS = [
  'SERVICIO PUERTO A PUERTO, SUJETO A APROBACIÓN DE LA LINEA.',
  'LA MERCANCIA DEBE ESTAR DEBIDAMENTE EMBALADA Y SEÑALIZADA.',
  'SERVICIO FOB, DE REQUERIR EXW SE LE AGREGARAN LOS CARGOS EN ORIGEN.',
  'SEGUN ORGANIZACIÓN DE LA NAVIERA/ CONSOLIDADOR LA CARGA PUEDE SALIR POR SHANGHAI O SHENZHEN, SE CONFIRMA EN LA OPERACIÓN.',
  'DE REQUERIR SERVICIOS ADICIONALES COMO TRAMITE ADUANAL Y TRANSPORTE LOCAL, SE COTIZA APARTE.',
  'LA FECHA DE VALIDEZ VA AMARRADA A LA FECHA DE ZARPE.',
]

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8, color: '#1a1a1a', paddingBottom: 20 },

  // Header
  banner: { width: '100%' },

  // Title bar
  titleBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#000' },
  titleText: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  pageText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // Info grid
  infoRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#aaa', marginHorizontal: 20 },
  infoCell: { flex: 1, paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: '#aaa' },
  infoCellLast: { flex: 1, paddingHorizontal: 6, paddingVertical: 4 },
  cellLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#333', marginBottom: 2 },
  cellValue: { fontSize: 8, color: '#1a1a1a' },

  // Section header
  sectionHeader: { backgroundColor: '#e8e8e8', paddingHorizontal: 26, paddingVertical: 3, marginHorizontal: 20, borderTopWidth: 0.5, borderTopColor: '#aaa', borderBottomWidth: 0.5, borderBottomColor: '#aaa' },
  sectionHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8 },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: '#000', marginHorizontal: 20, paddingVertical: 5 },
  tableHeaderText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' },
  tableRow: { flexDirection: 'row', marginHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: '#ddd', minHeight: 22 },
  tableRowAlt: { flexDirection: 'row', marginHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: '#ddd', backgroundColor: '#f9f9f9', minHeight: 22 },
  colService: { flex: 4.5, paddingHorizontal: 8, paddingVertical: 5, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colPackage: { flex: 1.2, paddingHorizontal: 4, paddingVertical: 5, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colPrice: { flex: 1.5, paddingHorizontal: 4, paddingVertical: 5, textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colQty: { flex: 0.8, paddingHorizontal: 4, paddingVertical: 5, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colAmount: { flex: 1.8, paddingHorizontal: 8, paddingVertical: 5, textAlign: 'right' },

  // Total row
  totalRow: { flexDirection: 'row', marginHorizontal: 20, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#000' },
  totalLabel: { flex: 8, paddingHorizontal: 8, fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'right' },
  totalValue: { flex: 1.8, paddingHorizontal: 8, fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'right' },

  // Empty rows
  emptyRow: { flexDirection: 'row', marginHorizontal: 20, minHeight: 18, borderBottomWidth: 0.5, borderBottomColor: '#eee' },

  // Terms & Conditions
  termsBox: { marginHorizontal: 20, marginTop: 8, paddingHorizontal: 6 },
  termsTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 3 },
  termItem: { flexDirection: 'row', marginBottom: 2 },
  termBullet: { fontSize: 7, marginRight: 4, color: '#555' },
  termText: { fontSize: 7, color: '#333', flex: 1, lineHeight: 1.3 },

  // Comments
  commentsBox: { marginHorizontal: 20, marginTop: 6, paddingHorizontal: 6 },
  commentsTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 3 },
  commentText: { fontSize: 7.5, color: '#333', lineHeight: 1.4 },
  noteText: { fontSize: 7.5, color: '#c00', lineHeight: 1.4 },

  // Validity note
  validityNote: { marginHorizontal: 20, marginVertical: 5, paddingHorizontal: 6 },
  validityText: { fontSize: 7, color: '#555', lineHeight: 1.4 },
})

// ── Document ──────────────────────────────────────────────────────────────────
interface Props {
  quote: QuoteData
  logoBase64?: string | null
  bannerBase64?: string | null
}

export function QuoteDocument({ quote, logoBase64, bannerBase64 }: Props) {
  const services: ServiceLine[] = Array.isArray(quote.servicios) ? quote.servicios : []

  // Pad to at least 8 visible rows
  const MIN_ROWS = 8
  const emptyRows = Math.max(0, MIN_ROWS - services.length)

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Banner (ya incluye logo, web y contacto) ── */}
        {bannerBase64
          ? <Image src={bannerBase64} style={s.banner} />
          : (
            <View style={{ backgroundColor: '#0a0a0a', height: 90, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', paddingRight: 20, paddingBottom: 8 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#FACC15' }}>TP LOGISTICS</Text>
                <Text style={{ fontSize: 7, color: '#fff', marginTop: 3 }}>www.tplogist.com</Text>
                <Text style={{ fontSize: 7, color: '#fff' }}>Tel: 6377-7906   Email: import@tplogist.com</Text>
              </View>
            </View>
          )
        }

        {/* ── Title bar ── */}
        <View style={s.titleBar}>
          <Text style={s.titleText}>Flete Maritimo Internacional - Cotizacion</Text>
          <Text style={s.pageText}>Page 1 of 1</Text>
        </View>

        {/* ── Info row 1: quote header ── */}
        <View style={[s.infoRow, { borderTopWidth: 0.5, borderTopColor: '#aaa' }]}>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Cotización No</Text>
            <Text style={s.cellValue}>{quote.quoteNumber}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Tipo de Servicio</Text>
            <Text style={s.cellValue}>{quote.tipoServicio}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Valido Desde</Text>
            <Text style={s.cellValue}>{fmtDate(quote.validoDesde)}</Text>
          </View>
          <View style={s.infoCellLast}>
            <Text style={s.cellLabel}>Valido Hasta</Text>
            <Text style={s.cellValue}>{fmtDate(quote.validoHasta)}</Text>
          </View>
        </View>

        {/* ── Info row 2: transit ── */}
        <View style={s.infoRow}>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Frecuencia</Text>
            <Text style={s.cellValue}>{val(quote.frecuencia)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Tiempo de Transito</Text>
            <Text style={s.cellValue}>{val(quote.tiempoTransito)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Linea Naviera</Text>
            <Text style={s.cellValue}>{val(quote.lineaNaviera)}</Text>
          </View>
          <View style={s.infoCellLast}>
            <Text style={s.cellLabel}>Ruta</Text>
            <Text style={s.cellValue}>{val(quote.ruta)}</Text>
          </View>
        </View>

        {/* ── Section: Información de Embarque ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionHeaderText}>Información de Embarque</Text>
        </View>

        {/* Shipment row 1 */}
        <View style={s.infoRow}>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Peso Bruto</Text>
            <Text style={s.cellValue}>{val(quote.pesoBruto)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Volumen</Text>
            <Text style={s.cellValue}>{val(quote.volumen)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Peso Cargable</Text>
            <Text style={s.cellValue}>{val(quote.pesoCargable)}</Text>
          </View>
          <View style={s.infoCellLast}>
            <Text style={s.cellLabel}>Termino de Negociación</Text>
            <Text style={s.cellValue}>{val(quote.terminoNegociacion)}</Text>
          </View>
        </View>

        {/* Shipment row 2 */}
        <View style={s.infoRow}>
          <View style={[s.infoCell, { flex: 2 }]}>
            <Text style={s.cellLabel}>Mercadería</Text>
            <Text style={s.cellValue}>{val(quote.mercaderia)}</Text>
          </View>
          <View style={[s.infoCell, { flex: 1 }]}>
            <Text style={s.cellLabel}>Valor Mercancia</Text>
            <Text style={s.cellValue}>{fmt(quote.valorMercancia)}</Text>
          </View>
          <View style={[s.infoCellLast, { flex: 1 }]}>
            <Text style={s.cellLabel}>Valor del Seguro</Text>
            <Text style={s.cellValue}>{fmt(quote.valorSeguro)}</Text>
          </View>
        </View>

        {/* Shipment row 3 */}
        <View style={s.infoRow}>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}># Piezas</Text>
            <Text style={s.cellValue}>{val(quote.piezas)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Tipo de Embalaje</Text>
            <Text style={s.cellValue}>{val(quote.tipoEmbalaje)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.cellLabel}>Dimensiones</Text>
            <Text style={s.cellValue}>{val(quote.dimensiones)}</Text>
          </View>
          <View style={s.infoCellLast}>
            <Text style={s.cellLabel}>Tipo de Contenedor / Servicio</Text>
            <Text style={s.cellValue}>{val(quote.tipoContenedor)}</Text>
          </View>
        </View>

        {/* Shipment row 4: addresses */}
        <View style={s.infoRow}>
          <View style={[s.infoCell, { flex: 2 }]}>
            <Text style={s.cellLabel}>Dirección de Recogida</Text>
            <Text style={s.cellValue}>{val(quote.direccionRecogida)}</Text>
          </View>
          <View style={[s.infoCellLast, { flex: 2 }]}>
            <Text style={s.cellLabel}>Dirección de Entrega</Text>
            <Text style={s.cellValue}>{val(quote.direccionEntrega)}</Text>
          </View>
        </View>

        {/* Shipment row 5: client */}
        <View style={[s.infoRow, { borderBottomWidth: 1, borderBottomColor: '#aaa' }]}>
          <View style={[s.infoCell, { flex: 2 }]}>
            <Text style={s.cellLabel}>Cliente</Text>
            <Text style={s.cellValue}>{quote.cliente}</Text>
          </View>
          <View style={[s.infoCellLast, { flex: 2 }]}>
            <Text style={s.cellLabel}>Referencias Adicionales</Text>
            <Text style={s.cellValue}>{val(quote.referenciasAdicionales)}</Text>
          </View>
        </View>

        {/* ── Validity note ── */}
        <View style={s.validityNote}>
          <Text style={s.validityText}>
            Nota: Esta cotización es válida únicamente para el embarque especificado en la sección "Información de Embarque".{'\n'}
            Una vez que dicho envío haya sido procesado, esta cotización se considerará no vigente y no aplicará para futuras cargas.
          </Text>
        </View>

        {/* ── Section: Detalles de Cotizacion ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionHeaderText}>Detalles de Cotizacion</Text>
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colService]}>Service</Text>
          <Text style={[s.tableHeaderText, s.colPackage]}>Package</Text>
          <Text style={[s.tableHeaderText, s.colPrice]}>Price</Text>
          <Text style={[s.tableHeaderText, s.colQty]}>QTY</Text>
          <Text style={[s.tableHeaderText, s.colAmount]}>AMOUNT</Text>
        </View>

        {/* Service rows */}
        {services.map((line, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.colService, { fontSize: 7.5 }]}>{line.service}</Text>
            <Text style={[s.colPackage, { fontSize: 7.5, textAlign: 'center' }]}>{line.package}</Text>
            <Text style={[s.colPrice, { fontSize: 7.5, textAlign: 'right' }]}>
              $ {Number(line.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[s.colQty, { fontSize: 7.5, textAlign: 'center' }]}>
              {Number(line.qty).toFixed(2)}
            </Text>
            <Text style={[s.colAmount, { fontSize: 7.5, textAlign: 'right' }]}>
              USD {Number(line.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}

        {/* Empty filler rows */}
        {Array.from({ length: emptyRows }).map((_, i) => (
          <View key={`empty-${i}`} style={s.emptyRow}>
            <Text style={s.colService}> </Text>
            <Text style={s.colPackage}> </Text>
            <Text style={s.colPrice}> </Text>
            <Text style={s.colQty}> </Text>
            <Text style={s.colAmount}> </Text>
          </View>
        ))}

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total (USD) :</Text>
          <Text style={s.totalValue}>
            USD {'  '}{Number(quote.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* ── Terms & Conditions ── */}
        <View style={s.termsBox}>
          <Text style={s.termsTitle}>Términos &amp; Condiciones:</Text>
          {TERMS.map((t, i) => (
            <View key={i} style={s.termItem}>
              <Text style={s.termBullet}>□</Text>
              <Text style={s.termText}>{t}</Text>
            </View>
          ))}
        </View>

        {/* ── Comments ── */}
        <View style={s.commentsBox}>
          <Text style={s.commentsTitle}>Comentarios:</Text>
          <Text style={s.commentText}>
            {quote.comentarios || 'Esperamos esta tarifa este acorde a su requeriento.'}
          </Text>
          <Text style={s.noteText}>
            {'\n'}Nota.- Adicionalmente podemos cotizar un seguro Clase "A" contra todo riesgo que le recomendamos para proteger su carga, para enviarle nuestra oferta de seguro necesitaremos solamente nos envíe una copia de su factura comercial (Invoice).
          </Text>
          <Text style={[s.commentText, { marginTop: 6 }]}>Saludos Cordiales,</Text>
        </View>

      </Page>
    </Document>
  )
}
