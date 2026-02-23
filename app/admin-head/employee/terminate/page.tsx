"use client"

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Users, FileText, Check, ChevronsUpDown, X, Search, ArrowUpDown, History, Clock3, ArrowUpAZ, ArrowDownAZ } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedTermination, setSelectedTermination] = useState<TerminationRecord | null>(null)
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [rehireLoading, setRehireLoading] = useState<number | null>(null)
  const [formData, setFormData] = useState<TerminationFormData>({
    termination_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  })
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'az' | 'za'>('recent')

  const filteredTerminations = terminations
    .filter((record) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      const fullName = `${record.employee?.last_name ?? ''}, ${record.employee?.first_name ?? ''}`.toLowerCase()
      const reason = (record.reason ?? '').toLowerCase()
      const date = record.termination_date ? new Date(record.termination_date).toLocaleDateString() : ''
      return fullName.includes(q) || reason.includes(q) || date.includes(q)
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          return new Date(b.termination_date ?? 0).getTime() - new Date(a.termination_date ?? 0).getTime()
        case 'oldest':
          return new Date(a.termination_date ?? 0).getTime() - new Date(b.termination_date ?? 0).getTime()
        case 'az':
          return `${a.employee?.last_name} ${a.employee?.first_name}`.localeCompare(`${b.employee?.last_name} ${b.employee?.first_name}`)
        case 'za':
          return `${b.employee?.last_name} ${b.employee?.first_name}`.localeCompare(`${a.employee?.last_name} ${a.employee?.first_name}`)
        default:
          return 0
      }
    })

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant: "default" | "destructive" | "success" | "warning"
    confirmText?: string
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
    variant: 'default',
    confirmText: 'Confirm'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetchError(null)
    setLoading(true)
    try {
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
        ).sort((a: Employee, b: Employee) => a.last_name.localeCompare(b.last_name))
        setEmployees(active)
      }

      if (termData.success && Array.isArray(termData.data)) {
        setTerminations(termData.data)
      } else {
        toast.error('Failed to load termination history')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setFetchError('Network Error: Could not connect to the server.')
      toast.error('Network Error: Could not connect to the server.')
    } finally {
      setLoading(false)
      setIsActionLoading(false)
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployeeId) {
      toast.error('Please select an employee to terminate')
      return
    }

    if (!formData.reason.trim()) {
      toast.error('Reason is required')
      return
    }

    if (formData.reason.length < 10) {
      toast.error('Reason must be at least 10 characters')
      return
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Termination',
      description: 'Are you sure you want to proceed with this termination? This action can be reversed via re-hire.',
      variant: 'destructive',
      confirmText: 'Yes, Terminate',
      onConfirm: async () => {
        try {
          setSubmitting(true)
          const response = await fetch(
            `${getApiUrl()}/api/employees/${selectedEmployeeId}/terminate`,
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
            setSelectedEmployeeId('')
            setFormData({
              termination_date: new Date().toISOString().split('T')[0],
              reason: '',
              notes: '',
            })
            setIsRequestFormOpen(false)
            fetchData()
          } else {
            if (data.errors) {
              const errorMessages = Object.values(data.errors).flat().join(' ')
              toast.error(errorMessages || data.message)
            } else {
              toast.error(data.message || 'Failed to terminate employee')
            }
          }
        } catch (error) {
          console.error('Error:', error)
          toast.error('Network Error: Could not connect to the server.')
        } finally {
          setSubmitting(false)
          setIsActionLoading(false)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const handleRehire = async (employeeId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Re-hire',
      description: 'Are you sure you want to re-hire this employee? This will restore their active status.',
      variant: 'success',
      confirmText: 'Yes, Re-hire',
      onConfirm: async () => {
        try {
          setRehireLoading(employeeId)
          const response = await fetch(`${getApiUrl()}/api/employees/${employeeId}/rehire`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          const data = await response.json()

          if (data.success) {
            toast.success(data.message || 'Employee re-hired successfully')
            fetchData()
            setShowDetailDialog(false)
          } else {
            if (data.errors) {
              const errorMessages = Object.values(data.errors).flat().join(' ')
              toast.error(errorMessages || data.message)
            } else {
              toast.error(data.message || 'Failed to re-hire employee')
            }
          }
        } catch (error) {
          console.error('Error re-hiring:', error)
          toast.error('Network Error: Could not connect to the server.')
        } finally {
          setRehireLoading(null)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      {/* ----- GLOBAL LOADING OVERLAY (For Actions Only) ----- */}
      {(submitting || rehireLoading !== null || isActionLoading) && (
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
      {/* Masterfile-style maroon header */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
        {/* Main Header Row */}
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Terminate Employee</h1>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Process employee termination and manage records
              </p>
            </div>
            <Button
              onClick={() => setIsRequestFormOpen(!isRequestFormOpen)}
              className={cn(
                "font-bold px-5 py-2.5 rounded-lg transition-all duration-300 shadow-lg flex items-center gap-2 h-auto border text-sm uppercase tracking-wider",
                isRequestFormOpen
                  ? "bg-white text-[#A4163A] hover:bg-rose-50 border-white"
                  : "bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm"
              )}
            >
              {isRequestFormOpen ? (
                <><X className="h-4 w-4" /><span>Close</span></>
              ) : (
                <><Users className="h-4 w-4" /><span>Terminate Employee</span></>
              )}
            </Button>
          </div>
        </div>

        {/* Secondary Toolbar — matches masterfile */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
              {/* Status Count Tabs */}
              <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                <div className="px-4 py-1.5 rounded-md text-xs font-bold text-white bg-white/20 uppercase tracking-wider">
                  All ({terminations.length})
                </div>
              </div>

              {/* Search and Sort */}
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                  <Input
                    placeholder="Search employee..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                    className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-9 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                  />
                </div>

                <Select value={sortOrder} onValueChange={(value: any) => { setSortOrder(value); setCurrentPage(1) }}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-white border-2 border-[#FFE5EC] h-9 rounded-lg shadow-sm focus:ring-[#A0153E] text-[#800020] font-bold">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-200 shadow-xl overflow-hidden">
                    <SelectItem value="recent" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3"><History className="h-4 w-4" /><span>Recent First</span></div>
                    </SelectItem>
                    <SelectItem value="oldest" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3"><Clock3 className="h-4 w-4" /><span>Oldest First</span></div>
                    </SelectItem>
                    <SelectItem value="az" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3"><ArrowUpAZ className="h-4 w-4" /><span>Alphabet (A-Z)</span></div>
                    </SelectItem>
                    <SelectItem value="za" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3"><ArrowDownAZ className="h-4 w-4" /><span>Alphabet (Z-A)</span></div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 space-y-6">
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isRequestFormOpen ? "max-h-[120px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          {/* Single-line toolbar row — matches tardiness NEW LATE ENTRY design */}
          <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-lg overflow-visible flex items-center gap-0 px-1 h-16">

            {/* Label */}
            <div className="flex items-center gap-2 px-4 shrink-0">
              <Users className="h-4 w-4 text-[#A4163A]" />
              <span className="text-xs font-bold text-[#A4163A] uppercase tracking-widest whitespace-nowrap">
                TERMINATE
              </span>
            </div>

            <div className="w-px h-8 bg-slate-200 shrink-0" />

            {/* Employee Selector */}
            <div className="flex-1 min-w-[200px] px-2">
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={openCombobox}
                    disabled={loading || submitting}
                    className={cn(
                      "w-full justify-between h-10 bg-transparent hover:bg-slate-50 border-0 text-sm font-normal px-3",
                      !selectedEmployeeId && "text-slate-400"
                    )}
                  >
                    {selectedEmployeeId
                      ? (() => {
                        const emp = employees.find((e) => e.id.toString() === selectedEmployeeId)
                        return emp ? `${emp.last_name}, ${emp.first_name}` : "Select employee..."
                      })()
                      : "Select employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search employee..." />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            value={`${emp.last_name}, ${emp.first_name} ${emp.position}`}
                            onSelect={() => {
                              setSelectedEmployeeId(emp.id.toString())
                              setOpenCombobox(false)
                            }}
                            className="py-2.5 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployeeId === emp.id.toString() ? "opacity-100 text-[#800020]" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{emp.last_name}, {emp.first_name}</span>
                              <span className="text-xs text-slate-500">{emp.position}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-px h-8 bg-slate-200 shrink-0" />

            {/* Termination Date */}
            <div className="px-3 shrink-0">
              <input
                type="date"
                name="termination_date"
                value={formData.termination_date}
                onChange={handleInputChange}
                className="h-10 px-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-600 font-medium text-sm w-[150px]"
                disabled={submitting}
              />
            </div>

            <div className="w-px h-8 bg-slate-200 shrink-0" />

            {/* Reason */}
            <div className="flex-[2] px-3 min-w-[160px]">
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for termination..."
                className="w-full h-10 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400"
                disabled={submitting}
              />
            </div>

            <div className="w-px h-8 bg-slate-200 shrink-0" />

            {/* Proceed Button */}
            <div className="px-3 flex items-center gap-2 shrink-0">
              <Button
                onClick={handleSubmit as any}
                disabled={submitting || !selectedEmployeeId || formData.reason.trim().length < 10}
                className={cn(
                  "h-10 px-6 text-sm font-bold rounded-xl transition-all whitespace-nowrap",
                  submitting || !selectedEmployeeId || formData.reason.trim().length < 10
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#800020] to-[#A0153E] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                )}
              >
                {submitting ? "Processing..." : "Proceed"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRequestFormOpen(false)}
                className="h-9 w-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
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
                onClick={fetchData}
                className="bg-[#A4163A] hover:bg-[#80122D] text-white px-8 h-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Retry Connection
              </Button>
            </div>
          ) : loading ? (
            <div className="p-8 md:p-10 space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#4A081A]">Terminated History</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {filteredTerminations.length} of {terminations.length} records
                  </p>
                </div>
              </div>

              <div className="p-0 bg-white overflow-hidden">
                {terminations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <FileText className="h-20 w-20 mb-4 opacity-10" />
                    <p className="text-lg">No termination records found.</p>
                  </div>
                ) : filteredTerminations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Search className="h-14 w-14 mb-4 opacity-10" />
                    <p className="text-base font-medium">No results for &quot;{searchQuery}&quot;</p>
                    <p className="text-sm mt-1">Try a different name or reason.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="py-4 pl-8 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</TableHead>
                          <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</TableHead>
                          <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</TableHead>
                          <TableHead className="py-4 pr-8 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTerminations
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((record) => (
                          <TableRow key={record.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                            <TableCell className="py-4 pl-8 font-medium text-slate-900">
                              <div className="flex flex-col">
                                <span className="text-base">{record.employee?.last_name}, {record.employee?.first_name}</span>
                                <span className="text-xs text-slate-500 font-normal mt-0.5">{record.employee?.position}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm font-medium">
                              {record.termination_date ? new Date(record.termination_date).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate text-slate-500 text-sm italic">
                              &quot;{record.reason}&quot;
                            </TableCell>
                            <TableCell className="py-4 pr-8 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#800020] font-bold hover:text-[#A0153E] hover:bg-rose-50 rounded-lg px-4"
                                  onClick={() => {
                                    setSelectedTermination(record)
                                    setShowDetailDialog(true)
                                  }}
                                >
                                  Review
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 transition-all font-bold px-4 rounded-lg shadow-sm"
                                  onClick={() => handleRehire(record.employee_id)}
                                  disabled={rehireLoading === record.employee_id}
                                >
                                  {rehireLoading === record.employee_id ? 'Wait...' : 'Re-hire'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {/* Pagination */}
                    {filteredTerminations.length > itemsPerPage && (
                      <div className="px-8 py-3 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="text-xs text-slate-500 font-medium">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTerminations.length)} of {filteredTerminations.length}
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40"
                          >
                            Previous
                          </Button>
                          {Array.from({ length: Math.ceil(filteredTerminations.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                currentPage === page
                                  ? "bg-[#800020] text-white shadow-md scale-105"
                                  : "text-slate-500 hover:bg-slate-100"
                              )}
                            >
                              {page}
                            </button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTerminations.length / itemsPerPage)))}
                            disabled={currentPage === Math.ceil(filteredTerminations.length / itemsPerPage)}
                            className="h-8 px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Termination Detail View Modal */}
      <Dialog
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open)
        }}
      >
        <DialogContent className="sm:max-w-2xl border-0 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] to-[#630C22] p-8 text-white">
            <DialogTitle className="text-2xl font-bold">Termination Details</DialogTitle>
            <DialogDescription className="text-rose-100/90 mt-1">
              For {selectedTermination?.employee?.first_name} {selectedTermination?.employee?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Position</p>
                <p className="font-semibold text-slate-800">{selectedTermination?.employee?.position || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                <p className="font-semibold text-slate-800">
                  {selectedTermination?.termination_date ? new Date(selectedTermination.termination_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-50" /> Reason for Termination
              </p>
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600 leading-relaxed shadow-sm italic">
                "{selectedTermination?.reason || 'No specific reason recorded.'}"
              </div>
            </div>

            {selectedTermination?.notes && (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">Additional Notes</p>
                <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {selectedTermination?.notes}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <Button variant="ghost" onClick={() => setShowDetailDialog(false)} className="font-bold text-slate-600">
              Back to List
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold px-6"
              onClick={() => {
                if (selectedTermination) {
                  handleRehire(selectedTermination.employee_id)
                }
              }}
              disabled={rehireLoading === selectedTermination?.employee_id}
            >
              {rehireLoading === selectedTermination?.employee_id ? 'Restoring Access...' : 'Re-hire Employee'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        isLoading={submitting || rehireLoading !== null}
      />
    </div>
  )
}
