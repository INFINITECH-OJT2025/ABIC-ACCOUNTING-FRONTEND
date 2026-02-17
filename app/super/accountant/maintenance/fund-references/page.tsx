"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Grid, List, X, Inbox, Plus, Eye, FolderOpen } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type FundReference = {
  id: number;
  reference_name: string;
  category?: string | null;
  description?: string | null;
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

export default function FundReferencesPage() {
  const [fundReferences, setFundReferences] = useState<FundReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showCreate, setShowCreate] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [editing, setEditing] = useState<FundReference | null>(null);
  const [editPanelClosing, setEditPanelClosing] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [deleteConfirmReference, setDeleteConfirmReference] = useState<FundReference | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    reference_name: "",
    category: "",
    description: "",
  });

  const [editFormData, setEditFormData] = useState({
    reference_name: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    fetchFundReferences();
  }, []);

  const fetchFundReferences = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/fund-references");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setFundReferences(data.data);
      } else {
        setFundReferences([]);
      }
    } catch {
      setFundReferences([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFundReferences = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fundReferences;
    return fundReferences.filter(
      (ref) =>
        ref.reference_name?.toLowerCase().includes(q) ||
        ref.category?.toLowerCase().includes(q) ||
        ref.description?.toLowerCase().includes(q)
    );
  }, [fundReferences, query]);

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreate(false);
      setCreatePanelClosing(false);
      setFormData({
        reference_name: "",
        category: "",
        description: "",
      });
    }, 350);
  };

  const handleCreateFundReference = async () => {
    if (!formData.reference_name.trim()) {
      setFailMessage("Please fill in the reference name");
      setShowFailModal(true);
      return;
    }

    setShowLoadingModal(true);
    try {
      const res = await fetch("/api/accountant/maintenance/fund-references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_name: formData.reference_name.trim(),
          category: formData.category.trim() || null,
          description: formData.description.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchFundReferences();
        closeCreatePanel();
        setShowCreateSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to create fund reference");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to create fund reference");
      setShowFailModal(true);
    } finally {
      setShowLoadingModal(false);
    }
  };

  const openEditPanel = (ref: FundReference) => {
    setEditing(ref);
    setEditFormData({
      reference_name: ref.reference_name,
      category: ref.category || "",
      description: ref.description || "",
    });
  };

  const closeEditPanel = () => {
    setEditPanelClosing(true);
    setTimeout(() => {
      setEditing(null);
      setEditPanelClosing(false);
    }, 350);
  };

  const handleUpdateFundReference = async () => {
    if (!editing || !editFormData.reference_name.trim()) {
      setFailMessage("Please fill in the reference name");
      setShowFailModal(true);
      return;
    }

    setShowLoadingModal(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/fund-references/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_name: editFormData.reference_name.trim(),
          category: editFormData.category.trim() || null,
          description: editFormData.description.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchFundReferences();
        closeEditPanel();
        setShowEditSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to update fund reference");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to update fund reference");
      setShowFailModal(true);
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleDeleteFundReference = async () => {
    if (!deleteConfirmReference) return;
    const refId = deleteConfirmReference.id;
    setDeleteConfirmReference(null);
    setIsDeleting(true);
    setShowLoadingModal(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/fund-references/${refId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchFundReferences();
        if (editing?.id === refId) {
          closeEditPanel();
        }
        setShowCreateSuccess(true);
      } else {
        setFailMessage(data.message || "Failed to delete fund reference");
        setShowFailModal(true);
      }
    } catch {
      setFailMessage("Failed to delete fund reference");
      setShowFailModal(true);
    } finally {
      setIsDeleting(false);
      setShowLoadingModal(false);
    }
  };

  const tableCols = "minmax(200px, 1.5fr) minmax(150px, 1fr) minmax(250px, 2fr) 100px";

  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Fund References</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Fund Reference Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage transaction classifications and fund references</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Plus className="w-4 h-4" />
              Create Fund Reference
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchFundReferences()}
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
                  placeholder="Search fund references..."
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
                    <FundReferenceCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <FundReferenceTableSkeleton />
              )
            ) : filteredFundReferences.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a fund reference or adjust your search.</div>
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                {filteredFundReferences.map((ref) => (
                  <div key={ref.id} className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: BORDER }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-[#7a0f1f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900 truncate">{ref.reference_name}</h3>
                          {ref.category && <p className="text-sm text-neutral-600 truncate">{ref.category}</p>}
                        </div>
                      </div>
                    </div>
                    {ref.description && (
                      <div className="mb-3">
                        <p className="text-xs text-neutral-500 line-clamp-2">{ref.description}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openEditPanel(ref)}
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
                  <div>Reference Name</div>
                  <div>Category</div>
                  <div>Description</div>
                  <div className="text-right">Actions</div>
                </div>
                {filteredFundReferences.map((ref) => (
                  <div
                    key={ref.id}
                    className="grid items-center px-4 py-3 text-sm border-t"
                    style={{ borderColor: BORDER, color: "#111", gridTemplateColumns: tableCols }}
                  >
                    <div className="min-w-0 font-semibold text-neutral-900 truncate">{ref.reference_name}</div>
                    <div className="min-w-0 text-neutral-900 truncate">{ref.category || "-"}</div>
                    <div className="min-w-0 text-neutral-900 truncate">{ref.description || "-"}</div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openEditPanel(ref)}
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

      {/* Create Fund Reference Side Panel */}
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
                <h2 className="text-lg font-bold">Create Fund Reference</h2>
                <p className="text-sm text-white/90 mt-0.5">Add a new fund reference for transaction classification.</p>
              </div>
              <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.reference_name}
                  onChange={(e) => setFormData({ ...formData, reference_name: e.target.value })}
                  placeholder="e.g., Operating Fund"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Operating, Capital, Project"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
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
                  onClick={handleCreateFundReference}
                  disabled={showLoadingModal}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                  style={{ background: "#7a0f1f", height: 40 }}
                >
                  {showLoadingModal ? "Creating..." : "Create Fund Reference"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Fund Reference Side Panel */}
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
                <h2 className="text-lg font-bold">{editing?.reference_name}</h2>
                {editing?.category && <p className="text-sm text-white/90 mt-0.5">{editing.category}</p>}
              </div>
              <button onClick={closeEditPanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.reference_name}
                  onChange={(e) => setEditFormData({ ...editFormData, reference_name: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: BORDER, color: "#111" }}
                />
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
                  onClick={() => setDeleteConfirmReference(editing)}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 border border-red-300 bg-red-500 hover:bg-red-600"
                  style={{ height: 40 }}
                >
                  Delete
                </button>
                <button
                  onClick={handleUpdateFundReference}
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
        isOpen={!!deleteConfirmReference}
        onClose={() => setDeleteConfirmReference(null)}
        onConfirm={handleDeleteFundReference}
        title="Delete Fund Reference"
        message={deleteConfirmReference ? `Are you sure you want to delete ${deleteConfirmReference.reference_name}? This action cannot be undone.` : ""}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <SuccessModal
        isOpen={showCreateSuccess}
        onClose={() => setShowCreateSuccess(false)}
        title={isDeleting ? "Fund Reference Deleted Successfully" : editing ? "Fund Reference Updated Successfully" : "Fund Reference Created Successfully"}
        message={isDeleting ? "The fund reference has been deleted successfully." : editing ? "Fund reference details have been updated successfully." : "Fund reference has been created successfully."}
      />

      <LoadingModal
        isOpen={showLoadingModal}
        title={isDeleting ? "Deleting Fund Reference" : editing ? "Updating Fund Reference" : "Creating Fund Reference"}
        message={isDeleting ? "Please wait while we delete the fund reference..." : editing ? "Please wait while we update the fund reference details..." : "Please wait while we create the fund reference..."}
      />

      <FailModal isOpen={showFailModal} onClose={() => setShowFailModal(false)} title="Operation Failed" message={failMessage} buttonText="OK" />
    </div>
  );
}

function FundReferenceCardSkeleton() {
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
      <div className="h-8 rounded-md bg-gray-200 w-16 ml-auto"></div>
    </div>
  );
}

function FundReferenceTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border" style={{ borderColor: BORDER }}>
      <div className="grid bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-900" style={{ gridTemplateColumns: "minmax(200px, 1.5fr) minmax(150px, 1fr) minmax(250px, 2fr) 100px" }}>
        <div>Reference Name</div>
        <div>Category</div>
        <div>Description</div>
        <div className="text-right">Actions</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid items-center px-4 py-3 text-sm border-t animate-pulse" style={{ borderColor: BORDER, gridTemplateColumns: "minmax(200px, 1.5fr) minmax(150px, 1fr) minmax(250px, 2fr) 100px" }}>
          <div className="h-4 rounded-md bg-gray-200 w-3/4"></div>
          <div className="h-4 rounded-md bg-gray-200 w-20"></div>
          <div className="h-4 rounded-md bg-gray-200 w-full"></div>
          <div className="flex items-center justify-end">
            <div className="h-8 rounded-md bg-gray-200 w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
