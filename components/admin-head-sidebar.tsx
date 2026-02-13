"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function AdminHeadSidebar() {
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isFormsOpen, setIsFormsOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  return (
    <div className="w-64 bg-gradient-to-b from-red-900 via-red-950 to-red-950 text-white min-h-screen p-4 flex flex-col shadow-2xl">
      {/* Logo/Title */}
      <div className="mb-3 pb-1 border-b border-red-800/20 flex items-start justify-center">
        <div className="w-32 h-32 flex items-center justify-center overflow-hidden">
          {!logoError ? (
            <Image
              src="/logo.webp"
              alt="ABIC Logo"
              width={128}
              height={128}
              className="object-contain block"
              priority
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-extrabold text-red-100">AB</div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        {/* EMPLOYEE with Dropdown */}
        <div className="group" onMouseEnter={() => setIsEmployeeOpen(true)} onMouseLeave={() => setIsEmployeeOpen(false)}>
          <button
            onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-red-800/40 transition-all duration-200 font-semibold text-sm"
          >
            <span className="font-medium">EMPLOYEE</span>
            <ChevronDown
              size={18}
              className={`transition-transform ${isEmployeeOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
            />
          </button>

          {/* Employee Dropdown Menu (hover OR click) */}
          <div className={`ml-4 mt-2 space-y-1 bg-red-950/60 rounded-lg p-3 border border-red-800/30 backdrop-blur-sm ${isEmployeeOpen ? 'block' : 'hidden'} group-hover:block`}>
            <Link
              href="/admin-head/employee/masterfile"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Masterfile
            </Link>
            <Link
              href="/admin-head/employee/onboard"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Onboard Employee
            </Link>
            <Link
              href="/admin-head/employee/terminate"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Terminate Employee
            </Link>
            <Link
              href="/admin-head/employee/evaluation"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Evaluation
            </Link>
          </div>
        </div>

        {/* FORMS with Dropdown */}
        <div className="group" onMouseEnter={() => setIsFormsOpen(true)} onMouseLeave={() => setIsFormsOpen(false)}>
          <button
            onClick={() => setIsFormsOpen(!isFormsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-red-800/40 transition-all duration-200 font-semibold text-sm"
          >
            <span className="font-medium">FORMS</span>
            <ChevronDown
              size={18}
              className={`transition-transform ${isFormsOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
            />
          </button>

          {/* Forms Dropdown Menu (hover OR click) */}
          <div className={`ml-4 mt-2 space-y-1 bg-red-950/60 rounded-lg p-3 border border-red-800/30 backdrop-blur-sm ${isFormsOpen ? 'block' : 'hidden'} group-hover:block`}>
            <Link
              href="/admin-head/forms/clearance"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Clearance
            </Link>
            <Link
              href="/admin-head/forms/onboarding"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Onboarding
            </Link>
          </div>
        </div>

        {/* DIRECTORY */}
        <Link
          href="/admin-head/directory"
          className="block px-4 py-3 rounded-lg hover:bg-red-800/40 transition-all duration-200 font-semibold text-sm"
        >
          DIRECTORY
        </Link>

        {/* ATTENDANCE with Dropdown */}
        <div className="group" onMouseEnter={() => setIsAttendanceOpen(true)} onMouseLeave={() => setIsAttendanceOpen(false)}>
          <button
            onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-red-800/40 transition-all duration-200 font-semibold text-sm"
          >
            <span className="font-medium">ATTENDANCE</span>
            <ChevronDown
              size={18}
              className={`transition-transform ${isAttendanceOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
            />
          </button>

          {/* Attendance Dropdown Menu (hover OR click) */}
          <div className={`ml-4 mt-2 space-y-1 bg-red-950/60 rounded-lg p-3 border border-red-800/30 backdrop-blur-sm ${isAttendanceOpen ? 'block' : 'hidden'} group-hover:block`}>
            <Link
              href="/admin-head/attendance/leave"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Leave
            </Link>
            <Link
              href="/admin-head/attendance/leave-credits"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Leave Credits
            </Link>
            <Link
              href="/admin-head/attendance/tardiness"
              className="block px-4 py-2 rounded-md hover:bg-red-800/50 transition-all duration-150 text-sm font-medium text-red-50 hover:text-white"
            >
              Tardiness
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
