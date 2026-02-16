"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Grid, List, X, Eye } from "lucide-react";
import SuperAdminHeader from "@/components/layout/SuperAdminHeader";
import Sidebar from "@/components/layout/Sidebar";
import { managementSidebarItems } from "@/components/layout/ManagementSidebar";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type Status = "Active" | "Inactive" | "Suspended";

type AdminAccount = {
  id: string;
  name: string;
  email: string;
  status: Status;
  promoted_at?: string | null;
  updated_at?: string;
};

type FormErrors = {
  name?: string;
  email?: string;
};

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

const BORDER = "rgba(0,0,0,0.12)";

// Safe date parsing function
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Date parsing error:', error, 'for date:', dateString);
    return 'Invalid date';
  }
};

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
  Eye: (props: any) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("accounts");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isEditing, setIsEditing] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showSuspendSuccess, setShowSuspendSuccess] = useState(false);

  // Fetch admin accounts
  React.useEffect(() => {
    fetchAdminAccounts();
  }, []);

  async function fetchAdminAccounts() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin accounts');
      }

      const data = await response.json();
      if (data.success && data.data?.data) {
        setAccounts(data.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin accounts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Form validation states
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingActionType, setLoadingActionType] = useState<'create' | 'update' | 'suspend' | 'edit'>('create');

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [editPanelClosing, setEditPanelClosing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  // Search and filter states
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [savedSearches, setSavedSearches] = useState<Array<{name: string, query: string, status: Status | "all", dateRange: {start: string, end: string}}>>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  const searchParams = useSearchParams();

  // Sync activeTab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "permission" || tab === "placeholder" || tab === "accounts") {
      setActiveTab(tab);
    } else {
      setActiveTab("accounts");
    }
  }, [searchParams]);

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreate(false);
      setCreatePanelClosing(false);
      setForm({ name: "", email: "" });
      setFormErrors({});
      setApprovedEmployees([]);
      setPromoteSearchQuery("");
    }, 350);
  };

  // Approved employees for promotion to admin
  const [approvedEmployees, setApprovedEmployees] = useState<Array<{ id: number; first_name: string; last_name: string; email: string; position: string }>>([]);
  const [approvedEmployeesLoading, setApprovedEmployeesLoading] = useState(false);
  const [promotingId, setPromotingId] = useState<number | null>(null);
  const [promoteSearchQuery, setPromoteSearchQuery] = useState("");
  const [promoteConfirmEmployee, setPromoteConfirmEmployee] = useState<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null>(null);
  const [showPromoteLoading, setShowPromoteLoading] = useState(false);
  const [showPromoteFail, setShowPromoteFail] = useState(false);
  const [promoteFailMessage, setPromoteFailMessage] = useState("");
  const [revertConfirmAdmin, setRevertConfirmAdmin] = useState<AdminAccount | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [showRevertSuccess, setShowRevertSuccess] = useState(false);
  const [showRevertFail, setShowRevertFail] = useState(false);
  const [showRevertLoading, setShowRevertLoading] = useState(false);
  const [revertFailMessage, setRevertFailMessage] = useState("");

  const filteredApprovedEmployees = useMemo(() => {
    if (!promoteSearchQuery.trim()) return approvedEmployees;
    const q = promoteSearchQuery.trim().toLowerCase();
    return approvedEmployees.filter(
      (emp) =>
        (emp.first_name?.toLowerCase() ?? "").includes(q) ||
        (emp.last_name?.toLowerCase() ?? "").includes(q) ||
        (emp.email?.toLowerCase() ?? "").includes(q) ||
        (emp.position?.toLowerCase() ?? "").includes(q)
    );
  }, [approvedEmployees, promoteSearchQuery]);

  const fetchApprovedEmployees = async () => {
    setApprovedEmployeesLoading(true);
    try {
      const res = await fetch("/api/employees?eligible_for_promotion=1");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setApprovedEmployees(data.data);
      } else {
        setApprovedEmployees([]);
      }
    } catch {
      setApprovedEmployees([]);
    } finally {
      setApprovedEmployeesLoading(false);
    }
  };

  // Fetch approved employees when Create panel opens
  useEffect(() => {
    if (showCreate && !createPanelClosing) {
      fetchApprovedEmployees();
    }
  }, [showCreate, createPanelClosing]);

  const handlePromoteToAdmin = async (employeeId: number) => {
    setPromoteConfirmEmployee(null);
    setPromotingId(employeeId);
    setShowPromoteLoading(true);
    try {
      const res = await fetch("/api/admin/accounts/promote-from-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAdminAccounts();
        setApprovedEmployees((prev) => prev.filter((e) => e.id !== employeeId));
        setShowCreateSuccess(true);
      } else {
        setPromoteFailMessage(data.message || "Failed to promote employee to admin");
        setShowPromoteFail(true);
      }
    } catch {
      setPromoteFailMessage("Failed to promote employee to admin");
      setShowPromoteFail(true);
    } finally {
      setPromotingId(null);
      setShowPromoteLoading(false);
    }
  };

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

  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/admin/accounts");
        const data = await res.json();
        if (res.ok && data.success) setAccounts(data.data?.data || []);
      } catch {
        setError("Network error");
      }
    };
    fetchAccounts();
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
        const accountDate = new Date(a.promoted_at || a.updated_at || 0);
        const startDate = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
        const endDate = dateRange.end ? new Date(dateRange.end) : new Date('2100-12-31');
        return accountDate >= startDate && accountDate <= endDate;
      });
    }

    return filteredAccounts;
  }, [accounts, query, statusFilter, dateRange]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.name.trim() || !form.email.trim()) {
      setFormErrors({
        name: !form.name.trim() ? 'Account name is required' : '',
        email: !form.email.trim() ? 'Email is required' : '',
      });
      return;
    }

    setIsCreating(true);
    setShowLoadingModal(true);
    setLoadingActionType('create');
    setFormErrors({});

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create admin account');
      }

      // Refresh the accounts list
      await fetchAdminAccounts();
      
      // Reset form and close panel
      setForm({ name: '', email: '' });
      closeCreatePanel();
      setShowCreateSuccess(true);
    } catch (error: any) {
      console.error('Error creating admin:', error);
      setError(error.message || 'Failed to create admin account');
    } finally {
      setIsCreating(false);
      setShowLoadingModal(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this admin account?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      } else {
        setError(data.message || "Failed to delete admin account");
      }
    } catch (error) {
      setError("Failed to delete admin account");
    }
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

  function openEditPanel(item: AdminAccount) {
    setEditing(item);
    setEditForm({
      name: item.name,
      email: item.email,
    });
  }

  function closeEditPanel() {
    setEditPanelClosing(true);
    setTimeout(() => {
      setEditing(null);
      setEditPanelClosing(false);
    }, 350);
  }

  async function handleRevertToEmployee() {
    if (!revertConfirmAdmin) return;
    const adminId = revertConfirmAdmin.id;
    setRevertConfirmAdmin(null);
    setIsReverting(true);
    setShowRevertLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts/${adminId}/revert-to-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        closeEditPanel();
        await fetchAdminAccounts();
        setAccounts((prev) => prev.filter((a) => a.id !== adminId));
        setShowRevertSuccess(true);
      } else {
        setRevertFailMessage(data.message || "Failed to revert to employee");
        setShowRevertFail(true);
      }
    } catch {
      setRevertFailMessage("Failed to revert to employee");
      setShowRevertFail(true);
    } finally {
      setIsReverting(false);
      setShowRevertLoading(false);
    }
  }

  async function handleSuspendUnsuspend() {
    if (!editing) return;

    console.log('handleSuspendUnsuspend called for admin:', editing.id, 'current status:', editing.status);

    setIsSuspending(true);
    setShowLoadingModal(true);
    setLoadingActionType('suspend');

    try {
      const newStatus = editing.status === "Suspended" ? "Active" : "Suspended";
      console.log('New status will be:', newStatus);
      
      const response = await fetch(`/api/admin/accounts/${editing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      console.log('Frontend response status:', response.status);
      console.log('Frontend response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        throw new Error(errorData.message || 'Failed to update admin status');
      }

      const data = await response.json();
      console.log('Success response data:', data);

      if (data.success) {
        // Update local state
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === editing.id
              ? { ...a, status: newStatus }
              : a
          )
        );

        // Update editing state
        setEditing((prev) => 
          prev ? { ...prev, status: newStatus } : null  
        );

        // Show success modal   
        setShowSuspendSuccess(true);
        closeEditPanel();
      } else {
        throw new Error(data.message || 'Failed to update admin status');
      }
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      setError(error.message || 'Failed to update admin status');
    } finally {
      setIsSuspending(false);
      setShowLoadingModal(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    setIsEditing(true);
    setShowLoadingModal(true);
    setLoadingActionType('edit');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

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

      setShowEditSuccess(true);
      closeEditPanel();
    } catch (error) {
      console.error('Failed to save admin:', error);
    } finally {
      setIsEditing(false);
      setShowLoadingModal(false);
    }
  }

  const tableCols = "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px";

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
    try {
      const res = await fetch(`/api/admin/accounts?check_email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailExists(data.data?.exists || false);
      }
    } catch (error) {
      console.error("Email check failed:", error);
    } finally {
      setIsCheckingEmail(false);
    }
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

  const getLoadingModalContent = () => {
    switch (loadingActionType) {
      case 'create':
        return {
          title: 'Creating Admin Account',
          message: 'Please wait while we create the new admin account...'
        };
      case 'edit':
        return {
          title: 'Updating Admin Account',
          message: 'Please wait while we update the admin account details...'
        };
      case 'suspend':
        return {
          title: 'Updating Admin Status',
          message: 'Please wait while we update the admin account status...'
        };
      default:
        return {
          title: 'Processing',
          message: 'Please wait...'
        };
    }
  };

  const loadingContent = getLoadingModalContent();

  return (
    <div className="min-h-screen flex flex-col">
      <SuperAdminHeader user={user} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          items={managementSidebarItems}
          onLogout={handleLogout}
          showProfile={false}
        />
        <main className="flex-1 overflow-auto bg-gray-100">
          <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Maroon Gradient Header */}
          <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-4xl font-bold">Admins</h1>
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-md border border-white/50 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                style={{ height: 40 }}
              >
                <Icons.Refresh />
                Refresh
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "accounts" && (
              <section
                className="rounded-lg bg-white p-5 shadow-sm border"
                style={{ borderColor: BORDER }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#5f0c18]">Admin List</h2>
                    <p className="text-sm text-gray-600 mt-1">Create and manage admin accounts</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowCreate(true)}
                      className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                      style={{ background: "#7a0f1f", height: 40 }}
                    >
                      <Icons.Plus />
                      Create Admin
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
                  <div className="flex-1" />
                  <div className="flex flex-wrap items-center gap-3">
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

                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          statusFilter === "all" ? "bg-[#7a0f1f] text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
                        }`}
                        style={{ borderColor: statusFilter !== "all" ? BORDER : undefined }}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter("Active")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          statusFilter === "Active" ? "bg-green-500 text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
                        }`}
                        style={{ borderColor: statusFilter !== "Active" ? BORDER : undefined }}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setStatusFilter("Inactive")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          statusFilter === "Inactive" ? "bg-gray-500 text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
                        }`}
                        style={{ borderColor: statusFilter !== "Inactive" ? BORDER : undefined }}
                      >
                        Inactive
                      </button>
                      <button
                        onClick={() => setStatusFilter("Suspended")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          statusFilter === "Suspended" ? "bg-red-500 text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
                        }`}
                        style={{ borderColor: statusFilter !== "Suspended" ? BORDER : undefined }}
                      >
                        Suspended
                      </button>
                    </div>

                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        showAdvancedFilters ? "bg-[#7a0f1f] text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
                      }`}
                      style={{ borderColor: showAdvancedFilters ? undefined : BORDER }}
                    >
                      {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
                    </button>

                    <div className="flex border rounded-md" style={{ borderColor: BORDER }}>
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
                  {isLoading ? (
                    viewMode === "cards" ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: 'min-content' }}>
                            {[...Array(6)].map((_, index) => (
                              <AdminCardSkeleton key={index} />
                            ))}
                          </div>
                        ) : (
                          <AdminTableSkeleton />
                        )
                      ) : filtered.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                          <div className="mt-2 text-xs text-neutral-800">Create a record or adjust your search.</div>
                        </div>
                    ) : viewMode === "cards" ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: 'min-content' }}>
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
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] text-neutral-500">
                                  Promoted on: {a.promoted_at ? formatDate(a.promoted_at) : '—'}
                                </div>
                                <button
                                  onClick={() => openEditPanel(a)}
                                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                                  style={{ background: "#7a0f1f", height: 32 }}
                                  title="View"
                                  aria-label="View"
                                >
                                  <Icons.Eye />
                                  View
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
                                <div className="text-[11px] text-neutral-800">
                                  Promoted on: {a.promoted_at ? formatDate(a.promoted_at) : '—'}
                                </div>
                              </div>

                              <div className="min-w-0 text-neutral-900 truncate">{a.email}</div>

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditPanel(a)}
                                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                                  style={{ background: "#7a0f1f", height: 32 }}
                                  title="View"
                                  aria-label="View"
                                >
                                  <Icons.Eye />
                                  View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                </div>
              </section>
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
      </div>

      {/* Create Admin Side Panel */}
      {(showCreate || createPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              createPanelClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeCreatePanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
            style={{
              animation: createPanelClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <h2 className="text-lg font-bold">Promote to Admin</h2>
                <p className="text-sm text-white/90 mt-0.5">
                  Select an approved employee to promote as admin.
                </p>
              </div>
              <button
                onClick={closeCreatePanel}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-shrink-0 px-4 pt-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or position..."
                  value={promoteSearchQuery}
                  onChange={(e) => setPromoteSearchQuery(e.target.value)}
                  className="w-full rounded-md border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/30"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
              {approvedEmployeesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7a0f1f]"></div>
                </div>
              ) : approvedEmployees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No approved employees available for promotion.</p>
                  <p className="text-xs mt-2">Approve employees from the Masterfile first.</p>
                </div>
              ) : filteredApprovedEmployees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No employees match your search.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredApprovedEmployees.map((emp) => (
                    <li
                      key={emp.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                        <p className="text-xs text-gray-400">{emp.position}</p>
                      </div>
                      <button
                        onClick={() => setPromoteConfirmEmployee({ id: emp.id, first_name: emp.first_name, last_name: emp.last_name, email: emp.email })}
                        disabled={promotingId !== null}
                        className="flex-shrink-0 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "#7a0f1f" }}
                      >
                        {promotingId === emp.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                            Promoting...
                          </>
                        ) : (
                          <>
                            <Icons.Plus />
                            Promote to Admin
                          </>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Promote to Admin Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!promoteConfirmEmployee}
        onClose={() => setPromoteConfirmEmployee(null)}
        onConfirm={() => promoteConfirmEmployee && handlePromoteToAdmin(promoteConfirmEmployee.id)}
        title="Confirm Promotion"
        message={
          promoteConfirmEmployee
            ? `Are you sure you want to promote ${promoteConfirmEmployee.first_name} ${promoteConfirmEmployee.last_name} (${promoteConfirmEmployee.email}) to admin? An email notification will be sent to them.`
            : ""
        }
        confirmText="Confirm Promote"
        cancelText="Cancel"
      />

      {/* Promote Loading Modal */}
      <LoadingModal
        isOpen={showPromoteLoading}
        title="Promoting to Admin"
        message="Please wait while we promote the employee and send the notification email..."
      />

      {/* Promote Fail Modal */}
      <FailModal
        isOpen={showPromoteFail}
        onClose={() => setShowPromoteFail(false)}
        title="Failed to Promote"
        message={promoteFailMessage}
        buttonText="OK"
      />

      {/* Revert to Employee Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!revertConfirmAdmin}
        onClose={() => setRevertConfirmAdmin(null)}
        onConfirm={() => handleRevertToEmployee()}
        title="Revert to Employee"
        message={
          revertConfirmAdmin
            ? `Are you sure you want to revert ${revertConfirmAdmin.name} (${revertConfirmAdmin.email}) back to employee? They will lose admin access.`
            : ""
        }
        confirmText="Revert to Employee"
        cancelText="Cancel"
      />

      {/* Revert Loading Modal */}
      <LoadingModal
        isOpen={showRevertLoading}
        title="Reverting to Employee"
        message="Please wait while we revert the admin back to employee..."
      />

      {showRevertSuccess && (
        <SuccessModal
          isOpen={showRevertSuccess}
          onClose={() => setShowRevertSuccess(false)}
          title="Reverted to Employee"
          message="The admin has been reverted to employee successfully. They will no longer have admin access."
        />
      )}

      <FailModal
        isOpen={showRevertFail}
        onClose={() => setShowRevertFail(false)}
        title="Failed to Revert"
        message={revertFailMessage}
        buttonText="OK"
      />

      {/* Admin View Side Panel */}
      {(editing || editPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              editPanelClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeEditPanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
            style={{
              animation: editPanelClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <h2 className="text-lg font-bold">{editing?.name}</h2>
                <p className="text-sm text-white/90 mt-0.5">{editing?.email}</p>
              </div>
              <button
                onClick={closeEditPanel}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Promoted on</label>
                <div className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50" style={{ borderColor: BORDER }}>
                  {editing?.promoted_at ? formatDate(editing.promoted_at) : "—"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50" style={{ borderColor: BORDER }}>
                  {editing?.email}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={closeEditPanel}
                  className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  style={{ borderColor: BORDER, color: "#111", height: 40 }}
                >
                  Close
                </button>

                {editForm.name !== editing?.name && (
                  <button
                    onClick={saveEdit}
                    disabled={isEditing}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                    style={{ background: "#7a0f1f", height: 40 }}
                  >
                    {isEditing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                )}

                <button
                  onClick={() => setRevertConfirmAdmin(editing)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 border border-orange-300 bg-orange-500 hover:bg-orange-600"
                  style={{ height: 40 }}
                >
                  Revert to Employee
                </button>
              </div>
            </div>
          </div>
        </>
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
          title="Employee Promoted to Admin"
          message="The employee has been promoted to admin successfully. A notification email has been sent to them."
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

      {showEditSuccess && (
        <SuccessModal
          isOpen={showEditSuccess}
          onClose={() => setShowEditSuccess(false)}
          title="Admin Account Updated Successfully"
          message="Admin account details have been updated successfully."
        />
      )}

      {showSuspendSuccess && (
        <SuccessModal
          isOpen={showSuspendSuccess}
          onClose={() => setShowSuspendSuccess(false)}
          title="Admin Status Updated Successfully"
          message="Admin account status has been updated successfully."
        />
      )}

      {showLoadingModal && (
        <LoadingModal
          isOpen={showLoadingModal}
          title={loadingContent.title}
          message={loadingContent.message}
        />
      )}
    </div>
  );
}

/* ===== Skeleton Loading Components ===== */

function AdminCardSkeleton() {
  return (
    <div
      className="rounded-lg bg-white border shadow-sm p-4 animate-pulse"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-[11px] space-y-1 flex-1">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
}

function AdminTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
      <div
        className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900"
        style={{ gridTemplateColumns: "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px" }}
      >
        <div>Account Name</div>
        <div>Email</div>
        <div className="text-right">Actions</div>
      </div>

      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="grid items-center px-4 py-3 text-sm border-t animate-pulse"
          style={{ borderColor: BORDER, gridTemplateColumns: "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px" }}
        >
          <div className="min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="flex items-center justify-end">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
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

