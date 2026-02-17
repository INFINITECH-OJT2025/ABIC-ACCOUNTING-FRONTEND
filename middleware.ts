import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/forgot-password']
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next()
  }

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes - super_admin, admin, admin_head; /admin/accountant also allows accountant, accountant_head
  if (pathname.startsWith('/admin')) {
    const allowedAdminRoles = ['super_admin', 'admin', 'admin_head']
    const allowedAccountantPageRoles = ['super_admin', 'admin', 'admin_head', 'accountant', 'accountant_head']
    const isAccountantPage = pathname.startsWith('/admin/accountant')
    const allowedRoles = isAccountantPage ? allowedAccountantPageRoles : allowedAdminRoles
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Standalone accountant routes - accountant, accountant_head, super_admin
  if (pathname.startsWith('/accountant')) {
    const allowedAccountantRoles = ['accountant', 'accountant_head', 'super_admin']
    if (!role || !allowedAccountantRoles.includes(role)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Super admin routes - super_admin only
  if (pathname.startsWith('/super')) {
    if (role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Employee routes - employee only
  if (pathname.startsWith('/employee')) {
    if (role !== 'employee') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*', '/accountant/:path*', '/super/:path*', '/employee/:path*', '/login', '/forgot-password', '/change-password', '/dashboard'],
}
