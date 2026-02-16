"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface EmployeeRegistrationFormProps {
  onSuccess: () => void
  /** Called with the newly created employee when API succeeds */
  onEmployeeCreated?: (employee: { id: number; first_name: string; last_name: string; email: string; position: string; status: 'pending' | 'approved' | 'terminated'; created_at: string }) => void
  /** Called when loading state changes (for LoadingModal) */
  onLoadingChange?: (loading: boolean) => void
  /** Called when an error occurs (for FailModal) */
  onError?: (error: string | null) => void
}

export function EmployeeRegistrationForm({ onSuccess, onEmployeeCreated, onLoadingChange, onError }: EmployeeRegistrationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    position: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    onLoadingChange?.(true)
    onError?.(null)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name || undefined,
          email: formData.email,
          position: formData.position,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onLoadingChange?.(false)
        const emp = data.data
        onEmployeeCreated?.({
          id: emp.id,
          first_name: emp.first_name ?? formData.first_name,
          last_name: emp.last_name ?? formData.last_name,
          email: emp.email ?? formData.email,
          position: emp.position ?? formData.position,
          status: emp.status === 'active' ? 'approved' : emp.status === 'suspended' ? 'terminated' : 'pending',
          created_at: emp.created_at ?? new Date().toISOString().split('T')[0],
        })
        onSuccess()
        setFormData({
          first_name: '',
          last_name: '',
          middle_name: '',
          email: '',
          position: '',
        })
      } else {
        let msg = data.message
        if (!msg && data.errors) {
          const firstKey = Object.keys(data.errors)[0]
          const firstErr = data.errors[firstKey]
          msg = Array.isArray(firstErr) ? firstErr[0] : firstErr
        }
        const errorMsg = msg || 'Failed to create employee'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create employee'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name" className="text-[#800020] font-medium">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="mt-1 border-[#C9184A]/30 focus:ring-[#A0153E]"
          />
        </div>
        <div>
          <Label htmlFor="last_name" className="text-[#800020] font-medium">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="mt-1 border-[#C9184A]/30 focus:ring-[#A0153E]"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="middle_name" className="text-[#800020] font-medium">
          Middle Name <span className="text-slate-400 text-xs">(Optional)</span>
        </Label>
        <Input
          id="middle_name"
          name="middle_name"
          value={formData.middle_name}
          onChange={handleChange}
          className="mt-1 border-[#C9184A]/30 focus:ring-[#A0153E]"
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-[#800020] font-medium">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 border-[#C9184A]/30 focus:ring-[#A0153E]"
        />
      </div>

      <div>
        <Label htmlFor="position" className="text-[#800020] font-medium">
          Position <span className="text-red-500">*</span>
        </Label>
        <select
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded-md border border-[#C9184A]/30 px-3 py-2 text-sm focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
        >
          <option value="">Select Position...</option>
          <option value="Executive Assistant">Executive Assistant</option>
          <option value="Admin Assistant">Admin Assistant</option>
          <option value="Admin Head">Admin Head</option>
          <option value="Accounting Supervisor">Accounting Supervisor</option>
          <option value="Accounting Assistant">Accounting Assistant</option>
          <option value="Property Specialist">Property Specialist</option>
          <option value="Senior Property Specialist">Senior Property Specialist</option>
          <option value="Junior Web Developer">Junior Web Developer</option>
          <option value="Senior Web Developer">Senior Web Developer</option>
          <option value="IT Supervisor">IT Supervisor</option>
          <option value="Sales Supervisor">Sales Supervisor</option>
          <option value="Junior IT Manager">Junior IT Manager</option>
          <option value="Senior IT Manager">Senior IT Manager</option>
          <option value="Marketing Staff">Marketing Staff</option>
          <option value="Assistant Studio Manager">Assistant Studio Manager</option>
          <option value="Studio Manager">Studio Manager</option>
          <option value="Multimedia Manager">Multimedia Manager</option>
        </select>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white font-bold"
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </Button>
      </div>
    </form>
  )
}
