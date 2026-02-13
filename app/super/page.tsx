"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  RefreshCcw,
  Download,
  User,
  Plus,
  Settings,
  Eye,
  Mail,
  CheckCircle,
  TrendingUp,
  DollarSign,
  FileText,
  Calendar,
  AlertTriangle,
  Database,
  Clock,
  HardDrive,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SuperAdminHeader from "@/components/layout/SuperAdminHeader"

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState('')

  const goToAccountants = () => {
    router.push('/super/accountant')
  }

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } catch (err) {
        setError('Network error')
      }
    }

    fetchMe()
  }, [router])

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        router.push('/login')
      } else {
        setError('Logout failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <SuperAdminHeader user={user} onLogout={handleLogout} />
      
      {/* CONTENT - Constrained Width */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* DASHBOARD HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white rounded-xl hover:from-[#5E0C20] hover:to-[#7C102E]">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* TOP SUMMARY CARDS - KPI ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Records / Transactions */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-[#7B0F2B]/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#7B0F2B]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">45,892</div>
                <p className="text-xs text-gray-600">+342 this month</p>
              </CardContent>
            </Card>

            {/* Reports Generated */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Reports Generated</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-[#7B0F2B]/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#7B0F2B]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">127</div>
                <p className="text-xs text-gray-600">Today & this week</p>
              </CardContent>
            </Card>

            {/* Pending Exports */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Exports</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-[#7B0F2B]/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#7B0F2B]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">8</div>
                <p className="text-xs text-gray-600">Awaiting processing</p>
              </CardContent>
            </Card>

            {/* Archive Snapshots */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Archive Snapshots</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-[#7B0F2B]/20 flex items-center justify-center">
                  <Database className="h-4 w-4 text-[#7B0F2B]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">24</div>
                <p className="text-xs text-gray-600">Available for restore</p>
              </CardContent>
            </Card>

            {/* Failed Jobs / Errors */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Failed Jobs / Errors</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-[#7B0F2B]/20 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-[#7B0F2B]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">3</div>
                <p className="text-xs text-gray-600">Requires attention</p>
              </CardContent>
            </Card>

            {/* Active Users Today */}
            <Card className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users Today</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-[#7B0F2B]/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-[#7B0F2B]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">156</div>
                <p className="text-xs text-gray-600">Currently logged in</p>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS AND ANALYTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SYSTEM ACTIVITY CHART */}
            <Card className="rounded-2xl shadow-lg border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#7B0F2B]">System Activity</CardTitle>
                <p className="text-sm text-gray-600">Daily activity across all systems</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const height = Math.random() * 100 + 20
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-[#7B0F2B] to-[#A4163A] rounded-t"
                          style={{ height: `${height}%` }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* RECENT ACTIVITIES */}
            <Card className="rounded-2xl shadow-lg border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#7B0F2B]">Recent Activities</CardTitle>
                <p className="text-sm text-gray-600">Latest system-wide activities</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: <User className="w-4 h-4" />, title: "New admin added", desc: "System administrator created", time: "2 hours ago", color: "blue" },
                    { icon: <Eye className="w-4 h-4" />, title: "System report viewed", desc: "Monthly system report accessed", time: "4 hours ago", color: "green" },
                    { icon: <Mail className="w-4 h-4" />, title: "Credentials sent", desc: "Password reset email sent", time: "6 hours ago", color: "yellow" },
                    { icon: <Download className="w-4 h-4" />, title: "Data exported", desc: "System data exported successfully", time: "1 day ago", color: "purple" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        activity.color === 'green' ? 'bg-green-100 text-green-600' :
                        activity.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                        <p className="text-gray-600 text-xs">{activity.desc}</p>
                        <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs">
          <p className="tracking-wide">
            © 2026 ABIC Realty & Consultancy Corporation - Super Admin Portal
          </p>

          <p className="opacity-80">
            All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  )
}
