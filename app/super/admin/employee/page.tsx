"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  UserPlus,
  RefreshCcw,
  Download,
  Eye,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SuperAdminHeader from "@/components/layout/SuperAdminHeader"

export default function EmployeePage() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        } else {
          router.push("/login")
        }
      } catch {
        setError("Network error")
      }
    }

    fetchMe()
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  // mock rows
  const employees = [
    { id: 1, name: "Maria Santos", email: "maria@company.com", role: "Accountant", status: "active" },
    { id: 2, name: "Juan Cruz", email: "juan@company.com", role: "Auditor", status: "active" },
    { id: 3, name: "Liza Reyes", email: "liza@company.com", role: "Staff", status: "inactive" },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <SuperAdminHeader user={user} onLogout={handleLogout} />

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ERROR */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* PAGE TITLE + ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#7B0F2B]">Employee Management</h1>
              <p className="text-sm text-gray-600">Manage employee accounts and access</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button variant="outline" className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white rounded-xl hover:from-[#5E0C20] hover:to-[#7C102E]">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-xl shadow border">
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-sm text-gray-600">Total Employees</CardTitle>
                <Users className="w-4 h-4 text-[#7B0F2B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#7B0F2B]">128</div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow border">
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-sm text-gray-600">Active</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">121</div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow border">
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-sm text-gray-600">Inactive</CardTitle>
                <XCircle className="w-4 h-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">7</div>
              </CardContent>
            </Card>
          </div>

          {/* EMPLOYEE TABLE */}
          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7B0F2B]">
                Employee List
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b text-gray-600">
                      <th className="py-3">Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#7B0F2B]/10 text-[#7B0F2B] text-xs">
                            <Shield className="w-3 h-3" />
                            {emp.role}
                          </span>
                        </td>

                        <td>
                          {emp.status === "active" ? (
                            <span className="px-2 py-1 text-xs rounded-lg bg-green-100 text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700">
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="text-right space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
