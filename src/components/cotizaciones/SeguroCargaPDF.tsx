import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

export interface SeguroQuoteData {
  quoteNumber: string
  fecha: string
  validezDias: number
  clienteNombre?: string | null
  referencia?: string | null
  descripcionCarga?: string | null
  tipoCliente: string
  rate: number
  minimum: number
  valorComercial: number
  valorFlete: number
  valorTributos: number
  gastosAdicionalesPct: number
  gastosAdicionales: number
  lucroSesantePct: number
  lucroSesante: number
  totalAsegurado: number
  prima: number
  valorCobrar: number
  ejecutivo?: string | null
}

interface Props {
  quote: SeguroQuoteData
  bannerBase64: string | null
}

const YELLOW = '#FACC15'
const DARK = '#1a1a1a'
const LIGHT_GRAY = '#F5F5F5'

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingBottom: 46,
    backgroundColor: '#ffffff',
  },
  banner: { width: '100%', marginBottom: 14 },
  bannerFallback: {
    backgroundColor: '#0a0a0a',
    height: 90,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 8,
    marginBottom: 14,
  },
  body: { paddingHorizontal: 34 },

  // El amarillo de TP sobre blanco no se lee: las barras van en negro con el
  // amarillo como acento, no como fondo del texto.
  titleBar: {
    backgroundColor: DARK,
    padding: 8,
    marginBottom: 4,
    borderRadius: 3,
  },
  titleText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  accentLine: { height: 2, backgroundColor: YELLOW, marginBottom: 12 },

  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 3,
    padding: 6,
  },
  metaLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },

  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 8,
    paddingBottom: 2,
    borderBottomWidth: 1.5,
    borderBottomColor: YELLOW,
  },

  row: { flexDirection: 'row', marginBottom: 1 },
  label: {
    width: 190,
    backgroundColor: DARK,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    padding: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    fontSize: 8.5,
    padding: 5,
    textAlign: 'right',
  },
  valueLeft: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    fontSize: 8.5,
    padding: 5,
  },
  totalRow: { flexDirection: 'row', marginTop: 2 },
  totalLabel: {
    width: 190,
    backgroundColor: YELLOW,
    color: DARK,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    padding: 6,
    textTransform: 'uppercase',
  },
  totalValue: {
    flex: 1,
    backgroundColor: '#e9e9e9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    padding: 6,
    textAlign: 'right',
  },

  primaBox: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: YELLOW,
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },
  primaLabel: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  primaValue: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: DARK },
  primaNote: { fontSize: 7.5, color: '#777', marginTop: 4 },

  notes: { marginTop: 16 },
  noteItem: { fontSize: 7.8, color: '#444', marginBottom: 3, lineHeight: 1.4 },

  signRow: { flexDirection: 'row', gap: 24, marginTop: 26 },
  signBox: { flex: 1, borderTopWidth: 1, borderTopColor: '#999', paddingTop: 4 },
  signText: { fontSize: 7.5, color: '#666', textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 34,
    right: 34,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 6,
    alignItems: 'center',
  },
  footerText: { fontSize: 7, color: '#999', textAlign: 'center' },
})

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  )
}

