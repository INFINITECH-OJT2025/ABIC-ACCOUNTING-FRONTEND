"use client"

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  Fingerprint,
  Landmark,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  MessageCircle,
  UserPlus,
  UserMinus,
} from 'lucide-react'

type AgencyKey = 'philhealth' | 'sss' | 'pagibig' | 'tin'
type ProcessType = 'Adding' | 'Removing'

type DetailRow = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

type AgencyInfo = {
  key: AgencyKey
  shortName: string
  fullName: string
  image: string
  icon: React.ComponentType<{ className?: string }>
  summary: string
  details: DetailRow[]
}

const AGENCY_INFO: AgencyInfo[] = [
  {
    key: 'philhealth',
    shortName: 'PhilHealth',
    fullName: 'Philippine Health Insurance Corporation',
    image: '/images/directory/philhealth.jpg',
    icon: ShieldCheck,
    summary: '24/7 hotline, mobile support, callback service, and main office details.',
    details: [
      { icon: Phone, label: 'Hotline', value: '(02) 866-225-88 (24/7, weekends & holidays included)' },
      { icon: Globe, label: 'Website', value: 'www.philhealth.gov.ph' },
      { icon: Phone, label: 'Smart Mobile', value: '0998-857-2957 ; 0968-865-4670' },
      { icon: Phone, label: 'Globe Mobile', value: '0917-127-5987 ; 0917-110-9812' },
      { icon: MessageCircle, label: 'Callback Text Format', value: 'PHICallback [space] Mobile Number [space] concern details' },
      { icon: Phone, label: 'Callback Window', value: '8:00 AM - 8:00 PM, 7 days a week' },
      { icon: MapPin, label: 'Address', value: 'Citystate Centre, 709 Shaw Boulevard, Pasig City' },
    ],
  },
  {
    key: 'sss',
    shortName: 'SSS',
    fullName: 'Social Security System',
    image: '/images/directory/SSS.jpg',
    icon: Building2,
    summary: 'Main hotline, email support, and official main office address.',
    details: [
      { icon: Phone, label: 'Hotline / Trunkline', value: '1455' },
      { icon: Mail, label: 'Email', value: 'usssaptayo@sss.gov.ph' },
      { icon: MapPin, label: 'Main Office', value: 'SSS Main Building, East Avenue, Diliman, Quezon City' },
    ],
  },
  {
    key: 'pagibig',
    shortName: 'Pag-IBIG',
    fullName: 'Home Development Mutual Fund',
    image: '/images/directory/PAG_IBIG.jpg',
    icon: Landmark,
    summary: 'Phone support, email contact, and official page reference.',
    details: [
      { icon: Phone, label: 'Telephone', value: '8724-4244' },
      { icon: Mail, label: 'Email', value: 'contactus@pagibigfund.gov.ph' },
      { icon: Globe, label: 'Official Page', value: '@PagIBIGFundOfficialPage' },
    ],
  },
  {
    key: 'tin',
    shortName: 'BIR (TIN)',
    fullName: 'Bureau of Internal Revenue',
    image: '/images/directory/bir.jpeg',
    icon: Fingerprint,
    summary: 'National office, trunklines, and taxpayer query support details.',
    details: [
      { icon: MapPin, label: 'National Office', value: 'BIR National Office Building, Senator Miriam Defensor-Santiago Avenue, Diliman, Quezon City' },
      { icon: Phone, label: 'Trunkline', value: '8981-7000 ; 89297676' },
      { icon: Phone, label: 'Tax Query Hotline', value: '8538-3200' },
      { icon: Mail, label: 'Tax Query Email', value: 'contact_us@bir.gov.ph' },
    ],
  },
]

const STEP_DATABASE: Record<ProcessType, Record<AgencyKey, string[]>> = {
  Adding: {
    philhealth: [
      'Go to EPRS Portal',
      'Select which company account to open',
      'Navigate the PhilHealth page',
      'Select Employees Management',
      "Click 'Add New Employee'",
      "Provide member's PhilHealth ID number and birthday",
      'Click Submit and complete employee details',
    ],
    sss: [
      'Go to SSS Portal',
      'Select which company account to open',
      'Enter OTP from registered number',
      'Navigate to SSS pages',
      'Click Prepared List',
      'Add record',
      'Input employee details then save',
    ],
    pagibig: [
      'Go to eSRS Pag-IBIG Fund Portal',
      'Select which company account to open',
      'Navigate the Pag-IBIG pages',
      'Go to Manage Remittance',
      'Click Add New Employees',
      'Input employee details then save',
    ],
    tin: [
      'Login to BIR eFPS or eBIRForms',
      'Access Form 1902',
      'Enter employee personal details',
      'Upload required IDs/documents',
      'Submit to RDO for processing',
    ],
  },
  Removing: {
    philhealth: [
      'Go to EPRS Portal',
      'Select which company account to open',
      'Navigate the PhilHealth page',
      'Select Remittance Status',
      "Click Edit (pencil icon)",
      "Set employment status to 'Separated'",
    ],
    sss: [
      'Login to SSS Employer Portal',
      'Navigate to R3 (Contribution Collection List)',
      'Find employee record',
      "Set status to 'Separated'",
      'Enter last day of service',
      'Submit update',
    ],
    pagibig: [
      'Go to eSRS Portal',
      'Navigate to Membership Termination',
      'Select employee for removal',
      'Indicate reason (resignation/retirement)',
      'Upload separation notice',
      'Submit for approval',
    ],
    tin: [
      'Access BIR Alphalist Data Entry',
      'Update Form 1601-C',
      'Tag employee as inactive/terminated',
      'Issue Form 2316 to employee',
      'Finalize annualized tax records',
    ],
  },
}

