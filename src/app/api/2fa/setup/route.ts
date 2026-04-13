export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = speakeasy.generateSecret({
      name: `TP Logistics (${session.user.email})`,
      issuer: 'TP Logistics',
    })

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Store secret temporarily (not enabled yet until verified)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret.base32 },
    })

    return NextResponse.json({ qrCode: qrCodeDataUrl, secret: secret.base32 })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ error: 'Error setting up 2FA' }, { status: 500 })
  }
}
