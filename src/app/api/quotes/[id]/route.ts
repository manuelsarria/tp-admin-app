import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

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

    const quote = await prisma.quote.findUnique({ where: { id: params.id } })
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
      'status','quoteType','tipoServicio','frecuencia','tiempoTransito','lineaNaviera','ruta',
      'cliente','referenciasAdicionales','pesoBruto','volumen','pesoCargable','terminoNegociacion',
      'mercaderia','valorMercancia','valorSeguro','piezas','tipoEmbalaje','dimensiones',
      'tipoContenedor','direccionRecogida','direccionEntrega','servicios','comentarios','total',
      'assignedToId','rejectionReason',
    ]
    allowed.forEach(k => { if (k in body) data[k] = body[k] })
    if (body.validoDesde) data.validoDesde = new Date(body.validoDesde)
    if (body.validoHasta) data.validoHasta = new Date(body.validoHasta)

    const quote = await prisma.quote.update({ where: { id: params.id }, data })
    return NextResponse.json(quote)
  } catch (error: any) {
    console.error('Quote PUT error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Error updating quote' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.quote.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error cancelling quote' }, { status: 500 })
  }
}
