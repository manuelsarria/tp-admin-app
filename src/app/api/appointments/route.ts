export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { sendAppointmentConfirmation } from '@/lib/appointmentEmail'

async function generateApptNumber(): Promise<string> {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const prefix = `APT${yy}${mm}${dd}`
  const count = await prisma.appointment.count({
    where: { apptNumber: { startsWith: prefix } },
  })
  return `${prefix}${String(count + 1).padStart(4, '0')}`
}

// GET /api/appointments — ADMIN/WORKER (list with filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const warehouseId = searchParams.get('warehouseId') || ''
    const date = searchParams.get('date') || ''
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (warehouseId) where.warehouseId = warehouseId
    if (status) where.status = status

    if (date) {
      const d = new Date(date + 'T00:00:00')
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      where.appointmentDate = { gte: d, lt: next }
    }

    if (search) {
      where.OR = [
        { apptNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: { warehouse: { select: { name: true, code: true } } },
        orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ])

    // Stats for today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const todayWhere: any = {
      appointmentDate: { gte: todayStart, lt: todayEnd },
    }
    if (warehouseId) todayWhere.warehouseId = warehouseId

    const stats = await prisma.appointment.groupBy({
      by: ['status'],
      where: todayWhere,
      _count: true,
    })

    const statsMap = {
      total: stats.reduce((sum, s) => sum + s._count, 0),
      confirmed: stats.find(s => s.status === 'CONFIRMED')?._count || 0,
      cancelled: stats.find(s => s.status === 'CANCELLED')?._count || 0,
      completed: stats.find(s => s.status === 'COMPLETED')?._count || 0,
      noShow: stats.find(s => s.status === 'NO_SHOW')?._count || 0,
    }

    return NextResponse.json({ appointments, total, stats: statsMap })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 })
  }
}

// POST /api/appointments — PUBLIC (create appointment from wizard)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      warehouseId, serviceType, appointmentDate, appointmentTime,
      clientName, clientEmail, clientPhone, clientRuc, companyName,
      description, pieces, weight, paymentProofUrl,
    } = body

    if (!warehouseId || !serviceType || !appointmentDate || !appointmentTime || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } })
    if (!warehouse || !warehouse.isActive) {
      return NextResponse.json({ error: 'Almacén no disponible' }, { status: 404 })
    }

    const apptNumber = await generateApptNumber()

    const appointment = await prisma.appointment.create({
      data: {
        apptNumber,
        warehouseId,
        serviceType,
        appointmentDate: new Date(appointmentDate + 'T12:00:00'),
        appointmentTime,
        clientName,
        clientEmail,
        clientPhone,
        clientRuc: clientRuc || null,
        companyName: companyName || null,
        description: description || null,
        pieces: pieces ? parseInt(pieces) : null,
        weight: weight ? parseFloat(weight) : null,
        paymentProofUrl: paymentProofUrl || null,
      },
      include: { warehouse: true },
    })

    // Send confirmation email (non-blocking)
    sendAppointmentConfirmation(appointment, warehouse).catch(err =>
      console.error('Error sending appointment email:', err)
    )

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 })
  }
}
