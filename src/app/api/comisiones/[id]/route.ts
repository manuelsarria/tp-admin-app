import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH - Update sale status (ADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || (status !== 'PENDING' && status !== 'PAID')) {
      return NextResponse.json(
        { error: 'El estado debe ser PENDING o PAID' },
        { status: 400 }
      )
    }

    // Verify sale exists
    const existing = await prisma.commissionSale.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    const sale = await prisma.commissionSale.update({
      where: { id: params.id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
        // Reverting to PENDING unlinks any prior payout so it isn't double-counted.
        ...(status === 'PENDING' ? { paymentId: null } : {}),
      },
    })

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error al actualizar venta:', error)
    return NextResponse.json({ error: 'Error al actualizar la venta' }, { status: 500 })
  }
}

// DELETE - Delete a sale (WORKER: own only; ADMIN: any)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'WORKER') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Verify sale exists
    const existing = await prisma.commissionSale.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // WORKER can only delete their own sales
    if (role === 'WORKER' && existing.workerId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // A settled (PAID) sale cannot be deleted by a worker — it would leave the
    // commission payout overstated. Only an admin may remove a paid sale.
    if (role === 'WORKER' && existing.status === 'PAID') {
      return NextResponse.json(
        { error: 'No puedes eliminar una venta con comisión ya pagada' },
        { status: 403 }
      )
    }

    await prisma.commissionSale.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    return NextResponse.json({ error: 'Error al eliminar la venta' }, { status: 500 })
  }
}
