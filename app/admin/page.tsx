"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setUser({ name: 'Super Admin', email: 'admin@example.com', role: 'super_admin' })
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    try {
      router.push('/login')
    } catch (err) {
      setError('Network error')
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 640, padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
        <h1 style={{ marginBottom: 8 }}>Super Admin Dashboard</h1>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        {user ? (
          <div>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{user.role}</span>
            </p>
            <hr style={{ margin: '24px 0' }} />
            <p>Admin-specific features would go here.</p>
            <div style={{ marginTop: 24 }}>
              <button onClick={handleLogout} style={{ padding: '8px 12px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <p>Not authenticated</p>
        )}
      </div>
    </div>
  )
}
