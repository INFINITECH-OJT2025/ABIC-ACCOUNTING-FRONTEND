"use client"

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui'
import { Button } from '@/components/ui'
import {
  UserPlus,
  UserMinus,
  FileText,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  Check,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui'
import {
  fetchActivityLogs,
  type ActivityLog
} from '@/lib/api/activity-logs'

// Activity types
type ActivityType = 'employee' | 'department' | 'position' | 'attendance' | 'system' | 'auth'
type ActivityStatus = 'success' | 'warning' | 'error' | 'info'

const getActivityIcon = (type: string, action: string) => {
  if (type === 'employee') {
    if (action === 'created') return <UserPlus className="w-5 h-5" />
    if (action === 'deleted' || action === 'terminated') return <UserMinus className="w-5 h-5" />
    return <CheckCircle className="w-5 h-5" />
  }
  if (type === 'attendance') return <Clock className="w-5 h-5" />
  if (type === 'department' || type === 'position') return <FileText className="w-5 h-5" />
  if (type === 'system') return <Settings className="w-5 h-5" />
  if (type === 'auth') return <Calendar className="w-5 h-5" />
  return <AlertCircle className="w-5 h-5" />
}

export default function AdminHeadPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadActivities = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetchActivityLogs({
        type: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
        page: currentPage,
        per_page: 15,
      })

      setActivities(response.data)
      setTotalPages(response.pagination.last_page)
    } catch (err) {
      setError('Failed to load activity logs. Please try again.')
      toast.error('Failed to load activity logs', {
        description: 'Please check your connection and try again.'
      })
      console.error('Error loading activities:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [activeTab, currentPage])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadActivities()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleRefresh = () => {
    loadActivities(true)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-2">
      <div className="relative w-full">
        {/* ----- HEADER SECTION ----- */}
        <header className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md p-4 md:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Activity Logs</h1>
              <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                ABIC REALTY & CONSULTANCY • Real-time Monitoring
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all rounded-full px-5 py-2 h-auto text-sm font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                <span>REFRESH</span>
              </Button>
            </div>
          </div>
        </header>

        {/* ----- TOOLBAR SECTION - CATEGORIES & SEARCH ----- */}
        <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
          <div className="w-full pl-6 pr-6 py-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Category Selection */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">CATEGORY</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-100 bg-rose-50/30 text-[#A4163A] font-semibold hover:bg-rose-50 transition-colors">
                      <span className="capitalize">{activeTab} Activities</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border-stone-200 shadow-xl rounded-xl p-1.5" align="start">
                    {['all', 'employee', 'department', 'position', 'attendance', 'auth'].map(tab => (
                      <DropdownMenuItem
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          activeTab === tab ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <span className="capitalize">{tab}</span>
                        {activeTab === tab && <Check className="w-4 h-4 text-red-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Global Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search activity descriptions, users, or titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-stone-50/50 border-stone-200 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A4163A] focus:border-transparent rounded-lg transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full pl-6 pr-6 py-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-12 h-12 text-[#A4163A] animate-spin" />
              <p className="text-stone-400 font-medium">Loading activities...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 px-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-stone-600 font-medium">{error}</p>
              <Button variant="outline" onClick={() => loadActivities()} className="mt-4">Retry</Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-20 px-4">
              <p className="text-stone-400">No activities found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-stone-100">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-6 hover:bg-stone-50/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-[#EBF5FF] border border-[#D1E9FF] text-[#0066FF]">
                        {getActivityIcon(activity.activity_type, activity.action)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-stone-900 text-lg">
                            {activity.title}
                          </h3>
                          <Badge
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border-none",
                              activity.status === 'success'
                                ? "bg-[#DCFCE7] text-[#15803D] hover:bg-[#DCFCE7]"
                                : "bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]"
                            )}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-stone-500 text-sm font-medium">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Button - See previous notification */}
              {totalPages > 1 && (
                <div className="p-4 bg-stone-50/50 border-t border-stone-100">
                  <button
                    onClick={() => {
                      if (currentPage < totalPages) {
                        setCurrentPage(p => p + 1)
                      }
                    }}
                    className="w-full py-4 bg-[#A4163A]/60 hover:bg-[#A4163A]/70 text-white rounded-md font-bold uppercase tracking-widest text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                  >
                    See previous notification
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
