"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmployeeRegistrationForm } from '@/components/employee-registration-form'
import { Trash2, Plus, Settings2 } from 'lucide-react'

interface ApprovedEmployee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: string
}

interface Position {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
}

interface OnboardingData {
  employee_id: number
  first_name: string
  last_name: string
  position: string
  onboarding_date: string
  department: string
}

export default function OnboardPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<ApprovedEmployee[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [onboardingDate, setOnboardingDate] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')

  // Modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [managementModalType, setManagementModalType] = useState<'position' | 'department' | null>(null)
  const [newItemName, setNewItemName] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      await fetchApprovedEmployees()
      await fetchPositions()
      await fetchDepartments()
    }
    loadData()
  }, [])

  const fetchApprovedEmployees = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/employees`)
      const data = await response.json()

      if (data.success) {
        const approved = data.data.filter((emp: any) => emp.status === 'approved' || emp.status === 'pending')
        setEmployees(approved)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/positions`)
      const data = await response.json()
      if (data.success) {
        setPositions(data.data)
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
        setDepartments(data.data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleSelectEmployee = (employee: ApprovedEmployee) => {
    setSelectedEmployee({
      employee_id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      position: employee.position,
      onboarding_date: '',
      department: '',
    })
    setPosition(employee.position || '')
    setDepartment('')
    setOnboardingDate('')
    setShowForm(true)
  }

  const handleStartOnboarding = async () => {
    if (!selectedEmployee || !onboardingDate || !department || !position) {
      alert('Please fill in all fields')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/employees/${selectedEmployee.employee_id}/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position: position,
          department: department,
          onboarding_date: onboardingDate,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const onboardingData = {
          ...selectedEmployee,
          position: position,
          onboarding_date: onboardingDate,
          department: department,
        }
        sessionStorage.setItem('onboardingData', JSON.stringify(onboardingData))
        router.push('/admin-head/forms/onboarding')
      } else {
        alert('Error saving onboarding data: ' + data.message)
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      alert('Failed to save onboarding data')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItemName.trim() || !managementModalType) return

    setIsActionLoading(true)
    try {
      const endpoint = managementModalType === 'position' ? 'positions' : 'departments'
      const response = await fetch(`${getApiUrl()}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (managementModalType === 'position') {
          await fetchPositions()
        } else {
          await fetchDepartments()
        }
        setNewItemName('')
      } else {
        alert('Error adding item: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!managementModalType) return
    if (!confirm(`Are you sure you want to delete this ${managementModalType}?`)) return

    setIsActionLoading(true)
    try {
      const endpoint = managementModalType === 'position' ? 'positions' : 'departments'
      const response = await fetch(`${getApiUrl()}/api/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        if (managementModalType === 'position') {
          await fetchPositions()
          if (position === data.name) setPosition('')
        } else {
          await fetchDepartments()
          if (department === data.name) setDepartment('')
        }
      } else {
        alert('Error deleting item: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedEmployee(null)
    setOnboardingDate('')
    setDepartment('')
    setPosition('')
  }

  return (
    <div className="min-h-screen">
      {/* Maroon Gradient Header */}
      <div className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] text-white shadow-lg p-8 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-3">Onboard Employee</h1>
          <p className="text-rose-100 text-lg">Select approved employees to onboard into the system</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#FFE5EC]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#800020]">Approved Employees</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagementModalType('position')}
                className="border-[#C9184A] text-[#800020] hover:bg-rose-50"
              >
                <Settings2 className="mr-1 h-4 w-4" />
                Manage Positions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagementModalType('department')}
                className="border-[#C9184A] text-[#800020] hover:bg-rose-50"
              >
                <Settings2 className="mr-1 h-4 w-4" />
                Manage Departments
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A0153E] mx-auto mb-4"></div>
              <p className="text-slate-500">Loading employees...</p>
            </div>
          ) : employees.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No approved employees found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
                  <tr className="border-b-2 border-[#C9184A]">
                    <th className="text-left py-3 px-4 font-semibold text-[#800020]">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#800020]">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#800020]">Position</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#800020]">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#800020]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-slate-100 hover:bg-[#FFE5EC] transition-colors duration-200">
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{employee.email}</td>
                      <td className="py-3 px-4 text-slate-700">{employee.position || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-50 text-[#800020] border-[#A0153E] border-2">
                          {employee.status === 'approved' ? 'Approved' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          onClick={() => handleSelectEmployee(employee)}
                          className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300"
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Form Modal */}
      {showForm && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border-2 border-[#C9184A]">
            <div className="p-6 border-b-2 border-[#C9184A] bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A]">
              <h2 className="text-2xl font-bold text-white">
                Onboard {selectedEmployee.first_name} {selectedEmployee.last_name}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#FFE5EC] p-4 rounded-lg border border-[#C9184A]">
                <div>
                  <p className="text-slate-600 text-sm">Full Name</p>
                  <p className="text-slate-900 font-medium">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#800020] mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                >
                  <option value="">Select Position...</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.name}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#800020] mb-1">
                  Onboarding Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={onboardingDate}
                  onChange={(e) => setOnboardingDate(e.target.value)}
                  className="focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#800020] mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                >
                  <option value="">Select Department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t-2 border-[#C9184A] bg-gradient-to-r from-[#FFE5EC] to-rose-50 flex gap-3 justify-end">
              <Button
                onClick={handleCloseForm}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartOnboarding}
                className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'START ONBOARDING'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent className="sm:max-w-[500px] border-2 border-[#C9184A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-6 text-white">
            <DialogTitle className="text-2xl font-bold">Create New Employee</DialogTitle>
            <DialogDescription className="text-rose-100">
              Register a new employee. They will appear here once approved.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <EmployeeRegistrationForm
              onSuccess={() => {
                setShowRegistrationModal(false)
                fetchApprovedEmployees()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Management Modal (Positions/Departments) */}
      <Dialog
        open={managementModalType !== null}
        onOpenChange={(open) => !open && setManagementModalType(null)}
      >
        <DialogContent className="sm:max-w-[500px] border-2 border-[#C9184A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-6 text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold font-montserrat">
                Manage {managementModalType === 'position' ? 'Positions' : 'Departments'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-6">
            {/* Add New Input */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder={`New ${managementModalType}...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                className="focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
              />
              <Button
                onClick={handleAddItem}
                disabled={isActionLoading || !newItemName.trim()}
                className="bg-[#800020] hover:bg-[#A0153E] text-white"
              >
                Add
              </Button>
            </div>

            {/* List */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200 max-h-[300px] overflow-y-auto">
              {(managementModalType === 'position' ? positions : departments).length === 0 ? (
                <p className="p-4 text-center text-slate-500">No items found.</p>
              ) : (
                (managementModalType === 'position' ? positions : departments).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 hover:bg-rose-50 transition-colors">
                    <span className="text-slate-700 font-medium">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={isActionLoading}
                      className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 h-11 w-11 p-0 rounded-lg shadow-sm transition-all duration-200"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end">
            <Button onClick={() => setManagementModalType(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
