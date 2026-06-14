import { NextRequest, NextResponse } from 'next/server'
import {
  getTpLeaderboard,
  isLeaderboardAuthorized as isAuthorized,
  parsePeriod,
  round2,
  type SellerRow,
  type TotalsRow,
} from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

// ── CNC seller shape (what we expect from the remote API) ────────────────────
interface CncSeller {
  name: string
  sales: number
  commission: number
  count: number
  pending: number
  paid: number
}

interface CncPayload {
  sellers: CncSeller[]
  totals: TotalsRow
  [key: string]: unknown
}

// ── Fetch CNC leaderboard with timeout ───────────────────────────────────────
async function fetchCnc(period: string): Promise<CncPayload | null> {
  const url = process.env.CNC_LEADERBOARD_URL
  const cncToken = process.env.CNC_LEADERBOARD_TOKEN

  if (!url) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(`${url}?period=${period}`, {
      headers: { Authorization: `Bearer ${cncToken ?? ''}` },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!res.ok) {
      console.warn(`CNC leaderboard respondió con status ${res.status}`)
      return null
    }

    const data = (await res.json()) as CncPayload
    return data
  } catch (err) {
    console.warn('Error al obtener leaderboard CNC:', err)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request)
    if (!authorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const period = parsePeriod(request.nextUrl.searchParams.get('period'))

    // Run TP aggregation and CNC fetch in parallel
    const [tp, cnc] = await Promise.all([getTpLeaderboard(period), fetchCnc(period)])

    // ── Build combined sellers list ─────────────────────────────────────────
    const tpSellers: (SellerRow & { system: 'TP' })[] = tp.sellers.map((s) => ({
      ...s,
      system: 'TP' as const,
    }))

    const cncSellers: (CncSeller & { system: 'CNC' })[] = cnc
      ? (cnc.sellers ?? []).map((s) => ({
          name: s.name ?? 'Sin nombre',
          sales: round2(s.sales ?? 0),
          commission: round2(s.commission ?? 0),
          count: s.count ?? 0,
          pending: round2(s.pending ?? 0),
          paid: round2(s.paid ?? 0),
          system: 'CNC' as const,
        }))
      : []

    const combinedSellers = [...tpSellers, ...cncSellers].sort(
      (a, b) => b.commission - a.commission
    )

    // ── Build combined totals ───────────────────────────────────────────────
    const cncTotals: TotalsRow = cnc?.totals ?? {
      sales: 0,
      commission: 0,
      pending: 0,
      paid: 0,
      count: 0,
    }

    const combinedTotals: TotalsRow = {
      sales: round2(tp.totals.sales + cncTotals.sales),
      commission: round2(tp.totals.commission + cncTotals.commission),
      pending: round2(tp.totals.pending + cncTotals.pending),
      paid: round2(tp.totals.paid + cncTotals.paid),
      count: tp.totals.count + cncTotals.count,
    }

    return NextResponse.json({
      period,
      generatedAt: new Date().toISOString(),
      systems: {
        TP: tp,
        CNC: cnc,
      },
      combined: {
        sellers: combinedSellers,
        totals: combinedTotals,
      },
    })
  } catch (error) {
    console.error('Error al obtener leaderboard combinado:', error)
    return NextResponse.json({ error: 'Error al obtener el leaderboard combinado' }, { status: 500 })
  }
}
