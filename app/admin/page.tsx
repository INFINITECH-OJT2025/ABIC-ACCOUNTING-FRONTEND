"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Menu,
  User,
  Search,
  RefreshCcw,
  Download,
  Printer,
  Eye,
  MoreVertical,
  Bell,
  CheckCircle,
  Mail,
  ChevronDown,
  Plus,
  X,
  Settings,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const [accountantDropdownOpen, setAccountantDropdownOpen] = useState(false)

  // Mock data for demonstration
  const transactions = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
  }))

  const rowsPerPage = 15
  const totalPages = Math.ceil(transactions.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = transactions.slice(startIndex, endIndex)

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const goToAccountants = () => {
    router.push('/admin/accountant')
  }

  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
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
      {/* ENHANCED STICKY HEADER */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gradient-to-r from-[#7B0F2B]/95 to-[#A4163A]/95 backdrop-blur-lg shadow-lg' 
          : 'bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] shadow-md'
      }`}>
        <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            {/* LEFT SIDE - Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ABIC</span>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide text-white">
                  Realty & Consultancy
                </h1>
              </div>
            </div>

            {/* CENTER - Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-200"
                />
                {searchOpen && searchQuery && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
                    <div className="p-4">
                      <p className="text-gray-500 text-sm">No results found for "{searchQuery}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE - Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm">{user?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-gray-600 text-sm">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">Profile</button>
                      <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">Settings</button>
                      <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">Help</button>
                    </div>
                    <div className="border-t border-gray-200 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED NAVIGATION */}
        <nav className="hidden md:flex bg-[#6A0D25]/50 backdrop-blur-sm text-sm px-6 justify-center">
          {/* Dashboard */}
          <div
            className={`group relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200 ${
              "Dashboard" === "Dashboard" ? "bg-[#5E0C20]/50" : ""
            }`}
          >
            <span className="relative z-10">Dashboard</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>

          {/* Admin Dropdown */}
          <div
            className="relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 transition-all duration-200"
            onMouseEnter={() => setAdminDropdownOpen(true)}
            onMouseLeave={() => setAdminDropdownOpen(false)}
          >
            <span className="relative z-10 flex items-center gap-1">
              Admin
              <ChevronDown className="w-3 h-3" />
            </span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
            
            {adminDropdownOpen && (
              <div className="absolute top-full left-0 mt-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] z-50">
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm">Employee</button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm">Forms</button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm">Directory</button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm">Attendance</button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm">Management</button>
                </div>
              </div>
            )}
          </div>

          {/* Accountant Dropdown */}
          <div
            className="relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 transition-all duration-200"
            onMouseEnter={() => setAccountantDropdownOpen(true)}
            onMouseLeave={() => setAccountantDropdownOpen(false)}
          >
            <span className="relative z-10 flex items-center gap-1">
              Accountant
              <ChevronDown className="w-3 h-3" />
            </span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
            
            {accountantDropdownOpen && (
              <div className="absolute top-full left-0 mt-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] z-50">
                <div className="py-2">
                  <button 
                    onClick={goToAccountants}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    SCB Banks
                  </button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm">Management</button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div
            className="group relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200"
          >
            <span className="relative z-10">Activity Log</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>

          {/* Reports */}
          <div
            className="group relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200"
          >
            <span className="relative z-10">Reports</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>

          {/* Support */}
          <div
            className="group relative px-6 py-4 hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200"
          >
            <span className="relative z-10">Support</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#6A0D25]/95 backdrop-blur-sm">
            <div className="px-6 py-4 space-y-2">
              {/* Dashboard */}
              <div
                className={`px-4 py-2 rounded-lg hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200 ${
                  "Dashboard" === "Dashboard" ? "bg-[#5E0C20]/50" : ""
                }`}
              >
                Dashboard
              </div>

              {/* Admin Mobile Submenu */}
              <div>
                <div className="px-4 py-2 font-medium text-white/80">Admin</div>
                <div className="ml-4 space-y-1">
                  <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm">Employee</button>
                  <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm">Forms</button>
                  <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm">Directory</button>
                  <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm">Attendance</button>
                  <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm">Management</button>
                </div>
              </div>

              {/* Accountant Mobile Submenu */}
              <div>
                <div className="px-4 py-2 font-medium text-white/80">Accountant</div>
                <div className="ml-4 space-y-1">
                  <button 
                    onClick={() => {
                      goToAccountants()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm"
                  >
                    SCB Banks
                  </button>
                  <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm">Management</button>
                </div>
              </div>

              {/* Other Items */}
              <div className="px-4 py-2 rounded-lg hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200">Activity Log</div>
              <div className="px-4 py-2 rounded-lg hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200">Reports</div>
              <div className="px-4 py-2 rounded-lg hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200">Support</div>
            </div>
          </div>
        )}
      </header>

      {/* CONTENT */}
      <div className="flex-1 p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <AdminDashboardSkeleton />
        ) : (
          <>
            {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#7B0F2B] mb-2">Dashboard Overview</h2>
            <p className="text-gray-600">Welcome back, {user?.name}! Here's what's happening with your system today.</p>
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
              <CardTitle className="text-sm font-medium text-gray-600">Total Accountants</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#7B0F2B]">24</div>
              <p className="text-xs text-gray-500 mt-1">+2 from last month</p>
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
              <div className="text-2xl font-bold text-green-600">18</div>
              <p className="text-xs text-gray-500 mt-1">75% of total users</p>
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
              <div className="text-2xl font-bold text-yellow-600">7</div>
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
              <div className="text-2xl font-bold text-green-600">98%</div>
              <p className="text-xs text-gray-500 mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* CHARTS AND ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* USER ACTIVITY CHART */}
          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7B0F2B]">User Activity</CardTitle>
              <p className="text-sm text-gray-600">Daily login activity for the last 7 days</p>
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
              <p className="text-sm text-gray-600">Latest system activities</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { icon: <User className="w-4 h-4" />, title: "New accountant added", desc: "John Doe was added to the system", time: "2 hours ago", color: "blue" },
                  { icon: <Eye className="w-4 h-4" />, title: "Report viewed", desc: "Monthly report was accessed", time: "4 hours ago", color: "green" },
                  { icon: <Mail className="w-4 h-4" />, title: "Credentials sent", desc: "Password reset email sent", time: "6 hours ago", color: "yellow" },
                  { icon: <Download className="w-4 h-4" />, title: "Data exported", desc: "Accountant data exported", time: "1 day ago", color: "purple" },
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
            <p className="text-sm text-gray-600">Common tasks and shortcuts</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={goToAccountants}
                className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl hover:from-[#5E0C20] hover:to-[#7C102E]"
              >
                <User className="w-6 h-6" />
                <span className="text-sm">Manage Accountants</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl">
                <Plus className="w-6 h-6" />
                <span className="text-sm">Add User</span>
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
                <div className="text-3xl font-bold text-blue-600 mb-2">45ms</div>
                <p className="text-sm text-gray-600">Response Time</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">2.1GB</div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs">
          <p className="tracking-wide">
            © 2026 ABIC Realty & Consultancy Corporation
          </p>

          <p className="opacity-80">
            All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <>
      {/* Dashboard Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded-md w-64"></div>
          <div className="h-4 bg-gray-200 rounded-md w-96"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl shadow-lg border-none bg-white p-6 animate-pulse">
            <div className="flex flex-row items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded-md w-32"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-md w-16"></div>
              <div className="h-3 bg-gray-200 rounded-md w-40"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Analytics Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart Skeleton */}
        <div className="rounded-2xl shadow-lg border-none bg-white p-6 animate-pulse">
          <div className="space-y-4 mb-6">
            <div className="h-6 bg-gray-200 rounded-md w-40"></div>
            <div className="h-4 bg-gray-200 rounded-md w-64"></div>
          </div>
          <div className="h-64 bg-gray-100 rounded-md"></div>
        </div>

        {/* Recent Activities Skeleton */}
        <div className="rounded-2xl shadow-lg border-none bg-white p-6 animate-pulse">
          <div className="space-y-4 mb-6">
            <div className="h-6 bg-gray-200 rounded-md w-40"></div>
            <div className="h-4 bg-gray-200 rounded-md w-48"></div>
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="rounded-2xl shadow-lg border-none bg-white p-6 animate-pulse">
        <div className="space-y-4 mb-6">
          <div className="h-6 bg-gray-200 rounded-md w-32"></div>
          <div className="h-4 bg-gray-200 rounded-md w-48"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>

      {/* System Status Skeleton */}
      <div className="rounded-2xl shadow-lg border-none bg-white p-6 animate-pulse">
        <div className="space-y-4 mb-6">
          <div className="h-6 bg-gray-200 rounded-md w-36"></div>
          <div className="h-4 bg-gray-200 rounded-md w-56"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 bg-gray-200 rounded-md w-20 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded-md w-24 mx-auto"></div>
              <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
