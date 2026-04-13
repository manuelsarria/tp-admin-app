export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// GET — returns active LCL containers with their bookings, clients, and last bulletin date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Active containers (not COMPLETED)
    const containers = await prisma.lclContainer.findMany({
      where: { status: { not: 'COMPLETED' } },
      include: {
        bookings: {
          select: {
            id: true, hblNumber: true, clientId: true, clientType: true,
            clientName: true, packages: true, grossWeightKg: true, cbm: true,
            description: true, status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get last bulletin per container
    const lastBulletins = await prisma.boletinEnvio.findMany({
      where: { lclContainerId: { in: containers.map(c => c.id) } },
      orderBy: { enviadoAt: 'desc' },
    })

    // Group last bulletin by container
    const lastByContainer: Record<string, Date> = {}
    for (const b of lastBulletins) {
      if (!lastByContainer[b.lclContainerId]) {
        lastByContainer[b.lclContainerId] = b.enviadoAt
      }
    }

    // Get unique client emails
    const clientIds = [...new Set(containers.flatMap(c => c.bookings.map(b => b.clientId).filter(Boolean)))] as string[]
    const [users, companies] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: clientIds } }, select: { id: true, email: true, name: true } }),
      prisma.company.findMany({ where: { id: { in: clientIds } }, select: { id: true, email: true, name: true } }),
    ])
    const emailMap: Record<string, string> = {}
    for (const u of users) emailMap[u.id] = u.email
    for (const c of companies) emailMap[c.id] = c.email

    // Enrich containers
    const enriched = containers.map(c => ({
      ...c,
      lastBulletinDate: lastByContainer[c.id] || null,
      daysSinceLastBulletin: lastByContainer[c.id]
        ? Math.floor((Date.now() - new Date(lastByContainer[c.id]).getTime()) / 86400000)
        : null,
      bookings: c.bookings.map(b => ({
        ...b,
        clientEmail: b.clientId ? emailMap[b.clientId] || null : null,
      })),
    }))

    // Pending count: containers that haven't been notified in 7+ days (or never)
    const pendingCount = enriched.filter(c =>
      c.status !== 'OPEN' && (c.daysSinceLastBulletin === null || c.daysSinceLastBulletin >= 7)
    ).length

    return NextResponse.json({ containers: enriched, pendingCount })
  } catch (error) {
    console.error('GET /api/boletin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
