"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountantDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [router])

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        router.push('/login')
      } else {
        setError('Logout failed')
      }
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
        <h1 style={{ marginBottom: 8 }}>Accountant Dashboard</h1>
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
              <strong>Role:</strong> <span style={{ color: '#f57c00', fontWeight: 'bold' }}>{user.role}</span>
            </p>
            <hr style={{ margin: '24px 0' }} />
            <p>Accountant-specific features would go here.</p>
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
