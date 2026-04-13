import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, rejectionReason, type } = await req.json()

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'REJECTED' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Determine model
    const isFastQuote = type === 'fast_quote'
    const record = isFastQuote
      ? await prisma.fastQuote.findUnique({ where: { id: params.id } })
      : await prisma.quote.findUnique({ where: { id: params.id } })

    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Verify the user is the assignee OR is an ADMIN
    const isAssignee = record.assignedToId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    if (!isAssignee && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only SENT quotes can be responded to
    if (record.status !== 'SENT') {
      return NextResponse.json({ error: 'Solo se pueden responder cotizaciones en estado Enviada' }, { status: 400 })
    }

    const data: any = { status: action }
    if (action === 'REJECTED') {
      data.rejectionReason = rejectionReason.trim()
    }

    const updated = isFastQuote
      ? await prisma.fastQuote.update({ where: { id: params.id }, data })
      : await prisma.quote.update({ where: { id: params.id }, data })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('my-quotes respond error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 })
  }
}
