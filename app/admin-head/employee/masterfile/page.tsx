"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmployeeRegistrationForm } from '@/components/employee-registration-form'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

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
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [additionalValues, setAdditionalValues] = useState<AdditionalFieldValue[]>([])

  useEffect(() => {
    fetchEmployees()
  }, [])

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

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#4A081A] tracking-tight">Employee Records</h1>
          <p className="text-slate-500 mt-1">Manage and monitor employee master data and records.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/admin-head/employee/additional-info')}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-100 font-medium px-4 h-11 rounded-lg transition-all"
          >
            Additional Information
          </Button>
          <Button
            onClick={() => setShowRegistrationModal(true)}
            className="bg-[#630C22] hover:bg-[#4A081A] text-white font-bold px-6 h-11 rounded-lg transition-all shadow-sm"
          >
            + CREATE EMPLOYEE
          </Button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-slate-200 py-6 pl-10 focus:ring-[#630C22] focus:border-[#630C22] rounded-xl"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading employees...</p>
        ) : (
          <div className="space-y-10">
            {/* Pending Employees — Card Grid */}
            {pendingList.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-amber-700 mb-4 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
                  Pending Approval
                  <span className="ml-2 text-sm font-normal text-slate-500">({pendingList.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pendingList.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => fetchEmployeeDetails(employee.id)}
                      className="group bg-white border border-slate-200 hover:border-[#630C22] rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#4A081A] text-lg font-bold group-hover:bg-[#4A081A] group-hover:text-white transition-colors duration-200">
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

                      <div className="flex justify-between items-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          PENDING
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Click to view</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Employed Employees */}
            <div>
              <h3 className="text-lg font-bold text-emerald-700 mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
                Employed
                <span className="ml-2 text-sm font-normal text-slate-500">({employedList.length})</span>
              </h3>
              <EmployeeTable
                list={employedList}
                emptyMessage={searchQuery ? 'No employed employees match your search.' : 'No employed employees found.'}
              />
            </div>

            {/* Terminated Employees */}
            <div>
              <h3 className="text-lg font-bold text-rose-700 mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-rose-500"></span>
                Terminated
                <span className="ml-2 text-sm font-normal text-slate-500">({terminatedList.length})</span>
              </h3>
              <EmployeeTable
                list={terminatedList}
                emptyMessage={searchQuery ? 'No terminated employees match your search.' : 'No terminated employees found.'}
              />
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
                <Badge className={`${statusBadgeColors[selectedEmployee.status]} border font-semibold shadow-none`}>
                  {statusLabels[selectedEmployee.status]}
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
                    <p className="text-slate-900 font-medium text-base">{selectedEmployee.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">DATE HIRED <span className="text-red-500">*</span></p>
                    <p className="text-slate-900 font-medium text-base">
                      {selectedEmployee.date_hired
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
      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent className="sm:max-w-[500px] p-0 border-0 rounded-2xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-white border-b border-slate-100">
            <DialogTitle className="text-2xl font-bold text-[#4A081A] tracking-tight">Create New Employee</DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">
              Fill in the details below to register a new employee.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <EmployeeRegistrationForm 
              onSuccess={() => {
                setShowRegistrationModal(false)
                fetchEmployees()
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
