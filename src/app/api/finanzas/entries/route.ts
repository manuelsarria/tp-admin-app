import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'

export const dynamic = 'force-dynamic'

const entrySchema = z.object({
  date: z.string().or(z.date()),
  unit: z.string().min(1, 'Unidad requerida'),
  scope: z.enum(['NEGOCIO', 'PERSONAL']).default('NEGOCIO'),
  // Cualquier movimiento guardado desde el formulario está revisado por
  // definición: alguien eligió el ámbito a mano.
  scopeReviewed: z.boolean().optional(),
  type: z.enum(['INGRESO', 'EGRESO']),
  category: z.string().min(1, 'Categoría requerida'),
  subcategory: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  status: z.enum(['PAGADO', 'PENDIENTE', 'PARCIAL', 'ANULADO']).default('PAGADO'),
  counterparty: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().nonnegative('El monto no puede ser negativo'),
  receiptUrl: z.string().optional().nullable(),
  operationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const filterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(2000).default(100),
  sortBy: z.string().default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  from: z.string().optional(),
  to: z.string().optional(),
  unit: z.string().optional(),
  scope: z.enum(['NEGOCIO', 'PERSONAL']).optional(),
  type: z.enum(['INGRESO', 'EGRESO']).optional(),
  status: z.enum(['PAGADO', 'PENDIENTE', 'PARCIAL', 'ANULADO']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  // ?pendientes=1 → solo los movimientos cuyo ámbito nadie confirmó.
  pendientes: z
    .enum(['1', 'true', '0', 'false'])
    .optional()
    .transform(v => (v === undefined ? undefined : v === '1' || v === 'true')),
})

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = filterSchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  const f = parsed.data

  const where: any = {}
  if (f.unit) where.unit = f.unit
  if (f.scope) where.scope = f.scope
  if (f.type) where.type = f.type
  if (f.status) where.status = f.status
  if (f.category) where.category = f.category
  // pendientes=1 → sin revisar; pendientes=0 → solo los ya confirmados.
  if (f.pendientes !== undefined) where.scopeReviewed = !f.pendientes
  if (f.from || f.to) {
    where.date = {}
    if (f.from) where.date.gte = new Date(f.from)
    if (f.to) where.date.lte = new Date(f.to)
  }
  if (f.search) {
    where.OR = [
      { description: { contains: f.search, mode: 'insensitive' } },
      { counterparty: { contains: f.search, mode: 'insensitive' } },
      { reference: { contains: f.search, mode: 'insensitive' } },
      { category: { contains: f.search, mode: 'insensitive' } },
      { notes: { contains: f.search, mode: 'insensitive' } },
    ]
  }

  const sortable = ['date', 'amount', 'unit', 'scope', 'type', 'category', 'status', 'createdAt']
  const sortBy = sortable.includes(f.sortBy) ? f.sortBy : 'date'

  const [records, total] = await Promise.all([
    prisma.personalLedgerEntry.findMany({
      where,
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      orderBy: { [sortBy]: f.sortOrder },
    }),
    prisma.personalLedgerEntry.count({ where }),
  ])

  return NextResponse.json({
    data: records,
    meta: { page: f.page, pageSize: f.pageSize, total, totalPages: Math.ceil(total / f.pageSize) },
  })
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
  const parsed = entrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  const created = await prisma.personalLedgerEntry.create({
    data: {
      date: new Date(d.date),
      unit: d.unit,
      scope: d.scope,
      // Viene del formulario: el ámbito lo eligió una persona, no una regla.
      scopeReviewed: d.scopeReviewed ?? true,
      type: d.type,
      category: d.category,
      subcategory: d.subcategory ?? null,
      method: d.method ?? null,
      status: d.status,
      counterparty: d.counterparty ?? null,
      reference: d.reference ?? null,
      description: d.description ?? null,
      amount: d.amount,
      receiptUrl: d.receiptUrl ?? null,
      operationId: d.operationId ?? null,
      notes: d.notes ?? null,
      createdById: guard.user.id,
      updatedById: guard.user.id,
    },
  })
  await logFinanceAudit({ action: 'create', entityId: created.id, user: guard.user, detail: { unit: d.unit, scope: d.scope, type: d.type, amount: d.amount } })

  return NextResponse.json({ data: created }, { status: 201 })
}
