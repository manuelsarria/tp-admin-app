import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function validateApiKey(apiKey: string | null): boolean {
  const validApiKey = process.env.TRACKING_API_KEY

  if (!validApiKey) {
    console.error('TRACKING_API_KEY is not configured in environment variables')
    return false
  }

  return apiKey === validApiKey
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const apiKey = searchParams.get('apiKey')
    const trackingWarehouse = searchParams.get('trackingWarehouse')

    // Validate API Key
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing API key' },
        { status: 401 }
      )
    }

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

    // Transform the response to the simplified format
    const response = {
      trackingCode: fclShipment.trackingWarehouse,
      reference: cargoManagement?.referenceNo || fclShipment.containerNumber,
      containerNumber: fclShipment.containerNumber,
      transportType: fclShipment.transportType,
      status: cargoManagement?.status || 'RECEIVED_IN_WAREHOUSE',
      location: cargoManagement?.location || '',
      eta: cargoManagement?.eta
        ? new Date(cargoManagement.eta).toISOString().split('T')[0]
        : null,
      history: (cargoManagement?.statusHistory || []).map((item) => ({
        status: item.status,
        date: new Date(item.changedAt).toISOString().slice(0, -5) + 'Z',
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/tracking error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
