//tardiness


//latest tardiness






'use client'


import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Clock, Plus, Search, Users, ChevronLeft, ChevronRight, FileDown, FileText, Check, AlertTriangle, Loader2, RotateCcw, X, Calendar } from 'lucide-react'
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
  late_occurrence?: number // 1st late, 2nd late, etc.
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


// Recalculate warnings for all entries
function recalculateWarnings(entries: LateEntry[]): LateEntry[] {
  // First, group by employee ONLY (to allow monthly cumulative counts)
  const entriesByEmployee = new Map<string | number, LateEntry[]>()


  entries.forEach(entry => {
    const key = entry.employee_id || entry.employee_name
    if (!entriesByEmployee.has(key)) {
      entriesByEmployee.set(key, [])
    }
    entriesByEmployee.get(key)?.push(entry)
  })


  // Now process each group
  const updatedEntries: LateEntry[] = []


  entriesByEmployee.forEach((groupEntries) => {
    // Sort by date/time to ensure order
    groupEntries.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateA - dateB
      const timeA = parseTimeToMinutes(a.actual_in || a.actualIn || '')
      const timeB = parseTimeToMinutes(b.actual_in || b.actualIn || '')
      return timeA - timeB
    })


    let lateCount = 0


    const processedGroup = groupEntries.map(entry => {
      let warningLevel = 0
      const actualIn = entry.actual_in || entry.actualIn || ''


      // Check if late (using the same logic as Summary: > 8:05 AM)
      if (actualIn && exceedsGracePeriod(actualIn)) {
        lateCount++
        // New Rule: 3rd late = 1st warning, 4th = 2nd, 5th = 3rd
        if (lateCount >= 3) {
          warningLevel = lateCount - 2
        }
      }


      return {
        ...entry,
        warningLevel: warningLevel,
        warning_level: warningLevel, // Update both for consistency
        late_occurrence: actualIn && exceedsGracePeriod(actualIn) ? lateCount : 0
      }
    })


    updatedEntries.push(...processedGroup)
  })


  // Return all entries (we might need to re-sort them overall if the global order matters,
  // but usually the specific table fitering will handle sorting)
  // Let's preserve the original global sort order by ID or Date if possible,
  // but for now re-sorting by date locally is fine as the tables re-filter them.
  return updatedEntries.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (dateA !== dateB) return dateA - dateB
    const timeA = parseTimeToMinutes(a.actual_in || a.actualIn || '')
    const timeB = parseTimeToMinutes(b.actual_in || b.actualIn || '')
    return timeA - timeB
  })
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
    ['* Warnings: 3rd late = 1st warning, 4th = 2nd, 5th = 3rd'],
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
          className="w-full justify-between h-7 md:h-8 text-xl md:text-xl border-stone-200 hover:bg-stone-50 font-medium"
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

    // Use the highest warning level reached by this employee in the specific entries for this cutoff
    const empEntriesInRange = entries.filter(e => e.employee_id === emp.id)
    const warnings = empEntriesInRange.length > 0
      ? Math.max(...empEntriesInRange.map(e => e.warningLevel || 0))
      : 0

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
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
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
            <p>* Warnings: 3rd late = 1st warning, 4th = 2nd, 5th = 3rd</p>
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
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()])
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


          // Apply dynamic warning calculation
          const entriesWithWarnings = recalculateWarnings(sortedEntries)
          setAllEntries(entriesWithWarnings)
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
  const [showCutoff, setShowCutoff] = useState<'first' | 'second' | 'both'>(
    new Date().getDate() <= 15 ? 'first' : 'second'
  )


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


  // New Year confirmation state
  const [showNewYearConfirm, setShowNewYearConfirm] = useState(false)
  const [isAddingYear, setIsAddingYear] = useState(false)


  // Handler to add a new year after confirmation
  const handleAddNewYearConfirm = () => {
    setShowNewYearConfirm(true)
  }


  // Handler to undo year addition
  const handleUndoYear = async (year: number) => {
    try {
      const res = await fetch(`/api/admin-head/attendance/tardiness/years?year=${year}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        setYearsList(prev => prev.filter(y => y !== year).sort())
        setSelectedYear(new Date().getFullYear()) // Fallback to current year
        toast.success(`Year ${year} has been removed.`)
      }
    } catch (error) {
      console.error('Undo error:', error)
      toast.error('Failed to undo year addition')
    }
  }


  // Actual logic to add year
  const addNewYear = async () => {
    const nextYear = Math.max(...yearsList) + 1
    setIsAddingYear(true)
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
        setShowNewYearConfirm(false)


        // Show success with Undo action
        toast.success(`Year ${nextYear} added`, {
          description: "Click undo if this was a mistake",
          action: {
            label: "Undo",
            onClick: () => handleUndoYear(nextYear)
          },
          duration: 10000, // 10 seconds for undo
        })
      } else {
        // Parse validation errors if present
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(' ')
          toast.error(errorMessages || data.message)
        } else {
          toast.error(data.message || 'Failed to add year')
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Connection Error: Could not reach the server.')
      } else {
        toast.error('Could not add year. Please try again later.')
      }
    } finally {
      setIsAddingYear(false)
    }
  }




  // Debounce refs to avoid firing API on every keystroke
  const debounceTimers = useRef<Record<string | number, ReturnType<typeof setTimeout>>>({})


  // Shared handler to update actual_in time — updates local state immediately
  // and persists to the database after a short debounce
  const updateEntryTime = (id: string | number, newTime: string) => {
    const minutesLate = calculateMinutesFrom8AM(newTime)


    // Optimistic local update with recalculation
    setAllEntries(prev => {
      const updatedList = prev.map(entry => {
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
      // Must recalculate warnings because changing one time might change the count/order of warnings
      return recalculateWarnings(updatedList)
    })


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


  const [newEntryEmployee, setNewEntryEmployee] = useState('')
  const [newEntryTime, setNewEntryTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false)


  // Reset new entry fields
  const resetAddEntryFields = () => {
    setNewEntryEmployee('')
    setNewEntryTime('')
  }




  const [showSaveConfirm, setShowSaveConfirm] = useState(false)


  // Validation before opening confirmation
  const handleSaveClick = () => {
    if (!newEntryEmployee || !newEntryTime) {
      toast.error('Please select an employee and enter the actual in time.')
      return
    }


    const selectedEmployee = employees.find(e => e.name === newEntryEmployee)
    if (!selectedEmployee) return


    // ALWAYS use today's date for new entries as requested
    const dateObj = new Date()
    const entryYear = dateObj.getFullYear()
    const dayOfMonth = dateObj.getDate()
    const dateStr = `${entryYear}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`


    // Validation 2: Check if employee already has an entry for this date (Strict Prevention)
    const duplicateEntry = allEntries.find(
      entry => entry.employee_id === selectedEmployee.id && formatDate(entry.date) === dateStr
    )


    if (duplicateEntry) {
      toast.error(`${newEntryEmployee} already has a late entry recorded for today (${dateStr}).`)
      return
    }


    // If validation passes, open confirmation modal
    setShowSaveConfirm(true)
  }


  // Actual Save Logic (triggered by confirmation modal)
  const executeSaveEntry = async () => {
    const selectedEmployee = employees.find(e => e.name === newEntryEmployee)
    if (!selectedEmployee) return


    const dateObj = new Date()
    const entryYear = dateObj.getFullYear()
    const entryMonth = months[dateObj.getMonth()]
    const dayOfMonth = dateObj.getDate()
    const dateStr = `${entryYear}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`


    const autoCutoff: 'cutoff1' | 'cutoff2' = dayOfMonth <= 15 ? 'cutoff1' : 'cutoff2'
    const minutesLate = calculateMinutesFrom8AM(newEntryTime)


    setIsSaving(true)
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
          // Apply dynamic warning calculation
          const entriesWithWarnings = recalculateWarnings(sorted)
          setAllEntries(entriesWithWarnings)
        }


        resetAddEntryFields()
        setShowSaveConfirm(false) // Close modal on success
      } else {
        toast.error(data.message || 'Failed to save entry')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('An error occurred while saving')
    } finally {
      setIsSaving(false)
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
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-12">
      <div className="relative w-full">


        {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
        <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
          {/* Main Header Row */}
          <div className="w-full px-4 md:px-8 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Tardiness Monitoring</h1>
                <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  ABIC REALTY & CONSULTANCY
                </p>
              </div>


              {/* Year selector & Actions */}
              <div className="flex items-center gap-3">
                <Button onClick={handleAddNewYearConfirm} variant="outline" className="border-white/30 text-white hover:bg-white/20 hover:text-white bg-transparent backdrop-blur-sm shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg">
                  <Plus className="w-4 h-4 mr-2" /> New Year
                </Button>
                <Button
                  onClick={() => setIsEntryFormOpen(!isEntryFormOpen)}
                  variant="outline"
                  className={cn(
                    "border-white/30 text-white hover:bg-white/20 hover:text-white bg-transparent backdrop-blur-sm shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2",
                    isEntryFormOpen && "bg-white/20 border-white/50"
                  )}
                >
                  {isEntryFormOpen ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>CLOSE</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>NEW RECORD</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>


          {/* Secondary Toolbar */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-full px-4 md:px-8 py-3">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">


                {/* Year Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Year</span>


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[120px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                        {selectedYear} <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-32 bg-white border-stone-200 shadow-xl rounded-xl p-1.5" align="start">
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
                </div>


                {/* Month Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Month</span>


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[140px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
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
                  <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Period</span>


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[180px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
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
                <div className="relative w-full md:w-[350px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                  <Input
                    placeholder="Search employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                  />
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>




      <div className="bg-white p-3 md:p-6 rounded-lg shadow-lg border-b-2 md:border-2 border-[#FFE5EC] space-y-6">


        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isEntryFormOpen ? "max-h-[500px] opacity-100 mb-2" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <div className="flex justify-center pt-2">
            <Card className="w-full max-w-5xl bg-white border border-[#FFE5EC] shadow-lg rounded-xl overflow-hidden ring-4 ring-rose-50/50">
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
                  {/* Minimal Header Part */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="p-1.5 bg-rose-50 rounded-lg">
                      <Plus className="w-4 h-4 text-[#4A081A]" />
                    </div>
                    <h2 className="text-lg font-black text-[#4A081A] uppercase tracking-wider whitespace-nowrap">
                      New Late Entry
                    </h2>
                  </div>


                  {/* Form Fields - Horizontal Inline */}
                  <div className="flex flex-1 flex-col sm:flex-row items-center gap-4 w-full">
                    <div className="flex-1 w-full min-w-[200px]">
                      <EmployeeSelector
                        value={newEntryEmployee}
                        onChange={setNewEntryEmployee}
                        employees={employees}
                      />
                    </div>


                    <div className="relative group w-full sm:w-40 shrink-0">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#4A081A] transition-colors" />
                      <Input
                        id="time"
                        type="time"
                        value={newEntryTime}
                        onChange={(e) => setNewEntryTime(e.target.value)}
                        className="bg-white border border-[#FFE5EC] text-slate-800 pl-9 h-10 w-full rounded-lg text-lg font-bold focus:ring-[#800020]/10 focus:border-[#630C22] transition-all"
                      />
                    </div>
                  </div>


                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="submit"
                      onClick={handleSaveClick}
                      disabled={isSaving || selectedYear !== new Date().getFullYear()}
                      className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#800020] hover:shadow-lg active:scale-95 text-white font-bold text-xl px-6 h-10 rounded-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        "Save Record"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


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
          <div className="col-span-full text-right mt-2 text-md text-[#A0153E] font-medium italic">
            * Table shows minutes from 8:00 AM • Summary counted after 8:05 AM
          </div>
        </div>
      </div>


      {/* Summary Sheet - only appears when Summary button is clicked */}
      {
        activeCutoffSummary && (
          <SummarySheet
            isOpen={summarySheetOpen}
            onClose={handleCloseSummary}
            cutoffTitle={activeCutoffSummary.title}
            entries={activeCutoffSummary.entries}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            employees={employees}
          />
        )
      }






      <Dialog open={showNewYearConfirm} onOpenChange={setShowNewYearConfirm}>
        <DialogContent className="bg-white border-2 border-[#FFE5EC] rounded-2xl max-w-sm">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <Calendar className="w-8 h-8 text-[#4A081A]" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-[#4A081A]">Confirm New Year</DialogTitle>
              <DialogDescription className="text-stone-500 font-medium">
                Are you sure you want to initialize year {Math.max(...yearsList) + 1}? This will add it to the selection menu.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowNewYearConfirm(false)}
              disabled={isAddingYear}
              className="flex-1 border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={addNewYear}
              disabled={isAddingYear}
              className="flex-1 bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-95"
            >
              {isAddingYear ? "Initializing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent className="bg-white border-2 border-[#FFE5EC] rounded-2xl max-w-sm">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <Clock className="w-8 h-8 text-[#4A081A]" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-[#4A081A]">Confirm New Entry</DialogTitle>
              <DialogDescription className="text-stone-500 font-medium">
                Are you sure you want to add a late entry for <span className="text-[#4A081A] font-bold">{newEntryEmployee}</span> at <span className="text-[#4A081A] font-bold">{newEntryTime}</span>?
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowSaveConfirm(false)}
              disabled={isSaving}
              className="flex-1 border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={executeSaveEntry}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-95"
            >
              {isSaving ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
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
              className="bg-gradient-to-r from-[#4A081A] to-[#630C22] hover:from-[#630C22] hover:to-[#7B0F2B] text-white text-xl md:text-xl h-9 px-4 flex items-center gap-1 shrink-0 shadow-md transition-all duration-300"
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
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[30%]">Employee Name</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[20%]">Date</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[20%]">Actual In</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[20%]">Minutes Late</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[10%]">Warning</th>
              </tr>
            </thead>


            <tbody className="divide-y divide-stone-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200">
                  <td className="px-3 py-5">
                    <span className="font-bold text-slate-800 text-base md:text-lg">
                      {entry.employeeName}
                    </span>
                  </td>


                  <td className="px-3 py-5 text-slate-600 text-sm md:text-base font-semibold">
                    {entry.date || '—'}
                  </td>
                  <td className="px-3 py-5">
                    <Input
                      value={entry.actual_in || entry.actualIn || ''}
                      onChange={(e) => onUpdateTime(entry.id, e.target.value.toUpperCase())}
                      placeholder="8:00 AM"
                      className="bg-white border-[#FFE5EC] text-slate-800 placeholder:text-slate-300 h-10 text-base md:text-lg w-28 font-bold focus:ring-2 focus:ring-[#A0153E] uppercase shadow-sm"
                    />
                  </td>


                  <td className="px-2.5 py-5">
                    {entry.minutesLate > 0 ? (
                      <span className={`
                      inline-block px-4 py-1.5 rounded-full text-base md:text-lg font-bold border
                      ${entry.late_occurrence === 2 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          entry.late_occurrence && entry.late_occurrence >= 3 ? 'bg-red-100 text-red-700 border-red-200 shadow-sm' :
                            'bg-transparent text-slate-700 border-transparent'}
                    `}>
                        {entry.minutesLate} min
                      </span>
                    ) : (
                      <span className="text-stone-400 font-bold">—</span>
                    )}
                  </td>
                  <td className="px-2.5 py-5">
                    {entry.warningLevel && entry.warningLevel > 0 ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-base md:text-lg font-bold">
                          {entry.warningLevel}
                          {entry.warningLevel === 1 ? 'st' : entry.warningLevel === 2 ? 'nd' : entry.warningLevel === 3 ? 'rd' : 'th'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400 font-bold">—</span>
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

