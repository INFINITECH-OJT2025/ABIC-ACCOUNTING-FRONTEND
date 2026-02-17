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
import Link from "next/link"
import {
  Menu,
  User,
  Search,
  RefreshCcw,
  Download,
  Eye,
  MoreVertical,
  ChevronDown,
  X,
  Plus,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  Settings,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Accountant {
  id: number
  name: string
  email: string
  account_status?: string
  created_at?: string
}

export default function SuperAdminAccountantPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [accountants, setAccountants] = useState<Accountant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const rowsPerPage = 15

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/accountant')
        const data = await res.json()
        if (res.ok && data.success) {
          setAccountants(Array.isArray(data.data) ? data.data : [])
        } else {
          setError(data.message || 'Failed to load accountants')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'suspended':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredAccountants = (accountants || []).filter(accountant =>
    accountant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accountant.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredAccountants.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = filteredAccountants.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#7B0F2B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accountants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">

      {/* CONTENT - Constrained Width */}
      <div className="flex-1 p-6 space-y-6">
        <div className="max-w-7xl mx-auto w-full">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#7B0F2B] mb-2">Accountant Management</h2>
              <p className="text-gray-600">Manage system accountant accounts and permissions</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button asChild className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white rounded-xl hover:from-[#5E0C20] hover:to-[#7C102E]">
                <Link href="/super/accountant/management">
                  <Settings className="w-4 h-4 mr-2" />
                  Accountant Management
                </Link>
              </Button>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="rounded-2xl shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Accountants</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">{accountants?.length ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1">Registered accountants</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Today</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(accountants || []).filter(a => a.account_status === 'active').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Currently active</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {(accountants || []).filter(a => a.account_status === 'pending').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          {/* ACCOUNTANTS TABLE */}
          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7B0F2B]">Accountants</CardTitle>
              <p className="text-sm text-gray-600">List of all accountant accounts</p>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search accountants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#F3E8EB]">
                    <TableRow>
                      <TableHead className="text-[#7B0F2B]">Name</TableHead>
                      <TableHead className="text-[#7B0F2B]">Email</TableHead>
                      <TableHead className="text-[#7B0F2B]">Status</TableHead>
                      <TableHead className="text-[#7B0F2B]">Last Login</TableHead>
                      <TableHead className="text-[#7B0F2B]">Created</TableHead>
                      <TableHead className="text-center text-[#7B0F2B]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRows.map((accountant) => (
                      <TableRow key={accountant.id} className="hover:bg-[#F9ECEF] transition-colors">
                        <TableCell className="font-medium">{accountant.name}</TableCell>
                        <TableCell>{accountant.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(accountant.account_status || '')}`}>
                            {accountant.account_status || '—'}
                          </span>
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{accountant.created_at ? new Date(accountant.created_at).toLocaleDateString() : '—'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-lg hover:bg-gray-100"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-lg hover:bg-gray-100"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-lg hover:bg-gray-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-600 mt-6">
                  <p className="text-center md:text-left">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(endIndex, filteredAccountants.length)}</span>{" "}
                    of <span className="font-medium">{filteredAccountants.length}</span> accountants
                  </p>

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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
