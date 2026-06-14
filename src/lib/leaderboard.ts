import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Shared logic for the team leaderboard / office screen. Lives in lib (not in a
// route.ts) because Next.js App Router only allows route handlers to be exported
// from route files.

export const round2 = (n: number) => Math.round(n * 100) / 100

// ── Panama time helpers ───────────────────────────────────────────────────────
function monthStartISO() {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Panama',
    year: 'numeric',
    month: '2-digit',
  })
  const [y, m] = f.format(new Date()).split('-')
  return new Date(`${y}-${m}-01T00:00:00-05:00`)
}

function panamaDateKey(d: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Panama' }).format(d)
}

export type Period = 'month' | 'all' | 'today'

export function parsePeriod(raw: string | null): Period {
  return raw === 'all' ? 'all' : raw === 'today' ? 'today' : 'month'
}

function buildCreatedAtFilter(period: Period) {
  if (period === 'month') return { gte: monthStartISO() }
  if (period === 'today') {
    const todayKey = panamaDateKey()
    return {
      gte: new Date(`${todayKey}T00:00:00-05:00`),
      lte: new Date(`${todayKey}T23:59:59.999-05:00`),
    }
  }
  return undefined // 'all'
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SellerRow {
  name: string
  sales: number
  commission: number
  count: number
  pending: number
  paid: number
}

export interface TotalsRow {
  sales: number
  commission: number
  pending: number
  paid: number
  count: number
}

export interface TeamStats {
  tasksCompletedToday: number
  tasksPending: number
  tasksOverdue: number
  workingNow: number
  workingNames: string[]
}

export interface TpLeaderboardPayload {
  system: 'TP'
  period: Period
  generatedAt: string
  sellers: SellerRow[]
  totals: TotalsRow
  team: TeamStats
}

// ── Core aggregation ──────────────────────────────────────────────────────────
export async function getTpLeaderboard(period: Period): Promise<TpLeaderboardPayload> {
  const createdAtFilter = buildCreatedAtFilter(period)
  const now = new Date()

  const sales = await prisma.commissionSale.findMany({
    where: createdAtFilter ? { createdAt: createdAtFilter } : undefined,
    select: {
      workerName: true,
      saleAmount: true,
      commissionAmount: true,
      status: true,
    },
  })

  const map = new Map<
    string,
    { sales: number; commission: number; count: number; pending: number; paid: number }
  >()

  for (const row of sales) {
    const key = row.workerName?.trim() || 'Sin nombre'
    const existing = map.get(key) ?? { sales: 0, commission: 0, count: 0, pending: 0, paid: 0 }
    existing.sales += row.saleAmount
    existing.commission += row.commissionAmount
    existing.count += 1
    if (row.status === 'PENDING') existing.pending += row.commissionAmount
    if (row.status === 'PAID') existing.paid += row.commissionAmount
    map.set(key, existing)
  }

  const sellers: SellerRow[] = Array.from(map.entries())
    .map(([name, agg]) => ({
      name,
      sales: round2(agg.sales),
      commission: round2(agg.commission),
      count: agg.count,
      pending: round2(agg.pending),
      paid: round2(agg.paid),
    }))
    .sort((a, b) => b.commission - a.commission)

  const totals: TotalsRow = {
    sales: round2(sellers.reduce((acc, s) => acc + s.sales, 0)),
    commission: round2(sellers.reduce((acc, s) => acc + s.commission, 0)),
    pending: round2(sellers.reduce((acc, s) => acc + s.pending, 0)),
    paid: round2(sellers.reduce((acc, s) => acc + s.paid, 0)),
    count: sellers.reduce((acc, s) => acc + s.count, 0),
  }

  const todayKey = panamaDateKey(now)
  const todayStart = new Date(`${todayKey}T00:00:00-05:00`)
  const todayEnd = new Date(`${todayKey}T23:59:59.999-05:00`)

  const [tasksCompletedToday, tasksPending, tasksOverdue, shiftsToday] = await Promise.all([
    prisma.teamTask.count({
      where: { status: 'DONE', completedAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.teamTask.count({ where: { status: { not: 'DONE' } } }),
    prisma.teamTask.count({ where: { status: { not: 'DONE' }, dueDate: { lt: now } } }),
    prisma.workShift.findMany({
      where: { workDate: todayKey, clockIn: { not: null }, clockOut: null },
      select: { userName: true },
    }),
  ])

  const team: TeamStats = {
    tasksCompletedToday,
    tasksPending,
    tasksOverdue,
    workingNow: shiftsToday.length,
    workingNames: shiftsToday.map((s) => s.userName).filter(Boolean) as string[],
  }

  return {
    system: 'TP',
    period,
    generatedAt: new Date().toISOString(),
    sellers,
    totals,
    team,
  }
}

// ── Auth: shared token OR ADMIN/WORKER session ────────────────────────────────
export async function isLeaderboardAuthorized(request: NextRequest): Promise<boolean> {
  const token = process.env.LEADERBOARD_TOKEN
  if (token) {
    const queryToken = request.nextUrl.searchParams.get('token')
    if (queryToken === token) return true
    const authHeader = request.headers.get('authorization') ?? ''
    if (authHeader === `Bearer ${token}`) return true
  }
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (session?.user?.id && (role === 'ADMIN' || role === 'WORKER')) return true
  return false
}
