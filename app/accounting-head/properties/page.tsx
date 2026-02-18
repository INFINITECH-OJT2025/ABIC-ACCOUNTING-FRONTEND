"use client";

import React, { useMemo, useState } from "react";
import { Eye, Grid, Inbox, List, Search, X } from "lucide-react";

import SuccessModal from "@/components/ui/SuccessModal";

type Status = "Active" | "Inactive";

type Property = {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  status: Status;
  createdAt: string;
};

const BORDER = "rgba(0,0,0,0.12)";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const Icons = {
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Edit: (props: React.SVGProps<SVGSVGElement>) => (
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
  Refresh: (props: React.SVGProps<SVGSVGElement>) => (
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

export default function PropertiesPage() {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createClosing, setCreateClosing] = useState(false);
  const [editClosing, setEditClosing] = useState(false);

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Success");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    propertyType: "",
    address: "",
  });

  const [items, setItems] = useState<Property[]>([
    {
      id: uid(),
      name: "ABIC Realty Building",
      propertyType: "Commercial",
      address: "Calapan City, Oriental Mindoro",
      status: "Active",
      createdAt: new Date().toLocaleDateString(),
    },
    {
      id: uid(),
      name: "ABIC Residences",
      propertyType: "Residential",
      address: "Calapan City, Oriental Mindoro",
      status: "Inactive",
      createdAt: new Date().toLocaleDateString(),
    },
  ]);

  const [editing, setEditing] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    propertyType: "",
    address: "",
    status: "Active" as Status,
  });

  const filtered = useMemo(() => {
    let list = items;

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((x) => {
        return (
          x.name.toLowerCase().includes(q) ||
          x.propertyType.toLowerCase().includes(q) ||
          x.address.toLowerCase().includes(q) ||
          x.status.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((x) => x.status === statusFilter);
    }

    return list;
  }, [items, query, statusFilter]);

  const closeCreatePanel = () => {
    setCreateClosing(true);
    window.setTimeout(() => {
      setShowCreate(false);
      setCreateClosing(false);
    }, 350);
  };

  const closeEditPanel = () => {
    setEditClosing(true);
    window.setTimeout(() => {
      setEditing(null);
      setEditClosing(false);
    }, 350);
  };

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.propertyType.trim() || !form.address.trim()) return;

    const newItem: Property = {
      id: uid(),
      name: form.name.trim(),
      propertyType: form.propertyType.trim(),
      address: form.address.trim(),
      status: "Active",
      createdAt: new Date().toLocaleDateString(),
    };

    setItems((prev) => [newItem, ...prev]);
    setForm({ name: "", propertyType: "", address: "" });

    closeCreatePanel();

    setSuccessTitle("Property Created Successfully");
    setSuccessMessage("Property has been created.");
    setShowSuccess(true);
  }

  function onChangeStatus(id: string, next: Status) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
  }

  function onRefresh() {
    setQuery("");
    setStatusFilter("all");
  }

  function openEditModal(item: Property) {
    setEditing(item);
    setEditForm({ name: item.name, propertyType: item.propertyType, address: item.address, status: item.status });
  }

  function closeEditModal() {
    closeEditPanel();
  }

  function saveEdit() {
    if (!editing) return;
    if (!editForm.name.trim() || !editForm.propertyType.trim() || !editForm.address.trim()) return;

    setItems((prev) =>
      prev.map((x) =>
        x.id === editing.id
          ? {
              ...x,
              name: editForm.name.trim(),
              propertyType: editForm.propertyType.trim(),
              address: editForm.address.trim(),
              status: editForm.status,
            }
          : x
      )
    );

    closeEditPanel();
    setSuccessTitle("Property Updated Successfully");
    setSuccessMessage("Property changes have been saved.");
    setShowSuccess(true);
  }

  const tableCols = "minmax(160px,1.2fr) minmax(120px,1fr) minmax(220px,1.5fr) 96px 120px";

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Properties List</h2>
              <p className="text-sm text-gray-600 mt-1">Manage property master data and records</p>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Icons.Plus />
              Create Property
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>

              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "all" ? "bg-[#7a0f1f] text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter !== "all" ? { borderColor: BORDER } : undefined}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Active")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "Active" ? "bg-[#7a0f1f] text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter !== "Active" ? { borderColor: BORDER } : undefined}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Inactive")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "Inactive" ? "bg-[#7a0f1f] text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter !== "Inactive" ? { borderColor: BORDER } : undefined}
              >
                Inactive
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 rounded-md border hover:bg-gray-50 transition-colors"
                style={{ borderColor: BORDER }}
                title="Refresh"
                aria-label="Refresh"
              >
                <Icons.Refresh />
              </button>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, type, address, or status..."
                  className="w-full rounded-md border bg-white px-10 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                />
              </div>

              <div className="flex rounded-md border" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-2 rounded-l-md ${viewMode === "cards" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700"}`}
                  title="Card View"
                  aria-label="Card View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-r-md ${viewMode === "table" ? "bg-[#7a0f1f] text-white" : "text-gray-500 hover:text-gray-700"}`}
                  title="Table View"
                  aria-label="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a record or adjust your search.</div>
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                {filtered.map((x) => (
                  <div
                    key={x.id}
                    className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: BORDER }}
                  >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-neutral-900 truncate">{x.name}</h3>
                          <p className="text-xs text-neutral-600 truncate">{x.propertyType}</p>
                        </div>

                        <span
                          className="inline-flex items-center justify-center rounded-md px-4 text-xs font-extrabold tracking-wide"
                          style={{
                            height: 32,
                            minWidth: 96,
                            background: x.status === "Active" ? "#DCFCE7" : "#E2E8F0",
                            color: x.status === "Active" ? "#166534" : "#334155",
                          }}
                        >
                          {x.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid gap-1 text-xs text-neutral-800">
                        <div className="truncate">
                          <span className="font-semibold text-neutral-900">Address:</span> {x.address}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-[11px] text-neutral-500">Created: {x.createdAt}</div>
                        <button
                          type="button"
                          onClick={() => openEditModal(x)}
                          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                          style={{ background: "#7a0f1f", height: 32 }}
                          title="View"
                          aria-label="View"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div>
                <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
                  <div className="grid items-center" style={{ gridTemplateColumns: tableCols }}>
                    <div className="py-4 text-sm font-bold text-neutral-900">Name</div>
                    <div className="py-4 text-sm font-bold text-neutral-900">Type</div>
                    <div className="py-4 text-sm font-bold text-neutral-900">Address</div>
                    <div className="py-4 text-sm font-bold text-neutral-900 text-center">Status</div>
                    <div className="py-4 text-sm font-bold text-neutral-900 text-right">Actions</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {filtered.map((x) => (
                    <div
                      key={x.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="grid items-center" style={{ gridTemplateColumns: tableCols }}>
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-900 truncate">{x.name}</div>
                          <div className="text-[11px] text-neutral-500 truncate">Created: {x.createdAt}</div>
                        </div>

                        <div className="min-w-0 text-sm text-neutral-900 truncate">{x.propertyType}</div>
                        <div className="min-w-0 text-sm text-neutral-900 truncate">{x.address}</div>

                        <div className="flex items-center justify-center">
                          <span
                            className="inline-flex items-center justify-center rounded-md px-4 text-xs font-extrabold tracking-wide"
                            style={{
                              height: 32,
                              minWidth: 96,
                              background: x.status === "Active" ? "#DCFCE7" : "#E2E8F0",
                              color: x.status === "Active" ? "#166534" : "#334155",
                            }}
                          >
                            {x.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => openEditModal(x)}
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                            style={{ background: "#7a0f1f", height: 36 }}
                            title="View"
                            aria-label="View"
                          >
                            <Eye className="w-4 h-4" />
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
                <h2 className="text-lg font-bold">Create Property</h2>
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
                <Field label="Name" required>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Property Type">
                  <input
                    value={form.propertyType}
                    onChange={(e) => setForm((p) => ({ ...p, propertyType: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Address">
                  <input
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-md  px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  Create
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {(editing || editClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              editClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeEditPanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: editClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{editForm.name || "View Property"}</h2>
                  <span
                    className="inline-flex items-center justify-center rounded-md px-3 text-[11px] font-extrabold tracking-wide"
                    style={{
                      height: 26,
                      background: editForm.status === "Active" ? "#DCFCE7" : "#E2E8F0",
                      color: editForm.status === "Active" ? "#166534" : "#334155",
                    }}
                  >
                    {editForm.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditPanel}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <Field label="Name" required>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Property Type">
                  <input
                    value={editForm.propertyType}
                    onChange={(e) => setEditForm((p) => ({ ...p, propertyType: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Address">
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER, color: "#111" }}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as Status }))}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none bg-white"
                    style={{ borderColor: BORDER, color: "#111" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={closeEditPanel}
                    className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                    style={{ borderColor: BORDER, height: 40, color: "#111" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                    style={{ background: "#7a0f1f", height: 40 }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title={successTitle} message={successMessage} />
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold" style={{ color: "#111" }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
