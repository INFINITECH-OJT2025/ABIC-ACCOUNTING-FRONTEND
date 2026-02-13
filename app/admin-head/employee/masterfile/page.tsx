"use client"

import React, { useEffect, useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'

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

export default function MasterfilePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const filtered = employees.filter((emp) => {
      const query = searchQuery.toLowerCase()
      return (
        emp.first_name?.toLowerCase().includes(query) ||
        emp.last_name?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query)
      )
    })
    setFilteredEmployees(filtered)
  }, [searchQuery, employees])

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

  const handleStatusUpdate = async (newStatus: 'pending' | 'approved' | 'terminated') => {
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

  return (
    <div className="min-h-screen">
      {/* Maroon Gradient Header */}
      <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-3">Employee Masterfile</h1>
        <p className="text-rose-100 text-lg">Manage employee master data and records</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-[#FFE5EC]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-[#800020]">Employee List</h2>
          <Button
            onClick={() => setShowRegistrationModal(true)}
            className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white font-bold px-6 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            + CREATE EMPLOYEE
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by name, email, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
          />
        </div>

        {loading ? (
          <p className="text-slate-500">Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="text-slate-500">
            {employees.length === 0
              ? 'No employees found. Create one using the button above.'
              : 'No employees match your search.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
                <tr className="border-b-2 border-[#C9184A]">
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Position</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-slate-100 hover:bg-[#FFE5EC] transition-colors duration-200">
                    <td className="py-3 px-4 text-slate-700 font-medium">{employee.first_name} {employee.last_name}</td>
                    <td className="py-3 px-4 text-slate-700">{employee.email}</td>
                    <td className="py-3 px-4 text-slate-700">{employee.position || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${statusBadgeColors[employee.status]} border`}>
                        {statusLabels[employee.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm">
                      {new Date(employee.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white border-0 transition-all duration-300"
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
        )}
      </div>

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border-2 border-[#C9184A]">
            <div className="p-6 border-b-2 border-[#C9184A] sticky top-0 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:text-rose-100 text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
              {/* Current Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">Current Status:</span>
                <Badge className={`${statusBadgeColors[selectedEmployee.status]} border-2 text-base py-1 px-3`}>
                  {statusLabels[selectedEmployee.status]}
                </Badge>
              </div>
            </div>

            <div className="p-6">
              {/* EMPLOYEE DETAILS */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#800020] mb-4 pb-2 border-b-2 border-[#C9184A]">EMPLOYEE DETAILS</h3>
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
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#800020] mb-4 pb-2 border-b-2 border-[#C9184A]">PERSONAL INFORMATION</h3>
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
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#800020] mb-4 pb-2 border-b-2 border-[#C9184A]">CONTACT INFORMATION</h3>
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
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#800020] mb-4 pb-2 border-b-2 border-[#C9184A]">GOVERNMENT ID NUMBERS</h3>
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
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#800020] mb-4 pb-2 border-b-2 border-[#C9184A]">FAMILY INFORMATION</h3>
                <div className="mb-6">
                  <p className="text-slate-700 font-semibold mb-3">MOTHER'S MAIDEN NAME</p>
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
                  <p className="text-slate-700 font-semibold mb-3">FATHER'S NAME <span className="text-slate-400 text-xs">(NOT REQUIRED)</span></p>
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
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#800020] mb-4 pb-2 border-b-2 border-[#C9184A]">ADDRESS INFORMATION</h3>
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

              {/* Status Requirements Check */}
              <div className="mb-6 p-4 bg-[#FFE5EC] rounded-lg border-2 border-[#C9184A]">
                <p className="text-slate-700 text-sm font-medium">
                  <span className="text-[#800020] font-semibold">ℹ️ Required fields check:</span> All fields marked with <span className="text-red-500">*</span> must be filled to approve this employee.
                </p>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="p-6 border-t-2 border-[#C9184A] bg-gradient-to-r from-[#FFE5EC] to-rose-50 sticky bottom-0">
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updatingStatus || selectedEmployee.status === 'approved' || !isEmployeeComplete(selectedEmployee)}
                  className={`${!isEmployeeComplete(selectedEmployee) ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A]'} text-white transition-all duration-300`}
                >
                  {updatingStatus ? 'Updating...' : 'Approve Employee'}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('terminated')}
                  disabled={updatingStatus || selectedEmployee.status === 'terminated'}
                  className={`bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300 ${updatingStatus || selectedEmployee.status === 'terminated' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Terminate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Registration Modal */}
      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent className="sm:max-w-[500px] border-2 border-[#C9184A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-6 text-white">
            <DialogTitle className="text-2xl font-bold">Create New Employee</DialogTitle>
            <DialogDescription className="text-rose-100">
              Fill in the details below to register a new employee.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
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
