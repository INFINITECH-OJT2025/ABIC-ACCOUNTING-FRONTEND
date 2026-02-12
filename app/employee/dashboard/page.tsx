"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { getApiUrl } from '@/lib/api'

// Helper function to format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

interface Employee {
  id: number
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  suffix?: string
  position?: string
  date_hired?: string
  birthday?: string
  birthplace?: string
  civil_status?: string
  gender?: string
  sss_number?: string
  philhealth_number?: string
  pagibig_number?: string
  tin_number?: string
  mothers_maiden_name?: string
  mlast_name?: string
  mfirst_name?: string
  mmiddle_name?: string
  msuffix?: string
  fathers_name?: string
  flast_name?: string
  ffirst_name?: string
  fmiddle_name?: string
  fsuffix?: string
  mobile_number?: string
  house_number?: string
  street?: string
  village?: string
  subdivision?: string
  barangay?: string
  region?: string
  province?: string
  city_municipality?: string
  zip_code?: string
  email_address?: string
}

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const email = localStorage.getItem('employee_email')
      const token = localStorage.getItem('employee_token')
      const cachedData = localStorage.getItem('employee_data')

      if (!email || !token) {
        router.push('/employee/login')
        return
      }

      // Try to use cached employee data first
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData)
          setEmployee(parsedData)
          setFormData(parsedData)
          setDataLoaded(true)
          setLoading(false)
        } catch (e) {
          console.error('Failed to parse cached employee data:', e)
        }
      }

      try {
        const apiUrl = getApiUrl()
        const fetchUrl = `${apiUrl}/api/employees-profile?email=${encodeURIComponent(email)}`
        
        const response = await fetch(fetchUrl)
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`)
        }
        
        const data = await response.json()

        if (data.success && data.data) {
          setEmployee(data.data)
          setFormData(data.data)
          setDataLoaded(true)
          localStorage.setItem('employee_data', JSON.stringify(data.data))
          
          if (!cachedData) {
            toast.success('Profile loaded successfully!')
          }
        } else {
          toast.error('Failed to load profile: ' + (data.message || 'Unknown error'))
          if (!cachedData) {
            router.push('/employee/login')
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
        if (!cachedData) {
          toast.error('Failed to load profile. Make sure the backend is running.')
          setTimeout(() => {
            router.push('/employee/login')
          }, 2000)
        } else {
          toast.info('Using cached profile (offline mode)')
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchProfile()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Convert empty strings to null for cleaner data
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value
        return acc
      }, {} as any)

      const response = await fetch(`${getApiUrl()}/api/employees/${employee?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setEmployee(data.data)
        setFormData(data.data)
        setIsEditing(false)
        // Update cache with latest data
        localStorage.setItem('employee_data', JSON.stringify(data.data))
        toast.success('Profile updated successfully!')
      } else {
        toast.error(data.message || 'Failed to update profile')
        if (data.errors) {
          console.error('Validation errors:', data.errors)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('employee_token')
    localStorage.removeItem('employee_email')
    localStorage.removeItem('employee_data')
    router.push('/employee/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Profile not found</p>
          <button
            onClick={() => router.push('/employee/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Employee Dashboard</h1>
              <p className="text-slate-600 mt-1">
                Welcome, {formData.first_name || 'User'} {formData.last_name || ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
              <Link
                href="/employee/change_password"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors inline-block"
              >
                Change Password
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData(employee)
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow" key={employee?.id || 'loading'}>
          <div className="p-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
              <div>
                {/* Employee Details Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-gray-400">
                    EMPLOYEE DETAILS
                  </h2>
                  <div className="space-y-4">
                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">POSITION <span className="text-red-500">*</span></label>
                      <select
                        name="position"
                        value={formData.position || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
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

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">DATE HIRED <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="date_hired"
                        value={formatDateForInput(formData.date_hired)}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-gray-400">
                    PERSONAL INFORMATION
                  </h2>
                  <div className="space-y-3">
                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">LAST NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">FIRST NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">MIDDLE NAME <span className="text-red-500 text-xs">NOT REQUIRED</span></label>
                      <input
                        type="text"
                        name="middle_name"
                        value={formData.middle_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">SUFFIX <span className="text-red-500 text-xs">NOT REQUIRED</span></label>
                      <input
                        type="text"
                        name="suffix"
                        value={formData.suffix || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">BIRTHDAY <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="birthday"
                        value={formatDateForInput(formData.birthday)}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">BIRTHPLACE <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="birthplace"
                        value={formData.birthplace || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">CIVIL STATUS <span className="text-red-500">*</span></label>
                      <select
                        name="civil_status"
                        value={formData.civil_status || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      >
                        <option value="">Select...</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">GENDER <span className="text-red-500">*</span></label>
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-gray-400">
                    CONTACT INFORMATION
                  </h2>
                  <div className="space-y-3">
                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">MOBILE NUMBER <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        name="mobile_number"
                        value={formData.mobile_number || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">HOUSE NUMBER <span className="text-red-500 text-xs">NOT REQUIRED</span></label>
                      <input
                        type="text"
                        name="house_number"
                        value={formData.house_number || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">STREET <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">VILLAGE <span className="text-red-500 text-xs">NOT REQUIRED</span></label>
                      <input
                        type="text"
                        name="village"
                        value={formData.village || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">SUBDIVISION <span className="text-red-500 text-xs">NOT REQUIRED</span></label>
                      <input
                        type="text"
                        name="subdivision"
                        value={formData.subdivision || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">BARANGAY <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="barangay"
                        value={formData.barangay || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {/* Government ID Numbers Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-gray-400">
                    GOVERNMENT ID NUMBERS
                  </h2>
                  <div className="space-y-3">
                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">SSS NUMBER <span className="text-gray-600 text-xs">can be N/A</span></label>
                      <input
                        type="text"
                        name="sss_number"
                        value={formData.sss_number || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">PHILHEALTH NUMBER <span className="text-gray-600 text-xs">can be N/A</span></label>
                      <input
                        type="text"
                        name="philhealth_number"
                        value={formData.philhealth_number || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">PAG-IBIG NUMBER <span className="text-gray-600 text-xs">can be N/A</span></label>
                      <input
                        type="text"
                        name="pagibig_number"
                        value={formData.pagibig_number || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">TIN NUMBER <span className="text-gray-600 text-xs">can be N/A</span></label>
                      <input
                        type="text"
                        name="tin_number"
                        value={formData.tin_number || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Family Information Section */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-gray-400">
                    FAMILY INFORMATION
                  </h2>
                  <div className="space-y-3">
                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">MOTHER'S MAIDEN NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="mothers_maiden_name"
                        value={formData.mothers_maiden_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">MLAST NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="mlast_name"
                        value={formData.mlast_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">MFIRST NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="mfirst_name"
                        value={formData.mfirst_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">MMIDDLE NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="mmiddle_name"
                        value={formData.mmiddle_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">MSUFIX <span className="text-red-500 text-xs">NOT REQUIRED</span></label>
                      <input
                        type="text"
                        name="msuffix"
                        value={formData.msuffix || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">FATHER'S NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="fathers_name"
                        value={formData.fathers_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">FLAST NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="flast_name"
                        value={formData.flast_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">FFIRST NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="ffirst_name"
                        value={formData.ffirst_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">FMIDDLE NAME <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="fmiddle_name"
                        value={formData.fmiddle_name || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">FSUFIX</label>
                      <input
                        type="text"
                        name="fsuffix"
                        value={formData.fsuffix || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Continuation */}
                <div className="mt-8">
                  <div className="space-y-3">
                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">REGION <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="region"
                        value={formData.region || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">PROVINCE <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">CITY / MUNICIPALITY <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="city_municipality"
                        value={formData.city_municipality || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">ZIP CODE <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>

                    <div className="border border-gray-300 p-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">EMAIL ADDRESS <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        name="email_address"
                        value={formData.email_address || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

