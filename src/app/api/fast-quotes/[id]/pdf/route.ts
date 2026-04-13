export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { FastQuoteDocument } from '@/components/cotizaciones/FastQuotePDF'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quote = await prisma.fastQuote.findUnique({ where: { id: params.id } })
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const bannerPath = path.join(process.cwd(), 'public', 'images', 'TP-Logo.png')
    const bannerBase64 = fs.existsSync(bannerPath)
      ? `data:image/png;base64,${fs.readFileSync(bannerPath).toString('base64')}`
      : null

    const pdfBuffer = await renderToBuffer(
      createElement(FastQuoteDocument, { quote: quote as any, bannerBase64 }) as ReactElement<any>
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quoteNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('FastQuote PDF generation error:', error)
    return NextResponse.json({ error: 'Error generating PDF' }, { status: 500 })
  }
}
