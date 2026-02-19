import React from 'react'
import AdminHeadSidebar from '@/components/admin-head-sidebar'

export default function AdminHeadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <AdminHeadSidebar />
      <main className="relative z-0 flex-1 bg-slate-50 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
