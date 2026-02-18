"use client";

import React, { useMemo, useState } from "react";
import { Search, Grid, List, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import SuccessModal from "@/components/ui/SuccessModal";

type Status = "Active" | "Inactive";

type SbcAccount = {
  id: string;
  companyName: string;
  bankAccount: string;
  accountName: string;
  accountNumber: string;
  contactNumber: string;
  status: Status;
  createdAt: string;
};

const BORDER = "rgba(0,0,0,0.12)";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createClosing, setCreateClosing] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Success");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    bankAccount: "",
    accountName: "",
    accountNumber: "",
    contactNumber: "",
  });

  const [accounts, setAccounts] = useState<SbcAccount[]>([
    {
      id: uid(),
      companyName: "ABIC Realty & Consultancy",
      bankAccount: "SECURITY BANK (443)",
      accountName: "ABIC Realty",
      accountNumber: "0000-0000-0443",
      contactNumber: "0917-000-0443",
      status: "Active",
      createdAt: new Date().toLocaleDateString(),
    },
  ]);

  const [editing, setEditing] = useState<SbcAccount | null>(null);
  const [editForm, setEditForm] = useState({
    companyName: "",
    bankAccount: "",
    accountName: "",
    accountNumber: "",
    contactNumber: "",
    status: "Active" as Status,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${a.companyName} ${a.bankAccount} ${a.accountName} ${a.accountNumber} ${a.contactNumber}`.toLowerCase();
      return hay.includes(q);
    });
  }, [accounts, query, statusFilter]);

  const closeCreatePanel = () => {
    setCreateClosing(true);
    window.setTimeout(() => {
      setShowCreate(false);
      setCreateClosing(false);
    }, 350);
  };

  function onRefresh() {
    setQuery("");
    setStatusFilter("all");
    setShowAdvancedFilters(false);
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.companyName.trim() ||
      !form.bankAccount.trim() ||
      !form.accountName.trim() ||
      !form.accountNumber.trim() ||
      !form.contactNumber.trim()
    )
      return;

    const next: SbcAccount = {
      id: uid(),
      companyName: form.companyName.trim(),
      bankAccount: form.bankAccount.trim(),
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
      contactNumber: form.contactNumber.trim(),
      status: "Active",
      createdAt: new Date().toLocaleDateString(),
    };

    setAccounts((prev) => [next, ...prev]);
    setForm({ companyName: "", bankAccount: "", accountName: "", accountNumber: "", contactNumber: "" });
    closeCreatePanel();

    setSuccessTitle("SBC Account Created Successfully");
    setSuccessMessage("SBC account has been added.");
    setShowSuccess(true);
  }

  function onDelete(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));

    setSuccessTitle("Account Deleted Successfully");
    setSuccessMessage("SBC account has been removed.");
    setShowSuccess(true);
  }

  function openEdit(a: SbcAccount) {
    setEditing(a);
    setEditForm({
      companyName: a.companyName,
      bankAccount: a.bankAccount,
      accountName: a.accountName,
      accountNumber: a.accountNumber,
      contactNumber: a.contactNumber,
      status: a.status,
    });
  }

  function saveEdit() {
    if (!editing) return;
    if (
      !editForm.companyName.trim() ||
      !editForm.bankAccount.trim() ||
      !editForm.accountName.trim() ||
      !editForm.accountNumber.trim() ||
      !editForm.contactNumber.trim()
    )
      return;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === editing.id
          ? {
              ...a,
              companyName: editForm.companyName.trim(),
              bankAccount: editForm.bankAccount.trim(),
              accountName: editForm.accountName.trim(),
              accountNumber: editForm.accountNumber.trim(),
              contactNumber: editForm.contactNumber.trim(),
              status: editForm.status,
            }
          : a
      )
    );

    setEditing(null);

    setSuccessTitle("Account Updated Successfully");
    setSuccessMessage("SBC account changes have been saved.");
    setShowSuccess(true);
  }

  const tableCols =
    "minmax(150px,1.2fr) minmax(150px,1.05fr) minmax(150px,1.05fr) minmax(140px,1fr) minmax(130px,0.95fr) minmax(92px,0.8fr) 84px 92px";

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#5f0c18]">SBC ACCOUNTS</h1>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-3 md:px-4 text-xs md:text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap"
              style={{ background: "#7a0f1f", height: 36 }}
            >
              <Icons.Plus />
              Create Account
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
                <h2 className="text-base font-bold text-[#5f0c18]">SBC Accounts List</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search accounts..."
                    className="w-full rounded-xl border bg-white px-10 py-1.5 text-xs outline-none"
                    style={{ borderColor: BORDER, height: 32, color: "#111" }}
                  />
                </div>

                <button
                  onClick={() => setShowAdvancedFilters((v) => !v)}
                  className={
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors " +
                    (showAdvancedFilters ? "bg-[#7a0f1f] text-white" : "bg-white text-gray-700 border hover:bg-gray-50")
                  }
                  style={{ borderColor: showAdvancedFilters ? undefined : BORDER, height: 32 }}
                  type="button"
                >
                  {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
                </button>

                <div className="flex items-center rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={"p-2 " + (viewMode === "cards" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700")}
                    style={{ borderRadius: "12px 0 0 12px", height: 32, width: 36 }}
                    title="Card View"
                    aria-label="Card View"
                    type="button"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={"p-2 " + (viewMode === "table" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700")}
                    style={{ borderRadius: "0 12px 12px 0", height: 32, width: 36 }}
                    title="Table View"
                    aria-label="Table View"
                    type="button"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl border" style={{ borderColor: BORDER }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full sm:max-w-xs">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Status Filter</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
                      className="w-full rounded-xl border bg-white px-3 text-sm font-semibold"
                      style={{ borderColor: BORDER, height: 40, color: "#111" }}
                    >
                      <option value="all">All</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className="rounded-xl border px-3 text-xs font-semibold hover:bg-neutral-50"
                      style={{ borderColor: BORDER, height: 36, color: "#111" }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {viewMode === "cards" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border p-6 text-sm font-semibold text-neutral-700" style={{ borderColor: BORDER }}>
                    No SBC accounts found.
                  </div>
                ) : (
                  filtered.map((a) => (
                    <div key={a.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: BORDER }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#5f0c18] truncate">{a.companyName}</div>
                          <div className="mt-1 text-xs font-semibold text-neutral-700 truncate">{a.bankAccount}</div>
                        </div>
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold " +
                            (a.status === "Active" ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-700")
                          }
                        >
                          {a.status}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-1 text-xs text-neutral-700">
                        <div>
                          <span className="font-semibold text-neutral-900">Account name:</span> {a.accountName}
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-900">Account number:</span> {a.accountNumber}
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-900">Contact number:</span> {a.contactNumber}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-neutral-50"
                          style={{ borderColor: BORDER, height: 32, color: "#111" }}
                        >
                          <Icons.Edit />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(a.id)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-red-50"
                          style={{ borderColor: "rgba(185,28,28,.25)", height: 32, color: "#b91c1c" }}
                        >
                          <Icons.Trash />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <div className="min-w-[980px] overflow-hidden rounded-2xl border" style={{ borderColor: BORDER }}>
                  <div
                    className="grid bg-white/95 px-3 py-2 text-[11px] font-extrabold text-neutral-900 border-b"
                    style={{ borderColor: BORDER, gridTemplateColumns: tableCols }}
                  >
                    <div>Company</div>
                    <div>Bank Account</div>
                    <div>Account Name</div>
                    <div>Account Number</div>
                    <div>Contact Number</div>
                    <div>Status</div>
                    <div className="text-right">Edit</div>
                    <div className="text-right">Delete</div>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm font-semibold text-neutral-600">No SBC accounts found.</div>
                  ) : (
                    filtered.map((a, idx) => (
                      <div
                        key={a.id}
                        className={"grid items-center px-3 py-2 text-sm border-t " + (idx % 2 === 0 ? "bg-white" : "bg-neutral-50")}
                        style={{ borderColor: BORDER, gridTemplateColumns: tableCols }}
                      >
                        <div className="text-[11px] font-semibold text-neutral-900 truncate" title={a.companyName}>
                          {a.companyName}
                        </div>
                        <div className="text-[11px] text-neutral-700 truncate" title={a.bankAccount}>
                          {a.bankAccount}
                        </div>
                        <div className="text-[11px] text-neutral-700 truncate" title={a.accountName}>
                          {a.accountName}
                        </div>
                        <div className="text-[11px] text-neutral-700 truncate" title={a.accountNumber}>
                          {a.accountNumber}
                        </div>
                        <div className="text-[11px] text-neutral-700 truncate" title={a.contactNumber}>
                          {a.contactNumber}
                        </div>
                        <div className="text-[11px] font-semibold text-neutral-700">{a.status}</div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="inline-flex items-center gap-2 rounded-lg border px-2 text-xs font-semibold hover:bg-neutral-50"
                            style={{ borderColor: BORDER, height: 28, color: "#111" }}
                          >
                            <Icons.Edit />
                            Edit
                          </button>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => onDelete(a.id)}
                            className="inline-flex items-center gap-2 rounded-lg border px-2 text-xs font-semibold hover:bg-red-50"
                            style={{ borderColor: "rgba(185,28,28,.25)", height: 28, color: "#b91c1c" }}
                          >
                            <Icons.Trash />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

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
                  <h2 className="text-lg font-bold">Create SBC Account</h2>
                  <p className="text-sm text-white/90 mt-0.5">Fill in the details below to add an SBC account.</p>
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
                  <Field label="Company name">
                    <Input
                      value={form.companyName}
                      onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                      className="rounded-xl border"
                      style={{ borderColor: BORDER, color: "#111" }}
                    />
                  </Field>

                  <Field label="Bank account">
                    <Input
                      value={form.bankAccount}
                      onChange={(e) => setForm((p) => ({ ...p, bankAccount: e.target.value }))}
                      className="rounded-xl border"
                      style={{ borderColor: BORDER, color: "#111" }}
                    />
                  </Field>

                  <Field label="Account name">
                    <Input
                      value={form.accountName}
                      onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))}
                      className="rounded-xl border"
                      style={{ borderColor: BORDER, color: "#111" }}
                    />
                  </Field>

                  <Field label="Account number">
                    <Input
                      value={form.accountNumber}
                      onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                      className="rounded-xl border"
                      style={{ borderColor: BORDER, color: "#111" }}
                    />
                  </Field>

                  <Field label="Contact number">
                    <Input
                      value={form.contactNumber}
                      onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))}
                      className="rounded-xl border"
                      style={{ borderColor: BORDER, color: "#111" }}
                    />
                  </Field>

                  <button
                    type="submit"
                    className="mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                    style={{ background: "#7a0f1f", height: 36 }}
                  >
                    Create Account
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-neutral-50" style={{ borderColor: BORDER }}>
                <div className="text-sm font-extrabold text-neutral-900">Edit SBC Account</div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-white"
                  style={{ borderColor: BORDER, color: "#111" }}
                >
                  Close
                </button>
              </div>

              <div className="p-5 grid gap-3">
                <Field label="Company name">
                  <Input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((p) => ({ ...p, companyName: e.target.value }))}
                    className="rounded-xl border"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Bank account">
                  <Input
                    value={editForm.bankAccount}
                    onChange={(e) => setEditForm((p) => ({ ...p, bankAccount: e.target.value }))}
                    className="rounded-xl border"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Account name">
                  <Input
                    value={editForm.accountName}
                    onChange={(e) => setEditForm((p) => ({ ...p, accountName: e.target.value }))}
                    className="rounded-xl border"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Account number">
                  <Input
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="rounded-xl border"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Contact number">
                  <Input
                    value={editForm.contactNumber}
                    onChange={(e) => setEditForm((p) => ({ ...p, contactNumber: e.target.value }))}
                    className="rounded-xl border"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as Status }))}
                    className="w-full rounded-xl border bg-white px-3 text-sm font-semibold"
                    style={{ borderColor: BORDER, height: 40, color: "#111" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50"
                    style={{ borderColor: BORDER, height: 40, color: "#111" }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveEdit}
                    className="rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                    style={{ background: "#7a0f1f", height: 40 }}
                  >
                    Save
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
      </main>
    </div>
  );
}
