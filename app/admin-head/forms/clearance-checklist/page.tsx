//clearance checklist


"use client"


import React, { useEffect, useMemo, useState } from 'react'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Save, Lock, ChevronLeft, ChevronRight, Check, Trash2, Plus, Target, UserPlus, ClipboardList, TriangleAlert, FolderPlus, Filter, ArrowUpDown, Users, CheckCircle2, Loader2, ChevronDown
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { getApiUrl } from '@/lib/api'
import { toast } from 'sonner'


type TaskStatus = 'DONE' | 'PENDING'
type RecordStatusFilter = 'ALL' | TaskStatus
type RecordSort = 'NAME_ASC' | 'NAME_DESC' | 'UPDATED_DESC' | 'UPDATED_ASC'


interface ChecklistTask {
  id: number
  task: string
  status: TaskStatus
  date: string
}


interface ClearanceRecord {
  id: string
  name: string
  startDate: string
  position: string
  department: string
  resignationDate: string
  lastDay: string
  status: string
  updatedAt: string
  tasks: ChecklistTask[]
}


interface NamedOption {
  name: string
}


const normalizeTasks = (input: unknown): ChecklistTask[] => {
  const tasks = Array.isArray(input) ? input : []
  const usedIds = new Set<number>()
  let fallbackId = Date.now()


  return tasks.map((task, index) => {
    const row = (task ?? {}) as { id?: unknown; task?: unknown; status?: unknown; date?: unknown; completedDate?: unknown }
    let id = Number(row.id)
    if (!Number.isFinite(id) || usedIds.has(id)) {
      fallbackId += index + 1
      while (usedIds.has(fallbackId)) fallbackId += 1
      id = fallbackId
    }
    usedIds.add(id)


    const normalizedStatus: TaskStatus = String(row.status).toUpperCase() === 'DONE' ? 'DONE' : 'PENDING'
    const existingDate =
      typeof row.date === 'string' && row.date.trim()
        ? row.date.trim()
        : typeof row.completedDate === 'string' && row.completedDate.trim()
          ? row.completedDate.trim()
          : ''


    return {
      id,
      task: typeof row.task === 'string' ? row.task : '',
      status: normalizedStatus,
      date: normalizedStatus === 'DONE' ? existingDate : '',
    }
  })
}


const normalizeRecord = (record: any): ClearanceRecord => ({
  id: String(record?.id ?? ''),
  name: String(record?.name ?? ''),
  startDate: String(record?.startDate ?? ''),
  position: String(record?.position ?? ''),
  department: String(record?.department ?? ''),
  resignationDate: String(record?.resignationDate ?? ''),
  lastDay: String(record?.lastDay ?? ''),
  status: String(record?.status ?? ''),
  updatedAt: String(record?.updated_at ?? record?.updatedAt ?? ''),
  tasks: normalizeTasks(record?.tasks),
})


const getRecordCompletionPercentage = (record: ClearanceRecord) => {
  if (!record.tasks.length) return 0
  const doneCount = record.tasks.filter((task) => task.status === 'DONE').length
  return Math.round((doneCount / record.tasks.length) * 100)
}


const isRecordDone = (record: ClearanceRecord) =>
  String(record.status).toUpperCase() === 'DONE' || getRecordCompletionPercentage(record) === 100


