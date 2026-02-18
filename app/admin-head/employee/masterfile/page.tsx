"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmployeeRegistrationForm } from '@/components/employee-registration-form'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Settings2,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle
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

interface AdditionalFieldValue {
  field_id: number
  field_label: string
  field_key: string
  value: string | null
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
  const [view, setView] = useState<'list' | 'onboard' | 'checklist'>('list')
  const [activeTab, setActiveTab] = useState<'employed' | 'terminated'>('employed')
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [checklistData, setChecklistData] = useState<{
    name: string,
    position: string,
    department: string,
    date: string
  } | null>(null)


  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [additionalValues, setAdditionalValues] = useState<AdditionalFieldValue[]>([])
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

  useEffect(() => {
    fetchEmployees()
    fetchPositions()
    fetchDepartments()
  }, [])

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
        setChecklistData({
          name: `${first_name} ${last_name}`,
          position: position,
          department: department,
          date: new Date(onboarding_date).toLocaleDateString()
        })
        setCompletedTasks([])
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
      
      const [empResponse, addlResponse] = await Promise.all([
        fetch(fullUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'include',
        }),
        fetch(`${apiUrl}/api/employees/${employeeId}/additional-values`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
        }),
      ])
      
      if (!empResponse.ok) {
        console.error(`API returned status ${empResponse.status}: ${empResponse.statusText}`)
        throw new Error(`HTTP Error: ${empResponse.status}`)
      }
      
      const data = await empResponse.json()
      if (data.success) {
        setSelectedEmployee(data.data)
        setShowDetailModal(true)
      } else {
        console.warn('API response not successful:', data)
        alert('Failed to load employee details')
      }

      if (addlResponse.ok) {
        const addlData = await addlResponse.json()
        if (addlData.success) setAdditionalValues(addlData.data)
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
      'flast_name',
      'ffirst_name',
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
    setCompletedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    )
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
                <span className="text-xs font-bold text-[#630C22]">{completedTasks.length} / {onboardingTasks.length} Tasks Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                <div 
                  className="bg-[#630C22] h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,12,34,0.3)]"
                  style={{ width: `${(completedTasks.length / onboardingTasks.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Table Header Labels */}
            <div className="grid grid-cols-[120px_1fr] text-center font-bold bg-[#D1D5DB] text-sm uppercase">
              <div className="py-2 border-r-2 border-b-2 border-slate-400">Status</div>
              <div className="py-2 border-b-2 border-slate-400">Tasks</div>
            </div>

            {/* Task List */}
            <div className="bg-white">
              {onboardingTasks.map((task, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-[120px_1fr] border-b-2 border-slate-400 group cursor-pointer hover:bg-emerald-50/30 transition-colors"
                  onClick={() => toggleTask(task)}
                >
                  <div className="py-2 flex items-center justify-center border-r-2 border-slate-400 font-bold transition-all">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                      completedTasks.includes(task) 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {completedTasks.includes(task) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  </div>
                  <div className={`py-2 px-4 flex items-center text-sm font-medium transition-all ${
                    completedTasks.includes(task) ? 'text-slate-400 line-through' : 'text-slate-800'
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
                onClick={() => setView('list')}
                className="py-1 px-4 border-r-2 border-slate-400 bg-[#D1D5DB] hover:bg-slate-300 font-bold text-slate-800 text-sm transition-colors"
              >
                ADD TO MASTERFILE
              </button>
              <button 
                onClick={() => toast.success('Checklist progress saved successfully')}
                className="py-1 px-4 bg-[#D1D5DB] hover:bg-slate-300 font-bold text-slate-800 text-sm transition-colors"
              >
                SAVE
              </button>
            </div>
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
              onClick={() => router.push('/admin-head/employee/additional-info')}
              variant="outline"
              className="flex-1 sm:flex-none border-slate-200 text-slate-700 hover:bg-slate-100 font-medium px-4 h-11 rounded-lg transition-all"
            >
              Additional Information
            </Button>
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
                <div>
                  <p className="text-slate-700 font-semibold mb-3">FATHER&apos;S NAME <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
                  <div className="grid grid-cols-2 gap-6 ml-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">FLAST NAME <span className="text-red-500">*</span></p>
                      <p className="text-slate-900 font-medium text-base">{selectedEmployee.flast_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">FFIRST NAME <span className="text-red-500">*</span></p>
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
              {additionalValues.length > 0 && (
                 <div className="mb-10">
                  <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#630C22] rounded-full"></span>
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {additionalValues.map((field) => (
                      <div key={field.field_id}>
                        <p className="text-slate-600 text-sm font-medium mb-1 uppercase">{field.field_label}</p>
                        <p className="text-slate-900 font-medium text-base">{field.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
