"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronDown, Grid, List } from "lucide-react";
import SuperAdminHeader from "@/components/layout/SuperAdminHeader";
import SuccessModal from "@/components/ui/SuccessModal";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type Status = "Active" | "Inactive";

type AdminAccount = {
  id: string;
  name: string;
  email: string;
  status: Status;
  activatedOn: string;
};

type FormErrors = {
  name?: string;
  email?: string;
};

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

const BORDER = "rgba(0,0,0,0.12)";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ---------- Simple Icons (SVG) ---------- */
const Icons = {
  Plus: (props: any) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Trash: (props: any) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Edit: (props: any) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Refresh: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export default function ManagementPage() {
  // Auth states
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");

  // Admin management states
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("accounts");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Form validation states
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Search and filter states
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [savedSearches, setSavedSearches] = useState<Array<{name: string, query: string, status: Status | "all", dateRange: {start: string, end: string}}>>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [accounts, setAccounts] = useState<AdminAccount[]>([
    {
      id: uid(),
      name: "Maria Santos",
      email: "maria@company.com",
      status: "Active",
      activatedOn: new Date().toLocaleDateString(),
    },
    {
      id: uid(),
      name: "Juan Cruz",
      email: "juan@company.com",
      status: "Active",
      activatedOn: new Date().toLocaleDateString(),
    },
    {
      id: uid(),
      name: "Liza Reyes",
      email: "liza@company.com",
      status: "Inactive",
      activatedOn: new Date().toLocaleDateString(),
    },
  ]);

  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  // Auth effect
  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.success) setUser(data.user);
        else window.location.href = "/login";
      } catch {
        setError("Network error");
      }
    };
    fetchMe();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const filtered = useMemo(() => {
    let filteredAccounts = accounts;

    // Apply search query filter
    const q = query.trim().toLowerCase();
    if (q) {
      filteredAccounts = filteredAccounts.filter((a) => {
        return (
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredAccounts = filteredAccounts.filter(a => a.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filteredAccounts = filteredAccounts.filter(a => {
        const accountDate = new Date(a.activatedOn);
        const startDate = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
        const endDate = dateRange.end ? new Date(dateRange.end) : new Date('2100-12-31');
        return accountDate >= startDate && accountDate <= endDate;
      });
    }

    return filteredAccounts;
  }, [accounts, query, statusFilter, dateRange]);

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isFormValid) return;

    const newItem: AdminAccount = {
      id: uid(),
      name: form.name.trim(),
      email: form.email.trim(),
      status: "Active",
      activatedOn: new Date().toLocaleDateString(),
    };

    setAccounts((prev) => [newItem, ...prev]);
    setForm({ name: "", email: "" });
    setFormErrors({});
    setEmailExists(false);
    setShowCreateSuccess(true);
  }

  function onDelete(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  function onChangeStatus(id: string, next: Status) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
  }

  function saveSearch() {
    if (!searchName.trim()) return;
    if (!query && statusFilter === "all" && !dateRange.start && !dateRange.end) return;

    const newSearch = {
      name: searchName.trim(),
      query,
      status: statusFilter,
      dateRange: { ...dateRange }
    };
    setSavedSearches(prev => [...prev, newSearch]);
    setSearchName("");
    setShowSaveSearchModal(false);
  }

  function removeSavedSearch(index: number) {
    setSavedSearches(prev => prev.filter((_, i) => i !== index));
  }

  function onRefresh() {
    setQuery("");
  }

  function openEditModal(item: AdminAccount) {
    setEditing(item);
    setEditForm({
      name: item.name,
      email: item.email,
    });
  }

  function closeEditModal() {
    setEditing(null);
  }

  function saveEdit() {
    if (!editing) return;
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === editing.id
          ? {
              ...a,
              name: editForm.name.trim(),
              email: editForm.email.trim(),
            }
          : a
      )
    );

    setEditing(null);
  }

  const tableCols = "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 96px 120px";

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return 'weak';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score === 3) return 'fair';
    if (score === 4) return 'good';
    return 'strong';
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!form.name.trim()) {
      errors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 50) {
      errors.name = "Name must be less than 50 characters";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkEmailExists = async (email: string) => {
    if (!validateEmail(email)) {
      setEmailExists(false);
      return;
    }

    setIsCheckingEmail(true);
    // Simulate API call - replace with actual API call
    setTimeout(() => {
      const exists = accounts.some(account => account.email.toLowerCase() === email.toLowerCase());
      setEmailExists(exists);
      setIsCheckingEmail(false);
    }, 500);
  };

  // Handle form input changes with validation
  const handleInputChange = (field: 'name' | 'email', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setFormErrors(prev => ({ ...prev, [field]: undefined }));

    // Real-time validation
    if (field === 'name') {
      if (value.trim().length > 0 && value.trim().length < 2) {
        setFormErrors(prev => ({ ...prev, name: "Name must be at least 2 characters" }));
      } else if (value.trim().length > 50) {
        setFormErrors(prev => ({ ...prev, name: "Name must be less than 50 characters" }));
      }
    } else if (field === 'email') {
      if (value.trim().length > 0 && !validateEmail(value)) {
        setFormErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      }
      // Debounce email check to prevent excessive API calls
      const timeoutId = setTimeout(() => {
        checkEmailExists(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  // Memoize form validity check to prevent infinite re-renders
  const isFormValid = useMemo(() => {
    const hasName = form.name.trim().length >= 2;
    const hasValidEmail = validateEmail(form.email) && !emailExists;
    const hasNoErrors = !formErrors.name && !formErrors.email;
    return hasName && hasValidEmail && hasNoErrors && !isCheckingEmail;
  }, [form.name, form.email, formErrors, emailExists, isCheckingEmail]);

  return (
    <div className="bg-white min-h-screen">
      <SuperAdminHeader user={user} onLogout={handleLogout} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#5f0c18]">ADMIN ACCOUNTS</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              style={{ borderColor: BORDER, height: 40, color: "#111" }}
            >
              <Icons.Refresh />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-7">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("accounts")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "accounts"
                    ? "border-[#7a0f1f] text-[#7a0f1f]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Accounts
              </button>
              <button
                onClick={() => setActiveTab("permission")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "permission"
                    ? "border-[#7a0f1f] text-[#7a0f1f]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Permission
              </button>
              <button
                onClick={() => setActiveTab("placeholder")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "placeholder"
                    ? "border-[#7a0f1f] text-[#7a0f1f]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Placeholder
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "accounts" && (
              <div className="flex flex-col gap-6 lg:flex-row">
                {/* Create Admin Button */}
                <div className="flex items-center justify-between mb-4 lg:col-span-2">
                  <div>
                    <h2 className="text-lg font-bold text-[#5f0c18]">Admin Accounts Management</h2>
                    <p className="text-sm text-gray-600 mt-1">Create and manage admin accounts</p>
                  </div>
                  <button
                    onClick={() => setShowCreate((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                    style={{ background: "#7a0f1f", height: 40 }}
                  >
                    <Icons.Plus />
                    Create Admin
                  </button>
                </div>

          {/* Create */}
          {showCreate && (
            <div
              className="transition-[flex-basis,opacity] duration-[500ms] ease-in-out opacity-100"
              style={{ flexBasis: "33.333%", flexShrink: 0 }}
            >
              <section
                className="rounded-lg bg-white p-5 shadow-sm border"
                style={{ borderColor: BORDER }}
              >
                <div className="transition-opacity duration-[500ms] ease-in-out opacity-100 delay-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#5f0c18]">Create Admin Account</h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                      style={{ borderColor: BORDER, color: "#111" }}
                    >
                      Close
                    </button>
                  </div>

                  <form className="mt-4 grid gap-3" onSubmit={onCreate}>
                  <Field label="Account Name">
                    <input
                      value={form.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors ${
                        formErrors.name ? 'border-red-500' : form.name && !formErrors.name ? 'border-green-500' : ''
                      }`}
                      style={{ borderColor: formErrors.name ? '#ef4444' : form.name && !formErrors.name ? '#10b981' : BORDER, color: "#111" }}
                    />
                    {formErrors.name && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.name}</div>
                    )}
                  </Field>

                  <Field label="Email">
                    <div className="relative">
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors pr-8 ${
                          formErrors.email || emailExists ? 'border-red-500' : form.email && !formErrors.email && !emailExists ? 'border-green-500' : ''
                        }`}
                        style={{ borderColor: formErrors.email || emailExists ? '#ef4444' : form.email && !formErrors.email && !emailExists ? '#10b981' : BORDER, color: "#111" }}
                      />
                      {isCheckingEmail && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                      {!isCheckingEmail && form.email && !formErrors.email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {emailExists ? (
                            <div className="w-4 h-4 text-red-500">✕</div>
                          ) : (
                            <div className="w-4 h-4 text-green-500">✓</div>
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.email && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.email}</div>
                    )}
                    {emailExists && !formErrors.email && (
                      <div className="text-red-500 text-xs mt-1">This email is already in use</div>
                    )}
                  </Field>

                  <button
                    type="submit"
                    className="mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#7a0f1f", height: 40 }}
                    disabled={!isFormValid}
                  >
                    Create Account
                  </button>
                </form>
                </div>
              </section>
            </div>
          )}

          {/* List */}
          <section
            className="rounded-lg bg-white p-5 shadow-sm border transition-[flex-basis] duration-[500ms] ease-in-out"
            style={{ borderColor: BORDER, flexBasis: showCreate ? "66.667%" : "100%", flexGrow: 1 }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#5f0c18]">Admin Accounts List</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search accounts..."
                    className="w-full rounded-md border bg-white px-10 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, height: 40, color: "#111" }}
                  />
                </div>
                
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    showAdvancedFilters 
                      ? "bg-[#7a0f1f] text-white" 
                      : "bg-white text-gray-700 border hover:bg-gray-50"
                  }`}
                  style={{ borderColor: showAdvancedFilters ? undefined : BORDER }}
                >
                  {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
                </button>
                
                <div className="flex items-center border border-gray-200 rounded-md" style={{ borderColor: BORDER }}>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`p-2 ${viewMode === "cards" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700"}`}
                    style={{ borderRadius: "6px 0 0 6px" }}
                    title="Card View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 ${viewMode === "table" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700"}`}
                    style={{ borderRadius: "0 6px 6px 0" }}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters - Toggled */}
            {showAdvancedFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border animate-in slide-in-from-top-2 duration-200" style={{ borderColor: BORDER }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  {/* Status Filter */}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Status Filter</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          statusFilter === "all" 
                            ? "bg-[#7a0f1f] text-white" 
                            : "bg-white text-gray-700 border hover:bg-gray-50"
                        }`}
                        style={{ borderColor: statusFilter !== "all" ? BORDER : undefined }}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter("Active")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          statusFilter === "Active" 
                            ? "bg-green-500 text-white" 
                            : "bg-white text-gray-700 border hover:bg-gray-50"
                        }`}
                        style={{ borderColor: statusFilter !== "Active" ? BORDER : undefined }}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setStatusFilter("Inactive")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          statusFilter === "Inactive" 
                            ? "bg-gray-500 text-white" 
                            : "bg-white text-gray-700 border hover:bg-gray-50"
                        }`}
                        style={{ borderColor: statusFilter !== "Inactive" ? BORDER : undefined }}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Activation Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="flex-1 rounded-md border px-2 py-1.5 text-xs"
                        style={{ borderColor: BORDER }}
                      />
                      <span className="text-gray-500 self-center">to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="flex-1 rounded-md border px-2 py-1.5 text-xs"
                        style={{ borderColor: BORDER }}
                      />
                    </div>
                  </div>

                  {/* Save Search */}
                  <div>
                    <button
                      onClick={() => setShowSaveSearchModal(true)}
                      className="px-4 py-1.5 text-xs font-medium rounded-md bg-[#7a0f1f] text-white hover:opacity-95 disabled:opacity-50"
                      disabled={!query && statusFilter === "all" && !dateRange.start && !dateRange.end}
                    >
                      Save Search
                    </button>
                  </div>

                  {/* Clear Filters */}
                  <div>
                    <button
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("all");
                        setDateRange({ start: "", end: "" });
                      }}
                      className="px-4 py-1.5 text-xs font-medium rounded-md border text-gray-700 hover:bg-gray-50"
                      style={{ borderColor: BORDER }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/* Saved Searches */}
                {savedSearches.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Saved Searches</div>
                    <div className="flex flex-wrap gap-2">
                      {savedSearches.map((search, index) => (
                        <div
                          key={index}
                          className="group relative flex items-center gap-1 px-3 py-1 text-xs bg-white border rounded-md hover:bg-gray-50 transition-colors"
                          style={{ borderColor: BORDER }}
                        >
                          <button
                            onClick={() => {
                              setQuery(search.query);
                              setStatusFilter(search.status);
                              setDateRange(search.dateRange);
                            }}
                            className="flex-1 text-left"
                          >
                            {search.name}
                          </button>
                          <button
                            onClick={() => removeSavedSearch(index)}
                            className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                            title="Remove search"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                  <div className="mt-2 text-xs text-neutral-800">Create a record or adjust your search.</div>
                </div>
              ) : viewMode === "cards" ? (
                <div className={`grid gap-4 ${showCreate ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                  {filtered.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#7a0f1f]">
                              {a.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900">{a.name}</h3>
                            <p className="text-sm text-neutral-600">{a.email}</p>
                          </div>
                        </div>
                        <select
                          value={a.status}
                          onChange={(e) => onChangeStatus(a.id, e.target.value as Status)}
                          className="rounded-md border px-2 text-[11px] font-semibold outline-none"
                          style={{
                            borderColor: BORDER,
                            height: 30,
                            width: 90,
                            background: a.status === "Active" ? "rgba(16,185,129,0.10)" : "rgba(148,163,184,0.16)",
                            color: a.status === "Active" ? "#065f46" : "#334155",
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-neutral-500">
                          Activated on: {a.activatedOn}
                        </div>
                        <button
                          onClick={() => openEditModal(a)}
                          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                          style={{ background: "#7a0f1f", height: 32 }}
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Icons.Edit />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
                  <div
                    className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900"
                    style={{ gridTemplateColumns: tableCols }}
                  >
                    <div>Account Name</div>
                    <div>Email</div>
                    <div className="text-center">Status</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {filtered.map((a) => (
                    <div
                      key={a.id}
                      className="grid items-center px-4 py-3 text-sm border-t"
                      style={{ borderColor: BORDER, color: "#111", gridTemplateColumns: tableCols }}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900 truncate">{a.name}</div>
                        <div className="text-[11px] text-neutral-800 truncate">Activated on: {a.activatedOn}</div>
                      </div>

                      <div className="min-w-0 text-neutral-900 truncate">{a.email}</div>

                      <div className="flex items-center justify-center">
                        <select
                          value={a.status}
                          onChange={(e) => onChangeStatus(a.id, e.target.value as Status)}
                          className="rounded-md border px-2 text-[11px] font-semibold outline-none"
                          style={{
                            borderColor: BORDER,
                            height: 30,
                            width: 90,
                            background: a.status === "Active" ? "rgba(16,185,129,0.10)" : "rgba(148,163,184,0.16)",
                            color: a.status === "Active" ? "#065f46" : "#334155",
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(a)}
                          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                          style={{ background: "#7a0f1f", height: 32 }}
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Icons.Edit />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
            )}

            {activeTab === "permission" && (
              <div className="rounded-lg bg-white p-6 shadow-sm border" style={{ borderColor: BORDER }}>
                <h2 className="text-lg font-bold text-[#5f0c18] mb-4">Permission Management</h2>
                <p className="text-gray-600">Manage user permissions and access controls.</p>
                <div className="mt-6 text-center py-12">
                  <div className="text-3xl font-bold text-[#5f0c18]">Coming Soon</div>
                  <div className="mt-2 text-sm text-neutral-800">Permission management features will be available soon.</div>
                </div>
              </div>
            )}

            {activeTab === "placeholder" && (
              <div className="rounded-lg bg-white p-6 shadow-sm border" style={{ borderColor: BORDER }}>
                <h2 className="text-lg font-bold text-[#5f0c18] mb-4">Placeholder</h2>
                <p className="text-gray-600">Additional management features.</p>
                <div className="mt-6 text-center py-12">
                  <div className="text-3xl font-bold text-[#5f0c18]">Coming Soon</div>
                  <div className="mt-2 text-sm text-neutral-800">Additional features will be available soon.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={closeEditModal}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl border"
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#5f0c18]">Edit Admin Account</h3>
                <p className="mt-1 text-xs text-neutral-800">Update account details (UI only).</p>
              </div>

              <button
                onClick={closeEditModal}
                className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                style={{ borderColor: BORDER, color: "#111" }}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <Field label="Account Name">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </Field>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={closeEditModal}
                  className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  style={{ borderColor: BORDER, color: "#111", height: 40 }}
                >
                  Cancel
                </button>

                <button
                  onClick={saveEdit}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowSuccess(false)}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl border"
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold text-[#5f0c18]">Success</div>
            <div className="mt-2 text-sm text-neutral-800">Successfully added role</div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={() => setShowSuccess(false)}
                className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                style={{ background: "#7a0f1f", height: 40 }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateSuccess && (
        <SuccessModal
          isOpen={showCreateSuccess}
          onClose={() => setShowCreateSuccess(false)}
          title="Account Created Successfully"
          message="Admin account has been created. An activation email has been sent to the user."
        />
      )}

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowSaveSearchModal(false)}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl border"
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold text-[#5f0c18]">Save Search</div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Search Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter search name..."
                className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={{ borderColor: BORDER, color: "#111" }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveSearch();
                  }
                }}
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveSearchModal(false);
                  setSearchName("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                style={{ borderColor: BORDER }}
              >
                Cancel
              </button>
              <button
                onClick={saveSearch}
                className="px-4 py-2 text-sm font-semibold text-white hover:opacity-95 rounded-md disabled:opacity-50"
                style={{ background: "#7a0f1f", height: 40 }}
                disabled={!searchName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Small components ===== */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold" style={{ color: "#111" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

