import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  date: z.string().or(z.date()).optional(),
  unit: z.string().min(1).optional(),
  scope: z.enum(['NEGOCIO', 'PERSONAL']).optional(),
  scopeReviewed: z.boolean().optional(),
  type: z.enum(['INGRESO', 'EGRESO']).optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  status: z.enum(['PAGADO', 'PENDIENTE', 'PARCIAL', 'ANULADO']).optional(),
  counterparty: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().nonnegative().optional(),
  receiptUrl: z.string().optional().nullable(),
  operationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response
  const record = await prisma.personalLedgerEntry.findUnique({ where: { id: params.id } })
  if (!record) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ data: record })
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

  const data: any = { updatedById: guard.user.id }
  for (const k of ['unit', 'scope', 'scopeReviewed', 'type', 'category', 'subcategory', 'method', 'status', 'counterparty', 'reference', 'description', 'amount', 'receiptUrl', 'operationId', 'notes'] as const) {
    if (d[k] !== undefined) data[k] = d[k]
  }
  if (d.date !== undefined) data.date = new Date(d.date)
  // Si el payload trae un `scope` explícito, alguien lo eligió a mano: queda
  // revisado, salvo que el propio payload diga lo contrario.
  if (d.scope !== undefined && d.scopeReviewed === undefined) data.scopeReviewed = true

  try {
    const updated = await prisma.personalLedgerEntry.update({ where: { id: params.id }, data })
    await logFinanceAudit({ action: 'update', entityId: params.id, user: guard.user, detail: data })
    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response
  try {
    const existing = await prisma.personalLedgerEntry.findUnique({ where: { id: params.id } })
    await prisma.personalLedgerEntry.delete({ where: { id: params.id } })
    await logFinanceAudit({ action: 'delete', entityId: params.id, user: guard.user, detail: existing ?? undefined })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
}
