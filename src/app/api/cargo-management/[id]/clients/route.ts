import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const clientsSchema = z.object({
  clients: z.array(
    z.object({
      companyId: z.string().min(1),
      cbm: z.number().nonnegative().nullable().optional(),
      notes: z.string().nullable().optional(),
    })
  ),
})

// Replace the full set of clients assigned to a container.
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clients } = clientsSchema.parse(body)

    const exists = await prisma.cargoManagement.findUnique({ where: { id: params.id }, select: { id: true } })
    if (!exists) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

    // Dedupe by companyId (last one wins) to respect the unique constraint.
    const byCompany = new Map(clients.map(c => [c.companyId, c]))

    await prisma.$transaction([
      prisma.cargoManagementClient.deleteMany({ where: { cargoManagementId: params.id } }),
      ...(byCompany.size > 0
        ? [prisma.cargoManagementClient.createMany({
            data: Array.from(byCompany.values()).map(c => ({
              cargoManagementId: params.id,
              companyId: c.companyId,
              cbm: c.cbm ?? null,
              notes: c.notes ?? null,
            })),
          })]
        : []),
    ])

    const updated = await prisma.cargoManagement.findUnique({
      where: { id: params.id },
      include: { clients: { include: { company: { select: { id: true, name: true, company_id: true } } } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error(`PUT /api/cargo-management/${params.id}/clients error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
