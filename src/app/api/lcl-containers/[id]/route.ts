export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const container = await prisma.lclContainer.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!container) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(container)
  } catch (error) {
    console.error('GET /api/lcl-containers/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const container = await prisma.lclContainer.update({
      where: { id: params.id },
      data: {
        ...(body.containerNumber !== undefined && { containerNumber: body.containerNumber || null }),
        ...(body.seal !== undefined && { seal: body.seal || null }),
        ...(body.vessel !== undefined && { vessel: body.vessel || null }),
        ...(body.voyage !== undefined && { voyage: body.voyage || null }),
        ...(body.portOfLoading !== undefined && { portOfLoading: body.portOfLoading }),
        ...(body.portOfDischarge !== undefined && { portOfDischarge: body.portOfDischarge }),
        ...(body.etd !== undefined && { etd: body.etd ? new Date(body.etd) : null }),
        ...(body.eta !== undefined && { eta: body.eta ? new Date(body.eta) : null }),
        ...(body.closingDate !== undefined && { closingDate: body.closingDate ? new Date(body.closingDate) : null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    return NextResponse.json(container)
  } catch (error) {
    console.error('PUT /api/lcl-containers/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Unassign all bookings from container
    await prisma.lclBooking.updateMany({
      where: { lclContainerId: params.id },
      data: { lclContainerId: null, status: 'PENDING' },
    })

    await prisma.lclContainer.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/lcl-containers/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
