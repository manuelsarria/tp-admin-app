import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const isAuth = !!token
  const isAuthPage = request.nextUrl.pathname === '/'
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const path = request.nextUrl.pathname
  const isFinance = path.startsWith('/dashboard/finanzas') || path.startsWith('/api/finanzas')

  console.log('🔐 Middleware:', {
    path: request.nextUrl.pathname,
    isAuth,
    isDashboard
  })

  if (isDashboard && !isAuth) {
    console.log('⚠️ Redirecting to login - no auth token')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Personal finance module — coarse owner-allowlist gate (the per-request PIN
  // and authoritative checks live in the API routes via lib/finance-auth.ts).
  if (isFinance) {
    const email = (token?.email as string | undefined)?.trim().toLowerCase()
    const ownersRaw = process.env.FINANCE_OWNER_EMAILS || 'manuell.sarria@gmail.com,andrea.munoz@gmail.com'
    const owners = ownersRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const isOwner = !!email && owners.includes(email)
    if (!isAuth || !isOwner) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (isAuthPage && isAuth) {
    console.log('✅ Redirecting to dashboard - already authenticated')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Protect all routes under /dashboard
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
