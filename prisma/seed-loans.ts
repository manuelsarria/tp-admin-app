/**
 * Seed the four existing personal loans from the owner's spreadsheets.
 *
 * Idempotent: re-running replaces each loan (matched by `name`) and its
 * payments, so it is safe to fix a number and run again.
 *
 * Historical payments are seeded WITHOUT ledger entries on purpose: posting
 * ~55 retroactive egresos into `personal_ledger_entries` would distort the
 * 2024-2026 monthly reports that already exist. Only payments registered from
 * the app going forward post to the daily journal.
 *
 * Run:  npx tsx prisma/seed-loans.ts
 */
import { PrismaClient, LoanKind, LoanStatus, LoanPaymentKind } from '@prisma/client'

const prisma = new PrismaClient()

const d = (s: string) => new Date(`${s}T12:00:00.000Z`)

type SeedPayment = {
  date: string
  amount: number
  kind?: LoanPaymentKind
  method?: string
  reference?: string
  notes?: string
}

type SeedLoan = {
  name: string
  kind: LoanKind
  counterparty?: string
  reference?: string
  principal: number
  interest?: number
  totalAmount: number
  downPayment?: number
  installmentAmount?: number
  installmentsTotal?: number
  interestRate?: number
  startDate?: string
  firstPaymentDate?: string
  dueDate?: string
  unit?: string
  category?: string
  notes?: string
  payments: SeedPayment[]
}

const BAC_REF = 'BANCA MOVIL BAC INTERNATIONAL BANK 113867956 jose quiroz bac'

// ── 1. Préstamo Yesenia ──────────────────────────────────────────────────────
// Hoja "PRESTAMO PERSONAL 2": 24 cuotas de 525 = 12,600. Pagado 7,875 (15
// cuotas), saldo 4,725. El pago de 1,575 del 03-sep-25 son 3 cuotas juntas.
const yesenia: SeedLoan = {
  name: 'Préstamo Yesenia',
  kind: LoanKind.PERSONAL,
  counterparty: 'Yesenia',
  principal: 12600,
  interest: 0,
  totalAmount: 12600,
  installmentAmount: 525,
  installmentsTotal: 24,
  unit: 'Salario Personal',
  category: 'Préstamos',
  notes: 'Hoja "Prestamo personal 2". Pagado 7,875 · saldo 4,725.',
  payments: [
    { date: '2024-12-18', amount: 525, method: 'Transferencia', reference: BAC_REF },
    { date: '2025-02-11', amount: 525, method: 'Transferencia', reference: BAC_REF },
    { date: '2025-05-03', amount: 525, method: 'Transferencia', reference: BAC_REF },
    { date: '2025-05-06', amount: 525, method: 'Transferencia', reference: BAC_REF },
    { date: '2025-09-03', amount: 1575, method: 'Transferencia', reference: '0439018881 996 JOSE', notes: '3 cuotas juntas' },
    // La hoja lista estos meses sin año; se asume 2025 (van entre sep-25 y ene-26).
    { date: '2025-07-01', amount: 525, notes: 'Hoja: "julio" (año asumido 2025)' },
    { date: '2025-08-01', amount: 525, notes: 'Hoja: "agosto" (año asumido 2025)' },
    { date: '2025-09-01', amount: 525, notes: 'Hoja: "septiembre" (año asumido 2025)' },
    { date: '2025-10-01', amount: 525, notes: 'Hoja: "octubre" (año asumido 2025)' },
    { date: '2025-11-01', amount: 525, notes: 'Hoja: "noviembre" (año asumido 2025)' },
    { date: '2025-12-01', amount: 525, notes: 'Hoja: "diciembre" (año asumido 2025)' },
    { date: '2026-01-01', amount: 525, notes: 'Hoja: "ene-26"' },
    { date: '2026-02-01', amount: 525, notes: 'Hoja: "feb-26"' },
  ],
}

// ── 2. Préstamo de Auto/Moto ─────────────────────────────────────────────────
// Banco, préstamo 0000548238. 79 letras de 271.51; 59 pagadas, 20 pendientes.
// El banco reporta saldo actual 5,690.69 → totalAmount = 59*271.51 + 5,690.69
// = 21,709.78 (algo más que 79*271.51 por intereses y cargos).
// Las 59 cuotas se generan mensuales desde el primer pago (5-jul-2021); la hoja
// del banco no trae el detalle fecha por fecha.
const autoPayments: SeedPayment[] = Array.from({ length: 59 }, (_, i) => {
  const start = new Date(Date.UTC(2021, 6, 5, 12)) // 5 jul 2021
  const dt = new Date(start)
  dt.setUTCMonth(dt.getUTCMonth() + i)
  return {
    date: dt.toISOString().slice(0, 10),
    amount: 271.51,
    method: 'Débito automático',
    notes: 'Cuota generada del plan del banco (fecha estimada)',
  }
})

const auto: SeedLoan = {
  name: 'Préstamo de Auto/Moto',
  kind: LoanKind.BANCARIO,
  counterparty: 'Banco',
  reference: '0000548238',
  principal: 18495.26,
  interest: 3214.52,
  totalAmount: 21709.78,
  installmentAmount: 271.51,
  installmentsTotal: 79,
  interestRate: 8.5,
  startDate: '2021-05-29',
  firstPaymentDate: '2021-07-05',
  dueDate: '2028-01-05',
  unit: 'Salario Personal',
  category: 'Préstamos',
  notes:
    'Estado de cuenta del banco: 59 cuotas pagadas, 20 pendientes, saldo 5,690.69. ' +
    'Las fechas de las 59 cuotas son estimadas (mensuales desde el primer pago).',
  payments: autoPayments,
}

