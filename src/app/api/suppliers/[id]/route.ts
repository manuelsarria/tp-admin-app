import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

async function getSupplierWithAuth(id: string, session: any) {
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) return { error: 'Not found', status: 404 }
  if (session.user.role !== 'ADMIN' && supplier.userId !== session.user.id) {
    return { error: 'Forbidden', status: 403 }
  }
  return { supplier }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getSupplierWithAuth(params.id, session)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json(result.supplier)
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getSupplierWithAuth(params.id, session)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    const body = await req.json()
    const data: Record<string, any> = {}
    const allowed = [
      'name', 'city', 'platform', 'contactWeChat', 'contactEmail', 'contactPhone',
      'products', 'rating', 'notes', 'linkedCargos',
    ]
    allowed.forEach(k => { if (k in body) data[k] = body[k] })
    if (data.rating) data.rating = Math.max(1, Math.min(5, parseInt(data.rating) || 3))

    const supplier = await prisma.supplier.update({ where: { id: params.id }, data })
    return NextResponse.json(supplier)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error updating supplier' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getSupplierWithAuth(params.id, session)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

    await prisma.supplier.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error deleting supplier' }, { status: 500 })
  }
}
