export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { sanitizeStamps } from '@/lib/hblStamps'
import { nextHblNumber, createWithBlNumber } from '@/lib/blNumber'
import { authOptions } from '@/lib/auth-options'

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
    const origin = searchParams.get('origin') || ''

    const where: any = {}
    if (origin) where.origin = origin

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

    // Stats (respetan el filtro de origen)
    const statsRaw = await prisma.lclBooking.groupBy({
      by: ['status'],
      where: origin ? { origin: origin as any } : undefined,
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

    const origin: 'CHINA' | 'PANAMA' = body.origin === 'PANAMA' ? 'PANAMA' : 'CHINA'

    // En Panamá el HBL nace asignado a un MBL: no existe HBL de Panamá suelto.
    if (origin === 'PANAMA' && !body.lclContainerId) {
      return NextResponse.json({ error: 'Debe seleccionar un MBL para el HBL de Panamá' }, { status: 400 })
    }

    const cargoItems: any[] = Array.isArray(body.cargoItems) ? body.cargoItems : []

    // El número se pide DENTRO del reintento: si dos HBL llegan juntos, el que
    // pierde vuelve a pedirlo y toma el siguiente en vez de fallar.
    const booking = await createWithBlNumber(async () => prisma.lclBooking.create({
      data: {
        hblNumber: await nextHblNumber(origin),
        warehouseEntryId: body.warehouseEntryId || null,
        shipperName: body.shipperName,
        shipperAddress: body.shipperAddress || null,
        clientId: body.clientId || null,
        clientType: body.clientType || null,
        clientName: body.clientName,
        clientAddress: body.clientAddress || null,
        clientRuc: body.clientRuc || null,
        clientDv: body.clientDv || null,
        clientEmail: body.clientEmail || null,
        notifyParty: body.notifyParty || null,
        notifyAddress: body.notifyAddress || null,
        notifyRuc: body.notifyRuc || null,
        notifyDv: body.notifyDv || null,
        notifyEmail: body.notifyEmail || null,
        notifyPhone: body.notifyPhone || null,
        forwardingAgent: body.forwardingAgent || null,
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
        status: origin === 'PANAMA' ? 'ASSIGNED' : 'PENDING',
        origin,
        lclContainerId: body.lclContainerId || null,
        coordinatorId: session.user.id || null,
        coordinatorName: session.user.name || null,
        notes: body.notes || null,
        blDate: body.blDate ? new Date(body.blDate) : null,
        omitQr: !!body.omitQr,
        groupedCargo: !!body.groupedCargo,
        stamps: sanitizeStamps(body.stamps) as any,
        cargoItems: cargoItems.length
          ? {
              create: cargoItems.map((it: any, i: number) => ({
                hsCode: it.hsCode || null,
                description: it.description || '',
                // parseInt('2 cajas') da NaN y Prisma rechaza la fila entera;
                // se cae a los valores neutros en vez de reventar el HBL.
                packages: Number.isFinite(parseInt(it.packages)) ? parseInt(it.packages) : 1,
                packageType: it.packageType || null,
                grossWeightKg: Number.isFinite(parseFloat(it.grossWeightKg)) ? parseFloat(it.grossWeightKg) : null,
                cbm: Number.isFinite(parseFloat(it.cbm)) ? parseFloat(it.cbm) : null,
                marks: it.marks || null,
                position: i,
              })),
            }
          : undefined,
      },
    }))

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
