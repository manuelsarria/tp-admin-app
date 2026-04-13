import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

async function getChecklistWithAuth(id: string, session: any) {
  const checklist = await prisma.importChecklist.findUnique({
    where: { id },
    include: { steps: { orderBy: { order: 'asc' } } },
  })
  if (!checklist) return { error: 'Not found', status: 404 }
  if (session.user.role !== 'ADMIN' && checklist.userId !== session.user.id) {
    return { error: 'Forbidden', status: 403 }
  }
  return { checklist }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getChecklistWithAuth(params.id, session)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(result.checklist)
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getChecklistWithAuth(params.id, session)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    const body = await req.json()
    const data: Record<string, any> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.productType !== undefined) data.productType = body.productType
    if (body.status !== undefined) data.status = body.status

    const checklist = await prisma.importChecklist.update({
      where: { id: params.id },
      data,
      include: { steps: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json(checklist)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error updating checklist' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getChecklistWithAuth(params.id, session)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    await prisma.importChecklist.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error deleting checklist' }, { status: 500 })
  }
}
