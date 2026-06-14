import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess } from '@/lib/finance-auth'
import { buildSummary, type LedgerRow } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const sp = request.nextUrl.searchParams
  const from = sp.get('from')
  const to = sp.get('to')
  const year = sp.get('year')

  const where: any = {}
  if (year) {
    const y = Number(year)
    where.date = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59) }
  } else if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  const rows = await prisma.personalLedgerEntry.findMany({
    where,
    select: { id: true, date: true, unit: true, type: true, category: true, status: true, amount: true },
  })

  const summary = buildSummary(rows as unknown as LedgerRow[])
  return NextResponse.json(summary)
}
