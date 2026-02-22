"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, User, ArrowUpDown, ChevronDown, Download, FileText, Calendar, Image as ImageIcon, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";
import { OwnerSelectModal } from "@/components/owner-ledger/OwnerSelectModal";

const BORDER = "rgba(0,0,0,0.12)";

type ClientOwner = {
  id: number;
  name: string;
  owner_type: string;
};


type InstrumentAttachment = {
  instrumentNo: string;
  instrumentType: string;
  attachmentUrl: string;
};

type LedgerRow = {
  createdAt: string;
  voucherDate: string;
  isVoucherDate?: boolean;
  voucherNo: string;
  transType: string;
  owner: string;
  particulars: string;
  deposit: number;
  withdrawal: number;
  outsBalance: number; // Running balance from backend (owner_ledger_entries.running_balance)
  transferGroupId?: string | null;
  voucherAttachmentUrl?: string | null;
  instrumentAttachments?: InstrumentAttachment[];
  fundReference?: string | null;
  personInCharge?: string | null;
  otherOwnerId?: number | null;
  otherOwnerType?: string | null;
  transactionId?: number | null;
};


const formatCurrency = (amount: number, currency: string = "PHP") => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};


const renderParticularsWithBoldUnit = (particulars: string) => {
  const text = particulars?.trim();
  if (!text) return "";


  const sep = " - ";
  const i = text.indexOf(sep);
  if (i <= 0) return text;


  const unit = text.slice(0, i);
  const rest = text.slice(i);


  return (
    <>
      <span className="font-bold">{unit}</span>
      {rest}
    </>
  );
};




