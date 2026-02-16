"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import abicLogo from './abic_logo.png'
import { getApiUrl } from '@/lib/api'

export default function EmployeeLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/api/employees/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem('employee_token', data.data.token)
        localStorage.setItem('employee_email', data.data.employee.email)
        localStorage.setItem('employee_data', JSON.stringify(data.data.employee))

        toast.success('Login successful!')

        setTimeout(() => {
          router.push('/employee/dashboard')
        }, 100)
      } else {
        toast.error(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to login. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A0404] via-[#800000] to-[#2D0606] flex items-center justify-center p-4 font-sans">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-md w-full p-10 transform transition-all">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-64 h-24 mb-4">
            <Image
              src={abicLogo}
              alt="ABIC Realty Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="h-1 w-12 bg-gradient-to-r from-maroon-700 to-maroon-900 rounded-full mb-2" />
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Employee Portal</h2>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@abic.com"
              required
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-600 transition-all text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Password
              </label>
              <Link href="/employee/change_password" title="Go to Change Password" className="text-xs text-maroon-700 hover:text-maroon-800 font-bold hover:underline transition-all">
                Change Password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-600 transition-all text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-[#4A0404] via-[#800000] to-[#2D0606] hover:brightness-110 disabled:opacity-70 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-maroon-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer Section */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 font-medium pb-4 border-b border-gray-100">
            Internal Access Only • ABIC Accounting System
          </p>
          <p className="mt-4 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
            © 2026 ABIC Realty & Consultancy Corp.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .bg-maroon-800 { background-color: #800000; }
        .from-maroon-800 { --tw-gradient-from: #800000; }
        .to-maroon-700 { --tw-gradient-to: #4A0404; }
        .text-maroon-700 { color: #800000; }
        .focus\\:ring-maroon-600\\/20 { --tw-ring-color: rgba(128, 0, 0, 0.2); }
        .focus\\:border-maroon-600 { border-color: #800000; }
      `}</style>
    </div>
  )
}
