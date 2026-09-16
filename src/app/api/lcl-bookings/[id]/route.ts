export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { sanitizeStamps } from '@/lib/hblStamps'
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
      include: {
        lclContainer: true,
        cargoItems: { orderBy: { position: 'asc' } },
      },
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

    // El update y el reemplazo de líneas van juntos en una transacción: si el
    // createMany falla (un `packages` que no es número, un corte de conexión),
    // el deleteMany ya se habría ejecutado y el HBL quedaría sin carga.
    const booking = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.lclBooking.update({
      where: { id: params.id },
      data: {
        ...(body.shipperName !== undefined && { shipperName: body.shipperName }),
        ...(body.shipperAddress !== undefined && { shipperAddress: body.shipperAddress || null }),
        ...(body.clientId !== undefined && { clientId: body.clientId || null }),
        ...(body.clientType !== undefined && { clientType: body.clientType || null }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.clientAddress !== undefined && { clientAddress: body.clientAddress || null }),
        ...(body.clientRuc !== undefined && { clientRuc: body.clientRuc || null }),
        ...(body.clientDv !== undefined && { clientDv: body.clientDv || null }),
        ...(body.clientEmail !== undefined && { clientEmail: body.clientEmail || null }),
        ...(body.notifyParty !== undefined && { notifyParty: body.notifyParty || null }),
        ...(body.notifyAddress !== undefined && { notifyAddress: body.notifyAddress || null }),
        ...(body.notifyRuc !== undefined && { notifyRuc: body.notifyRuc || null }),
        ...(body.notifyDv !== undefined && { notifyDv: body.notifyDv || null }),
        ...(body.notifyEmail !== undefined && { notifyEmail: body.notifyEmail || null }),
        ...(body.notifyPhone !== undefined && { notifyPhone: body.notifyPhone || null }),
        ...(body.forwardingAgent !== undefined && { forwardingAgent: body.forwardingAgent || null }),
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
        ...(body.omitQr !== undefined && { omitQr: !!body.omitQr }),
        ...(body.groupedCargo !== undefined && { groupedCargo: !!body.groupedCargo }),
        ...(body.stamps !== undefined && { stamps: sanitizeStamps(body.stamps) as any }),
      },
      })

      // Las líneas de carga se reemplazan enteras cuando el cliente las manda:
      // borrar y volver a crear, igual que las piezas de FCL. Si no vienen en
      // el body, las que ya están se quedan como estaban.
      if (Array.isArray(body.cargoItems)) {
        await tx.lclBookingCargoItem.deleteMany({ where: { lclBookingId: params.id } })
        if (body.cargoItems.length > 0) {
          await tx.lclBookingCargoItem.createMany({
            data: body.cargoItems.map((it: any, i: number) => ({
              lclBookingId: params.id,
              hsCode: it.hsCode || null,
              description: it.description || '',
              packages: Number.isFinite(parseInt(it.packages)) ? parseInt(it.packages) : 1,
              packageType: it.packageType || null,
              grossWeightKg: Number.isFinite(parseFloat(it.grossWeightKg)) ? parseFloat(it.grossWeightKg) : null,
              cbm: Number.isFinite(parseFloat(it.cbm)) ? parseFloat(it.cbm) : null,
              marks: it.marks || null,
              position: i,
            })),
          })
        }
      }

      // Se relee para que el cliente reciba las líneas nuevas y no las de antes.
      return tx.lclBooking.findUnique({
        where: { id: params.id },
        include: { lclContainer: true, cargoItems: { orderBy: { position: 'asc' } } },
      })
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
