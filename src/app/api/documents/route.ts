export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { saveDocument, deleteDocumentFile, ALLOWED_DOC_TYPES, MAX_DOC_SIZE } from '@/lib/documentStorage'

const TIPOS_DOCUMENTO = ['MBL', 'DCME', 'HBL', 'OTHER'] as const
type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

/** Los documentos de embarque los maneja el equipo interno. */
function puedeVerDocumentos(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'WORKER'
}

// GET /api/documents?lclContainerId=...  — documentos de un MBL
//     /api/documents?lclBookingId=...    — documentos de un HBL
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !puedeVerDocumentos(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const lclContainerId = request.nextUrl.searchParams.get('lclContainerId')
  const lclBookingId = request.nextUrl.searchParams.get('lclBookingId')
  if (!lclContainerId && !lclBookingId) {
    return NextResponse.json({ error: 'Falta lclContainerId o lclBookingId' }, { status: 400 })
  }

  const documents = await prisma.document.findMany({
    where: lclContainerId ? { lclContainerId } : { lclBookingId: lclBookingId! },
    select: {
      id: true,
      kind: true,
      originalName: true,
      mimeType: true,
      size: true,
      notes: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(documents)
}

// POST /api/documents — sube un documento (multipart/form-data)
// campos: file, kind, lclContainerId?, lclBookingId?, notes?
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !puedeVerDocumentos(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file') as File | null
  const kind = (form.get('kind') as string) || 'OTHER'
  const lclContainerId = (form.get('lclContainerId') as string) || null
  const lclBookingId = (form.get('lclBookingId') as string) || null
  const notes = (form.get('notes') as string) || null

  if (!file) {
    return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })
  }
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo PDF, JPEG, PNG o WebP.' }, { status: 400 })
  }
  if (file.size > MAX_DOC_SIZE) {
    return NextResponse.json({ error: 'El archivo excede el límite de 15MB' }, { status: 400 })
  }

  if (!TIPOS_DOCUMENTO.includes(kind as TipoDocumento)) {
    return NextResponse.json({ error: `Tipo de documento inválido: ${kind}` }, { status: 400 })
  }
  if (!lclContainerId && !lclBookingId) {
    return NextResponse.json({ error: 'Falta el MBL o el HBL al que pertenece' }, { status: 400 })
  }

  // Se verifica que el padre exista ANTES de escribir en disco: si no, el
  // insert falla por llave foránea y el archivo queda huérfano para siempre.
  const padreExiste = lclContainerId
    ? await prisma.lclContainer.count({ where: { id: lclContainerId } })
    : await prisma.lclBooking.count({ where: { id: lclBookingId! } })
  if (!padreExiste) {
    return NextResponse.json({ error: 'El MBL o HBL indicado no existe' }, { status: 404 })
  }

  const { storedName, size } = await saveDocument(file)

  try {
  const doc = await prisma.document.create({
    data: {
      kind: kind as TipoDocumento,
      originalName: file.name,
      storedName,
      mimeType: file.type,
      size,
      uploadedById: session.user.id,
      lclContainerId,
      lclBookingId,
      notes,
    },
    select: {
      id: true,
      kind: true,
      originalName: true,
      mimeType: true,
      size: true,
      notes: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    // Si la fila no se pudo crear, el archivo ya está en disco: se borra para
    // no dejar basura que nada referencia.
    await deleteDocumentFile(storedName)
    console.error('POST /api/documents error:', error)
    return NextResponse.json({ error: 'No se pudo guardar el documento' }, { status: 500 })
  }
}
