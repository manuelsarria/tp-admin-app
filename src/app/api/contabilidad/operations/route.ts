import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
export const dynamic = 'force-dynamic'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']

async function checkAccess() {
  const user = await getCurrentUser()
  if (!user || (user.email && !ALLOWED_EMAILS.includes(user.email || "") && user.role !== 'ADMIN')) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') || ''
  const year = searchParams.get('year')

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { clientName: { contains: search, mode: 'insensitive' } },
      { shipmentRef: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (year) {
    where.createdAt = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${parseInt(year) + 1}-01-01`),
    }
  }

  const ops = await prisma.shipmentOperation.findMany({
    where,
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(ops)
}

export async function POST(req: NextRequest) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { title, clientName, clientCountry, clientPhone, shipmentRef, shipmentType,
    pol, pod, polDate, podDate, cbm, ingresoTotal, notes } = body

  if (!title || !clientName) {
    return NextResponse.json({ error: 'Título y cliente son requeridos' }, { status: 400 })
  }

  const op = await prisma.shipmentOperation.create({
    data: {
      title, clientName,
      clientCountry: clientCountry || 'PANAMA',
      clientPhone: clientPhone || null,
      shipmentRef: shipmentRef || null,
      shipmentType: shipmentType || 'FCL',
      pol: pol || null, pod: pod || null,
      polDate: polDate ? new Date(polDate) : null,
      podDate: podDate ? new Date(podDate) : null,
      cbm: cbm ? parseFloat(cbm) : null,
      ingresoTotal: parseFloat(ingresoTotal) || 0,
      notes: notes || null,
      userId: user.id,
    },
    include: { items: true },
  })

  return NextResponse.json(op, { status: 201 })
}
