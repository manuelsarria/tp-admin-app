export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_WAREHOUSE: 'En Bodega',
  ASSIGNED: 'Asignado a Contenedor',
  SHIPPED: 'En Tránsito',
  ARRIVED: 'Arribó a Destino',
  DELIVERED: 'Entregado',
}

const WAREHOUSE_LABELS: Record<string, string> = {
  PWEST: 'Panama Oeste',
  PCENT: 'Panama Centro',
  ZLC: 'Zona Libre Colón',
}

// GET /api/hbl-validate?hbl=HBLXXXXXX — PUBLIC (no auth)
export async function GET(request: NextRequest) {
  try {
    const hbl = request.nextUrl.searchParams.get('hbl')

    if (!hbl) {
      return NextResponse.json({ error: 'HBL number is required' }, { status: 400 })
    }

    const booking = await prisma.lclBooking.findUnique({
      where: { hblNumber: hbl },
      select: {
        hblNumber: true,
        clientName: true,
        shipperName: true,
        portOfLoading: true,
        portOfDischarge: true,
        packages: true,
        packageType: true,
        grossWeightKg: true,
        cbm: true,
        description: true,
        status: true,
        readyForPickup: true,
        pickupWarehouse: true,
        lclContainer: {
          select: {
            containerNumber: true,
            mblNumber: true,
          },
        },
        blDate: true,
        createdAt: true,
      },
    })

    if (!booking) {
      return NextResponse.json({
        valid: false,
        error: 'Documento no encontrado',
        message: 'El número de HBL ingresado no existe en nuestro sistema.',
      }, { status: 404 })
    }

    const isZLC = booking.pickupWarehouse === 'ZLC'

    return NextResponse.json({
      valid: true,
      hblNumber: booking.hblNumber,
      status: booking.status,
      statusLabel: STATUS_LABELS[booking.status] || booking.status,
      readyForPickup: booking.readyForPickup,
      pickupWarehouse: booking.pickupWarehouse,
      pickupWarehouseLabel: booking.pickupWarehouse ? WAREHOUSE_LABELS[booking.pickupWarehouse] || booking.pickupWarehouse : null,
      isZonaLibre: isZLC,
      client: {
        name: booking.clientName,
      },
      shipper: booking.shipperName,
      cargo: {
        description: booking.description,
        packages: booking.packages,
        packageType: booking.packageType,
        grossWeightKg: booking.grossWeightKg,
        cbm: booking.cbm,
      },
      routing: {
        portOfLoading: booking.portOfLoading,
        portOfDischarge: booking.portOfDischarge,
      },
      container: booking.lclContainer ? {
        containerNumber: booking.lclContainer.containerNumber,
        mblNumber: booking.lclContainer.mblNumber,
      } : null,
      blDate: booking.blDate,
    })
  } catch (error) {
    console.error('HBL validation error:', error)
    return NextResponse.json({ error: 'Error al validar HBL' }, { status: 500 })
  }
}
