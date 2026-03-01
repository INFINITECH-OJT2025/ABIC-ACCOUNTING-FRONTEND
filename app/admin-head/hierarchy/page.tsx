"use client"

import { useMemo, useState, useEffect } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, GitBranch, Plus, ShieldCheck, Users } from "lucide-react"
import { getApiUrl } from "@/lib/api"
import { toast } from "sonner"

type Department = {
  id: string
  name: string
  color: string
}

type PositionNode = {
  id: string
  title: string
  role: string
  departmentId: string
  parentId: string
  createdAt: number
}

function titleToId(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

function NodePill({ label, variant = "staff" }: { label: string; variant?: "staff" | "dept" | "exec" | "admin" }) {
  const styles = {
    staff: "bg-white text-slate-700 border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300",
    dept: "text-white border-transparent shadow-md",
    exec: "bg-gradient-to-r from-violet-600 to-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20",
    admin: "bg-gradient-to-r from-rose-500 to-orange-400 text-white border-transparent shadow-lg shadow-rose-500/20",
  }

  return (
    <div className={`rounded-xl border-2 px-6 py-2.5 text-center text-xs font-bold tracking-wide transition-all duration-200 ${styles[variant]}`}>
      {label}
    </div>
  )
}

function HierarchyBranch({ node, allNodes }: { node: PositionNode; allNodes: PositionNode[] }) {
  const children = allNodes.filter((item) => item.parentId === node.id)

  return (
    <div className="space-y-3">
      <NodePill label={node.title} variant="staff" />
      {children.length > 0 && (
        <div className="relative ml-6 border-l-[1.5px] border-slate-200 pl-6">
          <div className="space-y-4 py-1">
            {children.map((child) => (
              <div key={child.id} className="relative">
                <div className="absolute -left-6 top-5 h-[1.5px] w-6 bg-slate-200" />
                <HierarchyBranch node={child} allNodes={allNodes} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminHeadHierarchyPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<PositionNode[]>([])
  const [availablePositions, setAvailablePositions] = useState<string[]>([])

  const [departmentName, setDepartmentName] = useState("")
  const [departmentColor, setDepartmentColor] = useState("#59D2DE")

  const [positionTitle, setPositionTitle] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedParent, setSelectedParent] = useState("admin-head")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [deptRes, hierRes, posRes] = await Promise.all([
          fetch(getApiUrl() + '/api/departments', { headers: { Accept: 'application/json' } }),
          fetch(getApiUrl() + '/api/hierarchies', { headers: { Accept: 'application/json' } }),
          fetch(getApiUrl() + '/api/positions', { headers: { Accept: 'application/json' } })
        ])
        const deptData = await deptRes.json()
        const hierData = await hierRes.json()
        const posData = await posRes.json()
        
        const mappedDeps = (Array.isArray(deptData?.data) ? deptData.data : (Array.isArray(deptData) ? deptData : [])).map((d: any) => ({
          id: d.id.toString(),
          name: d.name,
          color: d.color || '#59D2DE'
        }))
        setDepartments(mappedDeps)

        const hierArray = Array.isArray(hierData?.data) ? hierData.data : (Array.isArray(hierData) ? hierData : [])
        const mappedPos = hierArray.map((h: any) => ({
          id: h.id.toString(),
          title: h.position?.name || 'Unknown',
          role: h.role || '',
          departmentId: h.department_id ? h.department_id.toString() : 'core',
          parentId: h.parent_id ? h.parent_id.toString() : 'admin-head',
          createdAt: new Date(h.created_at).getTime()
        }))
        setPositions(mappedPos)

        const posArray = Array.isArray(posData?.data) ? posData.data : (Array.isArray(posData) ? posData : [])
        setAvailablePositions(posArray.map((p: any) => p.name))

      } catch (err) {
        console.error("Failed to load hierarchy data", err)
      }
    }
    fetchData()
  }, [])

  const parentOptions = useMemo(() => {
    if (!selectedDepartment) return []
    return positions.filter((item) => item.departmentId === selectedDepartment)
  }, [positions, selectedDepartment])

  const recentlyAdded = useMemo(() => {
    return [...positions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
  }, [positions])

  const handleAddDepartment = async () => {
    const cleanName = departmentName.trim()
    if (!cleanName) return

    setLoading(true)
    try {
      const res = await fetch(getApiUrl() + '/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: cleanName,
          is_custom: true,
          color: departmentColor
        })
      })
      if (!res.ok) throw new Error('Failed to create department')
      const result = await res.json()
      const d = result.data || result
      
      setDepartments((prev) => [...prev, {
        id: d.id.toString(),
        name: d.name,
        color: d.color || '#59D2DE'
      }])
      setDepartmentName("")
      setDepartmentColor("#59D2DE")
      toast?.success("Department created and saved.")
    } catch (err) {
      console.error(err)
      toast?.error("Failed to create department.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPosition = async () => {
    const cleanTitle = positionTitle.trim()

    if (!cleanTitle || !selectedDepartment) return

    setLoading(true)
    try {
      const posRes = await fetch(getApiUrl() + '/api/positions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          positions: [cleanTitle],
          department_id: selectedDepartment === 'core' ? null : Number(selectedDepartment)
        })
      })
      if (!posRes.ok) throw new Error('Failed to create position')
      const posResult = await posRes.json()
      const p = posResult.data[0] || posResult[0]

      const hierRes = await fetch(getApiUrl() + '/api/hierarchies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          position_id: p.id,
          department_id: selectedDepartment === 'core' ? null : Number(selectedDepartment),
          parent_id: selectedParent === 'admin-head' ? null : Number(selectedParent),
          role: cleanTitle
        })
      })
      if (!hierRes.ok) throw new Error('Failed to create hierarchy link')
      const hResult = await hierRes.json()
      const h = hResult.data || hResult

      setPositions((prev) => [
        ...prev,
        {
          id: h.id.toString(),
          title: cleanTitle,
          role: cleanTitle,
          departmentId: selectedDepartment,
          parentId: selectedParent || "admin-head",
          createdAt: Date.now(),
        },
      ])

      setPositionTitle("")
      setSelectedParent("admin-head")
      toast?.success("Position successfully added to hierarchy.")
    } catch (err) {
      console.error(err)
      toast?.error("Failed to add position.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Hierarchy Management</h1>
              <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Add departments, positions, and roles following your organization flow.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-white/15 border border-white/30 text-white hover:bg-white/15 text-xs font-bold tracking-wider px-3 py-2">
                ADMIN HEAD PANEL
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-bold uppercase tracking-wider text-white/85">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <Building2 className="h-4 w-4" />
                Departments: {departments.length}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <Users className="h-4 w-4" />
                Staff Positions: {positions.length}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <ShieldCheck className="h-4 w-4" />
                Top Hierarchy: Executive Officer {">"} Admin Head
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 border-2 border-[#FFE5EC]">
          <CardHeader>
            <CardTitle className="text-[#630C22]">Setup Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Department</Label>
              <Input
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
                placeholder="Department name"
                className="h-10"
              />
              <div className="flex items-center gap-3">
                <Label htmlFor="dept-color" className="text-xs font-bold uppercase tracking-wider text-slate-500">Color</Label>
                <Input
                  id="dept-color"
                  type="color"
                  value={departmentColor}
                  onChange={(event) => setDepartmentColor(event.target.value)}
                  className="h-10 w-20 p-1"
                />
                <Button onClick={handleAddDepartment} disabled={loading} className="ml-auto bg-[#A4163A] hover:bg-[#7B0F2B]">
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>

            <div className="h-px w-full bg-slate-200" />

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Position / Role</Label>
              <Input
                value={positionTitle}
                onChange={(event) => setPositionTitle(event.target.value)}
                placeholder="Position title"
                className="h-10"
                list="available-positions"
              />
              <datalist id="available-positions">
                {availablePositions.map((posName) => (
                  <option key={posName} value={posName} />
                ))}
              </datalist>
              <Select
                value={selectedDepartment}
                onValueChange={(value) => {
                  setSelectedDepartment(value)
                  setSelectedParent("admin-head")
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core Position / Staff</SelectItem>
                  {departments.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Reports to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin-head">Admin Head</SelectItem>
                  {parentOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleAddPosition} disabled={loading} className="w-full bg-[#630C22] hover:bg-[#4A081A]">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add Position to Hierarchy'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-2 border-[#FFE5EC]">
          <CardHeader>
            <CardTitle className="text-[#630C22]">Organization Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 overflow-x-auto">
            <div className="min-w-[940px] space-y-6">
              <div className="flex flex-col items-center gap-3">
                <NodePill label="Executive Officer" variant="exec" />
                <div className="h-5 w-px bg-slate-400" />
                <NodePill label="Admin Head" variant="admin" />
              </div>

              <div className="flex justify-center gap-6">
                {positions.filter((item) => item.departmentId === "core" && item.parentId === "admin-head").map((item) => (
                  <NodePill key={item.id} label={item.title} variant="staff" />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {departments.map((department) => {
                  const roots = positions.filter((item) => {
                    if (item.departmentId !== department.id) return false
                    if (item.parentId === "admin-head") return true
                    const parent = positions.find((pos) => pos.id === item.parentId)
                    return !parent || parent.departmentId !== department.id
                  })

                  // Use color but add opacity, or use default if weird
                  const headerBg = department.color || '#59D2DE'

                  return (
                    <div key={department.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                      <div
                        className="px-6 py-4 border-b border-black/5 flex items-center gap-3 relative overflow-hidden"
                        style={{ backgroundColor: headerBg }}
                      >
                        <div className="absolute inset-0 bg-white/20" />
                        <Building2 className="w-5 h-5 text-black/60 relative z-10" />
                        <span className="font-bold text-black/80 tracking-wide relative z-10">
                          {department.name}
                        </span>
                      </div>

                      <div className="p-6 flex-1 bg-slate-50/30">
                        <div className="space-y-4 relative">
                          {roots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                               <Users className="w-8 h-8 mb-2 opacity-20" />
                               <p className="text-sm font-medium">No positions assigned</p>
                            </div>
                          ) : (
                            roots.map((root) => <HierarchyBranch key={root.id} node={root} allNodes={positions} />)
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 mt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Staff =</span>
                <div className="h-9 w-24 rounded-xl border-2 border-slate-200 bg-white shadow-sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Departments =</span>
                <div className="h-9 w-24 rounded-xl border border-transparent shadow-md bg-[#59D2DE]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 md:px-8 mt-6">
        <Card className="border-2 border-[#FFE5EC]">
          <CardHeader>
            <CardTitle className="text-[#630C22]">Recently Added Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {recentlyAdded.map((item) => {
                const department = departments.find((dep) => dep.id === item.departmentId)
                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                    <p className="font-bold text-slate-900 uppercase text-xs tracking-wider">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-2 font-semibold uppercase tracking-wider">
                      {department?.name || "Core Position"}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
