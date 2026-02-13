  "use client"

  import React, { useState, useEffect, useRef } from 'react'
  import { useRouter } from 'next/navigation'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Alert, AlertDescription } from '@/components/ui/alert'
  import { AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'

  interface LoginResponse {
    success: boolean
    message: string
    data?: {
      token: string
      token_type: string
      expires_in: number
      user: {
        id: number
        name: string
        email: string
        role: string
        account_status: string
        first_login: boolean
        password_expires_at?: string
      }
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
    const [success, setSuccess] = useState('')
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
    const [retryAfter, setRetryAfter] = useState<number | null>(null)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const gradientRef = useRef<HTMLDivElement>(null)

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

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!gradientRef.current) return
      
      const rect = gradientRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setMousePosition({ x, y })
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')
      setSuccess('')
      setFieldErrors({})
      setRetryAfter(null)

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const responseText = await res.text()
        console.log('Raw response text:', responseText)
        const data: LoginResponse = JSON.parse(responseText)

        // Debug logging
        console.log('=== LOGIN RESPONSE DEBUG ===')
        console.log('Response status:', res.status)
        console.log('Response ok:', res.ok)
        console.log('Response headers:', res.headers)
        console.log('Full response:', data)
        console.log('Response success:', data.success)
        console.log('Response data.user:', data.data?.user)

        if (res.ok && data.success) {
          // Handle password reset requirement
          if (data.requires_password_reset) {
            setError("Your password has expired. Please contact your administrator for new credentials.")
            setLoading(false)
            return
          }

          // Handle first login redirect - only for non-super-admins
          if (data.data?.user?.first_login && data.data?.user?.role !== 'super_admin') {
            setSuccess('Login successful! Redirecting to password change...')
            setTimeout(() => {
              router.push("/change-password")
            }, 800)
            return
          }

          // Handle suspended account
          if (data.data?.user?.account_status === 'suspended') {
            setError("Your account has been suspended. Please contact your administrator.")
            setLoading(false)
            return
          }

          // Normal login success - frontend handles all routing based on role
          setSuccess('Login successful! Redirecting...')
          
          console.log('=== FRONTEND ROUTING DEBUG ===')
          console.log('Raw data.data:', data.data)
          console.log('Raw data.data?.user:', data.data?.user)
          console.log('Type of data.data?.user?.role:', typeof data.data?.user?.role)
          console.log('Value of data.data?.user?.role:', data.data?.user?.role)
          
          const userRole = data.data?.user?.role
          
          console.log('Final userRole variable:', userRole)
          console.log('Type of userRole:', typeof userRole)
          console.log('String comparison - userRole === "super_admin":', userRole === 'super_admin')
          console.log('String comparison - userRole === "super_admin" (strict):', userRole === 'super_admin')
          
          // Immediate routing without nested timeouts
          if (userRole === 'super_admin') {
              console.log('✅ Frontend routing: super_admin → /super')
              router.push('/super')
            } else if (userRole === 'admin_head') {
              console.log('✅ Frontend routing: admin_head → /admin')
              router.push('/admin')
            } else if (userRole === 'accountant_head' || userRole === 'accountant') {
              console.log('✅ Frontend routing: accountant → /admin/accountant')
              router.push('/admin/accountant')
            } else {
              console.log('✅ Frontend routing: default → /dashboard for role:', userRole)
              router.push('/dashboard')
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
      <div 
        className="min-h-screen bg-gray-50 flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(/images/background/abic-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="/images/logo/abic-logo-black.png" 
                  alt="ABIC Logo" 
                  className="w-32 h-8 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Login
              </h1>
              <p className="text-gray-600 text-sm">
                ABIC Accounting System
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2 text-sm">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 border-green-200 text-green-700 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="ml-2 text-sm">{success}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || !!countdown}
                  className={`h-10 text-sm bg-white border text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:border-[#7B0F2B] focus:ring-1 focus:ring-[#7B0F2B]/20 disabled:opacity-50 rounded-md ${
                    getFieldError('email') 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  autoFocus
                />
                {getFieldError('email') && (
                  <div className="text-red-500 text-xs mt-1">
                    {getFieldError('email')}
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || !!countdown}
                    className={`h-10 text-sm bg-white border text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:border-[#7B0F2B] focus:ring-1 focus:ring-[#7B0F2B]/20 disabled:opacity-50 pr-10 rounded-md ${
                      getFieldError('password') 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={loading || !!countdown}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {getFieldError('password') && (
                  <div className="text-red-500 text-xs mt-1">
                    {getFieldError('password')}
                  </div>
                )}
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || !!countdown}
                className="w-full h-10 text-sm font-medium bg-[#7B0F2B] hover:bg-[#5E0C20] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                    Signing in...
                  </span>
                ) : countdown ? (
                  <span>Please wait {countdown}s</span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                © 2026 ABIC Realty & Consultancy Corporation
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