export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientOwners, setClientOwners] = useState<ClientOwner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showOwnerSelectModal, setShowOwnerSelectModal] = useState(false);
  const [dateCreatedSort, setDateCreatedSort] = useState<"newest" | "oldest">("oldest");
  const [highlightTransactionId, setHighlightTransactionId] = useState<string | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [showImagePreviewPanel, setShowImagePreviewPanel] = useState(false);
  const [imagePreviewPanelClosing, setImagePreviewPanelClosing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>("");
  const [previewIsVoucher, setPreviewIsVoucher] = useState(false);
  const [previewImageLoading, setPreviewImageLoading] = useState(false);
  const [previewImageError, setPreviewImageError] = useState<string | null>(null);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);

  // Fuzzy search function
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!text || !query) return false;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    let queryIndex = 0;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length;
  };

  useEffect(() => {
    const fetchClientOwners = async () => {
      setLoadingOwners(true);
      try {
        const res = await fetch(
          "/api/accountant/maintenance/owners?status=active&owner_type=CLIENT&per_page=all"
        );
        const data = await res.json();
        if (res.ok && data.success) {
          const list = data.data?.data ?? data.data ?? [];
          const owners = Array.isArray(list) ? list : [];
          setClientOwners(owners);
          
          // Check if there's an owner_id in URL params (direct navigation)
          const ownerIdParam = searchParams.get("owner_id");
          if (ownerIdParam) {
            // Direct navigation - don't open modal, set owner from URL
            setSelectedOwnerId(ownerIdParam);
            setClientSearchQuery("");
          } else {
            // Normal page load - open modal to select owner
            setSelectedOwnerId("");
            setClientSearchQuery("");
            if (owners.length > 0) {
              setShowOwnerSelectModal(true);
            }
          }
        } else {
          setClientOwners([]);
          setSelectedOwnerId("");
        }
      } catch {
        setClientOwners([]);
      } finally {
        setLoadingOwners(false);
      }
    };
    fetchClientOwners();
  }, [searchParams]);

  const fetchTransactions = async () => {
    if (!selectedOwnerId) {
      setRows([]);
      return;
    }
    setLoadingTransactions(true);
    try {
      const res = await fetch(
        `/api/accountant/ledger/clients?owner_id=${selectedOwnerId}&sort=${dateCreatedSort}`
      );
      const data = await res.json();
      if (res.ok && data.success && data.data?.transactions) {
        const txns = data.data.transactions;
        setRows(
          txns.map((t: Record<string, unknown>) => ({
            createdAt: String(t.createdAt ?? ""),
            voucherDate: String(t.voucherDate ?? ""),
            isVoucherDate: t.isVoucherDate !== undefined ? Boolean(t.isVoucherDate) : true,
            voucherNo: String(t.voucherNo ?? ""),
            transType: String(t.transType ?? ""),
            owner: String(t.owner ?? ""),
            particulars: String(t.particulars ?? ""),
            deposit: Number(t.deposit ?? 0),
            withdrawal: Number(t.withdrawal ?? 0),
            outsBalance: Number(t.outsBalance ?? 0), // Use backend-provided running balance
            transferGroupId: t.transferGroupId ? String(t.transferGroupId) : null,
            voucherAttachmentUrl: t.voucherAttachmentUrl ? String(t.voucherAttachmentUrl) : null,
            instrumentAttachments: Array.isArray(t.instrumentAttachments)
              ? (t.instrumentAttachments as InstrumentAttachment[])
              : [],
            fundReference: t.fundReference ? String(t.fundReference) : null,
            personInCharge: t.personInCharge ? String(t.personInCharge) : null,
            otherOwnerId: t.otherOwnerId ? Number(t.otherOwnerId) : null,
            otherOwnerType: t.otherOwnerType ? String(t.otherOwnerType) : null,
            transactionId: t.transactionId ? Number(t.transactionId) : null,
          }))
        );
        setOpeningBalance(Number(data.data?.openingBalance ?? 0));
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (!selectedOwnerId) {
      setRows([]);
      return;
    }
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwnerId, dateCreatedSort]);

  // Update client search query when selectedOwnerId changes
  useEffect(() => {
    if (selectedOwnerId && clientOwners.length > 0) {
      const selectedOwner = clientOwners.find((o) => String(o.id) === selectedOwnerId);
      if (selectedOwner && clientSearchQuery !== selectedOwner.name) {
        setClientSearchQuery(selectedOwner.name);
      }
    } else if (!selectedOwnerId) {
      setClientSearchQuery("");
    }
  }, [selectedOwnerId, clientOwners]);

  // Handle URL params for highlighting
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setHighlightTransactionId(highlightId);
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightTransactionId(null);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("highlight");
        router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
      }, 3000);
    }
  }, [searchParams, router]);

  // Keyboard shortcut: Ctrl+S (or Cmd+S on Mac) to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's default save dialog
        setShowOwnerSelectModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedOwner = clientOwners.find((o) => String(o.id) === selectedOwnerId);
  const selectedAccountLabel = selectedOwner?.name ?? "Select clients";

  const handleOwnerNameClick = (e: React.MouseEvent, ownerId: number | null | undefined) => {
    e.stopPropagation(); // Prevent card click
    if (!ownerId) return;
    
    // Navigate to owners maintenance page and highlight the owner
    router.push(`/super/accountant/maintenance/owners?highlight=${ownerId}`);
  };

  const closeImagePreviewPanel = () => {
    setImagePreviewPanelClosing(true);
    setTimeout(() => {
      setShowImagePreviewPanel(false);
      setImagePreviewPanelClosing(false);
      setPreviewImageUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewImageName("");
      setPreviewIsVoucher(false);
      setPreviewImageError(null);
      setPreviewAttachmentUrl(null);
      setPreviewFileType(null);
      setImageZoom(100);
    }, 350);
  };

  const openVoucherPreview = async (label: string, attachmentUrl: string | null, isVoucher = false) => {
    if (!attachmentUrl) return;
    setPreviewImageName(label);
    setPreviewIsVoucher(isVoucher);
    setPreviewAttachmentUrl(attachmentUrl);
    setShowImagePreviewPanel(true);
    setPreviewImageUrl(null);
    setPreviewImageError(null);
    setPreviewFileType(null);
    setImageZoom(100);
    setPreviewImageLoading(true);
    try {
      const fullUrl = attachmentUrl.startsWith("/") ? `${window.location.origin}${attachmentUrl}` : attachmentUrl;
      const res = await fetch(fullUrl, { credentials: "include" });
      if (!res.ok) {
        setPreviewImageError("Failed to load image");
        setPreviewImageLoading(false);
        return;
      }
      const blob = await res.blob();
      const contentType = res.headers.get("content-type") || "";
      setPreviewFileType(contentType);
      if (!contentType.startsWith("image/")) {
        setPreviewImageError("File is not an image");
        setPreviewImageLoading(false);
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      setPreviewImageUrl(blobUrl);
    } catch {
      setPreviewImageError("Failed to load image");
    } finally {
      setPreviewImageLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!previewImageUrl || !previewImageName) return;
    const link = document.createElement("a");
    link.href = previewImageUrl;
    link.download = previewImageName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const computed = useMemo(() => {
    // Order by full timestamp (date + time + microseconds) for precise ordering
    const sortedRows = [...rows].sort((a, b) => {
      // Parse ISO8601 timestamp string (includes microseconds if available)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      
      // If timestamps are identical (same millisecond), use transaction ID as tiebreaker
      if (aDate === bDate) {
        return (a.transactionId ?? 0) - (b.transactionId ?? 0);
      }
      return aDate - bDate;
    });

    // Apply display sort (oldest/newest)
    const computedRows =
      dateCreatedSort === "newest" ? [...sortedRows].reverse() : sortedRows;

    // Ending balance is the last entry's running balance (from backend)
    const endingBalance = sortedRows.length
      ? sortedRows[sortedRows.length - 1].outsBalance
      : openingBalance;

    return {
      computedRows,
      endingBalance,
    };
  }, [rows, dateCreatedSort, openingBalance]);


  const showing = useMemo(() => {
    const total = computed.computedRows.length;
    return { total, from: total ? 1 : 0, to: total };
  }, [computed.computedRows.length]);


  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-[#6A0D25]/30">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">Clients Ledger</h1>
        </div>
      </div>


      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Clients Ledger</h2>
              <p className="text-sm text-gray-600 mt-1">View clients transactions with running balance</p>
            </div>
          </div>

          {/* Balance Summary Stats - Matching Owners Page Style */}
          {selectedOwnerId && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white border rounded-lg p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Opening Balance</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(openingBalance)}</div>
              </div>
              <div className={`bg-white border rounded-lg p-4 ${computed.endingBalance < 0 ? "border-red-200 bg-red-50/50" : "border-gray-200"}`}>
                <div className="text-sm text-gray-600 mb-1">Ending Balance</div>
                <div className={`text-2xl font-bold ${computed.endingBalance < 0 ? "text-red-600" : "text-gray-900"}`}>
                  {formatCurrency(computed.endingBalance)}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6">
            {/* Filters Section - Matching Owners Page Style */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Clients Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#7a0f1f]">
                  <User className="w-4 h-4" />
                  <label>Clients</label>
                </div>
                <div className="relative flex-1 group min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none z-10 transition-colors group-hover:text-[#7a0f1f]/70" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearchQuery}
                    onFocus={() => setShowOwnerSelectModal(true)}
                    readOnly
                    disabled={loadingOwners}
                    className="w-full rounded-md border border-gray-200 bg-white px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 cursor-pointer transition-all hover:border-[#7a0f1f]/40 hover:bg-gray-50/50"
                  />
                  {selectedOwnerId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOwnerId("");
                        setClientSearchQuery("");
                        setShowOwnerSelectModal(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#7a0f1f] transition-colors p-0.5 rounded hover:bg-[#7a0f1f]/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Search, View Toggle, and Sort Section - Matching Owners Page Style */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              {/* Refresh Button */}
              <button
                onClick={fetchTransactions}
                className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-all hover:border-[#7a0f1f]/40"
                title="Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#7a0f1f]">
                  <ArrowUpDown className="w-4 h-4" />
                  <label>Sort</label>
                </div>
                <div className="relative min-w-[220px]">
                  <select
                    value={dateCreatedSort}
                    onChange={(e) => setDateCreatedSort(e.target.value as "newest" | "oldest")}
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm transition-all hover:border-[#7a0f1f]/40 hover:bg-gray-50/50 focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="oldest">Date Created (Oldest First)</option>
                    <option value="newest">Date Created (Newest First)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              {/* Column Toggle */}
              <button
                onClick={() => setShowAdditionalColumns(!showAdditionalColumns)}
                className="text-sm text-gray-600 hover:text-[#7a0f1f] transition-colors flex items-center gap-1"
                title={showAdditionalColumns ? "Hide additional columns" : "Show additional columns"}
              >
                <span>Columns</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdditionalColumns ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>


          {/* Pagination Info */}
          {selectedOwnerId && (
            <div className="mt-3 text-sm text-neutral-600">
              Showing {showing.from} to {showing.to} of {showing.total} entries
            </div>
          )}

          {/* Column Header Card - Matching Owners Page Style */}
          {selectedOwnerId && (
            <div className="mt-6 rounded-md border border-gray-200 overflow-hidden bg-white sticky top-0 z-10 shadow-sm">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 border-l-4 border-[#7a0f1f] pl-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                      ABIC REALTY &amp; CONSULTANCY CORPORATION 2025
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mt-0.5">
                      {selectedAccountLabel}
                    </div>
                  </div>
                </div>
                {/* Column Labels Row */}
                <div className="flex items-center gap-4 text-xs font-bold text-gray-700 pt-3 border-t border-gray-200">
                <div className="min-w-[110px]">VOUCHER DATE</div>
                <div className="min-w-[120px] border-l pl-3 border-gray-200">VOUCHER NO.</div>
                <div className="min-w-[140px] border-l pl-3 border-gray-200">INSTRUMENT/NO.</div>
                <div className="min-w-[120px] border-l pl-3 border-gray-200">OWNER</div>
                <div className="flex-1 min-w-0 border-l pl-3 border-gray-200">PARTICULARS</div>
                {showAdditionalColumns && (
                  <>
                    <div className="min-w-[120px] border-l pl-3 border-gray-200">FUND REFERENCE</div>
                    <div className="min-w-[140px] border-l pl-3 border-gray-200">PERSON IN CHARGE</div>
                  </>
                )}
                <div className="min-w-[90px] text-right border-l pl-3 border-gray-200">DEPOSIT</div>
                <div className="min-w-[90px] text-right border-l pl-3 border-gray-200">WITHDRAWAL</div>
                  <div className="min-w-[110px] text-right border-l pl-3 border-gray-200">BALANCE</div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Cards - Horizontal Row Layout */}
          <div className="mt-2 space-y-2">
            {loadingTransactions ? (
              <>
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="rounded-md bg-white border border-gray-200 shadow-sm animate-pulse p-3">
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : computed.computedRows.length === 0 ? (
              <div className="rounded-md bg-white border border-gray-200 p-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {selectedOwnerId ? "No transactions found" : "Select an account to view transactions"}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedOwnerId ? "Transactions will appear here once recorded" : "Choose a client account from the dropdown above"}
                </p>
              </div>
            ) : (
              <>
                {computed.computedRows.map((r, idx) => {
                  const isHighlighted = highlightTransactionId && (
                    String(r.transactionId) === highlightTransactionId ||
                    r.createdAt === highlightTransactionId
                  );
                  return (
                  <div
                    key={idx}
                    className={`rounded-md bg-white border border-gray-200 shadow-none hover:bg-gray-50 transition-all p-3 ${
                      isHighlighted ? "ring-2 ring-[#7a0f1f] ring-offset-2 bg-[#7a0f1f]/5" : ""
                    }`}
                    ref={(el) => {
                      if (isHighlighted && el) {
                        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 text-xs">
                      {/* Voucher Date */}
                      <div className="min-w-[110px]">
                        <div className={`text-xs font-semibold text-gray-900 ${r.isVoucherDate === false ? 'italic text-gray-500' : ''}`}>
                          {r.voucherDate}
                          {r.isVoucherDate === false && (
                            <span className="ml-1 text-[9px] text-gray-400" title="Created date">*</span>
                          )}
                        </div>
                      </div>

                      {/* Voucher No */}
                      <div className="min-w-[120px] border-l border-gray-200 pl-3">
                        <div className="text-xs text-gray-900">
                          {r.voucherAttachmentUrl ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openVoucherPreview(r.voucherNo, r.voucherAttachmentUrl!, true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold"
                            >
                              {r.voucherNo}
                            </button>
                          ) : (
                            <span className="font-semibold text-gray-900">{r.voucherNo || "—"}</span>
                          )}
                        </div>
                      </div>

                      {/* Transaction Instrument */}
                      <div className="min-w-[140px] border-l border-gray-200 pl-3">
                        <div className="text-xs text-gray-900">
                          {r.instrumentAttachments && r.instrumentAttachments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.instrumentAttachments.map((ia, i) => {
                                const isClickable = ia.instrumentType !== "CASH" && ia.instrumentType !== "INTERNAL";
                                return (
                                  <span key={i}>
                                    {isClickable ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openVoucherPreview(
                                            `${ia.instrumentType}: ${ia.instrumentNo}`,
                                            ia.attachmentUrl,
                                            false
                                          );
                                        }}
                                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      >
                                        {ia.instrumentNo}
                                      </button>
                                    ) : (
                                      <span>{ia.instrumentNo}</span>
                                    )}
                                    {i < r.instrumentAttachments!.length - 1 ? ", " : ""}
                                  </span>
                                );
                              })}
                            </div>
                          ) : r.voucherAttachmentUrl ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openVoucherPreview(r.transType || "Attachment", r.voucherAttachmentUrl || null, true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {r.transType}
                            </button>
                          ) : (
                            <span>{r.transType || "—"}</span>
                          )}
                        </div>
                      </div>

                      {/* Owner */}
                      <div className="min-w-[120px] border-l border-gray-200 pl-3">
                        <div className="text-xs text-gray-900 truncate" title={r.owner}>
                          {r.otherOwnerId ? (
                            <button
                              onClick={(e) => handleOwnerNameClick(e, r.otherOwnerId)}
                              className="text-gray-900 hover:text-[#7a0f1f] hover:underline font-medium cursor-pointer transition-colors inline-flex items-center gap-1"
                              title={`Click to view ${r.owner}'s details`}
                            >
                              {r.owner || "—"}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <span>{r.owner || "—"}</span>
                          )}
                        </div>
                      </div>

                      {/* Particulars */}
                      <div className="flex-1 min-w-0 border-l border-gray-200 pl-3">
                        <div className="text-xs text-gray-900 truncate" title={r.particulars}>
                          {renderParticularsWithBoldUnit(r.particulars) || "—"}
                        </div>
                      </div>

                      {/* Fund Reference - Conditional */}
                      {showAdditionalColumns && (
                        <div className="min-w-[120px] border-l border-gray-200 pl-3">
                          <div className="text-xs text-gray-900 truncate" title={r.fundReference || undefined}>
                            {r.fundReference || "—"}
                          </div>
                        </div>
                      )}

                      {/* Person in Charge - Conditional */}
                      {showAdditionalColumns && (
                        <div className="min-w-[140px] border-l border-gray-200 pl-3">
                          <div className="text-xs text-gray-900 truncate" title={r.personInCharge || undefined}>
                            {r.personInCharge || "—"}
                          </div>
                        </div>
                      )}

                      {/* Deposit */}
                      <div className="min-w-[90px] text-right border-l border-gray-200 pl-3">
                        <div className={`text-xs ${r.deposit > 0 ? "font-semibold text-green-700" : "text-gray-400"}`}>
                          {r.deposit > 0 ? formatCurrency(r.deposit) : "—"}
                        </div>
                      </div>

                      {/* Withdrawal */}
                      <div className="min-w-[90px] text-right border-l border-gray-200 pl-3">
                        <div className={`text-xs ${r.withdrawal > 0 ? "font-semibold text-red-700" : "text-gray-400"}`}>
                          {r.withdrawal > 0 ? formatCurrency(r.withdrawal) : "—"}
                        </div>
                      </div>

                      {/* Running Balance */}
                      <div className="min-w-[110px] text-right border-l border-gray-200 pl-3">
                        <div className={`text-xs font-bold ${r.outsBalance < 0 ? "text-red-600" : "text-gray-900"}`}>
                          {formatCurrency(r.outsBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </>
            )}
          </div>

        </section>
      </div>

      {/* ================= IMAGE PREVIEW SIDE PANEL ================= */}
      {(showImagePreviewPanel || imagePreviewPanelClosing) && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              imagePreviewPanelClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeImagePreviewPanel}
          />

          {/* Panel */}
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-3xl h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: imagePreviewPanelClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5" />
                <div>
                  <h2 className="text-lg font-bold">
                    {previewIsVoucher ? "Voucher Preview" : "Attachment Preview"}
                  </h2>
                  <p className="text-xs text-white/80 mt-0.5">{previewImageName || "Image"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewImageUrl && (
                  <>
                    <button
                      onClick={() => setImageZoom(Math.max(50, imageZoom - 25))}
                      className="p-2 rounded-md hover:bg-white/20 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImageZoom(Math.min(200, imageZoom + 25))}
                      className="p-2 rounded-md hover:bg-white/20 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownloadImage}
                      className="p-2 rounded-md hover:bg-white/20 transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={closeImagePreviewPanel}
                  className="p-2 rounded-md hover:bg-white/20 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* File Information Section */}
              <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">File Name</div>
                      <div className="text-sm text-gray-900 font-medium">{previewImageName || "—"}</div>
                    </div>
                  </div>
                  {previewFileType && (
                    <div className="flex items-start gap-3">
                      <ImageIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">File Type</div>
                        <div className="text-sm text-gray-900">{previewFileType}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
                      <div className="text-sm text-gray-900">
                        {previewIsVoucher ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#7a0f1f]/10 text-[#7a0f1f] font-medium">
                            Voucher
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                            Attachment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Preview Section */}
              <div className="p-6">
                {previewImageLoading ? (
                  <div className="rounded-md border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center min-h-[400px]">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#7a0f1f] border-t-transparent mb-3"></div>
                    <p className="text-sm text-gray-500">Loading image...</p>
                  </div>
                ) : previewImageError ? (
                  <div className="rounded-md border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                      <X className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm font-medium text-red-600 mb-1">Error Loading Image</p>
                    <p className="text-xs text-gray-500">{previewImageError}</p>
                  </div>
                ) : previewImageUrl ? (
                  <div className="space-y-4">
                    {/* Image Container */}
                    <div
                      className="rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center shadow-lg"
                      style={{ minHeight: "400px" }}
                    >
                      <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                        <img
                          src={previewImageUrl}
                          alt={previewIsVoucher ? "Voucher Preview" : "Attachment Preview"}
                          className="max-w-full max-h-[70vh] object-contain transition-transform"
                          style={{ transform: `scale(${imageZoom / 100})` }}
                        />
                      </div>
                    </div>
                    
                    {/* Zoom Indicator */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>Zoom: {imageZoom}%</span>
                        <button
                          onClick={() => setImageZoom(100)}
                          className="text-[#7a0f1f] hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="text-gray-400">
                        Use zoom controls to adjust image size
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center min-h-[400px]">
                    <p className="text-sm text-gray-500">No image to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>

      <OwnerSelectModal
        open={showOwnerSelectModal}
        onClose={() => setShowOwnerSelectModal(false)}
        owners={clientOwners}
        loading={loadingOwners}
        title="Client"
        placeholder="Search clients..."
        fuzzyMatch={fuzzyMatch}
        onSelect={(owner) => {
          setSelectedOwnerId(String(owner.id));
          setClientSearchQuery(owner.name);
        }}
      />
    </div>
  );
}
