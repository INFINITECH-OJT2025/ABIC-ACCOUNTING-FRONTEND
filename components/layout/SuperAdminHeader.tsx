  "use client"

  import {
    Menu,
    User,
    Search,
    ChevronDown,
    X,
  } from "lucide-react"
  import { useState, useEffect } from "react"
  import { useRouter, usePathname } from "next/navigation"

  interface SuperAdminHeaderProps {
    user: any | null
    onLogout: () => void
  }

  export default function SuperAdminHeader({ user, onLogout }: SuperAdminHeaderProps) {
    const router = useRouter()
    const pathname = usePathname()

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
    const [accountantDropdownOpen, setAccountantDropdownOpen] = useState(false)

    // ---------- ACTIVE HELPERS ----------
    const isSection = (href: string) =>
      pathname === href || pathname.startsWith(href + "/")

    const isExact = (href: string) => pathname === href

    // ---------- SCROLL EFFECT ----------
    useEffect(() => {
      const handleScroll = () => setIsScrolled(window.scrollY > 10)
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gradient-to-r from-[#7B0F2B]/95 to-[#A4163A]/95 backdrop-blur-lg shadow-lg' 
          : 'bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] shadow-md'
      }`}>

        {/* TOP BAR */}
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">

            {/* LEFT */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo/abic-logo.png" 
                  alt="ABIC Logo" 
                  className="w-50 h-auto object-contain"
                />
              </div>
            </div>

            {/* SEARCH */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
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

            {/* USER */}
            <div className="flex items-center gap-2 sm:gap-4">
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

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-gray-600 text-sm">{user?.email}</p>
                    </div>

                    <div className="py-2">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Profile</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Settings</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Help</button>
                    </div>

                    <div className="border-t p-2">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
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

        {/* NAV */}
        <nav className="hidden md:flex bg-[#6A0D25]/50 backdrop-blur-sm text-sm px-6 justify-center">

          {/* Dashboard — EXACT ONLY */}
          <div
            className={`group relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 cursor-pointer transition-all duration-200 ${
              isExact("/super") ? "bg-[#5E0C20]/50" : ""
            }`}
            onClick={() => router.push('/super')}
          >
            <span className="relative z-10 text-white">Dashboard</span>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          {/* Admin — SECTION */}
          <div
            className={`relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 transition-all duration-200 ${
              isSection("/super/admin") ? "bg-[#5E0C20]/50" : ""
            }`}
            onMouseEnter={() => setAdminDropdownOpen(true)}
            onMouseLeave={() => setAdminDropdownOpen(false)}
          >
            <span className="flex items-center gap-1 text-white">
              Admin <ChevronDown className="w-3 h-3" />
            </span>

            {adminDropdownOpen && (
              <Dropdown>
                <SubBtn active={isSection('/super/admin/employee')} onClick={()=>router.push('/super/admin/employee')} label="Employee"/>
                <SubBtn active={isSection('/super/admin/forms')} onClick={()=>router.push('/super/admin/forms')} label="Forms"/>
                <SubBtn active={isSection('/super/admin/directory')} onClick={()=>router.push('/super/admin/directory')} label="Directory"/>
                <SubBtn active={isSection('/super/admin/management')} onClick={()=>router.push('/super/admin/management')} label="Management"/>
              </Dropdown>
            )}
          </div>

          {/* Accountant — SECTION */}
          <div
            className={`relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 transition-all duration-200 ${
              isSection("/super/accountant") ? "bg-[#5E0C20]/50" : ""
            }`}
            onMouseEnter={() => setAccountantDropdownOpen(true)}
            onMouseLeave={() => setAccountantDropdownOpen(false)}
          >
            <span className="flex items-center gap-1 text-white">
              Accountant <ChevronDown className="w-3 h-3" />
            </span>

            {accountantDropdownOpen && (
              <Dropdown>
                <SubBtn active={isSection('/super/accountant')} onClick={()=>router.push('/super/accountant')} label="SCB Banks"/>
                <SubBtn active={isSection('/super/accountant/account-summary')} onClick={()=>router.push('/super/accountant/account-summary')} label="Account Summary"/>
              </Dropdown>
            )}
          </div>

        </nav>

        {/* MOBILE */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#6A0D25]/95 backdrop-blur-sm">
            <div className="px-6 py-4 space-y-2">
              <MobileBtn active={isExact('/super')} label="Dashboard" onClick={()=>router.push('/super')}/>
              <MobileBtn active={isSection('/super/admin/employee')} label="Employee" onClick={()=>router.push('/super/admin/employee')}/>
              <MobileBtn active={isSection('/super/admin/management')} label="Management" onClick={()=>router.push('/super/admin/management')}/>
              <MobileBtn active={isSection('/super/accountant')} label="Accountant" onClick={()=>router.push('/super/accountant')}/>
            </div>
          </div>
        )}

      </header>
    )
  }

  /* helpers */

  const Dropdown = ({children}:any)=>(
    <div className="absolute top-full left-0 bg-white rounded-lg shadow-xl border min-w-[200px] z-50 py-2">
      {children}
    </div>
  )

  const SubBtn = ({label,onClick,active}:any)=>(
    <button onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm ${
        active ? "bg-[#7B0F2B]/10 text-[#7B0F2B] font-semibold" : "hover:bg-gray-100"
      }`}
    >{label}</button>
  )

  const MobileBtn = ({label,onClick,active}:any)=>(
    <div onClick={onClick}
      className={`px-4 py-2 rounded-lg cursor-pointer ${
        active ? "bg-[#5E0C20]/50" : "hover:bg-[#5E0C20]/50"
      }`}
    >{label}</div>
  )
