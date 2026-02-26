'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Users, Check, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { ConfirmationModal } from '@/components/ConfirmationModal'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department { id: number; name: string }
interface Employee { id: string; name: string; department?: string | null; department_id?: number; position?: string | null }

interface LeaveEntry {
  id: number
  employee_id: string
  employee_name: string
  department: string
  category: 'half-day' | 'whole-day'
  shift?: string
  start_date: string
  leave_end_date: string
  number_of_days: number
  approved_by: string
  remarks: string
  cite_reason: string
  status: 'Pending' | 'Approved/Completed' | 'Declined'
}

// ─── Department shift schedule type (loaded from API) ─────────────────────────
interface DepartmentShiftSchedule {
  id: number
  department: string
  schedule_label: string
  shift_options: string[]   // e.g. ["8:00 AM – 12:00 PM", "1:00 PM – 4:00 PM"]
}

// Fallback helper for cases where no DB row matches (should rarely happen)
function getShiftFallback(departmentName: string): { label: string; shifts: string[] } {
  const d = departmentName.toLowerCase().trim()
  const words = d.split(/\s+/)

  const isMultimedia = words.some(w => ['multimedia', 'marketing', 'studio'].includes(w))
  const isIT = words.some(w => ['it', 'infinitech'].includes(w))
  const isABIC = words.some(w => ['accounting', 'sales', 'admin', 'abic'].includes(w))

  if (isMultimedia)
    return { label: 'Multimedia/Marketing/Studio (10:00 AM – 2:00 PM / 3:00 PM – 7:00 PM)', shifts: ['10:00 AM – 2:00 PM', '3:00 PM – 7:00 PM'] }
  if (isIT)
    return { label: 'IT/Infinitech (9:00 AM – 1:00 PM / 2:00 PM – 6:00 PM)', shifts: ['9:00 AM – 1:00 PM', '2:00 PM – 6:00 PM'] }
  if (isABIC)
    return { label: 'Accounting/Sales/Admin (8:00 AM – 12:00 PM / 1:00 PM – 4:00 PM)', shifts: ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM'] }

  return { label: 'ABIC (8:00 AM – 12:00 PM / 1:00 PM – 4:00 PM)', shifts: ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM'] }
}


// ─── Leave type remarks ────────────────────────────────────────────────────────
const LEAVE_REMARKS = [
  'Emergency Leave',
  'Sick Leave',
  'Personal Leave',
  'Vacation Leave',
  'Bereavement Leave',
  'Maternity Leave',
]

// ─── Approved-by options ───────────────────────────────────────────────────────
const APPROVAL_OPTIONS = [
  { label: 'Pending', value: 'Pending', color: 'bg-orange-400 text-white' },
  { label: 'Declined', value: 'Declined', color: 'bg-red-500 text-white' },
]
const HEAD_NAMES = ['Head Name 1', 'Head Name 2', 'Head Name 3']

// ─── Calendar helpers ──────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
// Sunday-based grid: 0 = Sunday … 6 = Saturday
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun … 6=Sat
}

// ─── Status colours ────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  'Pending': 'bg-blue-300',
  'Approved/Completed': 'bg-green-400',
  'Declined': 'bg-orange-400',
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────
function normalizeDate(dateStr: string) {
  if (!dateStr) return ''
  if (dateStr.includes('T')) {
    const date = new Date(dateStr)
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() + Math.abs(userTimezoneOffset))
    return localDate.toISOString().split('T')[0]
  }
  return dateStr.slice(0, 10)
}

