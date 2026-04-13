import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

function calcTotal(body: any): number {
  const flete = Array.isArray(body.items)
    ? body.items.reduce((sum: number, it: any) => sum + (Number(it.flete) || 0), 0)
    : Number(body.flete) || 0
  const extra = body.extraManejo != null ? Number(body.extraManejo) : 0
  const entrega = body.entregaPanama != null ? Number(body.entregaPanama) : 0
  const desc = body.descuento != null ? Number(body.descuento) : 0
  return flete + extra + entrega - desc
}

async function enrichWithAssignedUser(quote: any) {
  if (!quote?.assignedToId) return { ...quote, assignedTo: null }
  const user = await prisma.user.findUnique({
    where: { id: quote.assignedToId },
    select: { id: true, name: true, email: true },
  })
  return { ...quote, assignedTo: user || null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quote = await prisma.fastQuote.findUnique({ where: { id: params.id } })
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(await enrichWithAssignedUser(quote))
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const data: Record<string, any> = {}
    const allowed = [
      'status', 'cliente', 'direccion', 'medidaLargo', 'medidaAncho', 'medidaAlto',
      'tipoCarga', 'tipoEnvio', 'cbmFt3', 'unidadVolumen', 'tiempoTransito',
      'validezTarifa', 'peso', 'flete', 'extraManejo', 'entregaPanama',
      'descuento', 'comentarios', 'items', 'assignedToId', 'rejectionReason',
    ]
    allowed.forEach(k => { if (k in body) data[k] = body[k] })
    if (Array.isArray(body.items)) {
      data.flete = body.items.reduce((s: number, it: any) => s + (Number(it.flete) || 0), 0)
    }

    // Recalculate total from the merged data
    const existing = await prisma.fastQuote.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const merged = { ...existing, ...data }
    data.total = calcTotal(merged)

    const quote = await prisma.fastQuote.update({ where: { id: params.id }, data })
    return NextResponse.json(quote)
  } catch (error: any) {
    console.error('FastQuote PUT error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Error updating fast quote' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.fastQuote.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error cancelling fast quote' }, { status: 500 })
  }
}
