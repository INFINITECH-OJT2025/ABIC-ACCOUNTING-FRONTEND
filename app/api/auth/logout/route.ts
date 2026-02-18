import { NextResponse } from 'next/server'

export async function POST() {
  try {
    return NextResponse.json({ success: true, message: 'Logged out (UI-only)' })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
