import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/legal']

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    const apiBase = process.env.INTERNAL_API_URL ?? 'http://localhost:3001'
    const target = new URL(pathname + request.nextUrl.search, apiBase)
    return NextResponse.rewrite(target)
  }

  const hasRefreshToken = request.cookies.has('refresh_token')

  if (!hasRefreshToken && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasRefreshToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
