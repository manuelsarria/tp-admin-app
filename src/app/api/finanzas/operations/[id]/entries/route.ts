import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { withOperationDerived } from '@/lib/operations'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1, 'Seleccione al menos un movimiento'),
})

async function readBody(request: NextRequest) {
  try {
    return { ok: true as const, body: await request.json() }
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  }
}

/** Link the given ledger entries to this operation. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const read = await readBody(request)
  if (!read.ok) return read.response
  const parsed = bodySchema.safeParse(read.body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const entryIds = Array.from(new Set(parsed.data.entryIds))

  const operation = await prisma.personalOperation.findUnique({ where: { id: params.id } })
  if (!operation) return NextResponse.json({ error: 'Operación no encontrada' }, { status: 404 })

  const found = await prisma.personalLedgerEntry.findMany({
    where: { id: { in: entryIds } },
    select: { id: true },
  })
  if (found.length !== entryIds.length) {
    return NextResponse.json({ error: 'Uno o más movimientos no existen' }, { status: 400 })
  }

  const updated = await prisma.$transaction(async tx => {
    // Linking is idempotent: entries already on another operation are moved here.
    await tx.personalLedgerEntry.updateMany({
      where: { id: { in: entryIds } },
      data: { operationId: params.id },
    })
    return tx.personalOperation.findUnique({
      where: { id: params.id },
      include: { entries: { orderBy: { date: 'asc' } } },
    })
  })

  await logFinanceAudit({
    action: 'operation.entries.link',
    entityId: params.id,
    user: guard.user,
    detail: { entryIds },
  })

  return NextResponse.json({ data: updated ? withOperationDerived(updated) : null, linked: entryIds.length })
}

/** Unlink the given ledger entries from this operation (entries are kept). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const read = await readBody(request)
  if (!read.ok) return read.response
  const parsed = bodySchema.safeParse(read.body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const entryIds = Array.from(new Set(parsed.data.entryIds))

  const operation = await prisma.personalOperation.findUnique({ where: { id: params.id } })
  if (!operation) return NextResponse.json({ error: 'Operación no encontrada' }, { status: 404 })

  const { updated, unlinked } = await prisma.$transaction(async tx => {
    // Scoped to this operation: never touches an entry linked elsewhere.
    const res = await tx.personalLedgerEntry.updateMany({
      where: { id: { in: entryIds }, operationId: params.id },
      data: { operationId: null },
    })
    const op = await tx.personalOperation.findUnique({
      where: { id: params.id },
      include: { entries: { orderBy: { date: 'asc' } } },
    })
    return { updated: op, unlinked: res.count }
  })

  await logFinanceAudit({
    action: 'operation.entries.unlink',
    entityId: params.id,
    user: guard.user,
    detail: { entryIds, unlinked },
  })

  return NextResponse.json({ data: updated ? withOperationDerived(updated) : null, unlinked })
}
