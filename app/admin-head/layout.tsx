import React from 'react'
import AdminHeadSidebar from '@/components/admin-head-sidebar'

export default function AdminHeadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex">
      <AdminHeadSidebar />
      <main className="flex-1 bg-slate-50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
