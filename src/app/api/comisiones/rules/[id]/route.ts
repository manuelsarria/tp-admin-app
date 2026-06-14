import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT - Update a commission rule (ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Verify rule exists
    const existing = await prisma.commissionRule.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { label, mode, value, active, sortOrder } = body

    // Validate mode if provided
    if (mode !== undefined && mode !== 'FIXED' && mode !== 'PERCENT') {
      return NextResponse.json(
        { error: 'El modo debe ser FIXED o PERCENT' },
        { status: 400 }
      )
    }

    // Effective mode for validating value bounds (new mode if provided, else existing)
    const effectiveMode = mode !== undefined ? mode : existing.mode

    if (value !== undefined) {
      const numValue = Number(value)
      if (!Number.isFinite(numValue) || numValue < 0 || (effectiveMode === 'PERCENT' && numValue > 100)) {
        return NextResponse.json(
          { error: 'El valor debe ser un número válido (0–100 para porcentaje)' },
          { status: 400 }
        )
      }
    }

    // Build update data (only fields provided)
    const data: Record<string, unknown> = {}
    if (label !== undefined) data.label = label
    if (mode !== undefined) data.mode = mode
    if (value !== undefined) data.value = Number(value)
    if (active !== undefined) data.active = Boolean(active)
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder)

    const rule = await prisma.commissionRule.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error al actualizar regla de comisión:', error)
    return NextResponse.json({ error: 'Error al actualizar la regla' }, { status: 500 })
  }
}

// DELETE - Delete a commission rule (ADMIN only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Verify rule exists
    const existing = await prisma.commissionRule.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 })
    }

    await prisma.commissionRule.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar regla de comisión:', error)
    return NextResponse.json({ error: 'Error al eliminar la regla' }, { status: 500 })
  }
}