export function SeguroCargaPDF({ quote, bannerBase64 }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {bannerBase64 ? (
          <Image src={bannerBase64} style={s.banner} />
        ) : (
          <View style={s.bannerFallback}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13, color: YELLOW }}>TP LOGISTICS</Text>
              <Text style={{ fontSize: 7, color: '#fff', marginTop: 3 }}>www.tplogist.com</Text>
              <Text style={{ fontSize: 7, color: '#fff' }}>Tel: 6208-9311   Email: import@tplogist.com</Text>
            </View>
          </View>
        )}

        <View style={s.body}>
          <View style={s.titleBar}>
            <Text style={s.titleText}>Cotización de Seguro de Carga</Text>
          </View>
          <View style={s.accentLine} />

          {/* Meta */}
          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Cotización #</Text>
              <Text style={s.metaValue}>{quote.quoteNumber}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Fecha</Text>
              <Text style={s.metaValue}>{quote.fecha}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Validez</Text>
              <Text style={s.metaValue}>{quote.validezDias} días</Text>
            </View>
          </View>

          {/* Cliente */}
          <Text style={s.sectionTitle}>Datos del Cliente</Text>
          <View style={s.row}>
            <Text style={s.label}>Cliente</Text>
            <Text style={s.valueLeft}>{quote.clienteNombre || '-'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Referencia / BL</Text>
            <Text style={s.valueLeft}>{quote.referencia || '-'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Mercancía</Text>
            <Text style={s.valueLeft}>{quote.descripcionCarga || '-'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Tipo de cliente</Text>
            <Text style={s.valueLeft}>{quote.tipoCliente}</Text>
          </View>

          {/* Cobertura */}
          <Text style={s.sectionTitle}>Detalle de Cobertura</Text>
          <Row label="Valor comercial de la mercancía" value={fmt(quote.valorComercial)} />
          <Row label="Valor del flete" value={fmt(quote.valorFlete)} />
          <Row label="Tributos y aranceles" value={fmt(quote.valorTributos)} />
          {quote.gastosAdicionalesPct > 0 && (
            <Row
              label={`Gastos adicionales (${quote.gastosAdicionalesPct}%)`}
              value={fmt(quote.gastosAdicionales)}
            />
          )}
          {quote.lucroSesantePct > 0 && (
            <Row
              label={`Lucro cesante (${quote.lucroSesantePct}%)`}
              value={fmt(quote.lucroSesante)}
            />
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total asegurado</Text>
            <Text style={s.totalValue}>{fmt(quote.totalAsegurado)}</Text>
          </View>

          {/* Prima */}
          <Text style={s.sectionTitle}>Prima de Seguro</Text>
          <Row label="Tasa aplicada" value={`${quote.rate}%`} />
          <Row label="Prima calculada" value={fmt(quote.prima)} />
          <Row label="Prima mínima" value={fmt(quote.minimum)} />

          <View style={s.primaBox}>
            <Text style={s.primaLabel}>Valor de la Póliza</Text>
            <Text style={s.primaValue}>{fmt(quote.valorCobrar)}</Text>
            {quote.prima < quote.minimum && (
              <Text style={s.primaNote}>Se aplica la prima mínima de {fmt(quote.minimum)}</Text>
            )}
          </View>

          {/* Notas */}
          <View style={s.notes}>
            <Text style={s.sectionTitle}>Condiciones</Text>
            <Text style={s.noteItem}>
              • Esta cotización es válida por {quote.validezDias} días a partir de la fecha de emisión
              y está sujeta a la aceptación de la compañía aseguradora.
            </Text>
            <Text style={s.noteItem}>
              • La cobertura inicia una vez emitida y pagada la póliza. Al momento de emitirla, la misma
              será enviada al correo electrónico registrado del cliente.
            </Text>
            <Text style={s.noteItem}>
              • Los valores declarados (mercancía, flete y tributos) son responsabilidad del cliente y
              deben corresponder a la documentación comercial del embarque.
            </Text>
            <Text style={s.noteItem}>
              • Quedan excluidas las mercancías prohibidas o restringidas por la póliza maestra, así
              como los daños preexistentes y el mal embalaje.
            </Text>
            <Text style={s.noteItem}>
              • Los montos están expresados en dólares de los Estados Unidos de América (USD).
            </Text>
          </View>

          {/* Firmas */}
          <View style={s.signRow}>
            <View style={s.signBox}>
              <Text style={s.signText}>{quote.ejecutivo || 'TP Logistics'}</Text>
              <Text style={s.signText}>Ejecutivo de Cuenta</Text>
            </View>
            <View style={s.signBox}>
              <Text style={s.signText}>Aceptación del Cliente</Text>
              <Text style={s.signText}>Nombre, firma y fecha</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Documento generado automáticamente por el sistema TP Logistics — no requiere firma para
            su validez informativa.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
