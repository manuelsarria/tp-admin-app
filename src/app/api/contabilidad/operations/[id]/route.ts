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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const op = await prisma.shipmentOperation.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  if (!op) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(op)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { title, clientName, clientCountry, clientPhone, shipmentRef, shipmentType,
    pol, pod, polDate, podDate, cbm, ingresoTotal, notes } = body

  const op = await prisma.shipmentOperation.update({
    where: { id: params.id },
    data: {
      title, clientName,
      clientCountry: clientCountry || undefined,
      clientPhone: clientPhone ?? null,
      shipmentRef: shipmentRef ?? null,
      shipmentType: shipmentType || undefined,
      pol: pol ?? null, pod: pod ?? null,
      polDate: polDate ? new Date(polDate) : null,
      podDate: podDate ? new Date(podDate) : null,
      cbm: cbm !== undefined ? (cbm ? parseFloat(cbm) : null) : undefined,
      ingresoTotal: ingresoTotal !== undefined ? parseFloat(ingresoTotal) : undefined,
      notes: notes ?? null,
      updatedAt: new Date(),
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(op)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.shipmentOperation.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
