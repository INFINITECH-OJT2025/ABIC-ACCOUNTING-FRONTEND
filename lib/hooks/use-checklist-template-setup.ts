"use client"

import { useEffect, useState } from "react"
import { getApiUrl } from "@/lib/api"
import { ensureOkResponse } from "@/lib/api/error-message"
import { useQuery } from "@tanstack/react-query"

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
  const [reloadToken, setReloadToken] = useState(0)

  const templatesQuery = useQuery({
    queryKey: ["department-checklist-templates", checklistType, reloadToken],
    queryFn: async (): Promise<TRecord[]> => {
      const response = await fetch(`${getApiUrl()}/api/department-checklist-templates?checklist_type=${checklistType}`, {
        headers: { Accept: "application/json" },
      })
      await ensureOkResponse(response, `Unable to load ${checklistType.toLowerCase()} checklist templates right now.`)
      const result = await response.json()
      return Array.isArray(result?.data) ? result.data.map(normalizeTemplateRecord) : []
    },
  })

  const optionsQuery = useQuery({
    queryKey: ["checklist-options", reloadToken],
    queryFn: async () => {
      const [positionsResponse, departmentsResponse] = await Promise.all([
        fetch(`${getApiUrl()}/api/positions`, { headers: { Accept: "application/json" } }),
        fetch(`${getApiUrl()}/api/departments`, { headers: { Accept: "application/json" } }),
      ])

      const positionNames = positionsResponse.ok
        ? await positionsResponse.json().then((positionsData) =>
            Array.isArray(positionsData?.data)
              ? (positionsData.data as NamedOption[]).map((item) => item.name).filter((name): name is string => !!name)
              : []
          )
        : []

      const departmentRows = departmentsResponse.ok
        ? await departmentsResponse.json().then((rowsData) =>
            Array.isArray(rowsData?.data)
              ? (rowsData.data as DepartmentOption[]).filter(
                  (item): item is DepartmentOption => Number.isFinite(Number(item?.id)) && typeof item?.name === "string"
                )
              : []
          )
        : []

      const sortedRows = [...departmentRows].sort((a, b) => a.name.localeCompare(b.name))
      return {
        positionOptions: [...new Set(positionNames)],
        departmentsData: sortedRows,
        departmentOptions: sortedRows.map((item) => item.name),
      }
    },
  })

  useEffect(() => {
    if (!optionsQuery.data) return
    setPositionOptions(optionsQuery.data.positionOptions)
    setDepartmentsData(optionsQuery.data.departmentsData)
    setDepartmentOptions(optionsQuery.data.departmentOptions)
  }, [optionsQuery.data])

  useEffect(() => {
    const data = templatesQuery.data ?? []
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
  }, [templatesQuery.data, targetName, departmentsData])

  useEffect(() => {
    if (!employeeInfo?.department) return
    const departmentMatch = departmentsData.find((item) => item.name === employeeInfo.department)
    setSelectedDepartmentId(departmentMatch?.id ?? null)
  }, [employeeInfo?.department, departmentsData])

  useEffect(() => {
    if (templatesQuery.isLoading || optionsQuery.isLoading) return
    if ((templatesQuery.data?.length ?? 0) > 0) return
    if (employeeInfo) return
    const firstDepartment = departmentOptions[0]
    if (!firstDepartment) return
    const blank = buildBlankRecord(firstDepartment)
    setEmployeeInfo(blank)
    setTasks([])
    const departmentMatch = departmentsData.find((item) => item.name === firstDepartment)
    setSelectedDepartmentId(departmentMatch?.id ?? null)
  }, [templatesQuery.isLoading, optionsQuery.isLoading, employeeInfo, departmentOptions, departmentsData, buildBlankRecord])

  // Reconcile tasks from fetched records if a transient blank initialization happened first.
  useEffect(() => {
    if (!employeeInfo?.department) return
    if (tasks.length > 0) return
    const matched = records.find(
      (row) => String(row.department || "").trim().toLowerCase() === String(employeeInfo.department || "").trim().toLowerCase()
    )
    if (!matched || matched.tasks.length === 0) return

    setEmployeeInfo(matched)
    setTasks(matched.tasks)
  }, [employeeInfo, tasks.length, records])

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
    loading: templatesQuery.isLoading || optionsQuery.isLoading,
    error:
      (templatesQuery.error instanceof Error ? templatesQuery.error.message : null) ??
      (optionsQuery.error instanceof Error ? optionsQuery.error.message : null),
    reloadToken,
    setReloadToken,
  }
}
