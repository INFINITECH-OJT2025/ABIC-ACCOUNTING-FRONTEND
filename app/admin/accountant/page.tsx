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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Menu,
  User,
  Search,
  RefreshCcw,
  Download,
  Printer,
  Eye,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Mail,
  Lock,
  Ban,
  CheckCircle,
  Bell,
  ChevronDown,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Accountant = {
  id: number;
  name: string;
  email: string;
  role: string;
  account_status: 'active' | 'suspended' | 'expired' | 'pending';
  password_expires_at?: string;
  last_password_change?: string;
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: Accountant | Accountant[] | { email_sent: boolean; password_updated?: boolean };
  errors?: Record<string, string[]>;
};

export default function AccountantPage() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Accountant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sendNewPassword, setSendNewPassword] = useState(false);
  const [editing, setEditing] = useState<Accountant | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState<Accountant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const [accountantDropdownOpen, setAccountantDropdownOpen] = useState(false)

  const rowsPerPage = 15

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const load = async () => {
    try {
      const res = await fetch("/api/accountant");
      const json: ApiResponse = await res.json();
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError("Failed to load accountants");
    }
  };

  useEffect(() => {
    // Fetch user info
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        }
      } catch (err) {
        console.error('Failed to fetch user')
      }
    }

    fetchMe()
    load()
  }, [])

  // Filter accountants based on search
  const filteredAccountants = items.filter(accountant =>
    accountant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accountant.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredAccountants.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = filteredAccountants.slice(startIndex, endIndex)

  const create = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/accountant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Accountant created successfully");
        setName("");
        setEmail("");
        setShowCreateModal(false);
        load();
      } else {
        setError(data.message || "Failed to create accountant");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const update = async () => {
    if (!editing) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const body: any = { name, email };
      if (password) {
        body.password = password;
        body.send_new_password = sendNewPassword;
      }

      const res = await fetch(`/api/accountant/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Accountant updated successfully");
        setEditing(null);
        setName("");
        setEmail("");
        setPassword("");
        setSendNewPassword(false);
        setShowEditModal(false);
        load();
      } else {
        setError(data.message || "Failed to update accountant");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Are you sure you want to delete this accountant?")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/accountant/${id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Accountant deleted successfully");
        load();
      } else {
        setError(data.message || "Failed to delete accountant");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const resendCredentials = async (id: number) => {
    if (!confirm("This will generate a new password and send it to the accountant's email. Continue?")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/accountant/${id}/resend-credentials`, {
        method: "POST",
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Credentials sent successfully");
        load();
      } else {
        setError(data.message || "Failed to resend credentials");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const suspendAccount = async (accountant: Accountant) => {
    if (!suspendReason.trim()) {
      setError("Please provide a reason for suspension");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/accountant/${accountant.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason }),
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Account suspended successfully");
        setShowSuspendDialog(null);
        setSuspendReason("");
        load();
      } else {
        setError(data.message || "Failed to suspend accountant");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const unsuspendAccount = async (id: number) => {
    if (!confirm("Are you sure you want to unsuspend this accountant?")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/accountant/${id}/unsuspend`, {
        method: "POST",
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Account unsuspended successfully");
        load();
      } else {
        setError(data.message || "Failed to unsuspend accountant");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

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

  const startEdit = (a: Accountant) => {
    setEditing(a);
    setName(a.name);
    setEmail(a.email);
    setPassword("");
    setSendNewPassword(false);
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setSendNewPassword(false);
    setShowEditModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#059669';
      case 'suspended': return '#dc2626';
      case 'expired': return '#d97706';
      case 'pending': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
      case 'suspended': return 'linear-gradient(135deg, #fee2e2, #fecaca)';
      case 'expired': return 'linear-gradient(135deg, #fed7aa, #fdba74)';
      case 'pending': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      default: return 'linear-gradient(135deg, #f3f4f6, #e5e7eb)';
    }
  };

  const formatExpirationTime = (expiresAt: string) => {
    const exp = new Date(expiresAt);
    const now = new Date();
    const diff = exp.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

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
            onClick={() => router.push('/admin')}
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
            className={`relative px-6 py-4 border-r border-[#8E1B3E]/30 hover:bg-[#5E0C20]/50 transition-all duration-200 ${
              "Accountant" === "Accountant" ? "bg-[#5E0C20]/50" : ""
            }`}
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
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors text-sm">SCB Banks</button>
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
                onClick={() => {
                  router.push('/admin')
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
                  <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-[#5E0C20]/50 rounded transition-colors text-sm">SCB Banks</button>
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
        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-[#7B0F2B]">
                Total Accountants
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-[#7B0F2B]">
              {items.length}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-[#7B0F2B]">
                Active Accountants
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-green-600">
              {items.filter(a => a.account_status === 'active').length}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-[#7B0F2B]">
                Suspended Accountants
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-red-600">
              {items.filter(a => a.account_status === 'suspended').length}
            </CardContent>
          </Card>
        </div>

        {/* SEARCH + ACTION BAR */}
        <Card className="rounded-2xl shadow-md border-none">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 pt-8">
            {/* SEARCH */}
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search name, email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 flex-wrap justify-start md:justify-end">
              <Button
                variant="outline"
                className="rounded-xl hover:bg-gray-200 transition"
                onClick={load}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white rounded-xl hover:from-[#5E0C20] hover:to-[#7C102E] transition"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Accountant
              </Button>
            </div>
          </CardContent>

          {/* TABLE */}
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[800px] md:min-w-full">
              <TableHeader className="bg-[#F3E8EB]">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Password Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentRows.map((accountant) => (
                  <TableRow
                    key={accountant.id}
                    className="hover:bg-[#F9ECEF] transition"
                  >
                    <TableCell className="font-medium">{accountant.name}</TableCell>
                    <TableCell>{accountant.email}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`} style={{
                        background: getStatusBg(accountant.account_status),
                        color: getStatusColor(accountant.account_status)
                      }}>
                        {accountant.account_status}
                      </div>
                    </TableCell>
                    <TableCell>
                      {accountant.password_expires_at ? formatExpirationTime(accountant.password_expires_at) : 'Never'}
                    </TableCell>
                    <TableCell>
                      {new Date(accountant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(accountant)}
                          className="rounded-lg"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendCredentials(accountant.id)}
                          disabled={loading}
                          className="rounded-lg"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        {accountant.account_status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unsuspendAccount(accountant.id)}
                            disabled={loading}
                            className="rounded-lg text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowSuspendDialog(accountant)}
                            disabled={loading}
                            className="rounded-lg text-red-600 hover:text-red-700"
                          >
                            <Ban className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => remove(accountant.id)}
                          disabled={loading}
                          className="rounded-lg text-gray-600 hover:text-gray-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* PAGINATION */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-600 mt-3 px-4 py-2">
              {/* LEFT */}
              <p className="text-center md:text-left">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, filteredAccountants.length)}
                </span>{" "}
                of <span className="font-medium">{filteredAccountants.length}</span> accountants
              </p>

              {/* RIGHT */}
              <div className="flex flex-wrap justify-center md:justify-end items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1
                  const isActive = currentPage === page

                  return (
                    <Button
                      key={page}
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-xl ${
                        isActive
                          ? "bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white"
                          : ""
                      }`}
                    >
                      {page}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Create Accountant Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Accountant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700">
                Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="name"
                  placeholder="Enter accountant name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-10 pl-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20 disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-10 pl-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setName("")
                setEmail("")
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={create}
              disabled={loading}
              className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] hover:from-[#5E0C20] hover:to-[#7C102E]"
            >
              {loading ? 'Creating...' : 'Create Accountant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Accountant Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Accountant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium mb-1 text-gray-700">
                Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="edit-name"
                  placeholder="Enter accountant name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-10 pl-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20 disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium mb-1 text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-10 pl-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20 disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-password" className="block text-sm font-medium mb-1 text-gray-700">
                New Password (optional)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Leave empty to keep current"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-10 pl-10 rounded-lg border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendPassword"
                checked={sendNewPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendNewPassword(e.target.checked)}
                disabled={loading}
                className="rounded"
              />
              <Label htmlFor="sendPassword" className="text-sm">
                Email new password
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelEdit}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={update}
              disabled={loading}
              className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] hover:from-[#5E0C20] hover:to-[#7C102E]"
            >
              {loading ? 'Updating...' : 'Update Accountant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Accountant Modal */}
      <Dialog open={!!showSuspendDialog} onOpenChange={() => setShowSuspendDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Suspend Accountant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to suspend <strong>{showSuspendDialog?.name}</strong> ({showSuspendDialog?.email})?
            </p>
            <div className="grid gap-2">
              <Label htmlFor="suspend-reason">Reason for suspension</Label>
              <textarea
                id="suspend-reason"
                placeholder="Enter the reason for suspension..."
                value={suspendReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSuspendReason(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded-md resize-none"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(null)
                setSuspendReason("")
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => showSuspendDialog && suspendAccount(showSuspendDialog)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Suspending...' : 'Suspend Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
