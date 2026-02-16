"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronLeft, User, PanelLeft, LogOut, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarNavItem {
  label: string
  href?: string
  icon: LucideIcon
  children?: {
    label: string
    href: string
    icon: LucideIcon
  }[]
}

export interface SidebarProps {
  user?: {
    name: string
    email: string
  } | null
  title?: string
  items: SidebarNavItem[]
  logoutHref?: string
  onLogout?: () => void
  showProfile?: boolean
}

export default function Sidebar({ user, title = 'Admin', items, logoutHref = '/login', onLogout, showProfile = true }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  const toggleDropdown = (key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else if (logoutHref) {
      window.location.href = logoutHref
    }
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-b from-[#4A081A] via-[#630C22] to-[#7B0F2B] text-white min-h-screen p-4 flex flex-col shadow-2xl transition-all duration-300 ease-in-out relative',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'mb-4 p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center',
          !isCollapsed && 'absolute top-4 right-4 z-50'
        )}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <PanelLeft size={24} /> : <ChevronLeft size={24} />}
      </button>

      {/* Profile Summary */}
      {showProfile && (
        <div className={cn('mb-6 flex flex-col items-center', isCollapsed ? 'px-0 mt-2' : 'px-4 mt-8')}>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 shadow-lg ring-2 ring-white/20 backdrop-blur-sm">
            <User size={24} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="text-center overflow-hidden transition-all duration-300">
              <p className="text-sm font-bold truncate">{user?.name || title}</p>
              <p className="text-[10px] text-white/60 truncate uppercase tracking-wider">
                {user?.email || ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Menu */}
      <nav className={cn('flex-1 space-y-2 overflow-y-auto py-2', !showProfile && !isCollapsed && 'pt-14')}>
        {items.map((item) => {
          const key = item.label.toLowerCase().replace(/\s+/g, '-')
          const isOpen = openKeys[key] ?? false

          if (item.children && item.children.length > 0) {
            return (
              <div
                key={key}
                className="group relative"
                onMouseEnter={() => setOpenKeys((prev) => ({ ...prev, [key]: true }))}
                onMouseLeave={() => setOpenKeys((prev) => ({ ...prev, [key]: false }))}
              >
                <button
                  onClick={() => toggleDropdown(key)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="shrink-0" />
                    {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      size={16}
                      className={cn('transition-transform shrink-0', isOpen && 'rotate-180')}
                    />
                  )}
                </button>

                <div
                  className={cn(
                    'space-y-1 bg-[#7B0F2B]/95 rounded-lg p-2 border border-white/10 backdrop-blur-md transition-all duration-200 min-w-[12rem]',
                    isCollapsed ? 'absolute left-full top-0 ml-1 z-50' : 'ml-9 mt-1',
                    isOpen ? 'block' : 'hidden'
                  )}
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all duration-150 text-xs font-medium text-red-50 hover:text-white"
                    >
                      <child.icon size={14} />
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <Link
              key={key}
              href={item.href || '#'}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm group"
            >
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-white/10">
        {onLogout ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm text-red-200 hover:text-white group"
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        ) : (
          <Link
            href={logoutHref}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 font-semibold text-sm text-red-200 hover:text-white group"
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
          </Link>
        )}
      </div>
    </div>
  )
}
