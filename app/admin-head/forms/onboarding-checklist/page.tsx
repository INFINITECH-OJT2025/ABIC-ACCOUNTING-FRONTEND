"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Save, Edit3, ArrowLeft, Printer, Lock, ChevronLeft, ChevronRight, Check, Trash2, Plus, LayoutDashboard 
} from 'lucide-react'
import { cn } from "@/lib/utils"

const ONBOARDING_DB = [
  { 
    id: "1", 
    name: "Giesel Mae Villasan", 
    startDate: "2026-01-23", 
    position: "Admin Assistant/ Marketing Staff", 
    department: "Studio"
  },
  { 
    id: "2", 
    name: "Lans Lorence Hernandez", 
    startDate: "2026-02-12", 
    position: "IT Supervisor", 
    department: "IT"
  },
];

const INITIAL_ONBOARDING_TASKS = [
  { id: 1, task: 'Signing of Job Offer', status: 'DONE' },
  { id: 2, task: 'Signing of Employment Contract', status: 'DONE' },
  { id: 3, task: 'Information Fill-Up for ID and Employee Record', status: 'DONE' },
  { id: 4, task: 'Provide Link to Employee Handbook', status: 'PENDING' },
  { id: 5, task: 'Conduct Onboarding Presentation', status: 'PENDING' },
];

export default function OnboardingChecklistPage() {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [tasks, setTasks] = useState(INITIAL_ONBOARDING_TASKS)
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [employeeInfo, setEmployeeInfo] = useState(ONBOARDING_DB[currentIndex])

  // --- Logic for Percentage Calculation ---
  const completionPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((doneTasks / tasks.length) * 100);
  }, [tasks]);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DB.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setEmployeeInfo(ONBOARDING_DB[nextIdx]);
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setEmployeeInfo(ONBOARDING_DB[prevIdx]);
    }
  }

  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), task: '', status: 'PENDING' }]);
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTaskText = (id: number, text: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, task: text } : t));
  };

  const toggleTaskStatus = (id: number, checked: boolean) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: checked ? 'DONE' : 'PENDING' } : t));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <header className="bg-[#a0153e] text-white p-10 rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight italic">Onboarding Checklist</h1>
            
            <div className="flex flex-wrap items-center gap-3 text-rose-100/80 text-lg">
              <span className="opacity-80">Onboarding for</span>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 text-white font-bold text-lg hover:bg-transparent underline underline-offset-4 decoration-rose-400">
                    {employeeInfo.name}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-xl border-none shadow-2xl">
                  <Command>
                    <CommandInput placeholder="Search records..." />
                    <CommandList>
                      <CommandEmpty>No records found.</CommandEmpty>
                      <CommandGroup>
                        {ONBOARDING_DB.map((emp, index) => (
                          <CommandItem key={emp.id} onSelect={() => { setCurrentIndex(index); setEmployeeInfo(ONBOARDING_DB[index]); setOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", currentIndex === index ? "opacity-100" : "opacity-0")} />
                            {emp.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Dynamic Percentage Badge integrated into the Header Group */}
              <div className="flex items-center gap-2 ml-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                <LayoutDashboard className="w-4 h-4 text-rose-300" />
                <span className="text-xs font-black uppercase tracking-widest text-rose-100">Progress:</span>
                <span className="text-sm font-black text-white">{completionPercentage}% Completed</span>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={() => router.back()} className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/20 h-12 px-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Masterfile
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 relative">
        <div className="absolute left-0 top-[25%] -translate-x-1/2 z-10">
          <Button onClick={handlePrev} disabled={currentIndex === 0} size="icon" className="rounded-full h-12 w-12 bg-white shadow-xl text-[#a0153e] border-none hover:bg-rose-50">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute right-0 top-[25%] translate-x-1/2 z-10">
          <Button onClick={handleNext} disabled={currentIndex === ONBOARDING_DB.length - 1} size="icon" className="rounded-full h-12 w-12 bg-white shadow-xl text-[#a0153e] border-none hover:bg-rose-50">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Info Card - Matches reference image layouts */}
        <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-8 bg-slate-50/30">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em]">Employee Name</p>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-lg font-bold text-slate-900 leading-tight">{employeeInfo.name}</p>
            </div>

            <div className="p-8">
              <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-3">Position</p>
              {editMode ? (
                <Input value={employeeInfo.position} onChange={(e) => setEmployeeInfo({...employeeInfo, position: e.target.value})} className="rounded-xl border-slate-200 h-11" />
              ) : ( <p className="text-lg font-semibold text-slate-700">{employeeInfo.position}</p> )}
            </div>

            <div className="p-8">
              <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-3">Start Date</p>
              {editMode ? (
                <Input type="date" value={employeeInfo.startDate} onChange={(e) => setEmployeeInfo({...employeeInfo, startDate: e.target.value})} className="rounded-xl border-slate-200 h-11" />
              ) : ( <p className="text-lg font-semibold text-slate-700">{new Date(employeeInfo.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p> )}
            </div>

            <div className="p-8">
              <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-3">Department</p>
              {editMode ? (
                <Select value={employeeInfo.department} onValueChange={(val) => setEmployeeInfo({...employeeInfo, department: val})}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="Studio">Studio</SelectItem><SelectItem value="IT">IT</SelectItem></SelectContent>
                </Select>
              ) : ( <p className="text-lg font-semibold text-slate-700">{employeeInfo.department}</p> )}
            </div>
          </div>
        </Card>

        {/* Task Table */}
        <Card className="rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-[180px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Status</TableHead>
                <TableHead className="font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Onboarding Tasks</TableHead>
                {editMode && <TableHead className="w-[100px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-6 flex justify-center items-center gap-4">
                    <Checkbox 
                      checked={item.status === 'DONE'} 
                      onCheckedChange={(checked) => toggleTaskStatus(item.id, !!checked)} 
                      className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" 
                    />
                    <Badge className={cn(
                      "rounded-full px-5 py-1 text-[10px] tracking-widest border-none transition-all", 
                      item.status === 'DONE' ? "bg-emerald-50 text-emerald-600 shadow-sm" : "bg-slate-100 text-slate-400 opacity-60"
                    )}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6">
                    {editMode ? (
                      <Input value={item.task} onChange={(e) => updateTaskText(item.id, e.target.value)} className="rounded-xl border-slate-200 h-11 bg-slate-50/30" />
                    ) : (
                      <span className={cn("text-[15px] font-medium transition-all duration-300", item.status === 'DONE' && "text-slate-400 line-through decoration-slate-200")}>
                        {item.task}
                      </span>
                    )}
                  </TableCell>
                  {editMode && (
                    <TableCell className="py-6 text-center">
                      <Button variant="ghost" size="icon" onClick={() => removeTask(item.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="bg-slate-50/50 px-10 py-8 flex justify-between items-center border-t border-slate-100">
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">ABIC Realty Onboarding System</p>
              {editMode && (
                <Button onClick={addTask} size="sm" variant="ghost" className="rounded-full text-[#a0153e] font-bold bg-[#a0153e]/5 hover:bg-[#a0153e]/10 px-6">
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => window.print()} className="rounded-full px-8 h-12 shadow-sm border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <Printer className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button onClick={() => setEditMode(!editMode)} className={cn("rounded-full px-12 h-12 font-bold shadow-xl transition-all", editMode ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#a0153e] hover:bg-[#801030] text-white")}>
                {editMode ? <><Save className="mr-2 h-4 w-4" /> Save Updates</> : <><Edit3 className="mr-2 h-4 w-4" /> Update Mode</>}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}