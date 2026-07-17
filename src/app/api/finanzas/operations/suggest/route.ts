import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess } from '@/lib/finance-auth'
import {
  computeOperationDerived,
  extractContainerNumber,
  normalizeRef,
} from '@/lib/operations'

export const dynamic = 'force-dynamic'

// The matcher. It PROPOSES groups of unlinked ledger entries that look like the
// same job; the owner confirms via POST /api/finanzas/operations/[id]/entries.
//
// It never writes anything and never auto-links. Two rules only, both exact:
//   1. same normalizeRef(reference)      → same group
//   2. same container number in the text → merge those groups (same container
//                                          = same job)
// No fuzzy matching on purpose: "2 contenedores colchones 1 triciclos" and
// "3 contenedores 2 colchones 1 triciclos" are the same job in real life, but
// nothing in the text proves it. They surface as two suggestions and the owner
// merges them by hand. A false merge silently corrupts a P&L; a missed merge
// is visible and one click away.

const DEFAULT_UNIT = 'Contenedores Valdai'

const filterSchema = z.object({
  unit: z.string().min(1).optional(),
})

interface SuggestEntry {
  id: string
  date: Date
  type: string
  category: string
  description: string | null
  reference: string | null
  amount: number
}

interface Suggestion {
  key: string
  suggestedName: string
  containerNumber: string | null
  entries: SuggestEntry[]
  ingresado: number
  invertido: number
  ganancia: number
  mergedFrom?: string[]
}

interface Bucket {
  key: string
  refs: string[] // raw references seen, for naming
  rows: Array<SuggestEntry & { status: string; scope: string }>
}

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = filterSchema.safeParse(params)
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  const unit = parsed.data.unit?.trim() || DEFAULT_UNIT

  const candidates = await prisma.personalLedgerEntry.findMany({
    where: {
      unit,
      operationId: null,
      scope: 'NEGOCIO', // personal spend never belongs to a container's P&L
      reference: { not: null },
      NOT: { reference: '' },
    },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      type: true,
      category: true,
      description: true,
      reference: true,
      amount: true,
      status: true,
      scope: true,
    },
  })

  // 1. group by normalized reference
  const buckets = new Map<string, Bucket>()
  for (const e of candidates) {
    const raw = (e.reference ?? '').trim()
    if (!raw) continue
    const key = normalizeRef(raw)
    if (!key) continue
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { key, refs: [], rows: [] }
      buckets.set(key, bucket)
    }
    bucket.refs.push(raw)
    bucket.rows.push(e as SuggestEntry & { status: string; scope: string })
  }

  // 2. merge buckets that name the same container
  const byContainer = new Map<string, Bucket[]>()
  const standalone: Bucket[] = []
  for (const bucket of buckets.values()) {
    const container = extractContainerNumber(bucket.key)
    if (container) {
      const list = byContainer.get(container)
      if (list) list.push(bucket)
      else byContainer.set(container, [bucket])
    } else {
      standalone.push(bucket)
    }
  }

  const suggestions: Suggestion[] = []

  for (const [container, group] of byContainer.entries()) {
    const rows = group.flatMap(b => b.rows)
    const keys = group.map(b => b.key)
    suggestions.push({
      key: keys.length > 1 ? `container:${container}` : keys[0],
      suggestedName: `Contenedor ${container}`,
      containerNumber: container,
      entries: toEntries(rows),
      ...money(rows),
      ...(keys.length > 1 ? { mergedFrom: keys } : {}),
    })
  }

  for (const bucket of standalone) {
    suggestions.push({
      key: bucket.key,
      suggestedName: pickName(bucket.refs),
      containerNumber: null,
      entries: toEntries(bucket.rows),
      ...money(bucket.rows),
    })
  }

  // Biggest money first: total volume moved, so a big cost-only group ranks
  // as high as a big income-only one (both need linking to make sense).
  suggestions.sort((a, b) => b.ingresado + b.invertido - (a.ingresado + a.invertido))

  return NextResponse.json({ suggestions })
}

/** Money uses the same rule as the real P&L: PAGADO + NEGOCIO only. */
function money(rows: Array<SuggestEntry & { status: string; scope: string }>) {
  const { ingresado, invertido, ganancia } = computeOperationDerived({ entries: rows })
  return { ingresado, invertido, ganancia }
}

function toEntries(rows: SuggestEntry[]): SuggestEntry[] {
  return rows
    .map(r => ({
      id: r.id,
      date: r.date,
      type: r.type,
      category: r.category,
      description: r.description,
      reference: r.reference,
      amount: r.amount,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** The owner's own wording is the best name: longest raw reference wins. */
function pickName(refs: string[]): string {
  return refs.reduce((best, r) => (r.length > best.length ? r : best), refs[0] ?? '')
}
