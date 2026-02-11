'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, LogOut, Plus, Users, Trash2, Edit2, Phone, Mail, LogIn, X } from 'lucide-react'
import Logo from '@/components/logo'

interface Accountant {
  id: number
  name: string
  email: string
  phone: string
  role: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [accountants, setAccountants] = useState<Accountant[]>([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '+1 (555) 123-4567', role: 'accountant' },
    { id: 2, name: 'Sarah Smith', email: 'sarah.smith@example.com', phone: '+1 (555) 234-5678', role: 'accountant' },
    { id: 3, name: 'Michael Johnson', email: 'michael.j@example.com', phone: '+1 (555) 345-6789', role: 'accountant' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (res.ok && data.success) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [router])

  const handleAddAccountant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.phone) {
      setError('All fields are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/accountants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'accountant' }),
      })
      const data = await res.json()
      if (res.ok) {
        if (editingId) {
          setAccountants(accountants.map(acc => acc.id === editingId ? { ...formData, id: editingId, role: 'accountant' } : acc))
          setEditingId(null)
        } else {
          const newAccountant: Accountant = { 
            id: Math.max(...accountants.map(a => a.id), 0) + 1, 
            ...formData,
            role: 'accountant'
          }
          setAccountants([...accountants, newAccountant])
        }
        setFormData({ name: '', email: '', phone: '' })
        setShowAddForm(false)
        setError('')
      } else {
        setError(data.message || 'Failed to add accountant')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAccountant = (accountant: Accountant) => {
    setFormData({ name: accountant.name, email: accountant.email, phone: accountant.phone })
    setEditingId(accountant.id)
    setShowAddForm(true)
  }

  const handleDeleteAccountant = (id: number) => {
    setAccountants(accountants.filter(acc => acc.id !== id))
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        router.push('/login')
      } else {
        setError('Logout failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const closeModal = () => {
    setShowAddForm(false)
    setFormData({ name: '', email: '', phone: '' })
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center overflow-hidden">
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          .animate-spin-custom {
            animation: spin 1s linear infinite;
          }
          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }
        `}</style>
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 border-4 border-[#FF6B6B] border-t-transparent border-r-transparent rounded-full animate-spin-custom"></div>
          <p className="text-gray-300 font-medium text-lg">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0px); }
          50% { transform: translate(-30px, -30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0px); }
          50% { transform: translate(30px, -40px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0px); }
          50% { transform: translate(-40px, 30px); }
        }
        .orb-1 { animation: float1 20s ease-in-out infinite; }
        .orb-2 { animation: float2 25s ease-in-out infinite; }
        .orb-3 { animation: float3 30s ease-in-out infinite; }
        .glass-effect {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 107, 0.1);
        }
        .glass-effect-dark {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 107, 107, 0.2);
        }
        .gradient-text {
          background: linear-gradient(135deg, #FF6B6B, #FF8A80);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 107, 107, 0.5);
        }
      `}</style>

      {/* Animated Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb-1 absolute top-20 -right-40 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="orb-2 absolute -bottom-20 -left-40 w-80 h-80 bg-red-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="orb-3 absolute top-1/2 left-1/2 w-96 h-96 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Header */}
      <header className="relative z-40 border-b border-[#FF6B6B]/20 glass-effect sticky top-0">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FF8A80] rounded-lg flex items-center justify-center">
                <Logo animated={false} className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Super Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Manage Accountants & System</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 glass-effect-dark border-l-4 border-[#FF6B6B] rounded-lg p-4 flex gap-3 items-start animate-in">
            <AlertCircle className="w-5 h-5 text-[#FF6B6B] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-[#FF8A80] font-semibold">Error</h3>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Welcome Card */}
        {user && (
          <div className="mb-8 glass-effect-dark rounded-2xl p-6 sm:p-8 border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome, <span className="gradient-text">{user.name}</span></h2>
                <p className="text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white rounded-lg font-semibold text-sm">
                  {user.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-effect-dark rounded-2xl p-6 border sticky top-24">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF6B6B]" />
                Quick Actions
              </h3>
              <button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ name: '', email: '', phone: '' })
                  setShowAddForm(true)
                }}
                className="cursor-pointer w-full px-4 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white rounded-lg font-semibold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Accountant
              </button>
              <div className="mt-6 p-4 bg-[#0F172A]/50 rounded-lg border border-[#FF6B6B]/10">
                <p className="text-gray-400 text-sm">
                  <span className="text-[#FF8A80] font-bold text-lg">{accountants.length}</span>
                  <br />
                  accountant{accountants.length !== 1 ? 's' : ''} active
                </p>
              </div>
            </div>
          </div>

          {/* Accountants Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Accountants</h3>
              <p className="text-gray-400 text-sm mt-1">Manage your team members</p>
            </div>

            {accountants.length === 0 ? (
              <div className="glass-effect-dark rounded-2xl p-12 border flex flex-col items-center justify-center">
                <Users className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-300 text-lg font-semibold">No accountants yet</p>
                <p className="text-gray-500 text-sm mt-1">Add your first accountant using the Quick Actions panel</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accountants.map((acc) => (
                  <div
                    key={acc.id}
                    className="glass-effect rounded-2xl p-6 border card-hover group relative overflow-hidden"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/0 to-[#FF8A80]/0 group-hover:from-[#FF6B6B]/5 group-hover:to-[#FF8A80]/5 transition-all pointer-events-none"></div>

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white">{acc.name}</h4>
                          <span className="inline-block mt-2 px-3 py-1 bg-[#FF6B6B]/20 text-[#FF8A80] rounded-full text-xs font-semibold capitalize">
                            {acc.role}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-gray-300">
                          <Mail className="w-4 h-4 text-[#FF6B6B] flex-shrink-0" />
                          <a href={`mailto:${acc.email}`} className="text-sm hover:text-[#FF8A80] transition-colors break-all">
                            {acc.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                          <Phone className="w-4 h-4 text-[#FF6B6B] flex-shrink-0" />
                          <a href={`tel:${acc.phone}`} className="text-sm hover:text-[#FF8A80] transition-colors">
                            {acc.phone}
                          </a>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-[#FF6B6B]/10">
                        <button
                          onClick={() => handleEditAccountant(acc)}
                          className="cursor-pointer flex-1 px-3 py-2 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF8A80] rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAccountant(acc.id)}
                          className="cursor-pointer flex-1 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Accountant Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-effect-dark rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 border-b border-[#FF6B6B]/20 glass-effect-dark p-6 sm:p-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Accountant' : 'Add New Accountant'}
              </h2>
              <button
                onClick={closeModal}
                className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              <form onSubmit={handleAddAccountant} className="space-y-5">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 font-semibold">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50 h-10"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50 h-10"
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300 font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-[#0F172A] border-[#FF6B6B]/20 text-white placeholder-gray-500 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/50 h-10"
                  />
                </div>



                {/* Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="cursor-pointer flex-1 px-4 py-2 bg-[#0F172A]/80 border border-[#FF6B6B]/20 text-gray-300 rounded-lg font-semibold hover:border-[#FF6B6B]/50 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cursor-pointer flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add')} Accountant
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-effect-dark rounded-2xl border w-full max-w-sm">
            {/* Modal Header */}
            <div className="border-b border-[#FF6B6B]/20 glass-effect-dark p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-[#FF6B6B]" />
                Confirm Logout
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              <p className="text-gray-300 mb-8 leading-relaxed">
                Are you sure you want to logout? You'll need to sign in again to access the dashboard.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="cursor-pointer flex-1 px-4 py-2 bg-[#0F172A]/80 border border-[#FF6B6B]/20 text-gray-300 rounded-lg font-semibold hover:border-[#FF6B6B]/50 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8A80] text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
