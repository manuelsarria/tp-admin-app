import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rows = await prisma.$queryRawUnsafe<{ value: string }[]>(
      `SELECT value FROM app_settings WHERE key = $1`,
      params.key
    )
    const value = rows.length > 0 ? rows[0].value : null
    return NextResponse.json({ key: params.key, value })
  } catch (error: any) {
    console.error('GET /api/settings/[key] error:', error)
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden', role: session?.user?.role ?? 'none' }, { status: 403 })
    }

    const { value } = await request.json()
    if (value === undefined) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 })
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO app_settings (key, value, "updatedAt")
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
      params.key,
      value
    )

    return NextResponse.json({ key: params.key, value })
  } catch (error: any) {
    console.error('PATCH /api/settings/[key] error:', error)
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 })
  }
}
