"use client"
//TARDINESS MONITORING UI - LATEST


'use client'

import { useState } from 'react'
import { ChevronDown, Clock, Plus, Search, Users, ChevronLeft, ChevronRight, FileDown, FileText, X } from 'lucide-react'

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// Optional: For Excel export functionality, install xlsx: npm install xlsx
// import * as XLSX from 'xlsx'

// ---------- TYPES & MOCK INITIAL DATA ----------
interface LateEntry {
  id: string
  employeeName: string
  date: string
  actualIn: string
  minutesLate: number // minutes from 8:00 AM (no grace period)
}

interface EmployeeSummary {
  name: string
  totalMinutes: number
  occurrences: number
}

// Generate entries - minutesLate is from 8:00 AM (no grace period)
// Employees master list
const ALL_EMPLOYEES = [
  { nickname: 'Joe', fullName: 'Joelyn Rendon' },
  { nickname: 'Kaila', fullName: 'Kaila Rose Dapiaoen' },
  { nickname: 'Janina', fullName: 'Elma Janina Caliboso' },
  { nickname: 'Darlene', fullName: 'Darlene Angel G. Fajarito' },
  { nickname: 'Justin', fullName: 'Justin M. De Castro' },
  { nickname: 'Mike', fullName: 'Michael M. Tapec' },
  { nickname: 'Aizle', fullName: 'Aizle Marie Atienza' },
  { nickname: 'Armand', fullName: 'Armand Cajucom' },
  { nickname: 'Jaypee', fullName: 'Jaypee Panes' },
  { nickname: 'Eirene', fullName: 'Eirene Grace Armilla' },
  { nickname: 'Hazel', fullName: 'Hazel Anne Mendoza' },
  { nickname: 'Raiza', fullName: 'Raiza Mae Boy Habaña' },
  { nickname: 'Jhoanna', fullName: 'Jhoanna Mae M. Papio' },
  { nickname: 'Margel', fullName: 'Margelle R. Lodovice' },
  { nickname: 'Wil', fullName: 'Wilfredo T. Aliado Jr.' },
  { nickname: 'Meah', fullName: 'Meah Mae M. Rivera' },
  { nickname: 'Gab', fullName: 'Gabriela V. Mariano' },
  { nickname: 'Kate', fullName: 'Kate Owen L. Perez' },
  { nickname: 'Gie', fullName: 'Giesel Mae B. Villasan' },
]

// Generate entries - minutesLate is from 8:00 AM (no grace period)
const generateManyEntries = (prefix: string, startId: number): LateEntry[] => {
  const entries: LateEntry[] = []
  const names = ALL_EMPLOYEES.map(e => e.nickname)

  for (let i = 0; i < 35; i++) {
    const nameIndex = i % names.length
    // Generate random time between 8:00 AM and 9:00 AM
    const minutes = Math.floor(Math.random() * 60)
    const hour = 8
    const timeString = `${hour}:${String(minutes).padStart(2, '0')} AM`
    // Minutes late from 8:00 AM (no grace period)
    const minutesLate = minutes

    entries.push({
      id: `${prefix}-${startId + i}`,
      employeeName: names[nameIndex],
      date: `02/${String((i % 28) + 1).padStart(2, '0')}/2026`,
      actualIn: timeString,
      minutesLate: minutesLate
    })
  }
  return entries
}

const initialFirstCutoff: LateEntry[] = generateManyEntries('first', 1)
const initialSecondCutoff: LateEntry[] = generateManyEntries('second', 100)

