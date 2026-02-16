"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Grid, List, X } from 'lucide-react'
import { EmployeeRegistrationForm } from '@/components/employee-registration-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/layout/Sidebar'
import SuperAdminHeader from '@/components/layout/SuperAdminHeader'
import { employeeSidebarItems } from '@/components/layout/EmployeeSidebar'
import SuccessModal from '@/components/ui/SuccessModal'
import LoadingModal from '@/components/ui/LoadingModal'
import FailModal from '@/components/ui/FailModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const BORDER = 'rgba(0,0,0,0.12)'

const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not available'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

const EyeIcon = (props: any) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: 'pending' | 'approved' | 'terminated'
  created_at: string
}

interface EmployeeDetails extends Employee {
  [key: string]: any
}

const statusBadgeColors = {
  pending: 'bg-amber-50 text-[#A0153E] border-[#C9184A]',
  approved: 'bg-emerald-50 text-[#800020] border-[#A0153E]',
  terminated: 'bg-rose-50 text-[#800020] border-[#C9184A]',
}

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  terminated: 'Terminated',
}

/** Map backend account_status to frontend status */
function mapStatus(accountStatus: string | undefined): 'pending' | 'approved' | 'terminated' {
  switch (accountStatus) {
    case 'active': return 'approved'
    case 'suspended': return 'terminated'
    default: return 'pending'
  }
}

const REQUIRED_FIELDS = [
  'position', 'last_name', 'first_name', 'birthday', 'birthplace', 'gender', 'civil_status',
  'mobile_number', 'street',
  'mlast_name', 'mfirst_name', 'flast_name', 'ffirst_name',
  'region', 'province', 'city_municipality', 'barangay', 'zip_code', 'email_address',
] as const

