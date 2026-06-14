import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const round2 = (n: number) => Math.round(n * 100) / 100

// GET - Dashboard data: sales, stats, rules
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

    const isAdmin = role === 'ADMIN'

    // Fetch sales scoped by role
    const sales = await prisma.commissionSale.findMany({
      where: isAdmin ? undefined : { workerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    // Compute stats
    const totalSales = round2(sales.reduce((acc, s) => acc + s.saleAmount, 0))
    const totalCommission = round2(sales.reduce((acc, s) => acc + s.commissionAmount, 0))
    const pendingCommission = round2(
      sales.filter((s) => s.status === 'PENDING').reduce((acc, s) => acc + s.commissionAmount, 0)
    )
    const paidCommission = round2(
      sales.filter((s) => s.status === 'PAID').reduce((acc, s) => acc + s.commissionAmount, 0)
    )

    // Fetch active rules ordered by sortOrder (for create form)
    const rules = await prisma.commissionRule.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      isAdmin,
      sales,
      stats: { totalSales, totalCommission, pendingCommission, paidCommission },
      rules,
    })
  } catch (error) {
    console.error('Error al obtener comisiones:', error)
    return NextResponse.json({ error: 'Error al obtener comisiones' }, { status: 500 })
  }
}

// POST - Create a new commission sale
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'WORKER') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { saleType, clientName, description, saleAmount } = body

    // Validate required fields
    if (!saleType || !clientName) {
      return NextResponse.json(
        { error: 'El tipo de venta y nombre del cliente son requeridos' },
        { status: 400 }
      )
    }

    if (typeof saleAmount !== 'number' || !Number.isFinite(saleAmount) || saleAmount < 0) {
      return NextResponse.json(
        { error: 'El monto de venta debe ser un número mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Look up active commission rule (normalize saleType to match stored rules)
    const normalizedSaleType = String(saleType).trim().toUpperCase()
    const rule = await prisma.commissionRule.findFirst({
      where: { saleType: normalizedSaleType, active: true },
    })

    if (!rule) {
      return NextResponse.json(
        { error: 'No se encontró una regla de comisión activa para ese tipo de venta' },
        { status: 400 }
      )
    }

    // Compute commission amount
    const commissionAmount =
      rule.mode === 'FIXED'
        ? round2(rule.value)
        : round2((saleAmount * rule.value) / 100)

    const sale = await prisma.commissionSale.create({
      data: {
        saleType: rule.saleType,
        saleLabel: rule.label,
        clientName,
        description: description ?? null,
        saleAmount: round2(saleAmount),
        commissionMode: rule.mode,
        commissionValue: rule.value,
        commissionAmount,
        status: 'PENDING',
        workerId: session.user.id,
        workerName: session.user.name ?? '',
        workerEmail: session.user.email ?? null,
      },
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error al crear venta de comisión:', error)
    return NextResponse.json({ error: 'Error al crear la venta' }, { status: 500 })
  }
}
