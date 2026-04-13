import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FastQuoteItem {
  tipoCarga?: string | null
  medidaLargo?: number | null
  medidaAncho?: number | null
  medidaAlto?: number | null
  tipoEnvio?: string
  cbmFt3?: number | null
  unidadVolumen?: string
  peso?: number | null
  flete: number
}

export interface FastQuoteData {
  quoteNumber: string
  status: string
  cliente: string
  direccion?: string | null
  medidaLargo?: number | null
  medidaAncho?: number | null
  medidaAlto?: number | null
  tipoCarga?: string | null
  tipoEnvio: string
  cbmFt3?: number | null
  unidadVolumen: string
  tiempoTransito: number
  validezTarifa: number
  peso?: number | null
  flete: number
  extraManejo?: number | null
  entregaPanama?: number | null
  descuento?: number | null
  comentarios?: string | null
  items?: FastQuoteItem[] | null
  total: number
  createdAt?: Date | string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
  n != null ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'

const val = (v?: string | number | null) =>
  v != null && v !== '' ? String(v) : '-'

const DARK_RED = '#8B0000'
const RED      = '#FACC15'

const TERMS = [
  'SERVICIO PUERTA A PUERTA, SUJETO A DISPONIBILIDAD.',
  'LA MERCANCÍA DEBE ESTAR DEBIDAMENTE EMBALADA Y SEÑALIZADA.',
  'EL FLETE ES POR VOLUMEN O PESO, LO QUE SEA MAYOR.',
  'LOS TIEMPOS DE TRÁNSITO SON ESTIMADOS Y PUEDEN VARIAR SEGÚN LA NAVIERA/AEROLÍNEA.',
  'DE REQUERIR SERVICIOS ADICIONALES COMO TRÁMITE ADUANAL Y TRANSPORTE LOCAL, SE COTIZA APARTE.',
  'LA VALIDEZ DE ESTA TARIFA ESTÁ SUJETA A CAMBIOS SIN PREVIO AVISO.',
]

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8, color: '#1a1a1a', paddingBottom: 20 },

  banner: { width: '100%' },

  // ── Title section ──
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  titleMain: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    letterSpacing: 4,
    flex: 1,
    textAlign: 'center',
  },
  quoteNumBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 3,
  },
  quoteNum: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: RED,
    letterSpacing: 1,
  },

  redLine: {
    height: 2,
    backgroundColor: RED,
    marginHorizontal: 20,
    marginBottom: 10,
  },

  // ── Client + info section ──
  clientSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  clientLeft: {
    flex: 1.2,
    padding: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#ddd',
  },
  clientRight: {
    flex: 1,
    padding: 8,
  },
  fieldRow: { marginBottom: 5 },
  fieldLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#555',
    marginBottom: 1,
  },
  fieldValue: { fontSize: 8.5, color: '#1a1a1a' },

  // ── Services table ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK_RED,
    marginHorizontal: 20,
    paddingVertical: 6,
  },
  tableHeaderText: {
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    minHeight: 22,
  },
  tableRowAlt: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    backgroundColor: '#f9f9f9',
    minHeight: 22,
  },
  colDesc:   { flex: 4, paddingHorizontal: 8, paddingVertical: 5, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colQty:    { flex: 1.2, paddingHorizontal: 4, paddingVertical: 5, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colPrice:  { flex: 1.8, paddingHorizontal: 4, paddingVertical: 5, textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colTotal:  { flex: 1.8, paddingHorizontal: 8, paddingVertical: 5, textAlign: 'right' },

  optionalTag: { color: RED, fontFamily: 'Helvetica-Bold', fontSize: 7 },

  // ── Decorative lines ──
  decorLines: { marginHorizontal: 20, marginTop: 8, marginBottom: 8 },
  decLine:    { height: 1, backgroundColor: '#ddd', marginBottom: 3 },

  // ── Comments ──
  commentsBox: { marginHorizontal: 20, marginBottom: 8 },
  commentsTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 3, color: '#333' },
  commentText: { fontSize: 8, color: '#444', lineHeight: 1.4 },

  // ── Total box ──
  totalWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: 20, marginBottom: 10 },
  totalBox: {
    backgroundColor: DARK_RED,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 3,
    minWidth: 160,
    alignItems: 'center',
  },
  totalLabel: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  totalValue: { color: '#fff', fontSize: 14, fontFamily: 'Helvetica-Bold' },

  // ── Terms ──
  termsBox: { marginHorizontal: 20, marginBottom: 8 },
  termsTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 4 },
  termItem: { flexDirection: 'row', marginBottom: 2 },
  termBullet: { fontSize: 7, marginRight: 4, color: '#555' },
  termText: { fontSize: 7, color: '#333', flex: 1, lineHeight: 1.3 },

  // ── Footer ──
  footer: {
    marginHorizontal: 20,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: RED,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 7, color: '#555' },
  footerBold: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#1a1a1a' },
})

