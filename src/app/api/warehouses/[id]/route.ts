export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// PUT /api/warehouses/[id] — ADMIN only (update schedule config)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scheduleConfig, address, phone, isActive, name } = body

    const updated = await prisma.warehouse.update({
      where: { id: params.id },
      data: {
        ...(scheduleConfig !== undefined && { scheduleConfig }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
        ...(name !== undefined && { name }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating warehouse:', error)
    return NextResponse.json({ error: 'Error al actualizar almacén' }, { status: 500 })
  }
}
