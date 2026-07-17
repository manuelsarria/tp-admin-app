// Movimientos "pendientes de clasificar": filas cuyo `scope` es una suposición
// del backfill que nadie confirmó (`scopeReviewed = false`). Mientras sigan así
// cuentan como NEGOCIO y ensucian la utilidad del negocio, así que se listan
// por monto descendente: primero lo que más mueve la aguja.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceAccess, logFinanceAudit } from '@/lib/finance-auth'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
})

const patchSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'Id requerido'),
        scope: z.enum(['NEGOCIO', 'PERSONAL']),
      }),
    )
    .min(1, 'No hay movimientos para clasificar'),
})

function yearRange(year: number) {
  return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) }
}

export async function GET(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()))
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  const where: any = { scopeReviewed: false }
  if (parsed.data.year !== undefined) where.date = yearRange(parsed.data.year)

  const data = await prisma.personalLedgerEntry.findMany({
    where,
    orderBy: { amount: 'desc' },
  })

  return NextResponse.json({ count: data.length, data })
}

export async function PATCH(request: NextRequest) {
  const guard = await requireFinanceAccess()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }
  const { items } = parsed.data

  // Todo o nada: una clasificación a medias dejaría los totales igual de
  // dudosos que antes.
  let updated = 0
  try {
    const results = await prisma.$transaction(
      items.map(it =>
        prisma.personalLedgerEntry.update({
          where: { id: it.id },
          data: { scope: it.scope, scopeReviewed: true, updatedById: guard.user.id },
        }),
      ),
    )
    updated = results.length
  } catch {
    return NextResponse.json({ error: 'No se pudo clasificar: algún movimiento ya no existe' }, { status: 400 })
  }

  await logFinanceAudit({
    action: 'classify-scope',
    user: guard.user,
    detail: { updated, items },
  })

  return NextResponse.json({ updated })
}
