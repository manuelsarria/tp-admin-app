import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCargoSchema, cargoFilterSchema } from '@/lib/validation'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current user to check role and companyId
    const currentUser = await getCurrentUser()

    const { searchParams } = request.nextUrl
    const params = Object.fromEntries(searchParams.entries())
    const filters = cargoFilterSchema.parse(params)
    const { page, pageSize, sortBy, sortOrder, search, status, type, companyId } = filters

    const where = {
      ...(search && { tracking: { contains: search, mode: 'insensitive' as const } }),
      ...(status && { status }),
      ...(type && { type }),
      ...(companyId && { companyId }),
      // Filter by company for BUSINESS_USER role only (ADMIN and WORKER see all data)
      ...(currentUser?.role === 'BUSINESS_USER' && currentUser?.companyId && {
        companyId: currentUser.companyId,
      }),
    }

    const [cargos, total] = await Promise.all([
      prisma.cargo.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder },
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.cargo.count({ where }),
    ])

    return NextResponse.json({
      data: cargos,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 })
    }
    console.error('GET /api/cargos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createCargoSchema.parse(body)
    const cargo = await prisma.cargo.create({ data: validated })
    return NextResponse.json(cargo, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/cargos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