// Available years & months
const availableYears = [2025, 2026, 2027]
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ---------- TIME PARSING UTILITY ----------
function parseTimeToMinutes(timeStr: string): number {
  const regex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i
  const match = timeStr.match(regex)

  if (!match) return 0

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()

  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  return hours * 60 + minutes
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
function exportToExcel(summaryArray: { name: string; totalMinutes: number; occurrences: number }[], cutoffTitle: string, month: string, year: number) {
  // Prepare data for Excel
  const worksheetData = [
    [`Tardiness Summary Report - ${cutoffTitle}`],
    [`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [],
    ['Employee Name', 'Total Lates (minutes)', 'Total Lates (count > 8:05AM)'],
    ...summaryArray.map(emp => [emp.name, emp.totalMinutes, emp.occurrences]),
    [],
    ['Summary Statistics'],
    ['Total Employees with Lates', summaryArray.length],
    ['Total Late Minutes', summaryArray.reduce((sum, emp) => sum + emp.totalMinutes, 0)],
    ['Total Lates', summaryArray.reduce((sum, emp) => sum + emp.occurrences, 0)],
    ['Average Minutes per Late',
      summaryArray.length ?
        (summaryArray.reduce((sum, emp) => sum + emp.totalMinutes, 0) /
          summaryArray.reduce((sum, emp) => sum + emp.occurrences, 0) || 0).toFixed(1)
        : 0
    ],
    [],
    ['* Minutes are counted from 8:00 AM'],
    ['* Total Lates count is based on arrivals after 8:05 AM grace period'],
    [`* Report for ${month} ${year} - ${cutoffTitle}`]
  ]

  // Note: XLSX export requires 'npm install xlsx'
  // Uncomment below and import XLSX to enable Excel export
  /*
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // Style the worksheet
  ws['!cols'] = [
    { wch: 30 }, // Employee Name
    { wch: 25 }, // Total Minutes
    { wch: 25 }, // Occurrences
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
  */

  // For now, just log to console or show an alert
  console.log('Export data:', worksheetData)
  alert('Excel export requires XLSX library. Install with: npm install xlsx')
}

// ---------- SUMMARY SHEET COMPONENT ----------
interface SummarySheetProps {
  isOpen: boolean
  onClose: () => void
  cutoffTitle: string
  entries: LateEntry[]
  selectedYear: number
  selectedMonth: string
}

function SummarySheet({ isOpen, onClose, cutoffTitle, entries, selectedYear, selectedMonth }: SummarySheetProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate summary from entries - ONLY from this specific cutoff range
  const summaryMap = new Map<string, { totalMinutes: number; occurrences: number }>()

  // Initialize all employees with 0 values
  ALL_EMPLOYEES.forEach(emp => {
    summaryMap.set(emp.nickname, { totalMinutes: 0, occurrences: 0 })
  })

  // Add actual data
  entries.forEach(entry => {
    if (!entry.employeeName) return

    const current = summaryMap.get(entry.employeeName)
    // Only process if employee is in our master list (or should we include others? The requirement implies exact list)
    // If we have random names not in ALL_EMPLOYEES, they might be skipped. given we updated generateManyEntries, this is safe.
    if (current) {
      current.totalMinutes += entry.minutesLate
      if (exceedsGracePeriod(entry.actualIn)) {
        current.occurrences += 1
      }
      summaryMap.set(entry.employeeName, current)
    }
  })

  // Convert to array preserving the order of ALL_EMPLOYEES
  const summaryArray = ALL_EMPLOYEES.map(emp => {
    const data = summaryMap.get(emp.nickname) || { totalMinutes: 0, occurrences: 0 }
    return {
      name: emp.fullName, // Using Full Name as requested by "include their name" + image context
      totalMinutes: data.totalMinutes,
      occurrences: data.occurrences
    }
  })
  // No sorting applied to maintain ALL_EMPLOYEES order

  // Filter based on search query
  const filteredSummaryArray = summaryArray.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalLateMinutes = summaryArray.reduce((sum, emp) => sum + emp.totalMinutes, 0)
  const totalOccurrences = summaryArray.reduce((sum, emp) => sum + emp.occurrences, 0)
  // const employeesWithLates = summaryArray.filter(emp => emp.occurrences > 0).length

  // Pagination for summary
  const summaryPagination = usePagination(filteredSummaryArray, 15)

  // Handle export
  const handleExport = () => {
    exportToExcel(summaryArray, cutoffTitle, selectedMonth, selectedYear)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-[#3c1a1a] border-l border-white/20 text-white overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-2xl text-amber-100 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Summary Report
              </SheetTitle>
              <SheetDescription className="text-amber-50/80 text-base">
                {cutoffTitle} • {selectedMonth} {selectedYear}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-3 mr-12">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-amber-200/50" />
                <Input
                  placeholder="Search employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/20 border-white/10 text-white placeholder:text-amber-200/30 pl-9 h-9 w-[180px] focus-visible:ring-amber-500/50"
                />
              </div>
              <Button
                size="sm"
                onClick={handleExport}
                className="bg-amber-700 hover:bg-amber-600 text-white border-0 text-sm h-9 px-4 flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-4 md:p-5">
          {/* Summary table - ONLY shows entries from this cutoff */}
          <Card className="bg-white/5 border-white/20">
            <CardHeader className="pb-2 p-4 border-b border-white/10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-amber-100">Employee Lates Summary</CardTitle>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-100">{totalLateMinutes} mins / {totalOccurrences} occ</p>
                </div>
              </div>
              <CardDescription className="text-amber-50/70 text-xs">
                Minutes from 8:00 AM • Occurrences after 8:05 AM • {cutoffTitle} only
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="bg-[#5e2e2e]/90 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-amber-100">EMPLOYEE NAME</th>
                      <th className="px-4 py-3 text-left font-medium text-amber-100">TOTAL LATES (MINS)</th>
                      <th className="px-4 py-3 text-left font-medium text-amber-100">NO. OF LATES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {summaryPagination.paginatedItems.length > 0 ? (
                      summaryPagination.paginatedItems.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-4 py-2.5 text-white/90">{emp.name}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-900/30 text-amber-50">
                              {emp.totalMinutes}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {emp.occurrences > 0 ? (
                              <span className="px-2 py-1 bg-amber-800/50 rounded text-xs">
                                {emp.occurrences}
                              </span>
                            ) : (
                              <span className="text-white/40">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-white/50 italic">
                          No late entries found for this cutoff period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-amber-200/50 space-y-1">
            <p>* Minutes are counted from 8:00 AM (no grace period in minutes display)</p>
            <p>* Occurrences are only counted for arrivals after 8:05 AM grace period</p>
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
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState('February')
  const [yearsList, setYearsList] = useState<number[]>(availableYears)

  // State for cutoff data
  const [firstCutoffEntries, setFirstCutoffEntries] = useState<LateEntry[]>(initialFirstCutoff)
  const [secondCutoffEntries, setSecondCutoffEntries] = useState<LateEntry[]>(initialSecondCutoff)

  // Summary visibility state - controlled by Summary buttons
  const [summarySheetOpen, setSummarySheetOpen] = useState(false)
  const [activeCutoffSummary, setActiveCutoffSummary] = useState<{ title: string; entries: LateEntry[] } | null>(null)

  // UI state for which cutoff table to show
  const [showCutoff, setShowCutoff] = useState<'first' | 'second' | 'both'>('both')

  // Global Search state for both cutoff tables
  const [searchQuery, setSearchQuery] = useState('')

  // Filter entries based on search before pagination
  const filteredFirstEntries = firstCutoffEntries.filter(entry =>
    entry.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSecondEntries = secondCutoffEntries.filter(entry =>
    entry.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination states for each table (using filtered entries)
  const firstPagination = usePagination(filteredFirstEntries, 15)
  const secondPagination = usePagination(filteredSecondEntries, 15)

  // Handler to add a new year
  const addNewYear = () => {
    const nextYear = Math.max(...yearsList) + 1
    if (!yearsList.includes(nextYear)) {
      setYearsList([...yearsList, nextYear].sort())
      setSelectedYear(nextYear)
    }
  }

  // Manual input handler - ONLY for Actual In field
  // Minutes late calculated from 8:00 AM (no grace period)
  const updateFirstCutoffTime = (id: string, newTime: string) => {
    setFirstCutoffEntries(prev =>
      prev.map(entry => {
        if (entry.id === id) {
          const minutesLate = calculateMinutesFrom8AM(newTime)
          return { ...entry, actualIn: newTime, minutesLate }
        }
        return entry
      })
    )
  }

  const updateSecondCutoffTime = (id: string, newTime: string) => {
    setSecondCutoffEntries(prev =>
      prev.map(entry => {
        if (entry.id === id) {
          const minutesLate = calculateMinutesFrom8AM(newTime)
          return { ...entry, actualIn: newTime, minutesLate }
        }
        return entry
      })
    )
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#3c1a1a] via-[#5e2828] to-[#7e3838] text-white p-4 md:p-6 lg:p-8">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

      <div className="relative w-full max-w-[1600px] mx-auto space-y-6">

        {/* ----- HEADER ----- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent">
              ABIC REALTY & CONSULTANCY CORPORATION
            </h1>
            <p className="text-amber-100/80 text-base md:text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              TARDINESS MONITORING {selectedYear}
            </p>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2 text-sm md:text-base h-10 px-4">
                  {selectedYear} <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#4a2525] border-white/30 text-white">
                {yearsList.map(year => (
                  <DropdownMenuItem key={year} onClick={() => setSelectedYear(year)} className="hover:bg-white/20">
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={addNewYear} className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-lg text-sm md:text-base h-10 px-4">
              <Plus className="w-4 h-4 mr-1" /> new year
            </Button>
          </div>
        </div>

        {/* ----- CUT-OFF PERIOD CONTROLS ----- */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/20 shadow-lg">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <span className="text-amber-100/90 font-medium text-sm md:text-base tracking-wide uppercase text-nowrap">Month</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm md:text-base h-10 px-4 min-w-[150px] justify-between">
                      {selectedMonth} <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#4a2525] border-white/30 text-white max-h-60 min-w-[150px]">
                    {months.map(month => (
                      <DropdownMenuItem key={month} onClick={() => setSelectedMonth(month)} className="hover:bg-white/20 cursor-pointer">
                        {month}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-amber-100/90 font-medium text-sm md:text-base tracking-wide uppercase text-nowrap">Cut-off Period</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm md:text-base h-10 px-4 min-w-[180px] justify-between">
                      {showCutoff === 'first' ? '1st - 15th' : showCutoff === 'second' ? '16th - 30/31st' : 'Show Both'}
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#4a2525] border-white/30 text-white min-w-[180px]">
                    <DropdownMenuItem onClick={() => setShowCutoff('first')} className="hover:bg-white/20 cursor-pointer">
                      1st - 15th
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCutoff('second')} className="hover:bg-white/20 cursor-pointer">
                      16th - 30/31st
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCutoff('both')} className="hover:bg-white/20 cursor-pointer">
                      Show Both
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Global Search Input */}
              <div className="relative flex-1 min-w-[200px] md:max-w-md ml-auto">
                <Search className="absolute left-3 top-3 h-4 w-4 text-amber-200/50" />
                <Input
                  placeholder="Search employee by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/20 border-white/10 text-white placeholder:text-amber-200/30 pl-10 h-10 w-full focus-visible:ring-amber-500/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ----- CUTOFF TABLES - WITH SUMMARY BUTTONS ----- */}
        <div className={`grid ${showCutoff === 'both' ? 'grid-cols-1 lg:grid-cols-2 gap-5' : 'grid-cols-1'} w-full`}>
          {(showCutoff === 'first' || showCutoff === 'both') && (
            <CutoffTable
              title={`${selectedMonth} ${selectedYear} – 1-15`}
              entries={firstPagination.paginatedItems}
              allEntries={firstCutoffEntries}
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
              title={`${selectedMonth} ${selectedYear} – 16-30/31`}
              entries={secondPagination.paginatedItems}
              allEntries={secondCutoffEntries}
              onUpdateTime={updateSecondCutoffTime}
              onSummaryClick={() => handleSummaryClick(
                `${selectedMonth} ${selectedYear} – 16-30/31`,
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
        </div>

        {/* ----- BOTTOM CARDS ----- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <Card className="bg-white/5 backdrop-blur border-white/20">
            <CardHeader className="pb-2 p-4 md:p-5">
              <CardTitle className="text-base md:text-lg text-amber-100 flex items-center gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5" /> Frequently Late
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 pt-0">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {Array.from(new Set([...firstCutoffEntries, ...secondCutoffEntries]
                    .filter(e => e.minutesLate > 30)
                    .map(e => e.employeeName)))
                    .slice(0, 4)
                    .map((name, i) => (
                      <Avatar key={i} className="border-2 border-[#4a2525] bg-gradient-to-br from-amber-800 to-amber-900 w-8 h-8 md:w-9 md:h-9">
                        <AvatarFallback className="text-white text-xs bg-transparent">
                          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                </div>
                <span className="text-amber-200/80 text-xs md:text-sm">and others</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#5e2e2e] to-[#3e1e1e] border-white/20">
            <CardHeader className="pb-2 p-4 md:p-5">
              <CardTitle className="text-base md:text-lg text-amber-100 flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5" /> Grace period
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 pt-0">
              <div className="text-3xl md:text-4xl font-bold text-white">5 min</div>
              <p className="text-xs md:text-sm text-amber-200/70 mt-1">not counted in occurrences</p>
              <p className="text-xs text-amber-200/50 mt-1">Occurrences counted after 8:05 AM</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-amber-200/50 text-right mt-2">
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
        />
      )}
    </div>
  )
}

// ---------- CUTOFF TABLE COMPONENT - WITH SUMMARY BUTTON ----------
function CutoffTable({
  title,
  entries,
  allEntries,
  onUpdateTime,
  onSummaryClick,
  pagination,
}: {
  title: string
  entries: LateEntry[]
  allEntries: LateEntry[]
  onUpdateTime: (id: string, newTime: string) => void
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
    <Card className="bg-white/5 backdrop-blur-xl border-white/20 shadow-lg overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-[#5e2e2e]/40 pb-3 border-b border-white/10 p-4 md:p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <CardTitle className="text-base md:text-lg text-amber-100">{title}</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              size="sm"
              onClick={onSummaryClick}
              className="bg-amber-700/80 hover:bg-amber-700 text-white border-0 text-xs md:text-sm h-8 px-3 flex items-center gap-1 shrink-0"
            >
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Summary
            </Button>
          </div>
        </div>
        <CardDescription className="text-amber-50/80 flex items-center gap-1 text-xs mt-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
          Minutes from 8:00 AM • 5-min grace period for occurrences
          <span className="ml-2 text-amber-200/70">
            {entries.length} shown
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-[#4a2525]/90 sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-amber-100 text-xs md:text-sm">EMPLOYEE NAME</th>
                <th className="px-3 py-2.5 text-left font-medium text-amber-100 text-xs md:text-sm">DATE</th>
                <th className="px-3 py-2.5 text-left font-medium text-amber-100 text-xs md:text-sm">ACTUAL IN</th>
                <th className="px-3 py-2.5 text-left font-medium text-amber-100 text-xs md:text-sm">MINUTES LATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/5">
                  <td className="px-3 py-2 text-white/90 text-xs md:text-sm">
                    <span className="block truncate max-w-[120px] md:max-w-[150px]">
                      {entry.employeeName || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-white/80 text-xs md:text-sm">
                    {entry.date}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={entry.actualIn}
                      onChange={(e) => onUpdateTime(entry.id, e.target.value)}
                      placeholder="8:00 AM"
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50 h-7 md:h-8 text-xs md:text-sm w-24 md:w-28 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`
                      inline-block px-2 py-1 rounded text-xs font-medium
                      ${entry.minutesLate > 30 ? 'bg-red-900/60 text-red-100' :
                        entry.minutesLate > 15 ? 'bg-orange-900/40 text-orange-100' :
                          entry.minutesLate > 5 ? 'bg-amber-900/30 text-amber-50' :
                            entry.minutesLate > 0 ? 'bg-yellow-900/30 text-yellow-100' :
                              'bg-green-900/30 text-green-100'}
                    `}>
                      {entry.minutesLate}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Fill empty rows to maintain 15 rows */}
              {entries.length < 15 && Array.from({ length: 15 - entries.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="bg-black/5">
                  <td className="px-3 py-2">&nbsp;</td>
                  <td className="px-3 py-2">&nbsp;</td>
                  <td className="px-3 py-2">&nbsp;</td>
                  <td className="px-3 py-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-[#4a2525]/40">
            <div className="text-xs text-amber-100/70">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => pagination.setPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 disabled:opacity-50 text-xs h-7 px-3"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => pagination.setPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 disabled:opacity-50 text-xs h-7 px-3"
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