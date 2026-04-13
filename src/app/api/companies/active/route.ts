import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force dynamic rendering - always fetch fresh data from database
export const dynamic = 'force-dynamic'

// GET /api/companies/active - List all active companies only
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Set response headers to prevent caching
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  }

  try {
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        company_id: true,
        ruc: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(companies, { headers })
  } catch (error) {
    console.error('GET /api/companies/active error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
