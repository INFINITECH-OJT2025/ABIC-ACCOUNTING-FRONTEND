//latest tardiness



'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Clock, Plus, Search, Users, ChevronLeft, ChevronRight, FileDown, FileText, Check, AlertTriangle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// ---------- TYPES & MOCK INITIAL DATA ----------
// ---------- TYPES & MOCK INITIAL DATA ----------
interface LateEntry {
  id: string | number
  employee_id: number
  employeeName: string // for backward compatibility in some components
  employee_name: string
  date: string
  actual_in: string
  actualIn?: string // for compatibility with existing display logic
  minutesLate: number
  warningLevel?: number
  warning_level?: number
  cutoff_period?: string
  cutoffPeriod?: string
  month: string
  year: number
}

interface Employee {
  id: number
  name: string
  nickname?: string
}

// Available years & months
const availableYears = [2025, 2026, 2027]
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ---------- TIME PARSING UTILITY ----------
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0

  // Support 12h format: HH:MM AM/PM
  const regex12 = /(\d{1,2}):(\d{2})\s*(AM|PM)/i
  const match12 = timeStr.match(regex12)

  if (match12) {
    let hours = parseInt(match12[1])
    const minutes = parseInt(match12[2])
    const period = match12[3].toUpperCase()

    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    return hours * 60 + minutes
  }

  // Support 24h format: HH:MM:SS (standard MySQL TIME format) or HH:MM
  const regex24 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  const match24 = timeStr.match(regex24)

  if (match24) {
    const hours = parseInt(match24[1])
    const minutes = parseInt(match24[2])
    // Seconds are ignored as lates are counted by minutes
    return hours * 60 + minutes
  }

  return 0
}

// Calculate minutes from 8:00 AM (no grace period) - for table display
function calculateMinutesFrom8AM(actualIn: string): number {
  const startTimeMinutes = 8 * 60 // 8:00 AM
  const actualTimeMinutes = parseTimeToMinutes(actualIn)

  if (actualTimeMinutes <= startTimeMinutes) return 0

  return actualTimeMinutes - startTimeMinutes
}

// Check if time exceeds grace period (8:05 AM) - for summary occurrences
function exceedsGracePeriod(actualIn: string): boolean {
  const graceTimeMinutes = 8 * 60 + 5 // 8:05 AM
  const actualTimeMinutes = parseTimeToMinutes(actualIn)

  return actualTimeMinutes > graceTimeMinutes
}

// Normalizes date input to YYYY-MM-DD using local time to avoid timezone shifts
function formatDate(dateInput: any): string {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calculate warning level for an employee based on their late count across cutoffs
function calculateWarningLevel(employeeName: string, cutoffNumber: number, allEntries: LateEntry[]): number {
  // Count how many times this employee has been late in cutoffs
  const latesInCutoff1 = allEntries.filter(e => e.employee_name === employeeName && e.cutoff_period === 'cutoff1' && exceedsGracePeriod(e.actual_in || e.actualIn || '')).length
  const latesInCutoff2 = allEntries.filter(e => e.employee_name === employeeName && e.cutoff_period === 'cutoff2' && exceedsGracePeriod(e.actual_in || e.actualIn || '')).length

  if (cutoffNumber === 1 && latesInCutoff1 > 0) return 1 // 1st warning
  if (cutoffNumber === 2 && latesInCutoff2 > 0) return 2 // 2nd warning

  return 0
}

// ---------- PAGINATION HOOK ----------
function usePagination<T>(items: T[], itemsPerPage: number = 15) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }
}

