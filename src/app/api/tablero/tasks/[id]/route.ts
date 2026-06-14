import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const INTERNAL_ROLES = ['ADMIN', 'WORKER'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!INTERNAL_ROLES.includes(session.user.role as typeof INTERNAL_ROLES[number])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = params

    const existing = await prisma.teamTask.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
      sortOrder,
    } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (title !== undefined) {
      updateData.title = title
    }
    if (description !== undefined) {
      updateData.description = description ?? null
    }
    if (priority !== undefined) {
      updateData.priority = priority
    }
    if (sortOrder !== undefined) {
      updateData.sortOrder = sortOrder
    }

    // Handle dueDate
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        updateData.dueDate = null
      } else {
        const d = new Date(dueDate)
        updateData.dueDate = isNaN(d.getTime()) ? null : d
      }
    }

    // Handle status change → manage completedAt
    if (status !== undefined) {
      updateData.status = status
      if (status === 'DONE' && existing.status !== 'DONE') {
        updateData.completedAt = new Date()
      } else if (status !== 'DONE' && existing.status === 'DONE') {
        updateData.completedAt = null
      }
    }

    // Handle assignee (including unassign when null/empty string)
    if (assigneeId !== undefined) {
      if (!assigneeId) {
        // Unassign
        updateData.assigneeId = null
        updateData.assigneeName = null
      } else {
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { name: true },
        })
        updateData.assigneeId = assignee ? assigneeId : null
        updateData.assigneeName = assignee?.name ?? null
      }
    }

    const task = await prisma.teamTask.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la tarea' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!INTERNAL_ROLES.includes(session.user.role as typeof INTERNAL_ROLES[number])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = params

    const task = await prisma.teamTask.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isCreator = task.createdById === session.user.id

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    await prisma.teamTask.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la tarea' },
      { status: 500 }
    )
  }
}
