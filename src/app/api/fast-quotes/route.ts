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

async function generateFastQuoteNumber(userName: string, userId: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2)
  const initials = getInitials(userName)
  const count = await prisma.fastQuote.count({ where: { createdById: userId } })
  const seq = String(count + 1).padStart(4, '0')
  return `TP${initials}${year}${seq}`
}

function calcTotal(body: any): number {
  const flete = Array.isArray(body.items)
    ? body.items.reduce((sum: number, it: any) => sum + (Number(it.flete) || 0), 0)
    : Number(body.flete) || 0
  const extra = body.extraManejo != null ? Number(body.extraManejo) : 0
  const entrega = body.entregaPanama != null ? Number(body.entregaPanama) : 0
  const desc = body.descuento != null ? Number(body.descuento) : 0
  return flete + extra + entrega - desc
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const quotes = await prisma.fastQuote.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with assigned user info
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
    return NextResponse.json({ error: 'Error fetching fast quotes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const quoteNumber = await generateFastQuoteNumber(
      session.user.name ?? 'Admin',
      session.user.id
    )

    const total = calcTotal(body)

    const quote = await prisma.fastQuote.create({
      data: {
        quoteNumber,
        cliente:        body.cliente,
        direccion:      body.direccion        || null,
        medidaLargo:    body.medidaLargo      ?? null,
        medidaAncho:    body.medidaAncho      ?? null,
        medidaAlto:     body.medidaAlto       ?? null,
        tipoCarga:      body.tipoCarga        || null,
        tipoEnvio:      body.tipoEnvio        || 'MARITIMO',
        cbmFt3:         body.cbmFt3           ?? null,
        unidadVolumen:  body.unidadVolumen    || 'CBM',
        tiempoTransito: body.tiempoTransito   ?? 45,
        validezTarifa:  body.validezTarifa    ?? 10,
        peso:           body.peso             ?? null,
        flete:          Array.isArray(body.items)
          ? body.items.reduce((s: number, it: any) => s + (Number(it.flete) || 0), 0)
          : Number(body.flete) || 0,
        extraManejo:    body.extraManejo      ?? null,
        entregaPanama:  body.entregaPanama    ?? null,
        descuento:      body.descuento        ?? null,
        comentarios:    body.comentarios      || null,
        items:          body.items            ?? null,
        total,
        createdById:    session.user.id       || null,
        assignedToId:   body.assignedToId     || null,
      },
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error: any) {
    console.error('FastQuote POST error:', error?.message, error?.code)
    return NextResponse.json({ error: error?.message || 'Error creating fast quote' }, { status: 500 })
  }
}
