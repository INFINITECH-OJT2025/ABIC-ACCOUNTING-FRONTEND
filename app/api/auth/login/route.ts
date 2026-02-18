import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const email = String(body?.email ?? '').trim()

    const role = email.toLowerCase().includes('admin') ? 'super_admin' : 'accountant'

    const user = {
      name: role === 'super_admin' ? 'Super Admin' : 'Accountant',
      email: email || (role === 'super_admin' ? 'admin@example.com' : 'accountant@example.com'),
      role,
    }

    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
