export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

async function generateMblNumber(): Promise<string> {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `MBLCH${yy}${mm}`
  const count = await prisma.lclContainer.count({
    where: { mblNumber: { startsWith: `MBLCH${yy}` } },
  })
  return `${prefix}${String(count + 1).padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}

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

    // Stats
    const statsRaw = await prisma.lclContainer.groupBy({
      by: ['status'],
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
    const mblNumber = await generateMblNumber()

    const container = await prisma.lclContainer.create({
      data: {
        mblNumber,
        containerNumber: body.containerNumber || null,
        seal: body.seal || null,
        vessel: body.vessel || null,
        voyage: body.voyage || null,
        portOfLoading: body.portOfLoading || 'QINGDAO',
        portOfDischarge: body.portOfDischarge || 'BALBOA',
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        status: 'OPEN',
        notes: body.notes || null,
      },
    })

    return NextResponse.json(container, { status: 201 })
  } catch (error) {
    console.error('POST /api/lcl-containers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
