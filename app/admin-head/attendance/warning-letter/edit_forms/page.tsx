'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Save,
    Eraser,
    Eye,
    Layout,
    Type,
    FileText,
    User,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- Default Templates ---
const DEFAULT_TARDINESS_TEMPLATE = {
    title: 'TARDINESS WARNING LETTER',
    subject: 'Written Warning - Frequent Tardiness',
    headerLogo: 'ABIC Realty',
    body: `Dear {{salutation}} {{last_name}},

This letter serves as a Formal Warning regarding your tardiness. Please be reminded that your scheduled time-in is {{shift_time}}, with a five (5)-minute grace period until {{grace_period}}, in accordance with company policy.

Despite this allowance, you have incurred {{instances_text}} ({{instances_count}}) instances of tardiness beyond the allowable grace period within the current cut-off period, which constitutes a violation of the Company's Attendance and Punctuality Policy.

Below is the recorded instances for this cut-off period:
{{entries_list}}

Consistent tardiness negatively affects team productivity, disrupts workflow, and fails to meet the company's standards for punctuality and professionalism.

Please be reminded of the following:
1. You are expected to immediately correct your attendance behavior and strictly adhere to your scheduled working hours.
2. Any future occurrences of tardiness may result in stricter disciplinary action, up to and including suspension or termination, in accordance with company policy.

This notice shall be documented accordingly. Your cooperation and compliance are expected.

Thank you.`,
    footer: 'This is a system-generated notice.'
}

const DEFAULT_LEAVE_TEMPLATE = {
    title: 'LEAVE WARNING LETTER',
    subject: 'Record of Extended Leave of Absence',
    headerLogo: 'ABIC Realty',
    body: `Dear {{salutation}} {{last_name}},

This letter serves as a Formal Warning regarding your attendance record for the current cutoff period.

It has been noted that you incurred {{instances_text}} ({{instances_count}}) days of leave within the {{cutoff_text}} of {{month}} {{year}}, specifically on the following dates:
{{entries_list}}

These absences negatively affect work operations and your evaluation needed for your regularization. As stated in the company's Attendance and Punctuality Policy, employees are expected to maintain regular attendance and provide valid justification or prior notice for any absence.

Please be reminded that repeated absences, especially within a short period, may lead to further disciplinary action in accordance with company rules and regulations.

Moving forward, you are expected to:
1. Improve your attendance immediately;
2. Avoid unnecessary or unapproved absences, and;
3. Provide proper documentation or notice for any unavoidable absence.

Failure to comply may result in stricter sanctions, up to and including suspension or termination.`,
    footer: 'This is a system-generated notice.'
}

