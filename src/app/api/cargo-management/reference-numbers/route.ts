import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const records = await prisma.cargoManagement.findMany({
      where: {
        status: 'RECEIVED_IN_WAREHOUSE',
        referenceNo: { not: null }
      },
      select: {
        referenceNo: true
      },
      orderBy: {
        referenceNo: 'desc'
      }
    })

    const referenceNumbers = records
      .map(record => record.referenceNo)
      .filter((ref): ref is string => ref !== null)

    return NextResponse.json({ data: referenceNumbers })
  } catch (error) {
    console.error('GET /api/cargo-management/reference-numbers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
