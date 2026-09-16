export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { nextMblNumber, createWithBlNumber } from '@/lib/blNumber'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const origin = searchParams.get('origin') || ''

    const where: any = {}
    if (origin) where.origin = origin

    if (search) {
      where.OR = [
        { mblNumber: { contains: search, mode: 'insensitive' } },
        { containerNumber: { contains: search, mode: 'insensitive' } },
        { vessel: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status

    const containers = await prisma.lclContainer.findMany({
      where,
      include: {
        bookings: {
          select: {
            id: true,
            hblNumber: true,
            clientName: true,
            packages: true,
            grossWeightKg: true,
            cbm: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Stats (respetan el filtro de origen)
    const statsRaw = await prisma.lclContainer.groupBy({
      by: ['status'],
      where: origin ? { origin: origin as any } : undefined,
      _count: { id: true },
    })

    const stats: Record<string, number> = {
      OPEN: 0,
      LOADING: 0,
      CLOSED: 0,
      IN_TRANSIT: 0,
      ARRIVED: 0,
      COMPLETED: 0,
    }
    statsRaw.forEach(s => { stats[s.status] = s._count.id })

    return NextResponse.json({ containers, stats })
  } catch (error) {
    console.error('GET /api/lcl-containers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const origin: 'CHINA' | 'PANAMA' = body.origin === 'PANAMA' ? 'PANAMA' : 'CHINA'

    const container = await createWithBlNumber(async () => prisma.lclContainer.create({
      data: {
        mblNumber: await nextMblNumber(origin),
        origin,
        containerNumber: body.containerNumber || null,
        seal: body.seal || null,
        vessel: body.vessel || null,
        voyage: body.voyage || null,
        portOfLoading: body.portOfLoading || 'QINGDAO',
        portOfDischarge: body.portOfDischarge || 'BALBOA',
        shipperName: body.shipperName || null,
        shipperAddress: body.shipperAddress || null,
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        status: 'OPEN',
        notes: body.notes || null,
      },
    }))

    return NextResponse.json(container, { status: 201 })
  } catch (error) {
    console.error('POST /api/lcl-containers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
