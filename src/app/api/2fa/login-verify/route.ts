export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, code } = await request.json()

    if (!email || !password || !code) {
      return NextResponse.json({ error: 'Email, password and code required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('2FA login verify error:', error)
    return NextResponse.json({ error: 'Error verifying 2FA' }, { status: 500 })
  }
}
