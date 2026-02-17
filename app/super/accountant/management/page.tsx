"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Grid, List, X, Eye, Mail, Ban, CheckCircle } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type AccountStatus = "active" | "suspended" | "expired" | "pending";

type AccountantAccount = {
  id: number;
  name: string;
  email: string;
  account_status: AccountStatus;
  password_expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type FormErrors = {
  name?: string;
  email?: string;
};

const BORDER = "rgba(0,0,0,0.12)";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not available";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString();
  } catch {
    return "Invalid date";
  }
};

const Icons = {
  Plus: (props: any) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
      <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export default function AccountantManagementPage() {
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("accounts");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isEditing, setIsEditing] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showSuspendSuccess, setShowSuspendSuccess] = useState(false);

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isCreating, setIsCreating] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingActionType, setLoadingActionType] = useState<"create" | "update" | "suspend" | "edit">("create");

  const [form, setForm] = useState({ name: "", email: "" });

  const [accounts, setAccounts] = useState<AccountantAccount[]>([]);
  const [editing, setEditing] = useState<AccountantAccount | null>(null);
  const [editPanelClosing, setEditPanelClosing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; query: string; status: AccountStatus | "all"; dateRange: { start: string; end: string } }>>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState<AccountantAccount | null>(null);
  const [showResendConfirm, setShowResendConfirm] = useState<AccountantAccount | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  const [showResendFail, setShowResendFail] = useState(false);
  const [resendFailMessage, setResendFailMessage] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "permission" || tab === "placeholder" || tab === "accounts") {
      setActiveTab(tab);
    } else {
      setActiveTab("accounts");
    }
  }, [searchParams]);

  async function fetchAccountantAccounts() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/accountant", { method: "GET", headers: { "Content-Type": "application/json" } });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.data)) {
        setAccounts(data.data);
      }
    } catch (err) {
      console.error("Error fetching accountant accounts:", err);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchAccountantAccounts();
  }, []);

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreate(false);
      setCreatePanelClosing(false);
      setForm({ name: "", email: "" });
      setFormErrors({});
    }, 350);
  };

  const filtered = useMemo(() => {
    let filteredAccounts = accounts;
    const q = query.trim().toLowerCase();
    if (q) {
      filteredAccounts = filteredAccounts.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.account_status || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      filteredAccounts = filteredAccounts.filter((a) => a.account_status === statusFilter);
    }
    if (dateRange.start || dateRange.end) {
      filteredAccounts = filteredAccounts.filter((a) => {
        const accountDate = new Date(a.created_at || a.updated_at || 0);
        const startDate = dateRange.start ? new Date(dateRange.start) : new Date("1900-01-01");
        const endDate = dateRange.end ? new Date(dateRange.end) : new Date("2100-12-31");
        return accountDate >= startDate && accountDate <= endDate;
      });
    }
    return filteredAccounts;
  }, [accounts, query, statusFilter, dateRange]);

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormErrors({
        name: !form.name.trim() ? "Account name is required" : "",
        email: !form.email.trim() ? "Email is required" : "",
      });
      return;
    }
    if (!validateEmail(form.email)) {
      setFormErrors({ ...formErrors, email: "Please enter a valid email address" });
      return;
    }

    setIsCreating(true);
    setShowLoadingModal(true);
    setLoadingActionType("create");
    setFormErrors({});

    try {
      const response = await fetch("/api/accountant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create accountant account");
      }

      await fetchAccountantAccounts();
      setForm({ name: "", email: "" });
      closeCreatePanel();
      setShowCreateSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create accountant account");
    } finally {
      setIsCreating(false);
      setShowLoadingModal(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Are you sure you want to delete this accountant account?")) return;
    try {
      const res = await fetch(`/api/accountant/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      } else {
        setError(data.message || "Failed to delete accountant account");
      }
    } catch {
      setError("Failed to delete accountant account");
    }
  }

  function saveSearch() {
    if (!searchName.trim()) return;
    if (!query && statusFilter === "all" && !dateRange.start && !dateRange.end) return;
    setSavedSearches((prev) => [...prev, { name: searchName.trim(), query, status: statusFilter, dateRange: { ...dateRange } }]);
    setSearchName("");
    setShowSaveSearchModal(false);
  }

  function removeSavedSearch(index: number) {
    setSavedSearches((prev) => prev.filter((_, i) => i !== index));
  }

  function onRefresh() {
    setQuery("");
    fetchAccountantAccounts();
  }

  function openEditPanel(item: AccountantAccount) {
    setEditing(item);
    setEditForm({ name: item.name, email: item.email });
  }

  function closeEditPanel() {
    setEditPanelClosing(true);
    setTimeout(() => {
      setEditing(null);
      setEditPanelClosing(false);
    }, 350);
  }

  async function handleSuspend() {
    if (!showSuspendDialog || !suspendReason.trim()) return;
    const accountantId = showSuspendDialog.id;
    setShowSuspendDialog(null);
    setIsSuspending(true);
    setShowLoadingModal(true);
    setLoadingActionType("suspend");

    try {
      const response = await fetch(`/api/accountant/${accountantId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to suspend accountant");
      }

      setAccounts((prev) =>
        prev.map((a) => (a.id === accountantId ? { ...a, account_status: "suspended" as AccountStatus } : a))
      );
      if (editing?.id === accountantId) {
        setEditing((p) => (p ? { ...p, account_status: "suspended" as AccountStatus } : null));
      }
      setSuspendReason("");
      setShowSuspendSuccess(true);
      closeEditPanel();
    } catch (err: any) {
      setError(err.message || "Failed to suspend accountant");
    } finally {
      setIsSuspending(false);
      setShowLoadingModal(false);
    }
  }

  async function handleUnsuspend(id: number) {
    if (!confirm("Are you sure you want to unsuspend this accountant?")) return;
    setIsSuspending(true);
    setShowLoadingModal(true);
    setLoadingActionType("suspend");

    try {
      const response = await fetch(`/api/accountant/${id}/unsuspend`, { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to unsuspend accountant");
      }

      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, account_status: "active" as AccountStatus } : a))
      );
      if (editing?.id === id) {
        setEditing((p) => (p ? { ...p, account_status: "active" as AccountStatus } : null));
      }
      setShowSuspendSuccess(true);
      closeEditPanel();
    } catch (err: any) {
      setError(err.message || "Failed to unsuspend accountant");
    } finally {
      setIsSuspending(false);
      setShowLoadingModal(false);
    }
  }

  async function handleResendCredentials() {
    if (!showResendConfirm) return;
    const id = showResendConfirm.id;
    setShowResendConfirm(null);
    setIsResending(true);

    try {
      const res = await fetch(`/api/accountant/${id}/resend-credentials`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowResendSuccess(true);
        await fetchAccountantAccounts();
      } else {
        setResendFailMessage(data.message || "Failed to resend credentials");
        setShowResendFail(true);
      }
    } catch {
      setResendFailMessage("Failed to resend credentials");
      setShowResendFail(true);
    } finally {
      setIsResending(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    setIsEditing(true);
    setShowLoadingModal(true);
    setLoadingActionType("edit");

    try {
      const response = await fetch(`/api/accountant/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name.trim(), email: editForm.email.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update accountant");
      }

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editing.id ? { ...a, name: editForm.name.trim(), email: editForm.email.trim() } : a
        )
      );
      setShowEditSuccess(true);
      closeEditPanel();
    } catch (err: any) {
      setError(err.message || "Failed to update accountant");
    } finally {
      setIsEditing(false);
      setShowLoadingModal(false);
    }
  }

  const tableCols = "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px 100px";

  const getLoadingModalContent = () => {
    switch (loadingActionType) {
      case "create":
        return { title: "Creating Accountant Account", message: "Please wait while we create the new accountant account..." };
      case "edit":
        return { title: "Updating Accountant Account", message: "Please wait while we update the accountant account details..." };
      case "suspend":
        return { title: "Updating Account Status", message: "Please wait while we update the accountant account status..." };
      default:
        return { title: "Processing", message: "Please wait..." };
    }
  };

  const getStatusDisplay = (status: AccountStatus) => {
    const map: Record<AccountStatus, string> = {
      active: "Active",
      suspended: "Suspended",
      expired: "Expired",
      pending: "Pending",
    };
    return map[status] || status;
  };

  return (
    <div className="min-h-full">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gradient-to-br from-[#800020] via-[#A0153E] to-[#C9184A] text-white rounded-lg shadow-lg p-8 mb-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-4xl font-bold">Accountants</h1>
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

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
              {(["accounts", "permission", "placeholder"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.set("tab", tab);
                    window.history.replaceState({}, "", `?${params.toString()}`);
                    setActiveTab(tab);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

            <div>
              {activeTab === "accounts" && (
                <section className="rounded-lg bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#5f0c18]">Accountant List</h2>
                      <p className="text-sm text-gray-600 mt-1">Create and manage accountant accounts</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                        style={{ background: "#7a0f1f", height: 40 }}
                      >
                        <Icons.Plus />
                        Create Accountant
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
                        {(["all", "active", "suspended", "pending", "expired"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              statusFilter === s
                                ? s === "all"
                                  ? "bg-[#7a0f1f] text-white"
                                  : s === "active"
                                  ? "bg-green-500 text-white"
                                  : s === "suspended"
                                  ? "bg-red-500 text-white"
                                  : s === "pending"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-orange-500 text-white"
                                : "bg-white text-gray-700 border hover:bg-gray-50"
                            }`}
                            style={{ borderColor: statusFilter !== s ? BORDER : undefined }}
                          >
                            {s === "all" ? "All" : getStatusDisplay(s as AccountStatus)}
                          </button>
                        ))}
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

                  {showAdvancedFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border animate-in slide-in-from-top-2 duration-200" style={{ borderColor: BORDER }}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Created Date Range</label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={dateRange.start}
                              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                              className="flex-1 rounded-md border px-2 py-1.5 text-xs"
                              style={{ borderColor: BORDER }}
                            />
                            <span className="text-gray-500 self-center">to</span>
                            <input
                              type="date"
                              value={dateRange.end}
                              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                              className="flex-1 rounded-md border px-2 py-1.5 text-xs"
                              style={{ borderColor: BORDER }}
                            />
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => setShowSaveSearchModal(true)}
                            className="px-4 py-1.5 text-xs font-medium rounded-md bg-[#7a0f1f] text-white hover:opacity-95 disabled:opacity-50"
                            disabled={!query && statusFilter === "all" && !dateRange.start && !dateRange.end}
                          >
                            Save Search
                          </button>
                        </div>
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
                                <button onClick={() => removeSavedSearch(index)} className="text-gray-400 hover:text-red-500 ml-1 transition-colors" title="Remove search">
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                          {[...Array(6)].map((_, i) => (
                            <AccountantCardSkeleton key={i} />
                          ))}
                        </div>
                      ) : (
                        <AccountantTableSkeleton />
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
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                        {filtered.map((a) => (
                          <div key={a.id} className="rounded-lg bg-white border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: BORDER }}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold text-[#7a0f1f]">{a.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-neutral-900">{a.name}</h3>
                                  <p className="text-sm text-neutral-600">{a.email}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-neutral-500">
                                Created: {a.created_at ? formatDate(a.created_at) : "—"}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  a.account_status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : a.account_status === "suspended"
                                    ? "bg-red-100 text-red-700"
                                    : a.account_status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {getStatusDisplay(a.account_status)}
                              </span>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => openEditPanel(a)}
                                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                                style={{ background: "#7a0f1f", height: 32 }}
                                title="View"
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
                        <div className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900" style={{ gridTemplateColumns: tableCols }}>
                          <div>Account Name</div>
                          <div>Email</div>
                          <div>Status</div>
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
                              <div className="text-[11px] text-neutral-800">Created: {a.created_at ? formatDate(a.created_at) : "—"}</div>
                            </div>
                            <div className="min-w-0 text-neutral-900 truncate">{a.email}</div>
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  a.account_status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : a.account_status === "suspended"
                                    ? "bg-red-100 text-red-700"
                                    : a.account_status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {getStatusDisplay(a.account_status)}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditPanel(a)}
                                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                                style={{ background: "#7a0f1f", height: 32 }}
                                title="View"
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

      {/* Create Accountant Side Panel */}
      {(showCreate || createPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${createPanelClosing ? "opacity-0" : "opacity-100"}`}
            onClick={closeCreatePanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
            style={{
              animation: createPanelClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <h2 className="text-lg font-bold">Create Accountant</h2>
                <p className="text-sm text-white/90 mt-0.5">Add a new accountant account. Credentials will be sent via email.</p>
              </div>
              <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onCreate} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    setFormErrors((p) => ({ ...p, name: undefined }));
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                  placeholder="Full name"
                />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, email: e.target.value }));
                    setFormErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                  placeholder="email@example.com"
                />
                {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeCreatePanel} className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50" style={{ borderColor: BORDER, color: "#111", height: 40 }}>
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50" style={{ background: "#7a0f1f", height: 40 }}>
                  {isCreating ? "Creating..." : "Create Accountant"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Accountant View Side Panel */}
      {(editing || editPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${editPanelClosing ? "opacity-0" : "opacity-100"}`}
            onClick={closeEditPanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
            style={{
              animation: editPanelClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <h2 className="text-lg font-bold">{editing?.name}</h2>
                <p className="text-sm text-white/90 mt-0.5">{editing?.email}</p>
              </div>
              <button onClick={closeEditPanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created on</label>
                <div className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50" style={{ borderColor: BORDER }}>
                  {editing?.created_at ? formatDate(editing.created_at) : "—"}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    editing?.account_status === "active"
                      ? "bg-green-100 text-green-700"
                      : editing?.account_status === "suspended"
                      ? "bg-red-100 text-red-700"
                      : editing?.account_status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {editing ? getStatusDisplay(editing.account_status) : "—"}
                </span>
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
                    {isEditing ? "Saving..." : "Save Changes"}
                  </button>
                )}
                <button
                  onClick={() => setShowResendConfirm(editing!)}
                  disabled={isResending}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 bg-blue-600"
                  style={{ height: 40 }}
                >
                  <Mail className="w-4 h-4" />
                  Resend Credentials
                </button>
                {editing?.account_status === "suspended" ? (
                  <button
                    onClick={() => handleUnsuspend(editing.id)}
                    disabled={isSuspending}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 bg-green-600"
                    style={{ height: 40 }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Unsuspend
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSuspendDialog(editing)}
                    disabled={isSuspending}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 bg-orange-500"
                    style={{ height: 40 }}
                  >
                    <Ban className="w-4 h-4" />
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => onDelete(editing!.id)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 hover:bg-red-50"
                  style={{ height: 40 }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Suspend Dialog */}
      {showSuspendDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onClick={() => {
            setShowSuspendDialog(null);
            setSuspendReason("");
          }}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border"
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold text-[#5f0c18]">Suspend Accountant</div>
            <p className="mt-2 text-sm text-neutral-800">
              Are you sure you want to suspend {showSuspendDialog.name} ({showSuspendDialog.email})?
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (required)</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
                style={{ borderColor: BORDER, color: "#111" }}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSuspendDialog(null);
                  setSuspendReason("");
                }}
                disabled={isSuspending}
                className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: BORDER, color: "#111", height: 40 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={isSuspending || !suspendReason.trim()}
                className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#7a0f1f", height: 40 }}
              >
                {isSuspending ? "Suspending..." : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Credentials Confirmation */}
      <ConfirmationModal
        isOpen={!!showResendConfirm}
        onClose={() => setShowResendConfirm(null)}
        onConfirm={handleResendCredentials}
        title="Resend Credentials"
        message={
          showResendConfirm
            ? `Send new login credentials to ${showResendConfirm.name} (${showResendConfirm.email})? A new password will be generated and sent via email.`
            : ""
        }
        confirmText="Send Credentials"
        cancelText="Cancel"
      />

      <SuccessModal isOpen={showCreateSuccess} onClose={() => setShowCreateSuccess(false)} title="Accountant Created" message="The accountant account has been created successfully. Login credentials have been sent to their email." />
      <SuccessModal isOpen={showEditSuccess} onClose={() => setShowEditSuccess(false)} title="Accountant Updated" message="Accountant account details have been updated successfully." />
      <SuccessModal isOpen={showSuspendSuccess} onClose={() => setShowSuspendSuccess(false)} title="Status Updated" message="Accountant account status has been updated successfully." />
      <SuccessModal isOpen={showResendSuccess} onClose={() => setShowResendSuccess(false)} title="Credentials Sent" message="New login credentials have been sent to the accountant's email." />

      <FailModal isOpen={showResendFail} onClose={() => setShowResendFail(false)} title="Failed to Resend" message={resendFailMessage} buttonText="OK" />

      {showLoadingModal && <LoadingModal isOpen={showLoadingModal} title={getLoadingModalContent().title} message={getLoadingModalContent().message} />}
    </div>
  );
}

function AccountantCardSkeleton() {
  return (
    <div className="rounded-lg bg-white border shadow-sm p-4 animate-pulse" style={{ borderColor: BORDER }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="mt-3 flex justify-end">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
}

function AccountantTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
      <div className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900" style={{ gridTemplateColumns: "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px 100px" }}>
        <div>Account Name</div>
        <div>Email</div>
        <div>Status</div>
        <div className="text-right">Actions</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid items-center px-4 py-3 text-sm border-t animate-pulse" style={{ borderColor: BORDER, gridTemplateColumns: "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px 100px" }}>
          <div className="min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="flex justify-end">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
