/**
 * Run this script once when DB is available:
 *   node scripts/add-mbe-manager-role.js
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe("ALTER TYPE \"UserRole\" ADD VALUE IF NOT EXISTS 'MBE_MANAGER'")
    console.log('✓ MBE_MANAGER added to UserRole enum')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
