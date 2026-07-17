import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { withOperationDerived } from '@/lib/operations'

export const dynamic = 'force-dynamic'

const operationSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  containerNumber: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  status: z.enum(['ABIERTA', 'CERRADA']).default('ABIERTA'),
  eta: z.string().or(z.date()).optional().nullable(),
  startDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

const filterSchema = z.object({
  status: z.enum(['ABIERTA', 'CERRADA']).optional(),
})

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = filterSchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  const where: any = {}
  if (parsed.data.status) where.status = parsed.data.status

  const operations = await prisma.personalOperation.findMany({
    where,
    include: { entries: { orderBy: { date: 'asc' } } },
  })

  // Ganancia is derived, so it can't be sorted in SQL — order in memory.
  const data = operations.map(withOperationDerived).sort((a, b) => b.ganancia - a.ganancia)

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = operationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const created = await prisma.personalOperation.create({
    data: {
      name: d.name,
      containerNumber: d.containerNumber ?? null,
      unit: d.unit ?? null,
      status: d.status,
      eta: d.eta ? new Date(d.eta) : null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      closedAt: d.status === 'CERRADA' ? new Date() : null,
      notes: d.notes ?? null,
      createdById: guard.user.id,
    },
    include: { entries: true },
  })

  await logFinanceAudit({
    action: 'operation.create',
    entityId: created.id,
    user: guard.user,
    detail: { name: d.name, containerNumber: d.containerNumber ?? null, unit: d.unit ?? null },
  })

  return NextResponse.json({ data: withOperationDerived(created) }, { status: 201 })
}
