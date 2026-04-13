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

    const booking = await prisma.lclBooking.findUnique({
      where: { id: params.id },
      include: { lclContainer: true },
    })

    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(booking)
  } catch (error) {
    console.error('GET /api/lcl-bookings/[id] error:', error)
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

    const booking = await prisma.lclBooking.update({
      where: { id: params.id },
      data: {
        ...(body.shipperName !== undefined && { shipperName: body.shipperName }),
        ...(body.shipperAddress !== undefined && { shipperAddress: body.shipperAddress || null }),
        ...(body.clientId !== undefined && { clientId: body.clientId || null }),
        ...(body.clientType !== undefined && { clientType: body.clientType || null }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.clientAddress !== undefined && { clientAddress: body.clientAddress || null }),
        ...(body.notifyParty !== undefined && { notifyParty: body.notifyParty || null }),
        ...(body.notifyPhone !== undefined && { notifyPhone: body.notifyPhone || null }),
        ...(body.portOfLoading !== undefined && { portOfLoading: body.portOfLoading }),
        ...(body.portOfDischarge !== undefined && { portOfDischarge: body.portOfDischarge }),
        ...(body.placeOfReceipt !== undefined && { placeOfReceipt: body.placeOfReceipt || null }),
        ...(body.placeOfDelivery !== undefined && { placeOfDelivery: body.placeOfDelivery || null }),
        ...(body.preCarriageBy !== undefined && { preCarriageBy: body.preCarriageBy || null }),
        ...(body.vessel !== undefined && { vessel: body.vessel || null }),
        ...(body.voyage !== undefined && { voyage: body.voyage || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.marks !== undefined && { marks: body.marks || null }),
        ...(body.packages !== undefined && { packages: parseInt(body.packages) }),
        ...(body.packageType !== undefined && { packageType: body.packageType }),
        ...(body.grossWeightKg !== undefined && { grossWeightKg: body.grossWeightKg ? parseFloat(body.grossWeightKg) : null }),
        ...(body.cbm !== undefined && { cbm: body.cbm ? parseFloat(body.cbm) : null }),
        ...(body.hsCode !== undefined && { hsCode: body.hsCode || null }),
        ...(body.freightTerms !== undefined && { freightTerms: body.freightTerms }),
        ...(body.freightAmount !== undefined && { freightAmount: body.freightAmount ? parseFloat(body.freightAmount) : null }),
        ...(body.freightCurrency !== undefined && { freightCurrency: body.freightCurrency }),
        ...(body.freightDesc !== undefined && { freightDesc: body.freightDesc || null }),
        ...(body.exportReference !== undefined && { exportReference: body.exportReference || null }),
        ...(body.documentNumber !== undefined && { documentNumber: body.documentNumber || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.readyForPickup !== undefined && { readyForPickup: !!body.readyForPickup }),
        ...(body.pickupWarehouse !== undefined && { pickupWarehouse: body.pickupWarehouse || null }),
        ...(body.lclContainerId !== undefined && { lclContainerId: body.lclContainerId || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.blDate !== undefined && { blDate: body.blDate ? new Date(body.blDate) : null }),
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('PUT /api/lcl-bookings/[id] error:', error)
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

    // Unlink warehouse entry if linked
    await prisma.warehouseEntry.updateMany({
      where: { lclBookingId: params.id },
      data: { lclBookingId: null },
    })

    await prisma.lclBooking.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/lcl-bookings/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
