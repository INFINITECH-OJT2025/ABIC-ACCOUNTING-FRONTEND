"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  CheckCircle2,
  Circle
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

interface AdditionalFieldValue {
  field_id: number
  field_label: string
  field_key: string
  field_type: string
  field_unit: string | null
  value: string | null
}

const batches = [
  { id: 1, title: 'Employee Details', icon: Briefcase, description: 'Basic employment information' },
  { id: 2, title: 'Personal Information', icon: User, description: 'Your personal details' },
  { id: 3, title: 'Contact Information', icon: Phone, description: 'How to reach you' },
  { id: 4, title: 'Government IDs', icon: CreditCard, description: 'Official identification numbers' },
  { id: 5, title: 'Family Information', icon: Users, description: 'Parent information' },
  { id: 6, title: 'Address Details', icon: MapPin, description: 'Complete address information' },
  { id: 7, title: 'Additional Info', icon: CheckCircle2, description: 'Extra information fields' },
]

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [dataLoaded, setDataLoaded] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(1)

  // Additional fields state
  const [additionalFields, setAdditionalFields] = useState<AdditionalFieldValue[]>([])
  // keyed by field_key (string) for easy inclusion in PUT body
  const [additionalValues, setAdditionalValues] = useState<Record<string, string>>({})

  // Address dropdown states
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([])
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ code: string; name: string }[]>([])
  const [barangays, setBarangays] = useState<{ code: string; name: string }[]>([])
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  const totalBatches = 7

  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions()
    fetchAdditionalFields()
  }, [])

  const fetchAdditionalFields = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/employee-additional-fields`, {
        headers: { 'Accept': 'application/json' },
      })
      const data = await res.json()
      if (data.success) {
        setAdditionalFields(data.data.map((f: any) => ({
          field_id:    f.id,
          field_label: f.field_label,
          field_key:   f.field_key,
          field_type:  f.field_type  ?? 'text',
          field_unit:  f.field_unit  ?? null,
          value:       null,
        })))
      }
    } catch (err) {
      console.error('Error fetching additional fields:', err)
    }
  }

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

      console.log(`Fetched ${regionsList.length} regions`)
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

      console.log(`Fetched ${provincesList.length} provinces for region ${regionCode}`)
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

      console.log(`Fetched ${allCities.length} cities/municipalities for province ${provinceCode}`)
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

      console.log(`Fetched ${barangaysList.length} barangays for city ${cityCode}`)
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

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const email = localStorage.getItem('employee_email')
      const token = localStorage.getItem('employee_token')
      const cachedData = localStorage.getItem('employee_data')

      if (!email || !token) {
        router.push('/employee/login')
        return
      }

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

          // Fetch additional values for this employee
          try {
            const addlRes = await fetch(`${getApiUrl()}/api/employees/${data.data.id}/additional-values`, {
              headers: { 'Accept': 'application/json' },
            })
            const addlData = await addlRes.json()
            if (addlData.success) {
              const valMap: Record<string, string> = {}
              addlData.data.forEach((item: AdditionalFieldValue) => {
                valMap[item.field_key] = item.value || ''
              })
              setAdditionalValues(valMap)
              // Also update additionalFields with values
              setAdditionalFields(addlData.data)
            }
          } catch (err) {
            console.error('Error fetching additional values:', err)
          }

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
    setSaving(true)

    try {
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value
        return acc
      }, {} as any)

      // Merge additional field values directly into the PUT body
      // since they are now real columns on the employees table
      additionalFields.forEach(f => {
        cleanedData[f.field_key] = additionalValues[f.field_key] ?? null
      })

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
        localStorage.setItem('employee_data', JSON.stringify(data.data))
        // Refresh additional values from the updated employee data
        const valMap: Record<string, string> = {}
        additionalFields.forEach(f => {
          valMap[f.field_key] = data.data[f.field_key] || ''
        })
        setAdditionalValues(valMap)
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

  // Calculate overall progress
  const calculateOverallProgress = () => {
    const allFields: (keyof Employee)[] = [
      'position', 'date_hired',
      'last_name', 'first_name', 'birthday', 'birthplace', 'civil_status', 'gender',
      'mobile_number', 'street',
      'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number',
      'mlast_name', 'mfirst_name', 'flast_name', 'ffirst_name',
      'region', 'province', 'city_municipality', 'barangay', 'zip_code', 'email_address'
    ]

    const filledFields = allFields.filter(field => {
      const value = formData[field]
      return value !== null && value !== undefined && value !== ''
    }).length

    return Math.round((filledFields / allFields.length) * 100)
  }

  const overallProgress = calculateOverallProgress()

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600 mx-auto"></div>
              <p className="text-slate-600 font-medium">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-slate-600 mb-4">Profile not found</p>
              <Button onClick={() => router.push('/employee/login')} className="bg-gradient-to-r from-maroon-600 to-maroon-700">
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
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Link href="/employee/change_password">
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
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
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
            </>
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
                    <Briefcase className="h-5 w-5 text-maroon-600" />
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
                    <User className="h-5 w-5 text-maroon-600" />
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
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-maroon-600 h-full rounded-full" style={{ width: `${overallProgress}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-maroon-600">{overallProgress}%</span>
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
                    <Phone className="h-5 w-5 text-maroon-600" />
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
                    <CreditCard className="h-5 w-5 text-maroon-600" />
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
                    <Users className="h-5 w-5 text-maroon-600" />
                    <CardTitle className="text-lg">Family Background</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mother's Details</h4>
                    <p className="text-slate-900 font-medium">
                      {[employee.mfirst_name, employee.mmiddle_name, employee.mlast_name, employee.msuffix].filter(Boolean).join(' ') || '---'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Father's Details</h4>
                    <p className="text-slate-900 font-medium">
                      {[employee.ffirst_name, employee.fmiddle_name, employee.flast_name, employee.fsuffix].filter(Boolean).join(' ') || '---'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              {additionalFields.length > 0 && (
                <Card className="border-slate-200 shadow-sm overflow-hidden md:col-span-2">
                  <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-maroon-600" />
                      <CardTitle className="text-lg">Additional Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {additionalFields.map((field) => (
                      <div key={field.field_key}>
                        <p className="text-sm text-slate-500 uppercase font-semibold">{field.field_label}</p>
                        <p className="text-slate-900 font-medium">
                          {field.value
                            ? `${field.value}${field.field_unit ? ' ' + field.field_unit : ''}`
                            : '---'}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
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
                    <p className="text-rose-100 text-sm mt-1">Batch {currentBatch} of {totalBatches}: {currentBatchInfo.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-white">{overallProgress}%</div>
                    <p className="text-rose-200 text-xs">Profile Completion</p>
                  </div>
                </div>

                {/* Horizontal Stepper with Progress Bar */}
                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                    <div
                      className="bg-gradient-to-r from-rose-300 to-white h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>

                  {/* Steps with Labels */}
                  <div className="flex justify-between items-start mt-4">
                    {batches.map((batch, index) => {
                      const BatchIcon = batch.icon
                      const isActive = currentBatch === batch.id
                      const isCompleted = batch.id < currentBatch

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
                                ? 'bg-white text-maroon-700 scale-110 shadow-lg'
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
            <Card className="shadow-xl border-maroon-100">
              <CardHeader className="bg-gradient-to-br from-[#6B1C23] via-[#7B2431] to-[#8B2C3F] text-white rounded-t-xl py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">Batch {currentBatch}: {currentBatchInfo.title}</CardTitle>
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
                        className="flex h-12 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-base focus-visible:ring-2 focus-visible:ring-maroon-500 transition-all"
                      >
                        <option value="">Select Position...</option>
                        <option value="Accounting Assistant">Accounting Assistant</option>
                        <option value="Accounting Supervisor">Accounting Supervisor</option>
                        <option value="Admin Assistant">Admin Assistant</option>
                        <option value="Admin Head">Admin Head</option>
                        <option value="Assistant Studio Manager">Assistant Studio Manager</option>
                        <option value="Executive Assistant">Executive Assistant</option>
                        <option value="IT Supervisor">IT Supervisor</option>
                        <option value="Junior IT Manager">Junior IT Manager</option>
                        <option value="Junior Web Developer">Junior Web Developer</option>
                        <option value="Marketing Staff">Marketing Staff</option>
                        <option value="Multimedia Manager">Multimedia Manager</option>
                        <option value="Property Specialist">Property Specialist</option>
                        <option value="Sales Supervisor">Sales Supervisor</option>
                        <option value="Senior IT Manager">Senior IT Manager</option>
                        <option value="Senior Property Specialist">Senior Property Specialist</option>
                        <option value="Senior Web Developer">Senior Web Developer</option>
                        <option value="Studio Manager">Studio Manager</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="date_hired" className="text-base font-semibold text-slate-800">
                        Date Hired <span className="text-red-500">*</span>
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
                      <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-rose-500 rounded-full"></div>Mother's Maiden Name</h4>
                      <div className="space-y-4">
                        <Input placeholder="Last Name *" name="mlast_name" value={formData.mlast_name || ''} onChange={handleChange} />
                        <Input placeholder="First Name *" name="mfirst_name" value={formData.mfirst_name || ''} onChange={handleChange} />
                        <Input placeholder="Middle Name" name="mmiddle_name" value={formData.mmiddle_name || ''} onChange={handleChange} />
                        <Input placeholder="Suffix" name="msuffix" value={formData.msuffix || ''} onChange={handleChange} />
                      </div>
                    </Card>
                    <Card className="border-slate-100 bg-slate-50/30 p-4">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-slate-500 rounded-full"></div>Father's Name (Optional)</h4>
                      <div className="space-y-4">
                        <Input placeholder="Last Name" name="flast_name" value={formData.flast_name || ''} onChange={handleChange} />
                        <Input placeholder="First Name" name="ffirst_name" value={formData.ffirst_name || ''} onChange={handleChange} />
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
                      <Input id="email_address" type="email" name="email_address" value={formData.email_address || ''} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {/* BATCH 7: Additional Information */}
                {currentBatch === 7 && (
                  <div className="space-y-6">
                    {additionalFields.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">No additional fields configured</p>
                        <p className="text-sm">An administrator can add custom fields from the Employee Masterfile page.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {additionalFields.map((field) => (
                          <div key={field.field_key} className="space-y-2">
                            <Label className="text-sm font-semibold">
                              {field.field_label}
                              {field.field_unit && (
                                <span className="ml-1 text-xs font-normal text-slate-400">({field.field_unit})</span>
                              )}
                            </Label>

                            {/* Render the correct input based on field_type */}
                            {field.field_type === 'textarea' ? (
                              <textarea
                                value={additionalValues[field.field_key] ?? ''}
                                onChange={(e) =>
                                  setAdditionalValues((prev) => ({
                                    ...prev,
                                    [field.field_key]: e.target.value,
                                  }))
                                }
                                placeholder={`Enter ${field.field_label}...`}
                                rows={3}
                                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent resize-y min-h-[80px]"
                              />
                            ) : field.field_type === 'number' ? (
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="number"
                                  value={additionalValues[field.field_key] ?? ''}
                                  onChange={(e) =>
                                    setAdditionalValues((prev) => ({
                                      ...prev,
                                      [field.field_key]: e.target.value,
                                    }))
                                  }
                                  placeholder="0"
                                  className="flex-1"
                                />
                                {field.field_unit && (
                                  <span className="text-sm text-slate-500 font-semibold whitespace-nowrap bg-slate-100 px-3 py-2 rounded-md border border-slate-200">
                                    {field.field_unit}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Input
                                type={field.field_type === 'date' ? 'date'
                                  : field.field_type === 'time' ? 'time'
                                  : field.field_type === 'email' ? 'email'
                                  : field.field_type === 'url' ? 'url'
                                  : 'text'}
                                value={additionalValues[field.field_key] ?? ''}
                                onChange={(e) =>
                                  setAdditionalValues((prev) => ({
                                    ...prev,
                                    [field.field_key]: e.target.value,
                                  }))
                                }
                                placeholder={`Enter ${field.field_label}...`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                      <div key={b.id} className={`h-1.5 w-6 rounded-full transition-all ${currentBatch === b.id ? 'bg-maroon-600 w-10' : 'bg-slate-200'}`} />
                    ))}
                  </div>

                  <Button
                    onClick={nextBatch}
                    disabled={currentBatch === totalBatches}
                    className="bg-maroon-600 hover:bg-maroon-700 text-white"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
