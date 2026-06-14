import { NextResponse } from 'next/server'
import { getFinanceOwner, isFinanceUnlocked } from '@/lib/finance-auth'

export const dynamic = 'force-dynamic'

// Tells the UI which screen to show: not-owner / set-pin / locked / unlocked.
export async function GET() {
  const owner = await getFinanceOwner()
  if (!owner) return NextResponse.json({ owner: false }, { status: 403 })
  const unlocked = await isFinanceUnlocked(owner.id)
  return NextResponse.json({
    owner: true,
    name: owner.name,
    email: owner.email,
    hasPin: owner.hasPin,
    unlocked,
  })
}
