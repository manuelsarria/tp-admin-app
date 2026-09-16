export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { renderHblPdf } from '@/lib/pdf/renderHbl'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await renderHblPdf(params.id, {
      authorizedBy: session.user.name || session.user.email || 'Admin',
    })
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="HBL-${result.hblNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('HBL PDF error:', error instanceof Error ? error.stack : error)
    return NextResponse.json({ error: 'Error generating HBL PDF', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
