import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function panamaDateKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Panama' }).format(d)
}

/** Returns elapsed minutes between two dates, or null if either is missing */
function minutesBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null
  return Math.floor((end.getTime() - start.getTime()) / 60_000)
}

interface ShiftRow {
  id: string
  userId: string
  userName: string | null
  workDate: string
  clockIn: Date | null
  lunchStart: Date | null
  lunchEnd: Date | null
  clockOut: Date | null
  note: string | null
  createdAt: Date
  updatedAt: Date
}

function computeShift(shift: ShiftRow) {
  const lunchMinutes =
    shift.lunchStart && shift.lunchEnd
      ? minutesBetween(shift.lunchStart, shift.lunchEnd)
      : 0

  // Effective end: clockOut if recorded, otherwise now
  const effectiveEnd = shift.clockOut ?? new Date()

  const totalMinutes = shift.clockIn
    ? minutesBetween(shift.clockIn, effectiveEnd)
    : null

  const workedMinutes =
    totalMinutes !== null ? Math.max(0, totalMinutes - (lunchMinutes ?? 0)) : null

  return {
    ...shift,
    lunchMinutes: lunchMinutes ?? 0,
    workedMinutes,
  }
}

// ---------------------------------------------------------------------------
// GET — admin team attendance report
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const today = panamaDateKey()

    const dateParam = searchParams.get('date')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const userIdParam = searchParams.get('userId')

    // Build the workDate filter
    let workDateFilter: { equals?: string; gte?: string; lte?: string }

    if (fromParam || toParam) {
      // Range query
      workDateFilter = {
        ...(fromParam ? { gte: fromParam } : {}),
        ...(toParam ? { lte: toParam } : {}),
      }
    } else {
      // Single date (explicit or today)
      workDateFilter = { equals: dateParam ?? today }
    }

    const shifts = await prisma.workShift.findMany({
      where: {
        workDate: workDateFilter,
        ...(userIdParam ? { userId: userIdParam } : {}),
      },
      orderBy: [{ workDate: 'desc' }, { userName: 'asc' }],
    })

    const shiftsWithComputed = (shifts as ShiftRow[]).map(computeShift)

    // For single-date queries return date; for range queries return the range
    const responseDate =
      fromParam || toParam
        ? { from: fromParam ?? null, to: toParam ?? null }
        : (dateParam ?? today)

    return NextResponse.json({ date: responseDate, shifts: shiftsWithComputed })
  } catch (error) {
    console.error('Error fetching reporte asistencia:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte de asistencia' },
      { status: 500 }
    )
  }
}
