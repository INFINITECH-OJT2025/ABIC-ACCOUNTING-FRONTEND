import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface UpdateAdminRequest {
  name?: string
  email?: string
  status?: 'Active' | 'Inactive' | 'Suspended'
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

// PUT - Update admin account
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('PUT request received for admin account:', id);
    
    const token = await getAuthToken()
    console.log('Token found:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('Unauthorized - no token found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!id) {
      console.log('Bad request - no ID provided');
      return NextResponse.json(
        { success: false, message: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const body: UpdateAdminRequest = await req.json()
    console.log('Request body:', body);

    // Validate input
    if (!body.name?.trim() && !body.email?.trim() && !body.status) {
      console.log('Validation failed - no valid fields provided');
      return NextResponse.json(
        { 
          success: false, 
          message: 'At least name, email, or status must be provided',
          errors: {
            general: ['Please provide name, email, or status to update']
          }
        },
        { status: 400 }
      )
    }

    console.log('Validation passed - making backend request');
    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
    console.log('Backend URL:', backendUrl);

    const backendRes = await fetch(`${backendUrl}/api/admin/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0'
      },
      body: JSON.stringify(body)
    })

    console.log('Backend response status:', backendRes.status);
    console.log('Backend response OK:', backendRes.ok);

    const data: BackendResponse = await backendRes.json()
    console.log('Backend response data:', data);

    if (!backendRes.ok || !data.success) {
      console.log('Backend request failed');
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Failed to update admin account',
          errors: data.errors || null
        },
        { status: backendRes.status }
      )
    }

    // Transform response data
    const transformedAdmin = {
      id: data.data?.id?.toString() || id,
      name: data.data?.name || body.name,
      email: data.data?.email || body.email,
      status: data.data?.status || body.status || 'Active',
      activatedOn: data.data?.activated_at ? new Date(data.data.activated_at).toLocaleDateString() : new Date().toLocaleDateString()
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account updated successfully',
      data: transformedAdmin
    })

  } catch (err) {
    console.error('Admin Accounts PUT Error:', err)
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

// DELETE - Delete admin account
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('DELETE request received for admin account:', id);
    
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/admin/accounts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0'
      }
    })

    const data: BackendResponse = await backendRes.json()

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Failed to delete admin account',
          errors: data.errors || null
        },
        { status: backendRes.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account deleted successfully'
    })

  } catch (err) {
    console.error('Admin Accounts DELETE Error:', err)
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
