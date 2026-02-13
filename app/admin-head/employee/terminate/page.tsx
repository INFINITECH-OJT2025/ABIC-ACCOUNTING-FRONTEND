"use client"

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api'
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
import { Users, FileText, Search, AlertCircle } from 'lucide-react'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: string
}

interface TerminationRecord {
  id: number
  employee_id: number
  termination_date: string
  reason: string
  notes: string
  status: string
  employee: Employee
  created_at?: string
}

interface TerminationFormData {
  termination_date: string
  reason: string
  notes: string
}

export default function TerminatePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [terminations, setTerminations] = useState<TerminationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedTermination, setSelectedTermination] = useState<TerminationRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showTerminatedModal, setShowTerminatedModal] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<TerminationFormData>({
    termination_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [empRes, termRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/employees`),
        fetch(`${getApiUrl()}/api/terminations`)
      ])

      const empData = await empRes.json()
      const termData = await termRes.json()

      if (empData.success && Array.isArray(empData.data)) {
        // Active employees (not terminated)
        const active = empData.data.filter(
          (emp: Employee) => emp.status !== 'terminated'
        )
        setEmployees(active)
      }

      if (termData.success && Array.isArray(termData.data)) {
        setTerminations(termData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = fetchData // Maintain compatibility for internal calls


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

    if (formData.reason.length < 10) {
      toast.error('Reason must be at least 10 characters')
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
        // Refresh data
        fetchData()
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

  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase()
    return (
      emp.first_name?.toLowerCase().includes(query) ||
      emp.last_name?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.position?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen pb-12">
      {/* Maroon Gradient Header */}
      <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              Terminate Employee
            </h1>
            <p className="text-rose-100 text-lg">
              Process employee termination with reason and documentation
            </p>
          </div>
          <Button
            onClick={() => setShowTerminatedModal(true)}
            className="bg-white text-[#800020] hover:bg-rose-50 font-bold px-6 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 h-auto py-3"
          >
            <Users className="h-5 w-5" />
            VIEW TERMINATED
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border-2 border-[#FFE5EC] overflow-hidden">
        <div className="p-6 border-b border-rose-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-[#800020]">Active Employees</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 focus:ring-rose-200 border-rose-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A0153E] mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading accounts...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-20 text-center bg-slate-50/50">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-lg">
              {employees.length === 0 
                ? "No active employees available for termination." 
                : "No employees match your search query."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-rose-50/50">
                <TableRow className="border-b-2 border-[#C9184A]">
                  <TableHead className="text-[#800020] font-bold py-4 pl-6 uppercase text-xs tracking-wider">Employee</TableHead>
                  <TableHead className="text-[#800020] font-bold uppercase text-xs tracking-wider">Contact</TableHead>
                  <TableHead className="text-[#800020] font-bold uppercase text-xs tracking-wider">Position</TableHead>
                  <TableHead className="text-[#800020] font-bold uppercase text-xs tracking-wider">Status</TableHead>
                  <TableHead className="text-right text-[#800020] font-bold py-4 pr-6 uppercase text-xs tracking-wider">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-rose-50/30 transition-colors duration-200 border-b border-rose-50">
                    <TableCell className="py-4 pl-6">
                      <div className="font-bold text-slate-900">{employee.first_name} {employee.last_name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ID: #{employee.id}</div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{employee.email}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{employee.position || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-50 text-[#800020] hover:bg-emerald-50 border-[#A0153E] border shadow-sm">
                        {employee.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white shadow-sm hover:shadow-md transition-all duration-300"
                        size="sm"
                        onClick={() => handleTerminateClick(employee)}
                      >
                        Terminate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Termination Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-2 border-[#C9184A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-6 text-white">
            <DialogTitle className="text-2xl font-bold">Terminate Employee</DialogTitle>
            <DialogDescription className="text-rose-100">
              Terminating: <strong className="text-white underline decoration-rose-300">{selectedEmployee?.first_name} {selectedEmployee?.last_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-[#800020] font-semibold">
                Reason for Termination <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Enter the reason for termination (min. 10 characters)..."
                required
                minLength={10}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] resize-none"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[#800020] font-semibold">Additional Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional documentation..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] resize-none"
                rows={3}
              />
            </div>

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
                className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300"
                disabled={submitting || formData.reason.length < 10}
              >
                {submitting ? 'Processing...' : 'Confirm Termination'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Terminated Employees View Modal */}
      <Dialog open={showTerminatedModal} onOpenChange={setShowTerminatedModal}>
        <DialogContent className="sm:max-w-4xl border-2 border-[#C9184A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-bold">Terminated Employee Accounts</DialogTitle>
                <DialogDescription className="text-rose-100">
                  History of terminated employees and reasons
                </DialogDescription>
              </div>
              <Badge className="bg-white text-[#800020] hover:bg-rose-50 px-3 py-1 text-sm border-0">
                {terminations.length} Total
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-6">
            {terminations.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No termination records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] border border-slate-200 rounded-lg shadow-inner">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-b-2 border-[#FFE5EC]">
                      <TableHead className="text-[#800020] font-bold">Employee</TableHead>
                      <TableHead className="text-[#800020] font-bold">Position</TableHead>
                      <TableHead className="text-[#800020] font-bold">Terminated On</TableHead>
                      <TableHead className="text-[#800020] font-bold">Reason (Preview)</TableHead>
                      <TableHead className="text-[#800020] font-bold text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terminations.map((record) => (
                      <TableRow key={record.id} className="hover:bg-rose-50 transition-colors">
                        <TableCell className="font-semibold text-slate-900 py-4">
                          {record.employee?.first_name} {record.employee?.last_name}
                          <p className="text-xs font-normal text-slate-500 mt-1">{record.employee?.email}</p>
                        </TableCell>
                        <TableCell className="text-slate-700">{record.employee?.position || 'N/A'}</TableCell>
                        <TableCell className="text-slate-700">
                          {record.termination_date ? new Date(record.termination_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : (record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A')}
                        </TableCell>
                        <TableCell className="text-slate-700 max-w-[300px]">
                          <div className="text-sm italic text-slate-500 truncate">
                            {record.reason || 'No reason provided'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#800020] hover:text-[#A0153E] hover:bg-rose-100 font-semibold"
                            onClick={() => {
                              setSelectedTermination(record)
                              setShowTerminatedModal(false)
                              setTimeout(() => setShowDetailDialog(true), 100)
                            }}
                          >
                            View details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <Button 
              onClick={() => setShowTerminatedModal(false)}
              className="bg-[#800020] hover:bg-[#A0153E] text-white px-8"
            >
              Close History
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Termination Detail View Modal */}
      <Dialog 
        open={showDetailDialog} 
        onOpenChange={(open) => {
          setShowDetailDialog(open)
          if (!open) {
            // Re-open history if details are closed
            setTimeout(() => setShowTerminatedModal(true), 100)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl border-2 border-[#C9184A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-6 text-white">
            <DialogTitle className="text-2xl font-bold">Termination Details</DialogTitle>
            <DialogDescription className="text-rose-100">
              Complete record for {selectedTermination?.employee?.first_name} {selectedTermination?.employee?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-8 bg-rose-50 p-4 rounded-lg border border-rose-100">
              <div>
                <Label className="text-[#800020] font-bold uppercase text-[10px] tracking-widest">Position</Label>
                <p className="text-slate-900 font-medium">{selectedTermination?.employee?.position || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-[#800020] font-bold uppercase text-[10px] tracking-widest">Effective Date</Label>
                <p className="text-slate-900 font-medium">
                  {selectedTermination?.termination_date ? new Date(selectedTermination.termination_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[#800020] font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <FileText className="h-3 w-3" /> Reason for Termination
              </Label>
              <div className="bg-white border-2 border-[#FFE5EC] rounded-xl p-5 text-slate-800 leading-relaxed shadow-sm min-h-[120px] max-h-[300px] overflow-y-auto">
                {selectedTermination?.reason || 'No reason provided'}
              </div>
            </div>

            {selectedTermination?.notes && (
              <div className="space-y-3">
                <Label className="text-[#800020] font-bold uppercase text-[10px] tracking-widest">Additional Notes</Label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-600 text-sm italic">
                  {selectedTermination.notes}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <Button 
              onClick={() => {
                setShowDetailDialog(false)
                // The onOpenChange will handle re-opening history
              }}
              className="bg-white text-[#800020] hover:bg-rose-50 border-[#800020] border font-bold"
            >
              Back to History
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