function formatDisplayDate(dateStr: string) {
  const iso = normalizeDate(dateStr)
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDays(days: any, category: string) {
  const d = parseFloat(days) || 0
  if (category === 'half-day') {
    return `${Math.round(d * 8)} hours`
  }
  const roundedDays = Math.round(d)
  return roundedDays === 1 ? '1 day' : `${roundedDays} days`
}

// ─── Combobox helper ───────────────────────────────────────────────────────────
function ComboSelect({
  value, onChange, options, placeholder, disabled = false, variant
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string; color?: string }[]
  placeholder: string
  disabled?: boolean
  variant?: 'maroon' | 'pink'
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center justify-between w-full border rounded-lg px-4 py-3 text-sm bg-white text-left shadow-sm transition-all h-[46px]',
            variant === 'pink' ? 'border-[#FBDADD]' : 'border-[#630C22]',
            disabled && 'opacity-50 cursor-not-allowed bg-slate-50',
            !disabled && 'hover:border-[#4A081A] focus:outline-none'
          )}
        >
          {selected ? (
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', selected.color ?? '')}>
              {selected.label}
            </span>
          ) : (
            <span className="text-slate-400 italic">{placeholder}</span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-56">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options
                .filter(opt => opt.value !== value)
                .map(opt => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => { onChange(opt.value); setOpen(false) }}
                  >
                    <Check className={cn('mr-2 h-4 w-4 opacity-0')} />
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', opt.color ?? '')}>
                      {opt.label}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


// ─── Date Range Picker ────────────────────────────────────────────────────────
function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
}) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  // picking state: null = waiting for start, 'start' = start chosen
  const [picking, setPicking] = useState<'start' | null>(null)

  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const fmtDisplay = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const label =
    startDate && endDate
      ? `${fmtDisplay(startDate)} – ${fmtDisplay(endDate)}`
      : startDate
        ? `${fmtDisplay(startDate)} – …`
        : 'Select date range'

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startOffset = firstDayOfMonth(viewYear, viewMonth)
  const cells = Array.from({ length: startOffset + totalDays }, (_, i) => {
    const day = i - startOffset + 1
    return day > 0 ? day : null
  })
  while (cells.length % 7 !== 0) cells.push(null)

  const handleDayClick = (day: number) => {
    const clickedStr = toStr(new Date(viewYear, viewMonth, day))
    if (!startDate || picking === null) {
      // first click → set start, clear end
      onChange(clickedStr, '')
      setPicking('start')
    } else {
      // second click → set end (ensure start <= end)
      if (clickedStr < startDate) {
        onChange(clickedStr, startDate)
      } else {
        onChange(startDate, clickedStr)
      }
      setPicking(null)
      setOpen(false)
    }
  }

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false
    const s = toStr(new Date(viewYear, viewMonth, day))
    return s > startDate && s < endDate
  }
  const isStart = (day: number) =>
    toStr(new Date(viewYear, viewMonth, day)) === startDate
  const isEnd = (day: number) =>
    toStr(new Date(viewYear, viewMonth, day)) === endDate

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white hover:border-[#4A081A] focus:outline-none shadow-sm transition-all h-[46px]"
        >
          <span className={cn('flex items-center gap-2', startDate ? 'text-slate-800 font-medium' : 'text-slate-400 italic')}>
            <Calendar className="w-3.5 h-3.5 text-[#630C22] shrink-0" />
            {label}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-3 w-auto" align="start">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-rose-50 text-[#4A081A] transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#4A081A]">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-rose-50 text-[#4A081A] transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
            <div key={w} className="text-center text-[10px] font-bold text-[#4A081A] py-1">{w}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="w-8 h-8" />
            const inRange = isInRange(day)
            const start = isStart(day)
            const end = isEnd(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayClick(day)}
                className={cn(
                  'w-8 h-8 text-xs font-medium rounded-full flex items-center justify-center transition',
                  start || end
                    ? 'bg-[#630C22] text-white font-bold'
                    : inRange
                      ? 'bg-rose-100 text-[#4A081A] rounded-none'
                      : 'hover:bg-rose-50 text-slate-700'
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
        {/* hint */}
        <p className="text-[10px] text-slate-400 italic mt-2 text-center">
          {!startDate || picking === null ? 'Click a start date' : 'Now click the end date'}
        </p>
        {/* Clear */}
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => { onChange('', ''); setPicking(null) }}
            className="mt-1 w-full text-[10px] text-rose-400 hover:text-rose-600 transition text-center"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ─── Add Leave Modal ──────────────────────────────────────────────────────────
interface AddLeaveModalProps {
  open: boolean
  onClose: () => void
  employees: Employee[]
  departments: Department[]
  onSave: (entry: Omit<LeaveEntry, 'id'>) => void
}

const emptyForm = {
  employee_id: '' as string,   // registered DB id (e.g. "26-001")
  employee_name: '',
  department: '',
  category: '' as '' | 'half-day' | 'whole-day',
  shift: '',
  start_date: '',
  leave_end_date: '',
  number_of_days: 0,
  approved_by: '',
  remarks: '',
  cite_reason: '',
}

function AddLeaveModal({ open, onClose, employees, departments, onSave }: AddLeaveModalProps) {
  const [form, setForm] = useState({ ...emptyForm })
  const [empOpen, setEmpOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<Omit<LeaveEntry, 'id'> | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) setForm({ ...emptyForm })
  }, [open])

  // Auto-set department when employee is selected
  const handleSelectEmployee = (emp: Employee) => {
    const dept =
      (emp.department && emp.department.trim()) ||
      departments.find(d => d.id === emp.department_id)?.name ||
      (emp.position && emp.position.trim()) ||
      ''
    setForm(prev => ({ ...prev, employee_id: emp.id, employee_name: emp.name, department: dept, shift: '' }))
    setEmpOpen(false)
  }

  // Auto-calc number of days
  useEffect(() => {
    if (form.start_date && form.leave_end_date) {
      const start = new Date(form.start_date)
      const end = new Date(form.leave_end_date)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
        const days = form.category === 'half-day' ? diff * 0.5 : diff
        setForm(prev => ({ ...prev, number_of_days: days }))
      }
    }
  }, [form.start_date, form.leave_end_date, form.category])

  const availableShifts = form.department ? getShiftFallback(form.department).shifts : []
  const shiftLabel = form.department ? getShiftFallback(form.department).label : ''

  const approvalOptions = [
    ...APPROVAL_OPTIONS,
    ...HEAD_NAMES.map(h => ({ label: h, value: h, color: 'bg-green-500 text-white' })),
  ]

  const remarkOptions = LEAVE_REMARKS.map(r => ({ label: r, value: r }))

  const handleSave = async () => {
    if (!form.employee_name) { toast.error('Please select an employee'); return }
    if (!form.category) { toast.error('Please select a category'); return }
    if (!form.start_date) { toast.error('Please enter a start date'); return }
    if (!form.leave_end_date) { toast.error('Please enter a leave end date'); return }
    if (!form.approved_by) { toast.error('Please select approval status'); return }
    if (!form.remarks) { toast.error('Please select leave type'); return }

    const payload: Omit<LeaveEntry, 'id'> = {
      employee_id: form.employee_id,
      employee_name: form.employee_name,
      department: form.department,
      category: form.category as 'half-day' | 'whole-day',
      shift: form.category === 'half-day' ? form.shift : undefined,
      start_date: form.start_date,
      leave_end_date: form.leave_end_date,
      number_of_days: form.number_of_days,
      approved_by: form.approved_by,
      remarks: form.remarks,
      cite_reason: form.cite_reason,
      status: form.approved_by === 'Pending' ? 'Pending'
        : form.approved_by === 'Declined' ? 'Declined'
          : 'Approved/Completed',
    }
    setPendingPayload(payload)
    setShowConfirm(true)
  }

  const confirmSave = async () => {
    if (!pendingPayload) return
    setSaving(true)
    try {
      await onSave(pendingPayload)
      onClose()
    } finally {
      setSaving(false)
      setShowConfirm(false)
      setPendingPayload(null)
    }
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSave}
        title="Confirm Save"
        description="Are you sure you want to save this leave monitoring entry?"
        confirmText="Save Leave"
        isLoading={saving}
      />
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-7xl w-[95vw] bg-white rounded-2xl shadow-2xl border border-rose-100 p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-[#630C22] px-8 py-5">
            <h2 className="text-white text-2xl font-bold">Add Leave Monitoring</h2>
          </div>

          <div className="px-12 py-10 space-y-10 overflow-y-auto max-h-[80vh]">
            <div className="grid grid-cols-3 gap-x-12 gap-y-10">
              {/* Row 1 */}
              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">EMP. ID:</Label>
                <div className="flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-slate-50 text-slate-400 italic font-medium shadow-sm transition-all h-[46px] flex items-center">
                  {form.employee_id || 'Auto-filled on name selection'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">NAME:</Label>
                <Popover open={empOpen} onOpenChange={setEmpOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" className="flex items-center justify-between flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white hover:border-[#4A081A] transition-all shadow-sm h-[46px]">
                      <span className={form.employee_name ? 'text-slate-800 font-medium italic' : 'text-slate-400 italic'}>
                        {form.employee_name || 'dropdown'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-80">
                    <Command>
                      <CommandInput placeholder="Search employee..." />
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {employees
                            .filter(e => e.id !== form.employee_id)
                            .map(emp => (
                              <CommandItem key={emp.id} value={emp.name} onSelect={() => handleSelectEmployee(emp)}>
                                {emp.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">CATEGORY:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="flex items-center justify-between flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white hover:border-[#4A081A] transition-all shadow-sm h-[46px]">
                      {form.category === 'half-day' ? (
                        <span className="px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 font-extrabold text-[10px] uppercase">half-day</span>
                      ) : form.category === 'whole-day' ? (
                        <span className="px-3 py-1 rounded-full bg-[#630C22] text-white font-extrabold text-[10px] uppercase">whole day</span>
                      ) : (
                        <span className="text-slate-400 italic">dropdown</span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2 w-48 space-y-1">
                    {form.category !== 'half-day' && (
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, category: 'half-day', shift: '' }))} className="w-full text-center px-3 py-2.5 rounded-md bg-yellow-400 text-yellow-900 font-bold text-sm hover:bg-yellow-300 transition-all uppercase tracking-wider">half-day</button>
                    )}
                    {form.category !== 'whole-day' && (
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, category: 'whole-day', shift: '' }))} className="w-full text-center px-3 py-2.5 rounded-md bg-[#630C22] text-white font-bold text-sm hover:bg-[#4A081A] transition-all uppercase tracking-wider">whole day</button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">SHIFT:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" disabled={form.category === 'whole-day'} className={cn('flex items-center justify-between flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white transition-all shadow-sm h-[46px]', form.category === 'whole-day' ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:border-[#4A081A]')}>
                      <span className={form.shift ? 'text-slate-800 font-medium italic' : 'text-slate-400 italic'}>{form.shift || 'dropdown'}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  {form.category !== 'whole-day' && (
                    <PopoverContent className="p-2 w-64 space-y-1">
                      {availableShifts
                        .filter(s => s !== form.shift)
                        .map(s => (
                          <button key={s} type="button" onClick={() => setForm(prev => ({ ...prev, shift: s }))} className="w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-rose-50 transition-all">{s}</button>
                        ))}
                    </PopoverContent>
                  )}
                </Popover>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">CHOOSE DATE:</Label>
                <div className="flex-1 h-[46px]">
                  <DateRangePicker
                    startDate={form.start_date}
                    endDate={form.leave_end_date}
                    onChange={(s, e) => setForm(prev => ({ ...prev, start_date: s, leave_end_date: e }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">NO. OF DAYS:</Label>
                <Input readOnly value={form.number_of_days > 0 ? formatDays(form.number_of_days, form.category) : ''} placeholder="" className="border-[#630C22] bg-white h-[46px] rounded-lg text-lg font-bold text-slate-700 flex-1 shadow-sm px-4" />
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">APPROVED BY:</Label>
                <div className="flex-1">
                  <ComboSelect value={form.approved_by} onChange={v => setForm(prev => ({ ...prev, approved_by: v }))} options={approvalOptions} placeholder="dropdown" variant="pink" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">REMARKS:</Label>
                <div className="flex-1">
                  <ComboSelect value={form.remarks} onChange={v => setForm(prev => ({ ...prev, remarks: v }))} options={remarkOptions} placeholder="dropdown" variant="pink" />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Label className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right pt-4">REASON:</Label>
                <textarea rows={3} value={form.cite_reason} onChange={e => setForm(prev => ({ ...prev, cite_reason: e.target.value }))} placeholder="specify reason" className="flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#4A081A] italic font-medium shadow-sm transition-all" />
              </div>
            </div>
          </div>

          <div className="px-12 py-6 flex justify-end gap-5 mb-4">
            <Button variant="outline" onClick={onClose} className="border-rose-300 text-[#4A081A] hover:bg-rose-50 text-xs px-10 h-11 font-bold rounded-lg shadow-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#630C22] text-white hover:bg-[#4A081A] text-xs px-10 h-11 font-bold rounded-lg shadow-lg hover:shadow-[#630C22]/40 transition-all"
            >
              {saving ? 'Saving…' : 'Save Leave'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Philippines Public Holidays ─────────────────────────────────────────────
// Fixed-date + common movable PH holidays (updated annually as needed)
const PH_HOLIDAYS: Record<string, string> = {
  // January
  '01-01': "New Year's Day",
  // February
  '02-25': 'EDSA People Power Revolution',
  // April – these vary; approximating for 2026
  '04-02': 'Maundy Thursday',
  '04-03': 'Good Friday',
  '04-04': 'Black Saturday',
  '04-09': 'Araw ng Kagitingan (Bataan Day)',
  // May
  '05-01': 'Labor Day',
  // June
  '06-12': 'Independence Day',
  // August
  '08-21': 'Ninoy Aquino Day',
  '08-25': 'National Heroes Day', // last Monday of August
  // November
  '11-01': "All Saints' Day",
  '11-02': "All Souls' Day",
  '11-30': 'Bonifacio Day',
  // December
  '12-08': 'Feast of the Immaculate Conception',
  '12-24': 'Christmas Eve',
  '12-25': 'Christmas Day',
  '12-30': 'Rizal Day',
  '12-31': "New Year's Eve",
}

function getPHHoliday(year: number, month: number, day: number): string | null {
  const key = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return PH_HOLIDAYS[key] ?? null
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ year, month, entries, weekOnly = false }: {
  year: number
  month: number
  entries: LeaveEntry[]
  weekOnly?: boolean
}) {
  const totalDays = daysInMonth(year, month)
  const startOffset = firstDayOfMonth(year, month)

  const allCells = Array.from({ length: startOffset + totalDays }, (_, i) => {
    const day = i - startOffset + 1
    return day > 0 ? day : null
  })
  while (allCells.length % 7 !== 0) allCells.push(null)

  // For week mode, find the row containing today
  let cells = allCells
  if (weekOnly) {
    const todayObj = new Date()
    const isSameMonth = todayObj.getFullYear() === year && todayObj.getMonth() === month
    const todayDay = isSameMonth ? todayObj.getDate() : null
    if (todayDay) {
      const todayFlatIdx = startOffset + todayDay - 1
      const rowStart = Math.floor(todayFlatIdx / 7) * 7
      cells = allCells.slice(rowStart, rowStart + 7)
    } else {
      cells = allCells.slice(0, 7)
    }
  }

  const entriesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return entries.filter(e => {
      const s = normalizeDate(e.start_date)
      const ed = normalizeDate(e.leave_end_date)
      return dateStr >= s && dateStr <= ed
    })
  }

  // Click-to-view state
  const [selectedEntry, setSelectedEntry] = useState<LeaveEntry | null>(null)
  const [viewAllForDay, setViewAllForDay] = useState<number | null>(null)

  return (
    <>
      <div className="bg-white rounded-xl shadow border border-rose-100 overflow-hidden">
        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-rose-50 justify-end text-xs">
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-orange-400"></span> Pending</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-green-500"></span> Approved/Completed</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-red-500"></span> Declined</span>
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-rose-50 border-b border-rose-100">
          {WEEKDAYS.map(w => (
            <div key={w} className="py-2 text-center text-xs font-bold text-[#4A081A] uppercase tracking-wide">
              {w}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-rose-50">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="min-h-[90px] bg-white" />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const holiday = getPHHoliday(year, month, day)
            const dayEntries = entriesForDay(day)
            const isToday = new Date().toISOString().slice(0, 10) === dateStr

            return (
              <div key={day} className={cn('min-h-[90px] p-1.5 bg-white', isToday && 'bg-rose-50')}>
                <div className={cn(
                  'text-xs font-semibold mb-1',
                  isToday ? 'text-[#4A081A] font-bold' : holiday ? 'text-red-500' : 'text-slate-500'
                )}>
                  {day}
                </div>
                {holiday && (
                  <div className="text-[10px] text-red-400 italic mb-0.5 truncate" title={holiday}>{holiday}</div>
                )}
                {dayEntries.slice(0, 5).map((e, i) => {
                  const colInRow = idx % 7
                  const barColor =
                    e.status === 'Approved/Completed' ? 'bg-green-500'
                      : e.status === 'Declined' ? 'bg-red-500'
                        : 'bg-orange-400'

                  // Rounded edges only at true entry start/end or week row boundary
                  const entryStartStr = e.start_date.slice(0, 10)
                  const entryEndStr = e.leave_end_date.slice(0, 10)
                  const isStart = entryStartStr === dateStr
                  const isEnd = entryEndStr === dateStr
                  const roundLeft = isStart || colInRow === 0
                  const roundRight = isEnd || colInRow === 6

                  return (
                    <div
                      key={i}
                      onClick={(ev) => { ev.stopPropagation(); setSelectedEntry(e) }}
                      title={`${e.employee_name} • ${e.remarks}${e.shift ? ` (${e.shift})` : ''}`}
                      style={{
                        marginLeft: roundLeft ? '2px' : '0px',
                        marginRight: roundRight ? '2px' : '-1px',
                        borderRadius: `${roundLeft ? 3 : 0}px ${roundRight ? 3 : 0}px ${roundRight ? 3 : 0}px ${roundLeft ? 3 : 0}px`,
                      }}
                      className={cn(
                        'h-[14px] px-1.5 text-[10px] leading-[14px] text-white font-medium truncate overflow-hidden select-none cursor-pointer hover:brightness-110 transition-[filter] mb-0.5',
                        barColor
                      )}
                    >
                      {`${e.employee_name}${e.category === 'half-day' && e.shift ? ` (${e.shift})` : ''}, ${e.remarks}`}
                    </div>
                  )
                })}
                {dayEntries.length > 5 && (
                  <button
                    onClick={(ev) => { ev.stopPropagation(); setViewAllForDay(day) }}
                    className="text-[9px] text-slate-400 mt-0.5 hover:text-[#4A081A] hover:font-bold transition-colors w-full text-left bg-transparent border-0 p-0"
                  >
                    +{dayEntries.length - 5} more
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── View All Entries for a Day Dialog ── */}
      <Dialog open={viewAllForDay !== null} onOpenChange={() => setViewAllForDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4A081A] text-lg font-bold border-b border-rose-100 pb-2">
              Leave Entries for {MONTHS[month]} {viewAllForDay}, {year}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
            {viewAllForDay !== null && entriesForDay(viewAllForDay).map((e, i) => (
              <div
                key={e.id}
                onClick={() => { setSelectedEntry(e); setViewAllForDay(null) }}
                className="group flex flex-col gap-1 p-3 rounded-lg border border-rose-100 bg-white hover:bg-rose-50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm group-hover:text-[#4A081A]">{e.employee_name}</span>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                    e.status === 'Approved/Completed' ? 'bg-green-100 text-green-700'
                      : e.status === 'Declined' ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                  )}>
                    {e.status}
                  </span>
                </div>
                <div className="flex gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <span className={cn('w-1.5 h-1.5 rounded-full', e.category === 'half-day' ? 'bg-yellow-400' : 'bg-red-500')}></span>
                    {e.category === 'half-day' ? 'Half-Day' : 'Whole-Day'}
                  </span>
                  <span>•</span>
                  <span>{e.remarks}</span>
                  {e.shift && (
                    <>
                      <span>•</span>
                      <span className="italic text-slate-400">{e.shift}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Leave Detail Dialog ── */}
      {(() => {
        const se = selectedEntry
        if (!se) return null
        return (
          <Dialog open onOpenChange={() => setSelectedEntry(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-[#4A081A] text-base font-bold">
                  {se.employee_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    se.status === 'Approved/Completed' ? 'bg-green-100 text-green-700'
                      : se.status === 'Declined' ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                  )}>
                    {se.status}
                  </span>
                </div>
                <div className="border-t border-rose-50 pt-2 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department</span>
                    <span className="font-medium">{se.department || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category</span>
                    <span className={cn(
                      'font-semibold text-xs px-2 py-0.5 rounded-full',
                      se.category === 'half-day' ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'
                    )}>
                      {se.category === 'half-day' ? 'Half Day' : 'Whole Day'}
                    </span>
                  </div>
                  {se.shift && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shift</span>
                      <span className="font-medium">{se.shift}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Start Date</span>
                    <span className="font-medium">{se.start_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">End Date</span>
                    <span className="font-medium">{se.leave_end_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. of Days</span>
                    <span className="font-medium">{se.number_of_days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Leave Type</span>
                    <span className="font-medium">{se.remarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approved By</span>
                    <span className="font-medium">{se.approved_by}</span>
                  </div>
                  {se.cite_reason && (
                    <div className="pt-1 border-t border-rose-50">
                      <span className="text-slate-400 block mb-0.5">Reason</span>
                      <p className="text-slate-700 text-sm bg-rose-50 rounded-md p-2 leading-snug">
                        {se.cite_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      })()}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeavePage() {
  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [showCalendar, setShowCalendar] = useState(true)
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const [addModalOpen, setAddModalOpen] = useState(false)

  // ── Inline form state ──────────────────────────────────────────────────────
  const [inlineForm, setInlineForm] = useState({ ...emptyForm })
  const [empOpen, setEmpOpen] = useState(false)
  const [inlineSaving, setInlineSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<Omit<LeaveEntry, 'id'> | null>(null)

  // ── Shift schedules (from DB) ───────────────────────────────────────────────
  const [shiftSchedules, setShiftSchedules] = useState<DepartmentShiftSchedule[]>([])

  useEffect(() => {
    fetch(`${getApiUrl()}/api/department-shift-schedules`)
      .then(r => r.json())
      .then((json: { success: boolean; data: DepartmentShiftSchedule[] }) => {
        if (json.success) setShiftSchedules(json.data)
      })
      .catch(() => { /* fallback data will be used */ })
  }, [])

  const resetInlineForm = () => setInlineForm({ ...emptyForm })

  const handleInlineSelectEmployee = (emp: Employee) => {
    // Priority: 
    // 1. Explicit department name from emp
    // 2. Department name looked up via ID
    // 3. Fallback to position name (often contains department info)
    const dept =
      (emp.department && emp.department.trim()) ||
      departments.find(d => d.id === emp.department_id)?.name ||
      (emp.position && emp.position.trim()) ||
      ''
    setInlineForm(prev => ({ ...prev, employee_id: emp.id, employee_name: emp.name, department: dept, shift: '' }))
    setEmpOpen(false)
  }

  // Lookup shift info from DB data (fall back to static helper if not found)
  const _shiftRow = shiftSchedules.find(s => {
    const d1 = inlineForm.department.toLowerCase().trim()
    const d2 = s.department.toLowerCase().trim()
    if (!d1 || !d2) return false
    if (d1 === d2) return true
    const words1 = d1.split(/\s+/)
    const words2 = d2.split(/\s+/)
    return words1.some(w => words2.includes(w)) || words2.some(w => words1.includes(w))
  })
  const _fallback = inlineForm.department ? getShiftFallback(inlineForm.department) : null
  const inlineAvailableShifts: string[] = _shiftRow?.shift_options ?? _fallback?.shifts ?? []
  const inlineShiftLabel: string = _shiftRow?.schedule_label ?? _fallback?.label ?? ''

  // Auto-calc number of days for inline form
  useEffect(() => {
    if (inlineForm.start_date && inlineForm.leave_end_date) {
      const start = new Date(inlineForm.start_date)
      const end = new Date(inlineForm.leave_end_date)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
        const days = inlineForm.category === 'half-day' ? diff * 0.5 : diff
        setInlineForm(prev => ({ ...prev, number_of_days: days }))
      }
    }
  }, [inlineForm.start_date, inlineForm.leave_end_date, inlineForm.category])

  const inlineApprovalOptions = [
    ...APPROVAL_OPTIONS,
    ...HEAD_NAMES.map(h => ({ label: h, value: h, color: 'bg-green-500 text-white' })),
  ]
  const inlineRemarkOptions = LEAVE_REMARKS.map(r => ({ label: r, value: r }))

  const handleInlineSave = async () => {
    if (!inlineForm.employee_name) { toast.error('Please select an employee'); return }
    if (!inlineForm.category) { toast.error('Please select a category'); return }
    if (!inlineForm.start_date) { toast.error('Please enter a start date'); return }
    if (!inlineForm.leave_end_date) { toast.error('Please enter a leave end date'); return }
    if (!inlineForm.approved_by) { toast.error('Please select approval status'); return }
    if (!inlineForm.remarks) { toast.error('Please select leave type'); return }

    const payload: Omit<LeaveEntry, 'id'> = {
      employee_id: inlineForm.employee_id,
      employee_name: inlineForm.employee_name,
      department: inlineForm.department,
      category: inlineForm.category as 'half-day' | 'whole-day',
      shift: inlineForm.category === 'half-day' ? inlineForm.shift : undefined,
      start_date: inlineForm.start_date,
      leave_end_date: inlineForm.leave_end_date,
      number_of_days: inlineForm.number_of_days,
      approved_by: inlineForm.approved_by,
      remarks: inlineForm.remarks,
      cite_reason: inlineForm.cite_reason,
      status: inlineForm.approved_by === 'Pending' ? 'Pending'
        : inlineForm.approved_by === 'Declined' ? 'Declined'
          : 'Approved/Completed',
    }
    setPendingPayload(payload)
    setShowConfirm(true)
  }

  const confirmInlineSave = async () => {
    if (!pendingPayload) return
    setInlineSaving(true)
    try {
      await handleSave(pendingPayload)
      resetInlineForm()
      setAddModalOpen(false)
    } finally {
      setInlineSaving(false)
      setShowConfirm(false)
      setPendingPayload(null)
    }
  }

  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [entries, setEntries] = useState<LeaveEntry[]>([])

  // Filters
  const [filterDept, setFilterDept] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Fetch departments
  useEffect(() => {
    fetch(`${getApiUrl()}/api/departments`)
      .then(r => r.json())
      .then(d => { if (d.success) setDepartments(d.data) })
      .catch(console.error)
  }, [])

  // Fetch employees from full backend API (includes `department` string field)
  useEffect(() => {
    fetch(`${getApiUrl()}/api/employees`)
      .then(r => r.json())
      .then((d: { success: boolean; data: Array<{ id: string; first_name: string; last_name: string; department?: string | null; department_id?: number; position?: string | null }> }) => {
        if (d.success) {
          setEmployees(d.data.map(e => ({
            id: e.id,
            name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
            department: e.department ?? undefined,
            department_id: e.department_id,
            position: e.position ?? undefined,
          })))
        }
      })
      .catch(console.error)
  }, [])

  // Fetch leave entries
  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/admin-head/attendance/leave')
      const data = await res.json()
      if (data.success) setEntries(data.data ?? [])
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => { fetchEntries() }, [])

  const handleSave = async (entry: Omit<LeaveEntry, 'id'>) => {
    try {
      const res = await fetch('/api/admin-head/attendance/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Leave entry saved successfully')
        fetchEntries()
      } else {
        // If API not available yet, optimistically add
        setEntries(prev => [...prev, { ...entry, id: Date.now() }])
        toast.success('Leave entry added (local)')
      }
    } catch {
      setEntries(prev => [...prev, { ...entry, id: Date.now() }])
      toast.success('Leave entry added (local)')
    }
  }

  // Filtered entries
  const filtered = useMemo(() => entries.filter(e => {
    if (filterDept) {
      // Find employee to get their current department if the entry itself has no department snapshot
      const emp = employees.find(emp => emp.id === e.employee_id)
      const eDept = (e.department || emp?.department || '').toLowerCase()
      if (!eDept.includes(filterDept.toLowerCase())) return false
    }
    if (filterType && e.remarks !== filterType) return false
    if (filterStatus && e.status !== filterStatus) return false
    return true
  }), [entries, employees, filterDept, filterType, filterStatus])

  const calendarEntries = useMemo(() =>
    entries.filter(e => {
      const s = normalizeDate(e.start_date)
      const ed = normalizeDate(e.leave_end_date)
      const mStart = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`
      const lastDay = new Date(calendarYear, calendarMonth + 1, 0).getDate()
      const mEnd = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return s <= mEnd && ed >= mStart
    }),
    [entries, calendarYear, calendarMonth])

  const deptOptions = [
    { label: 'All Departments', value: '' },
    ...departments.map(d => ({ label: d.name, value: d.name })),
  ]
  const typeOptions = [{ label: 'All Types', value: '' }, ...LEAVE_REMARKS.map(r => ({ label: r, value: r }))]
  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved/Completed', value: 'Approved/Completed' },
    { label: 'Declined', value: 'Declined' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f0f2] via-white to-[#fff0f3]">
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmInlineSave}
        title="Confirm Save"
        description="Are you sure you want to save this leave monitoring entry?"
        confirmText="Save Leave"
        isLoading={inlineSaving}
      />
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] px-8 py-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Leave Monitoring</h1>
            <p className="text-rose-200 text-sm mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              ABIC REALTY &amp; CONSULTANCY
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalendar(v => !v)}
              className={cn(
                'flex items-center gap-2 text-white border border-white/30 font-semibold text-sm px-4 py-2 rounded-lg transition',
                !showCalendar ? 'bg-white/10 hover:bg-white/20' : 'bg-white/20 border-white/50'
              )}
            >
              {showCalendar ? (
                <><X className="w-4 h-4" /><span>HIDE CALENDAR</span></>
              ) : (
                <><Calendar className="w-4 h-4" /><span>SHOW CALENDAR</span></>
              )}
            </button>
            <button
              onClick={() => setAddModalOpen(v => !v)}
              className={cn(
                'flex items-center gap-2 text-white border border-white/30 font-semibold text-sm px-4 py-2 rounded-lg transition',
                addModalOpen ? 'bg-white/20 border-white/50' : 'bg-white/10 hover:bg-white/20'
              )}
            >
              {addModalOpen ? (
                <><X className="w-4 h-4" /><span>CLOSE</span></>
              ) : (
                <><Plus className="w-4 h-4" /><span>Add Leave for an Employee</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Secondary toolbar – filters ── */}
      <div className="bg-white border-b border-rose-100 px-8 py-3 flex flex-wrap items-center gap-4 shadow-sm">
        {/* Department filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#4A081A] uppercase tracking-wide">Department</span>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="border border-rose-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-rose-500"
          >
            {deptOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {/* Leave type filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#4A081A] uppercase tracking-wide">Leave Type</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-rose-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-rose-500"
          >
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#4A081A] uppercase tracking-wide">Status</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-rose-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-rose-500"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Inline Add Leave Form (toggleable) ── */}
      <div className={cn(
        'transition-all duration-500 overflow-hidden',
        addModalOpen ? 'max-h-[1200px] opacity-100 mb-8' : 'max-h-0 opacity-0 overflow-hidden'
      )}>
        <div className="px-8 py-6">
          <div className="bg-white rounded-xl shadow border border-rose-100 overflow-hidden ring-4 ring-rose-50/50">
            {/* Form Header */}
            <div className="bg-[#630C22] px-6 py-4">
              <h2 className="text-white text-xl font-bold">Add Leave Monitoring</h2>
            </div>

            <div className="px-10 py-10 space-y-10">
              <div className="grid grid-cols-3 gap-x-12 gap-y-10">
                {/* Row 1 */}
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">EMP. ID:</span>
                  <div className="flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-slate-50 text-slate-400 italic font-medium truncate select-all shadow-sm h-[46px] flex items-center">
                    {inlineForm.employee_id || 'Auto-filled on name selection'}
                  </div>
                </div>
                <div className="flex items-center gap-4 relative">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">NAME:</span>
                  <Popover open={empOpen} onOpenChange={setEmpOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="flex items-center justify-between flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white hover:border-[#4A081A] transition-all shadow-sm h-[46px]">
                        <span className={inlineForm.employee_name ? 'text-slate-800 font-medium italic' : 'text-slate-400 italic'}>
                          {inlineForm.employee_name || 'dropdown'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-80">
                      <Command>
                        <CommandInput placeholder="Search employee..." />
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {employees
                              .filter(e => e.id !== inlineForm.employee_id)
                              .map(emp => (
                                <CommandItem key={emp.id} value={emp.name} onSelect={() => handleInlineSelectEmployee(emp)}>
                                  {emp.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">CATEGORY:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="flex items-center justify-between flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white hover:border-[#4A081A] transition-all shadow-sm h-[46px]">
                        {inlineForm.category === 'half-day' ? (
                          <span className="px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 font-extrabold text-[10px] uppercase">half-day</span>
                        ) : inlineForm.category === 'whole-day' ? (
                          <span className="px-3 py-1 rounded-full bg-[#630C22] text-white font-extrabold text-[10px] uppercase">whole day</span>
                        ) : (
                          <span className="text-slate-400 italic">dropdown</span>
                        )}
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-2 w-48 space-y-1">
                      {inlineForm.category !== 'half-day' && (
                        <button type="button" onClick={() => setInlineForm(p => ({ ...p, category: 'half-day', shift: '' }))} className="w-full text-center px-3 py-2.5 rounded-md bg-yellow-400 text-yellow-900 font-bold text-sm hover:bg-yellow-300 transition-all uppercase tracking-wider">half-day</button>
                      )}
                      {inlineForm.category !== 'whole-day' && (
                        <button type="button" onClick={() => setInlineForm(p => ({ ...p, category: 'whole-day', shift: '' }))} className="w-full text-center px-3 py-2.5 rounded-md bg-[#630C22] text-white font-bold text-sm hover:bg-[#4A081A] transition-all uppercase tracking-wider">whole day</button>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Row 2 */}
                <div className="flex items-center gap-4 relative">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">SHIFT:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" disabled={inlineForm.category === 'whole-day'} className={cn('flex items-center justify-between flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white transition-all shadow-sm h-[46px]', inlineForm.category === 'whole-day' ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:border-[#4A081A]')}>
                        <span className={inlineForm.shift ? 'text-slate-800 font-medium italic' : 'text-slate-400 italic'}>{inlineForm.shift || 'dropdown'}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-2 w-72 space-y-1">
                      {inlineAvailableShifts.length > 0 ? (
                        inlineAvailableShifts
                          .filter(s => s !== inlineForm.shift)
                          .map(s => (
                            <button key={s} type="button" onClick={() => setInlineForm(p => ({ ...p, shift: s }))} className="w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-rose-50 transition-all">{s}</button>
                          ))
                      ) : (
                        <p className="text-xs text-slate-400 italic px-3 py-2">{inlineForm.department ? `No shifts configured for "${inlineForm.department}"` : 'Select an employee first'}</p>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">CHOOSE DATE:</span>
                  <div className="flex-1 h-[46px]">
                    <DateRangePicker startDate={inlineForm.start_date} endDate={inlineForm.leave_end_date} onChange={(s, e) => setInlineForm(p => ({ ...p, start_date: s, leave_end_date: e }))} />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">NO. OF DAYS:</span>
                  <Input readOnly value={inlineForm.number_of_days > 0 ? formatDays(inlineForm.number_of_days, inlineForm.category) : ''} placeholder="" className="border-[#630C22] bg-white text-slate-700 cursor-default flex-1 h-[46px] rounded-lg shadow-sm px-4 font-bold text-lg" />
                </div>

                {/* Row 3 */}
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">APPROVED BY:</span>
                  <div className="flex-1">
                    <ComboSelect value={inlineForm.approved_by} onChange={v => setInlineForm(p => ({ ...p, approved_by: v }))} options={inlineApprovalOptions} placeholder="dropdown" variant="pink" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right">REMARKS:</span>
                  <div className="flex-1">
                    <ComboSelect value={inlineForm.remarks} onChange={v => setInlineForm(p => ({ ...p, remarks: v }))} options={inlineRemarkOptions} placeholder="dropdown" variant="pink" />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-[10px] font-extrabold text-[#4A081A] uppercase tracking-[0.15em] w-24 shrink-0 text-right pt-4">REASON:</span>
                  <textarea rows={3} value={inlineForm.cite_reason} onChange={e => setInlineForm(p => ({ ...p, cite_reason: e.target.value }))} placeholder="specify reason" className="flex-1 border border-[#630C22] rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#4A081A] italic font-medium shadow-sm transition-all" />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-5 pt-8 pr-2">
                <Button variant="outline" onClick={() => { setAddModalOpen(false); resetInlineForm() }} className="border-rose-300 text-[#4A081A] hover:bg-rose-50 text-xs px-10 h-11 font-bold rounded-lg shadow-sm">Cancel</Button>
                <Button onClick={handleInlineSave} disabled={inlineSaving} className="bg-[#630C22] hover:bg-[#4A081A] text-white text-xs px-10 h-11 font-bold rounded-lg shadow-lg hover:shadow-[#630C22]/40 transition-all">
                  {inlineSaving ? 'Saving…' : 'Save Leave'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* ── Calendar ── */}
        {showCalendar && (
          <section>
            {/* Calendar nav */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#4A081A]">
                  {calendarMode === 'week' ? `Week of ${MONTHS[calendarMonth]} ${calendarYear}` : `${MONTHS[calendarMonth]} ${calendarYear}`}
                </span>
                {/* WEEK / MONTH toggle */}
                <div className="flex text-xs border border-rose-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setCalendarMode('week')}
                    className={cn(
                      'px-3 py-1 font-semibold transition',
                      calendarMode === 'week'
                        ? 'bg-[#4A081A] text-white'
                        : 'bg-rose-50 text-[#4A081A] hover:bg-rose-100'
                    )}
                  >
                    WEEK
                  </button>
                  <button
                    onClick={() => setCalendarMode('month')}
                    className={cn(
                      'px-3 py-1 font-semibold transition',
                      calendarMode === 'month'
                        ? 'bg-[#4A081A] text-white'
                        : 'bg-rose-50 text-[#4A081A] hover:bg-rose-100'
                    )}
                  >
                    MONTH
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) }
                    else setCalendarMonth(m => m - 1)
                  }}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-[#4A081A] transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const now = new Date()
                    setCalendarYear(now.getFullYear())
                    setCalendarMonth(now.getMonth())
                    setCalendarMode('month')
                    setShowCalendar(true)
                  }}
                  className="text-xs px-3 py-1.5 border border-rose-300 rounded-md text-[#4A081A] hover:bg-rose-50 transition font-semibold"
                >
                  TODAY
                </button>
                <button
                  onClick={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) }
                    else setCalendarMonth(m => m + 1)
                  }}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-[#4A081A] transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <CalendarView
              year={calendarYear}
              month={calendarMonth}
              entries={calendarEntries}
              weekOnly={calendarMode === 'week'}
            />
          </section>
        )}

        {/* ── Leave Monitoring Table ── */}
        <section>
          <div className="rounded-xl overflow-hidden shadow border border-rose-100">
            {/* Table header banner */}
            <div className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] py-3 text-center text-white text-sm font-bold tracking-widest uppercase">
              Leave Monitoring {MONTHS[calendarMonth]} {calendarYear}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#c0143c] text-white">
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center w-24">Emp. ID</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Employee Name</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">
                      Category<br /><span className="font-normal text-[10px] normal-case">(Half-Day / Whole Day)</span>
                    </th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Shift</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Start Date</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Leave End Date</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">No. of Days</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">
                      Approved By<br /><span className="font-normal text-[10px] normal-case">(Dropdown)</span>
                    </th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Remarks</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-6 text-center text-slate-400 italic text-xs">
                        No leave records yet. Click "+ Add Leave for an Employee" to add one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={cn('border-b border-rose-50 hover:bg-rose-50 transition', idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/30')}
                      >
                        <td className="border border-rose-100 px-3 py-3 text-center text-slate-700 font-bold text-xs">{entry.employee_id}</td>
                        <td className="border border-rose-100 px-3 py-3 font-semibold text-slate-700">{entry.employee_name}</td>
                        <td className="border border-rose-100 px-3 py-3 text-center">
                          {entry.category === 'half-day' ? (
                            <span className="px-3 py-1 rounded bg-yellow-400 text-yellow-900 font-bold text-xs">HALF-DAY</span>
                          ) : (
                            <span className="px-3 py-1 rounded bg-red-600 text-white font-bold text-xs">WHOLE DAY</span>
                          )}
                        </td>
                        <td className="border border-rose-100 px-3 py-3 text-center text-slate-600 text-xs italic">{entry.shift || '—'}</td>
                        <td className="border border-rose-100 px-3 py-3 text-center text-slate-600 text-xs font-medium">{formatDisplayDate(entry.start_date)}</td>
                        <td className="border border-rose-100 px-3 py-3 text-center text-slate-600 text-xs font-medium">{formatDisplayDate(entry.leave_end_date)}</td>
                        <td className="border border-rose-100 px-3 py-3 text-center font-bold text-[#4A081A] text-xs">
                          {formatDays(entry.number_of_days, entry.category)}
                        </td>
                        <td className="border border-rose-100 px-3 py-3 text-center">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-bold',
                            entry.approved_by === 'Pending' && 'bg-orange-100 text-orange-700',
                            entry.approved_by === 'Declined' && 'bg-red-100 text-red-700',
                            !['Pending', 'Declined'].includes(entry.approved_by) && 'bg-green-100 text-green-700',
                          )}>
                            {entry.approved_by}
                          </span>
                        </td>
                        <td className="border border-rose-100 px-3 py-3 text-center">
                          <span className="font-semibold text-[#4A081A] text-xs">{entry.remarks}</span>
                        </td>
                        <td className="border border-rose-100 px-3 py-3 text-slate-600 text-xs">
                          {entry.cite_reason ? (
                            <p className="italic line-clamp-2" title={entry.cite_reason}>{entry.cite_reason}</p>
                          ) : (
                            <span className="text-slate-300">No reason cited</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>


    </div>
  )
}
