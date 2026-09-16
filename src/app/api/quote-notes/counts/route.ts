export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import type { QuoteNoteEntity } from '@prisma/client'

const ENTIDADES: QuoteNoteEntity[] = ['QUOTE', 'FAST_QUOTE', 'INSURANCE_QUOTE']

/**
 * GET /api/quote-notes/counts?entity=QUOTE
 *
 * Cuántas notas tiene cada cotización, en una sola consulta: el listado pinta
 * el contador sin pedir el hilo de cada fila.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const raw = (req.nextUrl.searchParams.get('entity') || '').toUpperCase() as QuoteNoteEntity
    if (!ENTIDADES.includes(raw)) {
      return NextResponse.json({ error: 'entity inválida' }, { status: 400 })
    }

    const grupos = await prisma.quoteNote.groupBy({
      by: ['entityId'],
      where: { entity: raw },
      _count: { _all: true },
    })

    const counts: Record<string, number> = {}
    for (const g of grupos) counts[g.entityId] = g._count._all

    return NextResponse.json(counts)
  } catch (error) {
    console.error('GET /api/quote-notes/counts error:', error)
    return NextResponse.json({ error: 'Error al contar las notas' }, { status: 500 })
  }
}
