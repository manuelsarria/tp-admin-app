import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const INTERNAL_ROLES = ['ADMIN', 'WORKER'] as const

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!INTERNAL_ROLES.includes(session.user.role as typeof INTERNAL_ROLES[number])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const [members, tasks, notes] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'WORKER'] },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.teamTask.findMany({
        orderBy: [
          { status: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      prisma.teamNote.findMany({
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
    ])

    return NextResponse.json({
      me: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        isAdmin: session.user.role === 'ADMIN',
      },
      members,
      tasks,
      notes,
    })
  } catch (error) {
    console.error('Error fetching tablero data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del tablero' },
      { status: 500 }
    )
  }
}
