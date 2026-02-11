import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/login']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes - only super_admin
  if (pathname.startsWith('/admin')) {
    if (role !== 'super_admin') {
      return NextResponse.redirect(new URL('/accountant', request.url))
    }
  }

  // Accountant routes - only accountant role
  if (pathname.startsWith('/accountant')) {
    if (role !== 'accountant' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

// Specify which routes the proxy applies to
export const config = {
  matcher: ['/', '/admin/:path*', '/accountant/:path*'],
}
