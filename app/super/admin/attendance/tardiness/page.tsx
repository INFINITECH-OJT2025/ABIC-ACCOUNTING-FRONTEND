"use client"

const BORDER = 'rgba(0,0,0,0.12)'

export default function TardinessPage() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Tardiness</h1>
      </div>
      <div className="flex-1 max-w-10xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <section className="rounded-lg bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <h2 className="text-lg font-bold text-[#5f0c18]">Tardiness</h2>
          <p className="text-sm text-gray-600 mt-1">Manage tardiness records.</p>
          <p className="text-muted-foreground mt-4">Content coming soon.</p>
        </section>
      </div>
    </div>
  )
}
