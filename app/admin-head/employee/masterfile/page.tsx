"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ConfirmationModal'

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
  const [activeTab, setActiveTab] = useState<'employed' | 'terminated'>('employed')
  const [isUpdating, setIsUpdating] = useState(false)

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
    try {
      const apiUrl = getApiUrl()
      const fullUrl = `${apiUrl}/api/employees`

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setEmployees(data.data || [])
      } else {
        toast.error(data.message || 'Failed to fetch employees')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Could not connect to the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      const apiUrl = getApiUrl()
      const fullUrl = `${apiUrl}/api/employees/${employeeId}`

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setSelectedEmployee(data.data)
        setViewMode('details')
        window.scrollTo(0, 0)
      } else {
        toast.error(data.message || 'Failed to load employee details')
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Network Error: Could not load employee details.')
      } else {
        toast.error('Failed to load employee details')
      }
    }
  }

  const checkCompleteness = (emp: any) => {
    if (!emp) return { isComplete: false, status: 'Incomplete' }

    // Check basic info (Batch 1 & 2)
    const basicFields = [
      'position', 'date_hired', 'last_name', 'first_name', 'birthday', 'birthplace', 'civil_status', 'gender'
    ]
    for (const field of basicFields) {
      if (!emp[field] || emp[field].toString().trim() === '') {
        return { isComplete: false, status: 'Pending: User Information' }
      }
    }

    // Check contact info (Batch 3)
    if (!emp.mobile_number || (!emp.email && !emp.email_address)) {
      return { isComplete: false, status: 'Pending: Contact Information' }
    }

    // Check family background (Batch 5)
    if (!emp.mlast_name || !emp.mfirst_name) {
      return { isComplete: false, status: 'Pending: Family Information' }
    }

    // Check address (Batch 6)
    const addressFields = ['street', 'barangay', 'region', 'province', 'city_municipality', 'zip_code']
    for (const field of addressFields) {
      if (!emp[field] || emp[field].toString().trim() === '') {
        return { isComplete: false, status: 'Pending: Address Information' }
      }
    }

    return { isComplete: true, status: 'READY TO EMPLOY' }
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
      <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        <p>{emptyMessage}</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-4 px-6 font-semibold text-[#4A081A] text-xs uppercase tracking-wider">Name</th>
              <th className="text-left py-4 px-6 font-semibold text-[#4A081A] text-xs uppercase tracking-wider">Email</th>
              <th className="text-left py-4 px-6 font-semibold text-[#4A081A] text-xs uppercase tracking-wider">Position</th>
              <th className="text-left py-4 px-6 font-semibold text-[#4A081A] text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-[#4A081A] text-xs uppercase tracking-wider">Joined</th>
              <th className="text-right py-4 px-6 font-semibold text-[#4A081A] text-xs uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {list.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50 transition-colors duration-200">
                <td className="py-4 px-6">
                  <div className="font-bold text-slate-800">{employee.first_name} {employee.last_name}</div>
                </td>
                <td className="py-4 px-6 text-slate-600 text-sm">{employee.email}</td>
                <td className="py-4 px-6 text-slate-600 text-sm">{employee.position || '-'}</td>
                <td className="py-4 px-6">
                  <Badge className={`${statusBadgeColors[employee.status]} border shadow-none font-medium px-2.5 py-0.5 pointer-events-none`}>
                    {statusLabels[employee.status]}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-slate-500 text-sm">
                  {new Date(employee.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:text-[#630C22] hover:border-[#630C22] hover:bg-red-50 transition-all"
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
    )
  )

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500">

      {/* ----- MAROON GRADIENT HEADER ----- */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md p-4 md:p-8 mb-6 md:mb-8 ">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

          {/* LEFT SIDE */}
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">
              Employee Records
            </h1>
            <p className="text-white/80 text-sm md:text-lg">
              Manage and monitor employee master data and records.
            </p>
          </div>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/95 backdrop-blur-sm border border-white/30 text-slate-800 placeholder:text-slate-400 pl-10 h-11 rounded-lg shadow-sm focus:ring-2 focus:ring-white/40 focus:border-white transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7B0F2B]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>

            {/* Onboard Button */}
            <Button
              onClick={() => router.push('/admin-head/employee/onboard')}
              className="bg-white/95 backdrop-blur-sm border border-white/30 text-[#7B0F2B] hover:bg-white hover:border-white shadow-sm hover:shadow-md transition-all duration-200 font-bold h-11 px-6 rounded-lg"
            >
              + ONBOARD NEW EMPLOYEE
            </Button>

          </div>
        </div>
      </div> {viewMode === 'list' ? (
        <>



          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-[#630C22] mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading employees...</p>
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
                      {pendingList.map((employee) => {
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
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200 ${isComplete
                                ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-white'
                                : 'bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white'
                                }`}>
                                {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                              </div>
                              <div className="overflow-hidden">
                                <h1 className="font-bold text-slate-800 truncate group-hover:text-[#630C22] transition-colors">
                                  {employee.first_name} {employee.last_name}
                                </h1>
                                <p className="text-xs text-slate-500 truncate font-medium">
                                  {employee.position || 'No Position'}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                              {isComplete ? (
                                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
                                  {status}
                                </Badge>
                              ) : (
                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                                  {status}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium group-hover:translate-x-1 transition-transform">
                                Review →
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-[#4A081A] flex items-center gap-2">
                      Master List
                    </h3>
                    <div className="flex items-center bg-slate-100 p-1.5 rounded-xl">
                      <button
                        onClick={() => setActiveTab('employed')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'employed'
                          ? 'bg-white text-[#4A081A] shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                          }`}
                      >
                        Employed <span className="ml-1 opacity-60 text-xs">({employees.filter(e => e.status === 'employed').length})</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('terminated')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'terminated'
                          ? 'bg-white text-[#4A081A] shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                          }`}
                      >
                        Terminated <span className="ml-1 opacity-60 text-xs">({employees.filter(e => e.status === 'terminated').length})</span>
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
          </div>
        </>
      ) : (
        /* DETAIL VIEW (Replaces Modal) */
        <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setViewMode('list')}
              className="text-slate-500 hover:text-slate-800 hover:bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6" /></svg>
              Back to Employee List
            </Button>

            {/* Set as Employed Action */}
            {selectedEmployee?.status === 'pending' && (
              <div className="flex items-center gap-3">
                {!checkCompleteness(selectedEmployee).isComplete && (
                  <>
                    <span className="text-xs font-medium text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                      Complete all required fields to employ
                    </span>
                    <Button
                      onClick={() => router.push(`/admin-head/employee/onboard?id=${selectedEmployee.id}`)}
                      className="h-10 px-6 font-bold rounded-xl bg-[#630C22] hover:bg-[#4A081A] text-white transition-all shadow-md hover:shadow-lg"
                    >
                      Update Profile
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleSetAsEmployed}
                  disabled={!checkCompleteness(selectedEmployee).isComplete || isUpdating}
                  className={`h-10 px-6 font-bold rounded-xl transition-all ${!checkCompleteness(selectedEmployee).isComplete
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#630C22] hover:bg-[#4A081A] text-white shadow-md hover:shadow-lg'
                    }`}
                >
                  {isUpdating ? 'Updating...' : 'Set as Employed'}
                </Button>
              </div>
            )}
          </div>

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
                    <Badge className={`${statusBadgeColors[selectedEmployee?.status || 'pending']} border shadow-none px-3 py-0.5`}>
                      {statusLabels[selectedEmployee?.status || 'pending']}
                    </Badge>
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
                  {!checkCompleteness(selectedEmployee).isComplete && (
                    <Button
                      onClick={() => router.push(`/admin-head/employee/onboard?id=${selectedEmployee.id}`)}
                      className="h-12 px-8 font-bold rounded-xl bg-[#630C22] hover:bg-[#4A081A] text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      Update Profile
                    </Button>
                  )}
                  <Button
                    onClick={handleSetAsEmployed}
                    disabled={!checkCompleteness(selectedEmployee).isComplete || isUpdating}
                    className={`h-12 px-8 font-bold rounded-xl transition-all ${!checkCompleteness(selectedEmployee).isComplete
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#630C22] hover:bg-[#4A081A] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                      }`}
                  >
                    {isUpdating ? 'Processing...' : 'Approve & Set as Employed'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setViewMode('list')} className="h-11 px-8">
                  Back to List
                </Button>
              )}
            </div>
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
        confirmText={confirmModal.confirmText}
        hideCancel={confirmModal.hideCancel}
        isLoading={isUpdating}
      />
    </div>
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
