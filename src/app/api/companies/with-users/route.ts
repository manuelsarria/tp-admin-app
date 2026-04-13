import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force dynamic rendering - always fetch fresh data from database
export const dynamic = 'force-dynamic'

// GET /api/companies/with-users
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
    // Get all active companies
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

    // Get all active users with mailbox (from any active company)
    const usersWithMailbox = await prisma.user.findMany({
      where: {
        isActive: true,
        mailbox: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        mailbox: true,
        companyId: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transform to result array
    const result: any[] = []

    // Add all active companies first
    companies.forEach((company) => {
      result.push({
        id: company.id,
        name: company.name,
        company_id: company.company_id,
        ruc: company.ruc,
        isActive: company.isActive,
        mailbox: null,
        userId: null,
        userName: null,
        displayLabel: null, // No display label for company-only entries
        type: 'company', // Mark as company entry
      })
    })

    // Add all users with mailbox
    usersWithMailbox.forEach((user) => {
      result.push({
        id: user.companyId || 'no-company', // Use companyId for selection
        name: user.companyId ? companies.find(c => c.id === user.companyId)?.name : 'Unknown Company',
        company_id: user.companyId ? companies.find(c => c.id === user.companyId)?.company_id : null,
        ruc: user.companyId ? companies.find(c => c.id === user.companyId)?.ruc : null,
        isActive: true,
        mailbox: user.mailbox,
        userId: user.id,
        userName: user.name,
        displayLabel: `${user.mailbox} - ${user.name}`, // Formatted display string
        type: 'user', // Mark as user entry
      })
    })

    return NextResponse.json(result, { headers })
  } catch (error) {
    console.error('GET /api/companies/with-users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
