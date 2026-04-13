export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

async function generateHblNumber(): Promise<string> {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `HBLCH${yy}${mm}`
  const count = await prisma.lclBooking.count({
    where: { hblNumber: { startsWith: `HBLCH${yy}` } },
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
    const containerId = searchParams.get('containerId') || ''
    const unassigned = searchParams.get('unassigned') === 'true'
    const month = searchParams.get('month') || ''
    const year = searchParams.get('year') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { hblNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { shipperName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status
    if (containerId) where.lclContainerId = containerId
    if (unassigned) where.lclContainerId = null

    if (year) {
      const y = parseInt(year)
      const m = month ? parseInt(month) : null
      if (m) {
        where.createdAt = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
      } else {
        where.createdAt = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) }
      }
    }

    const bookings = await prisma.lclBooking.findMany({
      where,
      include: { lclContainer: { select: { id: true, mblNumber: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    })

    // Stats
    const statsRaw = await prisma.lclBooking.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const stats: Record<string, number> = {
      PENDING: 0,
      IN_WAREHOUSE: 0,
      ASSIGNED: 0,
      SHIPPED: 0,
      ARRIVED: 0,
      DELIVERED: 0,
    }
    statsRaw.forEach(s => { stats[s.status] = s._count.id })

    return NextResponse.json({ bookings, stats })
  } catch (error) {
    console.error('GET /api/lcl-bookings error:', error)
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

    if (!body.shipperName || !body.clientName) {
      return NextResponse.json({ error: 'shipperName and clientName are required' }, { status: 400 })
    }

    const hblNumber = await generateHblNumber()

    const booking = await prisma.lclBooking.create({
      data: {
        hblNumber,
        warehouseEntryId: body.warehouseEntryId || null,
        shipperName: body.shipperName,
        shipperAddress: body.shipperAddress || null,
        clientId: body.clientId || null,
        clientType: body.clientType || null,
        clientName: body.clientName,
        clientAddress: body.clientAddress || null,
        notifyParty: body.notifyParty || null,
        notifyPhone: body.notifyPhone || null,
        portOfLoading: body.portOfLoading || 'QINGDAO',
        portOfDischarge: body.portOfDischarge || 'BALBOA',
        placeOfReceipt: body.placeOfReceipt || null,
        placeOfDelivery: body.placeOfDelivery || null,
        preCarriageBy: body.preCarriageBy || null,
        vessel: body.vessel || null,
        voyage: body.voyage || null,
        description: body.description || null,
        marks: body.marks || null,
        packages: body.packages ? parseInt(body.packages) : 1,
        packageType: body.packageType || 'CTNS',
        grossWeightKg: body.grossWeightKg ? parseFloat(body.grossWeightKg) : null,
        cbm: body.cbm ? parseFloat(body.cbm) : null,
        hsCode: body.hsCode || null,
        freightTerms: body.freightTerms || 'PREPAID',
        freightAmount: body.freightAmount ? parseFloat(body.freightAmount) : null,
        freightCurrency: body.freightCurrency || 'USD',
        freightDesc: body.freightDesc || null,
        exportReference: body.exportReference || null,
        documentNumber: body.documentNumber || null,
        status: 'PENDING',
        coordinatorId: session.user.id || null,
        coordinatorName: session.user.name || null,
        notes: body.notes || null,
        blDate: body.blDate ? new Date(body.blDate) : null,
      },
    })

    // Link WarehouseEntry if provided
    if (body.warehouseEntryId) {
      await prisma.warehouseEntry.update({
        where: { id: body.warehouseEntryId },
        data: { lclBookingId: booking.id, status: 'IN_TRANSIT' },
      })
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('POST /api/lcl-bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
