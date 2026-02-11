"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState('')

  const goToAccountants = () => {
    router.push('/admin/accountant')
  }

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
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #800020 0%, #4B0000 50%, #2D0000 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ 
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ 
            fontSize: '18px',
            fontWeight: '500',
            color: '#800020'
          }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #800020 0%, #4B0000 50%, #2D0000 100%)',
      padding: '48px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '640px',
        padding: '32px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ 
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{ 
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #800020, #4B0000)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Super Admin Dashboard
          </h1>
          <div style={{ 
            height: '4px',
            width: '80px',
            background: 'linear-gradient(90deg, #800020, #4B0000)',
            margin: '0 auto',
            borderRadius: '2px'
          }}></div>
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
        
        {user ? (
          <div>
            <div style={{ 
              background: 'linear-gradient(135deg, #fef2f2, #ffffff)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #fee2e2'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#800020',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>Name</div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937'
                }}>{user.name}</div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#800020',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>Email</div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937'
                }}>{user.email}</div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#800020',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>Role</div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'linear-gradient(135deg, #800020, #4B0000)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {user.role}
                </div>
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'center',
              padding: '20px',
              background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ 
                margin: '0',
                fontSize: '14px',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Admin-specific features would go here.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={goToAccountants}
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #800020, #4B0000)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(128, 0, 32, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(128, 0, 32, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(128, 0, 32, 0.3)';
                }}
              >
                Manage Accountants
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            background: 'linear-gradient(135deg, #fef2f2, #ffffff)',
            borderRadius: '12px',
            border: '1px solid #fee2e2'
          }}>
            <p style={{ 
              margin: '0',
              fontSize: '16px',
              color: '#991b1b',
              fontWeight: '500'
            }}>
              Not authenticated
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
