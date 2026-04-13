import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLclShipmentSchema, lclShipmentFilterSchema } from '@/lib/validation'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current user to check role and companyId
    const currentUser = await getCurrentUser()

    const { searchParams } = request.nextUrl
    const params = Object.fromEntries(searchParams.entries())
    const filters = lclShipmentFilterSchema.parse(params)
    const { page, pageSize, sortBy, sortOrder, search, startDate, endDate } = filters

    let where: any = {
      ...(search && {
        OR: [
          { blNumber: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(startDate && { eta: { gte: new Date(startDate) } }),
      ...(endDate && { eta: { lte: new Date(endDate) } }),
    }

    // Apply role-based filtering
    // ADMIN and WORKER see all data
    // BUSINESS_USER sees data for their company
    // CUSTOMER_USER sees data assigned to them (by userId)
    if (currentUser?.role === 'BUSINESS_USER' && currentUser?.companyId) {
      where.companyId = currentUser.companyId
    } else if (currentUser?.role === 'CUSTOMER_USER' && currentUser?.id) {
      // Filter by userId (user-assigned shipments)
      where.userId = currentUser.id
    }

    const [records, total] = await Promise.all([
      prisma.containerShipment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              company_id: true,
            },
          },
        },
      }),
      prisma.containerShipment.count({ where }),
    ])

    return NextResponse.json({
      data: records,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 })
    }
    console.error('GET /api/container-shipments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createLclShipmentSchema.parse(body)

    const record = await prisma.containerShipment.create({
      data: {
        blNumber: validated.blNumber,
        eta: new Date(validated.eta),
        notes: validated.notes,
        departureDate: new Date(validated.departureDate),
        cargoAmount: validated.cargoAmount || 0,
        totalCbm: validated.totalCbm || 0,
        companyId: validated.empresaId || null,
        itemType: validated.itemType || null,
        userId: validated.userId || null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            company_id: true,
          },
        },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/container-shipments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
