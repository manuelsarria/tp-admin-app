export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import type { QuoteNoteEntity } from '@prisma/client'

const ENTIDADES: QuoteNoteEntity[] = ['QUOTE', 'FAST_QUOTE', 'INSURANCE_QUOTE']

function parseEntity(value: string | null): QuoteNoteEntity | null {
  const upper = (value || '').toUpperCase() as QuoteNoteEntity
  return ENTIDADES.includes(upper) ? upper : null
}

/** GET /api/quote-notes?entity=QUOTE&entityId=xxx — hilo de notas, más viejas primero. */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const entity = parseEntity(sp.get('entity'))
    const entityId = (sp.get('entityId') || '').trim()
    if (!entity || !entityId) {
      return NextResponse.json({ error: 'Faltan entity y entityId' }, { status: 400 })
    }

    const notes = await prisma.quoteNote.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'asc' },
      include: { createdBy: { select: { id: true, name: true } } },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('GET /api/quote-notes error:', error)
    return NextResponse.json({ error: 'Error al obtener las notas' }, { status: 500 })
  }
}

/** POST /api/quote-notes — agrega una nota al hilo. */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entity: rawEntity, entityId, body } = await req.json()
    const entity = parseEntity(rawEntity)
    const texto = String(body ?? '').trim()

    if (!entity || !entityId) {
      return NextResponse.json({ error: 'Faltan entity y entityId' }, { status: 400 })
    }
    if (!texto) {
      return NextResponse.json({ error: 'La nota está vacía' }, { status: 400 })
    }

    const note = await prisma.quoteNote.create({
      data: { entity, entityId: String(entityId), body: texto, createdById: session.user.id || null },
      include: { createdBy: { select: { id: true, name: true } } },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/quote-notes error:', error)
    return NextResponse.json({ error: error?.message || 'Error al guardar la nota' }, { status: 500 })
  }
}
