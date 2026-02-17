"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Grid, List, X, Inbox, Plus, Eye, FileText } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type TransactionType = "Deposit" | "Withdrawal" | "Transfer";

type VoucherSeries = {
  id: number;
  transaction_type: TransactionType;
  prefix: string;
  current_counter: number;
  year: number;
  created_at?: string;
  updated_at?: string;
};

const BORDER = "rgba(0,0,0,0.12)";

const Icons = {
  Refresh: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const formatVoucherNumber = (series: VoucherSeries): string => {
  const padded = series.current_counter.toString().padStart(4, "0");
  return `${series.prefix}-${series.year}-${padded}`;
};

export default function VoucherSeriesPage() {
  const [voucherSeries, setVoucherSeries] = useState<VoucherSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showCreate, setShowCreate] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [editing, setEditing] = useState<VoucherSeries | null>(null);
  const [editPanelClosing, setEditPanelClosing] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [deleteConfirmSeries, setDeleteConfirmSeries] = useState<VoucherSeries | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    transaction_type: "Deposit" as TransactionType,
    prefix: "",
    current_counter: "",
    year: new Date().getFullYear().toString(),
  });

  const [editFormData, setEditFormData] = useState({
    transaction_type: "Deposit" as TransactionType,
    prefix: "",
    current_counter: "",
    year: "",
  });

  useEffect(() => {
    fetchVoucherSeries();
  }, []);

  const fetchVoucherSeries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/voucher-series");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setVoucherSeries(data.data);
      } else {
        setVoucherSeries([]);
      }
    } catch {
      setVoucherSeries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVoucherSeries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return voucherSeries;
    return voucherSeries.filter(
      (series) =>
        series.transaction_type?.toLowerCase().includes(q) ||
        series.prefix?.toLowerCase().includes(q) ||
        series.year.toString().includes(q) ||
        formatVoucherNumber(series).toLowerCase().includes(q)
    );
  }, [voucherSeries, query]);

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreate(false);
      setCreatePanelClosing(false);
      setFormData({
        transaction_type: "Deposit",
        prefix: "",
        current_counter: "",
        year: new Date().getFullYear().toString(),
      });
    }, 350);
  };

  const handleCreateVoucherSeries = async () => {
    if (!formData.prefix.trim() || !formData.year.trim() || !formData.current_counter.trim()) {
      setFailMessage("Please fill in all required fields");
      setShowFailModal(true);
      return;
    }

    const counter = parseInt(formData.current_counter);
    const year = parseInt(formData.year);

    if (isNaN(counter) || counter < 0) {
      setFailMessage("Current counter must be a valid number");
      setShowFailModal(true);
      return;
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      setFailMessage("Year must be a valid year between 2000 and 2100");
      setShowFailModal(true);
      return;
    }

    setShowLoadingModal(true);
    try {
      const res = await fetch("/api/accountant/maintenance/voucher-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_type: formData.transaction_type,
          prefix: formData.prefix.trim().toUpperCase(),
          current_counter: counter,
          year: year,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchVoucherSeries();
        closeCreatePanel();
        setShowCreateSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to create voucher series");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to create voucher series");
      setShowFailModal(true);
    } finally {
      setShowLoadingModal(false);
    }
  };

  const openEditPanel = (series: VoucherSeries) => {
    setEditing(series);
    setEditFormData({
      transaction_type: series.transaction_type,
      prefix: series.prefix,
      current_counter: series.current_counter.toString(),
      year: series.year.toString(),
    });
  };

  const closeEditPanel = () => {
    setEditPanelClosing(true);
    setTimeout(() => {
      setEditing(null);
      setEditPanelClosing(false);
    }, 350);
  };

  const handleUpdateVoucherSeries = async () => {
    if (!editing || !editFormData.prefix.trim() || !editFormData.year.trim() || !editFormData.current_counter.trim()) {
      setFailMessage("Please fill in all required fields");
      setShowFailModal(true);
      return;
    }

    const counter = parseInt(editFormData.current_counter);
    const year = parseInt(editFormData.year);

    if (isNaN(counter) || counter < 0) {
      setFailMessage("Current counter must be a valid number");
      setShowFailModal(true);
      return;
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      setFailMessage("Year must be a valid year between 2000 and 2100");
      setShowFailModal(true);
      return;
    }

    setShowLoadingModal(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/voucher-series/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_type: editFormData.transaction_type,
          prefix: editFormData.prefix.trim().toUpperCase(),
          current_counter: counter,
          year: year,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchVoucherSeries();
        closeEditPanel();
        setShowEditSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to update voucher series");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to update voucher series");
      setShowFailModal(true);
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleDeleteVoucherSeries = async () => {
    if (!deleteConfirmSeries) return;
    const seriesId = deleteConfirmSeries.id;
    setDeleteConfirmSeries(null);
    setIsDeleting(true);
    setShowLoadingModal(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/voucher-series/${seriesId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchVoucherSeries();
        if (editing?.id === seriesId) {
          closeEditPanel();
        }
        setShowCreateSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to delete voucher series");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to delete voucher series");
      setShowFailModal(true);
    } finally {
      setIsDeleting(false);
      setShowLoadingModal(false);
    }
  };

  const tableCols = "minmax(150px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(180px, 1.2fr) 100px";

  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Voucher Series</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Voucher Series Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage voucher numbering for transactions</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Plus className="w-4 h-4" />
              Create Voucher Series
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchVoucherSeries()}
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
                  placeholder="Search voucher series..."
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
                    <VoucherSeriesCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <VoucherSeriesTableSkeleton />
              )
            ) : filteredVoucherSeries.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a voucher series or adjust your search.</div>
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                {filteredVoucherSeries.map((series) => (
                  <div key={series.id} className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: BORDER }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#7a0f1f]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">{series.transaction_type}</h3>
                          <p className="text-sm text-neutral-600">{series.prefix}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Next Voucher:</span>
                        <span className="font-semibold text-neutral-900">{formatVoucherNumber(series)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Counter:</span>
                        <span className="text-neutral-700">{series.current_counter}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Year:</span>
                        <span className="text-neutral-700">{series.year}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openEditPanel(series)}
                        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                        style={{ background: "#7a0f1f", height: 32 }}
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border" style={{ borderColor: BORDER }}>
                <div className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900" style={{ gridTemplateColumns: tableCols }}>
                  <div>Transaction Type</div>
                  <div>Prefix</div>
                  <div>Current Counter</div>
                  <div>Year</div>
                  <div>Next Voucher</div>
                  <div className="text-right">Actions</div>
                </div>
                {filteredVoucherSeries.map((series) => (
                  <div
                    key={series.id}
                    className="grid items-center px-4 py-3 text-sm border-t"
                    style={{ borderColor: BORDER, color: "#111", gridTemplateColumns: tableCols }}
                  >
                    <div className="min-w-0 font-semibold text-neutral-900">{series.transaction_type}</div>
                    <div className="min-w-0 text-neutral-900">{series.prefix}</div>
                    <div className="min-w-0 text-neutral-900">{series.current_counter}</div>
                    <div className="min-w-0 text-neutral-900">{series.year}</div>
                    <div className="min-w-0 text-neutral-900 font-semibold">{formatVoucherNumber(series)}</div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openEditPanel(series)}
                        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                        style={{ background: "#7a0f1f", height: 32 }}
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Create Voucher Series Side Panel */}
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
                <h2 className="text-lg font-bold">Create Voucher Series</h2>
                <p className="text-sm text-white/90 mt-0.5">Set up voucher numbering for transaction types.</p>
              </div>
              <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as TransactionType })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefix <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g., DEP, WDR, TRF"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
                <p className="text-xs text-gray-500 mt-1">Will be converted to uppercase</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Counter <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.current_counter}
                  onChange={(e) => setFormData({ ...formData, current_counter: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
                <p className="text-xs text-gray-500 mt-1">Starting counter number (will be padded to 4 digits)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder={new Date().getFullYear().toString()}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                <p className="text-xs font-semibold text-blue-900 mb-1">Preview:</p>
                <p className="text-sm text-blue-800 font-mono">
                  {formData.prefix && formData.year && formData.current_counter
                    ? `${formData.prefix.toUpperCase()}-${formData.year}-${parseInt(formData.current_counter)?.toString().padStart(4, "0") || "0000"}`
                    : "DEP-2026-0001"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={closeCreatePanel}
                  className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  style={{ borderColor: BORDER, color: "#111", height: 40 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVoucherSeries}
                  disabled={showLoadingModal}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  {showLoadingModal ? "Creating..." : "Create Voucher Series"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Voucher Series Side Panel */}
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
                <h2 className="text-lg font-bold">{editing?.transaction_type}</h2>
                <p className="text-sm text-white/90 mt-0.5">{editing ? formatVoucherNumber(editing) : ""}</p>
              </div>
              <button onClick={closeEditPanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.transaction_type}
                  onChange={(e) => setEditFormData({ ...editFormData, transaction_type: e.target.value as TransactionType })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefix <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.prefix}
                  onChange={(e) => setEditFormData({ ...editFormData, prefix: e.target.value.toUpperCase() })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Counter <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.current_counter}
                  onChange={(e) => setEditFormData({ ...editFormData, current_counter: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                <p className="text-xs font-semibold text-blue-900 mb-1">Preview:</p>
                <p className="text-sm text-blue-800 font-mono">
                  {editFormData.prefix && editFormData.year && editFormData.current_counter
                    ? `${editFormData.prefix.toUpperCase()}-${editFormData.year}-${parseInt(editFormData.current_counter)?.toString().padStart(4, "0") || "0000"}`
                    : "DEP-2026-0001"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={closeEditPanel}
                  className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  style={{ borderColor: BORDER, color: "#111", height: 40 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setDeleteConfirmSeries(editing)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 border border-red-300 bg-red-500 hover:bg-red-600"
                  style={{ height: 40 }}
                >
                  Delete
                </button>
                <button
                  onClick={handleUpdateVoucherSeries}
                  disabled={showLoadingModal}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  {showLoadingModal ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={!!deleteConfirmSeries}
        onClose={() => setDeleteConfirmSeries(null)}
        onConfirm={handleDeleteVoucherSeries}
        title="Delete Voucher Series"
        message={deleteConfirmSeries ? `Are you sure you want to delete the voucher series for ${deleteConfirmSeries.transaction_type}? This action cannot be undone.` : ""}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <SuccessModal
        isOpen={showCreateSuccess}
        onClose={() => setShowCreateSuccess(false)}
        title={isDeleting ? "Voucher Series Deleted Successfully" : editing ? "Voucher Series Updated Successfully" : "Voucher Series Created Successfully"}
        message={isDeleting ? "The voucher series has been deleted successfully." : editing ? "Voucher series details have been updated successfully." : "Voucher series has been created successfully."}
      />

      <LoadingModal
        isOpen={showLoadingModal}
        title={isDeleting ? "Deleting Voucher Series" : editing ? "Updating Voucher Series" : "Creating Voucher Series"}
        message={isDeleting ? "Please wait while we delete the voucher series..." : editing ? "Please wait while we update the voucher series details..." : "Please wait while we create the voucher series..."}
      />

      <FailModal isOpen={showFailModal} onClose={() => setShowFailModal(false)} title="Operation Failed" message={failMessage} buttonText="OK" />
    </div>
  );
}

function VoucherSeriesCardSkeleton() {
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
      <div className="space-y-1 mb-3">
        <div className="h-3 rounded-md bg-gray-200 w-full"></div>
        <div className="h-3 rounded-md bg-gray-200 w-2/3"></div>
      </div>
      <div className="h-8 rounded-md bg-gray-200 w-16 ml-auto"></div>
    </div>
  );
}

function VoucherSeriesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border" style={{ borderColor: BORDER }}>
      <div className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900" style={{ gridTemplateColumns: "minmax(150px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(180px, 1.2fr) 100px" }}>
        <div>Transaction Type</div>
        <div>Prefix</div>
        <div>Current Counter</div>
        <div>Year</div>
        <div>Next Voucher</div>
        <div className="text-right">Actions</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid items-center px-4 py-3 text-sm border-t animate-pulse" style={{ borderColor: BORDER, gridTemplateColumns: "minmax(150px, 1fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(180px, 1.2fr) 100px" }}>
          <div className="h-4 rounded-md bg-gray-200 w-20"></div>
          <div className="h-4 rounded-md bg-gray-200 w-12"></div>
          <div className="h-4 rounded-md bg-gray-200 w-16"></div>
          <div className="h-4 rounded-md bg-gray-200 w-16"></div>
          <div className="h-4 rounded-md bg-gray-200 w-24"></div>
          <div className="flex items-center justify-end">
            <div className="h-8 rounded-md bg-gray-200 w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
