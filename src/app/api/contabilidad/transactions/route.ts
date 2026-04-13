import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
export const dynamic = 'force-dynamic'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']
async function checkAccess() {
  const user = await getCurrentUser()
  if (!user || (user.email && !ALLOWED_EMAILS.includes(user.email || "") && user.role !== 'ADMIN')) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')
  const origin = searchParams.get('origin')
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  const where: any = {}
  if (type) where.type = type
  if (origin) where.origin = origin
  if (year) {
    const y = parseInt(year)
    const m = month ? parseInt(month) : null
    if (m) {
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
    } else {
      where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) }
    }
  }

  const txs = await prisma.accountingTransaction.findMany({
    where,
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(txs)
}

export async function POST(req: NextRequest) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { type, category, accountType, origin, description, amount, currency, date, reference, operationId } = body

  if (!type || !description || amount === undefined) {
    return NextResponse.json({ error: 'Tipo, descripción y monto son requeridos' }, { status: 400 })
  }

  const tx = await prisma.accountingTransaction.create({
    data: {
      type,
      category: category || 'OTROS',
      accountType: accountType || (type === 'INCOME' ? 'REVENUE' : 'OPERATING_EXPENSE'),
      origin: origin || 'PANAMA',
      description,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      date: date ? new Date(date) : new Date(),
      reference: reference || null,
      operationId: operationId || null,
      userId: user.id,
    },
  })
  return NextResponse.json(tx, { status: 201 })
}
