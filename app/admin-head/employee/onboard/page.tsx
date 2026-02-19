"use client"

import React, { useEffect, useState, Suspense, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Briefcase,
  User,
  Phone,
  CreditCard,
  Users,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save as LucideSave,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  AlertCircle,
  ClipboardList,
  Save,
  Check,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface EmployeeDetails {
  [key: string]: any
}

interface Position {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <OnboardPageContent />
    </Suspense>
  )
}

function OnboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const employeeIdParam = searchParams.get('id')
  const [view, setView] = useState<'onboard' | 'checklist' | 'update-info'>('onboard')

  // Form States
  const [onboardFormData, setOnboardFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    position: '',
    onboarding_date: '',
    department: '',
  })
  const [currentBatch, setCurrentBatch] = useState(1)
  const [onboardingEmployeeId, setOnboardingEmployeeId] = useState<number | null>(null)
  const [progressionFormData, setProgressionFormData] = useState<Partial<EmployeeDetails>>({})

  // Checklist States
  const [checklistData, setChecklistData] = useState<{
    name: string,
    position: string,
    department: string,
    date: string,
    raw_date: string
  } | null>(null)
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: string }>({})


  // Dropdown Data
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([])
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ code: string; name: string }[]>([])
  const [barangays, setBarangays] = useState<{ code: string; name: string }[]>([])

  // UI States
  const [isSaving, setIsSaving] = useState(false)
  const [inlineManagerType, setInlineManagerType] = useState<'position' | 'department' | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant: "default" | "destructive" | "success" | "warning"
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default'
  })

  const batches = [
    { id: 1, title: 'Employee Details', icon: Briefcase, description: 'Basic employment information' },
    { id: 2, title: 'Personal Information', icon: User, description: 'Your personal details' },
    { id: 3, title: 'Contact Information', icon: Phone, description: 'How to reach you' },
    { id: 4, title: 'Government IDs', icon: CreditCard, description: 'Official identification numbers' },
    { id: 5, title: 'Family Information', icon: Users, description: 'Parent information' },
    { id: 6, title: 'Address Details', icon: MapPin, description: 'Complete address information' },
  ]

  const onboardingTasks = [
    "Signing of Job Offer",
    "Signing of Employment Contract",
    "Information Fill-Up for ID and Employee Record",
    "Provide Link to Employee Handbook",
    "Conduct Onboarding Presentation",
    "Introduce to Departments and Key Team Members",
    "Distribute Polo Shirt, ID Lace & keys",
    "Add Employee to Biometrics",
    "Create Company Accounts (Email and Telegram - Required)",
    "Create Optional Accounts (Viber, WhatsApp, WeChat - Sales/Marketing only)",
    "Set Up Email Signature",
    "Add New Employee to Official Group Chats",
    "Add New Employee to Masterfile Google Sheet",
    "Add New Employee to Tardiness & Leave Monitoring Google Sheet",
    "Prepare Requirement Checklist (Medical Certificate, Diploma, TOR, Birth Certificate, PhilHealth, Pag-IBIG, SSS)",
    "Collect and Verify Employee Requirements"
  ]

  const completionPercentage = useMemo(() => {
    if (!onboardingTasks.length) return 0
    return Math.round((Object.keys(completedTasks).length / onboardingTasks.length) * 100)
  }, [completedTasks, onboardingTasks])

  const completionDateText = useMemo(() => {
    const dates = Object.values(completedTasks)
    if (dates.length === 0) return ''
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
  }, [completedTasks])

  // Persistence Logic
  useEffect(() => {
    const savedState = localStorage.getItem('employee_onboarding_state')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (parsed.view) setView(parsed.view)
        if (parsed.currentBatch) setCurrentBatch(parsed.currentBatch)
        if (parsed.progressionFormData) setProgressionFormData(parsed.progressionFormData)
        if (parsed.onboardingEmployeeId) setOnboardingEmployeeId(parsed.onboardingEmployeeId)
        if (parsed.checklistData) setChecklistData(parsed.checklistData)
        if (parsed.completedTasks) setCompletedTasks(parsed.completedTasks)
      } catch (e) {
        console.error('Failed to restore state', e)
        localStorage.removeItem('employee_onboarding_state')
      }
    }
    fetchPositions()
    fetchDepartments()
    fetchRegions()

    // Load employee if ID is provided in URL
    if (employeeIdParam) {
      loadExistingEmployee(parseInt(employeeIdParam))
    }
  }, [employeeIdParam])

  const loadExistingEmployee = async (id: number) => {
    try {
      setIsActionLoading(true)
      const response = await fetch(`${getApiUrl()}/api/employees/${id}`)
      const data = await response.json()
      
      if (data.success) {
        const emp = data.data
        setOnboardingEmployeeId(id)
        setProgressionFormData(emp)
        setChecklistData({
          name: `${emp.first_name} ${emp.last_name}`,
          position: emp.position || '',
          department: emp.department || '',
          date: emp.date_hired ? new Date(emp.date_hired).toLocaleDateString() : '',
          raw_date: emp.date_hired || ''
        })
        setView('update-info')
      } else {
        toast.error('Employee not found')
      }
    } catch (error) {
      console.error('Error loading employee:', error)
      toast.error('Failed to load employee details')
    } finally {
      setIsActionLoading(false)
    }
  }

  useEffect(() => {
    if (view !== 'onboard' || Object.values(onboardFormData).some(v => v)) {
      localStorage.setItem('employee_onboarding_state', JSON.stringify({
        view,
        currentBatch,
        progressionFormData,
        onboardingEmployeeId,
        checklistData,
        completedTasks
      }))
    }
  }, [view, currentBatch, progressionFormData, onboardingEmployeeId, checklistData, completedTasks, onboardFormData])

  const clearStorage = () => {
    localStorage.removeItem('employee_onboarding_state')
  }

  // Fetch Functions
  const fetchPositions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/positions`)
      const data = await response.json()
      if (data.success) {
        setPositions([...data.data].sort((a: Position, b: Position) => a.name.localeCompare(b.name)))
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/departments`)
      const data = await response.json()
      if (data.success) {
        setDepartments([...data.data].sort((a: Department, b: Department) => a.name.localeCompare(b.name)))
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchRegions = async () => {
    setLoadingRegions(true)
    try {
      const response = await fetch('https://psgc.gitlab.io/api/regions/')
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      const regionsArray = Array.isArray(data) ? data : data.data || []
      setRegions(regionsArray.map((region: any) => ({ code: region.code, name: region.name })))
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
      const data = await response.json()
      const provincesArray = Array.isArray(data) ? data : data.data || []
      setProvinces(provincesArray.map((province: any) => ({ code: province.code, name: province.name })))
      setCities([])
      setBarangays([])
      if (!preserveValues) {
        setProgressionFormData((prev) => ({ ...prev, province: '', city_municipality: '', barangay: '' }))
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
        setProgressionFormData((prev) => ({ ...prev, city_municipality: '', barangay: '' }))
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
      const data = await response.json()
      const barangaysArray = Array.isArray(data) ? data : data.data || []
      setBarangays(barangaysArray.map((barangay: any) => ({ code: barangay.code, name: barangay.name })))
      if (!preserveValues) {
        setProgressionFormData((prev) => ({ ...prev, barangay: '' }))
      }
    } catch (error) {
      console.error('Error fetching barangays:', error)
      setBarangays([])
    } finally {
      setLoadingBarangays(false)
    }
  }

  // Handlers
  const handleAddItem = async () => {
    if (!newItemName.trim() || !inlineManagerType) return

    setIsActionLoading(true)
    try {
      const endpoint = inlineManagerType === 'position' ? 'positions' : 'departments'
      const response = await fetch(`${getApiUrl()}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim() }),
      })

      const data = await response.json()
      if (data.success) {
        if (inlineManagerType === 'position') {
          await fetchPositions()
        } else {
          await fetchDepartments()
        }
        setNewItemName('')
        toast.success(`${inlineManagerType === 'position' ? 'Position' : 'Department'} added successfully`)
      } else {
        toast.error(data.message || 'Error adding item')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!inlineManagerType) return

    setConfirmModal({
      isOpen: true,
      title: `Delete ${inlineManagerType === 'position' ? 'Position' : 'Department'}`,
      description: `Are you sure you want to delete this ${inlineManagerType}? This action cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        setIsActionLoading(true)
        try {
          const endpoint = inlineManagerType === 'position' ? 'positions' : 'departments'
          const response = await fetch(`${getApiUrl()}/api/${endpoint}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })

          const data = await response.json()
          if (data.success) {
            if (inlineManagerType === 'position') {
              await fetchPositions()
              if (onboardFormData.position === data.name) setOnboardFormData(prev => ({ ...prev, position: '' }))
            } else {
              await fetchDepartments()
              if (onboardFormData.department === data.name) setOnboardFormData(prev => ({ ...prev, department: '' }))
            }
            toast.success(`${inlineManagerType === 'position' ? 'Position' : 'Department'} deleted successfully`)
          } else {
            toast.error(data.message || 'Error deleting item')
          }
        } catch (error) {
          console.error('Error deleting item:', error)
          toast.error('Failed to delete item')
        } finally {
          setIsActionLoading(false)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const handleStartOnboarding = async () => {
    const { first_name, last_name, email, position, onboarding_date, department } = onboardFormData
    if (!first_name || !last_name || !email || !position || !onboarding_date || !department) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSaving(true)
    try {
      // Step 1: Create Employee
      const empResponse = await fetch(`${getApiUrl()}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, email }),
      })

      const empData = await empResponse.json()
      if (!empResponse.ok || !empData.success) {
        // Parse validation errors if present
        if (empData.errors) {
          const errorMessages = Object.values(empData.errors).flat().join(' ')
          throw new Error(errorMessages || empData.message)
        }
        throw new Error(empData.message || 'Failed to create employee')
      }

      const employeeId = empData.data.id

      // Step 2: Save Onboarding Data
      const onboardResponse = await fetch(`${getApiUrl()}/api/employees/${employeeId}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, department, onboarding_date }),
      })

      const onboardData = await onboardResponse.json()
      if (onboardData.success) {
        toast.success('Employee created and onboarding started')
        setOnboardingEmployeeId(employeeId)
        setProgressionFormData({
          first_name,
          last_name,
          position,
          department,
          date_hired: onboarding_date,
        })
        setChecklistData({
          name: `${first_name} ${last_name}`,
          position: position,
          department: department,
          date: new Date(onboarding_date).toLocaleDateString(),
          raw_date: onboarding_date
        })
        setCompletedTasks({})
        setView('checklist')
        setOnboardFormData({
          first_name: '',
          last_name: '',
          email: '',
          position: '',
          onboarding_date: '',
          department: '',
        })
      } else {
        // Parse validation errors if present
        if (onboardData.errors) {
          const errorMessages = Object.values(onboardData.errors).flat().join(' ')
          toast.error(errorMessages || onboardData.message)
        } else {
          toast.error(onboardData.message || 'Error saving onboarding data')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Could not connect to server. Please ensure the backend is running.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveChecklist = async () => {
    if (!checklistData) return

    setIsSaving(true)
    try {
      const allTasks = onboardingTasks.map(taskName => ({
        task: taskName,
        status: completedTasks[taskName] ? 'DONE' : 'PENDING',
        date: completedTasks[taskName] || null
      }))

      const response = await fetch(`${getApiUrl()}/api/onboarding-checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: checklistData.name,
          position: checklistData.position,
          department: checklistData.department,
          startDate: checklistData.raw_date,
          status: completionPercentage === 100 ? 'DONE' : 'PENDING',
          tasks: allTasks
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Checklist progress saved successfully')
        clearStorage()
        router.push(`/admin-head/forms/onboarding?name=${encodeURIComponent(checklistData.name)}`)
      } else {
        toast.error(data.message || 'Error saving checklist')
      }
    } catch (error) {
      console.error('Error saving checklist:', error)
      toast.error('Failed to save checklist')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTask = (task: string) => {
    setCompletedTasks(prev => {
      const newTasks = { ...prev }
      if (newTasks[task]) {
        delete newTasks[task]
      } else {
        newTasks[task] = new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        })
      }
      return newTasks
    })
  }

  const toggleAllTasks = () => {
    const allCompleted = onboardingTasks.every(task => completedTasks[task])
    if (allCompleted) {
      setCompletedTasks({})
    } else {
      const newTasks: {[key: string]: string} = {}
      const now = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      })
      onboardingTasks.forEach(task => {
        newTasks[task] = now
      })
      setCompletedTasks(newTasks)
    }
  }

  const handleProgressionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProgressionFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'region') {
      const selectedRegion = regions.find(r => r.name === value)
      if (selectedRegion) fetchProvinces(selectedRegion.code)
    } else if (name === 'province') {
      const selectedProvince = provinces.find(p => p.name === value)
      if (selectedProvince) fetchCities(selectedProvince.code)
    } else if (name === 'city_municipality') {
      const selectedCity = cities.find(c => c.name === value)
      if (selectedCity) fetchBarangays(selectedCity.code)
    }
  }

  const calculateProgressionProgress = () => {
    const allFields = [
      'position', 'date_hired',
      'last_name', 'first_name', 'birthday', 'birthplace', 'civil_status', 'gender',
      'mobile_number', 'street',
      'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number',
      'mlast_name', 'mfirst_name', 'flast_name', 'ffirst_name',
      'region', 'province', 'city_municipality', 'barangay', 'zip_code', 'email_address'
    ]

    const filledFields = allFields.filter(field => {
      const value = progressionFormData[field]
      return value !== null && value !== undefined && value !== ''
    }).length

    return Math.round((filledFields / allFields.length) * 100)
  }

  const isCurrentBatchValid = () => {
    const data = progressionFormData
    switch (currentBatch) {
      case 1:
        return !!data.position && !!data.date_hired
      case 2:
        return !!data.last_name && !!data.first_name && !!data.birthday &&
          !!data.birthplace && !!data.gender && !!data.civil_status
      case 3:
        return !!data.mobile_number && !!data.street
      case 4:
        return true
      case 5:
        return !!data.mlast_name && !!data.mfirst_name
      case 6:
        return !!data.region && !!data.province && !!data.city_municipality &&
          !!data.barangay && !!data.zip_code && !!data.email_address
      default:
        return true
    }
  }

  const nextBatch = () => {
    if (isCurrentBatchValid() && currentBatch < 6) {
      setCurrentBatch(currentBatch + 1)
    } else if (!isCurrentBatchValid()) {
      toast.error('Please fill in all required fields to proceed.')
    }
  }

  const prevBatch = () => { if (currentBatch > 1) setCurrentBatch(currentBatch - 1) }

  const handleProgressionSave = async () => {
    setIsSaving(true)
    try {
      const cleanedData = Object.entries(progressionFormData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value
        return acc
      }, {} as any)

      const response = await fetch(`${getApiUrl()}/api/employees/${onboardingEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Employee record completed successfully!')
        clearStorage()
        router.push('/admin-head/employee/masterfile')
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePartialSave = async () => {
    if (!onboardingEmployeeId) return
    setIsSaving(true)
    try {
      const cleanedData = Object.entries(progressionFormData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value
        return acc
      }, {} as any)

      const response = await fetch(`${getApiUrl()}/api/employees/${onboardingEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Progress saved successfully')
        clearStorage()
        router.push('/admin-head/employee/masterfile')
      } else {
        toast.error(data.message || 'Failed to save progress')
      }
    } catch (error) {
      console.error('Error in partial save:', error)
      toast.error('Failed to save progress.')
    } finally {
      setIsSaving(false)
    }
  }



  const handleCancelOnboarding = () => {
    clearStorage()
    router.push('/admin-head/employee/masterfile')
  }

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch { return '' }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-12">
      {view === 'onboard' && (
        <div className="max-w-3xl mx-auto py-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleCancelOnboarding}
                className="hover:bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Masterfile
              </Button>
              <div className="h-6 w-[1px] bg-slate-200" />
              <h2 className="text-2xl font-bold text-[#4A081A]">Onboard New Employee</h2>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name <span className="text-red-500">*</span></label>
                <Input
                  value={onboardFormData.first_name}
                  onChange={(e) => setOnboardFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                <Input
                  value={onboardFormData.last_name}
                  onChange={(e) => setOnboardFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  value={onboardFormData.email}
                  onChange={(e) => setOnboardFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-700">Position <span className="text-red-500">*</span></label>
                  <button
                    onClick={() => setInlineManagerType(inlineManagerType === 'position' ? null : 'position')}
                    className={`text-xs flex items-center gap-1 font-bold transition-colors ${inlineManagerType === 'position' ? 'text-[#630C22]' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {inlineManagerType === 'position' ? 'CLOSE MANAGER' : 'MANAGE LIST'}
                    {inlineManagerType === 'position' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                <select
                  value={onboardFormData.position}
                  onChange={(e) => setOnboardFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full h-10 px-3 py-2 border border-slate-200 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#630C22] transition-all"
                >
                  <option value="">Select Position...</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.name}>{pos.name}</option>
                  ))}
                </select>

                {inlineManagerType === 'position' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2 shadow-inner">
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add new position..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="h-9 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      />
                      <Button size="sm" onClick={handleAddItem} disabled={isActionLoading || !newItemName.trim()} className="bg-[#630C22] h-9">
                        <PlusCircle size={16} />
                      </Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {positions.map(pos => (
                        <div key={pos.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded text-xs">
                          <span className="truncate max-w-[150px]">{pos.name}</span>
                          <button onClick={() => handleDeleteItem(pos.id)} className="text-rose-500 hover:text-rose-700 p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-700">Department <span className="text-red-500">*</span></label>
                  <button
                    onClick={() => setInlineManagerType(inlineManagerType === 'department' ? null : 'department')}
                    className={`text-xs flex items-center gap-1 font-bold transition-colors ${inlineManagerType === 'department' ? 'text-[#630C22]' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {inlineManagerType === 'department' ? 'CLOSE MANAGER' : 'MANAGE LIST'}
                    {inlineManagerType === 'department' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                <select
                  value={onboardFormData.department}
                  onChange={(e) => setOnboardFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full h-10 px-3 py-2 border border-slate-200 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#630C22] transition-all"
                >
                  <option value="">Select Department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>

                {inlineManagerType === 'department' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2 shadow-inner">
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add new department..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="h-9 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      />
                      <Button size="sm" onClick={handleAddItem} disabled={isActionLoading || !newItemName.trim()} className="bg-[#630C22] h-9">
                        <PlusCircle size={16} />
                      </Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {departments.map(dept => (
                        <div key={dept.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded text-xs">
                          <span className="truncate max-w-[150px]">{dept.name}</span>
                          <button onClick={() => handleDeleteItem(dept.id)} className="text-rose-500 hover:text-rose-700 p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Onboarding Date <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={onboardFormData.onboarding_date}
                  onChange={(e) => setOnboardFormData(prev => ({ ...prev, onboarding_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <Button
                onClick={handleStartOnboarding}
                disabled={isSaving}
                className="flex-1 bg-[#630C22] hover:bg-[#4A081A] text-white font-bold h-12 rounded-xl transition-all shadow-md"
              >
                {isSaving ? 'SAVING...' : 'START ONBOARDING'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelOnboarding}
                disabled={isSaving}
                className="flex-1 border-slate-200 text-slate-600 font-bold h-12 rounded-xl"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === 'checklist' && checklistData && (
        <div className="max-w-[1600px] mx-auto py-4 px-6 md:px-8">
          {/* ----- INTEGRATED PREMIUM HEADER ----- */}
          <header className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md p-4 md:p-6 mb-8 relative overflow-hidden">
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-6 lg:gap-8 relative z-10">
              {/* Title Section */}
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-none mb-1">Onboarding Process</h1>
                <div className="flex items-center gap-1.5 text-white/60">
                  <ClipboardList className="w-3.5 h-3.5" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">ABIC REALTY & CONSULTANCY</p>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden lg:block" />

              {/* Employee Info Cards (Integrated) */}
              <div className="flex flex-wrap items-center gap-6 flex-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Employee</span>
                  <span className="text-sm font-bold text-white leading-none">{checklistData.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Position</span>
                  <span className="text-sm font-bold text-white leading-none">{checklistData.position}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Department</span>
                  <span className="text-sm font-bold text-white leading-none">{checklistData.department}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Start Date</span>
                  <span className="text-sm font-bold text-white leading-none">{checklistData.date}</span>
                </div>

                {/* Progress Stats */}
                <div className="ml-auto hidden xl:flex items-center gap-4 bg-white/5 px-6 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Overall Progress</span>
                    <span className="text-base font-black text-white">{completionPercentage}%</span>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Last Updated</span>
                    <span className="text-base font-black text-white tracking-tight">{completionDateText || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Aesthetic Background Pattern */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ClipboardList className="w-32 h-32" />
            </div>
          </header>

          {/* Task List Section */}
          <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-2xl bg-white overflow-hidden mb-12">
            {/* Progress Banner */}
            <div className="bg-[#FFE5EC]/20 p-4 md:px-8 border-b border-[#FFE5EC]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[11px] font-black text-[#800020] uppercase tracking-widest">Process Onboarding Progress</h3>
                <span className="text-sm font-black text-[#A4163A] bg-white px-3 py-0.5 rounded-full shadow-sm border border-[#FFE5EC]">
                  {Object.keys(completedTasks).length} / {onboardingTasks.length} Completed
                </span>
              </div>
              <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#FFE5EC] shadow-inner p-0.5">
                <div
                  className="bg-gradient-to-r from-[#A4163A] to-[#630C22] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${(Object.keys(completedTasks).length / onboardingTasks.length) * 100}%` }}
                />
              </div>
            </div>

            <Table>
              <TableHeader className="bg-[#FFE5EC]/40">
                <TableRow className="border-b border-[#FFE5EC] hover:bg-transparent">
                  <TableHead className="w-[200px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">Completed Date</TableHead>
                  <TableHead className="w-[100px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">Status</TableHead>
                  <TableHead className="font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">
                    <div className="flex items-center justify-between">
                      <span>Tasks</span>
                      <button 
                        onClick={toggleAllTasks}
                        className="text-[8px] normal-case bg-white/50 hover:bg-rose-50 text-[#800020] px-2 py-1 rounded-md border border-[#FFE5EC] transition-all font-black shadow-sm"
                      >
                        {onboardingTasks.every(task => completedTasks[task]) ? 'UNCHECK ALL' : 'CHECK ALL'}
                      </button>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboardingTasks.map((task, index) => (
                  <TableRow 
                    key={index} 
                    className="border-b border-rose-50/30 last:border-0 hover:bg-[#FFE5EC]/5 transition-colors group cursor-pointer"
                    onClick={() => toggleTask(task)}
                  >
                    <TableCell className="text-center py-2.5 font-mono text-[10px] font-bold text-slate-400">
                      {completedTasks[task] || '-'}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex justify-center">
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center transition-all border-2",
                          completedTasks[task]
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                            : "border-slate-200 bg-white hover:border-[#A4163A]"
                        )}>
                          {completedTasks[task] && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className={cn(
                        "text-sm font-bold transition-all duration-300",
                        completedTasks[task] ? "text-slate-300 line-through" : "text-slate-700"
                      )}>
                        {task}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Table Footer */}
            <div className="p-4 md:px-8 bg-slate-50/50 border-t border-[#FFE5EC] flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                  ADMINISTRATION FRAMEWORK • ABIC HR
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setView('update-info')}
                  disabled={Object.keys(completedTasks).length < onboardingTasks.length}
                  className="h-9 px-8 font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 transition-all rounded-xl disabled:opacity-50"
                >
                  PROCEED TO DATA ENTRY
                </Button>
                <Button 
                  onClick={handleSaveChecklist} 
                  disabled={isSaving}
                  className="h-9 px-8 font-black text-xs uppercase tracking-widest bg-[#A4163A] hover:bg-[#800020] text-white shadow-lg active:scale-95 transition-all rounded-xl"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                  {isSaving ? 'SAVING...' : 'SAVE PROGRESS'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {view === 'update-info' && (
        <div className="max-w-7xl mx-auto py-8">
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Horizontal Stepper Progress Card */}
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-[#6B1C23] via-[#7B2431] to-[#8B2C3F] px-6 py-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Employee Data Entry</h2>
                    <p className="text-rose-100 text-sm mt-1">Batch {currentBatch} of 7: {batches[currentBatch - 1].title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-white">{calculateProgressionProgress()}%</div>
                    <p className="text-rose-200 text-xs">Profile Completion</p>
                  </div>
                </div>

                {/* Horizontal Stepper with Progress Bar */}
                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                    <div
                      className="bg-gradient-to-r from-rose-300 to-white h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${calculateProgressionProgress()}%` }}
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
                          className={`flex flex-col items-center group ${batch.id <= currentBatch || isCurrentBatchValid() ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                          style={{ width: `${100 / batches.length}%` }}
                          onClick={() => {
                            if (batch.id < currentBatch) {
                              setCurrentBatch(batch.id)
                            } else if (batch.id === currentBatch + 1 && isCurrentBatchValid()) {
                              setCurrentBatch(batch.id)
                            }
                          }}
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
                    {React.createElement(batches[currentBatch - 1].icon, { className: "h-5 w-5" })}
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">Batch {currentBatch}: {batches[currentBatch - 1].title}</CardTitle>
                    <CardDescription className="text-white/80 text-xs font-medium">{batches[currentBatch - 1].description}</CardDescription>
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
                        value={progressionFormData.position || ''}
                        onChange={handleProgressionChange}
                        className="flex h-12 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-base focus-visible:ring-2 focus-visible:ring-maroon-500 transition-all font-medium"
                      >
                        <option value="">Select Position...</option>
                        {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
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
                        value={formatDateForInput(progressionFormData.date_hired)}
                        onChange={handleProgressionChange}
                        className="h-12 text-base border-2 border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* BATCH 2: Personal Information */}
                {currentBatch === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-semibold">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="last_name" name="last_name" value={progressionFormData.last_name || ''} onChange={handleProgressionChange} placeholder="e.g., Dela Cruz" className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-semibold">First Name <span className="text-red-500">*</span></Label>
                      <Input id="first_name" name="first_name" value={progressionFormData.first_name || ''} onChange={handleProgressionChange} placeholder="e.g., Juan" className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middle_name" className="text-sm font-semibold">Middle Name</Label>
                      <Input id="middle_name" name="middle_name" value={progressionFormData.middle_name || ''} onChange={handleProgressionChange} placeholder="Optional" className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suffix" className="text-sm font-semibold">Suffix</Label>
                      <Input id="suffix" name="suffix" value={progressionFormData.suffix || ''} onChange={handleProgressionChange} placeholder="e.g., Jr." className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday" className="text-sm font-semibold">Birthday <span className="text-red-500">*</span></Label>
                      <Input id="birthday" type="date" name="birthday" value={formatDateForInput(progressionFormData.birthday)} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthplace" className="text-sm font-semibold">Birthplace <span className="text-red-500">*</span></Label>
                      <Input id="birthplace" name="birthplace" value={progressionFormData.birthplace || ''} onChange={handleProgressionChange} placeholder="e.g., Manila" className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-semibold">Gender <span className="text-red-500">*</span></Label>
                      <select id="gender" name="gender" value={progressionFormData.gender || ''} onChange={handleProgressionChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="civil_status" className="text-sm font-semibold">Civil Status <span className="text-red-500">*</span></Label>
                      <select id="civil_status" name="civil_status" value={progressionFormData.civil_status || ''} onChange={handleProgressionChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
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
                      <Input id="mobile_number" name="mobile_number" value={progressionFormData.mobile_number || ''} onChange={handleProgressionChange} placeholder="09XXXXXXXXX" className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="house_number" className="text-sm font-semibold">House number</Label>
                      <Input id="house_number" name="house_number" value={progressionFormData.house_number || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-sm font-semibold">Street <span className="text-red-500">*</span></Label>
                      <Input id="street" name="street" value={progressionFormData.street || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="village" className="text-sm font-semibold">Village</Label>
                      <Input id="village" name="village" value={progressionFormData.village || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="subdivision" className="text-sm font-semibold">Subdivision</Label>
                      <Input id="subdivision" name="subdivision" value={progressionFormData.subdivision || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                  </div>
                )}

                {/* BATCH 4: Government IDs */}
                {currentBatch === 4 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sss_number" className="text-sm font-semibold">SSS Number</Label>
                      <Input id="sss_number" name="sss_number" value={progressionFormData.sss_number || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="philhealth_number" className="text-sm font-semibold">PhilHealth Number</Label>
                      <Input id="philhealth_number" name="philhealth_number" value={progressionFormData.philhealth_number || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pagibig_number" className="text-sm font-semibold">Pag-IBIG Number</Label>
                      <Input id="pagibig_number" name="pagibig_number" value={progressionFormData.pagibig_number || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tin_number" className="text-sm font-semibold">TIN Number</Label>
                      <Input id="tin_number" name="tin_number" value={progressionFormData.tin_number || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                  </div>
                )}

                {/* BATCH 5: Family Information */}
                {currentBatch === 5 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-rose-100 bg-rose-50/30 p-4">
                      <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-rose-500 rounded-full"></div>Mother's Maiden Name</h4>
                      <div className="space-y-4">
                        <Input placeholder="Last Name *" name="mlast_name" value={progressionFormData.mlast_name || ''} onChange={handleProgressionChange} className="font-medium" />
                        <Input placeholder="First Name *" name="mfirst_name" value={progressionFormData.mfirst_name || ''} onChange={handleProgressionChange} className="font-medium" />
                        <Input placeholder="Middle Name" name="mmiddle_name" value={progressionFormData.mmiddle_name || ''} onChange={handleProgressionChange} className="font-medium" />
                        <Input placeholder="Suffix" name="msuffix" value={progressionFormData.msuffix || ''} onChange={handleProgressionChange} className="font-medium" />
                      </div>
                    </Card>
                    <Card className="border-slate-100 bg-slate-50/30 p-4">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-slate-500 rounded-full"></div>Father's Name (Optional)</h4>
                      <div className="space-y-4">
                        <Input placeholder="Last Name" name="flast_name" value={progressionFormData.flast_name || ''} onChange={handleProgressionChange} className="font-medium" />
                        <Input placeholder="First Name" name="ffirst_name" value={progressionFormData.ffirst_name || ''} onChange={handleProgressionChange} className="font-medium" />
                        <Input placeholder="Middle Name" name="fmiddle_name" value={progressionFormData.fmiddle_name || ''} onChange={handleProgressionChange} className="font-medium" />
                        <Input placeholder="Suffix" name="fsuffix" value={progressionFormData.fsuffix || ''} onChange={handleProgressionChange} className="font-medium" />
                      </div>
                    </Card>
                  </div>
                )}

                {/* BATCH 6: Address Details */}
                {currentBatch === 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-sm font-semibold">Region <span className="text-red-500">*</span></Label>
                      <select name="region" value={progressionFormData.region || ''} onChange={handleProgressionChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                        <option value="">Select Region...</option>
                        {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-sm font-semibold">Province <span className="text-red-500">*</span></Label>
                      <select name="province" value={progressionFormData.province || ''} onChange={handleProgressionChange} disabled={!progressionFormData.region} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                        <option value="">Select Province...</option>
                        {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city_municipality" className="text-sm font-semibold">City/Municipality <span className="text-red-500">*</span></Label>
                      <select name="city_municipality" value={progressionFormData.city_municipality || ''} onChange={handleProgressionChange} disabled={!progressionFormData.province} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                        <option value="">Select City...</option>
                        {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barangay" className="text-sm font-semibold">Barangay <span className="text-red-500">*</span></Label>
                      <select name="barangay" value={progressionFormData.barangay || ''} onChange={handleProgressionChange} disabled={!progressionFormData.city_municipality} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                        <option value="">Select Barangay...</option>
                        {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code" className="text-sm font-semibold">ZIP Code <span className="text-red-500">*</span></Label>
                      <Input id="zip_code" name="zip_code" value={progressionFormData.zip_code || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_address" className="text-sm font-semibold">Email Address <span className="text-red-500">*</span></Label>
                      <Input id="email_address" type="email" name="email_address" value={progressionFormData.email_address || ''} onChange={handleProgressionChange} className="font-medium" />
                    </div>
                  </div>
                )}
              </CardContent>

              <Separator />

              {/* Navigation Footer */}
              <CardContent className="py-6">
                <div className="flex justify-between items-center">
                  <Button
                    onClick={prevBatch}
                    disabled={currentBatch === 1}
                    variant="outline"
                    className="h-11 px-6 font-semibold"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {batches.map((b) => (
                      <div key={b.id} className={`h-1.5 w-6 rounded-full transition-all ${currentBatch === b.id ? 'bg-maroon-600 w-10' : 'bg-slate-200'}`} />
                    ))}
                  </div>

                  {currentBatch === 6 ? (
                    <div className="flex gap-3">
                      <Button
                        onClick={handlePartialSave}
                        disabled={isSaving}
                        variant="outline"
                        className="h-11 px-6 font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Progress'}
                        <LucideSave className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        onClick={handleProgressionSave}
                        disabled={isSaving || !isCurrentBatchValid()}
                        className="bg-green-600 hover:bg-green-700 text-white h-11 px-8 font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Complete & Finish'}
                        <LucideSave className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={handlePartialSave}
                        disabled={isSaving}
                        variant="outline"
                        className="h-11 px-6 font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Progress'}
                        <LucideSave className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        onClick={nextBatch}
                        disabled={!isCurrentBatchValid()}
                        className="bg-maroon-600 hover:bg-maroon-700 text-white h-11 px-8 font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Step
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        isLoading={isActionLoading}
      />
    </div>
  )
}