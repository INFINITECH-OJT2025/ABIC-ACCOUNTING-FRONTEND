"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Users, Building } from 'lucide-react'
import AccountantHeader from '@/components/layout/AccountantHeader'

export default function UnitOwner() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Accountant
          </Button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[#7B0F2B]">Unit Owner</h1>
            <p className="text-gray-600">Manage unit ownership and property details</p>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Owner Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Unit Owner Management</h3>
              <p className="text-gray-600 mb-6">This section will allow you to manage unit ownership records, property associations, and owner details for all units in the system.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Button className="h-24 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#7B0F2B] hover:bg-[#7B0F2B]/10">
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">Add New Unit</span>
                </Button>
                
                <Button className="h-24 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#7B0F2B] hover:bg-[#7B0F2B]/10">
                  <Home className="w-8 h-8" />
                  <span className="text-sm">View Properties</span>
                </Button>
                
                <Button className="h-24 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#7B0F2B] hover:bg-[#7B0F2B]/10">
                  <Users className="w-8 h-8" />
                  <span className="text-sm">Owner Directory</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
