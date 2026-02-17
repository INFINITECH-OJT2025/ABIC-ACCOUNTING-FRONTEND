"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Grid, List, X, Inbox, ArrowUp, ArrowDown } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type Status = "Active" | "Inactive" | "Suspended" | "Pending" | "Expired";

type AccountantAccount = {
  id: number;
  name: string;
  email: string;
  status: Status;
  promoted_at?: string | null;
  updated_at?: string;
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
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Refresh: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function HeadAccountantsPage() {
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("accounts");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState<AccountantAccount | null>(null);
  const [editPanelClosing, setEditPanelClosing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingActionType, setLoadingActionType] = useState<"edit" | "revert">("edit");

  const [accounts, setAccounts] = useState<AccountantAccount[]>([]);

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
  const [revertConfirmAccountant, setRevertConfirmAccountant] = useState<AccountantAccount | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [showRevertSuccess, setShowRevertSuccess] = useState(false);
  const [showRevertFail, setShowRevertFail] = useState(false);
  const [showRevertLoading, setShowRevertLoading] = useState(false);
  const [revertFailMessage, setRevertFailMessage] = useState("");

  const searchParams = useSearchParams();

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

  const filtered = useMemo(() => {
    let filtered = accounts;
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [accounts, query]);

  const itemsPerPage = viewMode === "table" ? 10 : 30;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccounts = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, viewMode]);

  async function fetchAccountantAccounts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accountant", { method: "GET" });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setAccounts(data.data);
      }
    } catch (err) {
      console.error("Error fetching accountant accounts:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchApprovedEmployees() {
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
  }

  useEffect(() => {
    fetchAccountantAccounts();
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "permission" || tab === "placeholder" || tab === "accounts") {
      setActiveTab(tab);
    } else {
      setActiveTab("accounts");
    }
  }, [searchParams]);

  useEffect(() => {
    if (showCreate && !createPanelClosing) {
      fetchApprovedEmployees();
    }
  }, [showCreate, createPanelClosing]);

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreate(false);
      setCreatePanelClosing(false);
      setApprovedEmployees([]);
      setPromoteSearchQuery("");
    }, 350);
  };

  const handlePromoteToAccountant = async (employeeId: number) => {
    setPromoteConfirmEmployee(null);
    setPromotingId(employeeId);
    setShowPromoteLoading(true);
    try {
      const res = await fetch("/api/accountant/promote-from-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAccountantAccounts();
        setApprovedEmployees((prev) => prev.filter((e) => e.id !== employeeId));
        setShowCreateSuccess(true);
      } else {
        setPromoteFailMessage(data.message || "Failed to promote employee to accountant");
        setShowPromoteFail(true);
      }
    } catch {
      setPromoteFailMessage("Failed to promote employee to accountant");
      setShowPromoteFail(true);
    } finally {
      setPromotingId(null);
      setShowPromoteLoading(false);
    }
  };

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

  async function saveEdit() {
    if (!editing) return;
    if (!editForm.name.trim()) return;

    setIsEditing(true);
    setShowLoadingModal(true);
    setLoadingActionType("edit");
    try {
      const res = await fetch(`/api/accountant/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name.trim(), email: editForm.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update accountant");
      }
      setAccounts((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, name: editForm.name.trim() } : a))
      );
      setShowEditSuccess(true);
      closeEditPanel();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update accountant");
    } finally {
      setIsEditing(false);
      setShowLoadingModal(false);
    }
  }

  async function handleRevertToEmployee() {
    if (!revertConfirmAccountant) return;
    const id = revertConfirmAccountant.id;
    setRevertConfirmAccountant(null);
    setIsReverting(true);
    setShowRevertLoading(true);
    try {
      const res = await fetch(`/api/accountant/${id}/revert-to-employee`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        closeEditPanel();
        await fetchAccountantAccounts();
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setShowRevertSuccess(true);
      } else {
        setRevertFailMessage(data.message || "Failed to remove accountant access");
        setShowRevertFail(true);
      }
    } catch {
      setRevertFailMessage("Failed to remove accountant access");
      setShowRevertFail(true);
    } finally {
      setIsReverting(false);
      setShowRevertLoading(false);
    }
  }

  const tableCols = "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px";

  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Accountants</h1>
      </div>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
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
                activeTab === tab ? "bg-[#7a0f1f] text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
              style={activeTab !== tab ? { borderColor: BORDER } : undefined}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "accounts" && (
            <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#5f0c18]">Accountant List</h2>
                  <p className="text-sm text-gray-600 mt-1">Promote and manage accountant accounts</p>
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  <ArrowUp className="w-4 h-4" />
                  Promote to Accountant
                </button>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end mt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => fetchAccountantAccounts()}
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
                  <div className="flex rounded-md border" style={{ borderColor: BORDER }}>
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`p-2 rounded-l-md ${viewMode === "cards" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700"}`}
                      title="Card View"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-2 rounded-r-md ${viewMode === "table" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700"}`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

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
                  <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                    <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                    <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                    <div className="mt-2 text-xs text-neutral-800">Promote an employee or adjust your search.</div>
                  </div>
                ) : viewMode === "cards" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                      {paginatedAccounts.map((a) => (
                      <div key={a.id} className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: BORDER }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-[#7a0f1f]">{a.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-neutral-900">{a.name}</h3>
                              <p className="text-sm text-neutral-600">{a.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-neutral-500">Promoted on: {a.promoted_at ? formatDate(a.promoted_at) : "—"}</div>
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
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: BORDER }}>
                        <div className="text-sm text-neutral-600">
                          Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} accountants
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            style={{ borderColor: BORDER }}
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                              const page = i + 1;
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                                      currentPage === page
                                        ? "bg-[#7a0f1f] text-white"
                                        : "border hover:bg-gray-50"
                                    }`}
                                    style={currentPage !== page ? { borderColor: BORDER } : undefined}
                                  >
                                    {page}
                                  </button>
                                );
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-2 text-neutral-500">...</span>;
                              }
                              return null;
                            })}
                          </div>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            style={{ borderColor: BORDER }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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
                      {paginatedAccounts.map((a) => (
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
                                a.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
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
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: BORDER }}>
                      <div className="text-sm text-neutral-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} accountants
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          style={{ borderColor: BORDER }}
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                                    currentPage === page
                                      ? "bg-[#7a0f1f] text-white"
                                      : "border hover:bg-gray-50"
                                  }`}
                                  style={currentPage !== page ? { borderColor: BORDER } : undefined}
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="px-2 text-neutral-500">...</span>;
                            }
                            return null;
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          style={{ borderColor: BORDER }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
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

      {/* Promote to Accountant Side Panel */}
      {(showCreate || createPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${createPanelClosing ? "opacity-0" : "opacity-100"}`}
            onClick={closeCreatePanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: createPanelClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <h2 className="text-lg font-bold">Promote to Accountant</h2>
                <p className="text-sm text-white/90 mt-0.5">Select an approved employee to promote as accountant.</p>
              </div>
              <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
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
                    <li key={emp.id} className="flex items-center justify-between gap-4 p-3 rounded-md border" style={{ borderColor: BORDER }}>
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
                            Promote to Accountant
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

      <ConfirmationModal
        isOpen={!!promoteConfirmEmployee}
        onClose={() => setPromoteConfirmEmployee(null)}
        onConfirm={() => promoteConfirmEmployee && handlePromoteToAccountant(promoteConfirmEmployee.id)}
        title="Confirm Promotion"
        message={
          promoteConfirmEmployee
            ? `Are you sure you want to promote ${promoteConfirmEmployee.first_name} ${promoteConfirmEmployee.last_name} (${promoteConfirmEmployee.email}) to accountant? An email notification will be sent to them.`
            : ""
        }
        confirmText="Confirm Promote"
        cancelText="Cancel"
      />

      <LoadingModal isOpen={showPromoteLoading} title="Promoting to Accountant" message="Please wait while we promote the employee and send the notification email..." />

      <FailModal isOpen={showPromoteFail} onClose={() => setShowPromoteFail(false)} title="Failed to Promote" message={promoteFailMessage} buttonText="OK" />

      <ConfirmationModal
        isOpen={!!revertConfirmAccountant}
        onClose={() => setRevertConfirmAccountant(null)}
        onConfirm={() => handleRevertToEmployee()}
        title="Remove Accountant Access"
        message={
          revertConfirmAccountant
            ? `Are you sure you want to remove accountant access from ${revertConfirmAccountant.name} (${revertConfirmAccountant.email})? They will be reverted to employee.`
            : ""
        }
        confirmText="Remove Accountant Access"
        cancelText="Cancel"
      />

      <LoadingModal isOpen={showRevertLoading} title="Removing Accountant Access" message="Please wait while we remove accountant access..." />

      {showRevertSuccess && (
        <SuccessModal
          isOpen={showRevertSuccess}
          onClose={() => setShowRevertSuccess(false)}
          title="Accountant Access Removed"
          message="Accountant access has been removed successfully. They will no longer have accountant privileges."
        />
      )}

      <FailModal isOpen={showRevertFail} onClose={() => setShowRevertFail(false)} title="Failed to Remove Accountant Access" message={revertFailMessage} buttonText="OK" />

      {/* Accountant View Side Panel */}
      {(editing || editPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${editPanelClosing ? "opacity-0" : "opacity-100"}`}
            onClick={closeEditPanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
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
                  onClick={() => setRevertConfirmAccountant(editing ?? null)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 border border-orange-300 bg-orange-500 hover:bg-orange-600 inline-flex items-center gap-2"
                  style={{ height: 40 }}
                >
                  <ArrowDown className="w-4 h-4" />
                  Remove Accountant Access
                </button>
              </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showCreateSuccess && (
        <SuccessModal
          isOpen={showCreateSuccess}
          onClose={() => setShowCreateSuccess(false)}
          title="Employee Promoted to Accountant"
          message="The employee has been promoted to accountant successfully. A notification email has been sent to them."
        />
      )}

      {showEditSuccess && (
        <SuccessModal
          isOpen={showEditSuccess}
          onClose={() => setShowEditSuccess(false)}
          title="Accountant Account Updated Successfully"
          message="Accountant account details have been updated successfully."
        />
      )}

      {showLoadingModal && (
        <LoadingModal
          isOpen={showLoadingModal}
          title={loadingActionType === "edit" ? "Updating Accountant Account" : "Removing Accountant Access"}
          message={loadingActionType === "edit" ? "Please wait while we update the accountant account details..." : "Please wait..."}
        />
      )}
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

function AccountantCardSkeleton() {
  return (
    <div className="rounded-md bg-white border shadow-sm p-4 animate-pulse" style={{ borderColor: BORDER }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 rounded-md bg-gray-200 w-3/4 mb-2"></div>
            <div className="h-3 rounded-md bg-gray-200 w-1/2"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 rounded-md bg-gray-200 w-24"></div>
        <div className="h-8 rounded-md bg-gray-200 w-16"></div>
      </div>
    </div>
  );
}

function AccountantTableSkeleton() {
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
