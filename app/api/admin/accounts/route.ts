import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface AdminAccount {
  id: string
  name: string
  email: string
  status: 'Active' | 'Inactive'
  activatedOn: string
}

interface CreateAdminRequest {
  name: string
  email: string
}

interface BackendResponse {
  success: boolean
  message: string
  data?: any
  errors?: Record<string, string[]>
}

// Helper function to get auth token from cookies
async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('token')?.value || null
  } catch (error) {
    console.error('Error getting cookies:', error)
    return null
  }
}

// GET - List all admin accounts
export async function GET(req: Request) {
  try {
    console.log('=== Frontend API Debug Start ===')
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)
    console.log('All headers:', Object.fromEntries(req.headers.entries()))
    
    const token = await getAuthToken()
    
    // Debug logging
    console.log('Frontend API Debug - Extracted token:', token ? `Token found (${token.length} chars)` : 'No token')
    
    if (!token) {
      console.log('❌ No token found - returning 401')
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token found in cookies' },
        { status: 401 }
      )
    }

    console.log('✅ Token found, proceeding to backend call')
    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
    console.log('Backend URL:', backendUrl)
    
    const { searchParams } = new URL(req.url)
    
    // Forward query parameters to backend
    const queryString = searchParams.toString()
    const url = `${backendUrl}/api/admin/accounts${queryString ? `?${queryString}` : ''}`
    console.log('Full backend URL:', url)

    const backendRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0'
      }
    })

    console.log('Backend response status:', backendRes.status)
    console.log('Backend response headers:', Object.fromEntries(backendRes.headers.entries()))
    
    const responseText = await backendRes.text()
    console.log('Backend response body:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.log('❌ Failed to parse response as JSON')
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 500 }
      )
    }

    if (!backendRes.ok) {
      console.log('❌ Backend returned error:', backendRes.status, data)
      return NextResponse.json(data, { status: backendRes.status })
    }

    console.log('✅ Backend request successful')
    console.log('=== Frontend API Debug End ===')
    
    return NextResponse.json(data)

  } catch (err) {
    console.error('Admin Accounts GET Error:', err)
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

// POST - Create new admin account
export async function POST(req: Request) {
  try {
    console.log('=== Frontend API POST Debug Start ===')
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)
    console.log('All headers:', Object.fromEntries(req.headers.entries()))
    
    const token = await getAuthToken()
    console.log('Frontend API POST Debug - Extracted token:', token ? `Token found (${token.length} chars)` : 'No token')
    
    if (!token) {
      console.log('❌ No token found - returning 401')
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ Token found, proceeding to backend call')
    const body: CreateAdminRequest = await req.json()
    console.log('Request body:', body)

    // Validate input
    if (!body.name?.trim() || !body.email?.trim()) {
      console.log('❌ Validation failed - missing name or email')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Name and email are required',
          errors: {
            name: !body.name?.trim() ? ['Name is required'] : [],
            email: !body.email?.trim() ? ['Email is required'] : []
          }
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email format',
          errors: {
            email: ['Please provide a valid email address']
          }
        },
        { status: 400 }
      )
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
    console.log('Backend URL:', backendUrl)

    const backendRes = await fetch(`${backendUrl}/api/admin/accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0'
      },
      body: JSON.stringify(body)
    })

    console.log('Backend response status:', backendRes.status)
    console.log('Backend response headers:', Object.fromEntries(backendRes.headers.entries()))
    
    const responseText = await backendRes.text()
    console.log('Backend response body:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.log('❌ Failed to parse response as JSON')
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 500 }
      )
    }

    if (!backendRes.ok) {
      console.log('❌ Backend returned error:', backendRes.status, data)
      return NextResponse.json(data, { status: backendRes.status })
    }

    console.log('✅ Backend request successful')
    console.log('=== Frontend API POST Debug End ===')
    
    // Transform response data
    const transformedAdmin = {
      id: data.data?.id?.toString() || '',
      name: data.data?.name || body.name,
      email: data.data?.email || body.email,
      status: data.data?.status || 'Active',
      activatedOn: data.data?.activated_at ? new Date(data.data.activated_at).toLocaleDateString() : new Date().toLocaleDateString()
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      data: transformedAdmin
    })

  } catch (err) {
    console.error('Admin Accounts POST Error:', err)
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
