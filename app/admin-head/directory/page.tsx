"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'
import { toast } from 'sonner'
import {
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
  ImageUp,
  Images,
  Loader2,
  X,
  Edit3,
  Save,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react'

type ProcessType = 'Adding' | 'Removing'

type BackendContact = {
  id: number
  type: string
  label: string | null
  value: string
  sort_order: number
}

type BackendProcess = {
  id: number
  process_type: string
  process: string
  step_number: number
}

type BackendAgency = {
  id: number
  code: string
  name: string
  full_name: string | null
  summary: string | null
  image_url: string | null
  image_public_id: string | null
  updated_at?: string | null
  contacts: BackendContact[]
  processes: BackendProcess[]
}

type CloudinaryAsset = {
  public_id: string
  secure_url: string
  format: string
  bytes: number
  width: number | null
  height: number | null
  created_at: string | null
}

type EditableContact = {
  id?: number
  type: string
  label: string
  value: string
  sort_order: number
}

type EditableProcess = {
  id?: number
  process_type: ProcessType
  process: string
  step_number: number
}

type EditDraft = {
  name: string
  full_name: string
  summary: string
  contacts: EditableContact[]
  processes: EditableProcess[]
}

type PortalLink = {
  code: string
  label: string
  url: string
}

const ALLOWED_UPLOAD_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'] as const
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const OFFICIAL_PORTALS: PortalLink[] = [
  { code: 'sss', label: 'SSS', url: 'https://member.sss.gov.ph/' },
  { code: 'pagibig', label: 'PAG-IBIG', url: 'https://www.pagibigfundservices.com/' },
  { code: 'philhealth', label: 'PhilHealth', url: 'https://www.philhealth.gov.ph/' },
  { code: 'tin', label: 'TIN (BIR)', url: 'https://www.bir.gov.ph/eServices' },
]

const normalizeCode = (value: string): string => String(value || '').trim().toLowerCase()

const getAgencyIcon = (code: string) => {
  switch (normalizeCode(code)) {
    case 'philhealth':
      return ShieldCheck
    case 'sss':
      return Building2
    case 'pagibig':
      return Landmark
    case 'tin':
      return Fingerprint
    default:
      return Building2
  }
}

const getDetailIcon = (type: string, label: string) => {
  const normalizedType = String(type || '').toLowerCase()
  const normalizedLabel = String(label || '').toLowerCase()

  if (normalizedType.includes('email')) return Mail
  if (normalizedType.includes('website')) return Globe
  if (normalizedType.includes('address')) return MapPin
  if (normalizedType.includes('social')) return MessageCircle
  if (normalizedType.includes('mobile') || normalizedType.includes('hotline')) return Phone
  if (normalizedLabel.includes('email')) return Mail
  if (normalizedLabel.includes('website') || normalizedLabel.includes('official page')) return Globe
  if (normalizedLabel.includes('address') || normalizedLabel.includes('office')) return MapPin
  return Phone
}

export default function GovernmentDirectoryPage() {
  const [activeAgency, setActiveAgency] = useState<string>('')
  const [activeProcess, setActiveProcess] = useState<ProcessType>('Adding')
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [agenciesByCode, setAgenciesByCode] = useState<Record<string, BackendAgency>>({})
  const [loadingDirectory, setLoadingDirectory] = useState(true)
  const [updatingImage, setUpdatingImage] = useState(false)
  const [cloudinaryPickerOpen, setCloudinaryPickerOpen] = useState(false)
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryAsset[]>([])
  const [loadingCloudinaryImages, setLoadingCloudinaryImages] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<CloudinaryAsset | null>(null)
  const [deletingCloudinaryImage, setDeletingCloudinaryImage] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [savingChanges, setSavingChanges] = useState(false)
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        setLoadingDirectory(true)
        const response = await fetch(`${getApiUrl()}/api/directory/agencies`, {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const result = await response.json()
        const rows = Array.isArray(result?.data) ? result.data : []

        const mapped: Record<string, BackendAgency> = {}
        rows.forEach((row: BackendAgency) => {
          const code = normalizeCode(row?.code)
          if (code) mapped[code] = row
        })

        setAgenciesByCode(mapped)
        if (!activeAgency) {
          const firstCode = Object.keys(mapped)[0] ?? ''
          if (firstCode) setActiveAgency(firstCode)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load directory data'
        toast.error('Directory Load Failed', { description: message })
      } finally {
        setLoadingDirectory(false)
      }
    }

    fetchDirectory()
  }, [])

  const mergedAgencies = useMemo(() => {
    return Object.values(agenciesByCode)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((backend) => {
        const code = normalizeCode(backend.code)
        const backendDetails = Array.isArray(backend?.contacts)
          ? [...backend.contacts]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((contact) => ({
              icon: getDetailIcon(contact.type, contact.label ?? ''),
              label: contact.label?.trim() || contact.type,
              value: contact.value,
            }))
          : []

        return {
          key: code,
          shortName: backend?.name?.trim() || code.toUpperCase(),
          fullName: backend?.full_name?.trim() || backend?.name?.trim() || code.toUpperCase(),
          summary: backend?.summary?.trim() || '',
          image: backend?.image_url?.trim() || '',
          icon: getAgencyIcon(code),
          details: backendDetails,
        }
      })
  }, [agenciesByCode])

  const agency = useMemo(
    () => mergedAgencies.find((item) => item.key === activeAgency) ?? mergedAgencies[0] ?? null,
    [activeAgency, mergedAgencies]
  )

  const currentSteps = useMemo(() => {
    const backend = agenciesByCode[activeAgency]
    const fromBackend = Array.isArray(backend?.processes)
      ? backend.processes
        .filter((row) => String(row.process_type || '').toLowerCase() === activeProcess.toLowerCase())
        .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
        .map((row) => row.process)
      : []
    return fromBackend
  }, [activeAgency, activeProcess, agenciesByCode])

  const activeBackendAgency = useMemo(() => agenciesByCode[activeAgency], [agenciesByCode, activeAgency])

  const snapshot = useMemo(() => {
    const contactsCount = editMode && draft
      ? draft.contacts.filter((row) => row.value.trim().length > 0).length
      : (activeBackendAgency?.contacts?.length ?? 0)

    const addingStepsCount = editMode && draft
      ? draft.processes.filter((row) => row.process_type === 'Adding' && row.process.trim().length > 0).length
      : (activeBackendAgency?.processes?.filter((row) => String(row.process_type).toLowerCase() === 'adding').length ?? 0)

    const removingStepsCount = editMode && draft
      ? draft.processes.filter((row) => row.process_type === 'Removing' && row.process.trim().length > 0).length
      : (activeBackendAgency?.processes?.filter((row) => String(row.process_type).toLowerCase() === 'removing').length ?? 0)

    const updatedAt = activeBackendAgency?.updated_at ? new Date(activeBackendAgency.updated_at) : null
    const updatedAtText = updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A'

    return { contactsCount, addingStepsCount, removingStepsCount, updatedAtText }
  }, [activeBackendAgency, editMode, draft])

  const currentProcessDraftRows = useMemo(() => {
    if (!editMode || !draft) return []
    return draft.processes
      .filter((row) => row.process_type === activeProcess)
      .sort((a, b) => a.step_number - b.step_number)
  }, [editMode, draft, activeProcess])

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  const startEditMode = () => {
    const backend = agenciesByCode[activeAgency]
    if (!backend) return

    const contacts = Array.isArray(backend.contacts)
      ? [...backend.contacts]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((row, index) => ({
          id: row.id,
          type: row.type || 'note',
          label: row.label || '',
          value: row.value || '',
          sort_order: row.sort_order ?? (index + 1),
        }))
      : []

    const processes = Array.isArray(backend.processes)
      ? [...backend.processes]
        .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
        .map((row) => ({
          id: row.id,
          process_type: (String(row.process_type).toLowerCase() === 'removing' ? 'Removing' : 'Adding') as ProcessType,
          process: row.process || '',
          step_number: row.step_number || 1,
        }))
      : []

    setDraft({
      name: backend.name || '',
      full_name: backend.full_name || '',
      summary: backend.summary || '',
      contacts,
      processes,
    })
    setShowValidation(false)
    setEditMode(true)
  }

  const cancelEditMode = () => {
    setEditMode(false)
    setDraft(null)
    setShowValidation(false)
  }

  const updateContactAt = (index: number, field: keyof EditableContact, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const contacts = [...prev.contacts]
      const target = contacts[index]
      if (!target) return prev
      contacts[index] = { ...target, [field]: value }
      return { ...prev, contacts }
    })
  }

  const addContact = () => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        contacts: [
          ...prev.contacts,
          { type: 'note', label: '', value: '', sort_order: prev.contacts.length + 1 },
        ],
      }
    })
  }

  const removeContactAt = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      const contacts = prev.contacts.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i + 1 }))
      return { ...prev, contacts }
    })
  }

  const addProcessStep = () => {
    setDraft((prev) => {
      if (!prev) return prev
      const count = prev.processes.filter((row) => row.process_type === activeProcess).length
      return {
        ...prev,
        processes: [...prev.processes, { process_type: activeProcess, process: '', step_number: count + 1 }],
      }
    })
  }

  const updateProcessTextAt = (indexWithinType: number, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      let seen = -1
      const processes = prev.processes.map((row) => {
        if (row.process_type !== activeProcess) return row
        seen += 1
        if (seen !== indexWithinType) return row
        return { ...row, process: value }
      })
      return { ...prev, processes }
    })
  }

  const removeProcessAt = (indexWithinType: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      let seen = -1
      const filtered = prev.processes.filter((row) => {
        if (row.process_type !== activeProcess) return true
        seen += 1
        return seen !== indexWithinType
      })
      const reindexed = filtered.map((row) => row)
        ; (['Adding', 'Removing'] as ProcessType[]).forEach((type) => {
          let step = 1
          reindexed.forEach((row) => {
            if (row.process_type === type) {
              row.step_number = step
              step += 1
            }
          })
        })
      return { ...prev, processes: reindexed }
    })
  }

  const saveDirectoryChanges = async () => {
    if (!draft) return
    try {
      setSavingChanges(true)
      setShowValidation(true)

      const hasInvalidAgencyName = draft.name.trim().length === 0
      const hasInvalidContacts = draft.contacts.some((row) => row.type.trim().length === 0 || row.value.trim().length === 0)
      const hasInvalidProcesses = draft.processes.some((row) => row.process.trim().length === 0)

      if (hasInvalidAgencyName || hasInvalidContacts || hasInvalidProcesses) {
        toast.error('Validation Failed', {
          description: 'Please complete all required fields before saving.',
        })
        return
      }

      const contacts = draft.contacts
        .filter((row) => row.value.trim().length > 0)
        .map((row, index) => ({
          id: row.id,
          type: row.type.trim() || 'note',
          label: row.label.trim() || null,
          value: row.value.trim(),
          sort_order: index + 1,
        }))

      const processes = (['Adding', 'Removing'] as ProcessType[]).flatMap((type) => {
        const rows = draft.processes.filter((row) => row.process_type === type && row.process.trim().length > 0)
        return rows.map((row, index) => ({
          id: row.id,
          process_type: type,
          process: row.process.trim(),
          step_number: index + 1,
        }))
      })

      const response = await fetch(`${getApiUrl()}/api/directory/agencies/${activeAgency}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: draft.name.trim(),
          full_name: draft.full_name.trim() || null,
          summary: draft.summary.trim() || null,
          contacts,
          processes,
        }),
      })

      if (!response.ok) {
        let backendMessage = `HTTP ${response.status}`
        try {
          const errorBody = await response.json()
          if (errorBody?.message) backendMessage = `${errorBody.message} (HTTP ${response.status})`
        } catch {
        }
        throw new Error(backendMessage)
      }

      const result = await response.json()
      const updated = result?.data as BackendAgency | undefined
      const code = normalizeCode(updated?.code ?? '')
      if (updated && code) {
        setAgenciesByCode((prev) => ({ ...prev, [code]: updated }))
      }
      setEditMode(false)
      setDraft(null)
      setShowValidation(false)
      toast.success('Directory changes saved successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save directory changes'
      toast.error('Save Failed', { description: message })
    } finally {
      setSavingChanges(false)
    }
  }

  if (loadingDirectory && !agency) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
        <header className="-mx-8 -mt-10 mb-8 bg-[#a0153e] text-white px-10 pt-12 pb-10 shadow-lg relative overflow-hidden">
          <div className="max-w-[1600px] mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight italic">Directory</h1>
            <p className="text-rose-100/90 text-lg mt-2">Reference of processes for adding and removing employees in government contributions.</p>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto p-8">
          <Card className="rounded-[2rem] border-none shadow-2xl bg-white p-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-[#a0153e]/20 border-t-[#a0153e] animate-spin" />
              <p className="text-2xl font-black text-slate-900">Loading Directory</p>
              <p className="mt-2 text-slate-600">Fetching agencies, contacts, and process steps...</p>
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
            </div>
          </Card>
        </main>
      </div>
    )
  }

  if (!loadingDirectory && !agency) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
        <header className="-mx-8 -mt-10 mb-8 bg-[#a0153e] text-white px-10 pt-12 pb-10 shadow-lg relative overflow-hidden">
          <div className="max-w-[1600px] mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight italic">Directory</h1>
            <p className="text-rose-100/90 text-lg mt-2">Reference of processes for adding and removing employees in government contributions.</p>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto p-8">
          <Card className="rounded-[2rem] border-none shadow-2xl bg-white p-10 text-center text-slate-600">
            No agencies found in the database yet.
          </Card>
        </main>
      </div>
    )
  }

  const persistAgencyImage = async (params: {
    imageUrl: string
    publicId?: string | null
    format?: string | null
    bytes?: number | null
  }) => {
    const response = await fetch(`${getApiUrl()}/api/directory/agencies/${activeAgency}/image`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        image_url: params.imageUrl,
        image_public_id: params.publicId ?? null,
        format: params.format ? String(params.format).toLowerCase() : null,
        bytes: params.bytes ?? null,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    const updated = result?.data as BackendAgency | undefined
    const code = normalizeCode(updated?.code ?? '')
    if (updated && code) {
      setAgenciesByCode((prev) => ({ ...prev, [code]: updated }))
      setImageError((prev) => ({ ...prev, [code]: false }))
    }
  }

  const loadCloudinaryImages = async () => {
    try {
      setLoadingCloudinaryImages(true)
      const response = await fetch(`${getApiUrl()}/api/directory/cloudinary-images?prefix=directory/&max_results=60`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        let backendMessage = `HTTP ${response.status}`
        try {
          const errorBody = await response.json()
          if (errorBody?.message) backendMessage = `${errorBody.message} (HTTP ${response.status})`
        } catch {
        }
        throw new Error(backendMessage)
      }
      const result = await response.json()
      const rows = Array.isArray(result?.data) ? result.data : []
      setCloudinaryImages(rows)
      setCloudinaryPickerOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Cloudinary images'
      toast.error('Cloudinary Load Failed', { description: message })
    } finally {
      setLoadingCloudinaryImages(false)
    }
  }

  const handleImageUpdate = async (uploadResult: any) => {
    try {
      const info = uploadResult?.info ?? uploadResult
      const imageUrl = info?.secure_url
      const publicId = info?.public_id
      const format = String(info?.format || '').toLowerCase()
      const bytes = Number(info?.bytes || 0)

      if (!imageUrl) {
        throw new Error('Upload did not return an image URL.')
      }

      if (!ALLOWED_UPLOAD_FORMATS.includes(format as (typeof ALLOWED_UPLOAD_FORMATS)[number])) {
        throw new Error('Only JPEG/JPG, PNG, GIF, WebP, and HEIC/HEIF are allowed.')
      }

      if (bytes > MAX_IMAGE_BYTES) {
        throw new Error('File exceeds the 20MB upload limit.')
      }

      setUpdatingImage(true)
      await persistAgencyImage({
        imageUrl,
        publicId,
        format,
        bytes,
      })

      toast.success('Agency picture updated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update picture'
      toast.error('Image Update Failed', { description: message })
    } finally {
      setUpdatingImage(false)
    }
  }

  const handleCopyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access was denied.' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <header className="-mx-8 -mt-10 mb-8 bg-[#a0153e] text-white px-10 pt-12 pb-10 shadow-lg relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight italic">Directory</h1>
            <p className="text-rose-100/90 text-lg">Reference of processes for adding and removing employees in government contributions.</p>
          </div>
          <div className="flex gap-3">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={cancelEditMode}
                  className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/20 h-11 px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveDirectoryChanges}
                  disabled={savingChanges || !draft}
                  className="rounded-full bg-white text-[#a0153e] hover:bg-rose-50 h-11 px-6 font-bold"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingChanges ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                onClick={startEditMode}
                className="rounded-full bg-white text-[#a0153e] hover:bg-rose-50 h-11 px-6 font-bold"
              >
                <Edit3 className="mr-2 h-4 w-4" /> Update Mode
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-[2rem] border-none shadow-2xl bg-white p-6">
              <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.2em] mb-4">Agencies</p>
              <div className="space-y-3">
                {mergedAgencies.map((item) => {
                  const Icon = item.icon
                  const isActive = item.key === activeAgency
                  return (
                    <Button
                      key={item.key}
                      onClick={() => {
                        if (editMode) {
                          toast.warning('Finish edit mode first', { description: 'Save or cancel your current changes before switching agency.' })
                          return
                        }
                        setActiveAgency(item.key)
                      }}
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

            <Card className="rounded-[2rem] border-none shadow-2xl bg-white p-6">
              <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.2em] mb-2">Agency Snapshot</p>
              <p className="text-sm font-semibold text-slate-700 mb-4">{agency.shortName}</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600"># Contacts</span>
                  <span className="font-black text-slate-900">{snapshot.contactsCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600"># Adding steps</span>
                  <span className="font-black text-slate-900">{snapshot.addingStepsCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600"># Removing steps</span>
                  <span className="font-black text-slate-900">{snapshot.removingStepsCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Last updated</span>
                  <span className="font-black text-slate-900">{snapshot.updatedAtText}</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-2xl bg-white p-6">
              <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.2em] mb-4">Official Online Portals</p>
              <div className="space-y-3">
                {OFFICIAL_PORTALS.map((portal) => {
                  const isActivePortal = normalizeCode(portal.code) === normalizeCode(activeAgency)
                  return (
                    <a
                      key={portal.code}
                      href={portal.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "block rounded-xl border px-3 py-3 transition-colors",
                        isActivePortal
                          ? "border-[#a0153e]/30 bg-[#a0153e]/5"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                      )}
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#a0153e]">{portal.label}</p>
                      <p className="text-xs text-slate-600 mt-1 break-all">{portal.url}</p>
                    </a>
                  )
                })}
              </div>
            </Card>
          </div>

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

              <div className="absolute right-6 top-6 flex flex-col items-end gap-2">
                {uploadPreset ? (
                  <CldUploadWidget
                    uploadPreset={uploadPreset}
                    options={{
                      multiple: false,
                      maxFiles: 1,
                      resourceType: 'image',
                      sources: ['local'],
                      folder: `directory/${activeAgency}`,
                      maxFileSize: MAX_IMAGE_BYTES,
                      clientAllowedFormats: [...ALLOWED_UPLOAD_FORMATS],
                    }}
                    onSuccess={(result) => {
                      void handleImageUpdate(result)
                    }}
                  >
                    {({ open }) => (
                      <Button
                        type="button"
                        onClick={() => open()}
                        disabled={updatingImage}
                        className="rounded-full h-10 px-5 bg-white/95 text-[#a0153e] hover:bg-white"
                      >
                        {updatingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                        Update Picture
                      </Button>
                    )}
                  </CldUploadWidget>
                ) : (
                  <Button
                    type="button"
                    disabled
                    className="rounded-full h-10 px-5 bg-white/95 text-slate-500 hover:bg-white"
                  >
                    <ImageUp className="mr-2 h-4 w-4" /> Update Picture
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => { void loadCloudinaryImages() }}
                  disabled={loadingCloudinaryImages || updatingImage}
                  className="rounded-full h-10 px-5 bg-white/95 text-[#a0153e] hover:bg-white"
                >
                  {loadingCloudinaryImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Images className="mr-2 h-4 w-4" />}
                  Select from image uploads
                </Button>
                <p className="text-[11px] font-bold text-white/90 bg-black/40 px-3 py-1 rounded-full">
                  Max 20MB - JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF
                </p>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/70 to-transparent text-white">
                <Badge className="mb-2 bg-white/20 text-white border-none rounded-full px-3 py-1 text-[10px] font-black tracking-widest">
                  AGENCY DIRECTORY
                </Badge>
                {editMode && draft ? (
                  <div className="space-y-2 max-w-2xl">
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className={cn(
                        "h-10 bg-white/95 text-slate-900 border-none",
                        showValidation && draft.name.trim().length === 0 && "ring-2 ring-rose-400"
                      )}
                      placeholder="Agency short name"
                    />
                    {showValidation && draft.name.trim().length === 0 && (
                      <p className="text-xs font-semibold text-rose-100">Agency short name is required.</p>
                    )}
                    <Input
                      value={draft.full_name}
                      onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                      className="h-9 bg-white/95 text-slate-900 border-none"
                      placeholder="Agency full name"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black leading-tight">{agency.shortName}</h2>
                    <p className="text-white/90">{agency.fullName}</p>
                  </>
                )}
              </div>
            </div>

            <div className="p-8">
              {editMode && draft ? (
                <Textarea
                  value={draft.summary}
                  onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                  className="mb-6 min-h-[80px]"
                  placeholder="Agency summary"
                />
              ) : (
                <p className="text-slate-600 font-medium mb-6">{agency.summary}</p>
              )}

              {editMode && (
                <div className="mb-4">
                  <Button onClick={addContact} size="sm" variant="ghost" className="rounded-full text-[#a0153e] font-bold bg-[#a0153e]/5 hover:bg-[#a0153e]/10 px-5">
                    <Plus className="mr-2 h-4 w-4" /> Add Contact
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(editMode && draft
                  ? draft.contacts.map((contact, index) => ({
                    icon: getDetailIcon(contact.type, contact.label),
                    label: contact.label || contact.type,
                    value: contact.value,
                    editable: contact,
                    index,
                  }))
                  : agency.details.map((row, index) => ({
                    ...row,
                    editable: null as EditableContact | null,
                    index,
                  }))).map((row: any) => {
                    const Icon = row.icon
                    return (
                      <div key={`${agency.key}-${row.index}`} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[#a0153e]/10 text-[#a0153e] flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            {editMode && row.editable ? (
                              <div className="space-y-2 min-w-[260px]">
                                <Input
                                  value={row.editable.type}
                                  onChange={(e) => updateContactAt(row.index, 'type', e.target.value)}
                                  placeholder="Type (email, hotline, address)"
                                  className={cn(
                                    "h-8 text-xs",
                                    showValidation && row.editable.type.trim().length === 0 && "border-rose-400 focus-visible:ring-rose-300"
                                  )}
                                />
                                <Input
                                  value={row.editable.label}
                                  onChange={(e) => updateContactAt(row.index, 'label', e.target.value)}
                                  placeholder="Label"
                                  className="h-8 text-xs"
                                />
                                <Input
                                  value={row.editable.value}
                                  onChange={(e) => updateContactAt(row.index, 'value', e.target.value)}
                                  placeholder="Value"
                                  className={cn(
                                    "h-8 text-xs",
                                    showValidation && row.editable.value.trim().length === 0 && "border-rose-400 focus-visible:ring-rose-300"
                                  )}
                                />
                                <Button
                                  type="button"
                                  onClick={() => removeContactAt(row.index)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.15em]">{row.label}</p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { void handleCopyText(String(row.label || 'Value'), String(row.value || '')) }}
                                    className="h-7 px-2 text-slate-500 hover:text-[#a0153e] hover:bg-[#a0153e]/10"
                                  >
                                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                                  </Button>
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mt-1 leading-relaxed">{row.value}</p>
                              </>
                            )}
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
                  <p className="text-[11px] font-black text-[#a0153e] uppercase tracking-[0.2em] mb-2">Goverment Contribution</p>
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
                {editMode && (
                  <Button onClick={addProcessStep} size="sm" variant="ghost" className="rounded-full text-[#a0153e] font-bold bg-[#a0153e]/5 hover:bg-[#a0153e]/10 px-5">
                    <Plus className="mr-2 h-4 w-4" /> Add Step
                  </Button>
                )}
              </div>

              <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[100px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-5">Step</TableHead>
                      <TableHead className="font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-5">Process</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editMode && currentProcessDraftRows.map((step, index) => (
                      <TableRow key={`${activeAgency}-${activeProcess}-${step.id ?? index}`} className="hover:bg-slate-50/60">
                        <TableCell className="text-center">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center mx-auto">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700 py-4">
                          <div className="flex items-center gap-2">
                            <Input
                              value={step.process}
                              onChange={(e) => updateProcessTextAt(index, e.target.value)}
                              className={cn(
                                "h-9",
                                showValidation && step.process.trim().length === 0 && "border-rose-400 focus-visible:ring-rose-300"
                              )}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeProcessAt(index)}
                              className="h-9 px-2 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!editMode && currentSteps.map((step, index) => (
                      <TableRow key={`${activeAgency}-${activeProcess}-${index}`} className="hover:bg-slate-50/60">
                        <TableCell className="text-center">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center mx-auto">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700 py-4">{step}</TableCell>
                      </TableRow>
                    ))}
                    {(editMode ? currentProcessDraftRows.length === 0 : currentSteps.length === 0) && !loadingDirectory && (
                      <TableRow>
                        <TableCell colSpan={2} className="py-10 text-center text-slate-500">
                          No process steps available for this agency yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </Card>
        </div>
      </main>

      <Dialog open={cloudinaryPickerOpen} onOpenChange={setCloudinaryPickerOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Select Agency Image</DialogTitle>
            <DialogDescription>
              Choose an existing image from your uploads.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto">
            {cloudinaryImages.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No uploaded images found in Cloudinary folder `directory/`.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cloudinaryImages.map((asset) => (
                  <button
                    key={asset.public_id}
                    type="button"
                    className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden text-left hover:border-[#a0153e]/50"
                    onClick={async () => {
                      try {
                        setUpdatingImage(true)
                        await persistAgencyImage({
                          imageUrl: asset.secure_url,
                          publicId: asset.public_id,
                          format: asset.format,
                          bytes: asset.bytes,
                        })
                        setCloudinaryPickerOpen(false)
                        toast.success('Agency picture updated successfully!')
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Failed to update picture'
                        toast.error('Image Update Failed', { description: message })
                      } finally {
                        setUpdatingImage(false)
                      }
                    }}
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      className="absolute top-2 right-2 z-10 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-black shadow-sm hover:bg-rose-700"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteCandidate(asset)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeleteCandidate(asset)
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img src={asset.secure_url} alt={asset.public_id} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-slate-700 truncate">{asset.public_id}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {String(asset.format || '').toUpperCase()} - {Math.round((Number(asset.bytes || 0) / (1024 * 1024)) * 10) / 10} MB
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteCandidate !== null} onOpenChange={(open) => { if (!open) setDeleteCandidate(null) }}>
        <AlertDialogContent className="border-2 border-rose-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Cloudinary image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected image file from Cloudinary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCandidate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                if (!deleteCandidate) return
                try {
                  setDeletingCloudinaryImage(true)
                  const response = await fetch(`${getApiUrl()}/api/directory/cloudinary-images`, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                    },
                    body: JSON.stringify({ public_id: deleteCandidate.public_id }),
                  })

                  if (!response.ok) {
                    let backendMessage = `HTTP ${response.status}`
                    try {
                      const errorBody = await response.json()
                      if (errorBody?.message) backendMessage = `${errorBody.message} (HTTP ${response.status})`
                    } catch {
                    }
                    throw new Error(backendMessage)
                  }

                  setCloudinaryImages((prev) => prev.filter((item) => item.public_id !== deleteCandidate.public_id))
                  toast.success('Image deleted from Cloudinary successfully!')
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Failed to delete image'
                  toast.error('Delete Failed', { description: message })
                } finally {
                  setDeleteCandidate(null)
                  setDeletingCloudinaryImage(false)
                }
              }}
            >
              {deletingCloudinaryImage ? 'Deleting...' : 'Delete Image'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}