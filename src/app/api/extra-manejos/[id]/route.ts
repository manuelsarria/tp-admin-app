import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// PATCH — mark as cobrado
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const data: any = {}
    if (body.estado === 'COBRADO') {
      data.estado = 'COBRADO'
      data.fechaCobro = new Date()
      data.cobradoPor = session.user.name || session.user.email || 'Admin'
    }
    if (body.estado === 'PENDIENTE') {
      data.estado = 'PENDIENTE'
      data.fechaCobro = null
      data.cobradoPor = null
    }

    const item = await prisma.extraManejo.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('PATCH /api/extra-manejos/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.extraManejo.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/extra-manejos/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
