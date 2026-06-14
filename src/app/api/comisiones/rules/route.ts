import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - All commission rules ordered by sortOrder (ADMIN or WORKER)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'WORKER') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const rules = await prisma.commissionRule.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error al obtener reglas de comisión:', error)
    return NextResponse.json({ error: 'Error al obtener las reglas' }, { status: 500 })
  }
}

// POST - Create a new commission rule (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { saleType, label, mode, value, active, sortOrder } = body

    // Validate required fields
    if (!saleType || !label || !mode || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'saleType, label, mode y value son requeridos' },
        { status: 400 }
      )
    }

    if (mode !== 'FIXED' && mode !== 'PERCENT') {
      return NextResponse.json(
        { error: 'El modo debe ser FIXED o PERCENT' },
        { status: 400 }
      )
    }

    const numValue = Number(value)
    if (!Number.isFinite(numValue) || numValue < 0 || (mode === 'PERCENT' && numValue > 100)) {
      return NextResponse.json(
        { error: 'El valor debe ser un número válido (0–100 para porcentaje)' },
        { status: 400 }
      )
    }

    const normalizedSaleType = String(saleType).trim().toUpperCase()

    // Check uniqueness
    const existing = await prisma.commissionRule.findUnique({
      where: { saleType: normalizedSaleType },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una regla con ese tipo de venta' },
        { status: 400 }
      )
    }

    const rule = await prisma.commissionRule.create({
      data: {
        saleType: normalizedSaleType,
        label,
        mode,
        value: numValue,
        active: active !== undefined ? Boolean(active) : true,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('Error al crear regla de comisión:', error)
    return NextResponse.json({ error: 'Error al crear la regla' }, { status: 500 })
  }
}
