export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

async function generateWrNumber(origin = 'CH'): Promise<string> {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `WR${origin}${yy}${mm}`
  const count = await prisma.warehouseEntry.count({
    where: { wrNumber: { startsWith: `WR${origin}${yy}` } },
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
    const month = searchParams.get('month') || ''
    const year = searchParams.get('year') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { wrNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { consigneeName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (year) {
      const y = parseInt(year)
      const m = month ? parseInt(month) : null
      if (m) {
        const start = new Date(y, m - 1, 1)
        const end = new Date(y, m, 1)
        where.createdAt = { gte: start, lt: end }
      } else {
        where.createdAt = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) }
      }
    }

    const entries = await prisma.warehouseEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Stats
    const stats = await prisma.warehouseEntry.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statMap: Record<string, number> = {
      IN_WAREHOUSE: 0,
      IN_TRANSIT: 0,
      ARRIVED: 0,
      DELIVERED: 0,
    }
    stats.forEach(s => { statMap[s.status] = s._count.id })

    return NextResponse.json({ entries, stats: statMap })
  } catch (error) {
    console.error('GET /api/warehouse error:', error)
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
    const {
      clientId,
      clientType,
      clientName,
      consigneeName,
      description,
      pieces,
      pieceType,
      weight,
      largo,
      ancho,
      alto,
      unidadMedida,
      destWarehouse,
      notes,
    } = body

    if (!clientName) {
      return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
    }

    const wrNumber = await generateWrNumber('CH')

    const entry = await prisma.warehouseEntry.create({
      data: {
        wrNumber,
        clientId: clientId || null,
        clientType: clientType || null,
        clientName,
        consigneeName: consigneeName || null,
        description: description || null,
        pieces: pieces ? parseInt(pieces) : 1,
        pieceType: pieceType || 'Cajas',
        weight: weight ? parseFloat(weight) : null,
        largo: largo ? parseFloat(largo) : null,
        ancho: ancho ? parseFloat(ancho) : null,
        alto: alto ? parseFloat(alto) : null,
        unidadMedida: unidadMedida || 'cm',
        originWarehouse: 'CHINA',
        destWarehouse: destWarehouse || null,
        status: 'IN_WAREHOUSE',
        coordinatorId: session.user.id || null,
        coordinatorName: session.user.name || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('POST /api/warehouse error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
