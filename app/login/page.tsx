"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: number
    name: string
    email: string
    role: string
    account_status: string
    first_login: boolean
    password_expires_at?: string
  }
  errors?: Record<string, string[]>
  retry_after?: number
  requires_password_reset?: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Handle countdown for rate limiting
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      setCountdown(retryAfter)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) {
            return prev - 1
          }
          clearInterval(timer)
          return null
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})
    setRetryAfter(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data: LoginResponse = await res.json()

      if (data.user?.first_login && data.user?.role !== 'super_admin') {
        router.push("/change-password");
        return;
      }

      if (res.ok && data.success) {
        // Handle password reset requirement
        if (data.requires_password_reset) {
          setError("Your password has expired. Please contact your administrator for new credentials.");
          setLoading(false);
          return;
        }

        // Handle first login redirect - only for accountants, not super-admins
        if (data.user?.first_login && data.user?.role !== 'super_admin') {
          router.push("/change-password");
          return;
        }

        // Handle suspended account
        if (data.user?.account_status === 'suspended') {
          setError("Your account has been suspended. Please contact your administrator.");
          setLoading(false);
          return;
        }

        // Normal login success - redirect based on role
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
        setFieldErrors(data.errors || {})
        
        // Handle rate limiting
        if (data.retry_after) {
          setRetryAfter(data.retry_after)
        }
      }

    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (fieldName: string) => {
    const errors = fieldErrors[fieldName]
    return errors && errors.length > 0 ? errors[0] : ''
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #800020 0%, #4B0000 50%, #2D0000 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #800020, #4B0000)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Welcome Back
          </h1>
          <div style={{ 
            height: '4px',
            width: '60px',
            background: 'linear-gradient(90deg, #800020, #4B0000)',
            margin: '0 auto',
            borderRadius: '2px'
          }}></div>
          <p style={{ 
            margin: '12px 0 0 0',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Sign in to your ABIC Accounting account
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #fca5a5',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#800020',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={loading || !!countdown}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: getFieldError('email') ? '2px solid #dc2626' : '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                background: 'white',
                opacity: loading || countdown ? 0.6 : 1,
                color: '#000000'
              }}
              onFocus={(e) => {
                if (!getFieldError('email')) {
                  e.target.style.borderColor = '#800020'
                  e.target.style.boxShadow = '0 0 0 3px rgba(128, 0, 32, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!getFieldError('email')) {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {getFieldError('email') && (
              <div style={{ 
                color: '#dc2626', 
                fontSize: '12px', 
                marginTop: '4px',
                fontWeight: '500'
              }}>
                {getFieldError('email')}
              </div>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#800020',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={loading || !!countdown}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '45px', // Space for toggle button
                  border: getFieldError('password') ? '2px solid #dc2626' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  opacity: loading || countdown ? 0.6 : 1,
                  color: '#000000' // Black text
                }}
                onFocus={(e) => {
                  if (!getFieldError('password')) {
                    e.target.style.borderColor = '#800020'
                    e.target.style.boxShadow = '0 0 0 3px rgba(128, 0, 32, 0.1)'
                  }
                }}
                onBlur={(e) => {
                  if (!getFieldError('password')) {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || !!countdown}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: loading || countdown ? 'not-allowed' : 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                  padding: '4px',
                  borderRadius: '4px',
                  opacity: loading || countdown ? 0.5 : 1
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {getFieldError('password') && (
              <div style={{ 
                color: '#dc2626', 
                fontSize: '12px', 
                marginTop: '4px',
                fontWeight: '500'
              }}>
                {getFieldError('password')}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !!countdown}
            style={{
              padding: '14px 24px',
              background: loading || countdown 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                : 'linear-gradient(135deg, #800020, #4B0000)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || countdown ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: loading || countdown 
                ? 'none'
                : '0 4px 6px -1px rgba(128, 0, 32, 0.3)',
              opacity: loading || countdown ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!loading && !countdown) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(128, 0, 32, 0.4)'
              }
            }}
            onMouseOut={(e) => {
              if (!loading && !countdown) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(128, 0, 32, 0.3)'
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid #ffffff', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Signing in...
              </span>
            ) : countdown ? (
              `Please wait ${countdown}s`
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ 
            margin: '0',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            ABIC Accounting System © 2025
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
