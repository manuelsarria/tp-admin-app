import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const DEFAULT_STEPS = [
  { name: 'Cotización', order: 1 },
  { name: 'Orden de Compra', order: 2 },
  { name: 'Pago', order: 3 },
  { name: 'Producción', order: 4 },
  { name: 'Control de Calidad (QC)', order: 5 },
  { name: 'Embarque', order: 6 },
  { name: 'Aduana', order: 7 },
  { name: 'Entrega', order: 8 },
]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}

    if (session.user.role === 'ADMIN') {
      if (userId) where.userId = userId
    } else {
      where.userId = session.user.id
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    const checklists = await prisma.importChecklist.findMany({
      where,
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(checklists)
  } catch (error: any) {
    console.error('ImportChecklists GET error:', error?.message)
    return NextResponse.json({ error: 'Error fetching checklists' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    if (!['ADMIN', 'BUSINESS_USER', 'CUSTOMER_USER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Título es requerido' }, { status: 400 })
    }

    const steps = Array.isArray(body.steps) && body.steps.length > 0
      ? body.steps.map((s: any, i: number) => ({ name: s.name, order: s.order ?? i + 1 }))
      : DEFAULT_STEPS

    const checklist = await prisma.importChecklist.create({
      data: {
        title: body.title.trim(),
        productType: body.productType?.trim() || null,
        userId: role === 'ADMIN' && body.userId ? body.userId : session.user.id,
        steps: { create: steps },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(checklist, { status: 201 })
  } catch (error: any) {
    console.error('ImportChecklists POST error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Error creating checklist' }, { status: 500 })
  }
}
