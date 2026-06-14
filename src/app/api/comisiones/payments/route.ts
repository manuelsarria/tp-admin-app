import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const round2 = (n: number) => Math.round(n * 100) / 100

// GET - List all commission payments (ADMIN only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const payments = await prisma.commissionPayment.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error al obtener pagos de comisiones:', error)
    return NextResponse.json({ error: 'Error al obtener los pagos' }, { status: 500 })
  }
}

// POST - Pay out all pending sales for a worker (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { workerId, note } = body

    if (!workerId) {
      return NextResponse.json(
        { error: 'El ID del trabajador es requerido' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Everything (read pending → sum → create payment → mark PAID) runs inside a
    // single transaction. The updateMany re-filters on status:'PENDING' and we
    // assert the affected count, so two concurrent payouts can't double-pay the
    // same sales — the loser sees a count mismatch and rolls back.
    const NO_PENDING = 'NO_PENDING'
    const RACE = 'RACE'
    try {
      const payment = await prisma.$transaction(async (tx) => {
        const pendingSales = await tx.commissionSale.findMany({
          where: { workerId, status: 'PENDING' },
        })

        if (pendingSales.length === 0) throw new Error(NO_PENDING)

        const amount = round2(
          pendingSales.reduce((acc, s) => acc + s.commissionAmount, 0)
        )
        if (amount <= 0) throw new Error(NO_PENDING)

        const saleIds = pendingSales.map((s) => s.id)
        const workerName = pendingSales[0].workerName

        const created = await tx.commissionPayment.create({
          data: {
            workerId,
            workerName,
            amount,
            note: note ?? null,
            paidById: session.user.id,
            paidByName: session.user.name ?? '',
          },
        })

        const { count } = await tx.commissionSale.updateMany({
          where: { id: { in: saleIds }, status: 'PENDING' },
          data: { status: 'PAID', paidAt: now, paymentId: created.id },
        })

        // Someone else settled some of these sales concurrently → abort.
        if (count !== saleIds.length) throw new Error(RACE)

        return created
      })

      return NextResponse.json(payment, { status: 201 })
    } catch (txError: any) {
      if (txError?.message === NO_PENDING) {
        return NextResponse.json(
          { error: 'No hay ventas pendientes para este trabajador' },
          { status: 400 }
        )
      }
      if (txError?.message === RACE) {
        return NextResponse.json(
          { error: 'Las comisiones cambiaron mientras se procesaba el pago. Intenta de nuevo.' },
          { status: 409 }
        )
      }
      throw txError
    }
  } catch (error) {
    console.error('Error al registrar pago de comisiones:', error)
    return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 })
  }
}
