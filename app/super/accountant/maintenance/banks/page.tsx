"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Grid, List, X, Inbox, Plus, Eye, Banknote } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type BankStatus = "ACTIVE" | "INACTIVE" | "CLOSED";
type BankCategory = "COMPANY" | "OWNER" | "PARTNER" | "PROJECT";

type Bank = {
  id: number;
  account_name: string;
  bank_name: string;
  account_number: string;
  bank_category: BankCategory;
  opening_balance: number;
  opening_date: string;
  account_holder: string;
  currency: string;
  notes?: string | null;
  status: BankStatus;
  is_internal: boolean;
  created_at?: string;
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

const formatCurrency = (amount: number | null | undefined, currency: string = "PHP"): string => {
  if (amount === null || amount === undefined) return `₱0.00`;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const Icons = {
  Refresh: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showCreate, setShowCreate] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [editPanelClosing, setEditPanelClosing] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [deleteConfirmBank, setDeleteConfirmBank] = useState<Bank | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    bank_category: "COMPANY" as BankCategory,
    opening_balance: "",
    opening_date: "",
    account_holder: "",
    currency: "PHP",
    notes: "",
    status: "ACTIVE" as BankStatus,
    is_internal: true,
  });

  const [editFormData, setEditFormData] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    bank_category: "COMPANY" as BankCategory,
    opening_balance: "",
    opening_date: "",
    account_holder: "",
    currency: "PHP",
    notes: "",
    status: "ACTIVE" as BankStatus,
    is_internal: true,
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/banks");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setBanks(data.data);
      } else {
        setBanks([]);
      }
    } catch {
      setBanks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBanks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(
      (bank) =>
        bank.account_name?.toLowerCase().includes(q) ||
        bank.bank_name?.toLowerCase().includes(q) ||
        bank.account_number?.toLowerCase().includes(q) ||
        bank.account_holder?.toLowerCase().includes(q) ||
        bank.bank_category?.toLowerCase().includes(q)
    );
  }, [banks, query]);

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreate(false);
      setCreatePanelClosing(false);
      setFormData({
        account_name: "",
        bank_name: "",
        account_number: "",
        bank_category: "COMPANY",
        opening_balance: "",
        opening_date: "",
        account_holder: "",
        currency: "PHP",
        notes: "",
        status: "ACTIVE",
        is_internal: true,
      });
    }, 350);
  };

  const handleCreateBank = async () => {
    if (
      !formData.account_name.trim() ||
      !formData.bank_name.trim() ||
      !formData.account_number.trim() ||
      !formData.opening_date.trim() ||
      !formData.account_holder.trim()
    ) {
      setFailMessage("Please fill in all required fields");
      setShowFailModal(true);
      return;
    }

    setShowLoadingModal(true);
    try {
      const res = await fetch("/api/accountant/maintenance/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: formData.account_name.trim(),
          bank_name: formData.bank_name.trim(),
          account_number: formData.account_number.trim(),
          bank_category: formData.bank_category,
          opening_balance: parseFloat(formData.opening_balance) || 0,
          opening_date: formData.opening_date,
          account_holder: formData.account_holder.trim(),
          currency: formData.currency,
          notes: formData.notes.trim() || null,
          status: formData.status,
          is_internal: formData.is_internal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBanks();
        closeCreatePanel();
        setShowCreateSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to create bank");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to create bank");
      setShowFailModal(true);
    } finally {
      setShowLoadingModal(false);
    }
  };

  const openEditPanel = (bank: Bank) => {
    setEditing(bank);
    setEditFormData({
      account_name: bank.account_name,
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      bank_category: bank.bank_category,
      opening_balance: bank.opening_balance.toString(),
      opening_date: bank.opening_date ? new Date(bank.opening_date).toISOString().split("T")[0] : "",
      account_holder: bank.account_holder,
      currency: bank.currency || "PHP",
      notes: bank.notes || "",
      status: bank.status,
      is_internal: bank.is_internal ?? true,
    });
  };

  const closeEditPanel = () => {
    setEditPanelClosing(true);
    setTimeout(() => {
      setEditing(null);
      setEditPanelClosing(false);
    }, 350);
  };

  const handleUpdateBank = async () => {
    if (
      !editing ||
      !editFormData.account_name.trim() ||
      !editFormData.bank_name.trim() ||
      !editFormData.account_number.trim() ||
      !editFormData.opening_date.trim() ||
      !editFormData.account_holder.trim()
    ) {
      setFailMessage("Please fill in all required fields");
      setShowFailModal(true);
      return;
    }

    setShowLoadingModal(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/banks/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: editFormData.account_name.trim(),
          bank_name: editFormData.bank_name.trim(),
          account_number: editFormData.account_number.trim(),
          bank_category: editFormData.bank_category,
          opening_balance: parseFloat(editFormData.opening_balance) || 0,
          opening_date: editFormData.opening_date,
          account_holder: editFormData.account_holder.trim(),
          currency: editFormData.currency,
          notes: editFormData.notes.trim() || null,
          status: editFormData.status,
          is_internal: editFormData.is_internal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBanks();
        closeEditPanel();
        setShowEditSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to update bank");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to update bank");
      setShowFailModal(true);
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!deleteConfirmBank) return;
    const bankId = deleteConfirmBank.id;
    setDeleteConfirmBank(null);
    setIsDeleting(true);
    setShowLoadingModal(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/banks/${bankId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBanks();
        if (editing?.id === bankId) {
          closeEditPanel();
        }
        setShowCreateSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to delete bank");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to delete bank");
      setShowFailModal(true);
    } finally {
      setIsDeleting(false);
      setShowLoadingModal(false);
    }
  };

  const tableCols = "minmax(180px, 1.2fr) minmax(140px, 1fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(140px, 1fr) minmax(100px, 0.7fr) 100px";

  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Banks</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Bank Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage bank accounts and their opening balances</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Plus className="w-4 h-4" />
              Create Bank
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchBanks()}
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
                  placeholder="Search banks..."
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
                    <BankCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <BankTableSkeleton />
              )
            ) : filteredBanks.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a bank or adjust your search.</div>
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                {filteredBanks.map((bank) => (
                  <div key={bank.id} className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: BORDER }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center shrink-0">
                          <Banknote className="w-5 h-5 text-[#7a0f1f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900 truncate">{bank.account_name}</h3>
                          <p className="text-sm text-neutral-600 truncate">{bank.bank_name}</p>
                          <p className="text-xs text-neutral-500 truncate">{bank.account_number}</p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md shrink-0 ${
                          bank.status === "ACTIVE" ? "bg-green-100 text-green-700" : bank.status === "CLOSED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bank.status}
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Category:</span>
                        <span className="text-neutral-700 font-medium">{bank.bank_category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Opening Balance:</span>
                        <span className="font-semibold text-neutral-900">{formatCurrency(bank.opening_balance, bank.currency)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Account Holder:</span>
                        <span className="text-neutral-700 truncate ml-2">{bank.account_holder}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">Opening Date:</span>
                        <span className="text-neutral-700">{formatDate(bank.opening_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openEditPanel(bank)}
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
                  <div>Account Name</div>
                  <div>Bank Name</div>
                  <div>Account Number</div>
                  <div>Category</div>
                  <div>Opening Balance</div>
                  <div>Status</div>
                  <div className="text-right">Actions</div>
                </div>
                {filteredBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="grid items-center px-4 py-3 text-sm border-t"
                    style={{ borderColor: BORDER, color: "#111", gridTemplateColumns: tableCols }}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">{bank.account_name}</div>
                      <div className="text-[11px] text-neutral-800">Opened: {formatDate(bank.opening_date)}</div>
                    </div>
                    <div className="min-w-0 text-neutral-900 truncate">{bank.bank_name}</div>
                    <div className="min-w-0 text-neutral-900 truncate">{bank.account_number}</div>
                    <div className="min-w-0 text-neutral-900 truncate">{bank.bank_category}</div>
                    <div className="min-w-0 text-neutral-900 font-semibold">{formatCurrency(bank.opening_balance, bank.currency)}</div>
                    <div className="flex items-center">
                      <div
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md ${
                          bank.status === "ACTIVE" ? "bg-green-100 text-green-700" : bank.status === "CLOSED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bank.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openEditPanel(bank)}
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

      {/* Create Bank Side Panel */}
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
                <h2 className="text-lg font-bold">Create Bank</h2>
                <p className="text-sm text-white/90 mt-0.5">Add a new bank account to the system.</p>
              </div>
              <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., SCB 483 Account"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for this bank account</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g., Security Bank, BDO, Metrobank"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="e.g., 1234567890"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
                <p className="text-xs text-gray-500 mt-1">Stored as text to preserve leading zeros</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bank_category}
                  onChange={(e) => setFormData({ ...formData, bank_category: e.target.value as BankCategory })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="COMPANY">Company</option>
                  <option value="OWNER">Owner</option>
                  <option value="PARTNER">Partner</option>
                  <option value="PROJECT">Project</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Balance <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
                <p className="text-xs text-gray-500 mt-1">Will be converted to opening balance voucher entry</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.opening_date}
                  onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
                <p className="text-xs text-gray-500 mt-1">Used as voucher date for opening entry</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  placeholder="e.g., ABIC Realty & Consultancy Corp"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional description or notes"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BankStatus })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.is_internal}
                    onChange={(e) => setFormData({ ...formData, is_internal: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span>System-Managed Ledger Bank</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {formData.is_internal
                    ? "This bank will have its own ledger managed by the system"
                    : "External reference bank (for future use)"}
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
                  onClick={handleCreateBank}
                  disabled={showLoadingModal}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  {showLoadingModal ? "Creating..." : "Create Bank"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Bank Side Panel */}
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
                <h2 className="text-lg font-bold">{editing?.account_name}</h2>
                <p className="text-sm text-white/90 mt-0.5">{editing?.bank_name} • {editing?.account_number}</p>
              </div>
              <button onClick={closeEditPanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.account_name}
                  onChange={(e) => setEditFormData({ ...editFormData, account_name: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.bank_name}
                  onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.account_number}
                  onChange={(e) => setEditFormData({ ...editFormData, account_number: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.bank_category}
                  onChange={(e) => setEditFormData({ ...editFormData, bank_category: e.target.value as BankCategory })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="COMPANY">Company</option>
                  <option value="OWNER">Owner</option>
                  <option value="PARTNER">Partner</option>
                  <option value="PROJECT">Project</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Balance <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.opening_balance}
                  onChange={(e) => setEditFormData({ ...editFormData, opening_balance: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.opening_date}
                  onChange={(e) => setEditFormData({ ...editFormData, opening_date: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.account_holder}
                  onChange={(e) => setEditFormData({ ...editFormData, account_holder: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.currency}
                  onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as BankStatus })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={editFormData.is_internal}
                    onChange={(e) => setEditFormData({ ...editFormData, is_internal: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span>System-Managed Ledger Bank</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {editFormData.is_internal
                    ? "This bank will have its own ledger managed by the system"
                    : "External reference bank (for future use)"}
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
                  onClick={() => setDeleteConfirmBank(editing)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 border border-red-300 bg-red-500 hover:bg-red-600"
                  style={{ height: 40 }}
                >
                  Delete
                </button>
                <button
                  onClick={handleUpdateBank}
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
        isOpen={!!deleteConfirmBank}
        onClose={() => setDeleteConfirmBank(null)}
        onConfirm={handleDeleteBank}
        title="Delete Bank"
        message={deleteConfirmBank ? `Are you sure you want to delete ${deleteConfirmBank.account_name}? This action cannot be undone.` : ""}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <SuccessModal
        isOpen={showCreateSuccess}
        onClose={() => setShowCreateSuccess(false)}
        title={isDeleting ? "Bank Deleted Successfully" : editing ? "Bank Updated Successfully" : "Bank Created Successfully"}
        message={isDeleting ? "The bank has been deleted successfully." : editing ? "Bank details have been updated successfully." : "Bank has been created successfully."}
      />

      <LoadingModal
        isOpen={showLoadingModal}
        title={isDeleting ? "Deleting Bank" : editing ? "Updating Bank" : "Creating Bank"}
        message={isDeleting ? "Please wait while we delete the bank..." : editing ? "Please wait while we update the bank details..." : "Please wait while we create the bank..."}
      />

      <FailModal isOpen={showFailModal} onClose={() => setShowFailModal(false)} title="Operation Failed" message={failMessage} buttonText="OK" />
    </div>
  );
}

function BankCardSkeleton() {
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
        <div className="h-6 rounded-md bg-gray-200 w-16"></div>
      </div>
      <div className="space-y-1 mb-3">
        <div className="h-3 rounded-md bg-gray-200 w-full"></div>
        <div className="h-3 rounded-md bg-gray-200 w-2/3"></div>
      </div>
      <div className="h-8 rounded-md bg-gray-200 w-16 ml-auto"></div>
    </div>
  );
}

function BankTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border" style={{ borderColor: BORDER }}>
      <div className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900" style={{ gridTemplateColumns: "minmax(180px, 1.2fr) minmax(140px, 1fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(140px, 1fr) minmax(100px, 0.7fr) 100px" }}>
        <div>Account Name</div>
        <div>Bank Name</div>
        <div>Account Number</div>
        <div>Category</div>
        <div>Opening Balance</div>
        <div>Status</div>
        <div className="text-right">Actions</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid items-center px-4 py-3 text-sm border-t animate-pulse" style={{ borderColor: BORDER, gridTemplateColumns: "minmax(180px, 1.2fr) minmax(140px, 1fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(140px, 1fr) minmax(100px, 0.7fr) 100px" }}>
          <div className="min-w-0">
            <div className="h-4 rounded-md bg-gray-200 w-3/4 mb-1"></div>
            <div className="h-3 rounded-md bg-gray-200 w-20"></div>
          </div>
          <div className="h-4 rounded-md bg-gray-200 w-32"></div>
          <div className="h-4 rounded-md bg-gray-200 w-24"></div>
          <div className="h-4 rounded-md bg-gray-200 w-20"></div>
          <div className="h-4 rounded-md bg-gray-200 w-20"></div>
          <div className="h-6 rounded-md bg-gray-200 w-16"></div>
          <div className="flex items-center justify-end">
            <div className="h-8 rounded-md bg-gray-200 w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
