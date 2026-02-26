"use client"

import { useEffect, useState } from "react"
import { getApiUrl } from "@/lib/api"
import { ensureOkResponse } from "@/lib/api/error-message"

export type DepartmentOption = {
  id: number
  name: string
}

type NamedOption = {
  name: string
}

type UseChecklistTemplateSetupParams<TTask, TRecord extends { name: string; department: string; tasks: TTask[] }> = {
  checklistType: "ONBOARDING" | "CLEARANCE"
  normalizeTemplateRecord: (record: any) => TRecord
  buildBlankRecord: (departmentName: string) => TRecord
  targetName?: string | null
}

export function useChecklistTemplateSetup<TTask, TRecord extends { name: string; department: string; tasks: TTask[] }>({
  checklistType,
  normalizeTemplateRecord,
  buildBlankRecord,
  targetName,
}: UseChecklistTemplateSetupParams<TTask, TRecord>) {
  const [records, setRecords] = useState<TRecord[]>([])
  const [employeeInfo, setEmployeeInfo] = useState<TRecord | null>(null)
  const [tasks, setTasks] = useState<TTask[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [departmentsData, setDepartmentsData] = useState<DepartmentOption[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [positionOptions, setPositionOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${getApiUrl()}/api/department-checklist-templates?checklist_type=${checklistType}`, {
          headers: { Accept: "application/json" },
        })

        await ensureOkResponse(response, `Unable to load ${checklistType.toLowerCase()} checklist templates right now.`)

        const result = await response.json()
        const data = Array.isArray(result?.data) ? result.data.map(normalizeTemplateRecord) : []
        setRecords(data)

        if (data.length > 0) {
          let indexToSelect = 0

          if (targetName) {
            const target = targetName.toLowerCase()
            const matchingIndex = data.findIndex(
              (r: TRecord) => r.name.toLowerCase() === target || String(r.department || "").toLowerCase() === target
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
        const message = err instanceof Error ? err.message : "Failed to load checklists"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchChecklists()
  }, [checklistType, normalizeTemplateRecord, targetName, reloadToken])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [positionsResponse, departmentsResponse] = await Promise.all([
          fetch(`${getApiUrl()}/api/positions`, { headers: { Accept: "application/json" } }),
          fetch(`${getApiUrl()}/api/departments`, { headers: { Accept: "application/json" } }),
        ])

        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json()
          const names = Array.isArray(positionsData?.data)
            ? (positionsData.data as NamedOption[]).map((item) => item.name).filter((name): name is string => !!name)
            : []
          setPositionOptions([...new Set(names)])
        }

        if (departmentsResponse.ok) {
          const rowsData = await departmentsResponse.json()
          const rows = Array.isArray(rowsData?.data)
            ? (rowsData.data as DepartmentOption[]).filter(
                (item): item is DepartmentOption => Number.isFinite(Number(item?.id)) && typeof item?.name === "string"
              )
            : []
          const sortedRows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
          setDepartmentsData(sortedRows)
          setDepartmentOptions(sortedRows.map((item) => item.name))
        }
      } catch {
      }
    }

    fetchOptions()
  }, [reloadToken])

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
  }, [loading, employeeInfo, departmentOptions, departmentsData, buildBlankRecord])

  return {
    records,
    setRecords,
    employeeInfo,
    setEmployeeInfo,
    tasks,
    setTasks,
    currentIndex,
    setCurrentIndex,
    departmentsData,
    selectedDepartmentId,
    setSelectedDepartmentId,
    positionOptions,
    departmentOptions,
    loading,
    error,
    reloadToken,
    setReloadToken,
  }
}
