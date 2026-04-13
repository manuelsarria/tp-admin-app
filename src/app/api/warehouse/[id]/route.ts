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

    const entry = await prisma.warehouseEntry.findUnique({
      where: { id: params.id },
    })

    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(entry)
  } catch (error) {
    console.error('GET /api/warehouse/[id] error:', error)
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
      status,
      notes,
      lclBookingId,
    } = body

    const entry = await prisma.warehouseEntry.update({
      where: { id: params.id },
      data: {
        ...(clientId !== undefined && { clientId: clientId || null }),
        ...(clientType !== undefined && { clientType: clientType || null }),
        ...(clientName !== undefined && { clientName }),
        ...(consigneeName !== undefined && { consigneeName: consigneeName || null }),
        ...(description !== undefined && { description: description || null }),
        ...(pieces !== undefined && { pieces: parseInt(pieces) }),
        ...(pieceType !== undefined && { pieceType }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(largo !== undefined && { largo: largo ? parseFloat(largo) : null }),
        ...(ancho !== undefined && { ancho: ancho ? parseFloat(ancho) : null }),
        ...(alto !== undefined && { alto: alto ? parseFloat(alto) : null }),
        ...(unidadMedida !== undefined && { unidadMedida }),
        ...(destWarehouse !== undefined && { destWarehouse: destWarehouse || null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(lclBookingId !== undefined && { lclBookingId: lclBookingId || null }),
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('PUT /api/warehouse/[id] error:', error)
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

    await prisma.warehouseEntry.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/warehouse/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
