import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createContainerSchema, containerFilterSchema } from '@/lib/validation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'

// GET /api/containers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = request.nextUrl
    const params = Object.fromEntries(searchParams.entries())
    const filters = containerFilterSchema.parse(params)
    const { page, pageSize, sortBy, sortOrder, search, shippingLine } = filters

    const where = {
      ...(search && {
        OR: [
          { bl: { contains: search, mode: 'insensitive' as const } },
          { shippingLine: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(shippingLine && { shippingLine: { contains: shippingLine, mode: 'insensitive' as const } }),
    }

    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder },
      }),
      prisma.container.count({ where }),
    ])

    return NextResponse.json({
      data: containers,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 })
    }
    console.error('GET /api/containers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/containers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = createContainerSchema.parse(body)

    const container = await prisma.container.create({
      data: {
        ...validated,
        eta: new Date(validated.eta),
        arrivalDate: validated.arrivalDate ? new Date(validated.arrivalDate) : undefined,
        departureDate: validated.departureDate ? new Date(validated.departureDate) : undefined,
      },
    })

    return NextResponse.json(container, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/containers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
