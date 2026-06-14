import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function panamaDateKey(d = new Date()) {
  // en-CA locale gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Panama' }).format(d)
}

type Action = 'CLOCK_IN' | 'LUNCH_OUT' | 'LUNCH_IN' | 'CLOCK_OUT'
type NextAction = Action | 'DONE'
type Status = 'OUT' | 'WORKING' | 'LUNCH' | 'FINISHED'

interface ShiftShape {
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

function deriveState(shift: ShiftShape | null): { nextAction: NextAction; status: Status } {
  if (!shift || !shift.clockIn) {
    return { nextAction: 'CLOCK_IN', status: 'OUT' }
  }
  // A clock-out always finishes the day — even if lunch was never punched.
  if (shift.clockOut) {
    return { nextAction: 'DONE', status: 'FINISHED' }
  }
  if (!shift.lunchStart) {
    return { nextAction: 'LUNCH_OUT', status: 'WORKING' }
  }
  if (!shift.lunchEnd) {
    return { nextAction: 'LUNCH_IN', status: 'LUNCH' }
  }
  return { nextAction: 'CLOCK_OUT', status: 'WORKING' }
}

// ---------------------------------------------------------------------------
// GET — current user's today shift + state
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const today = panamaDateKey()

    const shift = await prisma.workShift.findUnique({
      where: {
        userId_workDate: {
          userId: session.user.id,
          workDate: today,
        },
      },
    })

    const { nextAction, status } = deriveState(shift as ShiftShape | null)

    return NextResponse.json({ shift, today, nextAction, status })
  } catch (error) {
    console.error('Error fetching asistencia:', error)
    return NextResponse.json({ error: 'Error al obtener asistencia' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — punch action for current user
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body as { action: Action }

    const validActions: Action[] = ['CLOCK_IN', 'LUNCH_OUT', 'LUNCH_IN', 'CLOCK_OUT']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
    }

    const today = panamaDateKey()
    const userId = session.user.id
    const now = new Date()

    // Fetch existing shift (if any) to validate sequence
    const existing = await prisma.workShift.findUnique({
      where: { userId_workDate: { userId, workDate: today } },
    })

    const shift = existing as ShiftShape | null

    // Validate ordering: each action requires the previous punch to exist
    // and the target field to be absent
    const validationError = validateAction(action, shift)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Map action → field name
    const fieldMap: Record<Action, keyof Pick<ShiftShape, 'clockIn' | 'lunchStart' | 'lunchEnd' | 'clockOut'>> = {
      CLOCK_IN: 'clockIn',
      LUNCH_OUT: 'lunchStart',
      LUNCH_IN: 'lunchEnd',
      CLOCK_OUT: 'clockOut',
    }
    const field = fieldMap[action]

    const updated = await prisma.workShift.upsert({
      where: { userId_workDate: { userId, workDate: today } },
      create: {
        userId,
        userName: session.user.name ?? session.user.email ?? 'Trabajador',
        workDate: today,
        [field]: now,
      },
      update: {
        [field]: now,
      },
    })

    const { nextAction, status } = deriveState(updated as ShiftShape)

    return NextResponse.json({ shift: updated, today, nextAction, status })
  } catch (error) {
    console.error('Error registrando asistencia:', error)
    return NextResponse.json({ error: 'Error al registrar asistencia' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Sequence validation
// ---------------------------------------------------------------------------

function validateAction(action: Action, shift: ShiftShape | null): string | null {
  switch (action) {
    case 'CLOCK_IN':
      if (shift?.clockIn) return 'Ya registró su entrada hoy'
      return null

    case 'LUNCH_OUT':
      if (!shift?.clockIn) return 'Acción no válida en este momento: debe registrar entrada primero'
      if (shift.lunchStart) return 'Ya registró su salida a almuerzo hoy'
      return null

    case 'LUNCH_IN':
      if (!shift?.lunchStart) return 'Acción no válida en este momento: debe registrar salida a almuerzo primero'
      if (shift.lunchEnd) return 'Ya registró su regreso de almuerzo hoy'
      return null

    case 'CLOCK_OUT':
      if (!shift?.clockIn) return 'Acción no válida en este momento: debe registrar entrada primero'
      if (shift.clockOut) return 'Ya registró su salida hoy'
      return null

    default:
      return 'Acción no válida en este momento'
  }
}
