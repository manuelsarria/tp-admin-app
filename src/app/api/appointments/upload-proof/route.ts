export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// POST /api/appointments/upload-proof — PUBLIC (no auth)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo PDF, JPEG, PNG o WebP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el límite de 5MB' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const filename = `proof-${Date.now()}.${ext}`
    const dir = join(process.cwd(), 'public', 'appointment-proofs')

    await mkdir(dir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(join(dir, filename), buffer)

    return NextResponse.json({ url: `/appointment-proofs/${filename}` })
  } catch (error) {
    console.error('Error uploading proof:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
