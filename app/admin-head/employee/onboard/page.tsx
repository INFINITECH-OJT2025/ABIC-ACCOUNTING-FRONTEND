"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ApprovedEmployee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: string
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
  const [positions, setPositions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [onboardingDate, setOnboardingDate] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [newPosition, setNewPosition] = useState('')
  const [showAddDepartment, setShowAddDepartment] = useState(false)
  const [newDepartment, setNewDepartment] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
        // Filter only approved employees
        const approved = data.data.filter((emp: any) => emp.status === 'approved')
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
        const positionNames = data.data.map((pos: any) => pos.name)
        setPositions(positionNames)
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
        const departmentNames = data.data.map((dept: any) => dept.name)
        setDepartments(departmentNames)
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
      // Submit onboarding data to API
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

        // Store data in sessionStorage for the next page
        sessionStorage.setItem('onboardingData', JSON.stringify(onboardingData))
        
        // Redirect to onboarding form
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

  const handleAddPosition = async () => {
    if (newPosition.trim()) {
      try {
        // Add new position to API
        const response = await fetch(`${getApiUrl()}/api/positions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newPosition.trim(),
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Update positions list
          setPositions([...positions, newPosition.trim()])
          setPosition(newPosition.trim())
          setNewPosition('')
          setShowAddPosition(false)
        } else {
          alert('Error adding position: ' + data.message)
        }
      } catch (error) {
        console.error('Error adding position:', error)
        alert('Failed to add position')
      }
    }
  }

  const handleAddDepartment = async () => {
    if (newDepartment.trim()) {
      try {
        // Add new department to API
        const response = await fetch(`${getApiUrl()}/api/departments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newDepartment.trim(),
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Update departments list
          setDepartments([...departments, newDepartment.trim()])
          setDepartment(newDepartment.trim())
          setNewDepartment('')
          setShowAddDepartment(false)
        } else {
          alert('Error adding department: ' + data.message)
        }
      } catch (error) {
        console.error('Error adding department:', error)
        alert('Failed to add department')
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedEmployee(null)
    setOnboardingDate('')
    setDepartment('')
    setPosition('')
    setNewPosition('')
    setShowAddPosition(false)
    setNewDepartment('')
    setShowAddDepartment(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A0153E] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading approved employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Maroon Gradient Header */}
      <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-3">Onboard Employee</h1>
        <p className="text-rose-100 text-lg">Select approved employees to onboard into the system</p>
      </div>

      {/* Main Content */}
      <div>
        {/* Approved Employees Table */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#FFE5EC]">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#800020] mb-4">Approved Employees</h2>
            
            {employees.length === 0 ? (
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
                            Approved
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
              {/* Employee Info Display */}
              <div className="bg-[#FFE5EC] p-4 rounded-lg border border-[#C9184A]">
                <div>
                  <p className="text-slate-600 text-sm">Full Name</p>
                  <p className="text-slate-900 font-medium">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </p>
                </div>
              </div>

              {/* Position Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-[#800020] mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                {!showAddPosition ? (
                  <div className="flex gap-2">
                    <select
                      value={position}
                      onChange={(e) => {
                        if (e.target.value === '__add__') {
                          setShowAddPosition(true)
                          setPosition('')
                        } else {
                          setPosition(e.target.value)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                    >
                      <option value="">Select Position...</option>
                      {positions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                      <option value="__add__">+ Add New Position</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      placeholder="Enter new position"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                      autoFocus
                    />
                    <Button
                      onClick={handleAddPosition}
                      size="sm"
                      className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300"
                    >
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddPosition(false)
                        setNewPosition('')
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Onboarding Date */}
              <div>
                <label className="block text-sm font-semibold text-[#800020] mb-1">
                  Onboarding Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={onboardingDate}
                  onChange={(e) => setOnboardingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                />
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-[#800020] mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                {!showAddDepartment ? (
                  <div className="flex gap-2">
                    <select
                      value={department}
                      onChange={(e) => {
                        if (e.target.value === '__add__') {
                          setShowAddDepartment(true)
                          setDepartment('')
                        } else {
                          setDepartment(e.target.value)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                      <option value="__add__">+ Add New Department</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="Enter new department"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                      autoFocus
                    />
                    <Button
                      onClick={handleAddDepartment}
                      size="sm"
                      className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300"
                    >
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddDepartment(false)
                        setNewDepartment('')
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
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
    </div>
  )
}
