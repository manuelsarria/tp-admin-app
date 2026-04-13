import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateContainerSchema } from '@/lib/validation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const container = await prisma.container.findUnique({ where: { id: params.id } })
    if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    return NextResponse.json(container)
  } catch (error) {
    console.error(`GET /api/containers/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = updateContainerSchema.parse(body)

    const container = await prisma.container.update({
      where: { id: params.id },
      data: {
        ...validated,
        eta: validated.eta ? new Date(validated.eta) : undefined,
        arrivalDate: validated.arrivalDate ? new Date(validated.arrivalDate) : undefined,
        departureDate: validated.departureDate ? new Date(validated.departureDate) : undefined,
      },
    })

    return NextResponse.json(container)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error(`PATCH /api/containers/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.container.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/containers/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
