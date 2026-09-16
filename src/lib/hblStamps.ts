/**
 * Librería de sellos para el HBL (módulo Panamá) — módulo PURO (sin imports de servidor),
 * usado tanto por la UI como por el generador de PDF.
 *
 * Cada HBL guarda en `stamps` un arreglo de `{ key, anchor, size }`:
 *  - key:   identificador del sello en STAMP_LIBRARY
 *  - anchor: una de las 9 posiciones de la cuadrícula (esquinas/centros)
 *  - size:  lado del sello en px del PDF (A4 ≈ 595×842pt)
 */

export interface StampDef {
  key: string
  label: string
  file: string // dentro de public/images/stamps/
}

/**
 * Sellos disponibles para sobreponer en el HBL.
 *
 * Está vacía a propósito: los sellos son imágenes con el logo y la firma de la
 * empresa, así que los de CNC no sirven aquí — imprimirían "CNC LOGISTICS" en
 * un BL de TP. Para habilitarlos, deja los PNG con fondo transparente en
 * `public/images/stamps/` y agrégalos a esta lista; el resto del mecanismo
 * (posición, tamaño, validación) ya funciona.
 *
 * Ejemplo:
 *   { key: 'TELEX', label: 'Telex Release', file: 'telex-release-tp.png' },
 */
export const STAMP_LIBRARY: StampDef[] = []

export function getStampDef(key: string): StampDef | undefined {
  return STAMP_LIBRARY.find((s) => s.key === key)
}

// Cuadrícula 3×3. Primer carácter = vertical (t/m/b), segundo = horizontal (l/c/r).
export const STAMP_ANCHORS = [
  { key: 'tl', label: 'Arriba izq.' },
  { key: 'tc', label: 'Arriba centro' },
  { key: 'tr', label: 'Arriba der.' },
  { key: 'ml', label: 'Centro izq.' },
  { key: 'mc', label: 'Centro' },
  { key: 'mr', label: 'Centro der.' },
  { key: 'bl', label: 'Abajo izq.' },
  { key: 'bc', label: 'Abajo centro' },
  { key: 'br', label: 'Abajo der.' },
] as const

export type StampAnchor = (typeof STAMP_ANCHORS)[number]['key']

export const STAMP_SIZES = [
  { key: 'S', label: 'Pequeño', px: 90 },
  { key: 'M', label: 'Mediano', px: 130 },
  { key: 'L', label: 'Grande', px: 180 },
] as const

export interface AppliedStamp {
  key: string
  anchor: StampAnchor
  size: number // px
}

const EDGE = 26 // margen desde el borde de la página (px)

/**
 * Devuelve el estilo de posicionamiento absoluto (compatible con @react-pdf/renderer)
 * para colocar un sello de lado `size` en la `anchor` dada, relativo al `<Page>`.
 */
export function anchorToStyle(anchor: string, size: number): Record<string, any> {
  const v = anchor[0] // t | m | b
  const h = anchor[1] // l | c | r
  const style: Record<string, any> = { position: 'absolute', width: size, height: size }

  if (v === 't') style.top = EDGE
  else if (v === 'b') style.bottom = EDGE
  else { style.top = '50%'; style.marginTop = -size / 2 }

  if (h === 'l') style.left = EDGE
  else if (h === 'r') style.right = EDGE
  else { style.left = '50%'; style.marginLeft = -size / 2 }

  return style
}

/** Valida y normaliza el arreglo de sellos recibido del cliente. */
export function sanitizeStamps(input: any): AppliedStamp[] {
  if (!Array.isArray(input)) return []
  const anchors = new Set(STAMP_ANCHORS.map((a) => a.key))
  const out: AppliedStamp[] = []
  for (const it of input) {
    if (!it || typeof it !== 'object') continue
    if (!getStampDef(it.key)) continue
    if (!anchors.has(it.anchor)) continue
    const size = Number(it.size)
    if (!isFinite(size) || size < 40 || size > 300) continue
    out.push({ key: it.key, anchor: it.anchor, size })
  }
  return out
}
