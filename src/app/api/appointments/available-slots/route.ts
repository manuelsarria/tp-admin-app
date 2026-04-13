export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function generateSlots(open: string, close: string, slotMinutes: number): string[] {
  const slots: string[] = []
  const [openH, openM] = open.split(':').map(Number)
  const [closeH, closeM] = close.split(':').map(Number)

  let currentMinutes = openH * 60 + openM
  const endMinutes = closeH * 60 + closeM

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60)
    const m = currentMinutes % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    currentMinutes += slotMinutes
  }

  return slots
}

// GET /api/appointments/available-slots?warehouseId=X&date=YYYY-MM-DD — PUBLIC
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const warehouseId = searchParams.get('warehouseId')
    const dateStr = searchParams.get('date')

    if (!warehouseId || !dateStr) {
      return NextResponse.json(
        { error: 'warehouseId and date are required' },
        { status: 400 }
      )
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    })

    if (!warehouse || !warehouse.isActive) {
      return NextResponse.json({ error: 'Almacén no encontrado' }, { status: 404 })
    }

    const date = new Date(dateStr + 'T12:00:00')
    const dayOfWeek = DAY_NAMES[date.getDay()]

    const config = (warehouse.scheduleConfig as Record<string, any>) || {}
    const dayConfig = config[dayOfWeek]

    if (!dayConfig) {
      return NextResponse.json({
        slots: [],
        closed: true,
        warehouseName: warehouse.name,
        dayOfWeek,
      })
    }

    const { open, close, slotMinutes } = dayConfig
    const slots = generateSlots(open, close, slotMinutes || 30)

    return NextResponse.json({
      slots,
      closed: false,
      warehouseName: warehouse.name,
      slotMinutes: slotMinutes || 30,
      dayOfWeek,
    })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 })
  }
}
