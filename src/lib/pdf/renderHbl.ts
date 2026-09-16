import { renderToBuffer, Font } from '@react-pdf/renderer'
import { createElement } from 'react'
import { HouseBLPDF } from '@/components/freight/HouseBLPDF'
import { getStampDef, anchorToStyle, sanitizeStamps } from '@/lib/hblStamps'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import crypto from 'crypto'

// Fuente con glifos CJK, registrada una vez por proceso: las descripciones de
// mercancía vienen en chino y Helvetica no los tiene (salen como cuadritos).
let cjkFontRegistered = false
/**
 * Registra la fuente CJK y dice si quedó disponible.
 *
 * Devuelve un booleano en vez de dar por hecho que está: si el .otf no viajó
 * en el despliegue, @react-pdf no cae a Helvetica — lanza "Font family not
 * registered" y se cae TODO el HBL. Sin fuente, el PDF sale igual y solo los
 * caracteres chinos se ven como cuadritos.
 */
function ensureCJKFont(): boolean {
  if (cjkFontRegistered) return true
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansSC-Regular.otf')
  if (!fs.existsSync(fontPath)) return false
  try {
    Font.register({ family: 'NotoSansSC', src: fontPath })
    cjkFontRegistered = true
  } catch (error) {
    console.error('No se pudo registrar NotoSansSC; el HBL saldrá sin glifos chinos:', error)
    return false
  }
  return true
}

const WAREHOUSE_LABELS: Record<string, string> = {
  PWEST: 'Panama Oeste',
  PCENT: 'Panama Centro',
  ZLC: 'Zona Libre Colón',
}

function generateAuthCode(hblNumber: string, bookingId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${hblNumber}-${bookingId}-TP`)
    .digest('hex')
    .toUpperCase()
  return `TP-${hash.slice(0, 4)}-${hash.slice(4, 8)}`
}

/**
 * Renderiza el PDF del HBL con los sellos y la aprobación que tenga en este
 * momento. Vive aparte de la ruta para que el PDF del admin y cualquier otra
 * vista salgan idénticos.
 *
 * @param bookingId  id del LclBooking (HBL)
 * @param opts.authorizedBy  quién aparece como autorizante en el bloque de
 *   aprobación (solo aplica a los HBL de China listos para retiro).
 * @returns buffer + hblNumber, o null si el HBL no existe.
 */
export async function renderHblPdf(
  bookingId: string,
  opts?: { authorizedBy?: string },
): Promise<{ buffer: Buffer; hblNumber: string } | null> {
  const cjkFont = ensureCJKFont()

  const booking = await prisma.lclBooking.findUnique({
    where: { id: bookingId },
    include: {
      lclContainer: true,
      cargoItems: { orderBy: { position: 'asc' } },
    },
  })
  if (!booking) return null

  const logoPath = path.join(process.cwd(), 'public', 'images', 'TP-Logo.png')
  const logoBase64 = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : null

  // QR hacia la página pública de validación. Los HBL marcados con omitQr
  // salen sin él: solo se presentan en origen y no deben exponer la URL.
  let qrBase64: string | null = null
  if (!booking.omitQr) {
    const validationUrl = `https://tplogist.com/validar?hbl=${encodeURIComponent(booking.hblNumber)}`
    qrBase64 = await QRCode.toDataURL(validationUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
  }

  // Sellos sobrepuestos: cada imagen de la librería, a base64 y posicionada.
  const appliedStamps = sanitizeStamps((booking as any).stamps)
  const stamps = appliedStamps
    .map((st) => {
      const def = getStampDef(st.key)
      if (!def) return null
      const p = path.join(process.cwd(), 'public', 'images', 'stamps', def.file)
      if (!fs.existsSync(p)) return null
      const ext = def.file.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpeg'
      const src = `data:image/${ext};base64,${fs.readFileSync(p).toString('base64')}`
      return { src, style: anchorToStyle(st.anchor, st.size) }
    })
    .filter(Boolean) as { src: string; style: Record<string, any> }[]

  // Bloque de autorización: SOLO para HBL de China. Los de Panamá usan el
  // sello "Aprobado" de la librería de sellos.
  let approval = null
  if (booking.origin === 'CHINA' && booking.readyForPickup) {
    const selloPath = path.join(process.cwd(), 'public', 'images', 'sello-tp.png')
    const selloBase64 = fs.existsSync(selloPath)
      ? `data:image/png;base64,${fs.readFileSync(selloPath).toString('base64')}`
      : null

    approval = {
      approved: true,
      selloBase64,
      authorizedBy: opts?.authorizedBy || 'TP Logistics',
      authCode: generateAuthCode(booking.hblNumber, booking.id),
      pickupWarehouse: booking.pickupWarehouse
        ? WAREHOUSE_LABELS[booking.pickupWarehouse] || booking.pickupWarehouse
        : null,
    }
  }

  const pdfBuffer = await renderToBuffer(
    createElement(HouseBLPDF, {
      booking: booking as any,
      logoBase64,
      qrBase64,
      approval,
      stamps,
      cjkFont,
    }) as any,
  )

  return { buffer: pdfBuffer, hblNumber: booking.hblNumber }
}
