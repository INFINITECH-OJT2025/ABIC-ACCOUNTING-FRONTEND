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
            router.push('/super-admin')
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
      className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a0a0f] to-black flex items-center justify-center relative overflow-hidden"
    >
      {/* Interactive gradient overlay on mouse move */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(184, 53, 75, 0.3), transparent 70%)`,
        }}
      ></div>

      {/* Moving maroon gradient circles - Multiple animated orbs */}
      <div className="moving-circle-1 absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20"></div>
      <div className="moving-circle-2 absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-25"></div>
      <div className="moving-circle-3 absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-15"></div>
      <div className="moving-circle-4 absolute w-[350px] h-[350px] rounded-full blur-3xl opacity-20"></div>
      
      {/* Static gradient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#FF6B6B]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-[#8B0000]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="relative z-10 w-full h-screen lg:h-auto flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          {/* Main Container - Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
            
            {/* Left Side - Logo and Content */}
            <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-to-b from-[#6B2A40]/80 via-[#5A1F35]/90 to-[#4A1A2D]/95 backdrop-blur-2xl rounded-l-3xl border-2 border-[#FF6B6B]/40 hover:border-[#FF8A80]/60 transition-all duration-500 shadow-2xl hover:shadow-[#FF6B6B]/30">
              <div className="space-y-4 text-center max-w-sm">
                {/* Logo with enhanced glow */}
                <div className="flex justify-center animate-fade-in">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] via-[#B8354B] to-[#8B0000] rounded-full blur-3xl opacity-70 group-hover:opacity-90 animate-pulse transition-all duration-500"></div>
                    <div className="absolute -inset-8 bg-gradient-to-br from-[#FF6B6B]/30 to-[#8B0000]/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-spin-slow"></div>
                    <div className="absolute -inset-4 bg-gradient-to-br from-[#FF8A80]/40 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <Logo animated={true} className="relative w-56 h-56 drop-shadow-2xl brightness-110 hover:scale-105 transition-transform duration-500" />
                  </div>
                </div>

                {/* Content Text */}
                <div className="space-y-3">
                  <h2 className="text-5xl font-bold text-white leading-tight tracking-tight">
                    Welcome to<br />
                    <span className="bg-gradient-to-r from-[#FF8A80] via-[#FF6B6B] to-[#FF5252] bg-clip-text text-transparent leading-tight">
                      ABIC Accounting
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg">
                    Professional accounting management for your business
                  </p>
                </div>

                {/* Decorative dots */}
                <div className="flex justify-center gap-4 pt-6">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#8B0000] animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#8B0000] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#8B0000] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-col justify-center p-10 lg:p-16 bg-gradient-to-b from-[#2B2B2B]/90 via-[#1F1F1F]/95 to-[#1A1A1A]/98 backdrop-blur-2xl rounded-3xl lg:rounded-none lg:rounded-r-3xl border-2 border-[#FF6B6B]/30 lg:border-l-0 shadow-2xl hover:shadow-[#FF6B6B]/20 transition-shadow duration-500">
              
              {/* Mobile Logo - Shows on mobile only */}
              <div className="lg:hidden flex justify-center mb-6 animate-fade-in">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] via-[#B8354B] to-[#8B0000] rounded-full blur-2xl opacity-70 group-hover:opacity-90 animate-pulse transition-all duration-500"></div>
                  <div className="absolute -inset-6 bg-gradient-to-br from-[#FF6B6B]/30 to-[#8B0000]/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="absolute -inset-3 bg-gradient-to-br from-[#FF8A80]/40 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  <Logo animated={true} className="relative w-32 h-32 drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
                </div>
              </div>

              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-4 text-center lg:text-left">
                  <h1 className="text-5xl lg:text-5xl font-bold text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text animate-gradient leading-tight">
                    Sign In
                  </h1>
                  <p className="text-gray-300 text-base font-light">
                    Access your accounting dashboard
                  </p>
                  <div className="h-1.5 w-16 bg-gradient-to-r from-[#FF6B6B] via-[#FF8A80] to-[#FF6B6B] rounded-full lg:ml-0 mx-auto animate-shimmer shadow-lg shadow-[#FF6B6B]/50" style={{ backgroundSize: '200% 100%' }}></div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="bg-red-950/40 border border-red-700/40 backdrop-blur-sm rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-200 ml-2 font-medium">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="bg-green-950/40 border border-green-700/40 text-green-200 backdrop-blur-sm rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-200 ml-2 font-medium">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Email Input */}
                  <div className="space-y-3 group">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-200 group-focus-within:text-[#FF8A80] transition-colors duration-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="h-13 text-base bg-white/8 backdrop-blur-sm border-1.5 border-gray-600/40 text-white placeholder-gray-500 transition-all duration-300 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/40 focus:bg-white/12 hover:border-gray-500/60 hover:bg-white/10 disabled:opacity-50 rounded-xl shadow-lg hover:shadow-xl"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-3 group">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-200 group-focus-within:text-[#FF8A80] transition-colors duration-300">
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
                        className="h-13 text-base bg-white/8 backdrop-blur-sm border-1.5 border-gray-600/40 text-white placeholder-gray-500 transition-all duration-300 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/40 focus:bg-white/12 hover:border-gray-500/60 hover:bg-white/10 disabled:opacity-50 pr-12 rounded-xl shadow-lg hover:shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF8A80] transition-all duration-250 hover:scale-120"
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
                    className="w-full h-13 font-semibold text-base bg-gradient-to-r from-[#FF6B6B] via-[#FF8A80] to-[#FF7575] hover:from-[#FF8A80] hover:via-[#FF9999] hover:to-[#FFB3B3] shadow-xl hover:shadow-2xl hover:shadow-[#FF6B6B]/60 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-white font-bold text-lg relative overflow-hidden rounded-xl mt-4"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                    {loading ? (
                      <span className="flex items-center justify-center gap-3 relative z-10">
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3 relative z-10">
                        Sign In
                        <ArrowRight className="h-5 w-5 transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-125" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Footer Links */}
                <div className="pt-8 space-y-4 border-t border-gray-700/30">
                  <p className="text-center text-sm text-gray-500 font-light">
                    Don't have an account?
                  </p>
                  <a 
                    href="#" 
                    className="flex items-center justify-center gap-2 text-[#FF8A80] hover:text-[#FFB3B3] font-semibold transition-all duration-250 text-sm group bg-gradient-to-r from-[#FF6B6B]/15 to-[#8B0000]/10 hover:from-[#FF6B6B]/25 hover:to-[#8B0000]/15 py-3 rounded-xl backdrop-blur-sm border border-[#FF6B6B]/10 hover:border-[#FF6B6B]/30"
                  >
                    Contact Administrator
                    <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1.5 group-hover:scale-125" />
                  </a>
                </div>
              </div>

              {/* Footer */}
              <p className="text-center text-gray-500 text-xs mt-10 pt-8 border-t border-gray-700/30 font-light">
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
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(255, 107, 107, 0.4), inset 0 0 8px rgba(255, 107, 107, 0.1);
          }
          50% {
            box-shadow: 0 0 24px rgba(255, 107, 107, 0.7), inset 0 0 12px rgba(255, 107, 107, 0.2);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes moveCircle1 {
          0%, 100% {
            transform: translate(20vw, 10vh) scale(1);
          }
          25% {
            transform: translate(60vw, 30vh) scale(1.1);
          }
          50% {
            transform: translate(40vw, 60vh) scale(0.9);
          }
          75% {
            transform: translate(10vw, 40vh) scale(1.05);
          }
        }

        @keyframes moveCircle2 {
          0%, 100% {
            transform: translate(70vw, 20vh) scale(0.9);
          }
          25% {
            transform: translate(30vw, 50vh) scale(1);
          }
          50% {
            transform: translate(80vw, 70vh) scale(1.1);
          }
          75% {
            transform: translate(50vw, 30vh) scale(0.95);
          }
        }

        @keyframes moveCircle3 {
          0%, 100% {
            transform: translate(50vw, 70vh) scale(1.1);
          }
          25% {
            transform: translate(20vw, 40vh) scale(0.9);
          }
          50% {
            transform: translate(70vw, 20vh) scale(1);
          }
          75% {
            transform: translate(40vw, 60vh) scale(1.05);
          }
        }

        @keyframes moveCircle4 {
          0%, 100% {
            transform: translate(10vw, 60vh) scale(0.95);
          }
          25% {
            transform: translate(75vw, 50vh) scale(1.1);
          }
          50% {
            transform: translate(25vw, 20vh) scale(0.9);
          }
          75% {
            transform: translate(60vw, 70vh) scale(1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .moving-circle-1 {
          background: radial-gradient(circle, rgba(184, 53, 75, 0.6) 0%, rgba(139, 0, 0, 0.4) 50%, transparent 100%);
          animation: moveCircle1 25s ease-in-out infinite;
        }

        .moving-circle-2 {
          background: radial-gradient(circle, rgba(139, 0, 0, 0.7) 0%, rgba(184, 53, 75, 0.3) 50%, transparent 100%);
          animation: moveCircle2 20s ease-in-out infinite;
        }

        .moving-circle-3 {
          background: radial-gradient(circle, rgba(107, 42, 64, 0.5) 0%, rgba(184, 53, 75, 0.4) 50%, transparent 100%);
          animation: moveCircle3 30s ease-in-out infinite;
        }

        .moving-circle-4 {
          background: radial-gradient(circle, rgba(255, 107, 107, 0.4) 0%, rgba(184, 53, 75, 0.5) 50%, transparent 100%);
          animation: moveCircle4 22s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.7s ease-out forwards;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        input:focus {
          box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12), 0 0 20px rgba(255, 107, 107, 0.15);
        }

        /* Premium button shimmer effect */
        button[type="submit"]:hover::before {
          animation: shimmer 1.5s infinite;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 2rem;
          }
          h2 {
            font-size: 1.875rem;
          }
        }
      `}</style>
    </div>
  )
}
