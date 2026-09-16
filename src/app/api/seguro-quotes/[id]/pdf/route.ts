export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { SeguroCargaPDF, type SeguroQuoteData } from '@/components/cotizaciones/SeguroCargaPDF'
import fs from 'fs'
import path from 'path'

/**
 * PDF de una cotización de seguro YA guardada.
 *
 * Reimprime desde la base con los montos y la tasa congelados al emitir, así
 * que reimprimir una cotización vieja da exactamente el mismo documento aunque
 * el tarifario haya cambiado.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = await prisma.insuranceQuote.findUnique({ where: { id: params.id } })
    if (!q) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const f = q.createdAt
    const quote: SeguroQuoteData = {
      quoteNumber: q.quoteNumber,
      fecha: `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`,
      validezDias: 15,
      clienteNombre: q.cliente,
      referencia: q.referencia,
      descripcionCarga: q.descripcionCarga,
      tipoCliente: q.rateLabel,
      rate: q.rate,
      minimum: q.minimum,
      valorComercial: q.valorComercial,
      valorFlete: q.valorFlete,
      valorTributos: q.valorTributos,
      gastosAdicionalesPct: q.gastosAdicionalesPct,
      gastosAdicionales: q.gastosAdicionales,
      lucroSesantePct: q.lucroSesantePct,
      lucroSesante: q.lucroSesante,
      totalAsegurado: q.totalAsegurado,
      prima: q.prima,
      valorCobrar: q.valorCobrar,
      ejecutivo: session.user?.name || null,
    }

    const bannerPath = path.join(process.cwd(), 'public', 'images', 'TP-banner.png')
    const bannerBase64 = fs.existsSync(bannerPath)
      ? `data:image/png;base64,${fs.readFileSync(bannerPath).toString('base64')}`
      : null

    const pdfBuffer = await renderToBuffer(
      createElement(SeguroCargaPDF, { quote, bannerBase64 }) as ReactElement<any>,
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-seguro-${q.quoteNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Seguro quote PDF error:', error)
    return NextResponse.json({ error: 'Error generando el PDF' }, { status: 500 })
  }
}
