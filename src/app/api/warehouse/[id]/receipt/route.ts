export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { WarehouseReceiptPDF } from '@/components/freight/WarehouseReceiptPDF'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

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

    // Generate QR code
    const qrBase64 = await QRCode.toDataURL(entry.wrNumber, { width: 120 })

    // Load logo if exists
    const logoPath = path.join(process.cwd(), 'public', 'images', 'TP-Logo.png')
    const logoBase64 = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
      : null

    const pdfBuffer = await renderToBuffer(
      createElement(WarehouseReceiptPDF, {
        entry: entry as any,
        qrBase64,
        logoBase64,
      }) as any
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${entry.wrNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Receipt PDF error:', error)
    return NextResponse.json({ error: 'Error generating receipt PDF' }, { status: 500 })
  }
}
