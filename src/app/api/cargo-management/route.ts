import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCargoManagementSchema, cargoManagementFilterSchema } from '@/lib/validation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = request.nextUrl
    const params = Object.fromEntries(searchParams.entries())
    const filters = cargoManagementFilterSchema.parse(params)
    const { page, pageSize, sortBy, sortOrder, search, status, shippingLine } = filters

    const where = {
      ...(search && {
        OR: [
          { containerNumber: { contains: search, mode: 'insensitive' as const } },
          { location: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status }),
      ...(shippingLine && { shippingLine: { contains: shippingLine, mode: 'insensitive' as const } }),
    }

    const [records, total] = await Promise.all([
      prisma.cargoManagement.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder },
        include: {
          clients: {
            include: {
              company: { select: { id: true, name: true, company_id: true } },
            },
          },
        },
      }),
      prisma.cargoManagement.count({ where }),
    ])

    return NextResponse.json({
      data: records,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 })
    }
    console.error('GET /api/cargo-management error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateReferenceNo(): Promise<string> {
  // Get the latest record to determine the next reference number
  const latestRecord = await prisma.cargoManagement.findFirst({
    where: { referenceNo: { not: null } },
    orderBy: { referenceNo: 'desc' },
    select: { referenceNo: true },
  })

  let nextNumber = 7001 // Starting number if no records exist

  if (latestRecord?.referenceNo) {
    // Extract the number from format CNC-00007001 (strip any non-digit prefix)
    const currentNumber = parseInt(latestRecord.referenceNo.replace(/\D/g, ''), 10)
    if (!Number.isNaN(currentNumber)) {
      nextNumber = currentNumber + 1
    }
  }

  return `CNC-${nextNumber.toString().padStart(8, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = createCargoManagementSchema.parse(body)

    // Generate sequential reference number
    const referenceNo = await generateReferenceNo()

    // Create record and initial status history in a transaction
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.cargoManagement.create({
        data: {
          containerNumber: validated.containerNumber || '',
          eta: validated.eta ? new Date(validated.eta) : undefined,
          location: validated.location || '',
          status: validated.status || 'RECEIVED_IN_WAREHOUSE',
          referenceNo,
          departureDate: validated.departureDate ? new Date(validated.departureDate) : undefined,
          shippingLine: validated.shippingLine || undefined,
        },
      })

      // Create initial status history entry
      await tx.statusHistory.create({
        data: {
          cargoManagementId: created.id,
          status: validated.status || 'RECEIVED_IN_WAREHOUSE',
        }
      })

      return created
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/cargo-management error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