export default function EditFormsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('tardiness')
    const [tardinessTemplate, setTardinessTemplate] = useState(DEFAULT_TARDINESS_TEMPLATE)
    const [leaveTemplate, setLeaveTemplate] = useState(DEFAULT_LEAVE_TEMPLATE)
    const [isSaving, setIsSaving] = useState(false)

    // Load templates from localStorage on mount
    useEffect(() => {
        const savedTardiness = localStorage.getItem('warning_template_tardiness')
        const savedLeave = localStorage.getItem('warning_template_leave')

        if (savedTardiness) setTardinessTemplate(JSON.parse(savedTardiness))
        if (savedLeave) setLeaveTemplate(JSON.parse(savedLeave))
    }, [])

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            localStorage.setItem('warning_template_tardiness', JSON.stringify(tardinessTemplate))
            localStorage.setItem('warning_template_leave', JSON.stringify(leaveTemplate))
            setIsSaving(false)
            toast.success('Form templates updated successfully!')
        }, 1000)
    }

    const resetTemplate = (type: 'tardiness' | 'leave') => {
        if (type === 'tardiness') setTardinessTemplate(DEFAULT_TARDINESS_TEMPLATE)
        else setLeaveTemplate(DEFAULT_LEAVE_TEMPLATE)
        toast.info('Template reset to default values.')
    }

    const renderPreview = (template: typeof DEFAULT_TARDINESS_TEMPLATE, type: 'tardiness' | 'leave') => {
        let content = template.body

        // Mock replacements for preview
        const mockEntriesList = `• March 02, 2026 – 08:15 AM
• March 05, 2026 – 08:12 AM
• March 10, 2026 – 08:20 AM`

        if (type === 'tardiness') {
            content = content
                .replace(/{{salutation}}/g, 'Mr.')
                .replace(/{{last_name}}/g, 'DOE')
                .replace(/{{shift_time}}/g, '8:00 AM')
                .replace(/{{grace_period}}/g, '8:05 AM')
                .replace(/{{instances_text}}/g, 'three')
                .replace(/{{instances_count}}/g, '3')
                .replace(/{{entries_list}}/g, mockEntriesList)
        } else {
            content = content
                .replace(/{{salutation}}/g, 'Ms.')
                .replace(/{{last_name}}/g, 'SMITH')
                .replace(/{{instances_text}}/g, 'four')
                .replace(/{{instances_count}}/g, '4')
                .replace(/{{cutoff_text}}/g, 'first cutoff')
                .replace(/{{month}}/g, 'March')
                .replace(/{{year}}/g, '2026')
                .replace(/{{entries_list}}/g, mockEntriesList.replace(/– 08:\d+ AM/g, '(Sick Leave)'))
        }

        return (
            <div className="bg-white border-0 shadow-2xl p-16 w-[816px] mx-auto min-h-[1056px] font-serif flex flex-col items-center">
                {/* Official Header */}
                <div className="flex flex-col items-center mb-8 text-center w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 flex items-center justify-center rotate-45 border-4 border-[#7B0F2B] overflow-hidden bg-white shadow-sm">
                            <div className="-rotate-45 flex flex-col items-center">
                                <div className="w-5 h-5 bg-[#7B0F2B] mb-0.5"></div>
                                <div className="text-[7.5px] font-black text-[#7B0F2B]">ABIC</div>
                            </div>
                        </div>
                        <div className="text-left">
                            <h2 className="text-3xl font-serif font-black text-black tracking-tight leading-none">{template.headerLogo}</h2>
                            <p className="text-[11px] font-bold text-black tracking-[0.2em] uppercase mt-1">& Consultancy Corporation</p>
                        </div>
                    </div>
                    <div className="text-[11px] text-[#444] font-medium leading-tight">
                        Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy. Pio Del Pilar, Makati City, 1230 <br />
                        (02) 8646-6136
                    </div>
                </div>

                <div className="w-full text-center mb-6">
                    <h1 className="text-xl font-black text-black tracking-wide uppercase">
                        {template.title}
                    </h1>
                </div>

                <div className="w-full text-right mb-8 text-sm font-bold">
                    Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                <div className="w-full text-left mb-6 text-sm font-bold space-y-1">
                    <p>Employee Name: {type === 'tardiness' ? 'JOHN DOE' : 'JANE SMITH'}</p>
                    <p>Position: Sample Employee</p>
                    <p>Department: Administrative Department</p>
                </div>

                <div className="w-full text-justify text-sm leading-relaxed whitespace-pre-wrap flex-1 text-slate-800 italic">
                    {content}
                </div>

                {/* Official Footer Signature */}
                <div className="w-full mt-12 text-left text-sm space-y-8">
                    <div>
                        <p>Respectfully,</p>
                        <div className="mt-8">
                            <p className="font-black text-lg underline uppercase">Aizle Marie M. Atienza</p>
                            <p className="font-medium text-slate-600">Admin Assistant</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-dashed border-slate-300">
                        <p className="font-bold italic mb-4">Employee Acknowledgment:</p>
                        <p className="mb-8 font-medium">I acknowledge receipt of this formal notice.</p>
                        <div className="grid grid-cols-2 gap-10">
                            <div className="border-t border-black pt-1 text-[10px] font-bold uppercase mt-8 text-center pb-2">Signature Over Printed Name</div>
                            <div className="border-t border-black pt-1 text-[10px] font-bold uppercase mt-8 w-24 text-center pb-2">Date</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDF4F6]">
            {/* --- HEADER --- */}
            <div className="bg-gradient-to-r from-[#4A081A] to-[#7B0F2B] text-white shadow-xl sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 py-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Button
                            onClick={() => router.push('/admin-head/attendance/warning-letter')}
                            variant="ghost"
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 h-12 w-12"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <Layout className="w-8 h-8 text-rose-300" />
                                Template Editor
                            </h1>
                            <p className="text-rose-100/70 font-medium text-sm">Configure your warning letter designs and contents</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            onClick={() => resetTemplate(activeTab as 'tardiness' | 'leave')}
                            variant="outline"
                            className="bg-transparent border-rose-300 text-rose-100 hover:bg-rose-900/40 rounded-xl font-bold px-6 border-2 flex-1 md:flex-none"
                        >
                            <Eraser className="w-4 h-4 mr-2" />
                            Reset Local
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#A4163A] hover:bg-[#D61F4D] text-white rounded-xl font-black px-8 py-6 shadow-xl active:scale-95 transition-all text-lg flex-1 md:flex-none"
                        >
                            {isSaving ? (
                                <span className="animate-pulse flex items-center gap-2">
                                    <Clock className="w-5 h-5 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
                <Tabs defaultValue="tardiness" onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border-2 border-[#FFE5EC] shadow-inner h-auto">
                            <TabsTrigger
                                value="tardiness"
                                className="px-10 py-3 rounded-xl font-black text-sm data-[state=active]:bg-[#4A081A] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                TARDINESS FORM
                            </TabsTrigger>
                            <TabsTrigger
                                value="leave"
                                className="px-10 py-3 rounded-xl font-black text-sm data-[state=active]:bg-[#4A081A] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                LEAVE FORM
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* --- TARDINESS EDITOR --- */}
                    <TabsContent value="tardiness" className="grid grid-cols-1 lg:grid-cols-2 gap-10 focus-visible:outline-none">
                        {/* Editor Side */}
                        <div className="space-y-6 animate-in slide-in-from-left duration-500">
                            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
                                    <CardTitle className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-rose-400" />
                                        Form Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Header Logo Text</Label>
                                            <Input
                                                value={tardinessTemplate.headerLogo}
                                                onChange={(e) => setTardinessTemplate({ ...tardinessTemplate, headerLogo: e.target.value })}
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Main Title</Label>
                                            <Input
                                                value={tardinessTemplate.title}
                                                onChange={(e) => setTardinessTemplate({ ...tardinessTemplate, title: e.target.value })}
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Subject Row</Label>
                                        <Input
                                            value={tardinessTemplate.subject}
                                            onChange={(e) => setTardinessTemplate({ ...tardinessTemplate, subject: e.target.value })}
                                            className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center pl-1">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest">Letter Body</Label>
                                            <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200">Supports Placeholders</Badge>
                                        </div>
                                        <Textarea
                                            value={tardinessTemplate.body}
                                            onChange={(e) => setTardinessTemplate({ ...tardinessTemplate, body: e.target.value })}
                                            className="min-h-[300px] bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-serif text-lg leading-relaxed text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Small Footer Text</Label>
                                        <Input
                                            value={tardinessTemplate.footer}
                                            onChange={(e) => setTardinessTemplate({ ...tardinessTemplate, footer: e.target.value })}
                                            className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-rose-50 border-l-4 border-rose-500">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-sm font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
                                        <Type className="w-5 h-5 text-rose-500" />
                                        Available Placeholders
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['{{salutation}}', '{{last_name}}', '{{shift_time}}', '{{grace_period}}', '{{instances_text}}', '{{instances_count}}', '{{entries_list}}'].map(tag => (
                                            <div key={tag} className="bg-white px-3 py-2 rounded-lg border border-rose-200 text-xs font-mono font-bold text-rose-700 flex items-center justify-between">
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[11px] font-medium text-rose-600/80 italic">
                                        Placeholders will be automatically replaced with high-fidelity employee data when viewing or sending letters.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Side */}
                        <div className="space-y-6 animate-in slide-in-from-right duration-500 sticky top-36 h-fit">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-xl font-black text-[#4A081A] flex items-center gap-2">
                                    <Eye className="w-6 h-6 text-[#A4163A]" />
                                    Live Preview
                                </h3>
                                <Badge className="bg-[#A4163A] text-white px-3 py-1 rounded-full uppercase text-[10px] font-black tracking-widest animate-pulse">
                                    Interactive Mode
                                </Badge>
                            </div>
                            {renderPreview(tardinessTemplate, 'tardiness')}
                        </div>
                    </TabsContent>

                    {/* --- LEAVE EDITOR --- */}
                    <TabsContent value="leave" className="grid grid-cols-1 lg:grid-cols-2 gap-10 focus-visible:outline-none">
                        {/* Editor Side */}
                        <div className="space-y-6 animate-in slide-in-from-left duration-500">
                            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
                                    <CardTitle className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-rose-400" />
                                        Leave Advisory Config
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Header Logo Text</Label>
                                            <Input
                                                value={leaveTemplate.headerLogo}
                                                onChange={(e) => setLeaveTemplate({ ...leaveTemplate, headerLogo: e.target.value })}
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Main Title</Label>
                                            <Input
                                                value={leaveTemplate.title}
                                                onChange={(e) => setLeaveTemplate({ ...leaveTemplate, title: e.target.value })}
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Subject Row</Label>
                                        <Input
                                            value={leaveTemplate.subject}
                                            onChange={(e) => setLeaveTemplate({ ...leaveTemplate, subject: e.target.value })}
                                            className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center pl-1">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest">Letter Body</Label>
                                            <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200">Extended Logic</Badge>
                                        </div>
                                        <Textarea
                                            value={leaveTemplate.body}
                                            onChange={(e) => setLeaveTemplate({ ...leaveTemplate, body: e.target.value })}
                                            className="min-h-[300px] bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-serif text-lg leading-relaxed text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Small Footer Text</Label>
                                        <Input
                                            value={leaveTemplate.footer}
                                            onChange={(e) => setLeaveTemplate({ ...leaveTemplate, footer: e.target.value })}
                                            className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-rose-50 border-l-4 border-rose-500">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-sm font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
                                        <Type className="w-5 h-5 text-rose-500" />
                                        Leave Specific tags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['{{salutation}}', '{{last_name}}', '{{instances_text}}', '{{instances_count}}', '{{cutoff_text}}', '{{month}}', '{{year}}', '{{entries_list}}'].map(tag => (
                                            <div key={tag} className="bg-white px-3 py-2 rounded-lg border border-rose-200 text-xs font-mono font-bold text-rose-700 flex items-center justify-between">
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[11px] font-medium text-rose-600/80 italic text-center">
                                        Dynamic leave details will be injected based on approved leave requests.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Side */}
                        <div className="space-y-6 animate-in slide-in-from-right duration-500 sticky top-36 h-fit">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-xl font-black text-[#4A081A] flex items-center gap-2">
                                    <Eye className="w-6 h-6 text-[#A4163A]" />
                                    Live Preview
                                </h3>
                                <Badge className="bg-[#A4163A] text-white px-3 py-1 rounded-full uppercase text-[10px] font-black tracking-widest">
                                    A4 Format
                                </Badge>
                            </div>
                            {renderPreview(leaveTemplate, 'leave')}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* --- BOTTOM DECORATION --- */}
            <div className="h-40 bg-gradient-to-t from-[#FFE5EC] to-transparent opacity-30 mt-20" />
        </div>
    )
}
