import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface ChangePasswordRequest {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

interface BackendResponse {
  success: boolean
  message: string
  data?: any
  errors?: Record<string, string[]>
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Not authenticated',
          errors: null
        }, 
        { status: 401 }
      )
    }

    const body: ChangePasswordRequest = await req.json()

    // Validate input
    if (!body.current_password || !body.new_password || !body.new_password_confirmation) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'All fields are required',
          errors: {
            current_password: !body.current_password ? ['Current password is required'] : [],
            new_password: !body.new_password ? ['New password is required'] : [],
            new_password_confirmation: !body.new_password_confirmation ? ['Password confirmation is required'] : []
          }
        }, 
        { status: 400 }
      )
    }

    if (body.new_password !== body.new_password_confirmation) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Passwords do not match',
          errors: {
            new_password_confirmation: ['New passwords do not match']
          }
        }, 
        { status: 422 }
      )
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0'
      },
      body: JSON.stringify(body)
    })

    let data: BackendResponse
    try {
      data = await backendRes.json()
    } catch {
      data = { success: false, message: 'Invalid response from server' }
    }

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Failed to change password',
          errors: data.errors || null
        }, 
        { status: backendRes.status }
      )
    }

    // Clear authentication cookies to force re-login
    const res = NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully. Please login with your new password.',
      data: null
    })

    // Clear all authentication cookies
    res.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    })
    res.cookies.set('user_info', '', {
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    })
    res.cookies.set('role', '', {
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    })

    return res

  } catch (err) {
    console.error('Change Password API Error:', err)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        errors: null
      }, 
      { status: 500 }
    )
  }
}