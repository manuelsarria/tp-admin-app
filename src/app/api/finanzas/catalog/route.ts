import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'
import { DEFAULT_UNITS, DEFAULT_CATEGORIES, DEFAULT_METHODS } from '@/lib/finance'

export const dynamic = 'force-dynamic'

const KINDS = ['unit', 'category', 'method'] as const
const DEFAULTS: Record<(typeof KINDS)[number], string[]> = {
  unit: DEFAULT_UNITS,
  category: DEFAULT_CATEGORIES,
  method: DEFAULT_METHODS,
}

// Returns active catalog values grouped by kind. Falls back to sensible
// defaults when a kind hasn't been seeded yet, so dropdowns are never empty.
export async function GET() {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const rows = await prisma.personalLedgerCatalog.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
  })

  const grouped: Record<string, { id: string; value: string }[]> = { unit: [], category: [], method: [] }
  for (const r of rows) {
    if (grouped[r.kind]) grouped[r.kind].push({ id: r.id, value: r.value })
  }
  // raw lists (just values) with defaults fallback, for the dropdowns
  const values: Record<string, string[]> = {}
  for (const k of KINDS) {
    values[k] = grouped[k].length > 0 ? grouped[k].map(g => g.value) : DEFAULTS[k]
  }

  return NextResponse.json({ values, items: grouped })
}

const createSchema = z.object({
  kind: z.enum(KINDS),
  value: z.string().min(1, 'Valor requerido').max(80),
})

export async function POST(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }

  try {
    const created = await prisma.personalLedgerCatalog.create({
      data: { kind: parsed.data.kind, value: parsed.data.value.trim() },
    })
    await logFinanceAudit({ action: 'catalog_add', entityId: created.id, user: guard.user, detail: parsed.data })
    return NextResponse.json({ data: created }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Ese valor ya existe' }, { status: 409 })
  }
}
