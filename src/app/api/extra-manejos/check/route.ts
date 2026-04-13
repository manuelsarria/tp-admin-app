export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// GET /api/extra-manejos/check?cliente=nombre
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cliente = request.nextUrl.searchParams.get('cliente') || ''
    if (!cliente) return NextResponse.json({ pendientes: [] })

    const pendientes = await prisma.extraManejo.findMany({
      where: {
        estado: 'PENDIENTE',
        clienteNombre: { contains: cliente, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({ pendientes })
  } catch (error) {
    return NextResponse.json({ pendientes: [] })
  }
}
