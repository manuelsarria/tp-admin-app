import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireFinanceOwner, logFinanceAudit } from '@/lib/finance-auth'

export const dynamic = 'force-dynamic'

const pinSchema = z.object({
  newPin: z.string().min(4, 'El PIN debe tener al menos 4 caracteres').max(64),
  currentPin: z.string().optional(),
})

// Set or change the finance-module PIN. Owner-only. If a PIN already exists,
// the current one is required.
export async function POST(request: NextRequest) {
  const guard = await requireFinanceOwner()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = pinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: guard.user.id },
    select: { financePinHash: true },
  })

  if (user?.financePinHash) {
    const ok = parsed.data.currentPin && (await bcrypt.compare(parsed.data.currentPin, user.financePinHash))
    if (!ok) return NextResponse.json({ error: 'PIN actual incorrecto' }, { status: 400 })
  }

  const hash = await bcrypt.hash(parsed.data.newPin, 10)
  await prisma.user.update({ where: { id: guard.user.id }, data: { financePinHash: hash } })
  await logFinanceAudit({ action: 'pin_set', user: guard.user })

  return NextResponse.json({ ok: true })
}
