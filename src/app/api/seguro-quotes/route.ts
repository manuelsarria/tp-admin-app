export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { insuranceQuoteSchema } from '@/lib/validation'
import { calcSeguro, resolveRate } from '@/lib/seguro'
import { createQuoteWithNumber, seguroQuoteNumber } from '@/lib/seguroQuoteNumber'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const search = (sp.get('search') || '').trim()
    const status = sp.get('status')

    const quotes = await prisma.insuranceQuote.findMany({
      where: {
        ...(status && status !== 'all' ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { quoteNumber: { contains: search, mode: 'insensitive' as const } },
                { cliente: { contains: search, mode: 'insensitive' as const } },
                { referencia: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    })

    return NextResponse.json(quotes)
  } catch (error) {
    console.error('GET /api/seguro-quotes error:', error)
    return NextResponse.json({ error: 'Error al obtener cotizaciones de seguro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = insuranceQuoteSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
    }
    const d = parsed.data

    // La tasa se resuelve y se congela en el servidor: lo que se guarda no
    // depende de lo que el navegador haya mandado como resultado.
    const rateInfo = resolveRate(d.clienteType, {
      label: d.customLabel ?? undefined,
      rate: d.customRate,
      minimum: d.customMinimo,
    })
    const r = calcSeguro({ ...d, rate: rateInfo.rate, minimum: rateInfo.minimum })

    // Si dos cotizaciones piden número a la vez, la que pierde reintenta con el
    // siguiente en vez de fallarle al usuario.
    const quote = await createQuoteWithNumber(async () => prisma.insuranceQuote.create({
      data: {
        quoteNumber: await seguroQuoteNumber(session.user.name ?? 'Admin'),
        status: d.status ?? 'DRAFT',
        cliente: d.cliente.trim(),
        referencia: d.referencia || null,
        descripcionCarga: d.descripcionCarga || null,
        valorComercial: d.valorComercial,
        valorFlete: d.valorFlete,
        valorTributos: d.valorTributos,
        gastosAdicionalesPct: d.gastosAdicionalesPct,
        lucroSesantePct: d.lucroSesantePct,
        clienteType: d.clienteType,
        rateLabel: rateInfo.label,
        rate: rateInfo.rate,
        minimum: rateInfo.minimum,
        ...r,
        comentarios: d.comentarios || null,
        createdById: session.user.id,
      },
    }))

    return NextResponse.json(quote, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/seguro-quotes error:', error)
    return NextResponse.json({ error: error?.message || 'Error al guardar la cotización' }, { status: 500 })
  }
}
