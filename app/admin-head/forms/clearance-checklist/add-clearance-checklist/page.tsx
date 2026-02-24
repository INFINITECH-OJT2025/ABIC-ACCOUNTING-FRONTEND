"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Check, ListChecks, Plus, Trash2 } from 'lucide-react'

type TaskStatus = 'DONE' | 'PENDING'

interface ChecklistTask {
    id: number
    task: string
    status: TaskStatus
    date: string
}

interface NamedOption {
    name: string
}

interface EmployedEmployeeRecord {
    id: string
    name: string
    startDate: string
    position: string
    department: string
    status: string
}

const DEFAULT_CLEARANCE_TASK_LABELS = [
    'Return of Company ID and HMO Card',
    'Return of Company Laptop and Accessories',
    'Turnover of Departmental Keys and Files',
    'Settlement of Petty Cash and Advances',
    'Exit Interview Conducted',
]

const buildTaskRows = (labels: string[]): ChecklistTask[] =>
    labels.map((label, index) => ({
        id: Date.now() + index + Math.floor(Math.random() * 1000),
        task: label,
        status: 'PENDING',
        date: '',
    }))

export default function AddClearanceChecklistPage() {
    const router = useRouter()
    const [creatingRecord, setCreatingRecord] = useState(false)
    const [employeePickerOpen, setEmployeePickerOpen] = useState(false)
    const [employedEmployees, setEmployedEmployees] = useState<EmployedEmployeeRecord[]>([])
    const [positionOptions, setPositionOptions] = useState<string[]>([])
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
    const [newRecord, setNewRecord] = useState({
        name: '',
        position: '',
        department: '',
        startDate: '',
        resignationDate: '',
        lastDay: '',
    })
    const [taskMode, setTaskMode] = useState<'default' | 'custom'>('default')
    const [tasks, setTasks] = useState<ChecklistTask[]>(() => buildTaskRows(DEFAULT_CLEARANCE_TASK_LABELS))

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [positionsResponse, departmentsResponse] = await Promise.all([
                    fetch(`${getApiUrl()}/api/positions`, { headers: { Accept: 'application/json' } }),
                    fetch(`${getApiUrl()}/api/departments`, { headers: { Accept: 'application/json' } }),
                ])

                if (positionsResponse.ok) {
                    const positionsData = await positionsResponse.json()
                    const data = (Array.isArray(positionsData?.data) ? positionsData.data : []) as NamedOption[]
                    const names = data.map((item) => item.name).filter((name): name is string => !!name)
                    setPositionOptions([...new Set(names)])
                }

                if (departmentsResponse.ok) {
                    const departmentsData = await departmentsResponse.json()
                    const data = (Array.isArray(departmentsData?.data) ? departmentsData.data : []) as NamedOption[]
                    const names = data.map((item) => item.name).filter((name): name is string => !!name)
                    setDepartmentOptions([...new Set(names)])
                }
            } catch {
            }
        }

        fetchOptions()
    }, [])

    useEffect(() => {
        const fetchEmployedEmployees = async () => {
            try {
                const response = await fetch(`${getApiUrl()}/api/employees`, {
                    headers: { Accept: 'application/json' },
                })

                if (!response.ok) return

                const result = await response.json()
                const data = Array.isArray(result?.data) ? result.data : []
                const employedRecords = data
                    .map((record: any) => ({
                        id: String(record?.id ?? ''),
                        name: `${String(record?.first_name ?? '').trim()} ${String(record?.last_name ?? '').trim()}`.trim(),
                        startDate: String(record?.onboarding_date ?? record?.date_hired ?? ''),
                        position: String(record?.position ?? ''),
                        department: String(record?.department ?? ''),
                        status: String(record?.status ?? '').toLowerCase(),
                    }))
                    .filter((record: EmployedEmployeeRecord) => ['employed', 'rehired_employee'].includes(record.status) && record.name.length > 0)

                setEmployedEmployees(employedRecords)
            } catch {
            }
        }

        fetchEmployedEmployees()
    }, [])

    const modalPositionOptions = useMemo(() => {
        const current = newRecord.position.trim()
        return [...new Set([...(current ? [current] : []), ...positionOptions])]
    }, [newRecord.position, positionOptions])

    const modalDepartmentOptions = useMemo(() => {
        const current = newRecord.department.trim()
        return [...new Set([...(current ? [current] : []), ...departmentOptions])]
    }, [newRecord.department, departmentOptions])

    const handleTaskModeChange = (mode: 'default' | 'custom') => {
        setTaskMode(mode)
        if (mode === 'default') {
            setTasks(buildTaskRows(DEFAULT_CLEARANCE_TASK_LABELS))
            return
        }

        setTasks(prev => {
            const seeded = prev.filter(task => task.task.trim().length > 0)
            return seeded.length > 0 ? seeded : [{ id: Date.now(), task: '', status: 'PENDING', date: '' }]
        })
    }

    const addTask = () => {
        setTasks(prev => [...prev, { id: Date.now() + Math.floor(Math.random() * 1000), task: '', status: 'PENDING', date: '' }])
    }

    const updateTaskText = (id: number, text: string) => {
        setTasks(prev => prev.map(task => task.id === id ? { ...task, task: text } : task))
    }

    const removeTask = (id: number) => {
        setTasks(prev => prev.filter(task => task.id !== id))
    }

    const handleCreateRecord = async () => {
        if (!newRecord.name.trim() || !newRecord.startDate || !newRecord.resignationDate || !newRecord.lastDay) {
            toast.warning('Incomplete Form', {
                description: 'Name, start date, resignation date, and last day are required.',
            })
            return
        }

        const cleanedTasks = tasks
            .map(task => ({ ...task, task: task.task.trim(), status: 'PENDING' as TaskStatus }))
            .filter(task => task.task.length > 0)

        if (cleanedTasks.length === 0) {
            toast.warning('Tasks Required', {
                description: 'Please provide at least one task in the selected task mode.',
            })
            return
        }

        try {
            setCreatingRecord(true)
            const payload = {
                name: newRecord.name.trim(),
                employee_name: newRecord.name.trim(),
                position: newRecord.position.trim(),
                department: newRecord.department.trim(),
                startDate: newRecord.startDate,
                start_date: newRecord.startDate,
                resignationDate: newRecord.resignationDate,
                resignation_date: newRecord.resignationDate,
                lastDay: newRecord.lastDay,
                last_day: newRecord.lastDay,
                tasks: cleanedTasks,
                status: 'PENDING',
            }

            const response = await fetch(`${getApiUrl()}/api/clearance-checklist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`
                try {
                    const errorData = await response.json()
                    const errors = errorData?.errors ? Object.values(errorData.errors).flat() : []
                    if (errors.length > 0 && typeof errors[0] === 'string') {
                        errorMessage = `${errorMessage} - ${errors[0]}`
                    }
                } catch {
                }
                throw new Error(errorMessage)
            }

            toast.success('Clearance Record Created', {
                description: `${newRecord.name} has been added successfully.`,
            })
            router.push('/admin-head/forms/clearance-checklist')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create clearance record'
            toast.error('Create Record Failed', {
                description: message,
            })
        } finally {
            setCreatingRecord(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <header className="-mx-8 -mt-8 mb-8 bg-[#a0153e] text-white px-10 py-10 shadow-lg">
                <div className="max-w-[1000px] mx-auto flex justify-between items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight italic">Add Clearance Record</h1>
                        <p className="text-rose-100 mt-2">Create a new clearance checklist record.</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/admin-head/forms/clearance-checklist')} className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/20 h-12 px-8">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Checklist
                    </Button>
                </div>
            </header>

            <main className="max-w-[1000px] mx-auto p-8">
                <Card className="rounded-[2rem] border-none shadow-2xl bg-white p-8 space-y-6">
                    <div>
                        <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Employee Name</p>
                        <Popover open={employeePickerOpen} onOpenChange={setEmployeePickerOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start rounded-xl border-slate-200 h-11 font-normal">
                                    {newRecord.name || 'Select employed employee'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-200 shadow-xl">
                                <Command>
                                    <CommandInput placeholder="Search records..." />
                                    <CommandList>
                                        <CommandEmpty>No employed employees found.</CommandEmpty>
                                        <CommandGroup>
                                            {employedEmployees.map((record) => (
                                                <CommandItem
                                                    key={record.id}
                                                    onSelect={() => {
                                                        setNewRecord(prev => ({
                                                            ...prev,
                                                            name: record.name,
                                                            startDate: record.startDate || prev.startDate,
                                                            position: record.position || prev.position,
                                                            department: record.department || prev.department,
                                                        }))
                                                        setEmployeePickerOpen(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", newRecord.name === record.name ? "opacity-100" : "opacity-0")} />
                                                    {record.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Position</p>
                            <Select value={newRecord.position || ''} onValueChange={(value) => setNewRecord(prev => ({ ...prev, position: value }))}>
                                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {modalPositionOptions.map((name) => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Department</p>
                            <Select value={newRecord.department || ''} onValueChange={(value) => setNewRecord(prev => ({ ...prev, department: value }))}>
                                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {modalDepartmentOptions.map((name) => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Start Date</p>
                            <Input type="date" value={newRecord.startDate} onChange={(e) => setNewRecord(prev => ({ ...prev, startDate: e.target.value }))} className="rounded-xl border-slate-200 h-11" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Resignation Date</p>
                            <Input type="date" value={newRecord.resignationDate} onChange={(e) => setNewRecord(prev => ({ ...prev, resignationDate: e.target.value }))} className="rounded-xl border-slate-200 h-11" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Last Day</p>
                            <Input type="date" value={newRecord.lastDay} onChange={(e) => setNewRecord(prev => ({ ...prev, lastDay: e.target.value }))} className="rounded-xl border-slate-200 h-11" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-[#a0153e]" />
                                <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em]">Task Source</p>
                            </div>
                            <Select value={taskMode} onValueChange={(value) => handleTaskModeChange(value as 'default' | 'custom')}>
                                <SelectTrigger className="w-[180px] rounded-xl border-slate-200 h-10 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="default">Default Tasks</SelectItem>
                                    <SelectItem value="custom">Custom Tasks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-600">
                                {taskMode === 'default'
                                    ? 'Preview (default tasks are locked)'
                                    : 'Preview (you can edit, add, or remove tasks)'}
                            </p>

                            {tasks.length === 0 && (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white py-6 px-4 text-center">
                                    <p className="text-sm text-slate-500">No tasks yet.</p>
                                </div>
                            )}

                            {tasks.map((task, index) => (
                                <div key={task.id} className="flex items-center gap-2">
                                    <Badge className="bg-slate-200 text-slate-700 border-none px-2.5 py-1 rounded-full">
                                        {index + 1}
                                    </Badge>
                                    {taskMode === 'default' ? (
                                        <div className="flex-1 rounded-xl border border-slate-200 bg-white h-10 px-3 flex items-center text-sm text-slate-700">
                                            {task.task}
                                        </div>
                                    ) : (
                                        <Input
                                            value={task.task}
                                            onChange={(e) => updateTaskText(task.id, e.target.value)}
                                            placeholder="Enter task name"
                                            className="rounded-xl border-slate-200 h-10 bg-white"
                                        />
                                    )}
                                    {taskMode === 'custom' && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeTask(task.id)}
                                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {taskMode === 'custom' && (
                            <Button
                                type="button"
                                onClick={addTask}
                                variant="ghost"
                                className="rounded-full text-[#a0153e] font-bold bg-[#a0153e]/5 hover:bg-[#a0153e]/10 px-5"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Custom Task
                            </Button>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => router.push('/admin-head/forms/clearance-checklist')} className="rounded-full">
                            Cancel
                        </Button>
                        <Button onClick={handleCreateRecord} disabled={creatingRecord} className="rounded-full bg-[#a0153e] hover:bg-[#801030] text-white">
                            <Plus className="mr-2 h-4 w-4" /> {creatingRecord ? 'Creating...' : 'Create Record'}
                        </Button>
                    </div>
                </Card>
            </main>
        </div>
    )
}
