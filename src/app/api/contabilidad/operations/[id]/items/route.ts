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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAccess()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { tipo, descripcion, medida, cantidad, costoUnit, isHighlighted, order, notes } = body

  const costoTotal = (parseFloat(cantidad) || 1) * (parseFloat(costoUnit) || 0)

  const item = await prisma.shipmentOperationItem.create({
    data: {
      operationId: params.id,
      tipo: tipo || 'ORIGEN',
      descripcion: descripcion || '',
      medida: medida || 'EVENTO',
      cantidad: parseFloat(cantidad) || 1,
      costoUnit: parseFloat(costoUnit) || 0,
      costoTotal,
      isHighlighted: !!isHighlighted,
      order: parseInt(order) || 0,
      notes: notes || null,
    },
  })

  // Update operation updatedAt
  await prisma.shipmentOperation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(item, { status: 201 })
}
