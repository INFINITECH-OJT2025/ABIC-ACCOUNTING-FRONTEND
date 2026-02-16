"use client"


import React, { useState } from 'react'
import Image from 'next/image'
import {
  ChevronDown,
  Menu,
  User,
  FileText,
  BookOpen,
  Calendar,
  Users,
  UserPlus,
  UserMinus,
  CheckSquare,
  ClipboardCheck,
  FilePlus,
  LogOut,
  Clock,
  CalendarDays,
  AlertCircle,
  X,
  PanelLeft,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'


export default function AdminHeadSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isFormsOpen, setIsFormsOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)



  const toggleSidebar = () => setIsCollapsed(!isCollapsed)


  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-[#4A081A] via-[#630C22] to-[#7B0F2B] text-white min-h-screen p-4 flex flex-col shadow-2xl transition-all duration-300 ease-in-out relative`}>

      <button
        onClick={toggleSidebar}
        className={cn(
          "mb-4 p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center",
          !isCollapsed && "absolute top-4 right-4 z-50"
        )}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <PanelLeft size={24} /> : <X size={24} />}
      </button>




      {/* Profile Summary (Only shown when collapsed or condensed) */}
      <div className={`mb-6 flex flex-col items-center ${isCollapsed ? 'px-0 mt-2' : 'px-4 mt-8'}`}>
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 shadow-lg ring-2 ring-white/20 backdrop-blur-sm">
          <User size={24} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="text-center overflow-hidden transition-all duration-300">
            <p className="text-sm font-bold truncate">Admin Head</p>
            <p className="text-[10px] text-white/60 truncate uppercase tracking-wider">adminhead@gmail.com</p>
          </div>
        )}
      </div>

<Link
          href="/admin-head"
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
        >
          <Activity size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium whitespace-nowrap">ACTIVITY LOGS</span>}
        </Link>
      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-2">
        {/* EMPLOYEE with Dropdown */}
        <div className="group relative" onMouseEnter={() => setIsEmployeeOpen(true)} onMouseLeave={() => setIsEmployeeOpen(false)}>
          <button
            onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
          >
            <div className="flex items-center gap-3">
              <Users size={20} className="shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">EMPLOYEE</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform shrink-0 ${isEmployeeOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
              />
            )}
          </button>


          {/* Employee Dropdown Menu (hover OR click) */}
          <div className={`${isCollapsed ? 'fixed left-20 top-auto ml-1 w-48 z-50' : 'ml-9 mt-1'} space-y-1 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md transition-all duration-200 ${isEmployeeOpen ? 'block' : 'hidden'} group-hover:block`}>
            <Link
              href="/admin-head/employee/masterfile"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <BookOpen size={14} />
              <span>Masterfile</span>
            </Link>
            <Link
              href="/admin-head/employee/onboard"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <UserPlus size={14} />
              <span>Onboard Employee</span>
            </Link>
            <Link
              href="/admin-head/employee/terminate"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <UserMinus size={14} />
              <span>Terminate Employee</span>
            </Link>
            <Link
              href="/admin-head/employee/evaluation"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <CheckSquare size={14} />
              <span>Evaluation</span>
            </Link>
          </div>
        </div>


        {/* FORMS with Dropdown */}
        <div className="group relative" onMouseEnter={() => setIsFormsOpen(true)} onMouseLeave={() => setIsFormsOpen(false)}>
          <button
            onClick={() => setIsFormsOpen(!isFormsOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} className="shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">FORMS</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform shrink-0 ${isFormsOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
              />
            )}
          </button>


          {/* Forms Dropdown Menu (hover OR click) */}
          <div className={`${isCollapsed ? 'fixed left-20 top-auto ml-1 w-48 z-50' : 'ml-9 mt-1'} space-y-1 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md transition-all duration-200 ${isFormsOpen ? 'block' : 'hidden'} group-hover:block`}>
            <Link
              href="/admin-head/forms/clearance"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <ClipboardCheck size={14} />
              <span>Clearance</span>
            </Link>
            <Link
              href="/admin-head/forms/onboarding"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <FilePlus size={14} />
              <span>Onboarding</span>
            </Link>
          </div>
        </div>


        {/* DIRECTORY */}
        <Link
          href="/admin-head/directory"
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
        >
          <BookOpen size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium whitespace-nowrap">DIRECTORY</span>}
        </Link>


        {/* UPDATE PROFILE */}
        <Link
          href="/admin-head/update-profile"
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
        >
          <User size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium whitespace-nowrap">UPDATE PROFILE</span>}
        </Link>


        {/* ACTIVITY LOGS */}
        


        {/* ATTENDANCE with Dropdown */}
        <div className="group relative" onMouseEnter={() => setIsAttendanceOpen(true)} onMouseLeave={() => setIsAttendanceOpen(false)}>
          <button
            onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
          >
            <div className="flex items-center gap-3">
              <Calendar size={20} className="shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">ATTENDANCE</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform shrink-0 ${isAttendanceOpen ? 'rotate-180' : ''} group-hover:rotate-180`}
              />
            )}
          </button>


          {/* Attendance Dropdown Menu (hover OR click) */}
          <div className={`${isCollapsed ? 'fixed left-20 top-auto ml-1 w-48 z-50' : 'ml-9 mt-1'} space-y-1 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md transition-all duration-200 ${isAttendanceOpen ? 'block' : 'hidden'} group-hover:block`}>
            <Link
              href="/admin-head/attendance/leave"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <LogOut size={14} />
              <span>Leave</span>
            </Link>
            <Link
              href="/admin-head/attendance/leave-credits"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <CalendarDays size={14} />
              <span>Leave Credits</span>
            </Link>
            <Link
              href="/admin-head/attendance/tardiness"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
            >
              <Clock size={14} />
              <span>Tardiness</span>
            </Link>
          </div>
        </div>
      </nav>


      {/* Logout Button (Optional but useful) */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <Link
          href="/logout"
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm text-red-200 hover:text-white group"
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
        </Link>
      </div>
    </div>
  )
}



