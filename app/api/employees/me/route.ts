import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('token')?.value || null
  } catch (error) {
    console.error('Error getting cookies:', error)
    return null
  }
}

// GET - Get current employee's profile
export async function GET() {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
    const backendRes = await fetch(`${backendUrl}/api/employees/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch (err) {
    console.error('Employees me GET Error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update current employee's profile
export async function PUT(req: Request) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/employees/me`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch (err) {
    console.error('Employees me PUT Error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
