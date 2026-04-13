export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/warehouses — PUBLIC (no auth, wizard needs this)
export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        scheduleConfig: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json({ error: 'Error al obtener almacenes' }, { status: 500 })
  }
}
