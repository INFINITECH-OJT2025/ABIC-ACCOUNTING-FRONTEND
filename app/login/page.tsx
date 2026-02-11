"use client"

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Logo from '@/components/logo'
import { AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const gradientRef = useRef<HTMLDivElement>(null)

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
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess('Login successful! Redirecting...')
        const role = data.user?.role
        setTimeout(() => {
          if (role === 'super_admin') {
            router.push('/admin')
          } else if (role === 'accountant') {
            router.push('/accountant')
          } else {
            router.push('/')
          }
        }, 800)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      ref={gradientRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-gradient-to-br from-[#3D0000] via-[#5C0000] to-[#2A0000] flex items-center justify-center relative overflow-hidden"
    >
      {/* Interactive gradient overlay on mouse move */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle 500px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 107, 107, 0.15), transparent 80%)`,
        }}
      ></div>

      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B6B] opacity-20 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8B0000] opacity-20 rounded-full blur-3xl -ml-32 -mb-32 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full h-screen lg:h-auto flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          {/* Main Container - Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
            
            {/* Left Side - Logo and Content */}
            <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-to-b from-[#8B0000]/30 to-[#5C0000]/30 backdrop-blur-md rounded-l-3xl border border-[#FF6B6B]/20 hover:border-[#FF6B6B]/40 transition-all duration-300">
              <div className="space-y-6 text-center">
                {/* Logo with enhanced glow */}
                <div className="flex justify-center animate-fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] to-[#8B0000] rounded-full blur-3xl opacity-40 animate-pulse"></div>
                    <Logo animated className="relative w-24 h-24" />
                  </div>
                </div>

                {/* Content Text */}
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-white leading-tight">
                    Welcome to<br />
                    <span className="bg-gradient-to-r from-[#FF6B6B] via-[#FF8787] to-[#DC143C] bg-clip-text text-transparent">
                      ABIC Accounting
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg max-w-sm mx-auto">
                    Professional accounting management for your business
                  </p>
                </div>

                {/* Decorative dots */}
                <div className="flex justify-center gap-3 pt-4">
                  <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-col justify-center p-8 lg:p-12 bg-[#1a1a1a]/95 backdrop-blur-md rounded-3xl lg:rounded-none lg:rounded-r-3xl border border-[#8B0000]/30 lg:border-l-0 shadow-2xl">
              
              {/* Mobile Logo - Shows on mobile only */}
              <div className="lg:hidden flex justify-center mb-6 animate-fade-in">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] to-[#8B0000] rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <Logo animated className="relative w-16 h-16" />
                </div>
              </div>

              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2 text-center lg:text-left">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    Sign In
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Access your accounting dashboard
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-red-900/50 border border-red-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-200 ml-2">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="bg-green-900/50 border border-green-700/50 text-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-200 ml-2">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-200">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 text-base bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-gray-600 transition-all duration-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/30 hover:border-gray-600 disabled:opacity-50"
                      autoFocus
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-200">
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
                        disabled={loading}
                        className="h-12 text-base bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-gray-600 transition-all duration-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/30 hover:border-gray-600 disabled:opacity-50 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    disabled={loading || !email.trim() || !password.trim()}
                    className="w-full h-12 font-semibold text-base bg-gradient-to-r from-[#DC143C] to-[#FF6B6B] hover:from-[#FF6B6B] hover:to-[#FF8787] shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white group mt-4"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 group">
                        Sign In
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Footer Links */}
                <div className="pt-4 space-y-3 border-t border-gray-700">
                  <p className="text-center text-sm text-gray-500">
                    Don't have an account?
                  </p>
                  <a 
                    href="#" 
                    className="flex items-center justify-center gap-2 text-[#FF6B6B] hover:text-[#FF8787] font-semibold transition-colors duration-200 text-sm group"
                  >
                    Contact Administrator
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>

              {/* Footer */}
              <p className="text-center text-gray-500 text-xs mt-8 pt-6 border-t border-gray-700">
                © 2026 ABIC Accounting System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
