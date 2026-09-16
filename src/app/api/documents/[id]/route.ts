export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { readDocument, deleteDocumentFile } from '@/lib/documentStorage'

function puedeVerDocumentos(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'WORKER'
}

// GET /api/documents/[id] — descarga autenticada.
//
// Los archivos viven fuera de public/, así que la única forma de llegar a
// ellos es por aquí, con sesión.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !puedeVerDocumentos(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  try {
    const buffer = await readDocument(doc.storedName)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.originalName)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
  }
}

// DELETE /api/documents/[id] — ADMIN/WORKER, o quien lo subió.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  const esInterno = puedeVerDocumentos(session.user.role)
  const esDueno = doc.uploadedById === session.user.id
  if (!esInterno && !esDueno) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  await prisma.document.delete({ where: { id: params.id } })
  await deleteDocumentFile(doc.storedName)

  return NextResponse.json({ ok: true })
}
