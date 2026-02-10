"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
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
        <h1 style={{ marginBottom: 8 }}>Welcome</h1>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {user ? (
          <div>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <div style={{ marginTop: 16 }}>
              <button onClick={handleLogout} style={{ padding: '8px 12px' }}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>Not authenticated.</p>
            <button onClick={() => router.push('/login')} style={{ padding: '8px 12px' }}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
