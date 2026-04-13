import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force dynamic rendering - always fetch fresh data from database
export const dynamic = 'force-dynamic'

// GET /api/companies/list - Simple list for dropdowns
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    return NextResponse.json(companies)
  } catch (error) {
    console.error('GET /api/companies/list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
