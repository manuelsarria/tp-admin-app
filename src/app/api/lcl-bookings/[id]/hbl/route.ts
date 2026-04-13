export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { HouseBLPDF } from '@/components/freight/HouseBLPDF'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import crypto from 'crypto'

const WAREHOUSE_LABELS: Record<string, string> = {
  PWEST: 'Panama Oeste',
  PCENT: 'Panama Centro',
  ZLC: 'Zona Libre Colón',
}

function generateAuthCode(hblNumber: string, bookingId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${hblNumber}-${bookingId}-CNC`)
    .digest('hex')
    .toUpperCase()
  // Format: CNC-XXXX-XXXX (8 chars from hash)
  return `CNC-${hash.slice(0, 4)}-${hash.slice(4, 8)}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.lclBooking.findUnique({
      where: { id: params.id },
      include: { lclContainer: true },
    })
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Logo
    const logoPath = path.join(process.cwd(), 'public', 'images', 'TP-Logo.png')
    const logoBase64 = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
      : null

    // QR code → public validation page
    const validationUrl = `https://tplogist.com/validar?hbl=${encodeURIComponent(booking.hblNumber)}`
    const qrBase64 = await QRCode.toDataURL(validationUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    })

    // Approval stamp (only if readyForPickup)
    let approval = null
    if (booking.readyForPickup) {
      const selloPath = path.join(process.cwd(), 'public', 'images', 'sello-cnc.png')
      const selloBase64 = fs.existsSync(selloPath)
        ? `data:image/png;base64,${fs.readFileSync(selloPath).toString('base64')}`
        : null

      approval = {
        approved: true,
        selloBase64,
        authorizedBy: session.user.name || session.user.email || 'Admin',
        authCode: generateAuthCode(booking.hblNumber, booking.id),
        pickupWarehouse: booking.pickupWarehouse
          ? WAREHOUSE_LABELS[booking.pickupWarehouse] || booking.pickupWarehouse
          : null,
      }
    }

    const pdfBuffer = await renderToBuffer(
      createElement(HouseBLPDF, {
        booking: booking as any,
        logoBase64,
        qrBase64,
        approval,
      }) as any
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="HBL-${booking.hblNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('HBL PDF error:', error instanceof Error ? error.stack : error)
    return NextResponse.json({ error: 'Error generating HBL PDF', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
