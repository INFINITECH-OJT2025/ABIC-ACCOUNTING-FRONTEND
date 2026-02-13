"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Eye,
  TrendingUp,
  PieChart,
  BarChart3,
  Download,
  FileText,
  Users,
  DollarSign
} from 'lucide-react'

export default function AccountSummary() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

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
            <h1 className="text-3xl font-bold text-[#7B0F2B]">
              Account Summary
            </h1>
            <p className="text-gray-600">
              Comprehensive overview of all accounts and financial data
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Account Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <PieChart className="w-32 h-32 text-[#7B0F2B]" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <BarChart3 className="w-32 h-32 text-[#7B0F2B]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#7B0F2B] mb-2">
                  ₱2.4M
                </div>
                <p className="text-gray-600">
                  Total balance across all accounts
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Transaction processed
                    </p>
                    <p className="text-xs text-gray-600">
                      Multiple accounts
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  1 day ago
                </span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
