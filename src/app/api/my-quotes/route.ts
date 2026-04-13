import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const [quotes, fastQuotes] = await Promise.all([
      prisma.quote.findMany({
        where: { assignedToId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fastQuote.findMany({
        where: { assignedToId: userId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      quotes: quotes.map(q => ({ ...q, _type: 'quote' as const })),
      fastQuotes: fastQuotes.map(q => ({ ...q, _type: 'fast_quote' as const })),
    })
  } catch (error: any) {
    console.error('my-quotes GET error:', error?.message)
    return NextResponse.json({ error: 'Error fetching quotes' }, { status: 500 })
  }
}
