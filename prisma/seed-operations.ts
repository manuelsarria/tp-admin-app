/**
 * Create the two Valdai operations that exist in the journal today, and link
 * their entries.
 *
 * The Asistente in the UI exists for this job, but leaving the tab empty means
 * "cuánto deja cada contenedor" answers nothing. These two groupings are not
 * guesses — each is backed by evidence in the data:
 *
 *   1. Contenedor 9507100400 — the container number is identical across the
 *      income and both expenses. The references differ only by a stray space.
 *
 *   2. CFZ Cocosolito a France Field — the references disagree ("2 contenedores
 *      colchones 1 triciclos" vs "3 contenedores 2 colchones 1 triciclos"), but
 *      the descriptions and the date match: "Operación CFZ cocosolito a France
 *      feld" / "Operación cfz cocosolito a France field", both 2026-06-15.
 *      Same job, typed twice.
 *
 * Idempotent: matches operations by name, unlinks their entries and rebuilds.
 * The owner can re-group anything from the Asistente; nothing here is locked in.
 *
 * Run:  npx tsx prisma/seed-operations.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Spec = {
  name: string
  containerNumber?: string
  notes: string
  /** Matches entries by their raw `reference` (ILIKE, so spacing can't bite). */
  referenceLike: string[]
}

const SPECS: Spec[] = [
  {
    name: 'Contenedor 9507100400 — Colchones',
    containerNumber: '9507100400',
    notes:
      'Agrupado por número de contenedor: la referencia del ingreso trae dos espacios antes de COLCHON y la de los egresos uno.',
    referenceLike: ['%9507100400%'],
  },
  {
    name: 'CFZ Cocosolito a France Field — Colchones y triciclos',
    notes:
      'Las referencias no coinciden ("2 contenedores colchones 1 triciclos" vs "3 contenedores 2 colchones 1 triciclos"), ' +
      'pero la descripción y la fecha sí: "Operación CFZ cocosolito a France feld/field", 15-jun-2026. Misma operación.',
    referenceLike: ['%colchones 1 triciclos%'],
  },
]

async function main() {
  for (const spec of SPECS) {
    const existing = await prisma.personalOperation.findFirst({ where: { name: spec.name } })
    if (existing) {
      await prisma.personalLedgerEntry.updateMany({
        where: { operationId: existing.id },
        data: { operationId: null },
      })
      await prisma.personalOperation.delete({ where: { id: existing.id } })
    }

    const entries = await prisma.personalLedgerEntry.findMany({
      where: {
        unit: 'Contenedores Valdai',
        OR: spec.referenceLike.map(r => ({ reference: { contains: r.replace(/%/g, ''), mode: 'insensitive' as const } })),
      },
    })

    if (entries.length === 0) {
      console.log(`⚠ ${spec.name}: no se encontraron movimientos, se omite`)
      continue
    }

    const op = await prisma.personalOperation.create({
      data: {
        name: spec.name,
        containerNumber: spec.containerNumber,
        unit: 'Contenedores Valdai',
        status: 'ABIERTA',
        startDate: entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date),
        notes: spec.notes,
      },
    })

    await prisma.personalLedgerEntry.updateMany({
      where: { id: { in: entries.map(e => e.id) } },
      data: { operationId: op.id },
    })

    // Mirror the API's rule: only PAGADO + NEGOCIO counts toward a job's P&L.
    const real = entries.filter(e => e.status === 'PAGADO' && e.scope === 'NEGOCIO')
    const ingresado = real.filter(e => e.type === 'INGRESO').reduce((s, e) => s + e.amount, 0)
    const invertido = real.filter(e => e.type === 'EGRESO').reduce((s, e) => s + e.amount, 0)

    console.log(
      `✔ ${spec.name}\n` +
        `    movimientos ${entries.length} · invertido ${invertido.toFixed(2)} · ` +
        `ingresado ${ingresado.toFixed(2)} · GANANCIA ${(ingresado - invertido).toFixed(2)}`
    )
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
