import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
export const dynamic = 'force-dynamic'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']
async function checkAccess() {
  const user = await getCurrentUser()
  if (!user || (user.email && !ALLOWED_EMAILS.includes(user.email || "") && user.role !== 'ADMIN')) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const dateFrom = new Date(year, 0, 1)
  const dateTo = new Date(year + 1, 0, 1)

  // All transactions for the year
  const txs = await prisma.accountingTransaction.findMany({
    where: { date: { gte: dateFrom, lt: dateTo } },
    orderBy: { date: 'asc' },
  })

  // All operations for the year
  const ops = await prisma.shipmentOperation.findMany({
    where: { createdAt: { gte: dateFrom, lt: dateTo } },
    include: { items: true },
  })

  // ── P&L ──
  const totalRevenue = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalCOGS = txs.filter(t => t.type === 'EXPENSE' && t.accountType === 'COGS').reduce((s, t) => s + t.amount, 0)
  const grossProfit = totalRevenue - totalCOGS
  const operatingExpenses = txs.filter(t => t.type === 'EXPENSE' && t.accountType === 'OPERATING_EXPENSE').reduce((s, t) => s + t.amount, 0)
  const otherIncome = txs.filter(t => t.type === 'INCOME' && t.accountType === 'OTHER_INCOME').reduce((s, t) => s + t.amount, 0)
  const otherExpenses = txs.filter(t => t.type === 'EXPENSE' && t.accountType === 'OTHER_EXPENSE').reduce((s, t) => s + t.amount, 0)
  const netIncome = grossProfit - operatingExpenses + otherIncome - otherExpenses

  // ── Monthly breakdown ──
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const monthTxs = txs.filter(t => new Date(t.date).getMonth() === i)
    const income = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    return { month: i + 1, income, expense, net: income - expense }
  })

  // ── By origin ──
  const byOrigin: Record<string, { income: number; expense: number }> = {}
  for (const t of txs) {
    if (!byOrigin[t.origin]) byOrigin[t.origin] = { income: 0, expense: 0 }
    if (t.type === 'INCOME') byOrigin[t.origin].income += t.amount
    else byOrigin[t.origin].expense += t.amount
  }

  // ── By category ──
  const byCategory: Record<string, { income: number; expense: number }> = {}
  for (const t of txs) {
    if (!byCategory[t.category]) byCategory[t.category] = { income: 0, expense: 0 }
    if (t.type === 'INCOME') byCategory[t.category].income += t.amount
    else byCategory[t.category].expense += t.amount
  }

  // ── Operations summary ──
  const operationsStats = ops.map(op => {
    const totalCost = op.items.reduce((s, i) => s + i.costoTotal, 0)
    const utilidad = op.ingresoTotal - totalCost
    return {
      id: op.id, title: op.title, clientName: op.clientName,
      clientCountry: op.clientCountry, shipmentType: op.shipmentType,
      ingresoTotal: op.ingresoTotal, totalCost, utilidad,
      rentabilidad: op.ingresoTotal > 0 ? (utilidad / op.ingresoTotal) * 100 : 0,
    }
  })

  const totalOpsRevenue = operationsStats.reduce((s, o) => s + o.ingresoTotal, 0)
  const totalOpsUtilidad = operationsStats.reduce((s, o) => s + o.utilidad, 0)

  return NextResponse.json({
    year,
    pnl: { totalRevenue, totalCOGS, grossProfit, operatingExpenses, otherIncome, otherExpenses, netIncome },
    monthly,
    byOrigin,
    byCategory,
    operations: { list: operationsStats, totalRevenue: totalOpsRevenue, totalUtilidad: totalOpsUtilidad },
    totals: { transactions: txs.length, operations: ops.length },
  })
}
