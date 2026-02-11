import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      const res = NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
      return res
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await backendRes.json().catch(() => ({}))

    const res = NextResponse.json({ success: backendRes.ok, message: data.message ?? (backendRes.ok ? 'Logout successful' : 'Logout failed') })

    // Clear cookie
    res.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    })

    return res
  } catch (err) {
    const res = NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    res.cookies.set('token', '', { httpOnly: true, maxAge: 0, path: '/' })
    return res
  }
}
