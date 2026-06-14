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
    const { content, color, pinned } = body

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'El contenido es requerido' },
        { status: 400 }
      )
    }

    const note = await prisma.teamNote.create({
      data: {
        content: content.trim(),
        color: color || 'yellow',
        pinned: pinned === true,
        authorId: session.user.id,
        authorName: session.user.name ?? null,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Error al crear la nota' },
      { status: 500 }
    )
  }
}
