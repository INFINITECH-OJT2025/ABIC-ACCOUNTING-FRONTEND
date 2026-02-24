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
  id: string
  first_name: string
  last_name: string
  email: string
  position: string
  status: string
}

interface TerminationRecord {
  id: number
  employee_id: string
  termination_date: string
  rehired_at?: string | null
  reason: string
  notes: string
  status: string
  exit_type?: string
  employee: Employee
  created_at?: string
}

interface TerminationFormData {
  termination_date: string
  rehire_date: string
  reason: string
  notes: string
  recommended_by: string
  notice_modes: string[]
  notice_date: string
  reviewed_by: string
  approved_by: string
  approval_date: string
}

export default function TerminatePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [terminations, setTerminations] = useState<TerminationRecord[]>([])
  const [resigned, setResigned] = useState<TerminationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedTermination, setSelectedTermination] = useState<TerminationRecord | null>(null)
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [rehireLoading, setRehireLoading] = useState<string | null>(null)
  const [formData, setFormData] = useState<TerminationFormData>({
    termination_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
    rehire_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
    reason: '',
    notes: '',
    recommended_by: '',
    notice_modes: [],
    notice_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
    reviewed_by: '',
    approved_by: 'Mr. Angelle S. Sarmiento',
    approval_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
  })
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [currentResignedPage, setCurrentResignedPage] = useState(1)
  const itemsPerPage = 10
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'az' | 'za'>('recent')
  const [activeTab, setActiveTab] = useState<'all' | 'terminated' | 'rehired'>('all')
  const [historyMode, setHistoryMode] = useState<'current' | 'archive'>('current')
  const [exitActionType, setExitActionType] = useState<'terminate' | 'resigned'>('terminate')

  const getLatestPerEmployee = (records: TerminationRecord[]) => {
    const latestMap = new Map<string, TerminationRecord>()
    for (const record of records) {
      const key = String(record.employee_id ?? '')
      const existing = latestMap.get(key)
      if (!existing) {
        latestMap.set(key, record)
        continue
      }
      const currentTs = new Date(record.termination_date ?? 0).getTime()
      const existingTs = new Date(existing.termination_date ?? 0).getTime()
      if (currentTs > existingTs) latestMap.set(key, record)
    }
    return Array.from(latestMap.values())
  }

  const applyRecordFilters = (records: TerminationRecord[]) => records
    .filter((record) => {
      // Tab filter
      if (activeTab === 'terminated' && record.rehired_at) return false
      if (activeTab === 'rehired' && !record.rehired_at) return false
      // Search filter
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      const fullName = `${record.employee?.last_name ?? ''}, ${record.employee?.first_name ?? ''}`.toLowerCase()
      const reason = (record.reason ?? '').toLowerCase()
      const date = record.termination_date ? new Date(record.termination_date).toLocaleString() : ''
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

  const baseTerminations = historyMode === 'archive' ? terminations : getLatestPerEmployee(terminations)
  const baseResigned = historyMode === 'archive' ? resigned : getLatestPerEmployee(resigned)

  const filteredTerminations = applyRecordFilters(baseTerminations)
  const filteredResigned = applyRecordFilters(baseResigned)
  const selectedRecordIsResigned = selectedTermination?.exit_type === 'resigned'
  const approverPositions = ['admin supervisor', 'it supervisor', 'admin head']
  const approverEmployees = employees.filter((emp) =>
    approverPositions.includes(String(emp.position ?? '').toLowerCase().trim())
  )

  const terminatedCount = baseTerminations.filter(r => !r.rehired_at).length
  const rehiredCount = baseTerminations.filter(r => !!r.rehired_at).length

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
      const [empRes, termRes, resignedRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/employees`),
        fetch(`${getApiUrl()}/api/terminations`),
        fetch(`${getApiUrl()}/api/resigned`)
      ])

      const empData = await empRes.json()
      const termData = await termRes.json()
      const resignedData = await resignedRes.json()

      if (empData.success && Array.isArray(empData.data)) {
        // Only show currently employed employees in dropdown
        const active = empData.data.filter(
          (emp: Employee) => String(emp.status).toLowerCase() === 'employed'
        ).sort((a: Employee, b: Employee) => a.last_name.localeCompare(b.last_name))
        setEmployees(active)
      }

      if (termData.success && Array.isArray(termData.data)) {
        setTerminations(termData.data)
      } else {
        toast.error('Failed to load termination history')
      }

      if (resignedData.success && Array.isArray(resignedData.data)) {
        const normalizedResigned = resignedData.data.map((record: any) => ({
          ...record,
          termination_date: record.resignation_date,
          exit_type: 'resigned',
        }))
        setResigned(normalizedResigned)
      } else {
        toast.error('Failed to load resigned history')
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

  const toggleNoticeMode = (mode: 'email' | 'printed_letter' | 'both') => {
    setFormData((prev) => {
      const current = prev.notice_modes
      if (mode === 'both') {
        return {
          ...prev,
          notice_modes: current.includes('both') ? [] : ['both'],
        }
      }

      const withoutBoth = current.filter((m) => m !== 'both')
      const hasMode = withoutBoth.includes(mode)
      return {
        ...prev,
        notice_modes: hasMode
          ? withoutBoth.filter((m) => m !== mode)
          : [...withoutBoth, mode],
      }
    })
  }

  const getNoticeModeSummary = (modes: string[]) => {
    if (modes.includes('both')) return 'Both (Email and Printed Letter)'
    const labels: Record<string, string> = {
      email: 'Email',
      printed_letter: 'Printed Letter',
    }
    return modes.map((m) => labels[m] ?? m).join(', ')
  }

  const buildPrintNoticeHtml = (employee: Employee, payload: TerminationFormData) => {
    const formatDate = (value?: string) => value ? new Date(value).toLocaleString() : 'N/A'
    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Notice of Termination</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; color: #111827; }
          .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; box-sizing: border-box; }
          .title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 24px; }
          .section { margin-bottom: 14px; line-height: 1.6; }
          .meta { margin-top: 18px; border: 1px solid #d1d5db; padding: 12px; border-radius: 8px; }
          .meta p { margin: 6px 0; }
          .label { font-weight: 700; }
          .signatures { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 36px; }
          .sigline { border-top: 1px solid #111827; margin-top: 44px; padding-top: 6px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="title">NOTICE OF TERMINATION</div>
          <div class="section">Dear <strong>${employee.first_name} ${employee.last_name}</strong>,</div>
          <div class="section">
            This serves as formal notice regarding the termination of your employment with ABIC Accounting.
          </div>
          <div class="meta">
            <p><span class="label">Employee:</span> ${employee.first_name} ${employee.last_name}</p>
            <p><span class="label">Position:</span> ${employee.position || 'N/A'}</p>
            <p><span class="label">Termination Date:</span> ${formatDate(payload.termination_date)}</p>
            <p><span class="label">Reason:</span> ${payload.reason}</p>
            <p><span class="label">Recommended By:</span> ${payload.recommended_by || 'N/A'}</p>
            <p><span class="label">Mode of Notice:</span> ${getNoticeModeSummary(payload.notice_modes)}</p>
            <p><span class="label">Date of Notice:</span> ${formatDate(payload.notice_date)}</p>
            <p><span class="label">Reviewed By:</span> ${payload.reviewed_by || 'N/A'}</p>
            <p><span class="label">Approved By:</span> ${payload.approved_by || 'N/A'}</p>
            <p><span class="label">Date of Approval:</span> ${formatDate(payload.approval_date)}</p>
          </div>
          <div class="section" style="margin-top:18px;">
            For concerns, please coordinate with HR/Admin Office.
          </div>
          <div class="signatures">
            <div>
              <div class="sigline">Employee Signature</div>
            </div>
            <div>
              <div class="sigline">Authorized Signature</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
      </html>
    `
  }

  const openPrintNotice = (printWindow: Window, employee: Employee, payload: TerminationFormData) => {
    const letterHtml = buildPrintNoticeHtml(employee, payload)
    printWindow.document.open()
    printWindow.document.write(letterHtml)
    printWindow.document.close()
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

    if (exitActionType === 'terminate') {
      if (!formData.recommended_by) {
        toast.error('Please select Recommended By')
        return
      }
      if (formData.notice_modes.length === 0) {
        toast.error('Please select at least one Mode of Notice')
        return
      }
      if (!formData.notice_date) {
        toast.error('Date of Notice is required')
        return
      }
    }

    if (!formData.reviewed_by) {
      toast.error('Please select Reviewed By')
      return
    }

    if (!formData.approval_date) {
      toast.error('Date of Approval is required')
      return
    }

    setConfirmModal({
      isOpen: true,
      title: exitActionType === 'resigned' ? 'Confirm Resignation' : 'Confirm Termination',
      description: exitActionType === 'resigned'
        ? 'Are you sure you want to process this employee as resigned? This action can be reversed via re-hire.'
        : 'Are you sure you want to proceed with this termination? This action can be reversed via re-hire.',
      variant: 'destructive',
      confirmText: exitActionType === 'resigned' ? 'Yes, Mark as Resigned' : 'Yes, Terminate',
      onConfirm: async () => {
        let requestTimeout: ReturnType<typeof setTimeout> | null = null
        const controller = new AbortController()
        try {
          setSubmitting(true)
          const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId) || null
          const snapshot = { ...formData }
          const isTerminate = exitActionType === 'terminate'
          const wantsPrinted = isTerminate && (snapshot.notice_modes.includes('both') || snapshot.notice_modes.includes('printed_letter'))
          let reservedPrintWindow: Window | null = null
          if (wantsPrinted) {
            // Open early while still in user gesture context; fill content after success.
            reservedPrintWindow = window.open('', '_blank', 'width=900,height=1000')
            if (!reservedPrintWindow) {
              toast.error('Please allow pop-ups to print the notice letter.')
            }
          }

          requestTimeout = setTimeout(() => controller.abort(), 30000)
          const response = await fetch(
            `${getApiUrl()}/api/employees/${selectedEmployeeId}/terminate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
              body: JSON.stringify({
                termination_date: formData.termination_date,
                reason: formData.reason,
                notes: formData.notes,
                status: exitActionType === 'resigned' ? 'resigned' : 'completed',
                exit_type: exitActionType,
                recommended_by: formData.recommended_by || null,
                notice_mode: formData.notice_modes.includes('both')
                  ? 'both'
                  : formData.notice_modes.join(','),
                notice_date: formData.notice_date || null,
                reviewed_by: formData.reviewed_by || null,
                approved_by: formData.approved_by,
                approval_date: formData.approval_date || null,
              }),
            }
          )

          const data = await response.json()

          if (data.success) {
            if (exitActionType === 'terminate') {
              if (wantsPrinted && selectedEmployee && reservedPrintWindow) {
                openPrintNotice(reservedPrintWindow, selectedEmployee, snapshot)
              }
              if (data.email_notice_status === 'failed') {
                toast.error(data.email_notice_error || 'Termination saved but email notice failed.')
              }
            }

            toast.success(
              data.message ||
              (exitActionType === 'resigned'
                ? 'Employee marked as resigned successfully'
                : 'Employee terminated successfully')
            )
            setSelectedEmployeeId('')
            setFormData({
              termination_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
              rehire_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
              reason: '',
              notes: '',
              recommended_by: '',
              notice_modes: [],
              notice_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
              reviewed_by: '',
              approved_by: 'Mr. Angelle S. Sarmiento',
              approval_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
            })
            setIsRequestFormOpen(false)
            fetchData()
          } else {
            if (data.errors) {
              const errorMessages = Object.values(data.errors).flat().join(' ')
              toast.error(errorMessages || data.message)
            } else {
              toast.error(
                data.message ||
                (exitActionType === 'resigned'
                  ? 'Failed to mark employee as resigned'
                  : 'Failed to terminate employee')
              )
            }
          }
        } catch (error) {
          console.error('Error:', error)
          if (error instanceof DOMException && error.name === 'AbortError') {
            toast.error('Request timed out. Please try again.')
          } else {
            toast.error('Network Error: Could not connect to the server.')
          }
        } finally {
          if (requestTimeout) clearTimeout(requestTimeout)
          setSubmitting(false)
          setIsActionLoading(false)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const handleRehire = async (employeeId: string) => {
    if (!formData.rehire_date) {
      toast.error('Please set a re-hire date and time')
      return
    }

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
            body: JSON.stringify({
              rehired_at: formData.rehire_date
            })
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
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Terminate / Resign Employee</h1>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Process employee exit and manage records
              </p>
            </div>
            {isRequestFormOpen ? (
              <Button
                onClick={() => setIsRequestFormOpen(false)}
                className="font-bold px-5 py-2.5 rounded-lg transition-all duration-300 shadow-lg flex items-center gap-2 h-auto border text-sm uppercase tracking-wider bg-white text-[#A4163A] hover:bg-rose-50 border-white"
              >
                <X className="h-4 w-4" />
                <span>Close</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setExitActionType('terminate')
                    setIsRequestFormOpen(true)
                  }}
                  className="font-bold px-5 py-2.5 rounded-lg transition-all duration-300 shadow-lg flex items-center gap-2 h-auto border text-sm uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm"
                >
                  <Users className="h-4 w-4" />
                  <span>Terminate Employee</span>
                </Button>
                <Button
                  onClick={() => {
                    setExitActionType('resigned')
                    setIsRequestFormOpen(true)
                  }}
                  className="font-bold px-5 py-2.5 rounded-lg transition-all duration-300 shadow-lg flex items-center gap-2 h-auto border text-sm uppercase tracking-wider bg-white text-[#A4163A] hover:bg-rose-50 border-white"
                >
                  <Users className="h-4 w-4" />
                  <span>Resigned Employee</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Toolbar — matches masterfile */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
              {/* Status Count Tabs */}
              <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                <button
                  onClick={() => { setActiveTab('all'); setCurrentPage(1); setCurrentResignedPage(1) }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                    activeTab === 'all' ? 'bg-white text-[#A4163A] shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All ({baseTerminations.length})
                </button>
                <button
                  onClick={() => { setActiveTab('terminated'); setCurrentPage(1); setCurrentResignedPage(1) }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                    activeTab === 'terminated' ? 'bg-white text-[#A4163A] shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Terminated ({terminatedCount})
                </button>
                <button
                  onClick={() => { setActiveTab('rehired'); setCurrentPage(1); setCurrentResignedPage(1) }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                    activeTab === 'rehired' ? 'bg-white text-[#A4163A] shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Rehired ({rehiredCount})
                </button>
              </div>
              <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                <button
                  onClick={() => { setHistoryMode('current'); setCurrentPage(1); setCurrentResignedPage(1) }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                    historyMode === 'current' ? 'bg-white text-[#A4163A] shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Current
                </button>
                <button
                  onClick={() => { setHistoryMode('archive'); setCurrentPage(1); setCurrentResignedPage(1) }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                    historyMode === 'archive' ? 'bg-white text-[#A4163A] shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Archive
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                  <Input
                    placeholder="Search employee..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); setCurrentResignedPage(1) }}
                    className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-9 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                  />
                </div>

                <Select value={sortOrder} onValueChange={(value: any) => { setSortOrder(value); setCurrentPage(1); setCurrentResignedPage(1) }}>
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
          isRequestFormOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#A4163A]" />
              <span className="text-xs font-bold text-[#A4163A] uppercase tracking-widest whitespace-nowrap">
                {exitActionType === 'resigned' ? 'RESIGNED' : 'TERMINATE'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      disabled={loading || submitting}
                      className={cn(
                        "w-full justify-between h-10 text-sm font-normal",
                        !selectedEmployeeId && "text-slate-400"
                      )}
                    >
                      {selectedEmployeeId
                        ? (() => {
                          const emp = employees.find((e) => e.id === selectedEmployeeId)
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
                                setSelectedEmployeeId(emp.id)
                                setOpenCombobox(false)
                              }}
                              className="py-2.5 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedEmployeeId === emp.id ? "opacity-100 text-[#800020]" : "opacity-0"
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

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Termination Date & Time</Label>
                <Input
                  type="datetime-local"
                  name="termination_date"
                  value={formData.termination_date}
                  onChange={handleInputChange}
                  className="h-10"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</Label>
                <Input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder={exitActionType === 'resigned' ? 'Reason for resignation...' : 'Reason for termination...'}
                  className="h-10"
                  disabled={submitting}
                />
              </div>

              {exitActionType === 'terminate' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended By</Label>
                    <Select
                      value={formData.recommended_by}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, recommended_by: value }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select recommender..." />
                      </SelectTrigger>
                      <SelectContent>
                        {approverEmployees.map((emp) => (
                          <SelectItem key={`recommended-${emp.id}`} value={`${emp.first_name} ${emp.last_name}`}>
                            {emp.first_name} {emp.last_name} ({emp.position})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Notice</Label>
                    <Input
                      type="datetime-local"
                      name="notice_date"
                      value={formData.notice_date}
                      onChange={handleInputChange}
                      className="h-10"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mode of Notice</Label>
                    <div className="h-10 px-3 border border-slate-200 rounded-md flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.notice_modes.includes('email')}
                          onChange={() => toggleNoticeMode('email')}
                          disabled={submitting}
                        />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.notice_modes.includes('printed_letter')}
                          onChange={() => toggleNoticeMode('printed_letter')}
                          disabled={submitting}
                        />
                        <span>Printed Letter</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.notice_modes.includes('both')}
                          onChange={() => toggleNoticeMode('both')}
                          disabled={submitting}
                        />
                        <span>Both</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reviewed By</Label>
                <Select
                  value={formData.reviewed_by}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, reviewed_by: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select reviewer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {approverEmployees.map((emp) => (
                      <SelectItem key={`reviewed-${emp.id}`} value={`${emp.first_name} ${emp.last_name}`}>
                        {emp.first_name} {emp.last_name} ({emp.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Approved By</Label>
                <Input
                  type="text"
                  name="approved_by"
                  value={formData.approved_by}
                  onChange={handleInputChange}
                  className="h-10 bg-slate-50"
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Approval</Label>
                <Input
                  type="datetime-local"
                  name="approval_date"
                  value={formData.approval_date}
                  onChange={handleInputChange}
                  className="h-10"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-2">
              <Button
                onClick={handleSubmit as any}
                disabled={
                  submitting ||
                  !selectedEmployeeId ||
                  formData.reason.trim().length < 10 ||
                  !formData.reviewed_by ||
                  !formData.approval_date ||
                  (exitActionType === 'terminate' && (!formData.recommended_by || formData.notice_modes.length === 0 || !formData.notice_date))
                }
                className={cn(
                  "h-10 px-6 text-sm font-bold rounded-xl transition-all whitespace-nowrap",
                  submitting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#800020] to-[#A0153E] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                )}
              >
                {submitting ? "Processing..." : (exitActionType === 'resigned' ? 'Proceed Resignation' : 'Proceed Termination')}
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
                    {filteredTerminations.length} of {baseTerminations.length} records
                  </p>
                </div>
              </div>

              <div className="p-0 bg-white overflow-hidden">
                {baseTerminations.length === 0 ? (
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
                          <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Termination Date</TableHead>
                          {activeTab !== 'terminated' && (
                            <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rehire Date</TableHead>
                          )}
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
                              {record.termination_date ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-rose-700">{new Date(record.termination_date).toLocaleDateString()}</span>
                                  <span className="text-xs text-slate-400 mt-0.5">{new Date(record.termination_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              ) : 'N/A'}
                            </TableCell>
                            {activeTab !== 'terminated' && (
                              <TableCell className="text-slate-600 text-sm font-medium">
                                {record.rehired_at ? (
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-emerald-700">{new Date(record.rehired_at).toLocaleDateString()}</span>
                                    <span className="text-xs text-slate-400 mt-0.5">{new Date(record.rehired_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic text-xs">—</span>
                                )}
                              </TableCell>
                            )}
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
                                {!record.rehired_at && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 transition-all font-bold px-4 rounded-lg shadow-sm"
                                    onClick={() => {
                                      setSelectedTermination(record)
                                      setFormData((prev) => ({
                                        ...prev,
                                        rehire_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
                                      }))
                                      setShowDetailDialog(true)
                                    }}
                                    disabled={rehireLoading === record.employee_id}
                                  >
                                    {rehireLoading === record.employee_id ? 'Wait...' : 'Re-hire'}
                                  </Button>
                                )}
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

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {fetchError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <p>Unable to load resigned history.</p>
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
                  <h2 className="text-lg font-bold text-[#4A081A]">Resigned History</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {filteredResigned.length} of {baseResigned.length} records
                  </p>
                </div>
              </div>

              <div className="p-0 bg-white overflow-hidden">
                {baseResigned.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <FileText className="h-20 w-20 mb-4 opacity-10" />
                    <p className="text-lg">No resigned records found.</p>
                  </div>
                ) : filteredResigned.length === 0 ? (
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
                          <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resignation Date</TableHead>
                          {activeTab !== 'terminated' && (
                            <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rehire Date</TableHead>
                          )}
                          <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</TableHead>
                          <TableHead className="py-4 pr-8 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResigned
                          .slice((currentResignedPage - 1) * itemsPerPage, currentResignedPage * itemsPerPage)
                          .map((record) => (
                            <TableRow key={`resigned-${record.id}`} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                              <TableCell className="py-4 pl-8 font-medium text-slate-900">
                                <div className="flex flex-col">
                                  <span className="text-base">{record.employee?.last_name}, {record.employee?.first_name}</span>
                                  <span className="text-xs text-slate-500 font-normal mt-0.5">{record.employee?.position}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm font-medium">
                                {record.termination_date ? (
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-rose-700">{new Date(record.termination_date).toLocaleDateString()}</span>
                                    <span className="text-xs text-slate-400 mt-0.5">{new Date(record.termination_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                ) : 'N/A'}
                              </TableCell>
                              {activeTab !== 'terminated' && (
                                <TableCell className="text-slate-600 text-sm font-medium">
                                  {record.rehired_at ? (
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-emerald-700">{new Date(record.rehired_at).toLocaleDateString()}</span>
                                      <span className="text-xs text-slate-400 mt-0.5">{new Date(record.rehired_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 italic text-xs">â€”</span>
                                  )}
                                </TableCell>
                              )}
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
                                  {!record.rehired_at && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-9 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 transition-all font-bold px-4 rounded-lg shadow-sm"
                                      onClick={() => {
                                        setSelectedTermination(record)
                                        setFormData((prev) => ({
                                          ...prev,
                                          rehire_date: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
                                        }))
                                        setShowDetailDialog(true)
                                      }}
                                      disabled={rehireLoading === record.employee_id}
                                    >
                                      {rehireLoading === record.employee_id ? 'Wait...' : 'Re-hire'}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {filteredResigned.length > itemsPerPage && (
                      <div className="px-8 py-3 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="text-xs text-slate-500 font-medium">
                          Showing {(currentResignedPage - 1) * itemsPerPage + 1} to {Math.min(currentResignedPage * itemsPerPage, filteredResigned.length)} of {filteredResigned.length}
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentResignedPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentResignedPage === 1}
                            className="h-8 px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40"
                          >
                            Previous
                          </Button>
                          {Array.from({ length: Math.ceil(filteredResigned.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                            <button
                              key={`resigned-page-${page}`}
                              onClick={() => setCurrentResignedPage(page)}
                              className={cn(
                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                currentResignedPage === page
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
                            onClick={() => setCurrentResignedPage(prev => Math.min(prev + 1, Math.ceil(filteredResigned.length / itemsPerPage)))}
                            disabled={currentResignedPage === Math.ceil(filteredResigned.length / itemsPerPage)}
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
            <DialogTitle className="text-2xl font-bold">{selectedRecordIsResigned ? 'Resignation Details' : 'Termination Details'}</DialogTitle>
            <DialogDescription className="text-rose-100/90 mt-1">
              For {selectedTermination?.employee?.first_name} {selectedTermination?.employee?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Position</p>
                <p className="font-semibold text-slate-800">{selectedTermination?.employee?.position || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{selectedRecordIsResigned ? 'Resignation Date' : 'Termination Date'}</p>
                <div className="flex flex-col">
                  <p className="font-semibold text-rose-700">
                    {selectedTermination?.termination_date ? new Date(selectedTermination.termination_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {selectedTermination?.termination_date ? new Date(selectedTermination.termination_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
              {selectedTermination?.rehired_at && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 font-sans col-span-2">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <History className="w-3 h-3" /> Re-hire Date
                  </p>
                  <div className="flex flex-col">
                    <p className="font-semibold text-emerald-700">
                      {new Date(selectedTermination.rehired_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-emerald-500/70 mt-0.5 font-medium italic">
                      Restored at {new Date(selectedTermination.rehired_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-50" /> {selectedRecordIsResigned ? 'Reason for Resignation' : 'Reason for Termination'}
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

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
            {!selectedTermination?.rehired_at && (
              <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex flex-col gap-1 shrink-0">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Re-hire Date & Time</Label>
                  <Input
                    type="datetime-local"
                    name="rehire_date"
                    value={formData.rehire_date}
                    onChange={handleInputChange}
                    className="h-9 px-2 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-600 font-medium text-sm w-[200px]"
                    disabled={rehireLoading !== null}
                  />
                </div>
                <div className="flex-1 text-xs text-slate-400 italic">
                  Specify the official re-hire date for this employee.
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setShowDetailDialog(false)} className="font-bold text-slate-600">
                Back to List
              </Button>
              {!selectedTermination?.rehired_at && (
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
              )}
            </div>
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


