import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const trackingWarehouse = searchParams.get('trackingWarehouse')

    // Validate that trackingWarehouse parameter is provided
    if (!trackingWarehouse) {
      return NextResponse.json(
        { error: 'El parámetro trackingWarehouse es requerido' },
        { status: 400 }
      )
    }

    // Find the FCL shipment by trackingWarehouse
    const fclShipment = await prisma.fclShipment.findFirst({
      where: {
        trackingWarehouse: trackingWarehouse,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            company_id: true,
          },
        },
      },
    })

    // If no FCL shipment found, return 404
    if (!fclShipment) {
      return NextResponse.json(
        { error: 'No se encontró ningún envío con el número de rastreo proporcionado' },
        { status: 404 }
      )
    }

    // Find the corresponding cargo management record by containerNumber
    const cargoManagement = await prisma.cargoManagement.findFirst({
      where: {
        referenceNo: fclShipment.containerNumber,
      },
      include: {
        statusHistory: {
          orderBy: {
            changedAt: 'asc',
          },
        },
      },
    })

    // Build the response object
    const response = {
      fclId: fclShipment.id,
      trackingWarehouse: fclShipment.trackingWarehouse,
      forwarder: fclShipment.forwarder,
      mailbox: fclShipment.mailbox,
      transportType: fclShipment.transportType,
      containerNumber: fclShipment.containerNumber,
      approximateDate: fclShipment.approximateDate,
      misidentified: fclShipment.misidentified,
      dangerousGoods: fclShipment.dangerousGoods,
      refrigeratedProduct: fclShipment.refrigeratedProduct,
      fclCreatedAt: fclShipment.createdAt,
      fclUpdatedAt: fclShipment.updatedAt,
      companyId: fclShipment.companyId,
      company: fclShipment.company,
      // Cargo Management data (if found)
      cargoManagementId: cargoManagement?.id || null,
      referenceNo: cargoManagement?.referenceNo || null,
      eta: cargoManagement?.eta || null,
      location: cargoManagement?.location || '',
      status: cargoManagement?.status || 'RECEIVED_IN_WAREHOUSE',
      shippingLine: cargoManagement?.shippingLine || null,
      departureDate: cargoManagement?.departureDate || null,
      cmCreatedAt: cargoManagement?.createdAt || null,
      cmUpdatedAt: cargoManagement?.updatedAt || null,
      // Status history
      statusHistory: cargoManagement?.statusHistory || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/cargos/tracking error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
