"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Avatar, AvatarFallback } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
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
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui'
import { 
  fetchActivityLogs, 
  fetchActivityStats, 
  formatRelativeTime,
  type ActivityLog,
  type ActivityLogStats
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

const getStatusColor = (status: ActivityStatus) => {
  switch (status) {
    case 'success':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
    case 'warning':
      return 'bg-amber-500/10 text-amber-700 border-amber-200'
    case 'error':
      return 'bg-red-500/10 text-red-700 border-red-200'
    case 'info':
      return 'bg-blue-500/10 text-blue-700 border-blue-200'
    default:
      return 'bg-slate-500/10 text-slate-700 border-slate-200'
  }
}

const getStatusIcon = (status: ActivityStatus) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4" />
    case 'warning':
      return <AlertCircle className="w-4 h-4" />
    case 'error':
      return <XCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

const getUserInitials = (name: string | null): string => {
  if (!name) return 'SY'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export default function AdminHeadPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityLogStats | null>(null)
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
        per_page: 20,
      })

      setActivities(response.data)
      setTotalPages(response.pagination.last_page)
    } catch (err) {
      setError('Failed to load activity logs. Please try again.')
      console.error('Error loading activities:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetchActivityStats()
      setStats(response.data)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  useEffect(() => {
    loadActivities()
    loadStats()
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
    loadStats()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Activity Logs</h1>
          <p className="text-slate-600 text-lg">
            Monitor all system activities and recent changes in real-time
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription>Total Activities</CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-600">
                {stats.total_activities}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription>Employee Actions</CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-600">
                {stats.by_type.employee}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription>Pending Items</CardDescription>
              <CardTitle className="text-3xl font-bold text-amber-600">
                {stats.pending_items}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardDescription>Today&apos;s Activities</CardDescription>
              <CardTitle className="text-3xl font-bold text-purple-600">
                {stats.today_activities}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Activity Feed */}
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Recent Activities</CardTitle>
              <CardDescription className="mt-1">
                Track all system events and user actions
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="employee" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Employee
              </TabsTrigger>
              <TabsTrigger value="department" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Department
              </TabsTrigger>
              <TabsTrigger value="position" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Position
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="auth" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Auth
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
                  <p className="text-slate-500 text-lg">Loading activities...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600 text-lg mb-2">{error}</p>
                  <Button onClick={() => loadActivities()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-lg">No activities found</p>
                  <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
                </div>
              ) : (
                <>
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="group relative bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg p-5 hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          activity.activity_type === 'employee' ? 'bg-blue-500/10 text-blue-600' :
                          activity.activity_type === 'department' ? 'bg-purple-500/10 text-purple-600' :
                          activity.activity_type === 'position' ? 'bg-green-500/10 text-green-600' :
                          activity.activity_type === 'attendance' ? 'bg-amber-500/10 text-amber-600' :
                          activity.activity_type === 'auth' ? 'bg-emerald-500/10 text-emerald-600' :
                          'bg-slate-500/10 text-slate-600'
                        } group-hover:scale-110 transition-transform duration-300`}>
                          {getActivityIcon(activity.activity_type, activity.action)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 text-lg mb-1">
                                {activity.title}
                              </h3>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                {activity.description}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1.5 px-3 py-1 ${getStatusColor(activity.status as ActivityStatus)}`}
                            >
                              {getStatusIcon(activity.status as ActivityStatus)}
                              <span className="capitalize font-medium">{activity.status}</span>
                            </Badge>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 border-2 border-white shadow-sm">
                                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                                  {getUserInitials(activity.user_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-slate-700 font-medium">
                                {activity.user_name || 'System'}
                              </span>
                            </div>
                            <span className="text-slate-400">•</span>
                            <span className="text-sm text-slate-500">
                              {formatRelativeTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hover effect line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-400 to-slate-600 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                      <Button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-600 px-4">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
