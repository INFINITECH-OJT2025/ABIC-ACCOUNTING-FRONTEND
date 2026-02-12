"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function AdminHeadSidebar() {
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false)

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-6">
      {/* Logo/Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">ABIC</h1>
        <p className="text-sm text-slate-400">Admin Head</p>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        {/* EMPLOYEE with Dropdown */}
        <div>
          <button
            onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span className="font-medium">EMPLOYEE</span>
            <ChevronDown
              size={18}
              className={`transition-transform ${
                isEmployeeOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Employee Dropdown Menu */}
          {isEmployeeOpen && (
            <div className="ml-4 mt-2 space-y-2 bg-slate-800 rounded-lg p-2">
              <Link
                href="/admin-head/employee/masterfile"
                className="block px-4 py-2 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                Masterfile
              </Link>
              <Link
                href="/admin-head/employee/onboard"
                className="block px-4 py-2 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                Onboard Employee
              </Link>
              <Link
                href="/admin-head/employee/terminate"
                className="block px-4 py-2 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                Terminate Employee
              </Link>
              <Link
                href="/admin-head/employee/evaluation"
                className="block px-4 py-2 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                Evaluation
              </Link>
            </div>
          )}
        </div>

        {/* FORMS */}
        <Link
          href="/admin-head/forms"
          className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium"
        >
          FORMS
        </Link>

        {/* DIRECTORY */}
        <Link
          href="/admin-head/directory"
          className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium"
        >
          DIRECTORY
        </Link>

        {/* ATTENDANCE */}
        <Link
          href="/admin-head/attendance"
          className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium"
        >
          ATTENDANCE
        </Link>
      </nav>
    </div>
  )
}
