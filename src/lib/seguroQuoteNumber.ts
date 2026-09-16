import { prisma } from '@/lib/prisma'

/**
 * Numeración de las cotizaciones de seguro: TPS + iniciales + año + correlativo
 * (p. ej. TPSMS260001).
 *
 * El correlativo sale del número más alto que ya existe con ese prefijo, no de
 * `count()`. Con `count()`, borrar una cotización hace que la siguiente repita
 * un número que ya se usó, y como `quoteNumber` es único en la base el choque
 * se traduce en un 500 y la cotización no se guarda.
 */

/** Iniciales del usuario: dos letras, o 'XX' si no hay nombre utilizable. */
function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'XX'
}

export async function seguroQuoteNumber(userName: string): Promise<string> {
  const prefix = `TPS${getInitials(userName)}${new Date().getFullYear().toString().slice(-2)}`

  const last = await prisma.insuranceQuote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: 'desc' },
    select: { quoteNumber: true },
  })

  // El correlativo es lo que sigue DESPUÉS del prefijo, no "los dígitos del
  // final": en TPSMS260001 los dígitos del final son 260001 — se tragan el
  // año — y el siguiente número saldría deformado (TPSMS26260002).
  const seq = last ? Number(last.quoteNumber.slice(prefix.length)) || 0 : 0
  return `${prefix}${String(seq + 1).padStart(4, '0')}`
}

/**
 * Crea la cotización reintentando si el número ya se tomó.
 *
 * Si dos cotizaciones piden número a la vez (o alguien hace doble clic), las
 * dos leen el mismo máximo y piden el mismo número. La que pierde reintenta
 * con el siguiente en vez de fallarle al usuario.
 */
export async function createQuoteWithNumber<T>(crear: () => Promise<T>, intentos = 5): Promise<T> {
  for (let i = 0; i < intentos; i++) {
    try {
      return await crear()
    } catch (error: any) {
      const choqueDeNumero = error?.code === 'P2002' &&
        String(error?.meta?.target ?? '').includes('quoteNumber')
      if (!choqueDeNumero || i === intentos - 1) throw error
    }
  }
  throw new Error('No se pudo asignar un número de cotización')
}
