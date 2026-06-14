// Importa los catálogos + movimientos generados por
// scripts/extract-finance-from-excel.py hacia las tablas del módulo
// Finanzas Personales (PersonalLedgerCatalog + PersonalLedgerEntry).
//
// Requisitos:
//   1) Aplicar la migración:  npx prisma migrate deploy
//   2) Generar el seed:        python3 scripts/extract-finance-from-excel.py "<ruta xlsx>"
//   3) Importar:               node scripts/import-personal-finance.js
//
// Es seguro re-ejecutarlo: si ya existen movimientos, NO duplica (solo
// asegura los catálogos).

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const seedPath = path.join(__dirname, 'personal-finance-seed.json')
  if (!fs.existsSync(seedPath)) {
    console.error('No se encontró scripts/personal-finance-seed.json. Corre primero extract-finance-from-excel.py')
    process.exit(1)
  }
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'))

  // 1) Catálogos (upsert por [kind, value])
  let catCount = 0
  for (const kind of ['unit', 'category', 'method']) {
    const values = seed.catalog?.[kind] || []
    for (let i = 0; i < values.length; i++) {
      await prisma.personalLedgerCatalog.upsert({
        where: { kind_value: { kind, value: values[i] } },
        update: {},
        create: { kind, value: values[i], sortOrder: i },
      })
      catCount++
    }
  }
  console.log(`Catálogos asegurados: ${catCount}`)

  // 2) Movimientos
  const existing = await prisma.personalLedgerEntry.count()
  if (existing > 0) {
    console.log(`Ya hay ${existing} movimientos en la BD; no se importan entries para evitar duplicados.`)
  } else {
    const entries = (seed.entries || []).map(e => ({
      date: new Date(e.date),
      unit: e.unit,
      type: e.type,
      category: e.category,
      subcategory: e.subcategory ?? null,
      method: e.method ?? null,
      status: e.status,
      counterparty: e.counterparty ?? null,
      reference: e.reference ?? null,
      description: e.description ?? null,
      amount: e.amount,
      notes: e.notes ?? null,
    }))
    const res = await prisma.personalLedgerEntry.createMany({ data: entries })
    console.log(`Movimientos importados: ${res.count}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
