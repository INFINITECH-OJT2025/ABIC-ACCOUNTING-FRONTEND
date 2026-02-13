  "use client"

  import {
    Menu,
    User,
    Search,
    ChevronDown,
    X,
  } from "lucide-react"
  import { useState, useEffect } from "react"
  import { useRouter } from "next/navigation"

  interface SuperAdminHeaderProps {
    user: any | null
    onLogout: () => void
  }

  export default function SuperAdminHeader({ user, onLogout }: SuperAdminHeaderProps) {
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
    const [accountantDropdownOpen, setAccountantDropdownOpen] = useState(false)

    // Handle scroll for sticky header effect
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10)
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gradient-to-r from-[#7B0F2B]/95 to-[#A4163A]/95 backdrop-blur-lg shadow-lg' 
          : 'bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] shadow-md'
      }`}>
        <div className="px-4 sm:px-6 py-3">
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
                <img 
                  src="/images/logo/abic-logo.png" 
                  alt="ABIC Logo" 
                  className="w-50 h-auto object-contain"
                />
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
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
                        onClick={onLogout}
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
            onClick={() => router.push('/super')}
          >
            <span className="relative z-10 text-white">Dashboard</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>

          {/* Admin Dropdown */}
          <div
            className="relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 transition-all duration-200"
            onMouseEnter={() => setAdminDropdownOpen(true)}
            onMouseLeave={() => setAdminDropdownOpen(false)}
          >
            <span className="relative z-10 flex items-center gap-1 text-white">
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
            <span className="relative z-10 flex items-center gap-1 text-white">
              Accountant
              <ChevronDown className="w-3 h-3" />
            </span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
            
            {accountantDropdownOpen && (
              <div className="absolute top-full left-0 mt-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] z-50">
                <div className="py-2">
                  <button 
                    onClick={() => router.push('/super/accountant')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    SCB Banks
                  </button>
                  <button 
                    onClick={() => router.push('/super/accountant/owner-accounts')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    Owner Accounts
                  </button>
                  <button 
                    onClick={() => router.push('/super/accountant/unit-owner')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    Unit Owner
                  </button>
                  <button 
                    onClick={() => router.push('/super/accountant/account-summary')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    Account Summary
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
            <span className="relative z-10 text-white">Activity Log</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>

          {/* Reports */}
          <div
            className="group relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200"
          >
            <span className="relative z-10 text-white">Reports</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>

          {/* Support */}
          <div
            className="group relative px-6 py-4 hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200"
          >
            <span className="relative z-10 text-white">Support</span>
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
                onClick={() => {
                  router.push('/super')
                  setMobileMenuOpen(false)
                }}
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
                      router.push('/super/accountant')
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
    )
  }
