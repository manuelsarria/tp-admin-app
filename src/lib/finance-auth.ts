// Security layer for the PRIVATE personal-finance module ("Finanzas
// Personales"). Access is restricted to a small email allowlist (the owners),
// and the module additionally requires a per-session PIN unlock. Every check
// here runs on the SERVER — hiding the nav item is not security.
//
// Defense in depth:
//   1. Email allowlist  → only the owners, even if another user is ADMIN.
//   2. PIN unlock cookie → signed (HMAC), httpOnly, short-lived per session.
//   3. Audit trail       → logFinanceAudit() on every sensitive action.

import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Cookie that marks the finance module as unlocked for the current session. */
export const FINANCE_UNLOCK_COOKIE = 'fin_unlock'
/** How long an unlock lasts before the PIN is required again (ms). */
export const FINANCE_UNLOCK_TTL_MS = 8 * 60 * 60 * 1000 // 8h

/**
 * Owner allowlist. Configure with the FINANCE_OWNER_EMAILS env var
 * (comma-separated). Falls back to the known owners. Emails are compared
 * case-insensitively and trimmed.
 */
export function getFinanceOwnerEmails(): string[] {
  const fromEnv = process.env.FINANCE_OWNER_EMAILS
  const raw = fromEnv && fromEnv.trim().length > 0
    ? fromEnv
    : 'manuell.sarria@gmail.com,andrea.munoz@gmail.com'
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isFinanceOwner(email?: string | null): boolean {
  if (!email) return false
  return getFinanceOwnerEmails().includes(email.trim().toLowerCase())
}

export interface FinanceUser {
  id: string
  email: string
  name?: string | null
  hasPin: boolean
}

/**
 * Returns the current user IF they are a finance owner, otherwise null.
 * Always reads email + financePinHash from the DB (authoritative), not just
 * the session token.
 */
export async function getFinanceOwner(): Promise<FinanceUser | null> {
  const sessionUser = await getCurrentUser()
  const email = (sessionUser as any)?.email as string | undefined
  const id = (sessionUser as any)?.id as string | undefined
  if (!id || !isFinanceOwner(email)) return null

  const dbUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, isActive: true, financePinHash: true },
  })
  if (!dbUser || !dbUser.isActive || !isFinanceOwner(dbUser.email)) return null

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    hasPin: !!dbUser.financePinHash,
  }
}

// ---------------------------------------------------------------------------
// PIN unlock token (HMAC-signed, no extra deps)
// ---------------------------------------------------------------------------

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is required for finance unlock tokens')
  return s
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

/** token = base64(userId).expiryMs.signature */
export function createUnlockToken(userId: string, now: number): string {
  const expiry = now + FINANCE_UNLOCK_TTL_MS
  const payload = `${Buffer.from(userId).toString('base64url')}.${expiry}`
  return `${payload}.${sign(payload)}`
}

/** Validates the token's signature, expiry and that it belongs to `userId`. */
export function verifyUnlockToken(token: string | undefined, userId: string, now: number): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [b64, expiryStr, sig] = parts
  const payload = `${b64}.${expiryStr}`
  // timing-safe signature check
  const expected = sign(payload)
  if (sig.length !== expected.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  const expiry = Number(expiryStr)
  if (!Number.isFinite(expiry) || expiry < now) return false
  try {
    return Buffer.from(b64, 'base64url').toString() === userId
  } catch {
    return false
  }
}

export async function isFinanceUnlocked(userId: string): Promise<boolean> {
  const token = cookies().get(FINANCE_UNLOCK_COOKIE)?.value
  return verifyUnlockToken(token, userId, Date.now())
}

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------

export type FinanceGuardResult =
  | { ok: true; user: FinanceUser }
  | { ok: false; response: NextResponse }

/** Owner-only (PIN not required). Use for unlock + PIN-set endpoints. */
export async function requireFinanceOwner(): Promise<FinanceGuardResult> {
  const user = await getFinanceOwner()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }
  return { ok: true, user }
}

/** Owner + unlocked PIN. Use for all data endpoints. */
export async function requireFinanceAccess(): Promise<FinanceGuardResult> {
  const guard = await requireFinanceOwner()
  if (!guard.ok) return guard
  if (!(await isFinanceUnlocked(guard.user.id))) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Módulo bloqueado', locked: true }, { status: 423 }),
    }
  }
  return guard
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export async function logFinanceAudit(opts: {
  action: string
  entityId?: string | null
  user?: { id?: string | null; email?: string | null } | null
  detail?: unknown
}): Promise<void> {
  try {
    await prisma.personalLedgerAudit.create({
      data: {
        action: opts.action,
        entityId: opts.entityId ?? null,
        userId: opts.user?.id ?? null,
        userEmail: opts.user?.email ?? null,
        detail: (opts.detail ?? undefined) as any,
      },
    })
  } catch (e) {
    // Auditing must never break the main operation.
    console.error('finance audit error:', e)
  }
}
