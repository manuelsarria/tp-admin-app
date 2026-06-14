import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const INTERNAL_ROLES = ['ADMIN', 'WORKER'] as const

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!INTERNAL_ROLES.includes(session.user.role as typeof INTERNAL_ROLES[number])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      assigneeId,
      priority,
      dueDate,
      status,
    } = body

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      )
    }

    const taskStatus = status || 'TODO'
    const taskPriority = priority || 'MEDIUM'

    // Resolve assignee name
    let resolvedAssigneeName: string | null = null
    let resolvedAssigneeId: string | null = assigneeId || null
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { name: true },
      })
      resolvedAssigneeName = assignee?.name ?? null
      if (!assignee) {
        resolvedAssigneeId = null
      }
    }

    // Compute sortOrder = max(sortOrder in that status) + 1, or 0
    const maxSortOrderResult = await prisma.teamTask.aggregate({
      where: { status: taskStatus },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxSortOrderResult._max.sortOrder ?? -1) + 1

    // Parse dueDate
    let parsedDueDate: Date | null = null
    if (dueDate) {
      const d = new Date(dueDate)
      parsedDueDate = isNaN(d.getTime()) ? null : d
    }

    const task = await prisma.teamTask.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        status: taskStatus,
        priority: taskPriority,
        dueDate: parsedDueDate,
        sortOrder: nextSortOrder,
        assigneeId: resolvedAssigneeId,
        assigneeName: resolvedAssigneeName,
        createdById: session.user.id,
        createdByName: session.user.name ?? null,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Error al crear la tarea' },
      { status: 500 }
    )
  }
}
