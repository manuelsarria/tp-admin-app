import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateLclShipmentSchema } from '@/lib/validation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const record = await prisma.lclShipment.findUnique({
      where: { id: params.id },
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

    if (!record) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('GET /api/lcl-shipments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = updateLclShipmentSchema.parse(body)

    const record = await prisma.lclShipment.update({
      where: { id: params.id },
      data: {
        ...(validated.blNumber && { blNumber: validated.blNumber }),
        ...(validated.eta !== undefined && { eta: new Date(validated.eta) }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
        ...(validated.departureDate !== undefined && { departureDate: new Date(validated.departureDate) }),
        ...(validated.cargoAmount !== undefined && { cargoAmount: validated.cargoAmount }),
        ...(validated.totalCbm !== undefined && { totalCbm: validated.totalCbm }),
        ...(validated.empresaId !== undefined && { companyId: validated.empresaId || null }),
        ...(validated.itemType !== undefined && { itemType: validated.itemType || null }),
        ...(validated.userId !== undefined && { userId: validated.userId || null }),
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

    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PATCH /api/lcl-shipments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.lclShipment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/lcl-shipments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
