"use client"

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  ShieldCheck,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LeaveCredit {
  employee_id: string
  employee_name: string
  department: string
  regularization_date: string | null
  has_one_year_regular: boolean
  vl_total: number
  sl_total: number
  vl_used: number
  sl_used: number
  vl_balance: number
  sl_balance: number
}

export default function LeaveCreditsPage() {
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<LeaveCredit[]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl()}/api/leaves/credits`)
      const result = await response.json()
      if (result.success) {
        setCredits(result.data)
      } else {
        toast.error('Failed to fetch leave credits')
      }
    } catch (error) {
      console.error('Error fetching leave credits:', error)
      toast.error('An error occurred while fetching leave credits')
    } finally {
      setLoading(false)
    }
  }

  const filteredCredits = credits.filter(c => 
    c.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    c.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    (c.department && c.department.toLowerCase().includes(search.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredCredits.length / itemsPerPage)
  const paginatedCredits = filteredCredits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const stats = {
    totalEmployees: credits.length,
    qualified: credits.filter(c => c.has_one_year_regular).length,
    totalVLRemaining: credits.reduce((sum, c) => sum + c.vl_balance, 0),
    totalSLRemaining: credits.reduce((sum, c) => sum + c.sl_balance, 0)
  }

  if (loading) return <LeaveCreditsSkeleton />

  return (
    <div className="min-h-screen bg-[#FDFCFD] p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Leave <span className="text-[#630C22]">Credits</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage and track employee vacation and sick leave entitlements</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#630C22] transition-colors" />
            <Input 
              placeholder="Search employees..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-full md:w-80 h-11 bg-white border-slate-200 focus:ring-[#630C22] focus:border-[#630C22] rounded-xl shadow-sm transition-all"
            />
          </div>
          <Button 
            onClick={fetchCredits}
            variant="outline"
            className="h-11 px-4 border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Employees" 
          value={stats.totalEmployees} 
          icon={Users} 
          color="blue" 
          label="In system"
        />
        <StatsCard 
          title="Benefit Qualified" 
          value={stats.qualified} 
          icon={ShieldCheck} 
          color="green" 
          label="1+ Year Regular"
        />
        <StatsCard 
          title="Total VL Balance" 
          value={stats.totalVLRemaining} 
          icon={TrendingUp} 
          color="maroon" 
          label="Days remaining"
        />
        <StatsCard 
          title="Total SL Balance" 
          value={stats.totalSLRemaining} 
          icon={TrendingUp} 
          color="orange" 
          label="Days remaining"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Regularization</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Benefit Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Vacation Leave</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Sick Leave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedCredits.length > 0 ? paginatedCredits.map((item) => (
                <tr key={item.employee_id} className="group hover:bg-rose-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#630C22]/10 flex items-center justify-center text-[#630C22] font-bold">
                        {item.employee_name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-[#630C22] transition-colors">{item.employee_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {item.department || 'No Department'} • {item.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-slate-600">
                      {item.regularization_date ? new Date(item.regularization_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium tracking-tighter">
                      Regularization Date
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {item.has_one_year_regular ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Qualified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-200 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Ineligible
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center">
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-black text-slate-800">{item.vl_balance}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">/ {item.vl_total} Days</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-[#630C22] rounded-full" 
                          style={{ width: `${item.vl_total > 0 ? (item.vl_balance / item.vl_total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">{item.vl_used} Used</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center">
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-black text-slate-800">{item.sl_balance}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">/ {item.sl_total} Days</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full" 
                          style={{ width: `${item.sl_total > 0 ? (item.sl_balance / item.sl_total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">{item.sl_used} Used</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Users className="w-8 h-8 text-slate-200" />
                      </div>
                      <div className="text-slate-400 font-medium">No results found for "{search}"</div>
                      <Button variant="ghost" className="text-[#630C22]" onClick={() => setSearch('')}>Clear search</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredCredits.length)}</span> of <span className="text-slate-800">{filteredCredits.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="w-9 h-9 rounded-lg border-slate-200"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    className={cn(
                      "w-9 h-9 rounded-lg p-0",
                      currentPage === page ? "bg-[#630C22] hover:bg-[#4A081A]" : "text-slate-600"
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="w-9 h-9 rounded-lg border-slate-200"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Note Section */}
      <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100/50">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Credit Policy</h4>
          <p className="text-sm text-amber-800 leading-relaxed font-medium">
            Employees are granted <span className="font-bold underline">15 days Vacation Leave</span> and <span className="font-bold underline">15 days Sick Leave</span> annually. 
            Benefits are automatically enabled after <span className="font-bold">one year of service following regularization</span>. New employees or those regularized for less than one year are ineligible for these credits.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, color, label }: { 
  title: string, value: number, icon: any, color: 'maroon' | 'blue' | 'green' | 'orange', label: string 
}) {
  const colors = {
    maroon: 'bg-rose-50 text-[#630C22] ring-rose-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    orange: 'bg-orange-50 text-orange-600 ring-orange-100'
  }
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center ring-4 ring-offset-0", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-black text-slate-800">{typeof value === 'number' && !isNaN(value) ? Math.round(value) : value}</h3>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  )
}

function LeaveCreditsSkeleton() {
  return (
    <div className="min-h-screen bg-[#FDFCFD] p-8 space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-80 rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
      </div>
      <Skeleton className="h-[600px] w-full rounded-3xl" />
    </div>
  )
}
