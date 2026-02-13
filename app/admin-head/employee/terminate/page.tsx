"use client"

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: string
}

interface TerminationFormData {
  termination_date: string
  reason: string
  notes: string
}

export default function TerminatePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<TerminationFormData>({
    termination_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl()}/api/employees`)
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        // Filter to show only active employees
        const activeEmployees = data.data.filter(
          (emp: Employee) => emp.status !== 'terminated'
        )
        setEmployees(activeEmployees)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const handleTerminateClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      termination_date: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    })
    setDialogOpen(true)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.reason.trim()) {
      toast.error('Reason is required')
      return
    }

    if (formData.reason.length < 5) {
      toast.error('Reason must be at least 5 characters')
      return
    }

    if (!selectedEmployee) {
      toast.error('No employee selected')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(
        `${getApiUrl()}/api/employees/${selectedEmployee.id}/terminate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            termination_date: formData.termination_date,
            reason: formData.reason,
            notes: formData.notes,
            status: 'completed',
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Employee terminated successfully')
        setDialogOpen(false)
        setSelectedEmployee(null)
        // Refresh employee list
        fetchEmployees()
      } else {
        toast.error(data.message || 'Failed to terminate employee')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to terminate employee')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-600">Loading employees...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Maroon Gradient Header */}
      <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-3">
          Terminate Employee
        </h1>
        <p className="text-rose-100 text-lg">
          Process employee termination with reason and documentation
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg border-2 border-[#FFE5EC]">
        {employees.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-500">No active employees to terminate</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
                <TableRow className="border-b-2 border-[#C9184A]">
                  <TableHead className="text-[#800020] font-semibold">Employee ID</TableHead>
                  <TableHead className="text-[#800020] font-semibold">Name</TableHead>
                  <TableHead className="text-[#800020] font-semibold">Email</TableHead>
                  <TableHead className="text-[#800020] font-semibold">Position</TableHead>
                  <TableHead className="text-[#800020] font-semibold">Status</TableHead>
                  <TableHead className="text-right text-[#800020] font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-[#FFE5EC] transition-colors duration-200">
                    <TableCell>#{employee.id}</TableCell>
                    <TableCell className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.position || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-[#800020] border border-[#A0153E]">
                        {employee.status || 'active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={dialogOpen && selectedEmployee?.id === employee.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300"
                            size="sm"
                            onClick={() => handleTerminateClick(employee)}
                          >
                            Terminate
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] border-2 border-[#C9184A]">
                          <DialogHeader className="bg-gradient-to-r from-[#FFE5EC] to-rose-50 -m-6 mb-6 p-6 rounded-t-lg border-b-2 border-[#C9184A]">
                            <DialogTitle className="text-[#800020] text-2xl">Terminate Employee</DialogTitle>
                            <DialogDescription className="text-slate-700">
                              Terminating: <strong className="text-[#800020]">{selectedEmployee?.first_name} {selectedEmployee?.last_name}</strong>
                            </DialogDescription>
                          </DialogHeader>

                          <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Termination Date */}
                            <div className="space-y-2">
                              <Label htmlFor="termination_date" className="text-[#800020] font-semibold">
                                Termination Date
                              </Label>
                              <Input
                                id="termination_date"
                                name="termination_date"
                                type="date"
                                value={formData.termination_date}
                                onChange={handleInputChange}
                                required
                                className="focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
                              />
                            </div>

                            {/* Reason - Required */}
                            <div className="space-y-2">
                              <Label htmlFor="reason" className="text-[#800020] font-semibold">
                                Reason for Termination <span className="text-red-500">*</span>
                              </Label>
                              <textarea
                                id="reason"
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                placeholder="Enter the reason for termination (minimum 5 characters)"
                                required
                                minLength={5}
                                maxLength={1000}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] resize-none"
                                rows={4}
                              />
                              <p className="text-xs text-slate-500">
                                {formData.reason.length}/1000 characters
                              </p>
                            </div>

                            {/* Notes - Optional */}
                            <div className="space-y-2">
                              <Label htmlFor="notes" className="text-[#800020] font-semibold">Additional Notes (Optional)</Label>
                              <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Any additional notes or comments"
                                maxLength={1000}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] resize-none"
                                rows={3}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                disabled={submitting}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300 disabled:opacity-50"
                                disabled={submitting || !formData.reason.trim() || formData.reason.length < 5}
                              >
                                {submitting ? 'Processing...' : 'Confirm Termination'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
