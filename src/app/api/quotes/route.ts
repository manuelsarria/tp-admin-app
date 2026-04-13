import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'XX'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

async function generateQuoteNumber(type: 'LCL' | 'FCL', userName: string, userId: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2)
  const initials = getInitials(userName)
  // Per-user sequential count
  const count = await prisma.quote.count({ where: { createdById: userId } })
  const seq = String(count + 1).padStart(4, '0')
  return type === 'LCL' ? `QT-${initials}-LCL-${year}-${seq}` : `QT-${initials}/${year}-${seq}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const quotes = await prisma.quote.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    const assignedIds = quotes.map(q => q.assignedToId).filter(Boolean) as string[]
    const assignedUsers = assignedIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: assignedIds } },
          select: { id: true, name: true, email: true },
        })
      : []
    const userMap = Object.fromEntries(assignedUsers.map(u => [u.id, u]))
    const enriched = quotes.map(q => ({
      ...q,
      assignedTo: q.assignedToId ? userMap[q.assignedToId] || null : null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching quotes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const quoteNumber = await generateQuoteNumber(
      body.quoteType || 'FCL',
      session.user.name ?? 'Admin',
      session.user.id
    )

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        quoteType:              body.quoteType              || 'FCL',
        tipoServicio:           body.tipoServicio           || 'Maritimo',
        validoDesde:            new Date(body.validoDesde),
        validoHasta:            new Date(body.validoHasta),
        frecuencia:             body.frecuencia             || null,
        tiempoTransito:         body.tiempoTransito         || null,
        lineaNaviera:           body.lineaNaviera           || null,
        ruta:                   body.ruta                   || null,
        cliente:                body.cliente,
        referenciasAdicionales: body.referenciasAdicionales || null,
        pesoBruto:              body.pesoBruto              ?? null,
        volumen:                body.volumen                || null,
        pesoCargable:           body.pesoCargable           ?? null,
        terminoNegociacion:     body.terminoNegociacion     || null,
        mercaderia:             body.mercaderia             || null,
        valorMercancia:         body.valorMercancia         ?? null,
        valorSeguro:            body.valorSeguro            ?? null,
        piezas:                 body.piezas                 ?? null,
        tipoEmbalaje:           body.tipoEmbalaje           || null,
        dimensiones:            body.dimensiones            || null,
        tipoContenedor:         body.tipoContenedor         || null,
        direccionRecogida:      body.direccionRecogida      || null,
        direccionEntrega:       body.direccionEntrega       || null,
        servicios:              body.servicios              ?? [],
        comentarios:            body.comentarios            || null,
        total:                  body.total                  ?? 0,
        createdById:            session.user.id             || null,
        assignedToId:           body.assignedToId           || null,
      },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error: any) {
    console.error('Quote POST error:', error?.message, error?.code)
    return NextResponse.json({ error: error?.message || 'Error creating quote' }, { status: 500 })
  }
}
