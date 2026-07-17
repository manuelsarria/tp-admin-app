import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { withOperationDerived } from '@/lib/operations'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').optional(),
  containerNumber: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  status: z.enum(['ABIERTA', 'CERRADA']).optional(),
  eta: z.string().or(z.date()).optional().nullable(),
  startDate: z.string().or(z.date()).optional().nullable(),
  closedAt: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const operation = await prisma.personalOperation.findUnique({
    where: { id: params.id },
    include: { entries: { orderBy: { date: 'asc' } } },
  })
  if (!operation) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json({ data: withOperationDerived(operation) })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const data: any = {}
  for (const k of ['name', 'containerNumber', 'unit', 'status', 'notes'] as const) {
    if (d[k] !== undefined) data[k] = d[k]
  }
  for (const k of ['eta', 'startDate', 'closedAt'] as const) {
    if (d[k] !== undefined) data[k] = d[k] ? new Date(d[k] as string | Date) : null
  }
  // Closing stamps closedAt, reopening clears it — unless the caller set it.
  if (d.status !== undefined && d.closedAt === undefined) {
    data.closedAt = d.status === 'CERRADA' ? new Date() : null
  }

  try {
    const updated = await prisma.personalOperation.update({
      where: { id: params.id },
      data,
      include: { entries: { orderBy: { date: 'asc' } } },
    })
    await logFinanceAudit({ action: 'operation.update', entityId: params.id, user: guard.user, detail: data })
    return NextResponse.json({ data: withOperationDerived(updated) })
  } catch {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  try {
    const existing = await prisma.personalOperation.findUnique({
      where: { id: params.id },
      include: { entries: { select: { id: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    // The FK is ON DELETE SET NULL: linked entries are NOT deleted, they just
    // unlink and go back to the pool of candidates. The money still happened —
    // deleting an operation only undoes the grouping, never the journal.
    await prisma.personalOperation.delete({ where: { id: params.id } })

    await logFinanceAudit({
      action: 'operation.delete',
      entityId: params.id,
      user: guard.user,
      detail: {
        name: existing.name,
        containerNumber: existing.containerNumber,
        unit: existing.unit,
        unlinkedEntryIds: existing.entries.map(e => e.id),
      },
    })
    return NextResponse.json({ ok: true, unlinkedEntries: existing.entries.length })
  } catch {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }
}
