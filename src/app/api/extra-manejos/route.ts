export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const estado = searchParams.get('estado') || ''
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (estado && estado !== 'ALL') where.estado = estado
    if (search) {
      where.OR = [
        { clienteNombre: { contains: search, mode: 'insensitive' } },
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { motivo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, stats] = await Promise.all([
      prisma.extraManejo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.extraManejo.groupBy({
        by: ['estado'],
        _count: { id: true },
        _sum: { monto: true },
      }),
    ])

    // Monthly collected total
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const cobradoMes = await prisma.extraManejo.aggregate({
      where: { estado: 'COBRADO', fechaCobro: { gte: monthStart } },
      _sum: { monto: true },
    })

    const pendientes = stats.find(s => s.estado === 'PENDIENTE')
    const cobrados = stats.find(s => s.estado === 'COBRADO')

    return NextResponse.json({
      items,
      stats: {
        pendientesCount: pendientes?._count?.id || 0,
        pendientesMonto: pendientes?._sum?.monto || 0,
        cobradosMesActual: cobradoMes._sum?.monto || 0,
        cobradosCount: cobrados?._count?.id || 0,
      },
    })
  } catch (error) {
    console.error('GET /api/extra-manejos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.monto || !body.motivo || !body.clienteNombre || !body.quoteNumber) {
      return NextResponse.json({ error: 'Monto, motivo, cliente y quoteNumber son requeridos' }, { status: 400 })
    }

    const item = await prisma.extraManejo.create({
      data: {
        monto: parseFloat(body.monto),
        motivo: body.motivo,
        clienteNombre: body.clienteNombre,
        quoteNumber: body.quoteNumber,
        quoteType: body.quoteType || 'FAST_QUOTE',
        fastQuoteId: body.fastQuoteId || null,
        quoteId: body.quoteId || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('POST /api/extra-manejos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
