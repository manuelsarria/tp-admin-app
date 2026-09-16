import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

/**
 * Almacenamiento PRIVADO de documentos (MBL, DCME, comprobantes de pago, etc.).
 * Los archivos se guardan FUERA de public/ para que NO sean accesibles por URL.
 * Solo se sirven vía endpoints con verificación de permiso.
 *
 * Carpeta configurable por env PRIVATE_UPLOADS_DIR; por defecto `<cwd>/private-uploads`.
 */
function baseDir(): string {
  return process.env.PRIVATE_UPLOADS_DIR || join(process.cwd(), 'private-uploads')
}

export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const MAX_DOC_SIZE = 15 * 1024 * 1024 // 15MB

/** Guarda el buffer en disco con un nombre único y devuelve el nombre almacenado. */
export async function saveDocument(file: File): Promise<{ storedName: string; size: number }> {
  const bytes = await file.arrayBuffer()
  return saveDocumentBuffer(Buffer.from(bytes), file.name)
}

/** Igual que saveDocument pero a partir de un Buffer ya leído (evita leer el File dos veces). */
export async function saveDocumentBuffer(buffer: Buffer, originalName: string): Promise<{ storedName: string; size: number }> {
  const dir = baseDir()
  await mkdir(dir, { recursive: true })
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
  const storedName = `${randomUUID()}.${ext}`
  await writeFile(join(dir, storedName), buffer)
  return { storedName, size: buffer.length }
}

/** Lee un documento del almacenamiento privado. */
export async function readDocument(storedName: string): Promise<Buffer> {
  return readFile(join(baseDir(), storedName))
}

/** Elimina un documento del almacenamiento privado (silencioso si no existe). */
export async function deleteDocumentFile(storedName: string): Promise<void> {
  try {
    await unlink(join(baseDir(), storedName))
  } catch {
    /* ignore */
  }
}
