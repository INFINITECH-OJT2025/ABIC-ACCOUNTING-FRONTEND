"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ListFilter, ArrowUpAZ, ArrowDownAZ, Clock3, History, Search, Plus, Users, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
interface OnboardingChecklist {
  id: number
  name: string
  tasks: any[]
  status: string
  updated_at: string
}

import { Skeleton } from '@/components/ui/skeleton'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: 'pending' | 'employed' | 'terminated'
  created_at: string
  onboarding_tasks?: {
    done: number
    total: number
    isComplete: boolean
  }
  termination_date?: string
  termination_reason?: string
}

interface EmployeeDetails extends Employee {
  [key: string]: any
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
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list')
  const [activeTab, setActiveTab] = useState<'all' | 'employed' | 'terminated' | 'pending'>('all')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [checklists, setChecklists] = useState<OnboardingChecklist[]>([])

  // Pagination States
  const [pendingPage, setPendingPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const [employedPage, setEmployedPage] = useState(1)
  const [terminatedPage, setTerminatedPage] = useState(1)
  const ITEMS_PER_PAGE_CARDS = 12
  const ITEMS_PER_PAGE_TABLE = 10
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'az' | 'za'>('recent')

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant: "default" | "destructive" | "success" | "warning"
    confirmText?: string
    hideCancel?: boolean
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
    variant: 'default',
    confirmText: 'Confirm',
    hideCancel: false
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setFetchError(null)
    try {
      const apiUrl = getApiUrl()
      const employeesUrl = `${apiUrl}/api/employees`
      const checklistsUrl = `${apiUrl}/api/onboarding-checklist`

      const terminationsUrl = `${apiUrl}/api/terminations`

      const [empRes, checkRes, termRes] = await Promise.all([
        fetch(employeesUrl, { headers: { Accept: 'application/json' } }),
        fetch(checklistsUrl, { headers: { Accept: 'application/json' } }),
        fetch(terminationsUrl, { headers: { Accept: 'application/json' } })
      ])

      if (!empRes.ok || !checkRes.ok || !termRes.ok) {
        throw new Error(`HTTP Error: employees=${empRes.status}, checklists=${checkRes.status}, terminations=${termRes.status}`)
      }

      const empData = await empRes.json()
      const checkData = await checkRes.json()
      const termData = await termRes.json()

      if (empData.success) {
        const checklistsList = Array.isArray(checkData.data) ? checkData.data : []
        const terminationsList = termData.success && Array.isArray(termData.data) ? termData.data : []
        const normalizeName = (value: unknown) =>
          String(value ?? '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()

        setChecklists(checklistsList)

        const enhancedEmployees = empData.data.map((emp: Employee) => {
          const fullName = normalizeName(`${emp.first_name} ${emp.last_name}`)
          const nameParts = fullName.split(' ').filter(Boolean)
          const firstName = nameParts[0] || ''
          const lastName = nameParts[nameParts.length - 1] || ''
          const checklistMatches = checklistsList
            .filter((c: any) => {
              const candidate = normalizeName(c?.name)
              if (!candidate) return false
              if (candidate === fullName) return true
              if (firstName && lastName) {
                return candidate.includes(firstName) && candidate.includes(lastName)
              }
              return false
            })
            .sort((a: any, b: any) => {
              const aTime = new Date(a?.updated_at ?? a?.created_at ?? 0).getTime()
              const bTime = new Date(b?.updated_at ?? b?.created_at ?? 0).getTime()
              return bTime - aTime
            })
          const checklist = checklistMatches[0]
          const termination = terminationsList.find((t: any) => t.employee_id === emp.id)

          let enhancedEmp = { ...emp }

          if (termination) {
            enhancedEmp.termination_date = termination.termination_date
            enhancedEmp.termination_reason = termination.reason
          }

          if (checklist) {
            const tasks = Array.isArray(checklist.tasks) ? checklist.tasks : []
            const doneCount = tasks.filter((t: any) => String(t?.status ?? '').toUpperCase() === 'DONE').length
            enhancedEmp = {
              ...enhancedEmp,
              onboarding_tasks: {
                done: doneCount,
                total: tasks.length,
                isComplete: doneCount === tasks.length && tasks.length > 0
              }
            }
          }
          return enhancedEmp
        })
        setEmployees(enhancedEmployees || [])
      } else {
        toast.error(empData.message || 'Failed to fetch employees')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setFetchError('Network Error: Could not connect to the server.')
      toast.error('Network Error: Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      setIsDetailLoading(true)
      setViewMode('details')
      window.scrollTo(0, 0)

      const apiUrl = getApiUrl()
      const fullUrl = `${apiUrl}/api/employees/${employeeId}`

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Find existing onboarding tasks and termination details from the employees list to preserve state
        const existingEmp = employees.find(e => e.id === employeeId)
        const enhancedDetails = {
          ...data.data,
          onboarding_tasks: existingEmp?.onboarding_tasks,
          termination_date: existingEmp?.termination_date,
          termination_reason: existingEmp?.termination_reason
        }
        setSelectedEmployee(enhancedDetails)
      } else {
        toast.error(data.message || 'Failed to load employee details')
        setViewMode('list')
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
      toast.error('Network Error: Could not connect to the server.')
      setViewMode('list')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const checkCompleteness = (emp: any) => {
    if (!emp) return { isComplete: false, status: 'Incomplete', batchId: 1 }

    // Batch 1: Employment Information
    if (!emp.position || emp.position.toString().trim() === '' || !emp.date_hired) {
      return { isComplete: false, status: 'Pending: Employment Information', batchId: 1 }
    }

    // Batch 2: Personal Information
    const personalFields = ['last_name', 'first_name', 'birthday', 'birthplace', 'civil_status', 'gender']
    for (const field of personalFields) {
      if (!emp[field] || emp[field].toString().trim() === '') {
        return { isComplete: false, status: 'Pending: Personal Information', batchId: 2 }
      }
    }

    // Batch 3: Contact Information
    if (!emp.mobile_number || emp.mobile_number.toString().trim() === '' || (!emp.email && !emp.email_address)) {
      return { isComplete: false, status: 'Pending: Contact Information', batchId: 3 }
    }

    // Batch 4: Government IDs (optional in onboarding flow)

    // Batch 5: Family Information
    if (!emp.mlast_name || emp.mlast_name.toString().trim() === '' || !emp.mfirst_name || emp.mfirst_name.toString().trim() === '') {
      return { isComplete: false, status: 'Pending: Family Information', batchId: 5 }
    }

    // Batch 6: Address Information
    const addressFields = ['street', 'barangay', 'region', 'province', 'city_municipality', 'zip_code']
    for (const field of addressFields) {
      if (!emp[field] || emp[field].toString().trim() === '') {
        return { isComplete: false, status: 'Pending: Address Information', batchId: 6 }
      }
    }

    return { isComplete: true, status: 'READY TO EMPLOY', batchId: 1 }
  }

  const handleSetAsEmployed = async () => {
    if (!selectedEmployee) return

    const { isComplete } = checkCompleteness(selectedEmployee)
    if (!isComplete) {
      setConfirmModal({
        isOpen: true,
        title: 'Information Incomplete',
        description: 'Cannot employ: Missing required Information. Please complete the employee profile first.',
        variant: 'warning',
        confirmText: 'Got it',
        hideCancel: true,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      })
      return
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Employment',
      description: `Are you sure you want to employ ${selectedEmployee.first_name} ${selectedEmployee.last_name}?`,
      variant: 'default',
      confirmText: 'Yes, Employ',
      hideCancel: false,
      onConfirm: async () => {
        setIsUpdating(true)
        try {
          const apiUrl = getApiUrl()
          const response = await fetch(`${apiUrl}/api/employees/${selectedEmployee.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'employed' }),
          })

          const data = await response.json()
          if (data.success) {
            toast.success(`${selectedEmployee.first_name} set as employed successfully`)
            await fetchEmployees()
            setViewMode('list')
            setSelectedEmployee(null)
          } else {
            // Parse validation errors if present
            if (data.errors) {
              const errorMessages = Object.values(data.errors).flat().join(' ')
              toast.error(errorMessages || data.message)
            } else {
              toast.error(data.message || 'Failed to update status')
            }
          }
        } catch (error) {
          console.error('Error updating status:', error)
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            toast.error('Could not connect to server. Please ensure the backend is running.')
          } else {
            toast.error('Failed to update status')
          }
        } finally {
          setIsUpdating(false)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const filterEmployees = (list: Employee[]) => {
    let result = [...list]

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((emp) =>
        emp.first_name?.toLowerCase().includes(query) ||
        emp.last_name?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query)
      )
    }

    // Sort Logic
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'az':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        case 'za':
          return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`)
        default:
          return 0
      }
    })

    return result
  }

  const employedList = filterEmployees(employees.filter(e => e.status === 'employed'))
  const terminatedList = filterEmployees(employees.filter(e => e.status === 'terminated'))
  const pendingList = filterEmployees(employees.filter(e => e.status === 'pending'))
  const allList = filterEmployees(employees)

  const paginatedPending = pendingList.slice((pendingPage - 1) * ITEMS_PER_PAGE_CARDS, pendingPage * ITEMS_PER_PAGE_CARDS)
  const paginatedAll = allList.slice((allPage - 1) * ITEMS_PER_PAGE_TABLE, allPage * ITEMS_PER_PAGE_TABLE)
  const paginatedEmployed = employedList.slice((employedPage - 1) * ITEMS_PER_PAGE_TABLE, employedPage * ITEMS_PER_PAGE_TABLE)
  const paginatedTerminated = terminatedList.slice((terminatedPage - 1) * ITEMS_PER_PAGE_TABLE, terminatedPage * ITEMS_PER_PAGE_TABLE)

  const PaginationControls = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange
  }: {
    currentPage: number,
    totalItems: number,
    itemsPerPage: number,
    onPageChange: (page: number) => void
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-6 px-2">
        <p className="text-sm text-slate-500 font-medium">
          Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-slate-800">{totalItems}</span> results
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-9 w-9 border-slate-200 rounded-lg text-slate-500 hover:text-[#630C22] disabled:opacity-40"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 w-9 border-slate-200 rounded-lg text-slate-500 hover:text-[#630C22] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1
              // Show only current, first, last, and pages around current
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => onPageChange(pageNum)}
                    className={`h-9 w-9 rounded-lg text-sm font-bold transition-all ${currentPage === pageNum
                      ? 'bg-[#630C22] hover:bg-[#4A081A] text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-[#630C22] hover:text-[#630C22]'
                      }`}
                  >
                    {pageNum}
                  </Button>
                )
              }
              if (
                (pageNum === 2 && currentPage > 3) ||
                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return <span key={pageNum} className="text-slate-300 mx-1">...</span>
              }
              return null
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 w-9 border-slate-200 rounded-lg text-slate-500 hover:text-[#630C22] disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-9 w-9 border-slate-200 rounded-lg text-slate-500 hover:text-[#630C22] disabled:opacity-40"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const EmployeeTable = ({ list, emptyMessage }: { list: Employee[], emptyMessage: string }) => (
    <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-xl flex flex-col">
      <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex justify-between items-center">
        <h3 className="text-xl text-[#4A081A] font-bold capitalize">
          {activeTab} Employees Master List
        </h3>
        <div className="text-[#A0153E]/70 flex items-center gap-2 text-xs font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C9184A]" />
          <span>{list.length} records shown</span>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-stone-50/30">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Email/Contact</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right font-bold text-[#800020] text-sm uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((employee) => (
                <tr key={employee.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200 group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-base group-hover:text-[#630C22] transition-colors">
                      {employee.first_name} {employee.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{employee.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-semibold">{employee.position || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${statusBadgeColors[employee.status]} border shadow-none font-bold px-3 py-1 uppercase text-[10px] pointer-events-none rounded-full`}>
                      {statusLabels[employee.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {employee.status === 'terminated' && employee.termination_date ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-rose-700">{new Date(employee.termination_date).toLocaleDateString()}</span>
                        <span className="text-[10px] uppercase font-bold text-rose-300">Terminated</span>
                      </div>
                    ) : (
                      <span className="font-medium">{new Date(employee.created_at).toLocaleDateString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#FFE5EC] text-[#800020] hover:bg-[#A4163A] hover:text-white font-bold transition-all shadow-sm rounded-lg"
                      onClick={() => fetchEmployeeDetails(employee.id)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const DetailSkeleton = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="p-8 md:p-10 space-y-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-6">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex justify-end gap-3">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans flex flex-col">
      {/* ----- GLOBAL LOADING OVERLAY (For Actions Only) ----- */}
      {isActionLoading && (
        <div className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white/80 backdrop-blur-xl w-[400px] h-auto p-12 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center gap-10 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-14 h-14 border-[3px] border-slate-100 border-t-[#A4163A] rounded-full animate-spin" />
            </div>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold text-[#1e293b] tracking-tight">Loading...</h3>
            </div>
            <div className="flex gap-2.5">
              <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="flex-1 flex flex-col">
          {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
          <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
            {/* Main Header Row */}
            <div className="w-full px-4 md:px-8 py-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Employee Records</h1>
                  <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Manage and monitor employee master data and records.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => router.push('/admin-head/employee/onboard')}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20 hover:text-white bg-transparent backdrop-blur-sm shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ONBOARD NEW EMPLOYEE</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Secondary Toolbar */}
            <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="w-full px-4 md:px-8 py-3">
                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                  {/* Status Tabs */}
                  <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'all'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      All ({employees.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('employed')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'employed'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Employed ({employees.filter(e => e.status === 'employed').length})
                    </button>
                    <button
                      onClick={() => setActiveTab('terminated')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'terminated'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Terminated ({employees.filter(e => e.status === 'terminated').length})
                    </button>
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'pending'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Pending ({employees.filter(e => e.status === 'pending').length})
                    </button>
                  </div>

                  {/* Search and Sort */}
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-[350px]">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                      <Input
                        placeholder="Search employee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                      />
                    </div>

                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger className="w-full sm:w-[180px] bg-white border-2 border-[#FFE5EC] h-10 rounded-lg shadow-sm focus:ring-[#A0153E] text-[#800020] font-bold">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          <SelectValue placeholder="Sort by" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-stone-200 shadow-xl overflow-hidden">
                        <SelectItem value="recent" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <History className="h-4 w-4" />
                            <span>Recent First</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="oldest" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <Clock3 className="h-4 w-4" />
                            <span>Oldest First</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="az" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <ArrowUpAZ className="h-4 w-4" />
                            <span>Alphabet (A-Z)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="za" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <ArrowDownAZ className="h-4 w-4" />
                            <span>Alphabet (Z-A)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-8 pb-12 overflow-y-auto">
            {fetchError ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 group">
                  <Badge variant="outline" className="h-12 w-12 border-rose-200 bg-white shadow-sm flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <X className="w-6 h-6 text-rose-500" />
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Connection Failed</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  {fetchError} Please ensure the backend server is running and try again.
                </p>
                <Button
                  onClick={fetchEmployees}
                  className="bg-[#A4163A] hover:bg-[#80122D] text-white px-8 h-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Retry Connection
                </Button>
              </div>
            ) : loading ? (
              <div className="space-y-12">
                {/* Pending Skeletons */}
                <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100/50 mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <Skeleton className="h-6 w-1.5 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-14 w-14 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-64 rounded-xl" />
                  <Skeleton className="h-10 w-48 rounded-xl" />
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex gap-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                  </div>
                  <div className="p-4 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : employees.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <p>No employees found.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Persistent Pending Approval Section */}
                {pendingList.length > 0 && (
                  <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100/50">
                    <h3 className="text-lg font-bold text-orange-900 mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-orange-400 rounded-full" />
                      Pending Approval
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                        {pendingList.length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {paginatedPending.map((employee) => {
                        const { isComplete, status } = checkCompleteness(employee as any)

                        return (
                          <div
                            key={employee.id}
                            onClick={() => fetchEmployeeDetails(employee.id)}
                            className={`group relative bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden ${isComplete
                              ? 'border-emerald-200 hover:border-emerald-400 ring-1 ring-emerald-50'
                              : 'border-slate-200 hover:border-orange-300'
                              }`}
                          >
                            {/* Ready Indicator Strip */}
                            {isComplete && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>}

                            <div className="flex items-center gap-4 mb-4">
                              <div className={`w-14 h-14 min-w-[3.5rem] rounded-full flex items-center justify-center text-xl font-bold transition-colors duration-200 ${isComplete
                                ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-white'
                                : 'bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white'
                                }`}>
                                {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                              </div>
                              <div className="overflow-hidden flex flex-col justify-center">
                                <p className="font-semibold text-[#4A081A] text-xs uppercase tracking-wider mb-0.5 truncate">
                                  {employee.position || 'No Position'}
                                </p>
                                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight group-hover:text-[#630C22] transition-colors break-words">
                                  {employee.first_name} {employee.last_name}
                                </h1>
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                              {isComplete ? (
                                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
                                  {employee.onboarding_tasks?.isComplete ? status : "PENDING: ONBOARDING CHECKLIST"}
                                </Badge>
                              ) : (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                                    {employee.onboarding_tasks?.isComplete ? status : "PENDING: ONBOARDING CHECKLIST"}
                                  </span>
                                  {employee.onboarding_tasks && (
                                    <span className="text-[9px] font-medium text-slate-400">
                                      Tasks: {employee.onboarding_tasks.done}/{employee.onboarding_tasks.total}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {employee.status === 'pending' && (!isComplete || !employee.onboarding_tasks?.isComplete) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        employee.onboarding_tasks?.isComplete
                                          ? `/admin-head/employee/onboard?id=${employee.id}&batch=${checkCompleteness(employee as any).batchId}`
                                          : `/admin-head/employee/onboard?id=${employee.id}&view=checklist&batch=${checkCompleteness(employee as any).batchId}`
                                      )
                                    }
                                    className={`h-7 px-2 text-[10px] font-bold border rounded-lg transition-all ${employee.onboarding_tasks?.isComplete
                                      ? 'text-[#630C22] bg-rose-50 hover:bg-rose-100 border-rose-100'
                                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100 animate-pulse hover:animate-none'
                                      }`}
                                  >
                                    {employee.onboarding_tasks?.isComplete ? 'Update Profile' : 'Continue Onboarding'}
                                  </Button>
                                )}
                                <button
                                  onClick={() => fetchEmployeeDetails(employee.id)}
                                  className="text-[10px] text-slate-400 font-medium group-hover:text-[#630C22] group-hover:translate-x-1 transition-all flex items-center gap-1 py-1"
                                >
                                  Review <span className="text-xs">→</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <PaginationControls
                      currentPage={pendingPage}
                      totalItems={pendingList.length}
                      itemsPerPage={ITEMS_PER_PAGE_CARDS}
                      onPageChange={setPendingPage}
                    />
                  </div>
                )}

                {/* Main Content Area */}
                <div className="mt-12">
                  <EmployeeTable
                    list={
                      activeTab === 'all' ? paginatedAll :
                        activeTab === 'employed' ? paginatedEmployed :
                          activeTab === 'terminated' ? paginatedTerminated :
                            paginatedPending
                    }
                    emptyMessage={
                      searchQuery
                        ? `No ${activeTab} employees match your search.`
                        : `No ${activeTab} employees found.`
                    }
                  />
                  <PaginationControls
                    currentPage={
                      activeTab === 'all' ? allPage :
                        activeTab === 'employed' ? employedPage :
                          activeTab === 'terminated' ? terminatedPage :
                            pendingPage
                    }
                    totalItems={
                      activeTab === 'all' ? allList.length :
                        activeTab === 'employed' ? employedList.length :
                          activeTab === 'terminated' ? terminatedList.length :
                            pendingList.length
                    }
                    itemsPerPage={ITEMS_PER_PAGE_TABLE}
                    onPageChange={
                      activeTab === 'all' ? setAllPage :
                        activeTab === 'employed' ? setEmployedPage :
                          activeTab === 'terminated' ? setTerminatedPage :
                            setPendingPage
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DETAIL VIEW (Replaces Modal) */
        <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setViewMode('list')}
              disabled={isDetailLoading}
              className="text-slate-500 hover:text-slate-800 hover:bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6" /></svg>
              Back to Employee List
            </Button>
          </div>

          {isDetailLoading ? (
            <DetailSkeleton />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-[#630C22] text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                    {selectedEmployee?.first_name.charAt(0)}{selectedEmployee?.last_name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold text-[#4A081A] mb-1">
                      {selectedEmployee?.first_name} {selectedEmployee?.last_name}
                    </h1>
                    <div className="flex items-center gap-3">
                      <p className="text-slate-500 font-medium">{selectedEmployee?.position || 'No Position'}</p>
                      {selectedEmployee?.status === 'pending' ? (
                        <Badge className={`border shadow-none px-3 py-0.5 transition-colors duration-300 ${(checkCompleteness(selectedEmployee).status === "READY TO EMPLOY" && selectedEmployee.onboarding_tasks?.isComplete)
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {selectedEmployee.onboarding_tasks?.isComplete ? checkCompleteness(selectedEmployee).status : "PENDING: ONBOARDING CHECKLIST"}
                        </Badge>
                      ) : (
                        <Badge className={`${statusBadgeColors[selectedEmployee?.status || 'pending']} border shadow-none px-3 py-0.5`}>
                          {statusLabels[selectedEmployee?.status || 'pending']}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                  <p className="font-mono text-slate-700 font-bold">#{selectedEmployee?.id.toString().padStart(4, '0')}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-10 space-y-12">
                {selectedEmployee && (
                  <>
                    {/* EMPLOYMENT */}
                    <section>
                      <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-3 pb-2 border-b border-slate-100">
                        <span className="w-8 h-1 bg-[#630C22] rounded-full"></span>
                        Employment Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <DetailItem label="Position" value={selectedEmployee.position} required />
                        <DetailItem label="Date Hired" value={selectedEmployee.date_hired ? new Date(selectedEmployee.date_hired).toLocaleDateString() : null} required />
                        <DetailItem label="Department" value={selectedEmployee.department} />
                        <DetailItem label="Employment Status" value={selectedEmployee.status} />
                      </div>
                    </section>

                    {/* PERSONAL */}
                    <section>
                      <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-3 pb-2 border-b border-slate-100">
                        <span className="w-8 h-1 bg-[#630C22] rounded-full"></span>
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        <DetailItem label="First Name" value={selectedEmployee.first_name} required />
                        <DetailItem label="Last Name" value={selectedEmployee.last_name} required />
                        <DetailItem label="Middle Name" value={selectedEmployee.middle_name} />
                        <DetailItem label="Suffix" value={selectedEmployee.suffix} />
                        <DetailItem label="Birthday" value={selectedEmployee.birthday ? new Date(selectedEmployee.birthday).toLocaleDateString() : null} required />
                        <DetailItem label="Birthplace" value={selectedEmployee.birthplace} required />
                        <DetailItem label="Gender" value={selectedEmployee.gender} required />
                        <DetailItem label="Civil Status" value={selectedEmployee.civil_status} required />
                      </div>
                    </section>

                    {/* CONTACT */}
                    <section>
                      <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-3 pb-2 border-b border-slate-100">
                        <span className="w-8 h-1 bg-[#630C22] rounded-full"></span>
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        <DetailItem label="Email Address" value={selectedEmployee.email || selectedEmployee.email_address} required />
                        <DetailItem label="Mobile Number" value={selectedEmployee.mobile_number} required />
                        <DetailItem label="Tel Number" value={selectedEmployee.phone_number} />
                      </div>
                    </section>

                    {/* ADDRESS */}
                    <section>
                      <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-3 pb-2 border-b border-slate-100">
                        <span className="w-8 h-1 bg-[#630C22] rounded-full"></span>
                        Address Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        <DetailItem label="Street" value={selectedEmployee.street} required />
                        <DetailItem label="Barangay" value={selectedEmployee.barangay} required />
                        <DetailItem label="City / Municipality" value={selectedEmployee.city_municipality} required />
                        <DetailItem label="Province" value={selectedEmployee.province} required />
                        <DetailItem label="Region" value={selectedEmployee.region} required />
                        <DetailItem label="Zip Code" value={selectedEmployee.zip_code} required />
                        <DetailItem label="House No." value={selectedEmployee.house_number} />
                        <DetailItem label="Village" value={selectedEmployee.village} />
                        <DetailItem label="Subdivision" value={selectedEmployee.subdivision} />
                      </div>
                    </section>

                    {/* TERMINATION DETAILS (If Terminated) */}
                    {selectedEmployee.status === 'terminated' && (
                      <section className="bg-rose-50 border border-rose-100 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-[#A4163A] uppercase tracking-widest mb-4 flex items-center gap-3">
                          <span className="w-8 h-1 bg-[#A4163A] rounded-full"></span>
                          Termination Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-rose-400 mb-1.5 uppercase">Termination Date</p>
                            <p className="font-semibold text-rose-900">
                              {selectedEmployee.termination_date ? new Date(selectedEmployee.termination_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-rose-400 mb-1.5 uppercase">Reason</p>
                            <p className="font-medium text-rose-800 italic">
                              "{selectedEmployee.termination_reason || 'No reason provided'}"
                            </p>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* FAMILY & GOV */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <section>
                        <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-3 pb-2 border-b border-slate-100">
                          <span className="w-8 h-1 bg-[#630C22] rounded-full"></span>
                          Family Background
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Mother's Maiden Name</p>
                            <div className="grid grid-cols-2 gap-4 pl-3 border-l-2 border-slate-100">
                              <DetailItem label="Last Name" value={selectedEmployee.mlast_name} required />
                              <DetailItem label="First Name" value={selectedEmployee.mfirst_name} required />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Father's Name</p>
                            <div className="grid grid-cols-2 gap-4 pl-3 border-l-2 border-slate-100">
                              <DetailItem label="Last Name" value={selectedEmployee.flast_name} />
                              <DetailItem label="First Name" value={selectedEmployee.ffirst_name} />
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-bold text-[#4A081A] uppercase tracking-widest mb-6 flex items-center gap-3 pb-2 border-b border-slate-100">
                          <span className="w-8 h-1 bg-[#630C22] rounded-full"></span>
                          Government IDs
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                          <DetailItem label="SSS No." value={selectedEmployee.sss_number} />
                          <DetailItem label="PhilHealth No." value={selectedEmployee.philhealth_number} />
                          <DetailItem label="Pag-IBIG No." value={selectedEmployee.pagibig_number} />
                          <DetailItem label="TIN" value={selectedEmployee.tin_number} />
                        </div>
                      </section>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex justify-end gap-3">
                {selectedEmployee?.status === 'pending' ? (
                  <>
                    {selectedEmployee.onboarding_tasks?.isComplete && !checkCompleteness(selectedEmployee).isComplete && (
                      <Button
                        onClick={() => router.push(`/admin-head/employee/onboard?id=${selectedEmployee.id}&batch=${checkCompleteness(selectedEmployee).batchId}`)}
                        className="h-12 px-8 font-bold rounded-xl text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-[#630C22] hover:bg-[#4A081A]"
                      >
                        Update Profile
                      </Button>
                    )}
                    <Button
                      onClick={handleSetAsEmployed}
                      disabled={!checkCompleteness(selectedEmployee).isComplete || !selectedEmployee.onboarding_tasks?.isComplete || isUpdating}
                      className={`h-12 px-8 font-bold rounded-xl transition-all ${(!checkCompleteness(selectedEmployee).isComplete || !selectedEmployee.onboarding_tasks?.isComplete)
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#630C22] hover:bg-[#4A081A] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                    >
                      Approve & Set as Employed
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setViewMode('list')} className="h-11 px-8">
                    Back to List
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )
      }

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        hideCancel={confirmModal.hideCancel}
        isLoading={isUpdating}
      />
    </div >
  )
}

function DetailItem({ label, value, required }: { label: string, value: any, required?: boolean }) {
  const isEmpty = !value || value.toString().trim() === ''
  return (
    <div className="group">
      <p className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1 group-hover:text-[#630C22] transition-colors">
        {label}
        {required && <span className="text-rose-500 text-[10px] bg-rose-50 px-1 rounded ml-1">REQUIRED</span>}
      </p>
      <p className={`font-medium text-base ${isEmpty ? 'text-slate-300 italic' : 'text-slate-800'}`}>
        {isEmpty ? 'Not Provided' : value}
      </p>
    </div>
  )
}
