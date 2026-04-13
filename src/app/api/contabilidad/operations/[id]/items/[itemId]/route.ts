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

export async function PUT(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { tipo, descripcion, medida, cantidad, costoUnit, isHighlighted, order, notes } = body

  const qty = parseFloat(cantidad) || 1
  const unit = parseFloat(costoUnit) || 0
  const costoTotal = qty * unit

  const item = await prisma.shipmentOperationItem.update({
    where: { id: params.itemId },
    data: {
      tipo: tipo || undefined,
      descripcion: descripcion !== undefined ? descripcion : undefined,
      medida: medida || undefined,
      cantidad: qty,
      costoUnit: unit,
      costoTotal,
      isHighlighted: isHighlighted !== undefined ? !!isHighlighted : undefined,
      order: order !== undefined ? parseInt(order) : undefined,
      notes: notes !== undefined ? notes : undefined,
    },
  })

  await prisma.shipmentOperation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(item)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.shipmentOperationItem.delete({ where: { id: params.itemId } })
  await prisma.shipmentOperation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  })
  return NextResponse.json({ success: true })
}
