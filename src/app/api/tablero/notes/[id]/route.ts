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

    const existing = await prisma.teamNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { content, color, pinned } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (content !== undefined) {
      updateData.content = content
    }
    if (color !== undefined) {
      updateData.color = color
    }
    if (pinned !== undefined) {
      updateData.pinned = pinned
    }

    const note = await prisma.teamNote.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la nota' },
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

    const note = await prisma.teamNote.findUnique({ where: { id } })
    if (!note) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isAuthor = note.authorId === session.user.id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    await prisma.teamNote.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la nota' },
      { status: 500 }
    )
  }
}
