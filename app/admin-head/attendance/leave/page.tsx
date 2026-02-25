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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department { id: number; name: string }
interface Employee { id: number; name: string; department?: string; department_id?: number }

interface LeaveEntry {
  id: number
  employee_id: number
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

// ─── Department → shift schedule mapping ──────────────────────────────────────
const DEPARTMENT_SHIFTS: Record<string, { label: string; shifts: string[] }> = {
  'ABIC': {
    label: 'ABIC (8am–12pm / 1pm–4pm)',
    shifts: ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM'],
  },
  'Accounting': {
    label: 'ABIC (8am–12pm / 1pm–4pm)',
    shifts: ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM'],
  },
  'Sales': {
    label: 'ABIC (8am–12pm / 1pm–4pm)',
    shifts: ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM'],
  },
  'Admin': {
    label: 'ABIC (8am–12pm / 1pm–4pm)',
    shifts: ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM'],
  },
  'Multimedia': {
    label: 'Multimedia (10am–2pm / 3pm–7pm)',
    shifts: ['10:00 AM – 2:00 PM', '3:00 PM – 7:00 PM'],
  },
  'Marketing': {
    label: 'Multimedia (10am–2pm / 3pm–7pm)',
    shifts: ['10:00 AM – 2:00 PM', '3:00 PM – 7:00 PM'],
  },
  'Studio': {
    label: 'Multimedia (10am–2pm / 3pm–7pm)',
    shifts: ['10:00 AM – 2:00 PM', '3:00 PM – 7:00 PM'],
  },
  'IT': {
    label: 'Infinitech (9am–1pm / 2pm–6pm)',
    shifts: ['9:00 AM – 1:00 PM', '2:00 PM – 6:00 PM'],
  },
  'Infinitech': {
    label: 'Infinitech (9am–1pm / 2pm–6pm)',
    shifts: ['9:00 AM – 1:00 PM', '2:00 PM – 6:00 PM'],
  },
}

function getShiftsForDepartment(departmentName: string): string[] {
  const key = Object.keys(DEPARTMENT_SHIFTS).find(k =>
    departmentName.toLowerCase().includes(k.toLowerCase())
  )
  return key ? DEPARTMENT_SHIFTS[key].shifts : ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM']
}

function getShiftLabelForDepartment(departmentName: string): string {
  const key = Object.keys(DEPARTMENT_SHIFTS).find(k =>
    departmentName.toLowerCase().includes(k.toLowerCase())
  )
  return key ? DEPARTMENT_SHIFTS[key].label : 'Standard Shift'
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

// ─── Combobox helper ───────────────────────────────────────────────────────────
function ComboSelect({
  value, onChange, options, placeholder, disabled = false
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string; color?: string }[]
  placeholder: string
  disabled?: boolean
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
            'flex items-center justify-between w-full border border-rose-300 rounded-md px-3 py-2 text-sm bg-white text-left',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'hover:border-rose-500 focus:outline-none'
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
              {options.map(opt => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => { onChange(opt.value); setOpen(false) }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
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

// ─── Add Leave Modal ──────────────────────────────────────────────────────────
interface AddLeaveModalProps {
  open: boolean
  onClose: () => void
  employees: Employee[]
  departments: Department[]
  onSave: (entry: Omit<LeaveEntry, 'id'>) => void
}

const emptyForm = {
  employee_id: 0,
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

  // Reset on open
  useEffect(() => {
    if (open) setForm({ ...emptyForm })
  }, [open])

  // Auto-set department when employee is selected
  const handleSelectEmployee = (emp: Employee) => {
    const dept = departments.find(d => d.id === emp.department_id)?.name ?? emp.department ?? ''
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

  const availableShifts = form.department ? getShiftsForDepartment(form.department) : []
  const shiftLabel = form.department ? getShiftLabelForDepartment(form.department) : ''

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

    setSaving(true)
    try {
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
      onSave(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-rose-100 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] px-8 py-6">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Add Leave for an Employee
          </DialogTitle>
          <p className="text-rose-200 text-sm mt-1">Fill in the leave details below</p>
        </DialogHeader>

        <div className="px-8 py-6 space-y-5 overflow-y-auto max-h-[72vh]">
          {/* Row 1 – Name & Category */}
          <div className="grid grid-cols-2 gap-6">
            {/* NAME */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Name</Label>
              <Popover open={empOpen} onOpenChange={setEmpOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full border border-rose-300 rounded-md px-3 py-2 text-sm bg-white hover:border-rose-500 focus:outline-none"
                  >
                    <span className={form.employee_name ? 'text-slate-800 font-medium italic' : 'text-slate-400 italic'}>
                      {form.employee_name || 'dropdown'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-72">
                  <Command>
                    <CommandInput placeholder="Search employee..." />
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {employees.map(emp => (
                          <CommandItem
                            key={emp.id}
                            value={emp.name}
                            onSelect={() => handleSelectEmployee(emp)}
                          >
                            <Check className={cn('mr-2 h-4 w-4', form.employee_id === emp.id ? 'opacity-100' : 'opacity-0')} />
                            {emp.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* CATEGORY */}
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Category</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full border border-rose-300 rounded-md px-3 py-2 text-sm bg-white hover:border-rose-500 focus:outline-none"
                  >
                    {form.category === 'half-day' ? (
                      <span className="px-3 py-0.5 rounded-full bg-yellow-400 text-yellow-900 font-bold text-xs">half-day</span>
                    ) : form.category === 'whole-day' ? (
                      <span className="px-3 py-0.5 rounded-full bg-red-600 text-white font-bold text-xs">whole day</span>
                    ) : (
                      <span className="text-slate-400 italic">dropdown</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-44 space-y-1">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, category: 'half-day', shift: '' }))}
                    className="w-full text-center px-3 py-2 rounded-md bg-yellow-400 text-yellow-900 font-bold text-sm hover:bg-yellow-300 transition"
                  >
                    half-day
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, category: 'whole-day', shift: '' }))}
                    className="w-full text-center px-3 py-2 rounded-md bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition"
                  >
                    whole day
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 2 – Start Date & Shift */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Shift</Label>
              {shiftLabel && (
                <p className="text-xs text-slate-400 italic mb-1">{shiftLabel}</p>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={form.category === 'whole-day'}
                    className={cn(
                      'flex items-center justify-between w-full border border-rose-300 rounded-md px-3 py-2 text-sm bg-white',
                      form.category === 'whole-day' ? 'opacity-50 cursor-not-allowed' : 'hover:border-rose-500 focus:outline-none'
                    )}
                  >
                    <span className={form.shift ? 'text-slate-800 font-medium italic' : 'text-slate-400 italic'}>
                      {form.shift || 'dropdown'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </PopoverTrigger>
                {form.category !== 'whole-day' && (
                  <PopoverContent className="p-2 w-56 space-y-1">
                    {availableShifts.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, shift: s }))}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-rose-50 transition',
                          form.shift === s && 'bg-rose-100 font-semibold text-[#4A081A]'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </PopoverContent>
                )}
              </Popover>
              {form.category === 'whole-day' && (
                <p className="text-xs text-slate-400 italic">// disabled if whole day is selected</p>
              )}
            </div>
          </div>

          {/* Row 3 – Leave End Date & Number of Days */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Leave End Date</Label>
              <Input
                type="date"
                value={form.leave_end_date}
                min={form.start_date}
                onChange={e => setForm(prev => ({ ...prev, leave_end_date: e.target.value }))}
                className="border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Number of Days</Label>
              <Input
                readOnly
                value={form.number_of_days > 0 ? form.number_of_days : ''}
                placeholder="auto-calculated"
                className="border-rose-300 bg-rose-50 text-slate-700 cursor-default"
              />
              <p className="text-xs text-slate-400 italic">// automatic count from start date to leave end date</p>
              {form.category === 'half-day' && form.number_of_days > 0 && (
                <p className="text-xs text-slate-400 italic">
                  // half day: {form.number_of_days} days ({form.number_of_days * 4} hours)
                </p>
              )}
            </div>
          </div>

          {/* Row 4 – Approved By & Remarks */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Approved By</Label>
              <ComboSelect
                value={form.approved_by}
                onChange={v => setForm(prev => ({ ...prev, approved_by: v }))}
                options={approvalOptions}
                placeholder="dropdown"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Remarks (Leave Type)</Label>
              <ComboSelect
                value={form.remarks}
                onChange={v => setForm(prev => ({ ...prev, remarks: v }))}
                options={remarkOptions}
                placeholder="dropdown"
              />
            </div>
          </div>

          {/* Cite Reason */}
          <div className="space-y-1">
            <Label className="text-sm font-bold text-[#4A081A] uppercase tracking-wide">Cite Reason</Label>
            <textarea
              rows={3}
              value={form.cite_reason}
              onChange={e => setForm(prev => ({ ...prev, cite_reason: e.target.value }))}
              placeholder="// Text box for citing reason"
              className="w-full border border-rose-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200 placeholder:text-slate-400 placeholder:italic"
            />
          </div>
        </div>

        <DialogFooter className="px-8 py-4 bg-rose-50 border-t border-rose-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-rose-300 text-[#4A081A] hover:bg-rose-50">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#4A081A] to-[#630C22] text-white hover:opacity-90"
          >
            {saving ? 'Saving…' : 'Save Leave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      const s = new Date(e.start_date)
      const ed = new Date(e.leave_end_date)
      const d = new Date(dateStr)
      return d >= s && d <= ed
    })
  }

  // Click-to-view state
  const [selectedEntry, setSelectedEntry] = useState<LeaveEntry | null>(null)

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
                {dayEntries.slice(0, 3).map((e, i) => {
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
                      onClick={() => setSelectedEntry(e)}
                      title={`${e.employee_name} • ${e.remarks}`}
                      style={{
                        marginLeft: roundLeft ? '2px' : '0px',
                        marginRight: roundRight ? '2px' : '-1px',
                        borderRadius: `${roundLeft ? 3 : 0}px ${roundRight ? 3 : 0}px ${roundRight ? 3 : 0}px ${roundLeft ? 3 : 0}px`,
                      }}
                      className={cn(
                        'h-[14px] px-1.5 text-[10px] leading-[14px] text-white font-medium truncate overflow-hidden select-none cursor-pointer hover:brightness-110 transition-[filter]',
                        barColor
                      )}
                    >
                      {`${e.employee_name}, ${e.remarks}`}
                    </div>
                  )
                })}
                {dayEntries.length > 3 && (
                  <div className="text-[9px] text-slate-400 mt-0.5">+{dayEntries.length - 3} more</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

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

  // Fetch employees
  useEffect(() => {
    fetch('/api/admin-head/employees')
      .then(r => r.json())
      .then(d => { if (d.success) setEmployees(d.data) })
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
    if (filterDept && !e.department.toLowerCase().includes(filterDept.toLowerCase())) return false
    if (filterType && e.remarks !== filterType) return false
    if (filterStatus && e.status !== filterStatus) return false
    return true
  }), [entries, filterDept, filterType, filterStatus])

  const calendarEntries = useMemo(() =>
    entries.filter(e => {
      const s = new Date(e.start_date)
      const ed = new Date(e.leave_end_date)
      const monthStart = new Date(calendarYear, calendarMonth, 1)
      const monthEnd = new Date(calendarYear, calendarMonth + 1, 0)
      return s <= monthEnd && ed >= monthStart
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
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] px-8 py-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Leave Monitoring</h1>
            <p className="text-rose-200 text-sm mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              ABIC REALTY &amp; CONSULTANCY
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold text-sm px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              + Add Leave for an Employee
            </button>
            <button
              onClick={() => setShowCalendar(v => !v)}
              className="text-rose-200 hover:text-white text-sm font-semibold underline underline-offset-2 transition"
            >
              {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
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
                    setCalendarYear(today.getFullYear())
                    setCalendarMonth(today.getMonth())
                    setCalendarMode('month')
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
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center w-12">ID</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Employee Name</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">
                      Category<br /><span className="font-normal text-[10px] normal-case">(Half-Day / Whole Day)</span>
                    </th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Start Date</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">Leave End Date</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">No. of Days</th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">
                      Approved By<br /><span className="font-normal text-[10px] normal-case">(Dropdown)</span>
                    </th>
                    <th className="border border-[#7B0F2B] px-3 py-3 font-bold text-xs uppercase text-center">
                      Remarks (Type of Leave)<br /><span className="font-normal text-[10px] normal-case">and Text for Citing Reason</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <>
                      {/* Sample rows to show styling */}
                      <tr className="border-b border-rose-100">
                        <td className="border border-rose-100 px-3 py-4 text-center text-slate-300"></td>
                        <td className="border border-rose-100 px-3 py-4 text-center text-slate-300"></td>
                        <td className="border border-rose-100 px-3 py-4 text-center">
                          <span className="px-4 py-1 rounded bg-yellow-400 text-yellow-900 font-bold text-xs block mx-auto w-fit">HALF-DAY</span>
                        </td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                      </tr>
                      <tr className="border-b border-rose-100">
                        <td className="border border-rose-100 px-3 py-4 text-center text-slate-300"></td>
                        <td className="border border-rose-100 px-3 py-4 text-center text-slate-300"></td>
                        <td className="border border-rose-100 px-3 py-4 text-center">
                          <span className="px-4 py-1 rounded bg-red-600 text-white font-bold text-xs block mx-auto w-fit">WHOLE DAY</span>
                        </td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                        <td className="border border-rose-100 px-3 py-4"></td>
                      </tr>
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-slate-400 italic text-xs">
                          No leave records yet. Click "+ Add Leave for an Employee" to add one.
                        </td>
                      </tr>
                    </>
                  ) : (
                    filtered.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={cn('border-b border-rose-50 hover:bg-rose-50 transition', idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/30')}
                      >
                        <td className="border border-rose-100 px-3 py-3 text-center text-slate-500 text-xs">{idx + 1}</td>
                        <td className="border border-rose-100 px-3 py-3 font-semibold text-slate-700">{entry.employee_name}</td>
                        <td className="border border-rose-100 px-3 py-3 text-center">
                          {entry.category === 'half-day' ? (
                            <span className="px-3 py-1 rounded bg-yellow-400 text-yellow-900 font-bold text-xs">HALF-DAY</span>
                          ) : (
                            <span className="px-3 py-1 rounded bg-red-600 text-white font-bold text-xs">WHOLE DAY</span>
                          )}
                        </td>
                        <td className="border border-rose-100 px-3 py-3 text-center text-slate-600 text-xs">{entry.start_date}</td>
                        <td className="border border-rose-100 px-3 py-3 text-center text-slate-600 text-xs">{entry.leave_end_date}</td>
                        <td className="border border-rose-100 px-3 py-3 text-center font-semibold text-slate-700">{entry.number_of_days}</td>
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
                        <td className="border border-rose-100 px-3 py-3 text-slate-600 text-xs">
                          <span className="font-semibold text-[#4A081A]">{entry.remarks}</span>
                          {entry.cite_reason && (
                            <p className="text-slate-400 mt-0.5 italic">{entry.cite_reason}</p>
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

      {/* ── Add Leave Modal ── */}
      <AddLeaveModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        employees={employees}
        departments={departments}
        onSave={handleSave}
      />
    </div>
  )
}
