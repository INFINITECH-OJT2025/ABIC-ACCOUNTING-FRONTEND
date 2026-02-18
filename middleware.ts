import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Specify which routes the middleware applies to
export const config = {
  matcher: ['/', '/admin/:path*', '/accountant/:path*'],
}
