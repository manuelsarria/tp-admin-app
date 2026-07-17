export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { computeLoanDerived } from '@/lib/loans'
import { LoanReportDocument } from '@/components/finanzas/LoanReportPDF'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  try {
    const loan = await prisma.personalLoan.findUnique({
      where: { id: params.id },
      include: { payments: { orderBy: { date: 'asc' } } },
    })
    if (!loan) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const derived = computeLoanDerived(loan)

    const bannerPath = path.join(process.cwd(), 'public', 'images', 'TP-banner.png')
    const bannerBase64 = fs.existsSync(bannerPath)
      ? `data:image/png;base64,${fs.readFileSync(bannerPath).toString('base64')}`
      : null

    const pdfBuffer = await renderToBuffer(
      createElement(LoanReportDocument, {
        loan: { ...loan, ...derived },
        bannerBase64,
      }) as ReactElement<any>
    )

    await logFinanceAudit({
      action: 'loan.report',
      entityId: loan.id,
      user: guard.user,
      detail: { name: loan.name, payments: loan.payments.length },
    })

    // Strip characters that would break the Content-Disposition header.
    const safeName = loan.name.replace(/["\\\r\n]/g, '').trim() || 'prestamo'

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}.pdf"; filename*=UTF-8''${encodeURIComponent(`${safeName}.pdf`)}`,
      },
    })
  } catch (error) {
    console.error('Loan report PDF generation error:', error)
    return NextResponse.json({ error: 'Error generando el PDF' }, { status: 500 })
  }
}
