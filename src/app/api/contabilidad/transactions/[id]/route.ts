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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { type, category, accountType, origin, description, amount, currency, date, reference, operationId } = body

  const tx = await prisma.accountingTransaction.update({
    where: { id: params.id },
    data: {
      type: type || undefined,
      category: category || undefined,
      accountType: accountType || undefined,
      origin: origin || undefined,
      description: description || undefined,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      currency: currency || undefined,
      date: date ? new Date(date) : undefined,
      reference: reference ?? null,
      operationId: operationId ?? null,
      updatedAt: new Date(),
    },
  })
  return NextResponse.json(tx)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.accountingTransaction.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
