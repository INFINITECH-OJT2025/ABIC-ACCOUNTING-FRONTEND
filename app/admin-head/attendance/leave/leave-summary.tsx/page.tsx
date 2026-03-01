'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, ChevronLeft, Search, Download, ChevronDown, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Employee {
    id: string
    name: string
    department?: string
}

interface LeaveEntry {
    id: number
    employee_id: string
    employee_name: string
    start_date: string
    number_of_days: number
    approved_by: string
}

export default function LeaveSummaryPage() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        Promise.all([
            fetch(`${getApiUrl()}/api/employees`).then(r => r.json()),
            fetch(`${getApiUrl()}/api/leaves`).then(r => r.json())
        ]).then(([empData, leaveData]) => {
            if (empData.success) {
                setEmployees(empData.data.map((e: any) => ({
                    id: e.id,
                    name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
                    department: e.department
                })));
            }
            if (leaveData.success) {
                setLeaves(leaveData.data ?? []);
            }
        }).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    const summaryData = useMemo(() => {
        const stats: Record<string, { employee: Employee, months: number[], total: number }> = {};

        employees.forEach(emp => {
            stats[emp.id] = { employee: emp, months: Array(12).fill(0), total: 0 };
        });

        leaves.forEach(leave => {
            // Include only Approved leaves (not Pending, not Declined)
            const isApproved = !['Pending', 'Declined'].includes(leave.approved_by);
            if (!isApproved) return;

            if (!leave.start_date) return;
            const date = new Date(leave.start_date);
            if (date.getFullYear() !== selectedYear) return;

            const month = date.getMonth(); // 0-11
            const empId = leave.employee_id;

            if (!stats[empId]) {
                stats[empId] = { employee: { id: empId, name: leave.employee_name }, months: Array(12).fill(0), total: 0 };
            }

            const days = Number(leave.number_of_days) || 0;
            stats[empId].months[month] += days;
            stats[empId].total += days;
        });

        let result = Object.values(stats);

        // Sort by ID to match the image sorting (e.g. 19-0015, 22-0016, 24-0045...)
        result.sort((a, b) => {
            return String(a.employee.id).localeCompare(String(b.employee.id));
        });

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.employee.name.toLowerCase().includes(query) ||
                r.employee.id.toLowerCase().includes(query)
            );
        }

        return result;
    }, [employees, leaves, selectedYear, searchQuery]);

    const yearOptions = useMemo(() => {
        const years = new Set<number>();
        leaves.forEach(leave => {
            if (leave.start_date) {
                const year = new Date(leave.start_date).getFullYear();
                if (!isNaN(year)) {
                    years.add(year);
                }
            }
        });

        const sortedYears = Array.from(years).sort((a, b) => b - a);
        // Fallback to current year if no data is found yet
        return sortedYears.length > 0 ? sortedYears : [currentYear];
    }, [leaves, currentYear]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8f0f2] via-white to-[#fff0f3]">
            {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
            <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6 sticky top-0 z-50">
                {/* Main Header Row */}
                <div className="w-full px-4 md:px-8 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">Yearly Leave Summary</h1>
                            <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Leave Monitoring {selectedYear}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/admin-head/attendance/leave">
                                <Button
                                    variant="outline"
                                    className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /><span>Back to leave entry</span>
                                </Button>
                            </Link>
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
                                            <span>{selectedYear}</span>
                                            <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[150px] bg-white border-rose-100 shadow-xl rounded-xl p-1.5" align="start">
                                        {yearOptions.map(year => (
                                            <DropdownMenuItem
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
                                                className={cn(
                                                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                                                    selectedYear === year ? "bg-red-50 text-red-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                {year}
                                                {selectedYear === year && <Check className="w-4 h-4 text-red-600" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Export Button */}
                            <Button
                                variant="outline"
                                className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /><span>Export</span>
                            </Button>

                            {/* Search Bar */}
                            <div className="flex items-center gap-3 ml-auto">
                                <span className="text-sm font-bold text-white/70 uppercase tracking-wider hidden xl:block">Search</span>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search Employee..."
                                        className="pl-9 h-10 w-[300px] lg:w-[400px] bg-white border-2 border-[#FFE5EC] text-[#800020] placeholder:text-slate-400 font-medium rounded-lg shadow-sm focus-visible:ring-rose-200 transition-all duration-200 focus:w-[320px] lg:focus:w-[440px]"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ----- CONTENT ----- */}
            <div className="px-6 py-6 md:px-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
                    <div className="bg-white border-b border-slate-300 px-8 py-6 flex items-center justify-between">
                        <h2 className="text-[#4A081A] text-xl font-bold tracking-wide uppercase">
                            Leave Monitoring Summary {selectedYear}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-500 font-medium text-lg animate-pulse">
                                Loading leave data...
                            </div>
                        ) : (
                            <table className="w-full text-base border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-300">
                                        <th className="px-6 py-4 font-bold uppercase text-center whitespace-nowrap border-r border-slate-300/50">ID Number</th>
                                        <th className="px-6 py-4 font-bold uppercase text-center min-w-[250px] border-r border-slate-300/50">Name</th>
                                        {MONTHS.map(m => (
                                            <th key={m} className="px-2 py-4 font-bold text-sm uppercase text-center w-14 border-r border-slate-300/50">{m}</th>
                                        ))}
                                        <th className="px-6 py-4 font-bold uppercase text-center whitespace-nowrap">Total Leave Taken</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryData.map((record, idx) => (
                                        <tr
                                            key={record.employee.id}
                                            className={cn('border-b border-slate-300 hover:bg-slate-50/80 transition-colors', idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}
                                        >
                                            <td className="px-6 py-4 text-center text-slate-700 font-semibold border-r border-slate-300">{record.employee.id}</td>
                                            <td className="px-6 py-4 text-left font-bold text-lg text-slate-800 border-r border-slate-300">{record.employee.name}</td>

                                            {record.months.map((val, mIdx) => (
                                                <td
                                                    key={mIdx}
                                                    className={cn(
                                                        "px-2 py-4 text-center border-r border-slate-300",
                                                        val >= 3 ? "bg-rose-200 text-rose-900 font-black text-lg shadow-[inset_0_0_8px_rgba(225,29,72,0.2)]" : "text-slate-600 font-semibold"
                                                    )}
                                                >
                                                    {val > 0
                                                        ? (val % 1 !== 0
                                                            ? (Math.floor(val) > 0 ? `${Math.floor(val)}d ${(val % 1) * 8}hrs` : `${val * 8}hrs`)
                                                            : val)
                                                        : <span className="text-slate-300">-</span>}
                                                </td>
                                            ))}

                                            <td className="px-6 py-4 text-center text-[#4A081A] font-bold text-xl bg-slate-50/50">
                                                {record.total > 0
                                                    ? (record.total % 1 !== 0
                                                        ? (Math.floor(record.total) > 0 ? `${Math.floor(record.total)}d ${(record.total % 1) * 8}hrs` : `${record.total * 8}hrs`)
                                                        : record.total)
                                                    : <span className="text-slate-300">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {summaryData.length === 0 && (
                                        <tr>
                                            <td colSpan={15} className="px-4 py-8 text-center text-slate-400 italic">
                                                No employee records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
