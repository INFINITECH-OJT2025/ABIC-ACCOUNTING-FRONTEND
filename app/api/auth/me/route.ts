import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const backendRes = await fetch('http://127.0.0.1:8000/api/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await backendRes.json()

    if (!backendRes.ok) {
      return NextResponse.json({ success: false, message: data.message || 'Failed to fetch user' }, { status: backendRes.status })
    }

    // The backend returns the user in data.data.user or data.user depending on implementation
    const user = data.data?.user ?? data.user ?? data.data ?? data

    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
