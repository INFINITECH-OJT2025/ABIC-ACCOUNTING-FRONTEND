//forms onboarding


"use client"


import React, { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Separator } from '@/components/ui/separator'
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Save, Lock, ChevronLeft, ChevronRight, Check, Trash2, Plus, LayoutDashboard, ClipboardList, TriangleAlert, FolderPlus, Filter, ArrowUpDown, ListFilter, CheckCircle2, CircleDashed, Clock3, History, ArrowUpAZ, ArrowDownAZ, ChevronDown, Users, Loader2, X
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from "@/lib/utils"
import { getApiUrl } from '@/lib/api'
import { ensureOkResponse } from '@/lib/api/error-message'
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


interface OnboardingRecord {
  id: string
  name: string
  startDate: string
  position: string
  department: string
  status: string
  updatedAt: string
  tasks: ChecklistTask[]
}


interface NamedOption {
  name: string
}

interface DepartmentOption {
  id: number
  name: string
}

const buildBlankRecord = (departmentName: string): OnboardingRecord => ({
  id: '',
  name: '',
  startDate: '',
  position: '',
  department: departmentName,
  status: 'PENDING',
  updatedAt: '',
  tasks: [],
})


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


const normalizeRecord = (record: any): OnboardingRecord => ({
  id: String(record?.id ?? ''),
  name: String(record?.name ?? ''),
  startDate: String(record?.startDate ?? ''),
  position: String(record?.position ?? ''),
  department: String(record?.department ?? ''),
  status: String(record?.status ?? ''),
  updatedAt: String(record?.updated_at ?? record?.updatedAt ?? ''),
  tasks: normalizeTasks(record?.tasks),
})

const normalizeTemplateRecord = (record: any): OnboardingRecord => ({
  id: String(record?.id ?? ''),
  name: '',
  startDate: '',
  position: '',
  department: String(record?.department_name ?? ''),
  status: 'PENDING',
  updatedAt: String(record?.updated_at ?? ''),
  tasks: normalizeTasks(record?.tasks),
})


const getRecordCompletionPercentage = (record: OnboardingRecord) => {
  if (!record.tasks.length) return 0
  const doneCount = record.tasks.filter((task) => task.status === 'DONE').length
  return Math.round((doneCount / record.tasks.length) * 100)
}


const isRecordDone = (record: OnboardingRecord) =>
  String(record.status).toUpperCase() === 'DONE' || getRecordCompletionPercentage(record) === 100


export default function OnboardingChecklistPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen p-8 bg-slate-50"><Loader2 className="animate-spin h-8 w-8 text-[#630C22]" /></div>}>
      <OnboardingChecklistPageContent />
    </Suspense>
  )
}


