//directory


"use client"


import React, { useEffect, useMemo, useState } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
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
  Clock,
  ArrowRight,
  Users
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

type GeneralContact = {
  id: number
  type: string
  label: string | null
  value: string
  sort_order: number
}

type EditableGeneralContact = {
  type: string
  label: string
  value: string
  sort_order: number
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
  const [generalContactsOpen, setGeneralContactsOpen] = useState(false)
  const [generalContacts, setGeneralContacts] = useState<GeneralContact[]>([])
  const [generalContactsDraft, setGeneralContactsDraft] = useState<EditableGeneralContact[]>([])
  const [loadingGeneralContacts, setLoadingGeneralContacts] = useState(false)
  const [savingGeneralContacts, setSavingGeneralContacts] = useState(false)
  const [editingGeneralContacts, setEditingGeneralContacts] = useState(false)
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
          // Default to PhilHealth if present, else first available
          if (mapped['philhealth']) {
            setActiveAgency('philhealth')
          } else {
            const firstCode = Object.keys(mapped)[0] ?? ''
            if (firstCode) setActiveAgency(firstCode)
          }
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
      .sort((a, b) => {
        // Enforce order: BIR (tin), PAG IBIG, PHILHEALTH, SSS if possible
        const order = ['tin', 'pagibig', 'philhealth', 'sss']
        const indexA = order.indexOf(normalizeCode(a.code))
        const indexB = order.indexOf(normalizeCode(b.code))
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return String(a.name || '').localeCompare(String(b.name || ''))
      })
      .map((backend) => {
        const code = normalizeCode(backend.code)
        const backendDetails = Array.isArray(backend?.contacts)
          ? [...backend.contacts]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((contact) => ({
              icon: getDetailIcon(contact.type, contact.label ?? ''),
              label: contact.label?.trim() || contact.type,
              value: contact.value,
              type: contact.type,
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


    // Find active portal link
    const activeLink = OFFICIAL_PORTALS.find(p => normalizeCode(p.code) === activeAgency)?.url || 'N/A'


    return { contactsCount, addingStepsCount, removingStepsCount, updatedAtText, activeLink }
  }, [activeBackendAgency, editMode, draft, activeAgency])


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

  const loadGeneralContacts = async () => {
    try {
      setLoadingGeneralContacts(true)
      const response = await fetch(`${getApiUrl()}/api/directory/general-contacts`, {
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
      const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      setGeneralContacts(sorted)
      if (!editingGeneralContacts) {
        setGeneralContactsDraft(sorted.map((row) => ({
          type: row.type || '',
          label: row.label || '',
          value: row.value || '',
          sort_order: row.sort_order || 0,
        })))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load general contacts'
      toast.error('General Contacts Load Failed', { description: message })
    } finally {
      setLoadingGeneralContacts(false)
    }
  }

  const openGeneralContactsSheet = () => {
    setGeneralContactsOpen(true)
    void loadGeneralContacts()
  }

  const startGeneralContactsEdit = () => {
    setGeneralContactsDraft(
      generalContacts.map((row, index) => ({
        type: row.type || '',
        label: row.label || '',
        value: row.value || '',
        sort_order: row.sort_order || (index + 1),
      }))
    )
    setEditingGeneralContacts(true)
  }

  const cancelGeneralContactsEdit = () => {
    setEditingGeneralContacts(false)
    setGeneralContactsDraft(
      generalContacts.map((row, index) => ({
        type: row.type || '',
        label: row.label || '',
        value: row.value || '',
        sort_order: row.sort_order || (index + 1),
      }))
    )
  }

  const addGeneralContactRow = () => {
    setGeneralContactsDraft((prev) => [
      ...prev,
      { type: 'note', label: '', value: '', sort_order: prev.length + 1 },
    ])
  }

  const removeGeneralContactRow = (index: number) => {
    setGeneralContactsDraft((prev) => (
      prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i + 1 }))
    ))
  }

  const updateGeneralContactField = (index: number, field: keyof EditableGeneralContact, value: string) => {
    setGeneralContactsDraft((prev) => {
      const next = [...prev]
      const target = next[index]
      if (!target) return prev
      next[index] = { ...target, [field]: value }
      return next
    })
  }

  const saveGeneralContacts = async () => {
    try {
      const hasInvalidRows = generalContactsDraft.some((row) => row.type.trim().length === 0 || row.value.trim().length === 0)
      if (hasInvalidRows) {
        toast.error('Validation Failed', {
          description: 'Type and value are required for each general contact row.',
        })
        return
      }

      setSavingGeneralContacts(true)
      const payload = generalContactsDraft.map((row, index) => ({
        type: row.type.trim(),
        label: row.label.trim() || null,
        value: row.value.trim(),
        sort_order: index + 1,
      }))

      const response = await fetch(`${getApiUrl()}/api/directory/general-contacts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ contacts: payload }),
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
      const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      setGeneralContacts(sorted)
      setGeneralContactsDraft(sorted.map((row, index) => ({
        type: row.type || '',
        label: row.label || '',
        value: row.value || '',
        sort_order: row.sort_order || (index + 1),
      })))
      setEditingGeneralContacts(false)
      toast.success('General contacts updated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save general contacts'
      toast.error('Save Failed', { description: message })
    } finally {
      setSavingGeneralContacts(false)
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


  // --- RENDERING ---


  if (loadingDirectory && !agency) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#A4163A] mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-700">Loading Directory...</p>
        </div>
      </div>
    )
  }


  if (!loadingDirectory && !agency) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-xl">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Agencies Found</h2>
          <p className="text-slate-600">The directory database is empty. Please verify the backend data.</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans flex flex-col">
      {/* ----- HEADER AREA ----- */}
      <header className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-xl relative overflow-hidden">
        {/* Top Pattern Effect (Optional) */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />


        <div className="w-full px-4 md:px-8 pt-10 pb-5 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                <Building2 className="w-8 h-8 opacity-80" />
                Government Directory
              </h1>
              <p className="text-xs md:text-sm font-semibold tracking-wide opacity-70 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                ABIC REALTY & CONSULTANCY - PROCESS REFERENCE
              </p>
            </div>


            {/* EDIT MODE TOGGLE */}
            <div className="flex items-center gap-2">
              <Button
                onClick={openGeneralContactsSheet}
                variant="outline"
                className="border-white/30 rounded-lg text-white hover:bg-white/20 hover:text-white bg-transparent backdrop-blur-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                GENERAL CONTACTS
              </Button>
              {editMode ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={cancelEditMode}
                    className="text-white hover:bg-white/20 hover:text-white"
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={saveDirectoryChanges}
                    disabled={savingChanges || !draft}
                    variant="default"
                    className="font-bold text-[#A4163A] bg-white hover:bg-stone-100"
                  >
                    {savingChanges ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    SAVE SHANGES
                  </Button>
                </>
              ) : (
                <Button
                  onClick={startEditMode}
                  variant="outline"
                  className="border-white/30 rounded-lg text-white hover:bg-white/20 hover:text-white bg-transparent backdrop-blur-sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  UPDATE MODE
                </Button>
              )}
            </div>
          </div>


          {/* AGENCY NAVIGATION */}
          <div className="flex items-center gap-8 overflow-x-auto pb-4 scrollbar-hide mt-6">
            {mergedAgencies.map((item) => {
              const isActive = item.key === activeAgency
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (editMode) {
                      toast.warning('Save or cancel changes first.')
                      return
                    }
                    setActiveAgency(item.key)
                  }}
                  className={cn(
                    "relative py-3 transition-all duration-300 whitespace-nowrap group flex items-center gap-3 outline-none",
                    isActive
                      ? "text-white scale-110"
                      : "text-white/60 hover:text-white hover:scale-105"
                  )}
                >
                  <Icon className={cn("transition-all duration-300", isActive ? "w-6 h-6 stroke-[3]" : "w-5 h-5 stroke-2")} />
                  <span className={cn(
                    "uppercase tracking-widest transition-all duration-300",
                    isActive ? "font-black text-xl shadow-sm" : "font-bold text-lg"
                  )}>
                    {item.shortName}
                  </span>


                  {/* Active Indicator Underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>


      {/* ----- MAIN CONTENT ----- */}
      <main className="w-full px-4 md:px-8 py-8 -mt-2 flex-grow">


        {/* COMBINED HERO & PROCESS SECTION */}
        <div className="flex flex-col shadow-xl border border-slate-200 rounded-sm overflow-hidden mb-8">


          {/* 1. HERO BANNER */}
          <div className="relative w-full h-[400px] bg-white group">
            {!imageError[agency.key] ? (
              <img
                src={agency.image}
                alt={agency.shortName}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={() => setImageError(p => ({ ...p, [agency.key]: true }))}
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <agency.icon className="w-24 h-24 text-slate-400" />
              </div>
            )}


            {/* Banner Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />


            <div className="absolute top-6 right-6 flex flex-col gap-3">
              {/* Upload Buttons */}
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
                  onSuccess={(result) => void handleImageUpdate(result)}
                >
                  {({ open }) => (
                    <Button
                      onClick={() => open()}
                      disabled={updatingImage}
                      className="bg-[#A4163A] hover:bg-[#8a1230] text-white border-none rounded-sm px-6 shadow-lg shadow-red-900/20 font-bold"
                    >
                      {updatingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                      Update Picture
                    </Button>
                  )}
                </CldUploadWidget>
              ) : (
                <Button disabled className="bg-slate-800 text-white rounded-sm">Config Error</Button>
              )}


              <Button
                onClick={() => void loadCloudinaryImages()}
                disabled={loadingCloudinaryImages || updatingImage}
                className="bg-[#A4163A] hover:bg-[#8a1230] text-white border-none rounded-sm px-6 shadow-lg shadow-red-900/20 font-bold"
              >
                {loadingCloudinaryImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Images className="mr-2 h-4 w-4" />}
                Select from Image uploads
              </Button>
              <p className="text-[10px] font-bold text-white/80 text-right mt-1 drop-shadow-md">
                Max 20MB - JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF
              </p>
            </div>


            <div className="absolute bottom-0 left-0 p-10 w-full max-w-4xl">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs md:text-sm font-black text-white/80 tracking-[0.3em] uppercase bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-sm inline-block border border-white/20 shadow-sm">
                  AGENCY DIRECTORY
                </p>
              </div>


              {editMode && draft ? (
                <div className="space-y-3">
                  <Input
                    value={draft.name}
                    onChange={e => setDraft({ ...draft, name: e.target.value })}
                    className="text-4xl md:text-6xl font-black text-white bg-transparent border-b border-white/40 rounded-none px-0 h-auto focus-visible:ring-0 focus-visible:border-white placeholder:text-white/30"
                    placeholder="SHORT NAME"
                  />
                  <Input
                    value={draft.full_name}
                    onChange={e => setDraft({ ...draft, full_name: e.target.value })}
                    className="text-xl md:text-2xl font-medium text-white/90 bg-transparent border-b border-white/40 rounded-none px-0 h-auto focus-visible:ring-0 focus-visible:border-white placeholder:text-white/30"
                    placeholder="Agency Full Business Name"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-sm mb-2">
                    {agency.shortName}
                  </h2>
                  <p className="text-lg md:text-2xl font-medium text-white/90 leading-snug max-w-2xl drop-shadow-sm">
                    {agency.fullName}
                  </p>
                </>
              )}
            </div>
          </div>


          {/* 2. PROCESS STEPS */}
          <div className="bg-white p-8 md:p-10 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none" />


            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 relative z-10">
              <div>
                <p className="text-lg font-black text-[#A4163A] uppercase tracking-[0.25em] mb-2">GOVERNMENT CONTRIBUTION</p>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Process Steps</h3>
                {editMode && draft && (
                  <Textarea
                    value={draft.summary}
                    onChange={e => {
                      setDraft({ ...draft, summary: e.target.value })
                    }}
                    className="mt-4 max-w-2xl rounded-sm"
                    placeholder="Agency summary or additional notes..."
                  />
                )}
              </div>


              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1.5 rounded-sm border border-slate-200">
                  {(['Adding', 'Removing'] as ProcessType[]).map((type) => {
                    const isActive = activeProcess === type
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveProcess(type)}
                        className={cn(
                          "px-6 py-2.5 rounded-sm text-sm font-black transition-all flex items-center gap-2",
                          isActive ? "bg-[#A4163A] text-white shadow-md transform scale-105" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                        )}
                      >
                        {type === 'Adding' ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                        <span>{type}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>


            {/* TABLE / LIST */}
            <div className="relative z-10">
              <div className="border rounded-sm overflow-hidden border-slate-100 shadow-sm">
                {editMode && (
                  <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-end">
                    <Button onClick={addProcessStep} size="sm" variant="outline" className="text-[#A4163A] border-[#A4163A]/20 bg-[#A4163A]/5 hover:bg-[#A4163A]/10 rounded-sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Step
                    </Button>
                  </div>
                )}


                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-slate-50/50 border-slate-100">
                      <TableHead className="w-[80px] text-center font-black text-slate-400 uppercase text-[20px] tracking-widest py-4">Step</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[20px] tracking-widest py-4">Process Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editMode ? (
                      currentProcessDraftRows.length > 0 ? (
                        currentProcessDraftRows.map((step, index) => (
                          <TableRow key={index} className="border-slate-100 hover:bg-slate-50/50">
                            <TableCell className="text-center align-top py-6">
                              <div className="h-8 w-8 rounded-sm bg-[#A4163A]/10 text-[#A4163A] font-black text-sm flex items-center justify-center mx-auto">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="py-6 align-top">
                              <div className="flex gap-2">
                                <Textarea
                                  value={step.process}
                                  onChange={(e) => updateProcessTextAt(index, e.target.value)}
                                  className="min-h-[60px] resize-y rounded-sm"
                                />
                                <Button size="icon" variant="ghost" onClick={() => removeProcessAt(index)} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 shrink-0 h-9 w-9 rounded-sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-slate-400 italic">No draft steps yet.</TableCell>
                        </TableRow>
                      )
                    ) : (
                      currentSteps.length > 0 ? (
                        currentSteps.map((step, index) => (
                          <TableRow key={index} className="border-slate-100 hover:bg-slate-50/30 transition-colors">
                            <TableCell className="text-center align-top py-6">
                              <div className="h-10 w-10 rounded-sm bg-slate-100 text-slate-600 font-black text-base flex items-center justify-center mx-auto shadow-sm">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="py-6 align-top">
                              <p className="text-xl font-medium text-slate-800 leading-relaxed pt-1.5">{step}</p>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-slate-400 italic">No process steps found for this category.</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
        {/* 3. CONTACT GRIDS */}
        <div>
          <div className="mt-8 mb-4 border-b border-slate-200 pb-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#A4163A]" />
              Contact Information
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-1">
              24/7 hotline, mobile support, callback service, and main office details.
            </p>
          </div>
          {editMode && (
            <div className="mb-4 flex justify-end">
              <Button onClick={addContact} variant="outline" className="text-[#A4163A] border-[#A4163A]/20 bg-white shadow-sm rounded-sm">
                <Plus className="mr-2 h-4 w-4" /> Add Contact Field
              </Button>
            </div>
          )}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(editMode && draft
              ? draft.contacts
              : agency.details
            ).filter(row => {
              if (editMode) return true
              // In view mode, only show if value exists
              return row.value && row.value.trim().length > 0
            })
              .map((row, idx) => {
                const isEditable = editMode && draft
                const actualRow = isEditable ? row : row
                // Note: agency.details already has icon, but draft doesn't.
                const Icon = isEditable
                  ? getDetailIcon(row.type, row.label)
                  : (row as any).icon


                return (
                  <div key={idx} className="group bg-white rounded-sm p-3 border border-slate-200 hover:border-[#A4163A] transition-colors flex items-center justify-between gap-4 shadow-sm hover:shadow-md">
                    {isEditable ? (
                      <div className="flex-1 space-y-2 relative z-10 w-full">
                        <div className="flex gap-2">
                          <Input
                            value={row.type}
                            onChange={(e) => updateContactAt(idx, 'type', e.target.value)}
                            placeholder="Type (e.g. Hotline)"
                            className="font-bold text-xs uppercase rounded-sm h-8"
                          />
                          <Input
                            value={row.label}
                            onChange={(e) => updateContactAt(idx, 'label', e.target.value)}
                            placeholder="Label"
                            className="font-bold text-xs uppercase rounded-sm h-8"
                          />
                        </div>
                        <Input
                          value={row.value}
                          onChange={(e) => updateContactAt(idx, 'value', e.target.value)}
                          placeholder="Value"
                          className="rounded-sm h-9"
                        />
                        <Button size="sm" variant="ghost" onClick={() => removeContactAt(idx)} className="text-rose-500 w-full hover:bg-rose-50 rounded-sm h-8">
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-10 w-10 rounded-full bg-slate-50 text-[#A4163A] flex items-center justify-center shrink-0 border border-slate-100">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                              {row.label || row.type}
                            </p>
                            <p className="text-sm md:text-base font-bold text-slate-800 truncate leading-none pb-0.5">
                              {row.value}
                            </p>
                          </div>
                        </div>


                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-slate-400 hover:text-[#A4163A] hover:bg-rose-50 rounded-sm font-bold text-xs tracking-wider"
                          onClick={() => void handleCopyText(row.label || row.type, row.value)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          COPY
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </main>


      {/* 4. FOOTER */}
      <footer className="w-full bg-[#A4163A] text-white py-4 px-8 mt-auto sticky bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="opacity-70">OFFICIAL ONLINE PORTAL:</span>
            <a href={snapshot.activeLink} target="_blank" rel="noreferrer" className="hover:underline hover:text-white text-white/90">
              {snapshot.activeLink !== 'N/A' ? snapshot.activeLink : '(LINK)'}
            </a>
          </div>


          <div className="flex items-center gap-2">
            <span className="opacity-70">LAST UPDATED:</span>
            <span className="text-white/90">{snapshot.updatedAtText}</span>
          </div>
        </div>
      </footer>


      {/* ----- MODALS ----- */}
      <Sheet
        open={generalContactsOpen}
        onOpenChange={(open) => {
          setGeneralContactsOpen(open)
          if (!open) {
            setEditingGeneralContacts(false)
          }
        }}
      >
        {generalContactsOpen && (
          <SheetContent className="bg-white w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="px-6 py-5">
              <SheetTitle className="text-slate-900">General Contacts</SheetTitle>
              <SheetDescription>
                Shared contact information not tied to a specific agency.
              </SheetDescription>
            </SheetHeader>
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="rounded-sm"
                  onClick={() => void loadGeneralContacts()}
                  disabled={loadingGeneralContacts || savingGeneralContacts}
                >
                  {loadingGeneralContacts ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Refresh
                </Button>
                {editingGeneralContacts ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={cancelGeneralContactsEdit}
                      disabled={savingGeneralContacts}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => void saveGeneralContacts()}
                      className="bg-[#A4163A] hover:bg-[#8D1332] text-white"
                      disabled={savingGeneralContacts}
                    >
                      {savingGeneralContacts ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={startGeneralContactsEdit}
                    className="bg-[#A4163A] hover:bg-[#8D1332] text-white"
                    disabled={loadingGeneralContacts}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Contacts
                  </Button>
                )}
              </div>

              {loadingGeneralContacts ? (
                <div className="py-8 text-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading general contacts...
                </div>
              ) : editingGeneralContacts ? (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#A4163A] border-[#A4163A]/30"
                      onClick={addGeneralContactRow}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Row
                    </Button>
                  </div>
                  {generalContactsDraft.length === 0 ? (
                    <p className="text-sm text-slate-500">No rows yet. Click Add Row to create one.</p>
                  ) : (
                    generalContactsDraft.map((row, index) => (
                      <div key={`general-contact-draft-${index}`} className="border border-slate-200 rounded-md p-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={row.type}
                            onChange={(e) => updateGeneralContactField(index, 'type', e.target.value)}
                            placeholder="Type (e.g. Hotline)"
                            className="h-9 rounded-sm"
                          />
                          <Input
                            value={row.label}
                            onChange={(e) => updateGeneralContactField(index, 'label', e.target.value)}
                            placeholder="Label"
                            className="h-9 rounded-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={row.value}
                            onChange={(e) => updateGeneralContactField(index, 'value', e.target.value)}
                            placeholder="Value"
                            className="h-9 rounded-sm"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeGeneralContactRow(index)}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-9 w-9 rounded-sm"
                            aria-label="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : generalContacts.length === 0 ? (
                <p className="text-sm text-slate-500">No general contacts yet.</p>
              ) : (
                <div className="space-y-2">
                  {generalContacts.map((contact) => {
                    const Icon = getDetailIcon(contact.type, contact.label ?? '')
                    return (
                      <div key={contact.id} className="flex items-start gap-3 rounded-md border border-slate-100 p-3">
                        <div className="mt-0.5 h-8 w-8 rounded-full bg-slate-100 text-[#A4163A] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{contact.label || contact.type}</p>
                          <p className="text-sm font-semibold text-slate-800 break-words">{contact.value}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-slate-500 hover:text-[#A4163A] hover:bg-rose-50"
                          onClick={() => void handleCopyText(contact.label || contact.type, contact.value)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>

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
                    className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden text-left hover:border-[#A4163A]/50"
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

