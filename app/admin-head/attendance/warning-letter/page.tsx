'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Check,
    ChevronDown,
    Plus,
    FileText,
    AlertTriangle,
    Calendar,
    Clock,
    Search,
    ChevronRight,
    Filter,
    Loader2,
    Mail,
    ShieldAlert
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

// --- Types ---
interface LateEntry {
    id: string | number
    employee_id: string | number
    employee_name: string
    date: string
    actual_in: string
    minutesLate: number
    warning_level: number
    late_occurrence?: number
    department?: string
}

interface LeaveEntry {
    id: number
    employee_id: string
    employee_name: string
    department: string
    category: 'half-day' | 'whole-day'
    start_date: string
    leave_end_date: string
    number_of_days: number
    remarks: string
    cite_reason: string
    approved_by: string
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function WarningLetterPage() {
    const router = useRouter()
    const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()])
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [yearsList, setYearsList] = useState<number[]>([new Date().getFullYear()])
    const [lateEntries, setLateEntries] = useState<LateEntry[]>([])
    const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [cutoffFilter, setCutoffFilter] = useState<'cutoff1' | 'cutoff2' | 'both'>('both')

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness/years`)
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

    useEffect(() => {
        fetchData()
    }, [selectedMonth, selectedYear])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [empRes, leavesRes, entRes] = await Promise.all([
                fetch('/api/admin-head/employees?status=employed,rehired'),
                fetch(`${getApiUrl()}/api/leaves`),
                fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness?month=${selectedMonth}&year=${selectedYear}`)
            ])

            const empData = await empRes.json()
            const leavesData = await leavesRes.json()
            const entData = await entRes.json()

            const currentLeaves = leavesData.success ? leavesData.data : []

            // Group and summarize leave entries
            const leaveGroups = new Map<string, any>()
            currentLeaves
                .filter((entry: any) => {
                    const isApproved = entry.approved_by !== 'Pending' && entry.approved_by !== 'Declined'
                    const isLong = (entry.number_of_days || 0) >= 3
                    const date = new Date(entry.start_date)
                    return isApproved && isLong && months[date.getMonth()] === selectedMonth && date.getFullYear() === selectedYear
                })
                .forEach((entry: any) => {
                    const date = new Date(entry.start_date)
                    const day = date.getDate()
                    const cutoff = day <= 15 ? 'cutoff1' : 'cutoff2'
                    const key = `${entry.employee_id}-${cutoff}`

                    if (!leaveGroups.has(key)) {
                        leaveGroups.set(key, {
                            ...entry,
                            cutoff,
                            total_days: Number(entry.number_of_days),
                            remarks_list: [entry.remarks],
                            reasons_list: entry.cite_reason ? [entry.cite_reason] : []
                        })
                    } else {
                        const existing = leaveGroups.get(key)
                        existing.total_days += Number(entry.number_of_days)
                        if (entry.remarks && !existing.remarks_list.includes(entry.remarks)) {
                            existing.remarks_list.push(entry.remarks)
                        }
                        if (entry.cite_reason && !existing.reasons_list.includes(entry.cite_reason)) {
                            existing.reasons_list.push(entry.cite_reason)
                        }
                        // Update range if needed
                        if (new Date(entry.start_date) < new Date(existing.start_date)) existing.start_date = entry.start_date
                        if (new Date(entry.leave_end_date) > new Date(existing.leave_end_date)) existing.leave_end_date = entry.leave_end_date
                    }
                })

            const summarizedLeaves = Array.from(leaveGroups.values()).map(entry => ({
                ...entry,
                number_of_days: entry.total_days,
                remarks: entry.remarks_list.join('; '),
                cite_reason: entry.reasons_list.join('; ')
            }))
            setLeaveEntries(summarizedLeaves)

            if (empData.success && entData.success) {
                const employees = empData.data
                const entriesByEmployee = new Map<string | number, any[]>()
                const mappedEntries = entData.data.map((e: any) => {
                    const empInfo = employees.find((emp: any) => String(emp.id) === String(e.employee_id))
                    const date = new Date(e.date)
                    const day = date.getDate()
                    const cutoff = e.cutoff_period || (day <= 15 ? 'cutoff1' : 'cutoff2')
                    return {
                        ...e,
                        employee_name: e.employee_name || empInfo?.name || String(e.employee_id),
                        department: empInfo?.department || empInfo?.office_name,
                        cutoff: cutoff
                    }
                })

                mappedEntries.forEach((entry: any) => {
                    const key = entry.employee_id
                    if (!entriesByEmployee.has(key)) entriesByEmployee.set(key, [])
                    entriesByEmployee.get(key)?.push(entry)
                })

                const lateGroups = new Map<string, any>()
                entriesByEmployee.forEach((group) => {
                    group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    let lateCount = 0
                    group.forEach((entry) => {
                        const isLate = (entry.minutes_late > 0) || (entry.minutesLate > 0)
                        let currentWarningLevel = 0

                        if (entry.warning_level > 0) {
                            currentWarningLevel = entry.warning_level
                            lateCount = Math.max(lateCount, entry.warning_level + 2)
                        } else if (isLate) {
                            lateCount++
                            if (lateCount >= 3) {
                                currentWarningLevel = lateCount - 2
                            }
                        }

                        if (currentWarningLevel > 0) {
                            const key = `${entry.employee_id}-${entry.cutoff}`
                            if (!lateGroups.has(key)) {
                                lateGroups.set(key, {
                                    ...entry,
                                    warning_level: currentWarningLevel,
                                    instances: 1
                                })
                            } else {
                                const existing = lateGroups.get(key)
                                // Keep the highest warning level in the cutoff
                                if (currentWarningLevel > existing.warning_level) {
                                    existing.warning_level = currentWarningLevel
                                    existing.date = entry.date
                                    existing.actual_in = entry.actual_in
                                }
                                existing.instances += 1
                            }
                        }
                    })
                })
                setLateEntries(Array.from(lateGroups.values()))
            }
        } catch (error) { console.error('Error fetching data:', error) } finally { setIsLoading(false) }
    }

    const filteredLateEntries = lateEntries.filter(entry => {
        const matchesSearch = entry.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCutoff = cutoffFilter === 'both' || (entry as any).cutoff === cutoffFilter
        return matchesSearch && matchesCutoff
    })

    const filteredLeaveEntries = leaveEntries.filter(entry => {
        const matchesSearch = entry.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCutoff = cutoffFilter === 'both' || (entry as any).cutoff === cutoffFilter
        return matchesSearch && matchesCutoff
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="min-h-screen bg-[#FDF4F6]">
            {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
            <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-8">
                {/* Main Header Row */}
                <div className="w-full px-4 md:px-8 py-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                                <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-rose-200" />
                                EMPLOYEES WITH WARNING
                            </h1>
                            <p className="text-white/80 text-sm md:text-base flex items-center gap-2 font-medium">
                                <Clock className="w-4 h-4" />
                                Monitoring warnings on leave and attendance for {selectedMonth} {selectedYear}
                            </p>
                        </div>

                        {/* Optional Actions Group */}
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => router.push('/admin-head/attendance/warning-letter/edit_forms')}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-xl font-bold py-6 px-6 transition-all active:scale-95 flex items-center gap-2 border shadow-lg group"
                            >
                                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span>Edit Form Templates</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Secondary Toolbar */}
                <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="w-full px-4 md:px-8 py-4">
                        <div className="flex flex-wrap items-center gap-4 md:gap-6">

                            {/* Year Selection */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-white/70 uppercase tracking-widest">Year</span>
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
                                                onClick={() => setSelectedYear(typeof year === 'string' ? parseInt(year) : year)}
                                                className={cn(
                                                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                                                    selectedYear === (typeof year === 'string' ? parseInt(year) : year) ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                                                )}
                                            >
                                                {year}
                                                {selectedYear === (typeof year === 'string' ? parseInt(year) : year) && <Check className="w-4 h-4 text-red-600" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Month Selection */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-white/70 uppercase tracking-widest">Month</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[150px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
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
                                <span className="text-xs font-black text-white/70 uppercase tracking-widest">Period</span>
                                <div className="flex bg-white p-1 rounded-lg border-2 border-[#FFE5EC] shadow-sm h-10">
                                    <button
                                        onClick={() => setCutoffFilter('cutoff1')}
                                        className={cn(
                                            "px-4 py-0 rounded-md text-[11px] font-black transition-all whitespace-nowrap uppercase tracking-wider",
                                            cutoffFilter === 'cutoff1' ? "bg-[#4A081A] text-white shadow-sm" : "text-[#7B0F2B] hover:bg-rose-50"
                                        )}
                                    >
                                        1st-15th
                                    </button>
                                    <button
                                        onClick={() => setCutoffFilter('cutoff2')}
                                        className={cn(
                                            "px-4 py-0 rounded-md text-[11px] font-black transition-all whitespace-nowrap uppercase tracking-wider",
                                            cutoffFilter === 'cutoff2' ? "bg-[#4A081A] text-white shadow-sm" : "text-[#7B0F2B] hover:bg-rose-50"
                                        )}
                                    >
                                        16th-End
                                    </button>
                                    <button
                                        onClick={() => setCutoffFilter('both')}
                                        className={cn(
                                            "px-4 py-0 rounded-md text-[11px] font-black transition-all whitespace-nowrap uppercase tracking-wider",
                                            cutoffFilter === 'both' ? "bg-[#4A081A] text-white shadow-sm" : "text-[#7B0F2B] hover:bg-rose-50"
                                        )}
                                    >
                                        Both
                                    </button>
                                </div>
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full md:w-[300px] md:ml-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A4163A]" />
                                <Input
                                    placeholder="Search employee..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 bg-white border-2 border-[#FFE5EC] rounded-lg shadow-sm focus:ring-2 focus:ring-[#A4163A] focus:border-[#7B0F2B] transition-all font-bold text-[#4A081A] placeholder:text-stone-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 lg:p-10 -mt-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {isLoading ? (
                        <>
                            {[1, 2].map((i) => (
                                <Card key={i} className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
                                    {/* Skeleton Header */}
                                    <div className="bg-slate-50 p-8 border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="w-14 h-14 rounded-2xl bg-slate-200" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-8 w-48 bg-slate-200" />
                                                    <Skeleton className="h-4 w-64 bg-slate-200" />
                                                </div>
                                            </div>
                                            <Skeleton className="w-24 h-10 rounded-full bg-slate-200" />
                                        </div>
                                    </div>
                                    {/* Skeleton Table Body */}
                                    <div className="p-6 space-y-6">
                                        {[1, 2, 3, 4, 5].map((row) => (
                                            <div key={row} className="flex items-center justify-between pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="w-11 h-11 rounded-xl bg-slate-100" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-40 bg-slate-100" />
                                                        <Skeleton className="h-3 w-24 bg-slate-50" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-10">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Skeleton className="h-4 w-12 bg-slate-100" />
                                                        <Skeleton className="h-3 w-16 bg-slate-50" />
                                                    </div>
                                                    <Skeleton className="h-10 w-20 rounded-lg bg-slate-100" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <>
                            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group transition-all duration-300 hover:shadow-[#7B0F2B]/10">
                                <CardHeader className="bg-gradient-to-r from-[#4A081A] to-[#A4163A] p-8 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                                <Clock className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-black tracking-wide">Late Entries (Warnings Reached)</CardTitle>
                                                <CardDescription className="text-rose-100/80 font-medium text-base mt-1">
                                                    Warnings for {selectedMonth} {selectedYear} ({cutoffFilter === 'both' ? 'Both Cut-offs' : cutoffFilter === 'cutoff1' ? 'Cut-off 1' : 'Cut-off 2'})
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg px-4 py-1.5 rounded-full backdrop-blur-sm">
                                            {filteredLateEntries.length} Records
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#FDF4F6] border-b-2 border-[#FFE5EC] hover:bg-[#FDF4F6]">
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px]">Employee</TableHead>
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Summary</TableHead>
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Warning</TableHead>
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLateEntries.length > 0 ? (
                                                filteredLateEntries.map((entry) => (
                                                    <TableRow key={entry.id} className="border-b border-[#FFE5EC] group/row transition-colors hover:bg-rose-50/50">
                                                        <TableCell className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B0F2B] to-[#A4163A] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                                                    {entry.employee_name[0]}
                                                                </div>
                                                                <span className="font-bold text-[#4A081A] text-sm leading-tight line-clamp-2">{entry.employee_name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center text-slate-600">
                                                            <div className="flex flex-col items-center">
                                                                <div className="flex items-center gap-1 font-black text-[10px] text-[#A4163A] uppercase">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    {(entry as any).instances} LATES
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5 whitespace-nowrap">
                                                                    {formatDate(entry.date)}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <div className="flex justify-center">
                                                                <div className={cn(
                                                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-black text-[10px] border-2 shadow-sm uppercase",
                                                                    entry.warning_level === 1 ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                                        entry.warning_level === 2 ? "bg-orange-50 text-orange-600 border-orange-200" :
                                                                            "bg-red-50 text-red-600 border-red-200"
                                                                )}>
                                                                    {entry.warning_level === 1 ? '1st' :
                                                                        entry.warning_level === 2 ? '2nd' :
                                                                            'Final'}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => router.push(`/admin-head/attendance/warning-letter/forms-letter?employeeId=${entry.employee_id}&type=late&month=${selectedMonth}&year=${selectedYear}&cutoff=${(entry as any).cutoff}`)}
                                                                className="bg-[#4A081A] hover:bg-[#630C22] text-white rounded-lg font-bold gap-1 shadow hover:shadow-lg transition-all active:scale-95 text-[10px] h-8 px-3"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                VIEW
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic text-xl">
                                                        No employees with attendance warnings found for this selected period and cutoff.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group transition-all duration-300 hover:shadow-[#7B0F2B]/10">
                                <CardHeader className="bg-gradient-to-r from-[#7B0F2B] to-[#D61F4D] p-8 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                                <Calendar className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-black tracking-wide">Extended Leave Monitoring</CardTitle>
                                                <CardDescription className="text-rose-100/80 font-medium text-base mt-1">
                                                    Approved leaves for {selectedMonth} {selectedYear} ({cutoffFilter === 'both' ? 'Both Cut-offs' : cutoffFilter === 'cutoff1' ? 'Cut-off 1' : 'Cut-off 2'})
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg px-4 py-1.5 rounded-full backdrop-blur-sm">
                                            {filteredLeaveEntries.length} Records
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#FDF4F6] border-b-2 border-[#FFE5EC] hover:bg-[#FDF4F6]">
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px]">Employee</TableHead>
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Days</TableHead>
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px]">Reason</TableHead>
                                                <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLeaveEntries.length > 0 ? (
                                                filteredLeaveEntries.map((entry) => (
                                                    <TableRow key={entry.id} className="border-b border-[#FFE5EC] group/row transition-colors hover:bg-rose-50/50">
                                                        <TableCell className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D61F4D] to-[#7B0F2B] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                                                    {entry.employee_name[0]}
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-[#4A081A] text-sm block leading-tight">{entry.employee_name}</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight line-clamp-1">{entry.department}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <div className="font-black text-[#A4163A] text-xl">
                                                                {entry.number_of_days}
                                                                <span className="text-[9px] font-bold ml-0.5 text-slate-400">D</span>
                                                            </div>
                                                            <div className="text-[9px] text-slate-400 font-bold mt-0.5 whitespace-nowrap">
                                                                {new Date(entry.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4">
                                                            <div className="max-w-[120px]">
                                                                <p className="font-black text-[#4A081A] text-[10px] truncate uppercase leading-tight">{entry.remarks}</p>
                                                                <p className="text-slate-500 text-[10px] italic mt-0.5 line-clamp-1">{entry.cite_reason || "No reason"}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => router.push(`/admin-head/attendance/warning-letter/forms-letter?employeeId=${entry.employee_id}&type=leave&month=${selectedMonth}&year=${selectedYear}&cutoff=${(entry as any).cutoff}`)}
                                                                className="bg-[#7B0F2B] hover:bg-[#A4163A] text-white rounded-lg font-bold gap-1 shadow hover:shadow-lg transition-all active:scale-95 text-[10px] h-8 px-3"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                VIEW
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic text-xl">
                                                        No approved extended leave requests (3+ days) found for this period and cutoff.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

