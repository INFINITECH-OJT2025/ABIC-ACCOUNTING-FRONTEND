"use client"

import React, { useState } from 'react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface EmployeeRegistrationFormProps {
  onSuccess?: () => void
}

export function EmployeeRegistrationForm({ onSuccess }: EmployeeRegistrationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
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
      const response = await fetch(`${getApiUrl()}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Employee created successfully')
        setFormData({ first_name: '', last_name: '', email: '' })
        
        if (onSuccess) {
          onSuccess()
        } else {
          // Fallback if no callback provided
          window.location.reload()
        }
      } else {
        toast.error(data.message || 'Failed to create employee')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to create employee. Make sure Laravel backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <p className="text-sm text-slate-600 mb-6 bg-rose-50 p-3 rounded-lg border border-[#FFE5EC]">
        <span className="text-[#800020] font-semibold">Note:</span> Password will be auto-generated and sent via email to the employee.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name Field */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-semibold text-[#800020] mb-1">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="John"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] transition-all"
          />
        </div>

        {/* Last Name Field */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-semibold text-[#800020] mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Doe"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] transition-all"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#800020] mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] transition-all"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'CREATE EMPLOYEE'}
        </Button>
      </form>
    </div>
  )
}

