"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Redirect based on user role
        const role = data.user?.role
        if (role === 'super_admin') {
          router.push('/admin')
        } else if (role === 'accountant') {
          router.push('/accountant')
        } else {
          router.push('/')
        }
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ width: 360, padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Login</h2>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <label style={{ display: 'block', marginTop: 8 }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        <label style={{ display: 'block', marginTop: 12 }}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, marginTop: 16 }}>
          {loading ? 'Logging...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
