import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/debug/seed-mailboxes - Add mailbox values to test users
export async function POST() {
  try {
    // Update some test users with mailbox values
    const updates = await Promise.all([
      prisma.user.update({
        where: { id: 'cmgaezqq40005bk8811i1lwc1' }, // Carlos Rodríguez
        data: { mailbox: 'BOX-001' },
      }),
      prisma.user.update({
        where: { id: 'cmgaezqq40004bk88lhs5achu' }, // Juan Pérez
        data: { mailbox: 'BOX-002' },
      }),
      prisma.user.update({
        where: { id: 'cmgaezqq40006bk88k026ro3m' }, // María González
        data: { mailbox: 'BOX-003' },
      }),
      prisma.user.update({
        where: { id: 'cmgaezqq40007bk88jwl2idsg' }, // Roberto Silva
        data: { mailbox: 'BOX-004' },
      }),
      prisma.user.update({
        where: { id: 'cmgeocn520003bkh7yug20d7f' }, // adawd
        data: { mailbox: 'BOX-005' },
      }),
      prisma.user.update({
        where: { id: 'cmgel3ld10001bkh7o9f033w2' }, // joel krriyoi
        data: { mailbox: 'BOX-006' },
      }),
    ])

    return NextResponse.json({
      message: 'Mailboxes added successfully',
      updatedCount: updates.length,
      updates,
    })
  } catch (error) {
    console.error('POST /api/debug/seed-mailboxes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
