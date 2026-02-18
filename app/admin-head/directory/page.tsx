//Process(Government Contribution)UI


"use client"




import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Printer, ShieldCheck, Landmark, Building2, UserMinus, UserPlus, Fingerprint
} from 'lucide-react'
import { cn } from "@/lib/utils"




// Data Mapping for all 8 Pages
const GOV_DATABASE = {
  Adding: {
    Philhealth: [
      "Go to EPRS Portal", "Select which company account to open", "Navigate the Philhealth Page",
      "Select Employees Management", "Click the 'Add new Employee'",
      "Provide Member's Philhealth ID Number & Birthday", "Click Submit", "Put Details of the employee"
    ],
    SSS: [
      "Go to SSS Portal", "Select which company account to open", "Enter the OTP sent from the registered number",
      "Navigate to SSS Page/s", "Click Prepared List/s", "then, add record", "input all the details of the employee, then save"
    ],
    "PAG-IBIG": [
      "Go to eSRS Pagibig Fund Portal", "Select which company account to open", "Navigate the Pag-IBIG Page/s",
      "Go to manage remittance", "click add new employees", "Input all the details of the employee, then save"
    ],
    TIN: [
      "Login to BIR eFPS or eBIRForms", "Access Form 1902 (Application for Registration)",
      "Enter Employee Personal Details", "Upload scanned ID and requirements", "Submit to RDO for processing"
    ]
  },
  Removing: {
    Philhealth: [
      "Go to EPRS Portal", "Select which company account to open", "Navigate the Philhealth Page",
      "Select Remittance Status", "Click the (Pencil Icon) then 'Edit'", "In Employment status, select 'Separated'"
    ],
    SSS: [
      "Login to SSS Employer Portal", "Navigate to R3 (Contribution Collection List)",
      "Find Employee record", "Select 'Separated' from status dropdown", "Enter last day of service", "Submit update"
    ],
    "PAG-IBIG": [
      "Go to eSRS Portal", "Navigate to Membership Termination", "Select Employee for removal",
      "Indicate Reason (Resignation/Retirement)", "Upload Separation Notice", "Submit for Approval"
    ],
    TIN: [
      "Access BIR Alphalist Data Entry", "Update 1601-C (Monthly Remittance Return)",
      "Tag employee as inactive/terminated", "Issue Form 2316 to the employee", "Finalize annualized tax records"
    ]
  }
}




type GovAgency = "Philhealth" | "SSS" | "PAG-IBIG" | "TIN";
type ProcessType = "Adding" | "Removing";




export default function GovernmentContributionsPage() {
  const router = useRouter()
  // State management to toggle between the 8 pages
  const [activeProcess, setActiveProcess] = useState<ProcessType>("Adding")
  const [activeAgency, setActiveAgency] = useState<GovAgency>("Philhealth")




  const currentSteps = GOV_DATABASE[activeProcess][activeAgency]




  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-2">
      {/* HEADER SECTION - */}
      <header className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] text-white shadow-lg p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight italic">Government Contributions</h1>
            <p className="text-white/80 text-lg flex items-center gap-2">
              Step-by-step para sumaccess
            </p>


          </div>




          <Button variant="outline" onClick={() => router.back()} className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/20 h-12 px-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Masterfile
          </Button>
        </div>
      </header>

      {/* Page Navigation / Sub-Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-md">
          {(["Adding", "Removing"] as ProcessType[]).map((proc) => (
            <Button
              key={proc}
              onClick={() => setActiveProcess(proc)}
              variant="ghost"
              className={cn(
                "h-9 rounded-lg px-6 text-xs font-bold transition-all",
                activeProcess === proc ? "bg-white text-[#a0153e] shadow-md" : "text-white/70 hover:text-white"
              )}
            >
              {proc.toUpperCase()}
            </Button>
          ))}
        </div>


        <span className="text-rose-200/50 mx-2">|</span>




        <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-md">
          {(["Philhealth", "SSS", "PAG-IBIG", "TIN"] as GovAgency[]).map((agency) => (
            <Button
              key={agency}
              onClick={() => setActiveAgency(agency)}
              variant="ghost"
              className={cn(
                "h-9 rounded-lg px-4 text-xs font-bold transition-all",
                activeAgency === agency ? "bg-white text-[#a0153e] shadow-md" : "text-white/70 hover:text-white"
              )}
            >
              {agency}
            </Button>
          ))}
        </div>
      </div>




      <main className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">


          {/* Summary Card (Left Column) */}
          <Card className="lg:col-span-1 rounded-[2.5rem] border-none shadow-2xl bg-white p-8 flex flex-col items-center justify-center text-center">
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl rotate-3 group-hover:rotate-0 transition-transform",
              activeProcess === "Adding" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}>
              {activeAgency === "Philhealth" && <ShieldCheck className="w-10 h-10" />}
              {activeAgency === "SSS" && <Building2 className="w-10 h-10" />}
              {activeAgency === "PAG-IBIG" && <Landmark className="w-10 h-10" />}
              {activeAgency === "TIN" && <Fingerprint className="w-10 h-10" />}
            </div>


            <Badge className="mb-2 bg-slate-100 text-slate-500 border-none rounded-full px-4 py-1 text-[10px] font-black tracking-widest uppercase">
              {activeProcess} Module
            </Badge>
            <h2 className="text-3xl font-black text-slate-900 mb-2">{activeAgency}</h2>
            <p className="text-slate-400 text-sm font-medium px-4">
              Standard operating procedure for {activeProcess.toLowerCase()} employees in the {activeAgency} portal.
            </p>




            <div className="w-full mt-8 pt-8 border-t border-slate-50">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">
                <span>Task Completion</span>
                <span>Ready</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full">
                <div className="h-full bg-[#a0153e] w-full rounded-full opacity-20" />
              </div>
            </div>
          </Card>




          {/* Process Table (Right Columns) */}
          <Card className="lg:col-span-3 rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="w-[100px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Step</TableHead>
                  <TableHead className="font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Process Description</TableHead>
                  <TableHead className="w-[180px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSteps.map((step, index) => (
                  <TableRow key={`${activeAgency}-${activeProcess}-${index}`} className="border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-6 text-center">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 text-sm font-black flex items-center justify-center mx-auto group-hover:bg-[#a0153e] group-hover:text-white transition-all shadow-sm">
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <p className="text-[15px] font-bold text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                        {step}
                      </p>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-5 py-1 text-[10px] font-black shadow-sm">
                        PROCEDURE READY
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>




            {/* Footer Actions */}
            <div className="bg-slate-50/50 px-10 py-8 flex justify-between items-center border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Government Compliance Portal</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => window.print()} className="rounded-full px-8 h-12 shadow-sm border-slate-200 font-bold text-slate-600 bg-white">
                  <Printer className="mr-2 h-4 w-4" /> Export Guide
                </Button>
                <Button className="rounded-full px-10 h-12 bg-[#a0153e] hover:bg-[#801030] text-white font-bold shadow-xl">
                  Mark as Processed
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div >
  )
}





