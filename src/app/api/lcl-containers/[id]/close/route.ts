export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function POST(
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
    })

    if (!container) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!['OPEN', 'LOADING'].includes(container.status)) {
      return NextResponse.json({ error: 'Container is not in OPEN or LOADING status' }, { status: 400 })
    }

    const updated = await prisma.lclContainer.update({
      where: { id: params.id },
      data: { status: 'CLOSED' },
    })

    // Update all assigned bookings to SHIPPED
    await prisma.lclBooking.updateMany({
      where: { lclContainerId: params.id, status: 'ASSIGNED' },
      data: { status: 'SHIPPED' },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('POST /api/lcl-containers/[id]/close error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
