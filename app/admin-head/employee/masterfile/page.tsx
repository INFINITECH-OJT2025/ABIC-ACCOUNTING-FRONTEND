"use client"

import React, { useEffect, useState } from 'react'
import { EmployeeRegistrationForm } from '@/components/employee-registration-form'
import { getApiUrl } from '@/lib/api'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  created_at: string
}

export default function MasterfilePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/employees`)
      const data = await response.json()
      if (data.success) {
        setEmployees(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Employee Masterfile</h1>
      <p className="text-slate-600 mb-8">Manage employee master data and records</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div>
          <EmployeeRegistrationForm />
        </div>

        {/* Employees List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Employee List</h2>

            {loading ? (
              <p className="text-slate-500">Loading employees...</p>
            ) : employees.length === 0 ? (
              <p className="text-slate-500">No employees found. Create one using the form.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-700">{employee.first_name} {employee.last_name}</td>
                        <td className="py-3 px-4 text-slate-700">{employee.email}</td>
                        <td className="py-3 px-4 text-slate-500 text-sm">
                          {new Date(employee.created_at).toLocaleDateString()}
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
    </div>
  )
}
