import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await backendRes.json()

    if (!backendRes.ok || !data.success) {
      return NextResponse.json({ success: false, message: data.message || 'Login failed' }, { status: backendRes.status })
    }

    const token = data.data?.token
    const user = data.data?.user

    const res = NextResponse.json({ success: true, user })

    const maxAge = 60 * 60 * 24 * 7 // 7 days
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
      sameSite: 'lax',
    })

    // Store role in a readable cookie for middleware
    res.cookies.set('role', user?.role || '', {
      maxAge,
      path: '/',
      sameSite: 'lax',
    })

    return res
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
