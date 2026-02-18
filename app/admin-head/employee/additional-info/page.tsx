"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface AdditionalField {
  id: number
  field_label: string
  field_key: string
  field_type: string
  field_unit: string | null
  created_at: string
}

const FIELD_TYPES = [
  { value: 'text',     label: 'Text',           example: 'e.g. Nickname, Blood Type' },
  { value: 'number',   label: 'Number',         example: 'e.g. Height, Weight' },
  { value: 'date',     label: 'Date',           example: 'e.g. Contract Expiry' },
  { value: 'textarea', label: 'Comment / Notes', example: 'e.g. Remarks, Description' },
  { value: 'time',     label: 'Time',           example: 'e.g. Shift Start Time' },
  { value: 'email',    label: 'Email',          example: 'e.g. Personal Email' },
  { value: 'url',      label: 'URL / Link',     example: 'e.g. LinkedIn Profile' },
]

const TYPE_BADGE_COLORS: Record<string, string> = {
  text:     'bg-blue-50 text-blue-700 border-blue-200',
  number:   'bg-purple-50 text-purple-700 border-purple-200',
  date:     'bg-green-50 text-green-700 border-green-200',
  textarea: 'bg-amber-50 text-amber-700 border-amber-200',
  time:     'bg-cyan-50 text-cyan-700 border-cyan-200',
  email:    'bg-rose-50 text-rose-700 border-rose-200',
  url:      'bg-slate-50 text-slate-700 border-slate-200',
}

export default function AdditionalInfoPage() {
  const router = useRouter()
  const [fields, setFields] = useState<AdditionalField[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState('text')
  const [newUnit, setNewUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/employee-additional-fields`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) setFields(data.data)
    } catch (err) {
      console.error('Error fetching fields:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddField = async () => {
    if (!newLabel.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/employee-additional-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          field_label: newLabel.trim(),
          field_type: newType,
          field_unit: newUnit.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNewLabel('')
        setNewType('text')
        setNewUnit('')
        fetchFields()
      } else {
        alert(data.message || 'Failed to add field')
      }
    } catch (err) {
      alert('Error adding field')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`Delete field "${label}"? This will permanently remove the column and all employee data for this field.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`${getApiUrl()}/api/employee-additional-fields/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setFields(fields.filter(f => f.id !== id))
      } else {
        alert(data.message || 'Failed to delete field')
      }
    } catch (err) {
      alert('Error deleting field')
    } finally {
      setDeletingId(null)
    }
  }

  const selectedTypeInfo = FIELD_TYPES.find(t => t.value === newType)
  const showUnit = newType === 'number'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push('/admin-head/employee/masterfile')}
            className="text-rose-200 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Back to Masterfile
          </button>
        </div>
        <h1 className="text-4xl font-bold mb-3">Additional Information Fields</h1>
        <p className="text-rose-100 text-lg">
          Define custom fields that appear in every employee's profile
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-[#FFE5EC] mb-6">
        {/* Add New Field */}
        <h2 className="text-xl font-bold text-[#800020] mb-5">Add New Field</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Label */}
          <div className="space-y-1 md:col-span-1">
            <Label className="text-sm font-semibold text-slate-700">Field Label <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              placeholder="e.g. Height, Blood Type, Remarks..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddField() }}
              className="focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A]"
            />
          </div>

          {/* Field Type */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-slate-700">Field Type <span className="text-red-500">*</span></Label>
            <select
              value={newType}
              onChange={(e) => { setNewType(e.target.value); setNewUnit('') }}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A0153E]"
            >
              {FIELD_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {selectedTypeInfo && (
              <p className="text-xs text-slate-400">{selectedTypeInfo.example}</p>
            )}
          </div>

          {/* Unit (only for number) */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-slate-700">
              Unit {showUnit ? <span className="text-slate-400 font-normal">(optional)</span> : ''}
            </Label>
            <Input
              type="text"
              placeholder={showUnit ? 'e.g. cm, kg, lbs, inches...' : 'Only for Number fields'}
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              disabled={!showUnit}
              className={`focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] ${!showUnit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>

        <Button
          onClick={handleAddField}
          disabled={saving || !newLabel.trim()}
          className="bg-gradient-to-r from-[#800020] to-[#A0153E] hover:from-[#A0153E] hover:to-[#C9184A] text-white font-bold px-8 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          {saving ? 'Adding...' : '+ Add Field'}
        </Button>

        <p className="text-slate-400 text-xs mt-3">
          A unique key will be auto-generated from the label and added as a column to the employees table.
        </p>
      </div>

      {/* Fields List */}
      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-[#FFE5EC]">
        <h2 className="text-xl font-bold text-[#800020] mb-4">
          Existing Fields
          <span className="ml-2 text-sm font-normal text-slate-500">({fields.length} total)</span>
        </h2>

        {loading ? (
          <p className="text-slate-500">Loading fields...</p>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">No additional fields yet.</p>
            <p className="text-sm">Add your first field above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#FFE5EC] to-rose-50">
                <tr className="border-b-2 border-[#C9184A]">
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Field Label</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Unit</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">DB Key</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#800020]">Action</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr
                    key={field.id}
                    className="border-b border-slate-100 hover:bg-[#FFE5EC] transition-colors duration-200"
                  >
                    <td className="py-3 px-4 text-slate-500 text-sm">{index + 1}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{field.field_label}</td>
                    <td className="py-3 px-4">
                      <Badge className={`border text-xs font-semibold capitalize ${TYPE_BADGE_COLORS[field.field_type] || 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm">
                      {field.field_unit ? (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">{field.field_unit}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-slate-100 text-slate-600 border border-slate-300 font-mono text-xs">
                        {field.field_key}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm">
                      {new Date(field.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletingId === field.id}
                        onClick={() => handleDelete(field.id, field.field_label)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500 transition-all"
                      >
                        {deletingId === field.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
