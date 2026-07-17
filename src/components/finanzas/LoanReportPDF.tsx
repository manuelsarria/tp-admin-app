import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { round2 } from '@/lib/loans'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LoanReportPayment {
  date: Date | string
  amount: number
  kind: string
  /** Fondo del que salió el dinero; cae a `loan.unit` si no se registró. */
  sourceUnit?: string | null
  method?: string | null
  reference?: string | null
}

export interface LoanReportData {
  name: string
  kind: string
  status: string
  counterparty?: string | null
  reference?: string | null
  totalAmount: number
  downPayment: number
  installmentAmount?: number | null
  installmentsTotal?: number | null
  interestRate?: number | null
  startDate?: Date | string | null
  firstPaymentDate?: Date | string | null
  dueDate?: Date | string | null
  /** Fondo por defecto del préstamo. */
  unit?: string | null
  notes?: string | null
  payments: LoanReportPayment[]
  // derived
  paid: number
  balance: number
  installmentsPaid: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
  n != null ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'

const val = (v?: string | number | null) => (v != null && v !== '' ? String(v) : '-')

const fmtDate = (d?: Date | string | null) => {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return '-'
  // UTC so a date-only value doesn't slide a day by timezone.
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${date.getUTCFullYear()}`
}

const KIND_LABEL: Record<string, string> = {
  CUOTA: 'Cuota',
  EXTRAORDINARIO: 'Extraordinario',
  INICIAL: 'Abono inicial',
  AJUSTE: 'Ajuste',
}

const BLACK = '#1a1a1a'
const YELLOW = '#FACC15'

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8, color: BLACK, paddingBottom: 30 },

  banner: { width: '100%' },

  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  titleMain: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
    letterSpacing: 3,
    flex: 1,
    textAlign: 'center',
  },
  refBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: YELLOW,
    borderRadius: 3,
    alignItems: 'flex-end',
  },
  refText: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: YELLOW, letterSpacing: 1 },

  accentLine: { height: 2, backgroundColor: YELLOW, marginHorizontal: 20, marginBottom: 10 },

  loanName: {
    marginHorizontal: 20,
    marginBottom: 8,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BLACK,
  },

  // ── Detail box ──
  detailSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  detailCol: { flex: 1, padding: 8, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  detailColLast: { flex: 1, padding: 8 },
  fieldRow: { marginBottom: 5 },
  fieldLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#555', marginBottom: 1 },
  fieldValue: { fontSize: 8.5, color: BLACK },

  // ── Payments table ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLACK,
    marginHorizontal: 20,
    paddingVertical: 6,
  },
  tableHeaderText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tableRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    minHeight: 18,
  },
  tableRowAlt: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    backgroundColor: '#f9f9f9',
    minHeight: 18,
  },
  colDate: { flex: 1.3, paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colKind: { flex: 1.4, paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colFund: { flex: 1.9, paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colMethod: { flex: 1.3, paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colRef: { flex: 1.5, paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colAmount: { flex: 1.4, paddingHorizontal: 6, paddingVertical: 4, textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#ddd' },
  colBalance: { flex: 1.4, paddingHorizontal: 6, paddingVertical: 4, textAlign: 'right' },

  totalRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: BLACK,
    paddingVertical: 6,
    marginTop: 2,
  },
  totalText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

  emptyBox: { marginHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  emptyText: { fontSize: 8, color: '#777' },

  // ── Summary row: fondos (left) + saldo (right) ──
  summaryWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 12,
  },

  // ── Pagos por fondo ──
  fundsBox: { flex: 1, marginRight: 14, borderWidth: 0.5, borderColor: '#ddd' },
  fundsHeader: {
    backgroundColor: BLACK,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fundsHeaderText: { color: YELLOW, fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 1 },
  fundsHeaderCount: { color: '#fff', fontSize: 7 },
  fundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  fundsName: { flex: 1.6, fontSize: 8, color: BLACK },
  fundsBarTrack: { flex: 1.2, height: 4, backgroundColor: '#eee', borderRadius: 2, marginRight: 8 },
  fundsBarFill: { height: 4, backgroundColor: YELLOW, borderRadius: 2 },
  fundsAmount: { width: 60, fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLACK, textAlign: 'right' },
  fundsPct: { width: 32, fontSize: 7.5, color: '#555', textAlign: 'right' },
  summaryBox: {
    backgroundColor: BLACK,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 3,
    minWidth: 170,
    alignItems: 'center',
  },
  summaryLabel: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  summaryValue: { color: YELLOW, fontSize: 14, fontFamily: 'Helvetica-Bold' },

  notesBox: { marginHorizontal: 20, marginTop: 10 },
  notesTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 3, color: '#333' },
  notesText: { fontSize: 8, color: '#444', lineHeight: 1.4 },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    borderTopWidth: 1,
    borderTopColor: YELLOW,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 7, color: '#555' },
  footerBold: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: BLACK },
})

// ── Document ──────────────────────────────────────────────────────────────────
interface Props {
  loan: LoanReportData
  bannerBase64?: string | null
  generatedAt?: Date
}

export function LoanReportDocument({ loan, bannerBase64, generatedAt }: Props) {
  const payments = [...(loan.payments || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Running balance starts after the down payment and drops with each payment.
  let running = loan.totalAmount - loan.downPayment
  const rows = payments.map(p => {
    running = Math.round((running - p.amount) * 100) / 100
    return { p, balance: running }
  })
  const totalPaid = round2(payments.reduce((acc, p) => acc + p.amount, 0))

  const cuotas = `${loan.installmentsPaid}${loan.installmentsTotal != null ? ` / ${loan.installmentsTotal}` : ''}`

  // Fondo del pago: el que pagó manda; si no se registró, el del préstamo.
  const fundOf = (p: LoanReportPayment) => p.sourceUnit?.trim() || loan.unit?.trim() || '-'

  // Cuánto salió de cada fondo, de mayor a menor.
  const fundTotals = (() => {
    const totals = new Map<string, number>()
    for (const p of payments) {
      const fund = fundOf(p)
      totals.set(fund, (totals.get(fund) ?? 0) + p.amount)
    }
    return [...totals.entries()]
      .map(([unit, raw]) => ({
        unit,
        amount: round2(raw),
        pct: totalPaid > 0 ? round2((raw / totalPaid) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  })()

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Banner ── */}
        {bannerBase64
          ? <Image src={bannerBase64} style={s.banner} />
          : (
            <View style={{ backgroundColor: '#0a0a0a', height: 90, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', paddingRight: 20, paddingBottom: 8 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13, color: YELLOW }}>TP LOGISTICS</Text>
                <Text style={{ fontSize: 7, color: '#fff', marginTop: 3 }}>www.tplogist.com</Text>
                <Text style={{ fontSize: 7, color: '#fff' }}>Tel: 6208-9311   Email: import@tplogist.com</Text>
              </View>
            </View>
          )
        }

        {/* ── Title + reference ── */}
        <View style={s.titleSection}>
          <Text style={{ fontSize: 9, color: '#999', flex: 0.5 }}> </Text>
          <Text style={s.titleMain}>ESTADO DE PRESTAMO</Text>
          <View style={[s.refBox, { flex: 0.9 }]}>
            <Text style={s.refText}>{val(loan.reference) === '-' ? loan.status : loan.reference!}</Text>
          </View>
        </View>

        <View style={s.accentLine} />

        <Text style={s.loanName}>{loan.name}</Text>

        {/* ── Detail box (3 cols) ── */}
        <View style={s.detailSection}>
          <View style={s.detailCol}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>TOTAL A PAGAR</Text>
              <Text style={s.fieldValue}>{fmt(loan.totalAmount)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>ABONO INICIAL</Text>
              <Text style={s.fieldValue}>{fmt(loan.downPayment)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>PAGADO</Text>
              <Text style={s.fieldValue}>{fmt(loan.paid)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>SALDO</Text>
              <Text style={s.fieldValue}>{fmt(loan.balance)}</Text>
            </View>
          </View>

          <View style={s.detailCol}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>CUOTA</Text>
              <Text style={s.fieldValue}>{loan.installmentAmount != null ? fmt(loan.installmentAmount) : '-'}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>CUOTAS PAGADAS</Text>
              <Text style={s.fieldValue}>{cuotas}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>TASA</Text>
              <Text style={s.fieldValue}>{loan.interestRate != null ? `${loan.interestRate}%` : '-'}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>ACREEDOR</Text>
              <Text style={s.fieldValue}>{val(loan.counterparty)}</Text>
            </View>
          </View>

          <View style={s.detailColLast}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>INICIO</Text>
              <Text style={s.fieldValue}>{fmtDate(loan.startDate)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>PRIMER PAGO</Text>
              <Text style={s.fieldValue}>{fmtDate(loan.firstPaymentDate)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>VENCIMIENTO</Text>
              <Text style={s.fieldValue}>{fmtDate(loan.dueDate)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>ESTADO</Text>
              <Text style={s.fieldValue}>{loan.status}</Text>
            </View>
          </View>
        </View>

        {/* ── Payments table ── */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colDate]}>FECHA</Text>
          <Text style={[s.tableHeaderText, s.colKind]}>TIPO</Text>
          <Text style={[s.tableHeaderText, s.colFund]}>FONDO</Text>
          <Text style={[s.tableHeaderText, s.colMethod]}>MÉTODO</Text>
          <Text style={[s.tableHeaderText, s.colRef]}>REFERENCIA</Text>
          <Text style={[s.tableHeaderText, s.colAmount]}>MONTO</Text>
          <Text style={[s.tableHeaderText, s.colBalance]}>SALDO</Text>
        </View>

        {rows.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Sin pagos registrados.</Text>
          </View>
        ) : rows.map((r, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} wrap={false}>
            <Text style={[s.colDate, { fontSize: 8 }]}>{fmtDate(r.p.date)}</Text>
            <Text style={[s.colKind, { fontSize: 8 }]}>{KIND_LABEL[r.p.kind] || r.p.kind}</Text>
            <Text style={[s.colFund, { fontSize: 8 }]}>{fundOf(r.p)}</Text>
            <Text style={[s.colMethod, { fontSize: 8 }]}>{val(r.p.method)}</Text>
            <Text style={[s.colRef, { fontSize: 8 }]}>{val(r.p.reference)}</Text>
            <Text style={[s.colAmount, { fontSize: 8 }]}>{fmt(r.p.amount)}</Text>
            <Text style={[s.colBalance, { fontSize: 8 }]}>{fmt(r.balance)}</Text>
          </View>
        ))}

        {/* ── TOTAL row ── */}
        <View style={s.totalRow}>
          <Text style={[s.totalText, s.colDate]}>TOTAL</Text>
          <Text style={[s.totalText, s.colKind]}> </Text>
          <Text style={[s.totalText, s.colFund]}> </Text>
          <Text style={[s.totalText, s.colMethod]}> </Text>
          <Text style={[s.totalText, s.colRef]}>{rows.length} pago(s)</Text>
          <Text style={[s.totalText, s.colAmount]}>{fmt(totalPaid)}</Text>
          <Text style={[s.totalText, s.colBalance]}>{fmt(loan.balance)}</Text>
        </View>

        {/* ── Pagos por fondo + saldo pendiente ── */}
        <View style={fundTotals.length > 0 ? s.summaryWrapper : [s.summaryWrapper, { justifyContent: 'flex-end' as const }]}>
          {fundTotals.length > 0 ? (
            <View style={s.fundsBox} wrap={false}>
              <View style={s.fundsHeader}>
                <Text style={s.fundsHeaderText}>PAGOS POR FONDO</Text>
                <Text style={s.fundsHeaderCount}>{fundTotals.length} fondo(s)</Text>
              </View>
              {fundTotals.map(f => (
                <View key={f.unit} style={s.fundsRow}>
                  <Text style={s.fundsName}>{f.unit}</Text>
                  <View style={s.fundsBarTrack}>
                    <View style={[s.fundsBarFill, { width: `${Math.max(f.pct, 2)}%` }]} />
                  </View>
                  <Text style={s.fundsAmount}>{fmt(f.amount)}</Text>
                  <Text style={s.fundsPct}>{f.pct.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>SALDO PENDIENTE (USD)</Text>
            <Text style={s.summaryValue}>{fmt(loan.balance)}</Text>
          </View>
        </View>

        {loan.notes ? (
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>NOTAS:</Text>
            <Text style={s.notesText}>{loan.notes}</Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generado el {fmtDate(generatedAt ?? new Date())}</Text>
          <Text style={s.footerBold}>(+507) 6208-9311</Text>
          <Text style={s.footerText}>import@tplogist.com</Text>
        </View>

      </Page>
    </Document>
  )
}
