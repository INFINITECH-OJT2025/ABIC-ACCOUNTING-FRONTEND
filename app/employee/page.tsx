"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SuccessModal from '@/components/ui/SuccessModal'
import FailModal from '@/components/ui/FailModal'
import LoadingModal from '@/components/ui/LoadingModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui'
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Edit,
  Save,
  X,
  Key,
  Briefcase,
  User,
  Phone,
  CreditCard,
  Users,
  MapPin,
  CheckCircle2
} from 'lucide-react'

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

const batches = [
  { id: 1, title: 'Employee Details', icon: Briefcase, description: 'Basic employment information' },
  { id: 2, title: 'Personal Information', icon: User, description: 'Your personal details' },
  { id: 3, title: 'Contact Information', icon: Phone, description: 'How to reach you' },
  { id: 4, title: 'Government IDs', icon: CreditCard, description: 'Official identification numbers' },
  { id: 5, title: 'Family Information', icon: Users, description: 'Parent information' },
  { id: 6, title: 'Address Details', icon: MapPin, description: 'Complete address information' },
]

function EmployeeProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-[#6B1C23] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-white/20 rounded" />
              <div className="h-4 w-64 bg-white/20 rounded" />
            </div>
            <div className="h-10 w-24 bg-white/20 rounded" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action buttons skeleton */}
        <div className="flex gap-3 mb-8">
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
          <div className="h-10 w-36 bg-slate-200 rounded-lg" />
        </div>

        {/* Summary cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
              <div className="h-5 w-28 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div><div className="h-3 w-16 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
              <div><div className="h-3 w-20 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm overflow-hidden md:col-span-2">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
              <div className="h-5 w-36 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}><div className="h-3 w-20 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Second row cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
              <div className="h-5 w-40 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="h-3 w-14 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
                <div><div className="h-3 w-12 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
              </div>
              <div><div className="h-3 w-28 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
              <div className="h-5 w-48 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}><div className="h-3 w-16 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm overflow-hidden md:col-span-2">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
              <div className="h-5 w-36 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-8">
              <div><div className="h-3 w-24 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
              <div><div className="h-3 w-24 bg-slate-100 rounded mb-2" /><div className="h-4 w-full bg-slate-200 rounded" /></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Required fields per batch (fields marked with * in the form)
const REQUIRED_FIELDS_BY_BATCH: Record<number, (keyof Employee)[]> = {
  1: ['position'],
  2: ['last_name', 'first_name', 'birthday', 'birthplace', 'gender', 'civil_status'],
  3: ['mobile_number', 'street'],
  4: [], // Government IDs - all optional
  5: ['mlast_name', 'mfirst_name', 'flast_name', 'ffirst_name'],
  6: ['region', 'province', 'city_municipality', 'barangay', 'zip_code', 'email_address'],
}

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [dataLoaded, setDataLoaded] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(1)

  // Address dropdown states
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([])
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ code: string; name: string }[]>([])
  const [barangays, setBarangays] = useState<{ code: string; name: string }[]>([])
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFailModal, setShowFailModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [successModalContent, setSuccessModalContent] = useState({ title: '', message: '' })
  const [failModalContent, setFailModalContent] = useState({ title: '', message: '' })
  const [failModalRedirectOnClose, setFailModalRedirectOnClose] = useState(false)

  const totalBatches = 6

  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions()
  }, [])

  const fetchRegions = async () => {
    setLoadingRegions(true)
    try {
      const response = await fetch('https://psgc.gitlab.io/api/regions/')
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      const regionsArray = Array.isArray(data) ? data : data.data || []

      const regionsList = regionsArray.map((region: any) => ({
        code: region.code,
        name: region.name,
      }))

      setRegions(regionsList)
    } catch (error) {
      console.error('Error fetching regions:', error)
      setRegions([])
    } finally {
      setLoadingRegions(false)
    }
  }

  const fetchProvinces = async (regionCode: string, preserveValues = false) => {
    if (!regionCode) {
      setProvinces([])
      setCities([])
      setBarangays([])
      return
    }

    setLoadingProvinces(true)
    try {
      const response = await fetch(`https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      const provincesArray = Array.isArray(data) ? data : data.data || []

      const provincesList = provincesArray.map((province: any) => ({
        code: province.code,
        name: province.name,
      }))

      setProvinces(provincesList)
      setCities([])
      setBarangays([])
      if (!preserveValues) {
        setFormData((prev) => ({ ...prev, province: '', city_municipality: '', barangay: '' }))
      }
    } catch (error) {
      console.error('Error fetching provinces:', error)
      setProvinces([])
    } finally {
      setLoadingProvinces(false)
    }
  }

  const fetchCities = async (provinceCode: string, preserveValues = false) => {
    if (!provinceCode) {
      setCities([])
      setBarangays([])
      return
    }

    setLoadingCities(true)
    try {
      const citiesResponse = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities/`)
      const municipalitiesResponse = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/municipalities/`)

      if (!citiesResponse.ok && !municipalitiesResponse.ok) {
        throw new Error(`API error`)
      }

      const citiesData = citiesResponse.ok ? await citiesResponse.json() : []
      const municipalitiesData = municipalitiesResponse.ok ? await municipalitiesResponse.json() : []

      const citiesArray = Array.isArray(citiesData) ? citiesData : citiesData.data || []
      const municipalitiesArray = Array.isArray(municipalitiesData) ? municipalitiesData : municipalitiesData.data || []

      const allCities = [...citiesArray, ...municipalitiesArray].map((city: any) => ({
        code: city.code,
        name: city.name,
      }))

      setCities(allCities)
      setBarangays([])
      if (!preserveValues) {
        setFormData((prev) => ({ ...prev, city_municipality: '', barangay: '' }))
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  const fetchBarangays = async (cityCode: string, preserveValues = false) => {
    if (!cityCode) {
      setBarangays([])
      return
    }

    setLoadingBarangays(true)
    try {
      const response = await fetch(`https://psgc.gitlab.io/api/cities/${cityCode}/barangays/`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      const barangaysArray = Array.isArray(data) ? data : data.data || []

      const barangaysList = barangaysArray.map((barangay: any) => ({
        code: barangay.code,
        name: barangay.name,
      }))

      setBarangays(barangaysList)
      if (!preserveValues) {
        setFormData((prev) => ({ ...prev, barangay: '' }))
      }
    } catch (error) {
      console.error('Error fetching barangays:', error)
      setBarangays([])
    } finally {
      setLoadingBarangays(false)
    }
  }

  // Auth check - cookie-based via /api/auth/me (same pattern as super admin employee page)
  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' })
        const meData = await meRes.json()

        if (!meRes.ok || !meData.success) {
          window.location.href = '/login'
          return
        }

        if (meData.user?.role !== 'employee') {
          window.location.href = '/login'
          return
        }

        // Fetch employee profile via Next.js API (cookies sent automatically)
        const empRes = await fetch('/api/employees/me')
        const empData = await empRes.json()

        if (empRes.ok && empData.success && empData.data) {
          const d = empData.data
          setEmployee(d)
          setFormData({
            id: d.id,
            email: d.email ?? '',
            first_name: d.first_name ?? '',
            last_name: d.last_name ?? '',
            middle_name: d.middle_name ?? '',
            suffix: d.suffix ?? '',
            position: d.position ?? '',
            date_hired: d.date_hired ?? '',
            birthday: d.birthday ?? '',
            birthplace: d.birthplace ?? '',
            civil_status: d.civil_status ?? '',
            gender: d.gender ?? '',
            sss_number: d.sss_number ?? '',
            philhealth_number: d.philhealth_number ?? '',
            pagibig_number: d.pagibig_number ?? '',
            tin_number: d.tin_number ?? '',
            mlast_name: d.mlast_name ?? '',
            mfirst_name: d.mfirst_name ?? '',
            mmiddle_name: d.mmiddle_name ?? '',
            msuffix: d.msuffix ?? '',
            flast_name: d.flast_name ?? '',
            ffirst_name: d.ffirst_name ?? '',
            fmiddle_name: d.fmiddle_name ?? '',
            fsuffix: d.fsuffix ?? '',
            mobile_number: d.mobile_number ?? '',
            house_number: d.house_number ?? '',
            street: d.street ?? '',
            village: d.village ?? '',
            subdivision: d.subdivision ?? '',
            barangay: d.barangay ?? '',
            region: d.region ?? '',
            province: d.province ?? '',
            city_municipality: d.city_municipality ?? '',
            zip_code: d.zip_code ?? '',
            email_address: d.email_address ?? d.email ?? '',
          })
          setDataLoaded(true)
        } else {
          setFailModalContent({ title: 'Failed to Load Profile', message: empData.message || 'Unknown error' })
          setFailModalRedirectOnClose(true)
          setShowFailModal(true)
        }
      } catch (error) {
        console.error('Auth/profile fetch error:', error)
        setFailModalContent({ title: 'Failed to Load Profile', message: 'Make sure the backend is running.' })
        setFailModalRedirectOnClose(true)
        setShowFailModal(true)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchProfile()
  }, [router])

  useEffect(() => {
    if (!formData.region || regions.length === 0 || !dataLoaded) return

    const selectedRegion = regions.find(r => r.name === formData.region)
    if (selectedRegion) {
      fetchProvinces(selectedRegion.code, true)
    }
  }, [formData.region, regions.length, dataLoaded])

  useEffect(() => {
    if (!formData.province || provinces.length === 0 || !dataLoaded) return

    const selectedProvince = provinces.find(p => p.name === formData.province)
    if (selectedProvince) {
      fetchCities(selectedProvince.code, true)
    }
  }, [formData.province, provinces.length, dataLoaded])

  useEffect(() => {
    if (!formData.city_municipality || cities.length === 0 || !dataLoaded) return

    const selectedCity = cities.find(c => c.name === formData.city_municipality)
    if (selectedCity) {
      fetchBarangays(selectedCity.code, true)
    }
  }, [formData.city_municipality, cities.length, dataLoaded])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'region') {
      const selectedRegion = regions.find(r => r.name === value)
      if (selectedRegion) {
        fetchProvinces(selectedRegion.code)
      }
    } else if (name === 'province') {
      const selectedProvince = provinces.find(p => p.name === value)
      if (selectedProvince) {
        fetchCities(selectedProvince.code)
      }
    } else if (name === 'city_municipality') {
      const selectedCity = cities.find(c => c.name === value)
      if (selectedCity) {
        fetchBarangays(selectedCity.code)
      }
    }
  }

  const handleSave = async () => {
    // Validate required fields before submitting
    const firstMissing = getFirstBatchWithMissingRequired(formData)
    if (firstMissing !== null) {
      setCurrentBatch(firstMissing)
      setFailModalContent({
        title: 'Required Fields Missing',
        message: `Please fill in all required fields in ${batches[firstMissing - 1].title} before saving.`,
      })
      setFailModalRedirectOnClose(false)
      setShowFailModal(true)
      return
    }

    setSaving(true)
    setShowLoadingModal(true)

    try {
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (key === 'id') return acc
        acc[key] = value === '' ? null : value
        return acc
      }, {} as any)

      const response = await fetch('/api/employees/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Backend returns only updated fields; merge with existing to preserve id, email
        const updated = { ...employee, ...data.data }
        setEmployee(updated)
        setFormData(updated)
        setIsEditing(false)
        setSuccessModalContent({ title: 'Profile Updated', message: 'Your profile has been updated successfully.' })
        setShowSuccessModal(true)
      } else {
        setFailModalContent({ title: 'Update Failed', message: data.message || 'Failed to update profile.' })
        setFailModalRedirectOnClose(false)
        setShowFailModal(true)
        if (data.errors) {
          console.error('Validation errors:', data.errors)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setFailModalContent({ title: 'Update Failed', message: 'Failed to update profile. Please try again.' })
      setFailModalRedirectOnClose(false)
      setShowFailModal(true)
    } finally {
      setSaving(false)
      setShowLoadingModal(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Proceed with redirect even if logout API fails
    }
    window.location.href = '/login'
  }

  // Calculate progress as completed segments (1-6). Each segment = batch with all required fields filled.
  const getCompletedSegments = () => {
    let completed = 0
    for (let batchId = 1; batchId <= 6; batchId++) {
      const required = REQUIRED_FIELDS_BY_BATCH[batchId] || []
      const allFilled = required.every((field) => {
        const value = formData[field]
        return value !== null && value !== undefined && String(value).trim() !== ''
      })
      if (allFilled) completed++
    }
    return completed
  }

  const completedSegments = getCompletedSegments()

  const nextBatch = () => {
    if (currentBatch < totalBatches) {
      setCurrentBatch(currentBatch + 1)
    }
  }

  const prevBatch = () => {
    if (currentBatch > 1) {
      setCurrentBatch(currentBatch - 1)
    }
  }

  const goToBatch = (batchNumber: number) => {
    setCurrentBatch(batchNumber)
  }

  // Returns the first batch number that has missing required fields, or null if all required are filled
  const getFirstBatchWithMissingRequired = (data: Partial<Employee>): number | null => {
    for (let batchId = 1; batchId <= 6; batchId++) {
      const required = REQUIRED_FIELDS_BY_BATCH[batchId] || []
      const hasMissing = required.some((field) => {
        const value = data[field]
        return value === null || value === undefined || String(value).trim() === ''
      })
      if (hasMissing) return batchId
    }
    return null
  }

  const handleEditProfile = () => {
    setIsEditing(true)
    const firstMissing = getFirstBatchWithMissingRequired(formData)
    // Navigate to first incomplete batch (if any) without showing modal — validation runs on Save
    setCurrentBatch(firstMissing !== null ? firstMissing : 1)
  }

  if (loading) {
    return <EmployeeProfileSkeleton />
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-slate-600 mb-4">Profile not found</p>
              <Button onClick={() => router.push('/login')} className="bg-[#6B1C23] hover:bg-[#7B2431]">
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentBatchInfo = batches[currentBatch - 1]
  const Icon = currentBatchInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-[#6B1C23] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-white">
                Employee Dashboard
              </h1>
              <p className="text-rose-100 flex items-center gap-2">
                <User className="h-4 w-4" />
                Welcome, <span className="font-semibold text-white">{formData.first_name || 'User'} {formData.last_name || ''}</span>
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="!border-white/50 !text-white hover:!bg-white/20 hover:!border-white !bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          {!isEditing ? (
            <>
              <Button
                onClick={handleEditProfile}
                className="bg-[#6B1C23] hover:bg-[#7B2431]"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Link href="/change-password">
                <Button
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </Link>
            </>
          ) : (
            <Button
              onClick={() => {
                setIsEditing(false)
                setFormData(employee!)
              }}
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {/* Conditional Content based on Editing State */}
        {!isEditing ? (
          /* Read-only Profile Preview */
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#6B1C23]" />
                    <CardTitle className="text-lg">Employment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Position</p>
                    <p className="text-slate-900 font-medium">{employee.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Date Hired</p>
                    <p className="text-slate-900 font-medium">{employee.date_hired ? new Date(employee.date_hired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm overflow-hidden md:col-span-2">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#6B1C23]" />
                    <CardTitle className="text-lg">Personal Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Full Name</p>
                    <p className="text-slate-900 font-medium">
                      {employee.first_name} {employee.middle_name ? `${employee.middle_name} ` : ''}{employee.last_name} {employee.suffix || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Birth Details</p>
                    <p className="text-slate-900 font-medium whitespace-pre-wrap">
                      {employee.birthday ? new Date(employee.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
                      {employee.birthplace ? ` • ${employee.birthplace}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Gender / Status</p>
                    <p className="text-slate-900 font-medium">{employee.gender || '---'} • {employee.civil_status || '---'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5, 6].map((seg) => (
                          <div
                            key={seg}
                            className={`flex-1 h-2 rounded-full transition-colors ${seg <= completedSegments ? 'bg-[#6B1C23]' : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#6B1C23]">{completedSegments}/6</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact & Address */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-[#6B1C23]" />
                    <CardTitle className="text-lg">Contact & Address</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 uppercase font-semibold">Mobile</p>
                      <p className="text-slate-900 font-medium">{employee.mobile_number || '---'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 uppercase font-semibold">Email</p>
                      <p className="text-slate-900 font-medium truncate">{employee.email_address || '---'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Current Address</p>
                    <p className="text-slate-900 font-medium leading-relaxed">
                      {[
                        employee.house_number,
                        employee.street,
                        employee.village,
                        employee.subdivision,
                        employee.barangay,
                        employee.city_municipality,
                        employee.province,
                        employee.region,
                        employee.zip_code
                      ].filter(Boolean).join(', ') || 'Address not complete'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Government IDs */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#6B1C23]" />
                    <CardTitle className="text-lg">Government Identifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">SSS</p>
                    <p className="text-slate-900 font-medium font-mono">{employee.sss_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">PhilHealth</p>
                    <p className="text-slate-900 font-medium font-mono">{employee.philhealth_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Pag-IBIG</p>
                    <p className="text-slate-900 font-medium font-mono">{employee.pagibig_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">TIN</p>
                    <p className="text-slate-900 font-medium font-mono">{employee.tin_number || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Family Information */}
              <Card className="border-slate-200 shadow-sm overflow-hidden md:col-span-2">
                <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#6B1C23]" />
                    <CardTitle className="text-lg">Family Background</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mother&apos;s Details</h4>
                    <p className="text-slate-900 font-medium">
                      {[employee.mfirst_name, employee.mmiddle_name, employee.mlast_name, employee.msuffix].filter(Boolean).join(' ') || '---'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Father&apos;s Details</h4>
                    <p className="text-slate-900 font-medium">
                      {[employee.ffirst_name, employee.fmiddle_name, employee.flast_name, employee.fsuffix].filter(Boolean).join(' ') || '---'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Editing UI: Progress Bar and Batch Form */
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Horizontal Stepper Progress Card */}
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-[#6B1C23] via-[#7B2431] to-[#8B2C3F] px-6 py-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit Your Profile</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-white">{completedSegments}/6</div>
                    <p className="text-rose-200 text-xs">Segments Complete</p>
                  </div>
                </div>

                {/* Horizontal Stepper with Progress Bar */}
                <div className="relative">
                  {/* 6-Segment Progress Bar */}
                  <div className="w-full flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6].map((seg) => (
                      <div
                        key={seg}
                        className={`flex-1 h-2 rounded-full transition-all duration-300 ${seg <= completedSegments ? 'bg-white/90' : 'bg-white/20'}`}
                      />
                    ))}
                  </div>

                  {/* Steps with Labels */}
                  <div className="flex justify-between items-start mt-4">
                    {batches.map((batch, index) => {
                      const BatchIcon = batch.icon
                      const isActive = currentBatch === batch.id
                      const required = REQUIRED_FIELDS_BY_BATCH[batch.id] || []
                      const isCompleted = required.every((field) => {
                        const value = formData[field]
                        return value !== null && value !== undefined && String(value).trim() !== ''
                      })

                      return (
                        <div
                          key={batch.id}
                          className="flex flex-col items-center cursor-pointer group"
                          style={{ width: `${100 / batches.length}%` }}
                          onClick={() => goToBatch(batch.id)}
                        >
                          <div className="relative mb-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isActive
                                ? 'bg-white text-[#6B1C23] scale-110 shadow-lg'
                                : isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white/30 text-white/70 group-hover:bg-white/40'
                                }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <BatchIcon className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                          <div className="text-center hidden md:block">
                            <p className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-emerald-200' : 'text-rose-100/80 group-hover:text-white'}`}>
                              {batch.title}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Current Batch Form */}
            <Card className="shadow-xl border-rose-100">
              <CardHeader className="bg-gradient-to-br from-[#6B1C23] via-[#7B2431] to-[#8B2C3F] text-white rounded-t-xl py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">{currentBatchInfo.title}</CardTitle>
                    <CardDescription className="text-white/80 text-xs font-medium">{currentBatchInfo.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 md:p-10">
                {/* BATCH 1: Employee Details */}
                {currentBatch === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="position" className="text-base font-semibold text-slate-800">
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="position"
                        name="position"
                        value={formData.position || ''}
                        onChange={handleChange}
                        className="flex h-12 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-base focus-visible:ring-2 focus-visible:ring-[#6B1C23] transition-all"
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

                    <div className="space-y-3">
                      <Label htmlFor="date_hired" className="text-base font-semibold text-slate-800">
                        Date Hired
                      </Label>
                      <Input
                        id="date_hired"
                        type="date"
                        name="date_hired"
                        value={formatDateForInput(formData.date_hired)}
                        onChange={handleChange}
                        className="h-12 text-base border-2 border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* BATCH 2: Personal Information */}
                {currentBatch === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-semibold">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="last_name" name="last_name" value={formData.last_name || ''} onChange={handleChange} placeholder="e.g., Dela Cruz" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-semibold">First Name <span className="text-red-500">*</span></Label>
                      <Input id="first_name" name="first_name" value={formData.first_name || ''} onChange={handleChange} placeholder="e.g., Juan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middle_name" className="text-sm font-semibold">Middle Name</Label>
                      <Input id="middle_name" name="middle_name" value={formData.middle_name || ''} onChange={handleChange} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suffix" className="text-sm font-semibold">Suffix</Label>
                      <Input id="suffix" name="suffix" value={formData.suffix || ''} onChange={handleChange} placeholder="e.g., Jr." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday" className="text-sm font-semibold">Birthday <span className="text-red-500">*</span></Label>
                      <Input id="birthday" type="date" name="birthday" value={formatDateForInput(formData.birthday)} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthplace" className="text-sm font-semibold">Birthplace <span className="text-red-500">*</span></Label>
                      <Input id="birthplace" name="birthplace" value={formData.birthplace || ''} onChange={handleChange} placeholder="e.g., Manila" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-semibold">Gender <span className="text-red-500">*</span></Label>
                      <select id="gender" name="gender" value={formData.gender || ''} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="civil_status" className="text-sm font-semibold">Civil Status <span className="text-red-500">*</span></Label>
                      <select id="civil_status" name="civil_status" value={formData.civil_status || ''} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="">Select...</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* BATCH 3: Contact Information */}
                {currentBatch === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="mobile_number" className="text-sm font-semibold">Mobile Number <span className="text-red-500">*</span></Label>
                      <Input id="mobile_number" name="mobile_number" value={formData.mobile_number || ''} onChange={handleChange} placeholder="09XXXXXXXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="house_number" className="text-sm font-semibold">House number</Label>
                      <Input id="house_number" name="house_number" value={formData.house_number || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-sm font-semibold">Street <span className="text-red-500">*</span></Label>
                      <Input id="street" name="street" value={formData.street || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="village" className="text-sm font-semibold">Village</Label>
                      <Input id="village" name="village" value={formData.village || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="subdivision" className="text-sm font-semibold">Subdivision</Label>
                      <Input id="subdivision" name="subdivision" value={formData.subdivision || ''} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {/* BATCH 4: Government IDs */}
                {currentBatch === 4 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sss_number" className="text-sm font-semibold">SSS Number</Label>
                      <Input id="sss_number" name="sss_number" value={formData.sss_number || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="philhealth_number" className="text-sm font-semibold">PhilHealth Number</Label>
                      <Input id="philhealth_number" name="philhealth_number" value={formData.philhealth_number || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pagibig_number" className="text-sm font-semibold">Pag-IBIG Number</Label>
                      <Input id="pagibig_number" name="pagibig_number" value={formData.pagibig_number || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tin_number" className="text-sm font-semibold">TIN Number</Label>
                      <Input id="tin_number" name="tin_number" value={formData.tin_number || ''} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {/* BATCH 5: Family Information */}
                {currentBatch === 5 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-rose-100 bg-rose-50/30 p-4">
                      <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-rose-500 rounded-full"></div>Mother&apos;s Maiden Name</h4>
                      <div className="space-y-4">
                        <Input placeholder="Last Name *" name="mlast_name" value={formData.mlast_name || ''} onChange={handleChange} />
                        <Input placeholder="First Name *" name="mfirst_name" value={formData.mfirst_name || ''} onChange={handleChange} />
                        <Input placeholder="Middle Name" name="mmiddle_name" value={formData.mmiddle_name || ''} onChange={handleChange} />
                        <Input placeholder="Suffix" name="msuffix" value={formData.msuffix || ''} onChange={handleChange} />
                      </div>
                    </Card>
                    <Card className="border-slate-100 bg-slate-50/30 p-4">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-slate-500 rounded-full"></div>Father&apos;s Name</h4>
                      <div className="space-y-4">
                        <Input placeholder="Last Name *" name="flast_name" value={formData.flast_name || ''} onChange={handleChange} />
                        <Input placeholder="First Name *" name="ffirst_name" value={formData.ffirst_name || ''} onChange={handleChange} />
                        <Input placeholder="Middle Name" name="fmiddle_name" value={formData.fmiddle_name || ''} onChange={handleChange} />
                        <Input placeholder="Suffix" name="fsuffix" value={formData.fsuffix || ''} onChange={handleChange} />
                      </div>
                    </Card>
                  </div>
                )}

                {/* BATCH 6: Address Details */}
                {currentBatch === 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-sm font-semibold">Region <span className="text-red-500">*</span></Label>
                      <select name="region" value={formData.region || ''} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="">Select Region...</option>
                        {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-sm font-semibold">Province <span className="text-red-500">*</span></Label>
                      <select name="province" value={formData.province || ''} onChange={handleChange} disabled={!formData.region} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="">Select Province...</option>
                        {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city_municipality" className="text-sm font-semibold">City/Municipality <span className="text-red-500">*</span></Label>
                      <select name="city_municipality" value={formData.city_municipality || ''} onChange={handleChange} disabled={!formData.province} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="">Select City...</option>
                        {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barangay" className="text-sm font-semibold">Barangay <span className="text-red-500">*</span></Label>
                      <select name="barangay" value={formData.barangay || ''} onChange={handleChange} disabled={!formData.city_municipality} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="">Select Barangay...</option>
                        {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code" className="text-sm font-semibold">ZIP Code <span className="text-red-500">*</span></Label>
                      <Input id="zip_code" name="zip_code" value={formData.zip_code || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_address" className="text-sm font-semibold">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="email_address"
                        type="email"
                        name="email_address"
                        value={formData.email_address || formData.email || ''}
                        readOnly
                        disabled
                        className="bg-slate-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              <Separator />

              {/* Navigation Footer */}
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <Button
                    onClick={prevBatch}
                    disabled={currentBatch === 1}
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {batches.map((b) => (
                      <div key={b.id} className={`h-1.5 w-6 rounded-full transition-all ${currentBatch === b.id ? 'bg-[#6B1C23] w-10' : 'bg-slate-200'}`} />
                    ))}
                  </div>

                  {currentBatch === totalBatches ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setIsEditing(false)
                          setFormData(employee)
                        }}
                        variant="outline"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={nextBatch}
                      className="bg-[#6B1C23] hover:bg-[#7B2431] text-white"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successModalContent.title}
        message={successModalContent.message}
      />

      <FailModal
        isOpen={showFailModal}
        onClose={() => {
          setShowFailModal(false)
          if (failModalRedirectOnClose) {
            window.location.href = '/login'
          }
        }}
        title={failModalContent.title}
        message={failModalContent.message}
        buttonText={failModalRedirectOnClose ? 'Go to Login' : 'OK'}
      />

      <LoadingModal
        isOpen={showLoadingModal}
        title="Saving Profile"
        message="Please wait while we update your profile..."
      />
    </div>
  )
}