// ── Document ──────────────────────────────────────────────────────────────────
interface Props {
  quote: FastQuoteData
  bannerBase64?: string | null
}

export function FastQuoteDocument({ quote, bannerBase64 }: Props) {
  const items: FastQuoteItem[] = Array.isArray(quote.items) && quote.items.length > 0
    ? quote.items
    : [{
        tipoCarga:    quote.tipoCarga,
        medidaLargo:  quote.medidaLargo,
        medidaAncho:  quote.medidaAncho,
        medidaAlto:   quote.medidaAlto,
        tipoEnvio:    quote.tipoEnvio,
        cbmFt3:       quote.cbmFt3,
        unidadVolumen: quote.unidadVolumen,
        peso:         quote.peso,
        flete:        quote.flete,
      }]

  // For header info use first item
  const first = items[0]
  const medidas =
    first.medidaLargo && first.medidaAncho && first.medidaAlto
      ? `${first.medidaLargo} × ${first.medidaAncho} × ${first.medidaAlto} cm`
      : items.length > 1 ? 'Ver ítems' : '-'

  const volumen = first.cbmFt3 != null
    ? `${first.cbmFt3} ${first.unidadVolumen || quote.unidadVolumen}`
    : items.length > 1 ? 'Ver ítems' : '-'

  // Build service rows
  type Row = { desc: string; optional?: boolean; amount: number; sub?: string }
  const rows: Row[] = items.map((it, i) => {
    const parts: string[] = []
    if (it.tipoCarga) parts.push(it.tipoCarga)
    if (it.medidaLargo && it.medidaAncho && it.medidaAlto)
      parts.push(`${it.medidaLargo}×${it.medidaAncho}×${it.medidaAlto} cm`)
    if (it.cbmFt3 != null) parts.push(`${it.cbmFt3} ${it.unidadVolumen || 'CBM'}`)
    if (it.peso != null) parts.push(`${it.peso} KGS`)
    const desc = items.length > 1
      ? `Flete – Ítem ${i + 1}${it.tipoCarga ? ` (${it.tipoCarga})` : ''}`
      : 'Flete'
    return { desc, sub: parts.filter(Boolean).join(' | ') || undefined, amount: it.flete }
  })

  if (quote.extraManejo != null) {
    rows.push({ desc: 'Extra Manejo', amount: quote.extraManejo })
  }
  if (quote.entregaPanama != null) {
    rows.push({ desc: 'Entrega Panamá Centro', optional: true, amount: quote.entregaPanama })
  }
  if (quote.descuento != null) {
    rows.push({ desc: `Descuento (${fmt(quote.descuento)})`, amount: -quote.descuento })
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Banner ── */}
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

        {/* ── Title + Quote Number ── */}
        <View style={s.titleSection}>
          <Text style={{ fontSize: 9, color: '#999', flex: 0.5 }}> </Text>
          <Text style={s.titleMain}>COTIZACION</Text>
          <View style={[s.quoteNumBox, { flex: 0.9, alignItems: 'flex-end' }]}>
            <Text style={s.quoteNum}>{quote.quoteNumber}</Text>
          </View>
        </View>

        {/* ── Red separator ── */}
        <View style={s.redLine} />

        {/* ── Client section (2 cols) ── */}
        <View style={s.clientSection}>
          {/* Left */}
          <View style={s.clientLeft}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>NOMBRE</Text>
              <Text style={s.fieldValue}>{quote.cliente}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>MEDIDAS</Text>
              <Text style={s.fieldValue}>{medidas}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>DIRECCIÓN</Text>
              <Text style={s.fieldValue}>{val(quote.direccion)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>TIPO DE CARGA</Text>
              <Text style={s.fieldValue}>{val(quote.tipoCarga)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>TIPO DE ENVÍO</Text>
              <Text style={s.fieldValue}>{quote.tipoEnvio}</Text>
            </View>
          </View>

          {/* Right */}
          <View style={s.clientRight}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>CBM / FT3</Text>
              <Text style={s.fieldValue}>{volumen}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>TIEMPO DE TRÁNSITO (TT)</Text>
              <Text style={s.fieldValue}>{quote.tiempoTransito} días</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>VALIDEZ DE TARIFA</Text>
              <Text style={s.fieldValue}>{quote.validezTarifa} días</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>PESO</Text>
              <Text style={s.fieldValue}>{quote.peso != null ? `${quote.peso} KGS` : '-'}</Text>
            </View>
          </View>
        </View>

        {/* ── Services table ── */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colDesc]}>DESCRIPCIÓN</Text>
          <Text style={[s.tableHeaderText, s.colQty]}>CANTIDAD</Text>
          <Text style={[s.tableHeaderText, s.colPrice]}>PRECIO</Text>
          <Text style={[s.tableHeaderText, s.colTotal]}>TOTAL</Text>
        </View>

        {rows.map((row, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <View style={s.colDesc}>
              <Text style={{ fontSize: 8 }}>{row.desc}</Text>
              {row.sub ? <Text style={{ fontSize: 7, color: '#777', marginTop: 1 }}>{row.sub}</Text> : null}
              {row.optional && <Text style={s.optionalTag}>OPCIONAL</Text>}
            </View>
            <Text style={[s.colQty,   { fontSize: 8 }]}>1</Text>
            <Text style={[s.colPrice, { fontSize: 8 }]}>
              {row.amount < 0 ? `(${fmt(-row.amount)})` : fmt(row.amount)}
            </Text>
            <Text style={[s.colTotal, { fontSize: 8 }]}>
              {row.amount < 0 ? `(${fmt(-row.amount)})` : fmt(row.amount)}
            </Text>
          </View>
        ))}

        {/* ── Decorative lines ── */}
        <View style={s.decorLines}>
          <View style={s.decLine} />
          <View style={s.decLine} />
          <View style={s.decLine} />
        </View>

        {/* ── Comments ── */}
        <View style={s.commentsBox}>
          <Text style={s.commentsTitle}>COMENTARIOS:</Text>
          <Text style={s.commentText}>
            {quote.comentarios || 'Esperamos esta tarifa esté acorde a su requerimiento.'}
          </Text>
        </View>

        {/* ── Total box (right-aligned) ── */}
        <View style={s.totalWrapper}>
          <View style={s.totalBox}>
            <Text style={s.totalLabel}>TOTAL (USD)</Text>
            <Text style={s.totalValue}>
              $ {Number(quote.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* ── Terms & Conditions ── */}
        <View style={s.termsBox}>
          <Text style={s.termsTitle}>TÉRMINOS Y CONDICIONES:</Text>
          {TERMS.map((t, i) => (
            <View key={i} style={s.termItem}>
              <Text style={s.termBullet}>□</Text>
              <Text style={s.termText}>{t}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer: contacto ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Importaciones</Text>
          <Text style={s.footerBold}>(+507) 6377-7906</Text>
          <Text style={s.footerText}>import@tplogist.com</Text>
        </View>

      </Page>
    </Document>
  )
}
