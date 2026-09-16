import { prisma } from '@/lib/prisma'

/**
 * Numeración de HBL y MBL.
 *
 * El número es PREFIJO + año + mes + 4 dígitos (HBLCH2609 0001). El mes es
 * informativo: la secuencia es ANUAL y no se reinicia cada mes.
 *
 * El correlativo salía de `count()` de las filas del año, y eso choca de tres
 * maneras — y como el número es único en la base, el choque se traduce en un
 * 500 y el documento no se crea:
 *
 *   - Si se borra un HBL viejo, el conteo baja y el siguiente pide un número
 *     que ya existe.
 *   - Si se borra el ÚLTIMO, el siguiente vuelve a emitir ese número: no da
 *     error, pero dos documentos distintos terminan con la misma identidad.
 *   - Si se crean dos a la vez (o alguien hace doble clic), los dos leen el
 *     mismo conteo y piden el mismo número.
 *
 * Mirar el máximo que ya existe arregla el primer caso pero no el segundo, así
 * que el correlativo no se deduce de las filas: se guarda en `bl_counters`, una
 * fila por prefijo y año, y se reserva con un solo INSERT ... ON CONFLICT. El
 * contador no retrocede cuando se borra un documento, y dos peticiones
 * simultáneas se serializan en esa fila, así que cada una se lleva un número
 * propio sin reintentos.
 */

const SEQ_LEN = 4

interface Serie {
  /** Clave del contador: prefijo + año (HBLCH26). */
  clave: string
  /** Lo que se imprime antes del correlativo: prefijo + año + mes. */
  prefijo: string
  /** Mayor correlativo ya presente en la tabla para esa serie. */
  maxObservado: number
}

function serie(base: string, numerosDeLaSerie: string[]): Serie {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const clave = `${base}${yy}`

  // El correlativo va DESPUÉS de base + año + mes. No son "los últimos
  // dígitos": en HBLCH2609 0001 los últimos seis se tragarían el mes.
  const desde = clave.length + 2
  let maxObservado = 0
  for (const n of numerosDeLaSerie) {
    const seq = Number(n.slice(desde))
    if (Number.isFinite(seq) && seq > maxObservado) maxObservado = seq
  }

  return { clave, prefijo: `${clave}${mm}`, maxObservado }
}

/**
 * Reserva el siguiente correlativo de la serie.
 *
 * `maxObservado` solo siembra el contador la primera vez que se usa una serie
 * (y protege de un contador que se haya quedado atrás): a partir de ahí manda
 * el contador, que nunca retrocede.
 */
async function reservar({ clave, prefijo, maxObservado }: Serie): Promise<string> {
  const filas = await prisma.$queryRaw<{ lastSeq: number }[]>`
    INSERT INTO "bl_counters" ("prefix", "lastSeq")
    VALUES (${clave}, ${maxObservado + 1})
    ON CONFLICT ("prefix")
    DO UPDATE SET "lastSeq" = GREATEST("bl_counters"."lastSeq", ${maxObservado}) + 1,
                  "updatedAt" = NOW()
    RETURNING "lastSeq"
  `
  const seq = filas[0]?.lastSeq
  if (!seq) throw new Error('No se pudo reservar el número de BL')
  return `${prefijo}${String(seq).padStart(SEQ_LEN, '0')}`
}

export async function nextHblNumber(origin: 'CHINA' | 'PANAMA'): Promise<string> {
  const base = origin === 'PANAMA' ? 'HBLPA' : 'HBLCH'
  const delAno = await prisma.lclBooking.findMany({
    where: { hblNumber: { startsWith: `${base}${new Date().getFullYear().toString().slice(-2)}` } },
    select: { hblNumber: true },
  })
  return reservar(serie(base, delAno.map(b => b.hblNumber)))
}

export async function nextMblNumber(origin: 'CHINA' | 'PANAMA'): Promise<string> {
  const base = origin === 'PANAMA' ? 'MBLPA' : 'MBLCH'
  const delAno = await prisma.lclContainer.findMany({
    where: { mblNumber: { startsWith: `${base}${new Date().getFullYear().toString().slice(-2)}` } },
    select: { mblNumber: true },
  })
  return reservar(serie(base, delAno.map(c => c.mblNumber)))
}

/**
 * Red de seguridad: si aun así el número chocara (p. ej. porque alguien lo
 * escribió a mano), se reintenta pidiendo otro en vez de fallarle al usuario.
 */
export async function createWithBlNumber<T>(crear: () => Promise<T>, intentos = 5): Promise<T> {
  for (let i = 0; i < intentos; i++) {
    try {
      return await crear()
    } catch (error: any) {
      const target = String(error?.meta?.target ?? '')
      const choque = error?.code === 'P2002' && (target.includes('hblNumber') || target.includes('mblNumber'))
      if (!choque || i === intentos - 1) throw error
    }
  }
  throw new Error('No se pudo asignar un número de BL')
}
