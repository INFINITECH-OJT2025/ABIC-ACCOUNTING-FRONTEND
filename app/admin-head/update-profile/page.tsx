"use client"

import React from 'react'

export default function UpdateProfilePage() {
  return (
    <div className="p-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="bg-[#7B0F2B]/10 p-6 rounded-full mb-6">
          <h1 className="text-3xl font-bold text-[#7B0F2B] tracking-tight">
            WELCOME ADMIN UPDATE
          </h1>
        </div>
        <p className="text-gray-500 max-w-md">
          This is where you can update your administrative profile settings and account information.
        </p>
      </div>
    </div>
  )
}
