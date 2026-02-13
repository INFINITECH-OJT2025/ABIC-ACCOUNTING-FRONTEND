"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function EvaluationPage() {
  return (
    <div className="min-h-screen">
      {/* Maroon Gradient Header */}
      <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-3">Employee Evaluation</h1>
        <p className="text-rose-100 text-lg">Manage employee evaluations and performance reviews</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Reviews Card */}
        <Card className="border-2 border-[#FFE5EC] hover:border-[#C9184A] transition-all duration-300 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
            <CardTitle className="text-[#800020] flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Performance Reviews
            </CardTitle>
            <CardDescription>Conduct and manage employee performance evaluations</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-600 mb-4">
              Schedule and conduct comprehensive performance reviews for your team members.
            </p>
            <Button className="w-full bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300">
              Start New Review
            </Button>
          </CardContent>
        </Card>

        {/* Goal Setting Card */}
        <Card className="border-2 border-[#FFE5EC] hover:border-[#C9184A] transition-all duration-300 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
            <CardTitle className="text-[#800020] flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Goal Setting
            </CardTitle>
            <CardDescription>Set and track employee goals and objectives</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-600 mb-4">
              Define clear objectives and track progress towards achieving team goals.
            </p>
            <Button className="w-full bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300">
              Manage Goals
            </Button>
          </CardContent>
        </Card>

        {/* Feedback & Comments Card */}
        <Card className="border-2 border-[#FFE5EC] hover:border-[#C9184A] transition-all duration-300 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
            <CardTitle className="text-[#800020] flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Feedback & Comments
            </CardTitle>
            <CardDescription>Provide continuous feedback to employees</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-600 mb-4">
              Share constructive feedback and recognition with your team members.
            </p>
            <Button className="w-full bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300">
              Give Feedback
            </Button>
          </CardContent>
        </Card>

        {/* Reports & Analytics Card */}
        <Card className="border-2 border-[#FFE5EC] hover:border-[#C9184A] transition-all duration-300 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
            <CardTitle className="text-[#800020] flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reports & Analytics
            </CardTitle>
            <CardDescription>View performance metrics and insights</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-600 mb-4">
              Access detailed reports and analytics on team performance trends.
            </p>
            <Button className="w-full bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white transition-all duration-300">
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Evaluations Section */}
      <div className="mt-8">
        <Card className="border-2 border-[#FFE5EC]">
          <CardHeader className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
            <CardTitle className="text-[#800020]">Recent Evaluations</CardTitle>
            <CardDescription>Latest performance reviews and assessments</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFE5EC] mb-4">
                <svg className="w-8 h-8 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 text-lg">No evaluations yet</p>
              <p className="text-slate-400 text-sm mt-2">Start by creating a new performance review</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
