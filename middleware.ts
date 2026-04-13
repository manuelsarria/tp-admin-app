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

  console.log('🔐 Middleware:', {
    path: request.nextUrl.pathname,
    isAuth,
    isDashboard
  })

  if (isDashboard && !isAuth) {
    console.log('⚠️ Redirecting to login - no auth token')
    return NextResponse.redirect(new URL('/', request.url))
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
