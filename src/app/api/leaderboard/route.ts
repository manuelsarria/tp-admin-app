import { NextRequest, NextResponse } from 'next/server'
import { getTpLeaderboard, isLeaderboardAuthorized, parsePeriod } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

// Single-system (TP) leaderboard. Token- or session-gated.
export async function GET(request: NextRequest) {
  try {
    if (!(await isLeaderboardAuthorized(request))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const period = parsePeriod(request.nextUrl.searchParams.get('period'))
    const payload = await getTpLeaderboard(period)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error al obtener leaderboard:', error)
    return NextResponse.json({ error: 'Error al obtener el leaderboard' }, { status: 500 })
  }
}
