"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (res.ok && data.success) {
          const role = data.user?.role
          // Match login redirect matrix
          if (role === 'super_admin') {
            router.push('/super')
          } else if (role === 'admin' || role === 'admin_head') {
            router.push('/admin')
          } else if (role === 'accountant' || role === 'accountant_head') {
            router.push('/admin/accountant')
          } else if (role === 'employee') {
            router.push('/employee')
          } else {
            router.push('/login')
          }
        } else {
          router.push('/login')
        }
      } catch (err) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndRedirect()
  }, [router])

  if (loading) {
    return <div style={{ padding: 40 }}>Redirecting...</div>
  }

  return null
}

