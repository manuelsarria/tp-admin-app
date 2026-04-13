export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Check if a user has 2FA enabled (called before login to show 2FA field)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { twoFactorEnabled: true },
    })

    return NextResponse.json({ twoFactorEnabled: user?.twoFactorEnabled ?? false })
  } catch (error) {
    return NextResponse.json({ twoFactorEnabled: false })
  }
}
