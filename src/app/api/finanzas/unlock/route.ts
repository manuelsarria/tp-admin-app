import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  requireFinanceOwner,
  createUnlockToken,
  logFinanceAudit,
  FINANCE_UNLOCK_COOKIE,
  FINANCE_UNLOCK_TTL_MS,
} from '@/lib/finance-auth'

export const dynamic = 'force-dynamic'

const unlockSchema = z.object({ pin: z.string().min(1) })

// Verify the PIN and set the signed unlock cookie for this session.
export async function POST(request: NextRequest) {
  const guard = await requireFinanceOwner()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = unlockSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'PIN requerido' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: guard.user.id },
    select: { financePinHash: true },
  })
  if (!user?.financePinHash) {
    return NextResponse.json({ error: 'Aún no has configurado un PIN', needsPin: true }, { status: 400 })
  }

  const valid = await bcrypt.compare(parsed.data.pin, user.financePinHash)
  if (!valid) {
    await logFinanceAudit({ action: 'unlock_failed', user: guard.user })
    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  }

  const token = createUnlockToken(guard.user.id, Date.now())
  const res = NextResponse.json({ ok: true, unlocked: true })
  res.cookies.set(FINANCE_UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(FINANCE_UNLOCK_TTL_MS / 1000),
  })
  await logFinanceAudit({ action: 'unlock', user: guard.user })
  return res
}

// Lock the module (clear the cookie).
export async function DELETE() {
  const guard = await requireFinanceOwner()
  if (!guard.ok) return guard.response
  const res = NextResponse.json({ ok: true, unlocked: false })
  res.cookies.set(FINANCE_UNLOCK_COOKIE, '', { path: '/', maxAge: 0 })
  await logFinanceAudit({ action: 'lock', user: guard.user })
  return res
}