function hasAllRequiredFields(data: Record<string, any> | null | undefined): boolean {
  if (!data) return false
  return REQUIRED_FIELDS.every((field) => {
    const value = field === 'email_address' ? (data.email_address ?? data.email) : data[field]
    return value !== null && value !== undefined && String(value).trim() !== ''
  })
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'terminated'

export default function MasterfilePage() {
  const [user, setUser] = useState<any>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationPanelClosing, setRegistrationPanelClosing] = useState(false)
  const [showCreateSuccess, setShowCreateSuccess] = useState(false)
  const [successModalTitle, setSuccessModalTitle] = useState('')
  const [successModalMessage, setSuccessModalMessage] = useState('')
  const [showCreateLoading, setShowCreateLoading] = useState(false)
  const [showCreateFail, setShowCreateFail] = useState(false)
  const [createFailMessage, setCreateFailMessage] = useState('')
  const [failModalTitle, setFailModalTitle] = useState('Failed to Create Employee')
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [detailDrawerClosing, setDetailDrawerClosing] = useState(false)
  const [detailEmployee, setDetailEmployee] = useState<EmployeeDetails | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null)
  const [detailEditing, setDetailEditing] = useState(false)
  const [detailFormData, setDetailFormData] = useState<Partial<EmployeeDetails>>({})
  const [savingEmployee, setSavingEmployee] = useState(false)
  const [showSaveLoading, setShowSaveLoading] = useState(false)
  const [saveLoadingAction, setSaveLoadingAction] = useState<'save' | 'approve'>('save')

  // Auth effect - same pattern as management page (cookie-based via /api/auth/me)
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        } else {
          window.location.href = '/login'
          return
        }
      } catch {
        window.location.href = '/login'
        return
      }
    }
    fetchMe()
  }, [])

  // Fetch employees from API
  useEffect(() => {
    if (!user) return
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/employees')
        const data = await res.json()
        if (res.ok && data.success && Array.isArray(data.data)) {
          const mapped = data.data.map((e: { id: number; first_name: string; last_name: string; email: string; position: string; status?: string; created_at: string }) => ({
            id: e.id,
            first_name: e.first_name,
            last_name: e.last_name,
            email: e.email,
            position: e.position ?? '',
            status: mapStatus(e.status),
            created_at: e.created_at ?? '',
          }))
          setEmployees(mapped)
        }
      } catch {
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [user])

  const filteredEmployees = useMemo(() => {
    let result = employees
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((emp) =>
        emp.first_name?.toLowerCase().includes(q) ||
        emp.last_name?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((emp) => emp.status === statusFilter)
    }
    return result
  }, [employees, searchQuery, statusFilter])

  const handleEmployeeCreated = (newEmployee: Employee) => {
    setEmployees((prev) => [newEmployee, ...prev])
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const openDetailDrawer = async (id: number) => {
    setDetailDrawerOpen(true)
    setDetailEmployee(null)
    setDetailLoadError(null)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/employees/${id}`)
      const data = await res.json()
      if (res.ok && data.success && data.data) {
        const d = data.data
        setDetailEmployee({ ...d, status: mapStatus(d.status) })
      } else {
        setDetailLoadError(data.message || 'Failed to load employee')
      }
    } catch {
      setDetailLoadError('Failed to load employee')
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true)
    setTimeout(() => {
      setDetailDrawerOpen(false)
      setDetailDrawerClosing(false)
      setDetailEmployee(null)
      setDetailEditing(false)
      setDetailLoadError(null)
    }, 350)
  }

  const closeRegistrationPanel = () => {
    setRegistrationPanelClosing(true)
    setTimeout(() => {
      setShowRegistrationModal(false)
      setRegistrationPanelClosing(false)
    }, 350)
  }

  const handleSaveEmployee = async (formData: Partial<EmployeeDetails>) => {
    if (!detailEmployee?.id) return
    setSavingEmployee(true)
    setSaveLoadingAction('save')
    setShowSaveLoading(true)
    try {
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (key === 'id' || key === 'status') return acc
        acc[key] = value === '' ? null : value
        return acc
      }, {} as Record<string, any>)

      const res = await fetch(`/api/employees/${detailEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setDetailEmployee((prev) => (prev ? { ...prev, ...data.data } : null))
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}))
        setDetailEditing(false)
        setSuccessModalTitle('Employee Updated Successfully')
        setSuccessModalMessage('The employee profile has been updated.')
        setShowCreateSuccess(true)
      } else {
        setFailModalTitle('Failed to Update Employee')
        setCreateFailMessage(data.message || 'Failed to update employee')
        setShowCreateFail(true)
      }
    } catch {
      setFailModalTitle('Failed to Update Employee')
      setCreateFailMessage('Failed to update employee')
      setShowCreateFail(true)
    } finally {
      setSavingEmployee(false)
      setShowSaveLoading(false)
    }
  }

  const handleApproveEmployee = async () => {
    if (!detailEmployee?.id) return
    setSavingEmployee(true)
    setSaveLoadingAction('approve')
    setShowSaveLoading(true)
    try {
      const res = await fetch(`/api/employees/${detailEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        const updated = { ...detailEmployee, status: mapStatus(data.data?.status) ?? 'approved' }
        setDetailEmployee(updated)
        setDetailFormData(updated)
        setEmployees((prev) =>
          prev.map((e) => (e.id === detailEmployee.id ? { ...e, status: 'approved' } : e))
        )
        setSuccessModalTitle('Employee Approved')
        setSuccessModalMessage('The employee has been approved and can now access their account.')
        setShowCreateSuccess(true)
      } else {
        setFailModalTitle('Failed to Approve Employee')
        setCreateFailMessage(data.message || 'Failed to approve employee')
        setShowCreateFail(true)
      }
    } catch {
      setFailModalTitle('Failed to Approve Employee')
      setCreateFailMessage('Failed to approve employee')
      setShowCreateFail(true)
    } finally {
      setSavingEmployee(false)
      setShowSaveLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SuperAdminHeader user={user} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          items={employeeSidebarItems}
          onLogout={handleLogout}
          showProfile={false}
        />
        <main className="flex-1 overflow-auto bg-gray-100">
          <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Maroon Gradient Header */}
        <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold ">Masterfile</h1>
        </div>

        <section
          className="rounded-lg bg-white p-5 shadow-sm border"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Employee List</h2>
              <p className="text-sm text-gray-600 mt-1">Manage employee master data and records</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                style={{ background: '#7a0f1f', height: 40 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Create Employee
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or position..."
                  className="w-full rounded-md border bg-white px-10 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: '#111' }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'all' ? 'bg-[#7a0f1f] text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                  style={{ borderColor: statusFilter !== 'all' ? BORDER : undefined }}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                  style={{ borderColor: statusFilter !== 'pending' ? BORDER : undefined }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'approved' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                  style={{ borderColor: statusFilter !== 'approved' ? BORDER : undefined }}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter('terminated')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'terminated' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                  style={{ borderColor: statusFilter !== 'terminated' ? BORDER : undefined }}
                >
                  Terminated
                </button>
              </div>

              <div className="flex border rounded-md" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 ${viewMode === 'cards' ? 'bg-[#7a0f1f] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  style={{ borderRadius: '6px 0 0 6px' }}
                  title="Card View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 ${viewMode === 'table' ? 'bg-[#7a0f1f] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  style={{ borderRadius: '0 6px 6px 0' }}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              viewMode === 'cards' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: 'min-content' }}>
                  {[...Array(6)].map((_, i) => (
                    <EmployeeCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <EmployeeTableSkeleton />
              )
            ) : filteredEmployees.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a record or adjust your search.</div>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: 'min-content' }}>
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="rounded-lg bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: BORDER }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-[#7a0f1f]">
                            {(emp.first_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">{emp.first_name} {emp.last_name}</h3>
                          <p className="text-sm text-neutral-600">{emp.email}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{emp.position || '-'}</p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md ${
                          emp.status === 'approved' ? 'bg-green-100 text-green-700' :
                          emp.status === 'terminated' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {statusLabels[emp.status]}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-neutral-500">Created: {formatDate(emp.created_at)}</div>
                      <button
                        onClick={() => openDetailDrawer(emp.id)}
                        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                        style={{ background: '#7a0f1f', height: 32 }}
                        title="View"
                      >
                        <EyeIcon />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
                <div
                  className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900"
                  style={{ gridTemplateColumns: 'minmax(140px, 1.15fr) minmax(160px, 1.2fr) minmax(120px, 1fr) 96px 100px' }}
                >
                  <div>Name</div>
                  <div>Email</div>
                  <div>Position</div>
                  <div className="text-center">Status</div>
                  <div className="text-right">Actions</div>
                </div>
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="grid items-center px-4 py-3 text-sm border-t"
                    style={{ borderColor: BORDER, gridTemplateColumns: 'minmax(140px, 1.15fr) minmax(160px, 1.2fr) minmax(120px, 1fr) 96px 100px' }}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">{emp.first_name} {emp.last_name}</div>
                      <div className="text-[11px] text-neutral-800">Created: {formatDate(emp.created_at)}</div>
                    </div>
                    <div className="min-w-0 text-neutral-900 truncate">{emp.email}</div>
                    <div className="min-w-0 text-neutral-900 truncate">{emp.position || '-'}</div>
                    <div className="flex items-center justify-center">
                      <div
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md ${
                          emp.status === 'approved' ? 'bg-green-100 text-green-700' :
                          emp.status === 'terminated' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {statusLabels[emp.status]}
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openDetailDrawer(emp.id)}
                        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                        style={{ background: '#7a0f1f', height: 32 }}
                        title="View"
                      >
                        <EyeIcon />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Employee Registration Side Panel */}
        {(showRegistrationModal || registrationPanelClosing) && (
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
                registrationPanelClosing ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={closeRegistrationPanel}
              aria-hidden="true"
            />
            <div
              className="fixed top-1/2 right-0 -translate-y-1/2 w-full max-w-lg max-h-[90vh] bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
              style={{
                animation: registrationPanelClosing
                  ? 'slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards'
                  : 'slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
                boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                <div>
                  <h2 className="text-lg font-bold">Create New Employee</h2>
                  <p className="text-sm text-white/90 mt-0.5">Fill in the details below to register a new employee.</p>
                </div>
                <button
                  onClick={closeRegistrationPanel}
                  className="p-2 rounded-md hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                  <EmployeeRegistrationForm
                    onSuccess={() => {
                      closeRegistrationPanel()
                      setSuccessModalTitle('Employee Created Successfully')
                      setSuccessModalMessage("Employee has been created successfully. Login credentials have been sent to the employee's email address.")
                      setShowCreateSuccess(true)
                    }}
                    onEmployeeCreated={handleEmployeeCreated}
                    onLoadingChange={setShowCreateLoading}
                    onError={(msg: string | null) => {
                      if (msg) {
                        setFailModalTitle('Failed to Create Employee')
                        setCreateFailMessage(msg)
                        setShowCreateFail(true)
                      }
                    }}
                  />
                </div>
                {/* <div className="flex-shrink-0 min-h-48 bg-slate-50/50 flex items-end justify-center p-4">
                  <img
                    src="/images/background/create_employee.png"
                    alt=""
                    className="max-w-full max-h-56 w-auto h-auto object-contain object-left-bottom"
                  />
                </div> */}
              </div>
            </div>
          </>
        )}

        {showCreateSuccess && (
          <SuccessModal
            isOpen={showCreateSuccess}
            onClose={() => setShowCreateSuccess(false)}
            title={successModalTitle}
            message={successModalMessage}
          />
        )}

        {showCreateLoading && (
          <LoadingModal
            isOpen={showCreateLoading}
            title="Creating Employee"
            message="Please wait while we create the employee account and send the login credentials..."
          />
        )}

        {showSaveLoading && (
          <LoadingModal
            isOpen={showSaveLoading}
            title={saveLoadingAction === 'approve' ? 'Approving Employee' : 'Updating Employee'}
            message={saveLoadingAction === 'approve' ? 'Please wait while we approve the employee...' : 'Please wait while we update the employee profile...'}
          />
        )}

        {showCreateFail && (
          <FailModal
            isOpen={showCreateFail}
            onClose={() => setShowCreateFail(false)}
            title={failModalTitle}
            message={createFailMessage}
            buttonText="OK"
          />
        )}

        {detailLoadError && (
          <FailModal
            isOpen={!!detailLoadError}
            onClose={() => {
              setDetailLoadError(null)
              closeDetailDrawer()
            }}
            title="Failed to Load Employee"
            message={detailLoadError}
            buttonText="Close"
          />
        )}

        {/* Employee Detail Sliding Drawer */}
        {(detailDrawerOpen || detailDrawerClosing) && (
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
                detailDrawerClosing ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={closeDetailDrawer}
              aria-hidden="true"
            />
            <div
              className="fixed top-0 right-0 h-full w-full max-w-4xl bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden"
              style={{
                animation: detailDrawerClosing
                  ? 'slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards'
                  : 'slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
                boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      {detailEmployee
                        ? `${detailEmployee.first_name} ${detailEmployee.last_name}`
                        : loadingDetail
                          ? 'Loading...'
                          : 'Employee Details'}
                    </h2>
                    {detailEmployee?.email && (
                      <p className="text-sm text-white/90 mt-0.5">{detailEmployee.email}</p>
                    )}
                  </div>
                  {detailEmployee && (
                    <Badge
                      className={`${statusBadgeColors[(detailEmployee.status as 'pending' | 'approved' | 'terminated') || 'pending']} border-2 text-sm py-0.5 px-2`}
                    >
                      {statusLabels[(detailEmployee.status as 'pending' | 'approved' | 'terminated') || 'pending']}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={closeDetailDrawer}
                  className="p-2 rounded-md hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {loadingDetail ? (
                  <div className="flex-1 flex min-h-0">
                    <EmployeeDetailSkeleton />
                  </div>
                ) : !detailEmployee ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load employee details.</p>
                  </div>
                ) : (
                  <EmployeeDetailContent
                    employee={detailEmployee}
                    formData={detailFormData}
                    onFormDataChange={setDetailFormData}
                    isEditing={detailEditing}
                  />
                )}
              </div>
              {detailEmployee && (
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
                  {detailEditing ? (
                    <>
                      <button
                        onClick={() => setDetailEditing(false)}
                        className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                        style={{ borderColor: BORDER }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEmployee(detailFormData)}
                        disabled={savingEmployee}
                        className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60"
                        style={{ background: '#7a0f1f' }}
                      >
                        {savingEmployee ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setDetailFormData({ ...detailEmployee })
                          setDetailEditing(true)
                        }}
                        className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                        style={{ borderColor: '#7a0f1f', color: '#7a0f1f' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleApproveEmployee}
                        disabled={
                          detailEmployee.status === 'approved' ||
                          !hasAllRequiredFields(detailEmployee) ||
                          savingEmployee
                        }
                        className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#7a0f1f' }}
                      >
                        {savingEmployee ? 'Approving...' : 'Approve'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
        </main>
      </div>
    </div>
  )
}

function EmployeeDetailSkeleton() {
  return (
    <div className="flex gap-0 min-h-0 flex-1 animate-pulse">
      <div className="flex-shrink-0 w-52 py-2 border-r" style={{ borderColor: BORDER }}>
        <div className="flex flex-col gap-0.5 px-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-md mx-2" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 min-w-0">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((j) => (
            <div key={j}>
              <div className="h-3 bg-slate-100 rounded w-20 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const DETAIL_TABS = [
  { id: 'employee', label: 'Employee Details' },
  { id: 'personal', label: 'Personal Information' },
  { id: 'contact', label: 'Contact Information' },
  { id: 'government', label: 'Government ID Numbers' },
  { id: 'family', label: 'Family Information' },
  { id: 'address', label: 'Address Information' },
] as const

const POSITION_OPTIONS = [
  'Executive Assistant', 'Admin Assistant', 'Admin Head', 'Accounting Supervisor', 'Accounting Assistant',
  'Property Specialist', 'Senior Property Specialist', 'Junior Web Developer', 'Senior Web Developer',
  'IT Supervisor', 'Sales Supervisor', 'Junior IT Manager', 'Senior IT Manager', 'Marketing Staff',
  'Assistant Studio Manager', 'Studio Manager', 'Multimedia Manager',
]

function EmployeeDetailContent({
  employee,
  formData,
  onFormDataChange,
  isEditing,
}: {
  employee: EmployeeDetails
  formData: Partial<EmployeeDetails>
  onFormDataChange: (d: Partial<EmployeeDetails> | ((prev: Partial<EmployeeDetails>) => Partial<EmployeeDetails>)) => void
  isEditing: boolean
}) {
  const [activeTab, setActiveTab] = useState<(typeof DETAIL_TABS)[number]['id']>('employee')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([])
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ code: string; name: string }[]>([])
  const [barangays, setBarangays] = useState<{ code: string; name: string }[]>([])

  const data = isEditing ? formData : employee

  const scrollToSection = (id: string) => {
    setActiveTab(id as (typeof DETAIL_TABS)[number]['id'])
    const el = scrollRef.current?.querySelector(`[data-section="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    onFormDataChange((prev) => ({ ...prev, [name]: value }))
  }

  const fetchRegions = async () => {
    try {
      const res = await fetch('https://psgc.gitlab.io/api/regions/')
      const raw = await res.json()
      const arr = Array.isArray(raw) ? raw : raw.data || []
      setRegions(arr.map((r: any) => ({ code: r.code, name: r.name })))
    } catch {
      setRegions([])
    }
  }

  const fetchProvinces = async (regionCode: string) => {
    if (!regionCode) {
      setProvinces([])
      setCities([])
      setBarangays([])
      return
    }
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`)
      const raw = await res.json()
      const arr = Array.isArray(raw) ? raw : raw.data || []
      setProvinces(arr.map((p: any) => ({ code: p.code, name: p.name })))
      setCities([])
      setBarangays([])
      onFormDataChange((prev) => ({ ...prev, province: '', city_municipality: '', barangay: '' }))
    } catch {
      setProvinces([])
    }
  }

  const fetchCities = async (provinceCode: string) => {
    if (!provinceCode) {
      setCities([])
      setBarangays([])
      return
    }
    try {
      const [cRes, mRes] = await Promise.all([
        fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities/`),
        fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/municipalities/`),
      ])
      const cData = cRes.ok ? await cRes.json() : []
      const mData = mRes.ok ? await mRes.json() : []
      const cArr = Array.isArray(cData) ? cData : cData.data || []
      const mArr = Array.isArray(mData) ? mData : mData.data || []
      const all = [...cArr, ...mArr].map((x: any) => ({ code: x.code, name: x.name }))
      setCities(all)
      setBarangays([])
      onFormDataChange((prev) => ({ ...prev, city_municipality: '', barangay: '' }))
    } catch {
      setCities([])
    }
  }

  const fetchBarangays = async (cityOrMunCode: string) => {
    if (!cityOrMunCode) {
      setBarangays([])
      return
    }
    try {
      let res = await fetch(`https://psgc.gitlab.io/api/cities/${cityOrMunCode}/barangays/`)
      if (!res.ok) {
        res = await fetch(`https://psgc.gitlab.io/api/municipalities/${cityOrMunCode}/barangays/`)
      }
      const raw = await res.json()
      const arr = Array.isArray(raw) ? raw : raw.data || []
      setBarangays(arr.map((b: any) => ({ code: b.code, name: b.name })))
      onFormDataChange((prev) => ({ ...prev, barangay: '' }))
    } catch {
      setBarangays([])
    }
  }

  useEffect(() => {
    fetchRegions()
  }, [])

  useEffect(() => {
    if (!formData.region || regions.length === 0 || !isEditing) return
    const r = regions.find((x) => x.name === formData.region)
    if (r) fetchProvinces(r.code)
  }, [formData.region, regions.length, isEditing])

  useEffect(() => {
    if (!formData.province || provinces.length === 0 || !isEditing) return
    const p = provinces.find((x) => x.name === formData.province)
    if (p) fetchCities(p.code)
  }, [formData.province, provinces.length, isEditing])

  useEffect(() => {
    if (!formData.city_municipality || cities.length === 0 || !isEditing) return
    const c = cities.find((x) => x.name === formData.city_municipality)
    if (c) fetchBarangays(c.code)
  }, [formData.city_municipality, cities.length, isEditing])

  const onAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    onFormDataChange((prev) => ({ ...prev, [name]: value }))
    if (name === 'region') {
      const r = regions.find((x) => x.name === value)
      if (r) fetchProvinces(r.code)
    } else if (name === 'province') {
      const p = provinces.find((x) => x.name === value)
      if (p) fetchCities(p.code)
    } else if (name === 'city_municipality') {
      const c = cities.find((x) => x.name === value)
      if (c) fetchBarangays(c.code)
    }
  }

  const inputCls = 'flex h-9 w-full rounded-md border px-3 py-1 text-sm'
  const selectCls = 'flex h-9 w-full rounded-md border border-slate-200 px-3 py-2 text-sm'

  return (
    <div className="flex gap-0 min-h-0 flex-1">
      <div className="flex-shrink-0 w-52 py-2 border-r" style={{ borderColor: BORDER }}>
        <nav className="flex flex-col gap-0.5 px-2">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-[#800020]/15 text-[#800020]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 min-w-0 space-y-6">
        <div data-section="employee" className={`scroll-mt-4 rounded-lg p-4 transition-all duration-200 ${activeTab === 'employee' ? 'bg-[#800020]/8 ring-2 ring-[#800020]/40' : ''}`}>
          <DetailSection title="EMPLOYEE DETAILS">
            {isEditing ? (
              <>
                <div>
                  <Label className="text-xs font-medium text-slate-600">POSITION <span className="text-red-500">*</span></Label>
                  <select name="position" value={data.position || ''} onChange={handleChange} className={selectCls}>
                    <option value="">Select...</option>
                    {POSITION_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">DATE HIRED</Label>
                  <Input type="date" name="date_hired" value={formatDateForInput(data.date_hired)} onChange={handleChange} className="h-9" />
                </div>
              </>
            ) : (
              <>
                <DetailRow label="POSITION" value={data.position} />
                <DetailRow label="DATE HIRED" value={data.date_hired ? new Date(data.date_hired).toLocaleDateString() : null} />
              </>
            )}
          </DetailSection>
        </div>

        <div data-section="personal" className={`scroll-mt-4 rounded-lg p-4 transition-all duration-200 ${activeTab === 'personal' ? 'bg-[#800020]/8 ring-2 ring-[#800020]/40' : ''}`}>
          <DetailSection title="PERSONAL INFORMATION">
            {isEditing ? (
              <>
                <DetailInput label="LAST NAME" name="last_name" value={data.last_name} onChange={handleChange} inputCls={inputCls} required />
                <DetailInput label="FIRST NAME" name="first_name" value={data.first_name} onChange={handleChange} inputCls={inputCls} required />
                <DetailInput label="MIDDLE NAME" name="middle_name" value={data.middle_name} onChange={handleChange} inputCls={inputCls} />
                <DetailInput label="SUFFIX" name="suffix" value={data.suffix} onChange={handleChange} inputCls={inputCls} />
                <div>
                  <Label className="text-xs font-medium text-slate-600">BIRTHDAY <span className="text-red-500">*</span></Label>
                  <Input type="date" name="birthday" value={formatDateForInput(data.birthday)} onChange={handleChange} className="h-9" />
                </div>
                <DetailInput label="BIRTHPLACE" name="birthplace" value={data.birthplace} onChange={handleChange} inputCls={inputCls} required />
                <div>
                  <Label className="text-xs font-medium text-slate-600">CIVIL STATUS <span className="text-red-500">*</span></Label>
                  <select name="civil_status" value={data.civil_status || ''} onChange={handleChange} className={selectCls}>
                    <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">GENDER <span className="text-red-500">*</span></Label>
                  <select name="gender" value={data.gender || ''} onChange={handleChange} className={selectCls}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <DetailRow label="LAST NAME" value={data.last_name} />
                <DetailRow label="FIRST NAME" value={data.first_name} />
                <DetailRow label="MIDDLE NAME" value={data.middle_name} />
                <DetailRow label="SUFFIX" value={data.suffix} />
                <DetailRow label="BIRTHDAY" value={data.birthday ? new Date(data.birthday).toLocaleDateString() : null} />
                <DetailRow label="BIRTHPLACE" value={data.birthplace} />
                <DetailRow label="CIVIL STATUS" value={data.civil_status} />
                <DetailRow label="GENDER" value={data.gender} />
              </>
            )}
          </DetailSection>
        </div>

        <div data-section="contact" className={`scroll-mt-4 rounded-lg p-4 transition-all duration-200 ${activeTab === 'contact' ? 'bg-[#800020]/8 ring-2 ring-[#800020]/40' : ''}`}>
          <DetailSection title="CONTACT INFORMATION">
            {isEditing ? (
              <>
                <DetailInput label="MOBILE NUMBER" name="mobile_number" value={data.mobile_number} onChange={handleChange} inputCls={inputCls} required />
                <DetailInput label="PHONE NUMBER" name="phone_number" value={data.phone_number} onChange={handleChange} inputCls={inputCls} />
                <DetailInput label="EMAIL ADDRESS" name="email_address" value={data.email_address || data.email} onChange={handleChange} inputCls={inputCls} required />
              </>
            ) : (
              <>
                <DetailRow label="MOBILE NUMBER" value={data.mobile_number} />
                <DetailRow label="PHONE NUMBER" value={data.phone_number} />
                <DetailRow label="EMAIL ADDRESS" value={data.email_address || data.email} />
              </>
            )}
          </DetailSection>
        </div>

        <div data-section="government" className={`scroll-mt-4 rounded-lg p-4 transition-all duration-200 ${activeTab === 'government' ? 'bg-[#800020]/8 ring-2 ring-[#800020]/40' : ''}`}>
          <DetailSection title="GOVERNMENT ID NUMBERS">
            {isEditing ? (
              <>
                <DetailInput label="SSS NUMBER" name="sss_number" value={data.sss_number} onChange={handleChange} inputCls={inputCls} />
                <DetailInput label="PHILHEALTH NUMBER" name="philhealth_number" value={data.philhealth_number} onChange={handleChange} inputCls={inputCls} />
                <DetailInput label="PAG-IBIG NUMBER" name="pagibig_number" value={data.pagibig_number} onChange={handleChange} inputCls={inputCls} />
                <DetailInput label="TIN NUMBER" name="tin_number" value={data.tin_number} onChange={handleChange} inputCls={inputCls} />
              </>
            ) : (
              <>
                <DetailRow label="SSS NUMBER" value={data.sss_number} />
                <DetailRow label="PHILHEALTH NUMBER" value={data.philhealth_number} />
                <DetailRow label="PAG-IBIG NUMBER" value={data.pagibig_number} />
                <DetailRow label="TIN NUMBER" value={data.tin_number} />
              </>
            )}
          </DetailSection>
        </div>

        <div data-section="family" className={`scroll-mt-4 rounded-lg p-4 transition-all duration-200 ${activeTab === 'family' ? 'bg-[#800020]/8 ring-2 ring-[#800020]/40' : ''}`}>
          <DetailSection title="FAMILY INFORMATION" grid={false}>
            <p className="text-slate-700 font-semibold mb-2 text-sm">MOTHER&apos;S MAIDEN NAME</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {isEditing ? (
                <>
                  <DetailInput label="MLAST NAME" name="mlast_name" value={data.mlast_name} onChange={handleChange} inputCls={inputCls} required />
                  <DetailInput label="MFIRST NAME" name="mfirst_name" value={data.mfirst_name} onChange={handleChange} inputCls={inputCls} required />
                  <DetailInput label="MMIDDLE NAME" name="mmiddle_name" value={data.mmiddle_name} onChange={handleChange} inputCls={inputCls} />
                  <DetailInput label="MSUFFIX" name="msuffix" value={data.msuffix} onChange={handleChange} inputCls={inputCls} />
                </>
              ) : (
                <>
                  <DetailRow label="MLAST NAME" value={data.mlast_name} />
                  <DetailRow label="MFIRST NAME" value={data.mfirst_name} />
                  <DetailRow label="MMIDDLE NAME" value={data.mmiddle_name} />
                  <DetailRow label="MSUFFIX" value={data.msuffix} />
                </>
              )}
            </div>
            <p className="text-slate-700 font-semibold mb-2 text-sm">FATHER&apos;S NAME</p>
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <DetailInput label="FLAST NAME" name="flast_name" value={data.flast_name} onChange={handleChange} inputCls={inputCls} required />
                  <DetailInput label="FFIRST NAME" name="ffirst_name" value={data.ffirst_name} onChange={handleChange} inputCls={inputCls} required />
                  <DetailInput label="FMIDDLE NAME" name="fmiddle_name" value={data.fmiddle_name} onChange={handleChange} inputCls={inputCls} />
                  <DetailInput label="FSUFFIX" name="fsuffix" value={data.fsuffix} onChange={handleChange} inputCls={inputCls} />
                </>
              ) : (
                <>
                  <DetailRow label="FLAST NAME" value={data.flast_name} />
                  <DetailRow label="FFIRST NAME" value={data.ffirst_name} />
                  <DetailRow label="FMIDDLE NAME" value={data.fmiddle_name} />
                  <DetailRow label="FSUFFIX" value={data.fsuffix} />
                </>
              )}
            </div>
          </DetailSection>
        </div>

        <div data-section="address" className={`scroll-mt-4 rounded-lg p-4 transition-all duration-200 ${activeTab === 'address' ? 'bg-[#800020]/8 ring-2 ring-[#800020]/40' : ''}`}>
          <DetailSection title="ADDRESS INFORMATION">
            {isEditing ? (
              <>
                <DetailInput label="HOUSE NUMBER" name="house_number" value={data.house_number} onChange={onAddressChange} inputCls={inputCls} />
                <DetailInput label="STREET" name="street" value={data.street} onChange={onAddressChange} inputCls={inputCls} required />
                <DetailInput label="VILLAGE" name="village" value={data.village} onChange={onAddressChange} inputCls={inputCls} />
                <DetailInput label="SUBDIVISION" name="subdivision" value={data.subdivision} onChange={onAddressChange} inputCls={inputCls} />
                <div>
                  <Label className="text-xs font-medium text-slate-600">REGION <span className="text-red-500">*</span></Label>
                  <select name="region" value={data.region || ''} onChange={onAddressChange} className={selectCls}>
                    <option value="">Select Region...</option>
                    {regions.map((r) => <option key={r.code} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">PROVINCE <span className="text-red-500">*</span></Label>
                  <select name="province" value={data.province || ''} onChange={onAddressChange} disabled={!data.region} className={selectCls}>
                    <option value="">Select Province...</option>
                    {provinces.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">CITY / MUNICIPALITY <span className="text-red-500">*</span></Label>
                  <select name="city_municipality" value={data.city_municipality || ''} onChange={onAddressChange} disabled={!data.province} className={selectCls}>
                    <option value="">Select City...</option>
                    {cities.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">BARANGAY <span className="text-red-500">*</span></Label>
                  <select name="barangay" value={data.barangay || ''} onChange={onAddressChange} disabled={!data.city_municipality} className={selectCls}>
                    <option value="">Select Barangay...</option>
                    {barangays.map((b) => <option key={b.code} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <DetailInput label="ZIP CODE" name="zip_code" value={data.zip_code} onChange={onAddressChange} inputCls={inputCls} required />
              </>
            ) : (
              <>
                <DetailRow label="HOUSE NUMBER" value={data.house_number} />
                <DetailRow label="STREET" value={data.street} />
                <DetailRow label="VILLAGE" value={data.village} />
                <DetailRow label="SUBDIVISION" value={data.subdivision} />
                <DetailRow label="BARANGAY" value={data.barangay} />
                <DetailRow label="REGION" value={data.region} />
                <DetailRow label="PROVINCE" value={data.province} />
                <DetailRow label="CITY / MUNICIPALITY" value={data.city_municipality} />
                <DetailRow label="ZIP CODE" value={data.zip_code} />
              </>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  )
}

function DetailInput({
  label,
  name,
  value,
  onChange,
  inputCls,
  required,
}: {
  label: string
  name: string
  value: string | null | undefined
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  inputCls: string
  required?: boolean
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</Label>
      <Input name={name} value={value || ''} onChange={onChange} className={inputCls} />
    </div>
  )
}

function DetailSection({ title, children, grid = true }: { title: string; children: React.ReactNode; grid?: boolean }) {
  return (
    <div>
      <h4 className="text-base font-bold text-[#800020] mb-3 pb-2 border-b-2" style={{ borderColor: '#C9184A' }}>{title}</h4>
      {grid ? <div className="grid grid-cols-2 gap-4">{children}</div> : children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-slate-600 text-xs font-medium mb-0.5">{label}</p>
      <p className="text-slate-900 font-medium text-sm">{value || '-'}</p>
    </div>
  )
}

function EmployeeCardSkeleton() {
  return (
    <div
      className="rounded-lg bg-white border shadow-sm p-4 animate-pulse"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3 mt-1" />
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-16" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-8 bg-gray-200 rounded w-16" />
      </div>
    </div>
  )
}

function EmployeeTableSkeleton() {
  const cols = 'minmax(140px, 1.15fr) minmax(160px, 1.2fr) minmax(120px, 1fr) 96px 100px'
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
      <div
        className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900"
        style={{ gridTemplateColumns: cols }}
      >
        <div>Name</div>
        <div>Email</div>
        <div>Position</div>
        <div className="text-center">Status</div>
        <div className="text-right">Actions</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid items-center px-4 py-3 text-sm border-t animate-pulse"
          style={{ borderColor: BORDER, gridTemplateColumns: cols }}
        >
          <div className="min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="flex justify-center">
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
          <div className="flex justify-end">
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
