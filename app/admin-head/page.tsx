"use client"

import React from 'react'

export default function AdminHeadPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-900 mb-4">Admin Head Dashboard</h1>
      <p className="text-slate-600 text-lg">
        Welcome to the Admin Head portal. Use the sidebar to navigate through different sections.
      </p>
      
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">EMPLOYEE</h2>
          <p className="text-slate-600">Manage employee data, onboarding, termination, and evaluations</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">FORMS</h2>
          <p className="text-slate-600">Access and manage various forms</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">DIRECTORY</h2>
          <p className="text-slate-600">View employee directory and contacts</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">ATTENDANCE</h2>
          <p className="text-slate-600">Track and manage employee attendance records</p>
        </div>
      </div>
    </div>
  )
}