// ---------- EXCEL EXPORT UTILITY ----------
function exportToExcel(summaryArray: { name: string; totalMinutes: number; occurrences: number; warnings: number }[], cutoffTitle: string, month: string, year: number) {
  // Prepare data for Excel
  const worksheetData = [
    [`Tardiness Summary Report - ${cutoffTitle}`],
    [`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [],
    ['Employee Name', 'Total Lates (minutes)', 'Total Lates (count > 8:05AM)', 'Warnings'],
    ...summaryArray.map(emp => [emp.name, emp.totalMinutes, emp.occurrences, emp.warnings]),
    [],
    ['Summary Statistics'],
    ['Total Employees with Lates', summaryArray.length],
    ['Total Late Minutes', summaryArray.reduce((sum, emp) => sum + emp.totalMinutes, 0)],
    ['Total Lates', summaryArray.reduce((sum, emp) => sum + emp.occurrences, 0)],
    ['Total Warnings', summaryArray.reduce((sum, emp) => sum + emp.warnings, 0)],
    ['Average Minutes per Late',
      summaryArray.length ?
        (summaryArray.reduce((sum, emp) => sum + emp.totalMinutes, 0) /
          summaryArray.reduce((sum, emp) => sum + emp.occurrences, 0) || 0).toFixed(1)
        : 0
    ],
    [],
    ['* Minutes are counted from 8:00 AM'],
    ['* Total Lates count is based on arrivals after 8:05 AM grace period'],
    ['* Warnings: Every 3 lates = 1 warning'],
    [`* Report for ${month} ${year} - ${cutoffTitle}`]
  ]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // Style the worksheet
  ws['!cols'] = [
    { wch: 30 }, // Employee Name
    { wch: 25 }, // Total Minutes
    { wch: 25 }, // Occurrences
    { wch: 15 }, // Warnings
  ]

  // Create a safe sheet name (max 31 chars, no special chars)
  let sheetName = `Tardiness_${cutoffTitle.replace(/[^a-zA-Z0-9]/g, '_')}`
  if (sheetName.length > 31) {
    sheetName = sheetName.substring(0, 31);
  }

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Export the file
  XLSX.writeFile(wb, `Tardiness_Summary_${cutoffTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${month}_${year}.xlsx`)
}

// ---------- EMPLOYEE SELECTOR COMPONENT ----------
function EmployeeSelector({
  value,
  onChange,
  employees
}: {
  value: string
  onChange: (name: string) => void
  employees: Employee[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-7 md:h-8 text-xs md:text-sm border-stone-200 hover:bg-stone-50 font-medium"
        >
          <span className="truncate">{value || "Select employee..."}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search employee..." className="h-9" />
          <CommandEmpty>No employee found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === employee.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {employee.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


// ---------- SUMMARY SHEET COMPONENT ----------
interface SummarySheetProps {
  isOpen: boolean
  onClose: () => void
  cutoffTitle: string
  entries: LateEntry[]
  selectedYear: number
  selectedMonth: string
  employees: Employee[]
}

function SummarySheet({ isOpen, onClose, cutoffTitle, entries, selectedYear, selectedMonth, employees }: SummarySheetProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate summary from entries - ONLY from this specific cutoff range
  const summaryMap = new Map<number, { totalMinutes: number; occurrences: number; name: string }>()

  // Initialize all employees with 0 values
  employees.forEach(emp => {
    summaryMap.set(emp.id, { totalMinutes: 0, occurrences: 0, name: emp.name })
  })

  // Add actual data
  entries.forEach(entry => {
    const current = summaryMap.get(entry.employee_id)
    if (current) {
      current.totalMinutes += entry.minutesLate
      // Use helper to check if late (assuming 8:05 AM grace)
      const actualTime = entry.actual_in || entry.actualIn || ''
      if (actualTime && exceedsGracePeriod(actualTime)) {
        current.occurrences += 1
      }
    }
  })

  // Convert to array preserving the order of employees
  const summaryArray = employees.map(emp => {
    const data = summaryMap.get(emp.id) || { totalMinutes: 0, occurrences: 0, name: emp.name }
    const warnings = Math.floor(data.occurrences / 3) // 3 lates = 1 warning
    return {
      name: data.name,
      totalMinutes: data.totalMinutes,
      occurrences: data.occurrences,
      warnings: warnings
    }
  })

  // Filter based on search query
  const filteredSummaryArray = summaryArray.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalLateMinutes = summaryArray.reduce((sum, emp) => sum + emp.totalMinutes, 0)
  const totalOccurrences = summaryArray.reduce((sum, emp) => sum + emp.occurrences, 0)
  const totalWarnings = summaryArray.reduce((sum, emp) => sum + emp.warnings, 0)

  // Pagination for summary
  const summaryPagination = usePagination(filteredSummaryArray, 15)

  // Handle export
  const handleExport = () => {
    exportToExcel(summaryArray, cutoffTitle, selectedMonth, selectedYear)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-white border-l-4 border-[#4A081A] text-slate-900 overflow-y-auto p-0">
        <SheetHeader className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] p-8 text-white relative">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-3xl text-white font-bold flex items-center gap-2">
                <FileText className="w-8 h-8" />
                Summary Report
              </SheetTitle>
              <SheetDescription className="text-white/80 text-lg mt-1 font-medium">
                {cutoffTitle} • {selectedMonth} {selectedYear}
              </SheetDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#630C22]" />
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/90 border-0 text-slate-800 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-white rounded-lg"
              />
            </div>
            <Button
              size="sm"
              onClick={handleExport}
              className="bg-white text-[#4A081A] hover:bg-rose-50 border-0 text-sm h-10 px-6 flex items-center gap-2 font-bold shadow-lg transition-all duration-300 w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4" />
              Export
            </Button>
          </div>
        </SheetHeader>


        <div className="p-6 space-y-6">

          {/* Summary table - ONLY shows entries from this cutoff */}
          <Card className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-[#4A081A] font-bold">Employee Lates Summary</CardTitle>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#630C22]">{totalLateMinutes} mins / {totalOccurrences} occ / {totalWarnings} warnings</p>
                </div>
              </div>
              <CardDescription className="text-[#630C22]/70 text-xs font-medium">
                Minutes from 8:00 AM • Occurrences after 8:05 AM • {cutoffTitle} only
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">EMPLOYEE NAME</th>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">TOTAL LATES (MINS)</th>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">NO. OF LATES</th>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">WARNINGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {summaryPagination.paginatedItems.length > 0 ? (
                      summaryPagination.paginatedItems.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-[#FFE5EC] transition-colors duration-200">
                          <td className="px-4 py-3 text-slate-700 font-semibold">{emp.name}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFE5EC] text-[#800020] border border-[#C9184A]">
                              {emp.totalMinutes}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {emp.occurrences > 0 ? (
                              <span className="px-3 py-1 bg-rose-100 text-[#C9184A] rounded-full text-xs font-bold border border-rose-200">
                                {emp.occurrences}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {emp.warnings > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                                  {emp.warnings}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">
                          No late entries found for this cutoff period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>


          <div className="text-xs text-stone-500 space-y-1">
            <p>* Minutes are counted from 8:00 AM (no grace period in minutes display)</p>
            <p>* Occurrences are only counted for arrivals after 8:05 AM grace period</p>
            <p>* Warnings: Every 3 lates = 1 warning</p>
            <p>This report includes data only from {cutoffTitle}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------- MAIN DASHBOARD ----------
export default function AttendanceDashboard() {
  // State for year & month selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('February')
  const [yearsList, setYearsList] = useState<number[]>(availableYears)

  // State for all entries (Master Record)
  const [allEntries, setAllEntries] = useState<LateEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch years list
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/admin-head/attendance/tardiness/years')
        const data = await res.json()
        if (data.success) {
          setYearsList(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch years:', error)
      }
    }
    fetchYears()
  }, [])

  // Fetch employees and entries
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch employees
        const empRes = await fetch('/api/admin-head/employees')
        const empData = await empRes.json()
        if (empData.success) {
          setEmployees(empData.data)
        }

        // Fetch entries for current month/year
        const entRes = await fetch(`/api/admin-head/attendance/tardiness?month=${selectedMonth}&year=${selectedYear}`)
        const entData = await entRes.json()
        if (entData.success) {
          // Map backend fields to frontend interface
          const mappedEntries = entData.data.map((e: any) => ({
            ...e,
            date: formatDate(e.date),
            employeeName: e.employee_name,
            cutoffPeriod: e.cutoff_period,
            actualIn: e.actual_in,
            minutesLate: e.minutes_late,
            warningLevel: e.warning_level
          }))
          // Sort entries by date ascending (oldest to newest), then by time
          const sortedEntries = mappedEntries.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            if (dateA !== dateB) return dateA - dateB
            return parseTimeToMinutes(a.actual_in || a.actualIn) - parseTimeToMinutes(b.actual_in || b.actualIn)
          })
          setAllEntries(sortedEntries)
        }



      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data from server')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedMonth, selectedYear])

  // Derive cutoff data for the SELECTED month and year
  const filteredByPeriod = allEntries.filter(
    entry => entry.month === selectedMonth && entry.year === selectedYear
  )

  const firstCutoffEntries = filteredByPeriod.filter(e => e.cutoffPeriod === 'cutoff1')
  const secondCutoffEntries = filteredByPeriod.filter(e => e.cutoffPeriod === 'cutoff2')

  // Summary visibility state - controlled by Summary buttons
  const [summarySheetOpen, setSummarySheetOpen] = useState(false)
  const [activeCutoffSummary, setActiveCutoffSummary] = useState<{ title: string; entries: LateEntry[] } | null>(null)

  // UI state for which cutoff table to show
  const [showCutoff, setShowCutoff] = useState<'first' | 'second' | 'both'>('both')

  // Global Search state for both cutoff tables
  const [searchQuery, setSearchQuery] = useState('')

  // Filter entries based on search before pagination
  const filteredFirstEntries = firstCutoffEntries.filter(entry =>
    entry.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSecondEntries = secondCutoffEntries.filter(entry =>
    entry.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination states for each table (using filtered entries)
  const firstPagination = usePagination(filteredFirstEntries, 15)
  const secondPagination = usePagination(filteredSecondEntries, 15)

  // Handler to add a new year
  const addNewYear = async () => {
    const nextYear = Math.max(...yearsList) + 1
    try {
      const res = await fetch('/api/admin-head/attendance/tardiness/years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: nextYear })
      })
      const data = await res.json()
      if (data.success) {
        setYearsList(prev => [...prev, nextYear].sort())
        setSelectedYear(nextYear)
        toast.success(`Year ${nextYear} added and saved to database`)
      } else {
        toast.error(data.message || 'Failed to save new year')
      }
    } catch (error) {
      console.error('Failed to add year:', error)
      toast.error('An error occurred while saving the new year')
    }
  }


  // Debounce refs to avoid firing API on every keystroke
  const debounceTimers = useRef<Record<string | number, ReturnType<typeof setTimeout>>>({})

  // Shared handler to update actual_in time — updates local state immediately
  // and persists to the database after a short debounce
  const updateEntryTime = (id: string | number, newTime: string) => {
    const minutesLate = calculateMinutesFrom8AM(newTime)

    // Optimistic local update
    setAllEntries(prev =>
      prev.map(entry => {
        if (entry.id === id) {
          return {
            ...entry,
            actual_in: newTime,
            actualIn: newTime,
            minutesLate,
          }
        }
        return entry
      })
    )

    // Debounce the API call (600ms)
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id])
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin-head/attendance/tardiness/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actualIn: newTime, minutesLate }),
        })
        const data = await res.json()
        if (!data.success) {
          toast.error(data.message || 'Failed to update entry')
        }
      } catch (err) {
        console.error('Update error:', err)
        toast.error('An error occurred while updating the entry')
      }
    }, 600)
  }

  const updateFirstCutoffTime = (id: string | number, newTime: string) => updateEntryTime(id, newTime)
  const updateSecondCutoffTime = (id: string | number, newTime: string) => updateEntryTime(id, newTime)

  const [addEntryModalOpen, setAddEntryModalOpen] = useState(false)
  const [newEntryEmployee, setNewEntryEmployee] = useState('')
  const [newEntryTime, setNewEntryTime] = useState('')

  // Open modal for adding entry
  const openAddEntryModal = () => {
    setNewEntryEmployee('')
    setNewEntryTime('')
    setAddEntryModalOpen(true)
  }


  // Handler to save new entry from modal
  const handleSaveNewEntry = async () => {
    if (!newEntryEmployee || !newEntryTime) {
      toast.error('Please select an employee and enter the actual in time.')
      return
    }

    const selectedEmployee = employees.find(e => e.name === newEntryEmployee)
    if (!selectedEmployee) return

    // ALWAYS use today's date for new entries as requested
    const dateObj = new Date()
    const entryYear = dateObj.getFullYear()
    const entryMonth = months[dateObj.getMonth()]
    const dayOfMonth = dateObj.getDate()
    const dateStr = `${entryYear}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`

    // Determine cutoff
    const autoCutoff: 'cutoff1' | 'cutoff2' = dayOfMonth <= 15 ? 'cutoff1' : 'cutoff2'

    // Minutes calculation (parseTimeToMinutes now supports the 24h output from <input type="time">)
    const minutesLate = calculateMinutesFrom8AM(newEntryTime)

    // Validation 2: Check if employee already has an entry for this date (Strict Prevention)
    // Normalize dates for robust comparison
    const duplicateEntry = allEntries.find(
      entry => entry.employee_id === selectedEmployee.id && formatDate(entry.date) === dateStr
    )

    if (duplicateEntry) {
      toast.error(`${newEntryEmployee} already has a late entry recorded for today (${dateStr}).`)
      return
    }

    try {
      const response = await fetch('/api/admin-head/attendance/tardiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          employeeName: selectedEmployee.name,
          date: dateStr,
          actualIn: newEntryTime, // Save as 24h time in DB
          minutesLate: minutesLate,
          warningLevel: 0,
          cutoffPeriod: autoCutoff,
          month: entryMonth,
          year: entryYear
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Entry saved successfully')
        // Refresh entries with corrected mapping
        const entRes = await fetch(`/api/admin-head/attendance/tardiness?month=${selectedMonth}&year=${selectedYear}`)
        const entData = await entRes.json()
        if (entData.success) {
          const mapped = entData.data.map((e: any) => ({
            ...e,
            date: formatDate(e.date),
            employeeName: e.employee_name,
            cutoffPeriod: e.cutoff_period,
            actualIn: e.actual_in,
            minutesLate: e.minutes_late,
            warningLevel: e.warning_level
          }))
          // Sort entries by date ascending (oldest to newest), then by time
          const sorted = mapped.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            if (dateA !== dateB) return dateA - dateB
            return parseTimeToMinutes(a.actual_in || a.actualIn) - parseTimeToMinutes(b.actual_in || b.actualIn)
          })
          setAllEntries(sorted)
        }


        setAddEntryModalOpen(false)
        setNewEntryEmployee('')
        setNewEntryTime('')
      } else {
        toast.error(data.message || 'Failed to save entry')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('An error occurred while saving')
    }
  }

  // Summary button handler - opens summary sheet for specific cutoff
  const handleSummaryClick = (cutoffTitle: string, entries: LateEntry[]) => {
    setActiveCutoffSummary({ title: cutoffTitle, entries })
    setSummarySheetOpen(true)
  }

  // Close summary sheet
  const handleCloseSummary = () => {
    setSummarySheetOpen(false)
    setActiveCutoffSummary(null)
  }

  // ---------- RENDER ----------

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-2">
      <div className="relative w-full">

        {/* ----- MAROON GRADIENT HEADER ----- */}
        <div className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] text-white shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
            <div>
              <h1 className="text-4xl font-bold mb-3">Tardiness Monitoring System {selectedYear}</h1>
              <p className="text-white/80 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                ABIC REALTY & CONSULTANCY CORPORATION
              </p>
            </div>



            {/* Year selector */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="bg-white/95 backdrop-blur-sm border border-stone-200 text-red-900 hover:bg-white hover:border-red-200 transition-all duration-200 gap-2 text-sm h-10 px-4 shadow-sm hover:shadow-md font-bold inline-flex items-center justify-center whitespace-nowrap rounded-lg cursor-pointer group">
                    {selectedYear} <ChevronDown className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-32 bg-white border-stone-200 shadow-xl rounded-xl p-1.5" align="end">
                  {yearsList.map(year => (
                    <DropdownMenuItem
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                        selectedYear === year ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {year}
                      {selectedYear === year && <Check className="w-4 h-4 text-red-600" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={addNewYear} className="bg-white/95 backdrop-blur-sm border-stone-200 text-red-900 hover:bg-white hover:border-red-200 shadow-sm hover:shadow-md transition-all duration-200 text-sm h-10 px-4 font-bold rounded-lg border">
                <Plus className="w-4 h-4 mr-1" /> New Year
              </Button>

              <Button
                onClick={openAddEntryModal}
                disabled={selectedYear !== new Date().getFullYear()}
                className={cn(
                  "bg-white/95 backdrop-blur-sm border-stone-200 text-red-900 shadow-sm transition-all duration-200 text-sm h-10 px-4 font-bold rounded-lg border",
                  selectedYear !== new Date().getFullYear()
                    ? "opacity-50 cursor-not-allowed grayscale"
                    : "hover:bg-white hover:border-red-200 hover:shadow-md cursor-pointer"
                )}
                title={selectedYear !== new Date().getFullYear() ? "Add Entry is only available for the current year" : "Add new late entry"}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Entry
              </Button>
            </div>
          </div>
        </div>

        {/* ----- SECONDARY CONTROLS (TOOLBAR) - INSIDE HEADER ----- */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-6 lg:px-8 py-3">


            <div className="flex flex-wrap items-center gap-3 md:gap-4">

              {/* Month Selection */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-black/70 uppercase tracking-wider">Month</span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[140px] justify-between shadow-sm font-semibold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                      {selectedMonth} <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-48 bg-white border-stone-200 shadow-xl rounded-xl p-1.5 max-h-[350px] overflow-y-auto" align="start">
                    {months.map(month => (
                      <DropdownMenuItem
                        key={month}
                        onClick={() => setSelectedMonth(month)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          selectedMonth === month ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        {month}
                        {selectedMonth === month && <Check className="w-4 h-4 text-red-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Period Selection */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-black/70 uppercase tracking-wider">Period</span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[180px] justify-between shadow-sm font-semibold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                      {showCutoff === 'first' ? '1st - 15th' : showCutoff === 'second' ? (selectedMonth === 'February' ? '16th - 28/29th' : '16th - 30/31st') : 'Show Both'}
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-56 bg-white border-stone-200 shadow-xl rounded-xl p-1.5" align="start">
                    <DropdownMenuItem
                      onClick={() => setShowCutoff('first')}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                        showCutoff === 'first' ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      1st - 15th
                      {showCutoff === 'first' && <Check className="w-4 h-4 text-red-600" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowCutoff('second')}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                        showCutoff === 'second' ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {selectedMonth === 'February' ? '16th - 28/29th' : '16th - 30/31st'}
                      {showCutoff === 'second' && <Check className="w-4 h-4 text-red-600" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowCutoff('both')}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                        showCutoff === 'both' ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      Show Both
                      {showCutoff === 'both' && <Check className="w-4 h-4 text-red-600" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Global Search Input */}
              <div className="relative flex-1 min-w-[300px] md:ml-auto">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                <Input
                  placeholder="Search employee by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                />
              </div>


            </div>
          </div>
        </div>
      </div>


      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-[#FFE5EC] space-y-6">
        {/* ----- CUTOFF TABLES - WITH SUMMARY BUTTONS ----- */}
        <div className={`grid ${showCutoff === 'both' ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1'} w-full`}>
          {isLoading ? (
            <div className="flex items-center justify-center p-12 col-span-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#A0153E]" />
              <span className="ml-3 text-slate-500 font-medium">Loading attendance records...</span>
            </div>
          ) : (
            <>
              {(showCutoff === 'first' || showCutoff === 'both') && (
                <CutoffTable
                  title={`${selectedMonth} ${selectedYear} – 1-15`}
                  entries={firstPagination.paginatedItems}
                  onUpdateTime={updateFirstCutoffTime}
                  onSummaryClick={() => handleSummaryClick(
                    `${selectedMonth} ${selectedYear} – 1-15`,
                    firstCutoffEntries
                  )}
                  pagination={{
                    currentPage: firstPagination.currentPage,
                    totalPages: firstPagination.totalPages,
                    setPage: firstPagination.setCurrentPage,
                    hasNext: firstPagination.hasNext,
                    hasPrev: firstPagination.hasPrev
                  }}
                />
              )}

              {(showCutoff === 'second' || showCutoff === 'both') && (
                <CutoffTable
                  title={`${selectedMonth} ${selectedYear} – ${selectedMonth === 'February' ? '16-28/29' : '16-30/31'}`}
                  entries={secondPagination.paginatedItems}
                  onUpdateTime={updateSecondCutoffTime}
                  onSummaryClick={() => handleSummaryClick(
                    `${selectedMonth} ${selectedYear} – ${selectedMonth === 'February' ? '16-28/29' : '16-30/31'}`,
                    secondCutoffEntries
                  )}
                  pagination={{
                    currentPage: secondPagination.currentPage,
                    totalPages: secondPagination.totalPages,
                    setPage: secondPagination.setCurrentPage,
                    hasNext: secondPagination.hasNext,
                    hasPrev: secondPagination.hasPrev
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* ----- BOTTOM CARDS ----- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <Card className="bg-white border-2 border-[#FFE5EC] shadow-md">
            <CardHeader className="pb-2 p-4">
              <CardTitle className="text-lg text-[#800020] flex items-center gap-2 font-bold">
                <Users className="w-5 h-5 text-[#A0153E]" /> Frequently Late
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {Array.from(new Set([...firstCutoffEntries, ...secondCutoffEntries]
                    .filter(e => e.minutesLate > 30)
                    .map(e => e.employeeName)))
                    .slice(0, 4)
                    .map((name, i) => (
                      <Avatar key={i} className="border-2 border-white bg-rose-50 w-12 h-12 shadow-sm">
                        <AvatarFallback className="text-[#800020] font-bold bg-[#FFE5EC]">
                          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                </div>
                <span className="text-slate-500 text-sm ml-2 font-medium">...and others with high tardiness</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-[#FFE5EC] shadow-md">
            <CardHeader className="pb-2 p-4">
              <CardTitle className="text-lg text-[#800020] flex items-center gap-2 font-bold">
                <Clock className="w-5 h-5 text-[#A0153E]" /> Grace Period Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#800020]">5 min</span>
                <span className="text-slate-500 font-medium">allowance</span>
              </div>
              <p className="text-sm text-slate-500 mt-2 italic">
                Arrivals up to 8:05 AM are not counted as late occurrences.
                <br />
                <span className="text-xs text-[#C9184A] font-semibold">Occurrences strictly counted after 8:05 AM</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-[#A0153E] text-right mt-2 font-medium">
          * Table shows minutes from 8:00 AM • Summary occurrences counted after 8:05 AM grace period
        </div>
      </div>

      {/* Summary Sheet - only appears when Summary button is clicked */}
      {activeCutoffSummary && (
        <SummarySheet
          isOpen={summarySheetOpen}
          onClose={handleCloseSummary}
          cutoffTitle={activeCutoffSummary.title}
          entries={activeCutoffSummary.entries}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          employees={employees}
        />
      )}

      {/* Add Entry Modal */}
      <Dialog open={addEntryModalOpen} onOpenChange={setAddEntryModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-2 border-[#4A081A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] p-6 text-white">
            <DialogTitle className="text-2xl font-bold">Add Late Entry</DialogTitle>
            <DialogDescription className="text-white/80">
              Record a new tardiness entry for today ({new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}).
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Employee Selection */}
            <div className="grid gap-2">
              <Label htmlFor="employee" className="text-sm font-bold text-[#4A081A] uppercase tracking-wider">
                Employee Name
              </Label>
              <EmployeeSelector
                value={newEntryEmployee}
                onChange={setNewEntryEmployee}
                employees={employees}
              />
            </div>

            {/* Actual In Time */}
            <div className="grid gap-2">
              <Label htmlFor="time" className="text-sm font-bold text-[#4A081A] uppercase tracking-wider">
                Actual In Time
              </Label>
              <Input
                id="time"
                type="time"
                value={newEntryTime}
                onChange={(e) => setNewEntryTime(e.target.value)}
                className="bg-white border-2 border-[#FFE5EC] text-slate-700 focus:ring-2 focus:ring-[#630C22] h-11"
              />
            </div>
          </div>

          <DialogFooter className="bg-[#FFE5EC]/30 p-6 border-t-2 border-[#FFE5EC]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddEntryModalOpen(false)}
              className="border-2 border-[#FFE5EC] text-[#4A081A] hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSaveNewEntry}
              className="bg-gradient-to-r from-[#4A081A] to-[#630C22] hover:from-[#630C22] hover:to-[#7B0F2B] text-white shadow-md font-bold px-6"
            >
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}



// ---------- CUTOFF TABLE COMPONENT - WITH SUMMARY BUTTON ----------
function CutoffTable({
  title,
  entries,
  onUpdateTime,
  onSummaryClick,
  pagination,
}: {
  title: string
  entries: LateEntry[]
  onUpdateTime: (id: string | number, newTime: string) => void
  onSummaryClick: () => void
  pagination: {
    currentPage: number
    totalPages: number
    setPage: (page: number) => void
    hasNext: boolean
    hasPrev: boolean
  }
}) {
  return (
    <Card className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5">
          <CardTitle className="text-xl text-[#4A081A] font-bold">{title}</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              size="sm"
              onClick={onSummaryClick}
              className="bg-gradient-to-r from-[#4A081A] to-[#630C22] hover:from-[#630C22] hover:to-[#7B0F2B] text-white text-xs md:text-sm h-9 px-4 flex items-center gap-1 shrink-0 shadow-md transition-all duration-300"
            >

              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              Summary
            </Button>
          </div>
        </div>
        <CardDescription className="text-[#A0153E]/70 flex items-center gap-2 text-xs font-medium mt-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C9184A]" />
          <span>Minutes from 8:00 AM</span>
          <span className="text-[#FFE5EC]">|</span>
          <span>{entries.length} records</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
              <tr>
                <th className="px-3 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider w-[30%]">Employee Name</th>
                <th className="px-3 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider w-[20%]">Date</th>
                <th className="px-3 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider w-[20%]">Actual In</th>
                <th className="px-3 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider w-[20%]">Minutes Late</th>
                <th className="px-3 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider w-[10%]">Warning</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200">
                  <td className="px-3 py-3">
                    <span className="font-semibold text-slate-700 text-sm">
                      {entry.employeeName}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-slate-600 text-xs font-medium">
                    {entry.date || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={entry.actual_in || entry.actualIn || ''}
                      onChange={(e) => onUpdateTime(entry.id, e.target.value.toUpperCase())}
                      placeholder="8:00 AM"
                      className="bg-white border-[#FFE5EC] text-slate-700 placeholder:text-slate-300 h-8 text-xs w-24 font-mono focus:ring-2 focus:ring-[#A0153E] uppercase shadow-sm"
                    />
                  </td>

                  <td className="px-2.5 py-1">
                    {entry.minutesLate > 0 ? (
                      <span className={`
                      inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border
                      ${entry.minutesLate > 30 ? 'bg-red-50 text-red-700 border-red-200' :
                          entry.minutesLate > 15 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            entry.minutesLate > 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'}
                    `}>
                        {entry.minutesLate} min
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-2.5 py-1">
                    {entry.warningLevel && entry.warningLevel > 0 ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold">{entry.warningLevel}{entry.warningLevel === 1 ? 'st' : 'nd'}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Fill empty rows to maintain 15 rows */}
              {entries.length < 15 && Array.from({ length: 15 - entries.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="bg-stone-50/30">
                  <td className="px-2.5 py-1">&nbsp;</td>
                  <td className="px-2.5 py-1">&nbsp;</td>
                  <td className="px-2.5 py-1">&nbsp;</td>
                  <td className="px-2.5 py-1">&nbsp;</td>
                  <td className="px-2.5 py-1">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50">
            <div className="text-xs text-stone-500 font-medium">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => pagination.setPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="bg-white border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-50 text-xs h-8 px-3 shadow-sm"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => pagination.setPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="bg-white border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-50 text-xs h-8 px-3 shadow-sm"
              >
                Next <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>


  )
}