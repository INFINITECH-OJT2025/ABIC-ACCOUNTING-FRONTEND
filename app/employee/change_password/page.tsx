"use client"

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import abicLogo from '../login/abic_logo.png'
import { getApiUrl } from '@/lib/api'

function ChangePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenEmail = searchParams.get('token') || ''

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: tokenEmail,
    old_password: '',
    new_password: '',
    new_password_confirmation: '',
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

    if (formData.new_password !== formData.new_password_confirmation) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/api/employees/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          old_password: formData.old_password,
          new_password: formData.new_password,
          new_password_confirmation: formData.new_password_confirmation,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Password changed successfully!')
        router.push('/employee/login')
      } else {
        toast.error(data.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to change password. Make sure the backend is running.')
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
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">Reset Password</h2>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-600 transition-all text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="old_password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
              Current Password
            </label>
            <input
              type="password"
              id="old_password"
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              placeholder="Enter current password"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-600 transition-all text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="new_password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-600 transition-all text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="new_password_confirmation" className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="new_password_confirmation"
              name="new_password_confirmation"
              value={formData.new_password_confirmation}
              onChange={handleChange}
              placeholder="Repeat new password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-600/20 focus:border-maroon-600 transition-all text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-br from-[#4A0404] via-[#800000] to-[#2D0606] hover:brightness-110 disabled:opacity-70 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-maroon-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        {/* Footer Section */}
        <div className="mt-8 text-center space-y-4">
          <Link href="/employee/login" className="text-sm text-maroon-700 hover:text-maroon-800 font-bold hover:underline transition-all block">
            Cancel and Return to Login
          </Link>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
              © 2026 ABIC Realty & Consultancy Corp.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .bg-maroon-800 { background-color: #800000; }
        .from-maroon-700 { --tw-gradient-from: #800000; }
        .to-maroon-900 { --tw-gradient-to: #4A0404; }
        .text-maroon-700 { color: #800000; }
        .focus\\:ring-maroon-600\\/20 { --tw-ring-color: rgba(128, 0, 0, 0.2); }
        .focus\\:border-maroon-600 { border-color: #800000; }
      `}</style>
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#4A0404] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ChangePasswordForm />
    </Suspense>
  )
}