// ── 3. Préstamo Carlos ───────────────────────────────────────────────────────
// Dos tablas que son un solo plan de 32 cuotas de 420 = 13,440:
//   Carlos 1: 8,000 capital + 2,080 interés = 10,080 → 24 cuotas
//   Carlos 2: 2,500 capital +   860 interés =  3,360 →  8 cuotas
// 24 cuotas pagadas = 10,080; saldo 3,360.
// La hoja no trae fechas, así que las 24 cuotas van consolidadas en una fila.
const carlos: SeedLoan = {
  name: 'Préstamo Carlos',
  kind: LoanKind.PERSONAL,
  counterparty: 'Carlos',
  principal: 10500,
  interest: 2940,
  totalAmount: 13440,
  installmentAmount: 420,
  installmentsTotal: 32,
  unit: 'Salario Personal',
  category: 'Préstamos',
  notes:
    'Carlos 1: 8,000 + 2,080 interés = 10,080 (24 cuotas). ' +
    'Carlos 2: 2,500 + 860 interés = 3,360 (8 cuotas). Total 32 cuotas de 420.',
  payments: [
    {
      date: '2026-07-01',
      amount: 10080,
      kind: LoanPaymentKind.CUOTA,
      notes: '24 cuotas de $420 ya pagadas (Carlos 1) — la hoja no trae las fechas individuales',
    },
  ],
}

// ── 4. Finca Emperador ───────────────────────────────────────────────────────
// Plan: 98,436 = 20,000 inicial + 40 cuotas de 1,500 (60,000) + 3 abonos
// anuales de 6,000 (18,000) + último pago de 436.
// Pagado: 20,000 inicial + 26 cuotas (39,000) + 7,000 extraordinarios = 66,000.
// Saldo 32,436 (confirmado por el dueño el 16-jul-2026).
const fincaCuotas: SeedPayment[] = [
  '2024-05-01', '2024-06-03', '2024-07-17', '2024-08-17', '2024-09-22', '2024-10-18',
  '2024-11-13', // hoja: "13 FEB-12 SEP" (ilegible) — se asume 13-nov-24
  '2024-12-16', '2025-01-20', '2025-02-17', '2025-03-19', '2025-04-22', '2025-05-23',
  '2025-06-20', '2025-07-16', '2025-08-16', '2025-09-22', '2025-10-17', '2025-11-17',
  '2025-12-17', '2026-01-15', '2026-02-18', '2026-03-18', '2026-04-18', '2026-05-18',
  '2026-06-17',
].map(date => ({ date, amount: 1500 }))

const finca: SeedLoan = {
  name: 'Finca Emperador',
  kind: LoanKind.PROPIEDAD,
  counterparty: 'Finca Emperador',
  principal: 98436,
  interest: 0,
  totalAmount: 98436,
  downPayment: 20000,
  installmentAmount: 1500,
  installmentsTotal: 40,
  startDate: '2024-05-01',
  unit: 'Salario Personal',
  category: 'Propiedades',
  notes:
    'Plan 3 años y 4 meses: 20,000 inicial + 40 cuotas de 1,500 + 3 abonos anuales de 6,000 + último pago de 436. ' +
    'Pagado 66,000 · saldo 32,436.',
  payments: [
    ...fincaCuotas,
    { date: '2026-01-02', amount: 6000, kind: LoanPaymentKind.EXTRAORDINARIO, notes: 'Abono anual 2024' },
    { date: '2026-04-18', amount: 1000, kind: LoanPaymentKind.EXTRAORDINARIO, notes: 'Abono anual 2025 (parcial)' },
  ],
}

const LOANS: SeedLoan[] = [yesenia, auto, carlos, finca]

async function main() {
  for (const l of LOANS) {
    await prisma.personalLoan.deleteMany({ where: { name: l.name } })

    const cuotas = l.payments
      .filter(p => (p.kind ?? LoanPaymentKind.CUOTA) === LoanPaymentKind.CUOTA)
      .reduce((s, p) => s + p.amount, 0)
    const paid =
      (l.downPayment ?? 0) + l.payments.reduce((s, p) => s + p.amount, 0)
    const balance = Math.round((l.totalAmount - paid) * 100) / 100

    await prisma.personalLoan.create({
      data: {
        name: l.name,
        kind: l.kind,
        status: balance <= 0.01 ? LoanStatus.PAGADO : LoanStatus.ACTIVO,
        counterparty: l.counterparty,
        reference: l.reference,
        principal: l.principal,
        interest: l.interest ?? 0,
        totalAmount: l.totalAmount,
        downPayment: l.downPayment ?? 0,
        installmentAmount: l.installmentAmount,
        installmentsTotal: l.installmentsTotal,
        interestRate: l.interestRate,
        startDate: l.startDate ? d(l.startDate) : null,
        firstPaymentDate: l.firstPaymentDate ? d(l.firstPaymentDate) : null,
        dueDate: l.dueDate ? d(l.dueDate) : null,
        unit: l.unit,
        category: l.category,
        notes: l.notes,
        payments: {
          create: l.payments.map(p => ({
            date: d(p.date),
            amount: p.amount,
            kind: p.kind ?? LoanPaymentKind.CUOTA,
            method: p.method,
            reference: p.reference,
            notes: p.notes,
          })),
        },
      },
    })

    const cuotasPagadas = l.installmentAmount ? Math.floor(cuotas / l.installmentAmount) : 0
    console.log(
      `✔ ${l.name.padEnd(24)} total ${l.totalAmount.toFixed(2).padStart(10)} · ` +
        `pagado ${paid.toFixed(2).padStart(10)} · saldo ${balance.toFixed(2).padStart(10)} · ` +
        `cuotas ${cuotasPagadas}/${l.installmentsTotal ?? '-'}`
    )
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
