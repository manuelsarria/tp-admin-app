import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateFclShipmentSchema } from '@/lib/validation'
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
    const record = await prisma.fclShipment.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            company_id: true,
          },
        },
        pieces: true,
      },
    })

    if (!record) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('GET /api/fcl-shipments/[id] error:', error)
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
    const validated = updateFclShipmentSchema.parse(body)

    // If mailbox is being updated, validate and extract company code
    let companyId: string | null | undefined = undefined
    if (validated.mailbox) {
      const extractCompanyCode = (mailbox: string): string => {
        return mailbox.includes('-') ? mailbox.split('-')[0] : mailbox
      }

      const companyCode = extractCompanyCode(validated.mailbox)

      // Find company by extracted company code
      const company = await prisma.company.findFirst({
        where: {
          company_id: companyCode,
          isActive: true,
        },
        select: { id: true },
      })

      if (!company) {
        return NextResponse.json({
          error: 'Invalid Casillero',
          details: `Casillero "${validated.mailbox}" (code: "${companyCode}") does not match any active company`,
        }, { status: 400 })
      }

      companyId = company.id
    }

    // Handle pieces: delete existing and recreate if pieces array is provided
    if (validated.pieces !== undefined) {
      await prisma.fclShipmentPiece.deleteMany({ where: { fclShipmentId: params.id } })
    }

    const record = await prisma.fclShipment.update({
      where: { id: params.id },
      data: {
        ...(validated.trackingWarehouse && { trackingWarehouse: validated.trackingWarehouse }),
        ...(validated.forwarder !== undefined && { forwarder: validated.forwarder }),
        ...(validated.mailbox && { mailbox: validated.mailbox }),
        ...(validated.transportType && { transportType: validated.transportType }),
        ...(validated.containerNumber && { containerNumber: validated.containerNumber }),
        ...(validated.approximateDate !== undefined && {
          approximateDate: validated.approximateDate ? new Date(validated.approximateDate) : null,
        }),
        ...(validated.misidentified !== undefined && { misidentified: validated.misidentified }),
        ...(validated.dangerousGoods !== undefined && { dangerousGoods: validated.dangerousGoods }),
        ...(validated.refrigeratedProduct !== undefined && { refrigeratedProduct: validated.refrigeratedProduct }),
        ...(companyId !== undefined && { companyId }),
        ...(validated.itemType !== undefined && { itemType: validated.itemType || null }),
        ...(validated.userId !== undefined && { userId: validated.userId || null }),
        ...(validated.totalCbm !== undefined && { totalCbm: validated.totalCbm }),
        ...(validated.totalWeight !== undefined && { totalWeight: validated.totalWeight }),
        ...(validated.comments !== undefined && { comments: validated.comments }),
        ...(validated.additionalCode !== undefined && { additionalCode: validated.additionalCode }),
        ...(validated.pieces !== undefined && validated.pieces.length > 0 && {
          pieces: { create: validated.pieces },
        }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            company_id: true,
          },
        },
        pieces: true,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PATCH /api/fcl-shipments/[id] error:', error)
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
    await prisma.fclShipment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/fcl-shipments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
