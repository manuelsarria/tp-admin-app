import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get user with company info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (!user.company) {
      return NextResponse.json(
        { error: 'No hay empresa asociada a este usuario' },
        { status: 404 }
      )
    }

    return NextResponse.json(user.company)
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json(
      { error: 'Error al obtener el perfil de la empresa' },
      { status: 500 }
    )
  }
}
