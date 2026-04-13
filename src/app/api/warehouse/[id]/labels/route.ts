export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { WarehouseLabelPDF } from '@/components/freight/WarehouseLabelPDF'
import bwipjs from 'bwip-js'
import QRCode from 'qrcode'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.warehouseEntry.findUnique({
      where: { id: params.id },
    })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Generate Code128 barcode
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: entry.wrNumber,
      scale: 3,
      height: 12,
      includetext: false,
    })
    const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString('base64')}`

    // Generate QR code
    const qrBase64 = await QRCode.toDataURL(entry.wrNumber, { width: 120 })

    const pdfBuffer = await renderToBuffer(
      createElement(WarehouseLabelPDF, {
        entry: entry as any,
        barcodeBase64,
        qrBase64,
      }) as any
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="labels-${entry.wrNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Labels PDF error:', error)
    return NextResponse.json({ error: 'Error generating labels PDF' }, { status: 500 })
  }
}
