export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const q = request.nextUrl.searchParams.get('q')?.trim()
    if (!q) return NextResponse.json({ error: 'Parámetro de búsqueda requerido' }, { status: 400 })

    // Search by tracking/WH, mailbox, or container number
    const fclShipment = await prisma.fclShipment.findFirst({
      where: {
        OR: [
          { trackingWarehouse: { equals: q, mode: 'insensitive' } },
          { mailbox: { equals: q, mode: 'insensitive' } },
          { containerNumber: { equals: q, mode: 'insensitive' } },
          { additionalCode: { equals: q, mode: 'insensitive' } },
        ],
      },
      include: { company: { select: { name: true, company_id: true } } },
    })

    if (!fclShipment) {
      return NextResponse.json({ error: 'No se encontró envío con ese número' }, { status: 404 })
    }

    // Find cargo management for container status
    const cargoMgmt = await prisma.cargoManagement.findFirst({
      where: { referenceNo: fclShipment.containerNumber },
      include: { statusHistory: { orderBy: { changedAt: 'asc' } } },
    })

    return NextResponse.json({
      trackingWarehouse: fclShipment.trackingWarehouse,
      mailbox: fclShipment.mailbox,
      containerNumber: fclShipment.containerNumber,
      transportType: fclShipment.transportType,
      companyName: fclShipment.company?.name || null,
      totalCbm: fclShipment.totalCbm,
      totalWeight: fclShipment.totalWeight,
      additionalCode: fclShipment.additionalCode,
      fclCreatedAt: fclShipment.createdAt,
      status: cargoMgmt?.status || 'RECEIVED_IN_WAREHOUSE',
      location: cargoMgmt?.location || '',
      eta: cargoMgmt?.eta,
      departureDate: cargoMgmt?.departureDate,
      statusHistory: cargoMgmt?.statusHistory || [],
    })
  } catch (error) {
    console.error('GET /api/tracking-internal error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
