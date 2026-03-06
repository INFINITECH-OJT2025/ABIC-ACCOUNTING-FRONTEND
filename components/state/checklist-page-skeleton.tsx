"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ChecklistPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 pb-12 font-sans">
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-8">
        <div className="w-full px-4 md:px-8 py-6">
          <Skeleton className="h-8 w-72 bg-white/25" />
          <Skeleton className="h-4 w-56 mt-3 bg-white/20" />
        </div>
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <Skeleton className="h-10 w-[320px] bg-white/20" />
          </div>
        </div>
      </div>
      <main className="w-full px-4 md:px-8 relative mb-20">
        <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-lg overflow-hidden bg-white mb-6">
          <div className="p-5">
            <Skeleton className="h-4 w-40 mb-3" />
            <Skeleton className="h-8 w-72" />
          </div>
        </Card>
        <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-2xl bg-white overflow-hidden mb-12">
          <div className="p-5 border-b border-[#FFE5EC]">
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="p-5 space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`checklist-task-skeleton-${idx}`} className="flex items-center gap-4">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[#FFE5EC] flex items-center justify-between">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-40" />
          </div>
        </Card>
      </main>
    </div>
  )
}