function OnboardingChecklistPageContent() {
  const searchParams = useSearchParams()
  const targetName = searchParams.get('name')
  const editMode = true
  const [saving, setSaving] = useState(false)
  const [creatingRecord, setCreatingRecord] = useState(false)
  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [taskIdToDelete, setTaskIdToDelete] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [records, setRecords] = useState<OnboardingRecord[]>([])
  const [employeeInfo, setEmployeeInfo] = useState<OnboardingRecord | null>(null)
  const [departmentsData, setDepartmentsData] = useState<DepartmentOption[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [positionOptions, setPositionOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [newRecord, setNewRecord] = useState({
    name: '',
    position: '',
    department: '',
    startDate: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recordStatusFilter, setRecordStatusFilter] = useState<RecordStatusFilter>('ALL')
  const [recordSort, setRecordSort] = useState<RecordSort>('UPDATED_DESC')
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [unsavedPromptOpen, setUnsavedPromptOpen] = useState(false)
  const [pendingDepartmentSelection, setPendingDepartmentSelection] = useState<string | null>(null)
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null)


  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${getApiUrl()}/api/department-checklist-templates?checklist_type=ONBOARDING`, {
          headers: { Accept: 'application/json' },
        })


        await ensureOkResponse(response, 'Unable to load onboarding checklist templates right now.')


        const result = await response.json()
        const data = Array.isArray(result?.data) ? result.data.map(normalizeTemplateRecord) : []
        setRecords(data)


        if (data.length > 0) {
          let indexToSelect = 0


          // Auto-select based on search param
          if (targetName) {
            const target = targetName.toLowerCase()
            const matchingIndex = data.findIndex((r: OnboardingRecord) =>
              r.name.toLowerCase() === target || String(r.department || '').toLowerCase() === target
            )
            if (matchingIndex !== -1) {
              indexToSelect = matchingIndex
            }
          }


          const selected = data[indexToSelect]
          setCurrentIndex(indexToSelect)
          setEmployeeInfo(selected)
          setTasks(selected.tasks)
          if (selected?.department) {
            const departmentMatch = departmentsData.find((item) => item.name === selected.department)
            setSelectedDepartmentId(departmentMatch?.id ?? null)
          }
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
          const rows = Array.isArray(departmentsData?.data)
            ? (departmentsData.data as DepartmentOption[])
              .filter((item): item is DepartmentOption => Number.isFinite(Number(item?.id)) && typeof item?.name === 'string')
            : []
          const sortedRows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
          setDepartmentsData(sortedRows)
          setDepartmentOptions(sortedRows.map((item) => item.name))
        }
      } catch {
      }
    }


    fetchOptions()
  }, [])

  useEffect(() => {
    if (!employeeInfo?.department) return
    const departmentMatch = departmentsData.find((item) => item.name === employeeInfo.department)
    setSelectedDepartmentId(departmentMatch?.id ?? null)
  }, [employeeInfo?.department, departmentsData])

  useEffect(() => {
    if (loading) return
    if (employeeInfo) return
    const firstDepartment = departmentOptions[0]
    if (!firstDepartment) return
    const blank = buildBlankRecord(firstDepartment)
    setEmployeeInfo(blank)
    setTasks([])
    const departmentMatch = departmentsData.find((item) => item.name === firstDepartment)
    setSelectedDepartmentId(departmentMatch?.id ?? null)
  }, [loading, employeeInfo, departmentOptions, departmentsData])


  const completionPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((doneTasks / tasks.length) * 100);
  }, [tasks]);
  const completionDateText = useMemo(() => {
    const value = employeeInfo?.updatedAt
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [employeeInfo?.updatedAt])


  const positionSelectOptions = useMemo(() => {
    const current = employeeInfo?.position?.trim()
    return [...new Set([...(current ? [current] : []), ...positionOptions])]
  }, [employeeInfo?.position, positionOptions])


  const departmentSelectOptions = useMemo(() => {
    const current = employeeInfo?.department?.trim()
    return [...new Set([...(current ? [current] : []), ...departmentOptions])]
  }, [employeeInfo?.department, departmentOptions])

  const departmentTemplateRecords = useMemo(() => {
    const parseTime = (value: string) => {
      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }
    const latestByDepartment = new Map<string, { record: OnboardingRecord; index: number; department: string }>()
    records.forEach((record, index) => {
      const department = String(record.department || '').trim() || 'Unassigned'
      const key = department.toLowerCase()
      const current = latestByDepartment.get(key)
      if (!current || parseTime(record.updatedAt) >= parseTime(current.record.updatedAt)) {
        latestByDepartment.set(key, { record, index, department })
      }
    })
    return Array.from(latestByDepartment.values()).sort((a, b) => a.department.localeCompare(b.department))
  }, [records])


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

  const selectRecordByDepartment = (department: string) => {
    const departmentMeta = departmentsData.find((item) => item.name === department)
    setSelectedDepartmentId(departmentMeta?.id ?? null)

    const selected = departmentTemplateRecords.find((entry) => entry.department === department)
    if (!selected) {
      const blank = buildBlankRecord(department)
      setCurrentIndex(0)
      setEmployeeInfo(blank)
      setTasks([])
      return
    }

    setCurrentIndex(selected.index)
    setEmployeeInfo(selected.record)
    setTasks(normalizeTasks(selected.record.tasks))
  }

  const requestDepartmentChange = (department: string) => {
    const currentDepartment = String(employeeInfo?.department || '').trim()
    if (hasUnsavedChanges && department !== currentDepartment) {
      setPendingDepartmentSelection(department)
      setPendingNavigationUrl(null)
      setUnsavedPromptOpen(true)
      return
    }
    selectRecordByDepartment(department)
  }

  const clearUnsavedIntents = () => {
    setPendingDepartmentSelection(null)
    setPendingNavigationUrl(null)
  }

  const proceedWithoutSaving = () => {
    const department = pendingDepartmentSelection
    const route = pendingNavigationUrl
    setUnsavedPromptOpen(false)
    clearUnsavedIntents()

    if (department) {
      selectRecordByDepartment(department)
      return
    }
    if (route) {
      window.location.href = route
    }
  }

  const savedTaskCount = useMemo(() => {
    const departmentName = String(employeeInfo?.department || '').trim()
    if (!departmentName) return 0
    const selected = records.find((record) => String(record.department || '').trim() === departmentName)
    if (!selected) return 0
    return selected.tasks.filter((row) => String(row.task || '').trim().length > 0).length
  }, [employeeInfo?.department, records])

  const hasUnsavedChanges = useMemo(() => {
    const departmentName = String(employeeInfo?.department || '').trim()
    if (!departmentName) return false
    const savedRecord = records.find((record) => String(record.department || '').trim() === departmentName)
    const currentTasks = tasks
      .map((row) => row.task.trim())
      .filter((task) => task.length > 0)
    const savedTasks = (savedRecord?.tasks ?? [])
      .map((row) => String(row.task || '').trim())
      .filter((task) => task.length > 0)
    return JSON.stringify(currentTasks) !== JSON.stringify(savedTasks)
  }, [employeeInfo?.department, records, tasks])


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


  const resetNewRecord = () => {
    setNewRecord({
      name: '',
      position: '',
      department: '',
      startDate: '',
    })
  }


  const toggleAllTasks = () => {
    if (!employeeInfo) return
    const allCompleted = tasks.every(task => task.status === 'DONE')
    const updatedTasks: ChecklistTask[] = tasks.map(t => ({
      ...t,
      status: (allCompleted ? 'PENDING' : 'DONE') as TaskStatus,
      date: allCompleted ? '' : new Date().toLocaleDateString('en-CA')
    }))
    setTasks(updatedTasks)


    if (!editMode) {
      persistTaskStatus(updatedTasks, tasks)
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
      const response = await fetch(`${getApiUrl()}/api/onboarding-checklist/${employeeInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      })


      await ensureOkResponse(response, 'Unable to update this task status right now.')


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


  const handleSave = async (): Promise<boolean> => {
    if (!employeeInfo) return false


    try {
      setSaving(true)
      const departmentName = String(employeeInfo.department || '').trim()
      const departmentId = selectedDepartmentId ?? departmentsData.find((row) => row.name === departmentName)?.id ?? null
      if (!departmentId) {
        throw new Error('Please select a valid department before saving.')
      }

      const payloadTasks = tasks
        .map((row, index) => ({
          task: row.task.trim(),
          sort_order: index + 1,
          is_active: true,
        }))
        .filter((row) => row.task.length > 0)

      if (payloadTasks.length === 0) {
        throw new Error('Please add at least one checklist task before saving.')
      }

      const duplicateTask = (() => {
        const seen = new Set<string>()
        for (const row of payloadTasks) {
          const normalized = row.task.toLowerCase()
          if (seen.has(normalized)) return row.task
          seen.add(normalized)
        }
        return null
      })()

      if (duplicateTask) {
        throw new Error(`The task "${duplicateTask}" is duplicated. Please keep task names unique.`)
      }

      const payload = {
        department_id: departmentId,
        checklist_type: 'ONBOARDING',
        tasks: payloadTasks,
      }


      const response = await fetch(`${getApiUrl()}/api/department-checklist-templates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })


      await ensureOkResponse(response, 'Unable to save the checklist template.')


      const result = await response.json()
      const updated = normalizeTemplateRecord(result?.data)
      setSelectedDepartmentId(departmentId)
      setEmployeeInfo(updated)
      setTasks(updated.tasks)
      setRecords((prev) => {
        const remaining = prev.filter((record) => record.department !== updated.department)
        return [...remaining, updated].sort((a, b) => a.department.localeCompare(b.department))
      })
      toast.success('Checklist template saved successfully!', { position: 'top-right' })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save updates'
      toast.error('Save Failed', {
        description: message,
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndContinue = async () => {
    const success = await handleSave()
    if (!success) return

    const department = pendingDepartmentSelection
    const route = pendingNavigationUrl
    setUnsavedPromptOpen(false)
    clearUnsavedIntents()

    if (department) {
      selectRecordByDepartment(department)
      return
    }
    if (route) {
      window.location.href = route
    }
  }

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges) return
      const target = event.target as HTMLElement | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!link) return
      if (link.target === '_blank' || link.hasAttribute('download')) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return

      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      const next = `${url.pathname}${url.search}${url.hash}`
      if (current === next) return

      event.preventDefault()
      setPendingNavigationUrl(url.toString())
      setPendingDepartmentSelection(null)
      setUnsavedPromptOpen(true)
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [hasUnsavedChanges])


  const handleCreateRecord = async () => {
    if (!newRecord.name.trim()) {
      toast.warning('Incomplete Form', {
        description: 'Employee name is required.',
      })
      return
    }

    if (!newRecord.position.trim()) {
      toast.warning('Incomplete Form', {
        description: 'Position is required.',
      })
      return
    }

    if (!newRecord.department.trim()) {
      toast.warning('Incomplete Form', {
        description: 'Department is required.',
      })
      return
    }

    if (!newRecord.startDate) {
      toast.warning('Incomplete Form', {
        description: 'Start date is required.',
      })
      return
    }


    try {
      setCreatingRecord(true)
      const payload = {
        name: newRecord.name.trim(),
        position: newRecord.position.trim(),
        department: newRecord.department.trim(),
        startDate: newRecord.startDate,
        tasks: [],
      }


      const response = await fetch(`${getApiUrl()}/api/onboarding-checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })


      await ensureOkResponse(response, 'Unable to create the onboarding record.')


      const result = await response.json()
      const created = normalizeRecord(result?.data)
      setRecords(prev => {
        const next = [...prev, created]
        setCurrentIndex(next.length - 1)
        return next
      })
      setEmployeeInfo(created)
      setTasks(created.tasks)
      setAddRecordOpen(false)
      resetNewRecord()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create onboarding record'
      toast.error('Create Record Failed', {
        description: message,
      })
    } finally {
      setCreatingRecord(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-12">
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
                <div key={`onboarding-task-skeleton-${idx}`} className="flex items-center gap-4">
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


  if (error) {
    return <div className="p-8 text-rose-600">Failed to load onboarding checklist: {error}</div>
  }


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-12">
      {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
      {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-8">
        {/* Main Header Row */}
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Onboarding Checklist</h1>
              <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                ABIC REALTY & CONSULTANCY
              </p>
            </div>


            <div />
          </div>
        </div>


        {/* Secondary Toolbar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4">


              


              {/* Department Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Department</span>
                <Select
                  value={String(employeeInfo?.department || '').trim() || undefined}
                  onValueChange={requestDepartmentChange}
                >
                  <SelectTrigger className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[240px] shadow-sm font-bold rounded-lg border-2 ring-0 focus:ring-0">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-200 shadow-xl">
                    {departmentSelectOptions.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              


              {/* Updated At */}
              <div className="ml-auto hidden xl:flex items-center gap-4 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Updated</span>
                  <span className="text-sm font-black text-white tracking-tight">{completionDateText}</span>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>


      <main className="w-full px-4 md:px-8 relative mb-20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">




        <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-lg overflow-hidden bg-white mb-6 transition-all hover:shadow-xl">
          <div className="p-5 bg-rose-50/20">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-[11px] font-black text-[#800020]/60 uppercase tracking-widest">Selected Department</p>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
                    Unsaved Changes
                  </span>
                )}
                <span className="inline-flex items-center rounded-full border border-[#FFE5EC] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#A4163A]">
                  {savedTaskCount} Saved Tasks
                </span>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-800 leading-tight">{employeeInfo?.department || '-'}</p>
          </div>
        </Card>


        {/* Task List Section */}
        <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-2xl bg-white overflow-hidden mb-12">


          <Table>
            <TableHeader className="bg-[#FFE5EC]/40">
              <TableRow className="border-b border-[#FFE5EC] hover:bg-transparent">
                <TableHead className="font-black text-[#800020] uppercase tracking-[0.12em] text-[12px] py-3">
                  <span>Required Onboarding Tasks</span>
                </TableHead>
                <TableHead className="w-[80px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[12px] py-3">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((item) => (
                <TableRow key={item.id} className="border-b border-rose-50/30 last:border-0 hover:bg-[#FFE5EC]/5 transition-colors group">
                  <TableCell className="py-2.5">
                    {editMode ? (
                      <Input
                        value={item.task}
                        onChange={(e) => updateTaskText(item.id, e.target.value)}
                        className={cn(
                          "h-8 border-transparent bg-transparent hover:border-[#FFE5EC]/50 focus:border-[#A4163A] focus-visible:ring-0 transition-all font-bold px-0 text-lg",
                          item.status === 'DONE' ? "text-slate-300 line-through" : "text-slate-700"
                        )}
                        placeholder="Define onboarding task..."
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
                      <Trash2 className="h-5.5 w-5.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}


              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-24 text-center">
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
              <Separator orientation="vertical" className="h-4 bg-slate-200" />
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                ADMINISTRATION FRAMEWORK • ABIC HR
              </p>
            </div>


            <div className="flex gap-3">
              <Button
                onClick={() => setSaveConfirmOpen(true)}
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


      {/* Modals & Dialogs */}
      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent className="sm:max-w-[560px] border-4 border-[#FFE5EC] p-0 overflow-hidden rounded-3xl shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users className="w-24 h-24" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight italic">Initiate Record</DialogTitle>
            <DialogDescription className="text-rose-100 text-lg font-medium">
              Create a fresh onboarding checklist pathway.
            </DialogDescription>
          </DialogHeader>


          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-[#800020] uppercase tracking-[0.2em]">Employee Full Name</Label>
              <Input
                value={newRecord.name}
                onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex. Juan Dela Cruz"
                className="rounded-xl border-[#FFE5EC] border-2 h-14 text-lg font-bold focus:ring-[#800020]/10 focus:border-[#800020]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-[#800020] uppercase tracking-[0.2em]">Official Position</Label>
                <Input
                  value={newRecord.position}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Ex. Senior Accountant"
                  className="rounded-xl border-[#FFE5EC] border-2 h-14 text-lg font-bold focus:ring-[#800020]/10 focus:border-[#800020]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-[#800020] uppercase tracking-[0.2em]">Department</Label>
                <Input
                  value={newRecord.department}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Ex. Finance"
                  className="rounded-xl border-[#FFE5EC] border-2 h-14 text-lg font-bold focus:ring-[#800020]/10 focus:border-[#800020]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-[#800020] uppercase tracking-[0.2em]">Onboarding Start Date</Label>
              <Input
                type="date"
                value={newRecord.startDate}
                onChange={(e) => setNewRecord(prev => ({ ...prev, startDate: e.target.value }))}
                className="rounded-xl border-[#FFE5EC] border-2 h-14 text-lg font-bold focus:ring-[#800020]/10 focus:border-[#800020]"
              />
            </div>
          </div>


          <DialogFooter className="px-8 pb-8 pt-2 bg-white flex flex-row gap-4">
            <Button variant="ghost" onClick={() => { setAddRecordOpen(false); resetNewRecord(); }} className="flex-1 rounded-xl h-14 font-black text-slate-400 hover:text-slate-600 hover:bg-rose-50 transition-all">
              DISCARD
            </Button>
            <Button onClick={handleCreateRecord} disabled={creatingRecord} className="flex-2 px-10 rounded-xl bg-gradient-to-r from-[#A4163A] to-[#630C22] hover:shadow-xl active:scale-95 text-white font-black h-14 transition-all uppercase tracking-widest text-xs">
              {creatingRecord ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent className="border-4 border-[#FFE5EC] rounded-3xl p-8 bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Save Department Tasks?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              You are about to save changes for {employeeInfo?.department || 'the selected department'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border border-[#FFE5EC] bg-rose-50/30 p-4 text-sm font-semibold text-slate-700">
            Tasks to save: {tasks.filter((row) => row.task.trim().length > 0).length}
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-2">
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={async () => {
                setSaveConfirmOpen(false)
                await handleSave()
              }}
            >
              {saving ? 'Saving...' : 'Confirm Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unsavedPromptOpen} onOpenChange={setUnsavedPromptOpen}>
        <AlertDialogContent className="max-w-2xl border-4 border-amber-300 rounded-3xl p-0 bg-white shadow-2xl overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300" />
          <div className="p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Unsaved Changes Detected</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-base leading-relaxed mt-2">
              You have unsaved changes. You can save first, or continue without saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-6">
            <AlertDialogCancel
              className="h-12 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
              onClick={() => {
                setUnsavedPromptOpen(false)
                clearUnsavedIntents()
              }}
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-12 rounded-xl bg-[#A4163A] text-white hover:bg-[#800020] font-bold shadow-md"
              onClick={proceedWithoutSaving}
            >
              Proceed Without Saving
            </AlertDialogAction>
            <AlertDialogAction
              className="h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-md"
              onClick={() => void handleSaveAndContinue()}
            >
              Save and Continue
            </AlertDialogAction>
          </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog open={taskIdToDelete !== null} onOpenChange={(open) => { if (!open) setTaskIdToDelete(null) }}>
        <AlertDialogContent className="border-4 border-[#FFE5EC] rounded-3xl p-8 bg-white shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#A4163A] border-4 border-[#FFE5EC]">
              <TriangleAlert className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center text-slate-900">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg text-slate-500 font-medium">
              You are about to remove this task from the checklist. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-4 mt-8">
            <AlertDialogCancel onClick={() => setTaskIdToDelete(null)} className="h-12 rounded-xl font-bold border-2 border-[#FFE5EC] hover:bg-rose-50 text-slate-600">Retain Task</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#A4163A] text-white hover:bg-[#800020] h-12 rounded-xl font-bold px-8 shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs"
              onClick={() => {
                if (taskIdToDelete !== null) removeTask(taskIdToDelete)
                setTaskIdToDelete(null)
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