export default function ClearanceChecklistPage() {
  const router = useRouter()
  const editMode = true
  const [saving, setSaving] = useState(false)
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [taskIdToDelete, setTaskIdToDelete] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [records, setRecords] = useState<ClearanceRecord[]>([])
  const [employeeInfo, setEmployeeInfo] = useState<ClearanceRecord | null>(null)
  const [positionOptions, setPositionOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recordStatusFilter, setRecordStatusFilter] = useState<RecordStatusFilter>('ALL')
  const [recordSort, setRecordSort] = useState<RecordSort>('UPDATED_DESC')


  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${getApiUrl()}/api/clearance-checklist`, {
          headers: { Accept: 'application/json' },
        })


        if (!response.ok) throw new Error(`HTTP ${response.status}`)


        const result = await response.json()
        const data = Array.isArray(result?.data) ? result.data.map(normalizeRecord) : []
        setRecords(data)


        if (data.length > 0) {
          setCurrentIndex(0)
          setEmployeeInfo(data[0])
          setTasks(data[0].tasks)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load checklists'
        setError(message)
      } finally {
        setLoading(false)
      }
    }


    fetchChecklists()
  }, [])


  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [positionsResponse, departmentsResponse] = await Promise.all([
          fetch(`${getApiUrl()}/api/positions`, { headers: { Accept: 'application/json' } }),
          fetch(`${getApiUrl()}/api/departments`, { headers: { Accept: 'application/json' } }),
        ])


        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json()
          const names = Array.isArray(positionsData?.data)
            ? (positionsData.data as NamedOption[]).map((item) => item.name).filter((name): name is string => !!name)
            : []
          setPositionOptions([...new Set(names)])
        }


        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json()
          const names = Array.isArray(departmentsData?.data)
            ? (departmentsData.data as NamedOption[]).map((item) => item.name).filter((name): name is string => !!name)
            : []
          setDepartmentOptions([...new Set(names)])
        }
      } catch {
      }
    }


    fetchOptions()
  }, [])


  const completionPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((doneTasks / tasks.length) * 100);
  }, [tasks]);
  const showCompletionDate = completionPercentage === 100 || String(employeeInfo?.status ?? '').toUpperCase() === 'DONE'
  const completionDateText = useMemo(() => {
    if (!showCompletionDate) return ''
    const value = employeeInfo?.updatedAt
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [employeeInfo?.updatedAt, showCompletionDate])
  const emptyTaskColSpan = editMode ? 4 : 3


  const positionSelectOptions = useMemo(() => {
    const current = employeeInfo?.position?.trim()
    return [...new Set([...(current ? [current] : []), ...positionOptions])]
  }, [employeeInfo?.position, positionOptions])


  const departmentSelectOptions = useMemo(() => {
    const current = employeeInfo?.department?.trim()
    return [...new Set([...(current ? [current] : []), ...departmentOptions])]
  }, [employeeInfo?.department, departmentOptions])


  const filteredAndSortedRecords = useMemo(() => {
    const rows = records.map((record, index) => ({ record, index }))
    const filtered = recordStatusFilter === 'ALL'
      ? rows
      : rows.filter(({ record }) => (recordStatusFilter === 'DONE' ? isRecordDone(record) : !isRecordDone(record)))


    const withTime = (value: string) => {
      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }


    return [...filtered].sort((a, b) => {
      if (recordSort === 'NAME_ASC') return a.record.name.localeCompare(b.record.name)
      if (recordSort === 'NAME_DESC') return b.record.name.localeCompare(a.record.name)
      if (recordSort === 'UPDATED_ASC') return withTime(a.record.updatedAt) - withTime(b.record.updatedAt)
      return withTime(b.record.updatedAt) - withTime(a.record.updatedAt)
    })
  }, [records, recordSort, recordStatusFilter])


  const doneRecords = useMemo(
    () => filteredAndSortedRecords.filter(({ record }) => isRecordDone(record)),
    [filteredAndSortedRecords]
  )
  const pendingRecords = useMemo(
    () => filteredAndSortedRecords.filter(({ record }) => !isRecordDone(record)),
    [filteredAndSortedRecords]
  )


  const selectRecordByIndex = (index: number) => {
    const selected = records[index]
    if (!selected) return


    setCurrentIndex(index)
    setEmployeeInfo(selected)
    setTasks(normalizeTasks(selected.tasks))
  }


  const handleNext = () => {
    if (currentIndex < records.length - 1) {
      selectRecordByIndex(currentIndex + 1)
    }
  }


  const handlePrev = () => {
    if (currentIndex > 0) {
      selectRecordByIndex(currentIndex - 1)
    }
  }


  const addTask = () => {
    setTasks([...tasks, { id: Date.now() + Math.floor(Math.random() * 1000), task: '', status: 'PENDING', date: '' }]);
  };


  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };


  const updateTaskText = (id: number, text: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, task: text } : t));
  };


  const persistTaskStatus = async (updatedTasks: ChecklistTask[], previousTasks: ChecklistTask[]) => {
    if (!employeeInfo) return


    try {
      const response = await fetch(`${getApiUrl()}/api/clearance-checklist/${employeeInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      })


      if (!response.ok) throw new Error(`HTTP ${response.status}`)


      const result = await response.json()
      const updated = normalizeRecord(result?.data)
      setEmployeeInfo(updated)
      setTasks(updated.tasks)
      setRecords(prev => prev.map((record, index) => index === currentIndex ? updated : record))
      toast.success('Changes saved successfully!')
    } catch (err) {
      setTasks(previousTasks)
      const message = err instanceof Error ? err.message : 'Failed to update task status'
      toast.error('Task Status Update Failed', {
        description: message,
      })
    }
  }


  const toggleTaskStatus = async (id: number, checked: boolean) => {
    const previousTasks = tasks
    const updatedTasks = tasks.map(t => t.id === id
      ? { ...t, status: (checked ? 'DONE' : 'PENDING') as TaskStatus, date: checked ? new Date().toLocaleDateString('en-CA') : '' }
      : t)
    setTasks(updatedTasks)


    if (!editMode) {
      await persistTaskStatus(updatedTasks, previousTasks)
    }
  };


  const handleSave = async () => {
    if (!employeeInfo) return


    try {
      setSaving(true)
      const payload = {
        name: employeeInfo.name,
        position: employeeInfo.position,
        department: employeeInfo.department,
        startDate: employeeInfo.startDate,
        resignationDate: employeeInfo.resignationDate,
        lastDay: employeeInfo.lastDay,
        tasks,
        status: completionPercentage === 100 ? 'DONE' : 'PENDING',
      }


      const response = await fetch(`${getApiUrl()}/api/clearance-checklist/${employeeInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })


      if (!response.ok) throw new Error(`HTTP ${response.status}`)


      const result = await response.json()
      const updated = normalizeRecord(result?.data)
      setEmployeeInfo(updated)
      setTasks(updated.tasks)
      setRecords(prev => prev.map((record, index) => index === currentIndex ? updated : record))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save updates'
      toast.error('Save Failed', {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8 font-sans">
        <Card className="mx-auto mt-16 max-w-3xl rounded-[2rem] border-none shadow-2xl bg-white p-10 text-center">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-[#a0153e]/20 border-t-[#a0153e] animate-spin" />
          <p className="text-2xl font-black text-slate-900">Loading Clearance Checklist</p>
          <p className="mt-2 text-slate-600">Preparing employee record and clearance tasks...</p>
          <div className="mt-6 space-y-3">
            <div className="h-4 rounded-full bg-slate-200/80 animate-pulse" />
            <div className="h-4 w-11/12 mx-auto rounded-full bg-slate-200/70 animate-pulse [animation-delay:120ms]" />
            <div className="h-4 w-9/12 mx-auto rounded-full bg-slate-200/60 animate-pulse [animation-delay:240ms]" />
          </div>
          <div className="mt-7 flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#a0153e]/80 animate-bounce" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#a0153e]/70 animate-bounce [animation-delay:140ms]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#a0153e]/60 animate-bounce [animation-delay:280ms]" />
          </div>
        </Card>
      </div>
    )
  }


  if (error) {
    return <div className="p-8 text-rose-600">Failed to load clearance checklist: {error}</div>
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 pb-12 font-sans">
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-8">
        {/* Main Header Row */}
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Clearance Checklist</h1>
              <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                ABIC REALTY & CONSULTANCY
              </p>
            </div>


            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/admin-head/forms/clearance-checklist/add-clearance-checklist')}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20 hover:text-white bg-transparent backdrop-blur-sm shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Record
              </Button>
            </div>
          </div>
        </div>


        {/* Secondary Toolbar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4">


              {/* Filter Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Filter</span>
                <Select value={recordStatusFilter} onValueChange={(value) => setRecordStatusFilter(value as RecordStatusFilter)}>
                  <SelectTrigger className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 w-[140px] shadow-sm font-bold rounded-lg border-2 ring-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-200 shadow-xl">
                    <SelectItem value="ALL">All Records</SelectItem>
                    <SelectItem value="DONE">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* Employee Record Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Employee</span>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[220px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                      <span className="truncate max-w-[180px]">{employeeInfo?.name || 'Select Record'}</span>
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 rounded-xl border-stone-200 shadow-2xl" align="start">
                    <Command>
                      <CommandInput placeholder="Search records..." className="h-10" />
                      <CommandList>
                        <CommandEmpty>No records found.</CommandEmpty>
                        {doneRecords.length > 0 && (
                          <CommandGroup heading="DONE">
                            {doneRecords.map(({ record: emp, index }) => (
                              <CommandItem key={emp.id} onSelect={() => { selectRecordByIndex(index); setOpen(false); }} className="rounded-lg m-1 cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4", currentIndex === index ? "text-[#A4163A]" : "opacity-0")} />
                                <span className="font-medium text-slate-700">{emp.name}</span>
                                <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{getRecordCompletionPercentage(emp)}%</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {pendingRecords.length > 0 && (
                          <CommandGroup heading="PENDING">
                            {pendingRecords.map(({ record: emp, index }) => (
                              <CommandItem key={emp.id} onSelect={() => { selectRecordByIndex(index); setOpen(false); }} className="rounded-lg m-1 cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4", currentIndex === index ? "text-[#A4163A]" : "opacity-0")} />
                                <span className="font-medium text-slate-700">{emp.name}</span>
                                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{getRecordCompletionPercentage(emp)}%</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>


              {/* Sort By */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Sort</span>
                <Select value={recordSort} onValueChange={(value) => setRecordSort(value as RecordSort)}>
                  <SelectTrigger className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 w-[160px] shadow-sm font-bold rounded-lg border-2 ring-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-200 shadow-xl">
                    <SelectItem value="UPDATED_DESC">Latest First</SelectItem>
                    <SelectItem value="UPDATED_ASC">Oldest First</SelectItem>
                    <SelectItem value="NAME_ASC">Name (A-Z)</SelectItem>
                    <SelectItem value="NAME_DESC">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* Overall Stats (Right Aligned) */}
              <div className="ml-auto hidden xl:flex items-center gap-4 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Overall</span>
                  <span className="text-sm font-black text-white">{completionPercentage}%</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Updated</span>
                  <span className="text-sm font-black text-white tracking-tight">{completionDateText || '—'}</span>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>


      <main className="w-full px-4 md:px-8 relative mb-20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">


        <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-lg overflow-hidden bg-white mb-6 transition-all hover:shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-rose-50">
            <div className="p-4 bg-rose-50/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-[#800020]/60" />
                <p className="text-[9px] font-black text-[#800020]/60 uppercase tracking-widest">Employee Name</p>
              </div>
              <p className="text-lg font-black text-slate-800 leading-tight">{employeeInfo?.name || '-'}</p>
            </div>


            <div className="p-4">
              <p className="text-[9px] font-black text-[#800020]/60 uppercase tracking-widest mb-1">Position</p>
              {editMode && employeeInfo ? (
                <Select value={employeeInfo.position || ''} onValueChange={(val) => setEmployeeInfo({ ...employeeInfo, position: val })}>
                  <SelectTrigger className="h-7 text-lg font-bold text-slate-700 border-none p-0 focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {positionSelectOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (<p className="text-lg font-bold text-slate-700 leading-tight">{employeeInfo?.position || '-'}</p>)}
            </div>


            <div className="p-4">
              <p className="text-[9px] font-black text-[#800020]/60 uppercase tracking-widest mb-1">Last Day</p>
              {editMode && employeeInfo ? (
                <Input type="date" value={employeeInfo.lastDay} onChange={(e) => setEmployeeInfo({ ...employeeInfo, lastDay: e.target.value })} className="h-7 text-lg font-bold text-slate-700 border-none p-0 focus-visible:ring-0 shadow-none" />
              ) : (
                <p className="text-lg font-bold text-slate-700">
                  {employeeInfo?.lastDay ? new Date(employeeInfo.lastDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                </p>
              )}
            </div>


            <div className="p-4">
              <p className="text-[9px] font-black text-[#800020]/60 uppercase tracking-widest mb-1">Department</p>
              {editMode && employeeInfo ? (
                <Select value={employeeInfo.department || ''} onValueChange={(val) => setEmployeeInfo({ ...employeeInfo, department: val })}>
                  <SelectTrigger className="h-7 text-lg font-bold text-slate-700 border-none p-0 focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {departmentSelectOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (<p className="text-lg font-bold text-slate-700 leading-tight">{employeeInfo?.department || '-'}</p>)}
            </div>
          </div>
        </Card>


        {/* Task List Section */}
        <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-2xl bg-white overflow-hidden mb-12">
          {/* Progress Banner */}
          <div className="bg-[#FFE5EC]/20 p-4 md:px-8 border-b border-[#FFE5EC]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[11px] font-black text-[#800020] uppercase tracking-widest">Process Clearance Progress</h3>
              <span className="text-sm font-black text-[#A4163A] bg-white px-3 py-0.5 rounded-full shadow-sm border border-[#FFE5EC]">
                {tasks.filter(t => t.status === 'DONE').length} / {tasks.length} Completed
              </span>
            </div>
            <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#FFE5EC] shadow-inner p-0.5">
              <div
                className="bg-gradient-to-r from-[#A4163A] to-[#630C22] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>


          <Table>
            <TableHeader className="bg-[#FFE5EC]/40">
              <TableRow className="border-b border-[#FFE5EC] hover:bg-transparent">
                <TableHead className="w-[180px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">Date</TableHead>
                <TableHead className="w-[80px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">Status</TableHead>
                <TableHead className="font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">
                  Required Clearance Tasks
                </TableHead>
                <TableHead className="w-[80px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((item) => (
                <TableRow key={item.id} className="border-b border-rose-50/30 last:border-0 hover:bg-[#FFE5EC]/5 transition-colors group">
                  <TableCell className="text-center py-2.5 font-mono text-[10px] font-bold text-slate-400">
                    {item.date ? new Date(item.date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : '-'}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex justify-center">
                      <div
                        onClick={() => toggleTaskStatus(item.id, item.status !== 'DONE')}
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all border-2",
                          item.status === 'DONE'
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                            : "border-slate-200 bg-white hover:border-[#A4163A]"
                        )}
                      >
                        {item.status === 'DONE' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    {editMode ? (
                      <Input
                        value={item.task}
                        onChange={(e) => updateTaskText(item.id, e.target.value)}
                        className={cn(
                          "h-8 border-transparent bg-transparent hover:border-[#FFE5EC]/50 focus:border-[#A4163A] focus-visible:ring-0 transition-all font-bold px-0 text-sm",
                          item.status === 'DONE' ? "text-slate-300 line-through" : "text-slate-700"
                        )}
                        placeholder="Define clearance task..."
                      />
                    ) : (
                      <span className={cn(
                        "text-sm font-bold transition-all duration-300",
                        item.status === 'DONE' ? "text-slate-300 line-through" : "text-slate-700"
                      )}>
                        {item.task}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTaskIdToDelete(item.id)}
                      className="h-7 w-7 text-slate-300 hover:text-rose-500 transition-colors rounded-lg group-hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}


              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-24 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No tasks initialized</p>
                    <Button onClick={addTask} variant="outline" size="sm" className="mt-4 border-[#FFE5EC] text-[#A4163A] font-black h-9 rounded-xl">
                      <Plus className="w-4 h-4 mr-1" /> START CHECKLIST
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>


          {/* Table Footer */}
          <div className="p-4 md:px-8 bg-slate-50/50 border-t border-[#FFE5EC] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Button onClick={addTask} size="sm" className="bg-[#A4163A] hover:bg-[#800020] text-white font-black text-xs h-9 px-6 rounded-xl shadow-md active:scale-95 transition-all">
                <Plus className="w-3.5 h-3.5 mr-2" /> ADD ROW
              </Button>
              <div className="h-4 w-px bg-slate-200 hidden md:block" />
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic hidden md:block">
                ADMINISTRATION FRAMEWORK • ABIC HR
              </p>
            </div>


            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving || !employeeInfo}
                className="h-9 px-8 font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 transition-all rounded-xl"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                {saving ? 'UPDATING...' : 'FINALIZE SAVE'}
              </Button>
            </div>
          </div>
        </Card>
      </main>


      <AlertDialog open={taskIdToDelete !== null} onOpenChange={(open) => { if (!open) setTaskIdToDelete(null) }}>
        <AlertDialogContent className="border-2 border-rose-200">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This task will be removed from the current checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskIdToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                if (taskIdToDelete !== null) removeTask(taskIdToDelete)
                setTaskIdToDelete(null)
              }}
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  )
}

