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
    <div className="min-h-screen flex flex-col bg-[#F9F6F7]">
      <SuperAdminHeader user={user} onLogout={handleLogout} />

      {/* CONTENT - Constrained Width */}
      <div className="flex-1 p-6 space-y-6">
        <div className="max-w-7xl mx-auto w-full">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* DASHBOARD HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#7B0F2B] mb-2">Super Admin Dashboard</h2>
              <p className="text-gray-600">Welcome back, {user?.name}! Here's what's happening across all systems.</p>
            </div>
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

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Systems</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">12</div>
                <p className="text-xs text-gray-500 mt-1">+2 new this month</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">1,247</div>
                <p className="text-xs text-gray-500 mt-1">85% of total users</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Tasks</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">23</div>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <p className="text-xs text-gray-500 mt-1">All systems operational</p>
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

          {/* QUICK ACTIONS */}
          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7B0F2B]">Quick Actions</CardTitle>
              <p className="text-sm text-gray-600">Common administrative tasks</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  onClick={goToAccountants}
                  className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl hover:from-[#5E0C20] hover:to-[#7C102E]"
                >
                  <User className="w-6 h-6" />
                  <span className="text-sm">Manage Users</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Add System</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl">
                  <Download className="w-6 h-6" />
                  <span className="text-sm">Export Data</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl">
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SYSTEM STATUS */}
          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7B0F2B]">System Status</CardTitle>
              <p className="text-sm text-gray-600">Current system performance metrics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">32ms</div>
                  <p className="text-sm text-gray-600">Response Time</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">8.7GB</div>
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '58%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
