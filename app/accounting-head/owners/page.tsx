"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronDown, Grid, List, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import SuccessModal from "@/components/ui/SuccessModal";

type Status = "Active" | "Inactive";

type OwnerAccount = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankDetails: string;
  status: Status;
  createdAt: string;
};

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

export default function OwnersPage() {
  // Owners page states (your existing CRUD)
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createClosing, setCreateClosing] = useState(false);

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [savedSearches, setSavedSearches] = useState<
    Array<{ name: string; query: string; status: Status | "all"; dateRange: { start: string; end: string } }>
  >([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Success");
  const [successMessage, setSuccessMessage] = useState("");

  const [bankOptions, setBankOptions] = useState<string[]>(["BDO - Calapan Branch", "BPI - Calapan Branch"]);

  const [form, setForm] = useState({
    accountName: "",
    accountNumber: "",
    bankDetails: "",
  });

  const [bankQuery, setBankQuery] = useState("");

  const [accounts, setAccounts] = useState<OwnerAccount[]>([
    {
      id: uid(),
      accountName: "ABIC Realty Main",
      accountNumber: "1234-5678-9012",
      bankDetails: "BDO - Calapan Branch",
      status: "Active",
      createdAt: new Date().toLocaleDateString(),
    },
    {
      id: uid(),
      accountName: "Operations Fund",
      accountNumber: "0001-2233-4455",
      bankDetails: "BPI - Calapan Branch",
      status: "Inactive",
      createdAt: new Date().toLocaleDateString(),
    },
  ]);

  const [editing, setEditing] = useState<OwnerAccount | null>(null);
  const [editForm, setEditForm] = useState({
    accountName: "",
    accountNumber: "",
    bankDetails: "",
  });

  const [editBankQuery, setEditBankQuery] = useState("");

  const filtered = useMemo(() => {
    let filteredAccounts = accounts;

    const q = query.trim().toLowerCase();
    if (q) {
      filteredAccounts = filteredAccounts.filter((a) => {
        return (
          a.accountName.toLowerCase().includes(q) ||
          a.accountNumber.toLowerCase().includes(q) ||
          a.bankDetails.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== "all") {
      filteredAccounts = filteredAccounts.filter((a) => a.status === statusFilter);
    }

    if (dateRange.start || dateRange.end) {
      filteredAccounts = filteredAccounts.filter((a) => {
        const accountDate = new Date(a.createdAt);
        const startDate = dateRange.start ? new Date(dateRange.start) : new Date("1900-01-01");
        const endDate = dateRange.end ? new Date(dateRange.end) : new Date("2100-12-31");
        return accountDate >= startDate && accountDate <= endDate;
      });
    }

    return filteredAccounts;
  }, [accounts, query, statusFilter, dateRange]);

  const closeCreatePanel = () => {
    setCreateClosing(true);
    window.setTimeout(() => {
      setShowCreate(false);
      setCreateClosing(false);
    }, 350);
  };

  function saveSearch() {
    if (!searchName.trim()) return;
    if (!query && statusFilter === "all" && !dateRange.start && !dateRange.end) return;

    const newSearch = {
      name: searchName.trim(),
      query,
      status: statusFilter,
      dateRange: { ...dateRange },
    };
    setSavedSearches((prev) => [...prev, newSearch]);
    setSearchName("");
    setShowSaveSearchModal(false);
  }

  function removeSavedSearch(index: number) {
    setSavedSearches((prev) => prev.filter((_, i) => i !== index));
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.bankDetails.trim()) return;

    if (!bankOptions.some((b) => b.toLowerCase() === form.bankDetails.trim().toLowerCase())) {
      setBankOptions((prev) => [form.bankDetails.trim(), ...prev]);
    }

    const newItem: OwnerAccount = {
      id: uid(),
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
      bankDetails: form.bankDetails.trim(),
      status: "Active",
      createdAt: new Date().toLocaleDateString(),
    };

    setAccounts((prev) => [newItem, ...prev]);
    setForm({ accountName: "", accountNumber: "", bankDetails: "" });

    closeCreatePanel();

    setSuccessTitle("Account Created Successfully");
    setSuccessMessage("Owner account has been created.");
    setShowSuccess(true);
  }

  function onDelete(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  function onChangeStatus(id: string, next: Status) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
  }

  function onRefresh() {
    setQuery("");
  }

  function openEditModal(item: OwnerAccount) {
    setEditing(item);
    setEditBankQuery("");
    setEditForm({
      accountName: item.accountName,
      accountNumber: item.accountNumber,
      bankDetails: item.bankDetails,
    });
  }

  function closeEditModal() {
    setEditing(null);
  }

  function saveEdit() {
    if (!editing) return;
    if (!editForm.accountName.trim() || !editForm.accountNumber.trim() || !editForm.bankDetails.trim()) return;

    if (!bankOptions.some((b) => b.toLowerCase() === editForm.bankDetails.trim().toLowerCase())) {
      setBankOptions((prev) => [editForm.bankDetails.trim(), ...prev]);
    }

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === editing.id
          ? {
              ...a,
              accountName: editForm.accountName.trim(),
              accountNumber: editForm.accountNumber.trim(),
              bankDetails: editForm.bankDetails.trim(),
            }
          : a
      )
    );

    setEditing(null);

    setSuccessTitle("Account Updated Successfully");
    setSuccessMessage("Owner account changes have been saved.");
    setShowSuccess(true);
  }

  const tableCols = "minmax(140px, 1.15fr) minmax(120px, 1fr) minmax(140px, 1.15fr) 96px 120px";

  return (
    <div className="bg-white">
      {/* PAGE CONTENT ONLY (Header is in app/accounting-head/layout.tsx) */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#5f0c18]">OWNER ACCOUNTS</h1>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-3 md:px-4 text-xs md:text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap"
              style={{ background: "#7a0f1f", height: 36 }}
            >
              <Icons.Plus />
              Create Owners
            </button>

            <button
              onClick={onRefresh}
              className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl border px-3 md:px-4 text-xs md:text-sm font-semibold hover:bg-neutral-50 whitespace-nowrap"
              style={{ borderColor: BORDER, height: 36, color: "#111" }}
            >
              <Icons.Refresh />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-7">
          <section className="rounded-2xl bg-white p-5 shadow-sm border lg:min-h-[420px]" style={{ borderColor: BORDER }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#5f0c18]">Owner Accounts List</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search accounts..."
                    className="w-full rounded-xl border bg-white px-10 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, height: 40, color: "#111" }}
                  />
                </div>

                <button
                  onClick={() => setShowAdvancedFilters((v) => !v)}
                  className={
                    "px-3 py-2 text-xs font-medium rounded-xl transition-colors " +
                    (showAdvancedFilters ? "bg-[#7a0f1f] text-white" : "bg-white text-gray-700 border hover:bg-gray-50")
                  }
                  style={{ borderColor: showAdvancedFilters ? undefined : BORDER, height: 40 }}
                >
                  {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
                </button>

                <div className="flex items-center rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={"p-2 " + (viewMode === "cards" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700")}
                    style={{ borderRadius: "12px 0 0 12px", height: 40, width: 44 }}
                    title="Card View"
                    aria-label="Card View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={"p-2 " + (viewMode === "table" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700")}
                    style={{ borderRadius: "0 12px 12px 0", height: 40, width: 44 }}
                    title="Table View"
                    aria-label="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl border" style={{ borderColor: BORDER }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Status Filter</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatusFilter("all")}
                        className={
                          "px-3 py-1.5 text-xs font-medium rounded-xl transition-colors " +
                          (statusFilter === "all" ? "bg-[#7a0f1f] text-white" : "bg-white text-gray-700 border hover:bg-gray-50")
                        }
                        style={{ borderColor: statusFilter !== "all" ? BORDER : undefined, height: 32 }}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter("Active")}
                        className={
                          "px-3 py-1.5 text-xs font-medium rounded-xl transition-colors " +
                          (statusFilter === "Active" ? "bg-green-500 text-white" : "bg-white text-gray-700 border hover:bg-gray-50")
                        }
                        style={{ borderColor: statusFilter !== "Active" ? BORDER : undefined, height: 32 }}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setStatusFilter("Inactive")}
                        className={
                          "px-3 py-1.5 text-xs font-medium rounded-xl transition-colors " +
                          (statusFilter === "Inactive" ? "bg-gray-500 text-white" : "bg-white text-gray-700 border hover:bg-gray-50")
                        }
                        style={{ borderColor: statusFilter !== "Inactive" ? BORDER : undefined, height: 32 }}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Created Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                        className="flex-1 rounded-xl border px-2 py-1.5 text-xs"
                        style={{ borderColor: BORDER, height: 32 }}
                      />
                      <span className="text-gray-500 self-center text-xs">to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                        className="flex-1 rounded-xl border px-2 py-1.5 text-xs"
                        style={{ borderColor: BORDER, height: 32 }}
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => setShowSaveSearchModal(true)}
                      className="px-4 py-1.5 text-xs font-medium rounded-xl bg-[#7a0f1f] text-white hover:opacity-95 disabled:opacity-50"
                      style={{ height: 32 }}
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
                      className="px-4 py-1.5 text-xs font-medium rounded-xl border text-gray-700 hover:bg-gray-50"
                      style={{ borderColor: BORDER, height: 32 }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {savedSearches.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Saved Searches</div>
                    <div className="flex flex-wrap gap-2">
                      {savedSearches.map((s, index) => (
                        <div
                          key={index}
                          className="group relative flex items-center gap-1 px-3 py-1 text-xs bg-white border rounded-xl hover:bg-gray-50 transition-colors"
                          style={{ borderColor: BORDER }}
                        >
                          <button
                            onClick={() => {
                              setQuery(s.query);
                              setStatusFilter(s.status);
                              setDateRange(s.dateRange);
                            }}
                            className="flex-1 text-left"
                          >
                            {s.name}
                          </button>
                          <button
                            onClick={() => removeSavedSearch(index)}
                            className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                            title="Remove search"
                            aria-label="Remove search"
                            type="button"
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((a) => (
                    <div key={a.id} className="rounded-2xl bg-white border shadow-sm p-4" style={{ borderColor: BORDER }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-[#7a0f1f]">{a.accountName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-neutral-900 truncate">{a.accountName}</h3>
                            <p className="text-xs text-neutral-600 truncate">{a.bankDetails}</p>
                          </div>
                        </div>

                        <select
                          value={a.status}
                          onChange={(e) => onChangeStatus(a.id, e.target.value as Status)}
                          className="rounded-lg border px-2 text-[11px] font-semibold outline-none"
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

                      <div className="grid gap-1 text-xs text-neutral-800">
                        <div className="truncate">
                          <span className="font-semibold text-neutral-900">Acc #:</span> {a.accountNumber}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-[11px] text-neutral-500">Created: {a.createdAt}</div>
                        <button
                          onClick={() => openEditModal(a)}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
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
                <div className="overflow-x-auto">
                  <div className="overflow-hidden rounded-2xl border min-w-[820px]" style={{ borderColor: BORDER }}>
                    <div className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900" style={{ gridTemplateColumns: tableCols }}>
                    <div>Account Name</div>
                    <div>Account Number</div>
                    <div>Bank Details</div>
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
                        <div className="font-semibold text-neutral-900 truncate">{a.accountName}</div>
                        <div className="text-[11px] text-neutral-800 truncate">Created: {a.createdAt}</div>
                      </div>

                      <div className="min-w-0 text-neutral-900 truncate">{a.accountNumber}</div>
                      <div className="min-w-0 text-neutral-900 truncate">{a.bankDetails}</div>

                      <div className="flex items-center justify-center">
                        <select
                          value={a.status}
                          onChange={(e) => onChangeStatus(a.id, e.target.value as Status)}
                          className="rounded-full border px-2 text-[11px] font-semibold outline-none"
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
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
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
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {(showCreate || createClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              createClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeCreatePanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: createClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <h2 className="text-lg font-bold">Create Owner Account</h2>
                <p className="text-sm text-white/90 mt-0.5">Fill in the details below to add an owner account.</p>
              </div>
              <button
                type="button"
                onClick={closeCreatePanel}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form className="grid gap-3" onSubmit={onCreate}>
                <Field label="Account Name">
                  <input
                    value={form.accountName}
                    onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Account Number">
                  <input
                    value={form.accountNumber}
                    onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Bank Details">
                  <BankDropdown
                    borderColor={BORDER}
                    placeholder="Add Banks"
                    inputPlaceholder="ADD BANK"
                    options={bankOptions}
                    query={bankQuery}
                    setQuery={setBankQuery}
                    value={form.bankDetails}
                    onSelect={(next) => {
                      setForm((p) => ({ ...p, bankDetails: next }));
                      setBankQuery("");
                      const isNew = !bankOptions.some((b) => b.toLowerCase() === next.toLowerCase());
                      if (isNew) {
                        setBankOptions((prev) => [next, ...prev]);

                        setSuccessTitle("Bank Added Successfully");
                        setSuccessMessage("Successfully added bank.");
                        setShowSuccess(true);
                      }
                    }}
                  />
                </Field>

                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  Create Account
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={closeEditModal}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl border"
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#5f0c18]">Edit Owner Account</h3>
                <p className="mt-1 text-xs text-neutral-800">Update account details (UI only).</p>
              </div>

              <button
                onClick={closeEditModal}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                style={{ borderColor: BORDER, color: "#111" }}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <Field label="Account Name">
                <input
                  value={editForm.accountName}
                  onChange={(e) => setEditForm((p) => ({ ...p, accountName: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </Field>

              <Field label="Account Number">
                <input
                  value={editForm.accountNumber}
                  onChange={(e) => setEditForm((p) => ({ ...p, accountNumber: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </Field>

              <Field label="Bank Details">
                <BankDropdown
                  borderColor={BORDER}
                  placeholder="Add Banks"
                  inputPlaceholder="ADD BANK"
                  options={bankOptions}
                  query={editBankQuery}
                  setQuery={setEditBankQuery}
                  value={editForm.bankDetails}
                  onSelect={(next) => {
                    setEditForm((p) => ({ ...p, bankDetails: next }));
                    setEditBankQuery("");
                    const isNew = !bankOptions.some((b) => b.toLowerCase() === next.toLowerCase());
                    if (isNew) {
                      setBankOptions((prev) => [next, ...prev]);

                      setSuccessTitle("Bank Added Successfully");
                      setSuccessMessage("Successfully added bank.");
                      setShowSuccess(true);
                    }
                  }}
                />
              </Field>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={closeEditModal}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  style={{ borderColor: BORDER, color: "#111", height: 40 }}
                >
                  Cancel
                </button>

                <button
                  onClick={saveEdit}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
      />

      {showSaveSearchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowSaveSearchModal(false)}
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border"
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
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: BORDER, color: "#111" }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
                style={{ height: 40 }}
              >
                Cancel
              </button>
              <button
                onClick={saveSearch}
                className="px-4 py-2 text-sm font-semibold text-white hover:opacity-95 rounded-xl disabled:opacity-50"
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

function BankDropdown({
  borderColor,
  placeholder,
  inputPlaceholder,
  options,
  query,
  setQuery,
  value,
  onSelect,
}: {
  borderColor: string;
  placeholder: string;
  inputPlaceholder: string;
  options: string[];
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  value: string;
  onSelect: (next: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const canAdd = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return !options.some((o) => o.toLowerCase() === q.toLowerCase());
  }, [options, query]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none flex items-center justify-between"
          style={{ borderColor, color: "#111", height: 40 }}
        >
          <span className={value ? "text-neutral-900" : "text-neutral-500"}>{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <div className="px-2 py-2" onKeyDown={(e) => e.stopPropagation()}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={inputPlaceholder}
            className="h-9"
            autoFocus
          />
        </div>
        <DropdownMenuSeparator />

        {canAdd && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onSelect(query.trim());
            }}
          >
            Add "{query.trim()}"
          </DropdownMenuItem>
        )}

        {filtered.map((o) => (
          <DropdownMenuItem
            key={o}
            onSelect={(e) => {
              e.preventDefault();
              onSelect(o);
            }}
          >
            {o}
          </DropdownMenuItem>
        ))}

        {!canAdd && filtered.length === 0 && (
          <div className="px-2 py-2 text-sm text-neutral-500">No banks</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
