"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmployeeRegistrationForm } from '@/components/employee-registration-form'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  PlusCircle,
  Briefcase,
  User,
  Phone,
  CreditCard,
  Users,
  MapPin,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Save as LucideSave,
  X,
  Settings2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: 'pending' | 'employed' | 'terminated'
  created_at: string
}

interface EmployeeDetails extends Employee {
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

const statusBadgeColors = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  employed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels = {
  pending: 'Pending',
  employed: 'Employed',
  terminated: 'Terminated',
}


export default function MasterfilePage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [view, setView] = useState<'list' | 'onboard' | 'checklist' | 'update-info'>('list')
  const [activeTab, setActiveTab] = useState<'employed' | 'terminated'>('employed')
  const [completedTasks, setCompletedTasks] = useState<{[key: string]: string}>({})
  const [checklistData, setChecklistData] = useState<{
    name: string,
    position: string,
    department: string,
    date: string,
    raw_date: string
  } | null>(null)


  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [inlineManagerType, setInlineManagerType] = useState<'position' | 'department' | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [onboardFormData, setOnboardFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    position: '',
    onboarding_date: '',
    department: '',
  })

  // Progression Form States
  const [currentBatch, setCurrentBatch] = useState(1)
  const [onboardingEmployeeId, setOnboardingEmployeeId] = useState<number | null>(null)
  const [progressionFormData, setProgressionFormData] = useState<Partial<EmployeeDetails>>({})

  // Address dropdown states
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([])
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ code: string; name: string }[]>([])
  const [barangays, setBarangays] = useState<{ code: string; name: string }[]>([])

  // Persistence Logic
  useEffect(() => {
    const savedState = localStorage.getItem('employee_onboarding_state')
    if (savedState) {
      try {
        const { 
          view: savedView, 
          currentBatch: savedBatch, 
          progressionFormData: savedFormData, 
          onboardingEmployeeId: savedId,
          checklistData: savedChecklist
        } = JSON.parse(savedState)

        if (savedView) setView(savedView)
        if (savedBatch) setCurrentBatch(savedBatch)
        if (savedFormData) setProgressionFormData(savedFormData)
        if (savedId) setOnboardingEmployeeId(savedId)
        if (savedChecklist) setChecklistData(savedChecklist)
      } catch (e) {
        console.error('Failed to restore state', e)
      }
    }
  }, [])

  useEffect(() => {
    if (view !== 'list') {
      localStorage.setItem('employee_onboarding_state', JSON.stringify({
        view,
        currentBatch,
        progressionFormData,
        onboardingEmployeeId,
        checklistData
      }))
    }
  }, [view, currentBatch, progressionFormData, onboardingEmployeeId, checklistData])

  const clearStorage = () => {
    localStorage.removeItem('employee_onboarding_state')
  }
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  const batches = [
    { id: 1, title: 'Employee Details', icon: Briefcase, description: 'Basic employment information' },
    { id: 2, title: 'Personal Information', icon: User, description: 'Your personal details' },
    { id: 3, title: 'Contact Information', icon: Phone, description: 'How to reach you' },
    { id: 4, title: 'Government IDs', icon: CreditCard, description: 'Official identification numbers' },
    { id: 5, title: 'Family Information', icon: Users, description: 'Parent information' },
    { id: 6, title: 'Address Details', icon: MapPin, description: 'Complete address information' },
  ]

  useEffect(() => {
    fetchEmployees()
    fetchPositions()
    fetchDepartments()
    fetchRegions()
  }, [])

  // Persist state to localStorage
  useEffect(() => {
    const state = {
      view,
      currentBatch,
      onboardingEmployeeId,
      checklistData,
      completedTasks,
      progressionFormData,
      // We don't save ephemeral UI state like 'showDetailModal' or loading states
    }
    
    // Only save if we are in a state worth saving (not just viewing the list)
    if (view !== 'list') {
      localStorage.setItem('employee_entry_state', JSON.stringify(state))
    }
  }, [view, currentBatch, onboardingEmployeeId, checklistData, completedTasks, progressionFormData])

  // Restore state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('employee_entry_state')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Basic validation to ensure we don't restore invalid state
        if (parsed.view && parsed.view !== 'list') {
          setView(parsed.view)
          if (parsed.currentBatch) setCurrentBatch(parsed.currentBatch)
          if (parsed.onboardingEmployeeId) setOnboardingEmployeeId(parsed.onboardingEmployeeId)
          if (parsed.checklistData) setChecklistData(parsed.checklistData)
          if (parsed.completedTasks) setCompletedTasks(parsed.completedTasks)
          if (parsed.progressionFormData) setProgressionFormData(parsed.progressionFormData)
        }
      } catch (e) {
        console.error('Failed to restore state', e)
        localStorage.removeItem('employee_entry_state')
      }
    }
  }, [])

  const clearSavedState = () => {
    localStorage.removeItem('employee_entry_state')
  }



  const fetchRegions = async () => {
    setLoadingRegions(true)
    try {
      const response = await fetch('https://psgc.gitlab.io/api/regions/')
      if (!response.ok) throw new Error(`API error: ${response.status}`)
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
      if (!response.ok) throw new Error(`API error: ${response.status}`)
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
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      const barangaysArray = Array.isArray(data) ? data : data.data || []
      const barangaysList = barangaysArray.map((barangay: any) => ({
        code: barangay.code,
        name: barangay.name,
      }))
      setBarangays(barangaysList)
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
        setView('list')
        fetchEmployees()
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

  const nextBatch = () => { if (currentBatch < 6) setCurrentBatch(currentBatch + 1) }
  const prevBatch = () => { if (currentBatch > 1) setCurrentBatch(currentBatch - 1) }

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch { return '' }
  }

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
    if (!confirm(`Are you sure you want to delete this ${inlineManagerType}?`)) return

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
    }
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
        fetchEmployees()
      } else {
        toast.error('Error saving onboarding data: ' + onboardData.message)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelOnboarding = () => {
    setOnboardFormData({
      first_name: '',
      last_name: '',
      email: '',
      position: '',
      onboarding_date: '',
      department: '',
    })
    setView('list')
    clearStorage()
  }

  const fetchEmployees = async () => {
    try {
      const apiUrl = getApiUrl()
      const fullUrl = `${apiUrl}/api/employees`
      console.log('Fetching employees from:', fullUrl)
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        console.error(`API returned status ${response.status}: ${response.statusText}`)
        throw new Error(`HTTP Error: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setEmployees(data.data || [])
      } else {
        console.warn('API response not successful:', data)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching employees:', errorMessage)
      console.error('Full error:', error)
      
      // Show error to user for debugging
      alert(`Failed to load employees: ${errorMessage}\n\nMake sure the backend server is running on ${getApiUrl()}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      const apiUrl = getApiUrl()
      const fullUrl = `${apiUrl}/api/employees/${employeeId}`
      console.log('Fetching employee details from:', fullUrl)
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
      })
      
      if (!response.ok) {
        console.error(`API returned status ${response.status}: ${response.statusText}`)
        throw new Error(`HTTP Error: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setSelectedEmployee(data.data)
        setShowDetailModal(true)
      } else {
        console.warn('API response not successful:', data)
        alert('Failed to load employee details')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching employee details:', errorMessage)
      alert(`Failed to load employee details: ${errorMessage}`)
    }
  }

  const handleStatusUpdate = async (newStatus: 'pending' | 'employed' | 'terminated') => {
    if (!selectedEmployee) return

    setUpdatingStatus(true)
    try {
      const apiUrl = getApiUrl()
      const fullUrl = `${apiUrl}/api/employees/${selectedEmployee.id}`
      console.log('Updating employee status at:', fullUrl)
      
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        console.error(`API returned status ${response.status}: ${response.statusText}`)
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Update employee in list
        setEmployees(employees.map(emp =>
          emp.id === selectedEmployee.id ? { ...emp, status: newStatus } : emp
        ))
        // Update selected employee
        setSelectedEmployee({ ...selectedEmployee, status: newStatus })
        // Show success message
        alert(`Employee status updated to ${statusLabels[newStatus]}`)
      } else {
        console.warn('API response not successful:', data)
        alert('Failed to update status')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error updating status:', errorMessage)
      alert(`Failed to update status: ${errorMessage}`)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const isEmployeeComplete = (employee: EmployeeDetails): boolean => {
    // Check if all required fields are filled
    const requiredFields = [
      'first_name',
      'last_name',
      'email',
      'position',
      'date_hired',
      'birthday',
      'birthplace',
      'civil_status',
      'gender',
      'mobile_number',
      'street',
      'barangay',
      'region',
      'province',
      'city_municipality',
      'zip_code',
      'mlast_name',
      'mfirst_name',
    ]

    for (const field of requiredFields) {
      const value = employee[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return false
      }
    }
    return true
  }

  // Filter employees by search query
  const filterEmployees = (list: Employee[]) => {
    if (!searchQuery) return list
    const query = searchQuery.toLowerCase()
    return list.filter((emp) =>
      emp.first_name?.toLowerCase().includes(query) ||
      emp.last_name?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.position?.toLowerCase().includes(query)
    )
  }

  const employedList = filterEmployees(employees.filter(e => e.status === 'employed'))
  const terminatedList = filterEmployees(employees.filter(e => e.status === 'terminated'))
  const pendingList = filterEmployees(employees.filter(e => e.status === 'pending'))

  const EmployeeTable = ({ list, emptyMessage }: { list: Employee[], emptyMessage: string }) => (
    list.length === 0 ? (
      <p className="text-slate-500 py-4">{emptyMessage}</p>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-4 px-4 font-semibold text-[#4A081A] text-sm uppercase tracking-wider">Name</th>
              <th className="text-left py-4 px-4 font-semibold text-[#4A081A] text-sm uppercase tracking-wider">Email</th>
              <th className="text-left py-4 px-4 font-semibold text-[#4A081A] text-sm uppercase tracking-wider">Position</th>
              <th className="text-left py-4 px-4 font-semibold text-[#4A081A] text-sm uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-4 font-semibold text-[#4A081A] text-sm uppercase tracking-wider">Created</th>
              <th className="text-left py-4 px-4 font-semibold text-[#4A081A] text-sm uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50 transition-colors duration-200">
                <td className="py-4 px-4 text-slate-700 font-medium">{employee.first_name} {employee.last_name}</td>
                <td className="py-4 px-4 text-slate-700">{employee.email}</td>
                <td className="py-4 px-4 text-slate-700">{employee.position || '-'}</td>
                <td className="py-4 px-4">
                  <Badge className={`${statusBadgeColors[employee.status]} border shadow-none font-medium`}>
                    {statusLabels[employee.status]}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-slate-500 text-sm">
                  {new Date(employee.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-4">
                  <Button
                    size="sm"
                    className="bg-[#630C22] hover:bg-[#4A081A] text-white border-0 transition-all duration-300 rounded-md"
                    onClick={() => fetchEmployeeDetails(employee.id)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  )

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

  const toggleTask = (task: string) => {
    setCompletedTasks(prev => {
      const newTasks = { ...prev }
      if (newTasks[task]) {
        delete newTasks[task]
      } else {
        newTasks[task] = new Date().toLocaleString()
      }
      return newTasks
    })
  }

  const handleSaveChecklist = async () => {
    if (!checklistData) return

    setIsSaving(true)
    try {
      // Prepare all tasks for saving
      const allTasks = onboardingTasks.map(taskName => ({
        task: taskName,
        completed: !!completedTasks[taskName],
        completed_at: completedTasks[taskName] || null
      }))

      const response = await fetch(`${getApiUrl()}/api/onboarding-checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          employee_name: checklistData.name,
          position: checklistData.position,
          department: checklistData.department,
          start_date: checklistData.raw_date,
          status: `${Object.keys(completedTasks).length}/${onboardingTasks.length} Completed`,
          tasks: allTasks
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Checklist progress saved successfully to database')
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

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      {view === 'checklist' && checklistData ? (
        <div className="max-w-5xl mx-auto py-4">
          <div className="bg-[#D1D5DB] border-2 border-slate-400 overflow-hidden shadow-xl">
            {/* Main Header */}
            <div className="bg-[#D1D5DB] py-3 text-center border-b-2 border-slate-400">
              <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
                Employee Onboarding Process Checklist
              </h1>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 border-b-2 border-slate-400 text-sm">
              <div className="grid grid-cols-[140px_1fr] border-r-2 border-slate-400">
                <div className="bg-[#D1D5DB] p-2 font-bold border-r-2 border-slate-400">Employee Name:</div>
                <div className="bg-white p-2">{checklistData.name}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr]">
                <div className="bg-[#D1D5DB] p-2 font-bold border-r-2 border-slate-400">Start Date:</div>
                <div className="bg-white p-2">{checklistData.date}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b-2 border-slate-400 text-sm">
              <div className="grid grid-cols-[140px_1fr] border-r-2 border-slate-400">
                <div className="bg-[#D1D5DB] p-2 font-bold border-r-2 border-slate-400">Position:</div>
                <div className="bg-white p-2">{checklistData.position}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr]">
                <div className="bg-[#D1D5DB] p-2 font-bold border-r-2 border-slate-400">Department:</div>
                <div className="bg-white p-2">{checklistData.department}</div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white border-b-2 border-slate-400 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase">Onboarding Progress</span>
                <span className="text-xs font-bold text-[#630C22]">{Object.keys(completedTasks).length} / {onboardingTasks.length} Tasks Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                <div 
                  className="bg-[#630C22] h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,12,34,0.3)]"
                  style={{ width: `${(Object.keys(completedTasks).length / onboardingTasks.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Table Header Labels */}
            <div className="grid grid-cols-[200px_120px_1fr] text-center font-bold bg-[#D1D5DB] text-sm uppercase">
              <div className="py-2 border-r-2 border-b-2 border-slate-400">Completed Date</div>
              <div className="py-2 border-r-2 border-b-2 border-slate-400">Status</div>
              <div className="py-2 border-b-2 border-slate-400">Tasks</div>
            </div>

            {/* Task List */}
            <div className="bg-white">
              {onboardingTasks.map((task, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-[200px_120px_1fr] border-b-2 border-slate-400 group cursor-pointer hover:bg-emerald-50/30 transition-colors"
                  onClick={() => toggleTask(task)}
                >
                  <div className="py-2 px-4 flex items-center justify-center text-[10px] font-mono text-slate-500 bg-slate-50/50 border-r-2 border-slate-400">
                    {completedTasks[task] || '-'}
                  </div>
                  <div className="py-2 flex items-center justify-center border-r-2 border-slate-400 font-bold transition-all">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                      completedTasks[task] 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {completedTasks[task] && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  </div>
                  <div className={`py-2 px-4 flex items-center text-sm font-medium transition-all ${
                    completedTasks[task] ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}>
                    {task}
                  </div>
                </div>
              ))}
            </div>


            {/* Action Buttons Row */}
            <div className="grid grid-cols-[1fr_200px_150px] bg-white">
              <div className="border-r-2 border-slate-400"></div>
              <button 
                onClick={() => setView('update-info')}
                disabled={Object.keys(completedTasks).length < onboardingTasks.length}
                className="py-1 px-4 border-r-2 border-slate-400 bg-[#D1D5DB] hover:bg-slate-300 font-bold text-slate-800 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                PROCEED TO DATA ENTRY
              </button>
              <button 
                onClick={handleSaveChecklist}
                disabled={isSaving}
                className="py-1 px-4 bg-[#D1D5DB] hover:bg-slate-300 font-bold text-slate-800 text-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? 'SAVING...' : 'SAVE'}
              </button>
            </div>
          </div>
        </div>
      ) : view === 'update-info' ? (
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
                          className="flex flex-col items-center cursor-pointer group"
                          style={{ width: `${100 / batches.length}%` }}
                          onClick={() => setCurrentBatch(batch.id)}
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
                    {React.createElement(batches[currentBatch-1].icon, { className: "h-5 w-5" })}
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">Batch {currentBatch}: {batches[currentBatch-1].title}</CardTitle>
                    <CardDescription className="text-white/80 text-xs font-medium">{batches[currentBatch-1].description}</CardDescription>
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
                    <Button
                      onClick={() => {
                        handleProgressionSave()
                        clearStorage()
                      }}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white h-11 px-8 font-bold shadow-lg transition-all"
                    >
                      {isSaving ? 'Saving...' : 'Complete & Finish'}
                      <LucideSave className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={nextBatch}
                      className="bg-maroon-600 hover:bg-maroon-700 text-white h-11 px-8 font-bold shadow-md transition-all"
                    >
                      Next Step
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
    <div className="min-h-screen p-8 bg-slate-50">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#4A081A] tracking-tight">Employee Records</h1>
          <p className="text-slate-500 mt-1">Manage and monitor employee master data and records.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {view === 'list' && (
            <div className="relative w-full sm:w-72">
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-slate-200 pl-10 h-11 focus:ring-[#630C22] focus:border-[#630C22] rounded-lg shadow-sm"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
          )}
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setView('onboard')}
              className="flex-1 sm:flex-none bg-[#630C22] hover:bg-[#4A081A] text-white font-bold px-6 h-11 rounded-lg transition-all shadow-sm"
            >
              + ONBOARD NEW EMPLOYEE
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        {view === 'list' ? (
          <>


            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#630C22] mb-4"></div>
                <p className="text-slate-500 font-medium">Loading employees...</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Persistent Pending Approval Section */}
                {pendingList.length > 0 && (
                  <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="text-lg font-bold text-amber-800 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-amber-400 rounded-full" />
                      Pending Approval
                      <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{pendingList.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {pendingList.map((employee) => (
                        <div
                          key={employee.id}
                          onClick={() => fetchEmployeeDetails(employee.id)}
                          className="group bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 text-lg font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
                              {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <h1 className="font-bold text-slate-800 truncate">
                                {employee.first_name} {employee.last_name}
                              </h1>
                              <p className="text-xs text-slate-500 truncate">
                                {employee.position || 'No Position'}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Requires Review</span>
                            <span className="text-[10px] text-slate-400 font-medium">View details →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Content Area with Employed/Terminated Tabs */}
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-[#4A081A] flex items-center gap-2">
                      Employee Master List
                    </h3>
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveTab('employed')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                          activeTab === 'employed'
                            ? 'bg-white text-[#4A081A] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                      >
                        Employed ({employees.filter(e => e.status === 'employed').length})
                      </button>
                      <button
                        onClick={() => setActiveTab('terminated')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                          activeTab === 'terminated'
                            ? 'bg-white text-[#4A081A] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                      >
                        Terminated ({employees.filter(e => e.status === 'terminated').length})
                      </button>
                    </div>
                  </div>

                  <EmployeeTable
                    list={activeTab === 'employed' ? employedList : terminatedList}
                    emptyMessage={
                      searchQuery 
                        ? `No ${activeTab} employees match your search.` 
                        : `No ${activeTab} employees found.`
                    }
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleCancelOnboarding}
                  className="hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
                  Back to List
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
                
                {/* Position Field with Inline Manager */}
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

                {/* Department Field with Inline Manager */}
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
      </div>

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-[#4A081A]">
                  Employee Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all font-bold"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-slate-700">{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
                <span className="text-slate-300 px-2">•</span>
                <Badge className={`${statusBadgeColors[selectedEmployee?.status || 'pending']} border font-semibold shadow-none`}>
                  {statusLabels[selectedEmployee?.status || 'pending']}
                </Badge>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50/30">
              {/* EMPLOYEE DETAILS */}
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#630C22] rounded-full"></span>
                    Employment Information
                  </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">POSITION <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee?.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">DATE HIRED <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">
                      {selectedEmployee?.date_hired
                        ? new Date(selectedEmployee.date_hired).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PERSONAL INFORMATION */}
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#630C22] rounded-full"></span>
                    Personal Information
                  </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">LAST NAME <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.last_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">FIRST NAME <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.first_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">MIDDLE NAME <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.middle_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">SUFFIX <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.suffix || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">BIRTHDAY <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">
                      {selectedEmployee.birthday
                        ? new Date(selectedEmployee.birthday).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">BIRTHPLACE <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.birthplace || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">CIVIL_STATUS <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.civil_status || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">GENDER <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.gender || '-'}</p>
                  </div>
                </div>
              </div>

              {/* CONTACT INFORMATION */}
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#630C22] rounded-full"></span>
                    Contact Information
                  </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">MOBILE NUMBER <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.mobile_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">PHONE NUMBER <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.phone_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">EMAIL ADDRESS <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.email_address || selectedEmployee.email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* GOVERNMENT ID NUMBERS */}
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#630C22] rounded-full"></span>
                    Government ID Numbers
                  </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">SSS NUMBER <span className="text-slate-400 text-xs">(can be N/A)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.sss_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">PHILHEALTH NUMBER <span className="text-slate-400 text-xs">(can be N/A)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.philhealth_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">PAG-IBIG NUMBER <span className="text-slate-400 text-xs">(can be N/A)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.pagibig_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">TIN NUMBER <span className="text-slate-400 text-xs">(can be N/A)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.tin_number || '-'}</p>
                  </div>
                </div>
              </div>

              {/* FAMILY INFORMATION */}
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#630C22] rounded-full"></span>
                    Family Information
                  </h3>
                <div className="mb-6">
                  <p className="text-slate-700 font-semibold mb-3">MOTHER&apos;S MAIDEN NAME</p>
                  <div className="grid grid-cols-2 gap-6 ml-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">MLAST NAME <span className="text-red-500">*</span></p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.mlast_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">MFIRST NAME <span className="text-red-500">*</span></p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.mfirst_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">MMIDDLE NAME <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.mmiddle_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">MSUFFIX <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.msuffix || '-'}</p>
                    </div>
                  </div>
                </div>
                  <p className="text-slate-700 font-semibold mb-3">FATHER&apos;S NAME <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                  <div className="grid grid-cols-2 gap-6 ml-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">FLAST NAME</p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.flast_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">FFIRST NAME</p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.ffirst_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">FMIDDLE NAME <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.fmiddle_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">FSUFFIX <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.fsuffix || '-'}</p>
                    </div>
                  </div>
                </div>

              {/* ADDRESS INFORMATION */}
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#630C22] rounded-full"></span>
                    Address Information
                  </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">HOUSE NUMBER <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.house_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">STREET <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.street || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">VILLAGE <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.village || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">SUBDIVISION <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.subdivision || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">BARANGAY <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.barangay || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">REGION <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.region || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">PROVINCE <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.province || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">CITY / MUNICIPALITY <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.city_municipality || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">ZIP CODE <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.zip_code || '-'}</p>
                  </div>
                </div>
              </div>

              {/* ADDITIONAL INFORMATION */}

              {/* Status Requirements Check */}
               <div className="mb-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                  <span className="text-xl">!</span>
                  <p>All fields marked with <span className="text-rose-600 font-bold">*</span> must be filled to set this employee as Employed.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.03)] flex justify-end gap-3">
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="outline"
                className="border-slate-200 text-slate-600 font-medium px-6"
              >
                Close
              </Button>
              <Button
                onClick={() => handleStatusUpdate('employed')}
                disabled={updatingStatus || selectedEmployee.status === 'employed' || !isEmployeeComplete(selectedEmployee)}
                className={`px-8 font-semibold transition-all duration-300 ${
                  !isEmployeeComplete(selectedEmployee)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#630C22] hover:bg-[#4A081A] text-white shadow-md'
                }`}
              >
                {updatingStatus ? 'Updating...' : 'Set as Employed'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Registration Modal */}
    </div>
      )}
    </div>
  )
}
