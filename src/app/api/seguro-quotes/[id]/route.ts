export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { insuranceQuoteUpdateSchema } from '@/lib/validation'
import { calcSeguro, resolveRate } from '@/lib/seguro'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const quote = await prisma.insuranceQuote.findUnique({ where: { id: params.id } })
    if (!quote) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json(quote)
  } catch (error) {
    console.error('GET /api/seguro-quotes/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener la cotización' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = insuranceQuoteUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
    }
    const d = parsed.data

    const current = await prisma.insuranceQuote.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    // Si cambió algo que entra en la fórmula, se recalcula entero; si solo se
    // movió el estado o un comentario, los montos quedan como estaban.
    const camposDeCalculo = [
      'valorComercial', 'valorFlete', 'valorTributos',
      'gastosAdicionalesPct', 'lucroSesantePct',
      'clienteType', 'customRate', 'customMinimo', 'customLabel',
    ] as const
    const recalcular = camposDeCalculo.some(k => d[k] !== undefined)

    let montos = {}
    let tarifa = {}
    if (recalcular) {
      const clienteType = (d.clienteType ?? current.clienteType) as 'regular' | 'agente' | 'custom'
      const rateInfo = resolveRate(clienteType, {
        label: d.customLabel ?? current.rateLabel,
        rate: d.customRate ?? current.rate,
        minimum: d.customMinimo ?? current.minimum,
      })
      const r = calcSeguro({
        valorComercial: d.valorComercial ?? current.valorComercial,
        valorFlete: d.valorFlete ?? current.valorFlete,
        valorTributos: d.valorTributos ?? current.valorTributos,
        gastosAdicionalesPct: d.gastosAdicionalesPct ?? current.gastosAdicionalesPct,
        lucroSesantePct: d.lucroSesantePct ?? current.lucroSesantePct,
        rate: rateInfo.rate,
        minimum: rateInfo.minimum,
      })
      montos = r
      tarifa = { clienteType, rateLabel: rateInfo.label, rate: rateInfo.rate, minimum: rateInfo.minimum }
    }

    const quote = await prisma.insuranceQuote.update({
      where: { id: params.id },
      data: {
        ...(d.cliente !== undefined && { cliente: d.cliente.trim() }),
        ...(d.referencia !== undefined && { referencia: d.referencia }),
        ...(d.descripcionCarga !== undefined && { descripcionCarga: d.descripcionCarga }),
        ...(d.valorComercial !== undefined && { valorComercial: d.valorComercial }),
        ...(d.valorFlete !== undefined && { valorFlete: d.valorFlete }),
        ...(d.valorTributos !== undefined && { valorTributos: d.valorTributos }),
        ...(d.gastosAdicionalesPct !== undefined && { gastosAdicionalesPct: d.gastosAdicionalesPct }),
        ...(d.lucroSesantePct !== undefined && { lucroSesantePct: d.lucroSesantePct }),
        ...(d.comentarios !== undefined && { comentarios: d.comentarios }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.rejectionReason !== undefined && { rejectionReason: d.rejectionReason }),
        ...tarifa,
        ...montos,
      },
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('PUT /api/seguro-quotes/[id] error:', error)
    return NextResponse.json({ error: 'Error al actualizar la cotización' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await prisma.insuranceQuote.delete({ where: { id: params.id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/seguro-quotes/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar la cotización' }, { status: 500 })
  }
}
