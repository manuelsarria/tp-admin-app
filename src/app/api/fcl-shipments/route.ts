import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createFclShipmentSchema, fclShipmentFilterSchema } from '@/lib/validation'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current user to check role and companyId
    const currentUser = await getCurrentUser()

    const { searchParams } = request.nextUrl
    const params = Object.fromEntries(searchParams.entries())
    const filters = fclShipmentFilterSchema.parse(params)
    const { page, pageSize, sortBy, sortOrder, search, transportType, misidentified } = filters

    let where: any = {
      ...(search && {
        OR: [
          { trackingWarehouse: { contains: search, mode: 'insensitive' as const } },
          { containerNumber: { contains: search, mode: 'insensitive' as const } },
          { forwarder: { contains: search, mode: 'insensitive' as const } },
          { mailbox: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(transportType && { transportType }),
      ...(misidentified !== undefined && { misidentified }),
    }

    // Apply role-based filtering
    // ADMIN and WORKER see all data
    // MBE_MANAGER sees only MBE-prefixed mailbox shipments
    // BUSINESS_USER sees data for their company
    // CUSTOMER_USER sees data assigned to them (by userId or mailbox)
    if (currentUser?.role === 'MBE_MANAGER') {
      where.mailbox = { startsWith: 'MBE', mode: 'insensitive' }
    } else if (currentUser?.role === 'BUSINESS_USER' && currentUser?.companyId) {
      where.companyId = currentUser.companyId
    } else if (currentUser?.role === 'CUSTOMER_USER' && currentUser?.id) {
      // Filter by userId (user-assigned shipments) or by mailbox (legacy)
      where.OR = [
        { userId: currentUser.id },
        { mailbox: currentUser.mailbox },
      ]
    }

    const [records, total] = await Promise.all([
      prisma.fclShipment.findMany({
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
          pieces: true,
        },
      }),
      prisma.fclShipment.count({ where }),
    ])

    return NextResponse.json({
      data: records,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 })
    }
    console.error('GET /api/fcl-shipments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle bulk creation
    if (Array.isArray(body)) {
      const validated = body.map(item => createFclShipmentSchema.parse(item))

      // Extract company codes from mailbox values (take part before '-' if exists)
      // Example: "JCI-0008" -> "JCI", "COD-123" -> "COD", "MBX" -> "MBX"
      const extractCompanyCode = (mailbox: string): string => {
        return mailbox.includes('-') ? mailbox.split('-')[0] : mailbox
      }

      const mailboxes = validated.map(item => item.mailbox)
      const companyCodes = [...new Set(mailboxes.map(extractCompanyCode))] // Unique codes only

      // Find companies by extracted company codes
      const companies = await prisma.company.findMany({
        where: {
          company_id: { in: companyCodes },
          isActive: true,
        },
        select: { id: true, company_id: true },
      })

      // Create a map of extracted company_code -> company.id
      const companyCodeMap = new Map(companies.map(c => [c.company_id, c.id]))

      // Check for invalid mailboxes (extract code and check if it exists)
      const invalidMailboxes = mailboxes.filter(mb => !companyCodeMap.has(extractCompanyCode(mb)))
      if (invalidMailboxes.length > 0) {
        return NextResponse.json({
          error: 'Invalid Casillero values',
          details: `The following Casillero values do not match any active company: ${invalidMailboxes.join(', ')}`,
          invalidValues: invalidMailboxes,
        }, { status: 400 })
      }

      const records = await prisma.fclShipment.createMany({
        data: validated.map(item => ({
          trackingWarehouse: item.trackingWarehouse,
          forwarder: item.forwarder,
          mailbox: item.mailbox,
          transportType: item.transportType || 'MAR',
          containerNumber: item.containerNumber,
          approximateDate: item.approximateDate ? new Date(item.approximateDate) : undefined,
          misidentified: item.misidentified || false,
          dangerousGoods: item.dangerousGoods || false,
          refrigeratedProduct: item.refrigeratedProduct || false,
          companyId: item.companyId || companyCodeMap.get(extractCompanyCode(item.mailbox)) || null,
          itemType: item.itemType || null,
          userId: item.userId || null,
        })),
      })

      return NextResponse.json({
        success: true,
        count: records.count,
        message: `${records.count} shipment(s) created successfully`
      }, { status: 201 })
    }

    // Handle single creation
    const validated = createFclShipmentSchema.parse(body)

    // Extract company code from mailbox (take part before '-' if exists)
    const extractCompanyCode = (mailbox: string): string => {
      return mailbox.includes('-') ? mailbox.split('-')[0] : mailbox
    }

    const companyCode = extractCompanyCode(validated.mailbox)

    // Find company by extracted company code
    const company = await prisma.company.findFirst({
      where: {
        company_id: companyCode,
        isActive: true,
      },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json({
        error: 'Invalid Casillero',
        details: `Casillero "${validated.mailbox}" (code: "${companyCode}") does not match any active company`,
      }, { status: 400 })
    }

    const record = await prisma.fclShipment.create({
      data: {
        trackingWarehouse: validated.trackingWarehouse,
        forwarder: validated.forwarder,
        mailbox: validated.mailbox,
        transportType: validated.transportType || 'MAR',
        containerNumber: validated.containerNumber,
        approximateDate: validated.approximateDate ? new Date(validated.approximateDate) : undefined,
        misidentified: validated.misidentified || false,
        dangerousGoods: validated.dangerousGoods || false,
        refrigeratedProduct: validated.refrigeratedProduct || false,
        companyId: validated.companyId || company.id,
        itemType: validated.itemType || null,
        userId: validated.userId || null,
        totalCbm: validated.totalCbm ?? null,
        totalWeight: validated.totalWeight ?? null,
        comments: validated.comments ?? null,
        additionalCode: validated.additionalCode ?? null,
        ...(validated.pieces && validated.pieces.length > 0 && {
          pieces: { create: validated.pieces },
        }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            company_id: true,
          },
        },
        pieces: true,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/fcl-shipments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
