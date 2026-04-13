import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const platform = searchParams.get('platform')
    const userId = searchParams.get('userId')

    const where: any = {}

    // Admin sees all, clients see only their own
    if (session.user.role === 'ADMIN') {
      if (userId) where.userId = userId
    } else {
      where.userId = session.user.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { products: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (platform && platform !== 'ALL') {
      where.platform = platform
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(suppliers)
  } catch (error: any) {
    console.error('Suppliers GET error:', error?.message)
    return NextResponse.json({ error: 'Error fetching suppliers' }, { status: 500 })
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

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nombre del proveedor es requerido' }, { status: 400 })
    }

    const rating = Math.max(1, Math.min(5, parseInt(body.rating) || 3))

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        city: body.city?.trim() || null,
        platform: body.platform || 'OTRO',
        contactWeChat: body.contactWeChat?.trim() || null,
        contactEmail: body.contactEmail?.trim() || null,
        contactPhone: body.contactPhone?.trim() || null,
        products: body.products?.trim() || null,
        rating,
        notes: body.notes?.trim() || null,
        linkedCargos: body.linkedCargos?.trim() || null,
        userId: role === 'ADMIN' && body.userId ? body.userId : session.user.id,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error: any) {
    console.error('Suppliers POST error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Error creating supplier' }, { status: 500 })
  }
}
