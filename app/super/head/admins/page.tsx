"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Eye, Inbox, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
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

// Reusable Pagination Component
const Pagination = ({
  paginationMeta,
  currentPage,
  setCurrentPage,
  itemName = "items",
}: {
  paginationMeta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  itemName?: string;
}) => {
  if (!paginationMeta || paginationMeta.total === 0) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: BORDER }}>
      <div className="text-sm text-neutral-600">
        Showing {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} {itemName}
      </div>
      {paginationMeta.last_page > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={paginationMeta.current_page === 1}
            className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{ borderColor: BORDER }}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {[...Array(paginationMeta.last_page)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === paginationMeta.last_page || (page >= paginationMeta.current_page - 1 && page <= paginationMeta.current_page + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      paginationMeta.current_page === page ? "bg-[#7a0f1f] text-white" : "border hover:bg-gray-50"
                    }`}
                    style={paginationMeta.current_page !== page ? { borderColor: BORDER } : undefined}
                  >
                    {page}
                  </button>
                );
              } else if (page === paginationMeta.current_page - 2 || page === paginationMeta.current_page + 2) {
                return <span key={page} className="px-2 text-neutral-500">...</span>;
              }
              return null;
            })}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(paginationMeta.last_page, p + 1))}
            disabled={paginationMeta.current_page === paginationMeta.last_page}
            className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{ borderColor: BORDER }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default function ManagementPage() {
  const [error, setError] = useState("");

  // Admin management states
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("accounts");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showSuspendSuccess, setShowSuspendSuccess] = useState(false);

  // Fetch admin accounts
  React.useEffect(() => {
    fetchAdminAccounts();
  }, [query, currentPage, sortBy, sortOrder]);

  async function fetchAdminAccounts() {
    setIsLoading(true);
    try {
      const url = new URL('/api/admin/accounts', window.location.origin);
      if (query.trim()) {
        url.searchParams.append('search', query.trim());
      }
      url.searchParams.append('page', currentPage.toString());
      url.searchParams.append('per_page', '10');
      url.searchParams.append('sort_by', sortBy);
      url.searchParams.append('sort_order', sortOrder);

      const response = await fetch(url.toString(), {
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
        
        // Store pagination metadata
        if (data.data?.current_page !== undefined) {
          setPaginationMeta({
            current_page: data.data.current_page || 1,
            last_page: data.data.last_page || 1,
            per_page: data.data.per_page || 10,
            total: data.data.total || 0,
            from: data.data.from || 0,
            to: data.data.to || 0,
          });
        } else {
          setPaginationMeta(null);
        }
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

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortBy, sortOrder]);

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
        setRevertFailMessage(data.message || "Failed to remove admin access");
        setShowRevertFail(true);
      }
    } catch {
      setRevertFailMessage("Failed to remove admin access");
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
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Admins</h1>
      </div>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            {(["accounts", "permission", "placeholder"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set("tab", tab);
                  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
                  setActiveTab(tab);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={activeTab !== tab ? { borderColor: BORDER } : undefined}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "accounts" && (
              <section
                className="rounded-md bg-white p-5 shadow-sm border"
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
                      <ArrowUp className="w-4 h-4" />
                      Promote to Admin
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end mt-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={onRefresh}
                      className="p-2 rounded-md border hover:bg-gray-50 transition-colors"
                      style={{ borderColor: BORDER }}
                      title="Refresh"
                    >
                      <Icons.Refresh />
                    </button>
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

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                          setSortBy(newSortBy);
                          setSortOrder(newSortOrder);
                        }}
                        className="appearance-none rounded-md border bg-white px-4 py-2 pr-8 text-sm outline-none cursor-pointer hover:bg-gray-50"
                        style={{ borderColor: BORDER, height: 40, color: "#111" }}
                      >
                        <option value="date-desc">Date Promoted (Newest First)</option>
                        <option value="date-asc">Date Promoted (Oldest First)</option>
                        <option value="name-asc">Alphabetical (A-Z)</option>
                        <option value="name-desc">Alphabetical (Z-A)</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Pagination at the top */}
                {paginationMeta && (
                  <Pagination
                    paginationMeta={paginationMeta}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemName="admins"
                  />
                )}

                <div className="mt-4">
                  {isLoading ? (
                    <AdminTableSkeleton />
                  ) : accounts.length === 0 ? (
                    <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                      <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                      <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                      <div className="mt-2 text-xs text-neutral-800">Create a record or adjust your search.</div>
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 shrink-0"></div>
                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-bold text-neutral-900">
                              <div>Account Name</div>
                              <div>Email</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right text-sm font-bold text-neutral-900 w-20">Promoted</div>
                            <div className="text-sm font-bold text-neutral-900 w-20">Status</div>
                            <div className="w-20"></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {accounts.map((a) => (
                          <div
                            key={a.id}
                            className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                            style={{ borderColor: BORDER }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center shrink-0">
                                  <span className="text-base font-semibold text-[#7a0f1f]">{a.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-neutral-900 truncate">{a.name}</div>
                                    <div className="text-xs text-neutral-500 mt-0.5">Account Name</div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm text-neutral-900 truncate">{a.email}</div>
                                    <div className="text-xs text-neutral-500 mt-0.5">Email</div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <div className="text-xs text-neutral-500 mb-1">Promoted</div>
                                  <div className="text-xs text-neutral-700">{a.promoted_at ? formatDate(a.promoted_at) : "—"}</div>
                                </div>
                                <div
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                                    a.status === "Active" ? "bg-green-100 text-green-700" :
                                    a.status === "Suspended" ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {a.status}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "permission" && (
              <div className="rounded-md bg-white p-6 shadow-sm border" style={{ borderColor: BORDER }}>
                <h2 className="text-lg font-bold text-[#5f0c18] mb-4">Permission Management</h2>
                <p className="text-gray-600">Manage user permissions and access controls.</p>
                <div className="mt-6 text-center py-12">
                  <div className="text-3xl font-bold text-[#5f0c18]">Coming Soon</div>
                  <div className="mt-2 text-sm text-neutral-800">Permission management features will be available soon.</div>
                </div>
              </div>
            )}

            {activeTab === "placeholder" && (
              <div className="rounded-md bg-white p-6 shadow-sm border" style={{ borderColor: BORDER }}>
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

      {/* Promote to Admin Side Panel */}
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
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
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
                <ul className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <PromotePanelEmployeeSkeleton key={i} />
                  ))}
                </ul>
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
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
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
                            <div className="animate-spin  h-3.5 w-3.5 border-b-2 border-white"></div>
                            Promoting...
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-4 h-4" />
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

      {/* Remove Admin Access Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!revertConfirmAdmin}
        onClose={() => setRevertConfirmAdmin(null)}
        onConfirm={() => handleRevertToEmployee()}
        title="Remove Admin Access"
        message={
          revertConfirmAdmin
            ? `Are you sure you want to remove admin access from ${revertConfirmAdmin.name} (${revertConfirmAdmin.email})? They will be reverted to employee.`
            : ""
        }
        confirmText="Remove Admin Access"
        cancelText="Cancel"
      />

      <LoadingModal
        isOpen={showRevertLoading}
        title="Removing Admin Access"
        message="Please wait while we remove admin access..."
      />

      {showRevertSuccess && (
        <SuccessModal
          isOpen={showRevertSuccess}
          onClose={() => setShowRevertSuccess(false)}
          title="Admin Access Removed"
          message="Admin access has been removed successfully. They will no longer have admin privileges."
        />
      )}

      <FailModal
        isOpen={showRevertFail}
        onClose={() => setShowRevertFail(false)}
        title="Failed to Remove Admin Access"
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
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
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
              {isEditing ? (
                <EditPanelSkeleton />
              ) : (
                <>
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
                        <div className="animate-spin  h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Saving...
                      </>
                    ) : (
                     "Save Changes"
                    )}
                  </button>
                )}

                <button
                  onClick={() => setRevertConfirmAdmin(editing)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 border border-orange-300 bg-orange-500 hover:bg-orange-600 inline-flex items-center gap-2"
                  style={{ height: 40 }}
                >
                  <ArrowDown className="w-4 h-4" />
                  Remove Admin Access
                </button>
              </div>
                </>
              )}
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
            className="w-full max-w-sm rounded-md bg-white p-5 shadow-xl border"
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
      className="rounded-md bg-white border shadow-sm p-4 animate-pulse"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 rounded-md bg-gray-200 w-3/4 mb-2"></div>
            <div className="h-3 rounded-md bg-gray-200 w-1/2"></div>
          </div>
        </div>
        <div className="h-6 rounded-md bg-gray-200 w-16"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-[11px] space-y-1 flex-1">
          <div className="h-3 rounded-md bg-gray-200 w-20"></div>
          <div className="h-3 rounded-md bg-gray-200 w-24"></div>
        </div>
        <div className="h-8 rounded-md bg-gray-200 w-16"></div>
      </div>
    </div>
  );
}

function PromotePanelEmployeeSkeleton() {
  return (
    <li className="flex items-center justify-between gap-4 p-3 rounded-md border animate-pulse" style={{ borderColor: BORDER }}>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 rounded-md bg-gray-200 w-3/4"></div>
        <div className="h-3 rounded-md bg-gray-200 w-1/2"></div>
        <div className="h-3 rounded-md bg-gray-200 w-1/3"></div>
      </div>
      <div className="h-9 rounded-md bg-gray-200 w-28 flex-shrink-0"></div>
    </li>
  );
}

function EditPanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div>
        <div className="h-3 rounded-md bg-gray-200 w-20 mb-2"></div>
        <div className="h-10 rounded-md bg-gray-200 w-full"></div>
      </div>
      <div>
        <div className="h-3 rounded-md bg-gray-200 w-24 mb-2"></div>
        <div className="h-10 rounded-md bg-gray-200 w-full"></div>
      </div>
      <div>
        <div className="h-3 rounded-md bg-gray-200 w-16 mb-2"></div>
        <div className="h-10 rounded-md bg-gray-200 w-full"></div>
      </div>
      <div className="flex flex-wrap gap-3 pt-4">
        <div className="h-10 rounded-md bg-gray-200 w-20"></div>
        <div className="h-10 rounded-md bg-gray-200 w-28"></div>
        <div className="h-10 rounded-md bg-gray-200 w-36"></div>
      </div>
    </div>
  );
}

function AdminTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-md bg-white border shadow-sm p-4 animate-pulse"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-md bg-gray-200 shrink-0"></div>
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="min-w-0">
                  <div className="h-4 rounded-md bg-gray-200 w-3/4 mb-2"></div>
                  <div className="h-3 rounded-md bg-gray-200 w-24"></div>
                </div>
                <div className="min-w-0">
                  <div className="h-4 rounded-md bg-gray-200 w-full mb-2"></div>
                  <div className="h-3 rounded-md bg-gray-200 w-16"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="h-3 rounded-md bg-gray-200 w-20 mb-1"></div>
                <div className="h-3 rounded-md bg-gray-200 w-16"></div>
              </div>
              <div className="h-6 rounded-md bg-gray-200 w-20"></div>
              <div className="h-8 rounded-md bg-gray-200 w-16"></div>
            </div>
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

