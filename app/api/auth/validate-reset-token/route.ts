import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Token and email are required' 
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/validate-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Validate reset token API error:', error);
    return NextResponse.json(
      { 
        valid: false, 
        message: 'Failed to validate reset token' 
      },
      { status: 500 }
    );
  }
}
