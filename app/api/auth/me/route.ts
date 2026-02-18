import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = {
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'accountant',
    }

    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
