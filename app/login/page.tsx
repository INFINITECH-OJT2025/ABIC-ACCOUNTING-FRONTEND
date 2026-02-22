  "use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingModal from '@/components/ui/LoadingModal'
import SuccessModal from '@/components/ui/SuccessModal'
import FailModal from '@/components/ui/FailModal'
import { AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff, Mail, Lock, Moon, Sun } from 'lucide-react'

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
  const [darkMode, setDarkMode] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isFirstLoginModal, setIsFirstLoginModal] = useState(false)
  const [successModalContent, setSuccessModalContent] = useState({
    title: 'Login Successful',
    message: 'Welcome back! You are being redirected to your dashboard.',
    buttonText: 'Continue'
  })
  const [showFailModal, setShowFailModal] = useState(false)
  const [failModalMessage, setFailModalMessage] = useState('')
  const [userData, setUserData] = useState<any>(null)
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
    
    // Show loading modal
    setShowLoadingModal(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const responseText = await res.text()
      const data: LoginResponse = JSON.parse(responseText)

      // Hide loading modal
      setShowLoadingModal(false)

      if (res.ok && data.success) {
        // Store user data for navigation
        setUserData(data.data)
        
        // Handle password reset requirement
        if (data.requires_password_reset) {
          setError("Your password has expired. Please contact your administrator for new credentials.")
          setLoading(false)
          return
        }

        // Handle first login or password expiration - show welcome modal (no auto-redirect), user clicks to proceed
        const role = data.data?.user?.role
        const isFirstLogin = data.data?.user?.first_login
        const passwordExpiresAt = data.data?.user?.password_expires_at
        const needsPasswordChange = role === 'admin' || role === 'employee' || role === 'accountant' || role === 'accountant_head'
        
        // Check if password has expired (if password_expires_at exists and is in the past)
        // OR if password_expires_at exists (for newly promoted users who need to change password)
        const isPasswordExpired = passwordExpiresAt && new Date(passwordExpiresAt) < new Date()
        const hasPasswordExpiration = !!passwordExpiresAt // Newly promoted users have password_expires_at set
        
        if ((isFirstLogin || isPasswordExpired || hasPasswordExpiration) && needsPasswordChange) {
          setIsFirstLoginModal(true)
          setSuccessModalContent({
            title: 'Welcome to ABIC Realty & Consultancy Corporation',
            message: isPasswordExpired 
              ? "Your password has expired. Please change your password to continue."
              : "Welcome! Before we proceed to your dashboard, you must set up some things first. Let's get your account secured.",
            buttonText: 'Get Started'
          })
          setShowSuccessModal(true)
          setLoading(false)
          return
        }

        // Handle suspended account
        if (data.data?.user?.account_status === 'suspended') {
          setError("Your account has been suspended. Please contact your administrator.")
          setLoading(false)
          return
        }

        // Normal login success - show success modal then redirect
        setIsFirstLoginModal(false)
        setSuccessModalContent({
          title: 'Login Successful',
          message: 'Welcome back! You are being redirected to your dashboard.',
          buttonText: 'Continue'
        })
        setShowSuccessModal(true)

        const userRole = data.data?.user?.role

        // Redirect after showing success modal
        setTimeout(() => {
          setShowSuccessModal(false)

          if (userRole === 'super_admin') {
            router.push('/super')
          } else if (userRole === 'admin' || userRole === 'admin_head') {
            router.push('/admin')
          } else if (userRole === 'accountant_head' || userRole === 'accountant') {
            router.push('/admin/accountant')
          } else if (userRole === 'employee') {
            router.push('/employee')
          } else {
            router.push('/dashboard')
          }
        }, 1500)
      } else {
        // Check if it's an authentication error (wrong credentials)
        if (res.status === 401 || (data.message && data.message.toLowerCase().includes('invalid'))) {
          setFailModalMessage(data.message || 'Invalid email or password')
          setShowFailModal(true)
        } else {
          setError(data.message || 'Login failed')
          setFieldErrors(data.errors || {})
        }
        
        // Handle rate limiting
        if (data.retry_after) {
          setRetryAfter(data.retry_after)
        }
      }

    } catch (err) {
      setShowLoadingModal(false)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

    const getFieldError = (fieldName: string) => {
      const errors = fieldErrors[fieldName]
      return errors && errors.length > 0 ? errors[0] : ''
    }

    const handleCloseSuccessModal = () => {
      setShowSuccessModal(false)
      
      // Handle navigation based on login type
      if (isFirstLoginModal) {
        router.push("/change-password")
      } else {
        // Normal login - redirect to appropriate dashboard based on role
        const userRole = userData?.user?.role
        if (userRole === 'super_admin') {
          router.push("/super")
        } else if (userRole === 'admin' || userRole === 'admin_head') {
          router.push("/admin")
        } else if (userRole === 'accountant' || userRole === 'accountant_head') {
          router.push("/admin/accountant")
        } else if (userRole === 'employee') {
          router.push("/employee")
        } else {
          router.push("/dashboard")
        }
      }
    }

    const handleCloseFailModal = () => {
      setShowFailModal(false)
    }

    return (
      <div 
        className={`min-h-screen flex transition-all duration-500 ease-in-out ${darkMode ? 'dark' : ''}`}
        style={{
          backgroundImage: `url(/images/background/${darkMode ? 'login2_bg_dark.png' : 'login2_bg.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 0.5s ease-in-out'
        }}
      >
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-12 lg:right-16 z-20">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 sm:p-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 ${
              darkMode 
                ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30' 
                : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90'
            }`}
            aria-label="Toggle dark mode"
          >
            <div className="transition-all duration-300 ease-in-out">
              {darkMode ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </div>
          </button>
        </div>

        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-16 relative py-8">
          {/* Logo - Top Left */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-12 lg:left-16">
            <div className="transition-opacity duration-300 ease-in-out">
              <img 
                src={darkMode ? "/images/logo/abic-logo.png" : "/images/logo/abic-logo-black.png"} 
                alt="ABIC Logo" 
                className="w-32 sm:w-40 lg:w-48 h-8 sm:h-10 lg:h-12 object-contain"
              />
            </div>
          </div>
          
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Login Form Card */}
            <div className={`rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-900/90 backdrop-blur-sm border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Header */}
              <div className="mb-8 flex justify-center">
                <h1 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Login
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className={`p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-red-900/50 border-red-700 text-red-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className={`p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-green-900/50 border-green-700 text-green-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <p className="text-sm">{success}</p>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-gray-400'
                    }`}>
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading || !!countdown}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className={`h-10 pl-10 rounded-lg transition-colors duration-300 disabled:opacity-50 ${
                        darkMode 
                          ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20' 
                          : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20'
                      } ${
                        getFieldError('email') 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                      autoFocus
                    />
                  </div>
                  {getFieldError('email') && (
                    <p className="text-red-500 text-xs mt-1">
                      {getFieldError('email')}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Password
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-gray-400'
                    }`}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || !!countdown}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className={`h-10 pl-10 pr-10 rounded-lg transition-colors duration-300 disabled:opacity-50 ${
                        darkMode 
                          ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20' 
                          : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20'
                      } ${
                        getFieldError('password') 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
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
                    <p className="text-red-500 text-xs mt-1">
                      {getFieldError('password')}
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className={`text-sm transition-colors duration-300 ${
                      darkMode 
                        ? 'text-white hover:text-gray-300' 
                        : 'text-[#7B0F2B] hover:text-[#5E0C20]'
                    }`}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim() || !!countdown}
                  className={`w-full h-10 font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode 
                      ? 'bg-[#7B0F2B] hover:bg-[#5E0C20] text-white' 
                      : 'bg-[#7B0F2B] hover:bg-[#5E0C20] text-white'
                  }`}
                  tabIndex={0}
                >
                  {countdown ? (
                    <span className="text-white">Please wait {countdown}s</span>
                  ) : (
                    <span className="text-white">Sign in</span>
                  )}
                </Button>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className={`text-xs transition-colors duration-300 ${
                darkMode ? 'text-white/60' : 'text-black  /80'
              }`}>
                © 2026 ABIC Realty & Consultancy Corporation
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Empty (background shows through) */}
        <div className="hidden lg:flex lg:flex-1"></div>

        {/* Modals */}
        <LoadingModal
          isOpen={showLoadingModal}
          title="Signing In"
          message="Please wait while we authenticate your credentials..."
          darkMode={darkMode}
        />

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseSuccessModal}
          title={successModalContent.title}
          message={successModalContent.message}
          buttonText={successModalContent.buttonText}
          darkMode={darkMode}
        />

        <FailModal
          isOpen={showFailModal}
          onClose={handleCloseFailModal}
          title="Login Failed"
          message={failModalMessage}
          buttonText="Try Again"
          darkMode={darkMode}
        />
      </div>
    )
  }
