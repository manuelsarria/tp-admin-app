import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCompanySchema, companyFilterSchema } from '@/lib/validation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force dynamic rendering - always fetch fresh data from database
export const dynamic = 'force-dynamic'

// GET /api/companies - List companies with pagination & filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = request.nextUrl
    const params = Object.fromEntries(searchParams.entries())

    const filters = companyFilterSchema.parse(params)
    const { page, pageSize, sortBy, sortOrder, search, isActive, industry } = filters

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { ruc: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(industry && { industry: { contains: industry, mode: 'insensitive' as const } }),
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder },
        include: {
          _count: {
            select: { users: true, cargos: true },
          },
        },
      }),
      prisma.company.count({ where }),
    ])

    return NextResponse.json({
      data: companies,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 })
    }
    console.error('GET /api/companies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/companies - Create company
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = createCompanySchema.parse(body)

    const company = await prisma.company.create({
      data: validated,
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/companies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