export default function GovernmentDirectoryPage() {
  const router = useRouter()
  const [activeAgency, setActiveAgency] = useState<AgencyKey>('philhealth')
  const [activeProcess, setActiveProcess] = useState<ProcessType>('Adding')
  const [imageError, setImageError] = useState<Record<AgencyKey, boolean>>({
    philhealth: false,
    sss: false,
    pagibig: false,
    tin: false,
  })

  const agency = useMemo(
    () => AGENCY_INFO.find((item) => item.key === activeAgency) ?? AGENCY_INFO[0],
    [activeAgency]
  )
  const currentSteps = STEP_DATABASE[activeProcess][activeAgency]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <header className="bg-[#a0153e] text-white p-10 rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight italic">Government Directory</h1>
            <p className="text-rose-100/90 text-lg">Reference contacts for core government agencies.</p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/20 h-12 px-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Masterfile
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-[2rem] border-none shadow-2xl bg-white p-6">
            <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.2em] mb-4">Agencies</p>
            <div className="space-y-3">
              {AGENCY_INFO.map((item) => {
                const Icon = item.icon
                const isActive = item.key === activeAgency
                return (
                  <Button
                    key={item.key}
                    onClick={() => setActiveAgency(item.key)}
                    variant="ghost"
                    className={cn(
                      'w-full h-auto justify-start rounded-xl px-4 py-3 border transition-colors',
                      isActive
                        ? 'bg-[#a0153e]/10 border-[#a0153e]/30 text-[#a0153e]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2 shrink-0" />
                    <span className="font-bold">{item.shortName}</span>
                  </Button>
                )
              })}
            </div>
          </Card>

          <Card className="lg:col-span-3 rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden">
            <div className="relative h-64 bg-slate-100">
              {!imageError[agency.key] ? (
                <img
                  src={agency.image}
                  alt={agency.shortName}
                  className="h-full w-full object-cover"
                  onError={() =>
                    setImageError((prev) => ({
                      ...prev,
                      [agency.key]: true,
                    }))
                  }
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <agency.icon className="h-16 w-16 text-slate-500" />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/70 to-transparent text-white">
                <Badge className="mb-2 bg-white/20 text-white border-none rounded-full px-3 py-1 text-[10px] font-black tracking-widest">
                  AGENCY DIRECTORY
                </Badge>
                <h2 className="text-3xl font-black leading-tight">{agency.shortName}</h2>
                <p className="text-white/90">{agency.fullName}</p>
              </div>
            </div>

            <div className="p-8">
              <p className="text-slate-600 font-medium mb-6">{agency.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agency.details.map((row, index) => {
                  const Icon = row.icon
                  return (
                    <div key={`${agency.key}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#a0153e]/10 text-[#a0153e] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.15em]">{row.label}</p>
                          <p className="text-sm font-semibold text-slate-700 mt-1 leading-relaxed">{row.value}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 p-8 bg-slate-50/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.2em] mb-2">Core Workflow</p>
                  <h3 className="text-2xl font-black text-slate-900">Process Steps</h3>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                  {(['Adding', 'Removing'] as ProcessType[]).map((proc) => (
                    <Button
                      key={proc}
                      onClick={() => setActiveProcess(proc)}
                      variant="ghost"
                      className={cn(
                        'h-9 rounded-lg px-5 text-xs font-black transition-all',
                        activeProcess === proc
                          ? 'bg-[#a0153e] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      {proc === 'Adding' ? <UserPlus className="mr-1.5 h-3.5 w-3.5" /> : <UserMinus className="mr-1.5 h-3.5 w-3.5" />}
                      {proc}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[100px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-5">Step</TableHead>
                      <TableHead className="font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-5">Process</TableHead>
                      <TableHead className="w-[170px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSteps.map((step, index) => (
                      <TableRow key={`${activeAgency}-${activeProcess}-${index}`} className="hover:bg-slate-50/60">
                        <TableCell className="text-center">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center mx-auto">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700 py-4">{step}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-full px-4 py-1 text-[10px] font-black tracking-wide">
                            PROCEDURE READY
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
