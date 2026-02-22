"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { OwnerSelectModal } from "@/components/owner-ledger/OwnerSelectModal";

const BORDER = "rgba(0,0,0,0.12)";

type ClientOwner = {
  id: number;
  name: string;
  owner_type: string;
};
const GRID_COLS = "grid-cols-[140px_170px_220px_140px_1fr_120px_120px_140px]";


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
  otherOwnerId?: number | null;
  otherOwnerType?: string | null;
  transactionId?: number | null;
};


type ComputedLedgerRow = LedgerRow & {
  outsBalance: number;
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


function HeaderCell({
  children,
  className = "",
  leftBorder = true,
  rightBorder = false,
  bottomBorder = true,
  align = "center",
}: {
  children?: React.ReactNode;
  className?: string;
  leftBorder?: boolean;
  rightBorder?: boolean;
  bottomBorder?: boolean;
  align?: "left" | "center" | "right";
}) {
  const justify =
    align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  const text =
    align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";


  return (
    <div
      className={[
        "h-10 px-2 flex items-center leading-none whitespace-nowrap",
        justify,
        text,
        className,
      ].join(" ")}
      style={{
        borderLeft: leftBorder ? `1px solid ${BORDER}` : undefined,
        borderRight: rightBorder ? `1px solid ${BORDER}` : undefined,
        borderBottom: bottomBorder ? `1px solid ${BORDER}` : undefined,
      }}
    >
      {children}
    </div>
  );
}


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

  // Handle URL params for highlighting (owner selection is handled in fetchClientOwners effect)
  useEffect(() => {
    const highlightParam = searchParams.get("highlight");
    
    if (highlightParam) {
      setHighlightTransactionId(highlightParam);
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightTransactionId(null);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("highlight");
        router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
      }, 3000);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!selectedOwnerId) {
      setRows([]);
      return;
    }
    const fetchTransactions = async () => {
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
              outsBalance: Number(t.outsBalance ?? 0), // Use backend-provided running balance from owner_ledger_entries
              transferGroupId: t.transferGroupId ? String(t.transferGroupId) : null,
              voucherAttachmentUrl: t.voucherAttachmentUrl ? String(t.voucherAttachmentUrl) : null,
              instrumentAttachments: Array.isArray(t.instrumentAttachments)
                ? (t.instrumentAttachments as InstrumentAttachment[])
                : [],
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
    fetchTransactions();
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

  const selectedOwner = clientOwners.find((o) => String(o.id) === selectedOwnerId);
  const selectedAccountLabel = selectedOwner?.name ?? "Select clients";

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
    }, 350);
  };

  const openVoucherPreview = async (label: string, attachmentUrl: string | null, isVoucher = false) => {
    if (!attachmentUrl) return;
    setPreviewImageName(label);
    setPreviewIsVoucher(isVoucher);
    setShowImagePreviewPanel(true);
    setPreviewImageUrl(null);
    setPreviewImageError(null);
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


  const computed = useMemo(() => {
    // Order by full timestamp (date + time + microseconds) for precise ordering
    // Backend already provides running_balance from owner_ledger_entries, so we use it directly
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

    // Ending balance is the last entry's running balance (from backend owner_ledger_entries)
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
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Clients Ledger</h2>
              <p className="text-sm text-gray-600 mt-1">View clients transactions with running balance</p>
            </div>


            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <div className="relative flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Clients:</label>
                <div className="relative" style={{ minWidth: 220 }}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearchQuery}
                    onFocus={() => setShowOwnerSelectModal(true)}
                    readOnly
                    disabled={loadingOwners}
                    className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 disabled:opacity-60 cursor-pointer"
                    style={{ borderColor: BORDER, height: 40 }}
                  />
                  {selectedOwnerId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOwnerId("");
                        setClientSearchQuery("");
                        setShowOwnerSelectModal(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Sort:</label>
                <select
                  value={dateCreatedSort}
                  onChange={(e) => setDateCreatedSort(e.target.value as "newest" | "oldest")}
                  className="h-10 rounded-md border bg-white px-3 text-sm"
                  style={{ borderColor: BORDER, minWidth: 220 }}
                >
                  <option value="oldest">Date Created (Oldest First)</option>
                  <option value="newest">Date Created (Newest First)</option>
                </select>
              </div>
            </div>
          </div>


          <div className="mt-3 text-sm text-neutral-600">
            Showing {showing.from} to {showing.to} of {showing.total} entries
          </div>


          <div className="mt-6 rounded-md overflow-hidden border" style={{ borderColor: BORDER }}>
            <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] px-3 py-3 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-center">
                ABIC REALTY &amp; CONSULTANCY CORPORATION 2025
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-center text-white/90">
                {selectedAccountLabel}
              </div>
            </div>
          </div>


          <div className="mt-6 rounded-md border overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="overflow-x-auto">
              <div className="min-w-[1100px] w-full">
                {/* HEADER (FIXED BORDERS) */}
                <div className="bg-white" style={{ borderColor: BORDER }}>
                  {/* Top header row */}
                  <div className={`grid ${GRID_COLS}`}>
                    {/* first 5 empty cells but with bottom border so lines are continuous */}
                    <HeaderCell leftBorder={false} />
                    <HeaderCell />
                    <HeaderCell />
                    <HeaderCell />
                    <HeaderCell />


                    {/* RUNNING BALANCE group */}
                    <div
                      className="col-span-2 h-10 flex items-center justify-center text-center text-[11px] font-bold text-neutral-900"
                      style={{
                        borderLeft: `1px solid ${BORDER}`,
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      RUNNING BALANCE
                    </div>


                    {/* ending balance amount (rightmost, has right border) */}
                    <HeaderCell align="right" rightBorder className="text-[11px] font-bold text-neutral-900">
                      {formatCurrency(computed.endingBalance)}
                    </HeaderCell>
                  </div>


                  {/* Column labels row */}
                  <div className={`grid ${GRID_COLS}`}>
                    <HeaderCell
                      leftBorder={false}
                      className="text-[11px] font-bold text-neutral-900"
                    >
                      VOUCHER DATE
                    </HeaderCell>


                    <HeaderCell className="text-[11px] font-bold text-neutral-900">
                      VOUCHER NO.
                    </HeaderCell>


                    <HeaderCell className="text-[11px] font-bold text-neutral-900">
                      TRANSACTION INSTRUMENT/ NO.
                    </HeaderCell>


                    <HeaderCell className="text-[11px] font-bold text-neutral-900">
                      ACCOUNT SOURCE
                    </HeaderCell>


                    <HeaderCell className="text-[11px] font-bold text-neutral-900">
                      PARTICULARS
                    </HeaderCell>


                    <HeaderCell className="text-[11px] font-bold text-neutral-900">
                      DEPOSIT
                    </HeaderCell>


                    <HeaderCell className="text-[11px] font-bold text-neutral-900">
                      WITHDRAWAL
                    </HeaderCell>


                    <HeaderCell rightBorder className="text-[11px] font-bold text-neutral-900">
                      OUTS. BALANCE
                    </HeaderCell>
                  </div>
                </div>


                {/* ROWS */}
                <div className="p-3 space-y-2 bg-white">
                  {loadingTransactions ? (
                    <>
                      {[...Array(5)].map((_, idx) => (
                        <div key={idx} className="rounded-md bg-white border shadow-sm animate-pulse" style={{ borderColor: BORDER }}>
                          <div className={`grid ${GRID_COLS} py-2`}>
                            <div className="px-2 py-1.5">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                            <div className="px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                              <div className="h-4 bg-gray-200 rounded w-28"></div>
                            </div>
                            <div className="px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                              <div className="h-4 bg-gray-200 rounded w-40"></div>
                            </div>
                            <div className="px-2 py-1.5 text-right" style={{ borderLeft: `1px solid ${BORDER}` }}>
                              <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                            </div>
                            <div className="px-2 py-1.5 text-right" style={{ borderLeft: `1px solid ${BORDER}` }}>
                              <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                            </div>
                            <div className="px-2 py-1.5 text-right" style={{ borderLeft: `1px solid ${BORDER}` }}>
                              <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : computed.computedRows.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                      {selectedOwnerId ? "No transactions found" : "Select an account to view transactions"}
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
                            className={`rounded-md bg-white border shadow-sm transition-all ${
                              isHighlighted ? "ring-2 ring-[#7a0f1f] ring-offset-2 bg-[#7a0f1f]/5" : ""
                            }`}
                            style={{ borderColor: BORDER }}
                            ref={(el) => {
                              if (isHighlighted && el) {
                                setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                              }
                            }}
                          >
                            <div className={`grid ${GRID_COLS} py-2`}>
                              <div 
                                className={`text-xs px-2 py-1.5 ${r.isVoucherDate === false ? 'italic text-gray-500' : ''}`}
                                title={r.isVoucherDate === false ? 'Transaction date (no voucher date)' : undefined}
                              >
                                {r.voucherDate}
                                {r.isVoucherDate === false && (
                                  <span className="ml-1 text-[10px] text-gray-400" title="Created date">*</span>
                                )}
                              </div>
                              <div className="text-xs px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                                {r.voucherAttachmentUrl ? (
                                  <button
                                    onClick={() => openVoucherPreview(r.voucherNo, r.voucherAttachmentUrl!, true)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  >
                                    {r.voucherNo}
                                  </button>
                                ) : (
                                  r.voucherNo
                                )}
                              </div>
                              <div className="text-xs px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                                {r.instrumentAttachments && r.instrumentAttachments.length > 0 ? (
                                  <>
                                    {r.instrumentAttachments.map((ia, i) => {
                                      const isClickable = ia.instrumentType !== "CASH" && ia.instrumentType !== "INTERNAL";
                                      return (
                                        <span key={i}>
                                          {isClickable ? (
                                            <button
                                              onClick={() => openVoucherPreview(
                                                `${ia.instrumentType}: ${ia.instrumentNo}`,
                                                ia.attachmentUrl,
                                                false
                                              )}
                                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                            >
                                              {ia.instrumentNo}
                                            </button>
                                          ) : (
                                            ia.instrumentNo
                                          )}
                                          {i < r.instrumentAttachments!.length - 1 ? ", " : ""}
                                        </span>
                                      );
                                    })}
                                  </>
                                ) : r.voucherAttachmentUrl ? (
                                  <button
                                    onClick={() => openVoucherPreview(r.transType || "Attachment", r.voucherAttachmentUrl || null, true)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  >
                                    {r.transType}
                                  </button>
                                ) : (
                                  r.transType
                                )}
                              </div>
                              <div className="text-xs px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                                {r.owner}
                              </div>
                              <div className="text-xs px-2 py-1.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                                {renderParticularsWithBoldUnit(r.particulars)}
                              </div>
                              <div className="text-xs px-2 py-1.5 text-right" style={{ borderLeft: `1px solid ${BORDER}` }}>
                                {r.deposit ? formatCurrency(r.deposit) : ""}
                              </div>
                              <div className="text-xs px-2 py-1.5 text-right" style={{ borderLeft: `1px solid ${BORDER}` }}>
                                {r.withdrawal ? formatCurrency(r.withdrawal) : ""}
                              </div>
                              <div className="text-xs px-2 py-1.5 text-right font-medium" style={{ borderLeft: `1px solid ${BORDER}` }}>
                                {formatCurrency(r.outsBalance)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>


            <div className="flex items-center justify-between px-3 py-2 border-t bg-white" style={{ borderColor: BORDER }}>
              <div className="text-xs text-neutral-600">Opening Balance: {formatCurrency(openingBalance)}</div>
              <div className="text-xs font-semibold text-neutral-900">Ending Balance: {formatCurrency(computed.endingBalance)}</div>
            </div>
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
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <h2 className="text-lg font-bold">
                {previewIsVoucher ? "Preview Voucher" : "Preview"}: {previewImageName || "Image"}
              </h2>
              <button
                onClick={closeImagePreviewPanel}
                className="p-2 rounded-md hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Preview: {previewImageName}</h3>
                {previewImageLoading ? (
                  <div className="rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center min-h-[200px]" style={{ borderColor: BORDER }}>
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : previewImageError ? (
                  <div className="rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center min-h-[200px]" style={{ borderColor: BORDER }}>
                    <p className="text-sm text-red-500">{previewImageError}</p>
                  </div>
                ) : previewImageUrl ? (
                  <div
                    className="rounded-md border overflow-hidden bg-gray-50"
                    style={{ borderColor: BORDER }}
                  >
                    <img
                      src={previewImageUrl}
                      alt="Voucher Preview"
                      className="w-full object-contain max-h-[70vh]"
                    />
                  </div>
                ) : null}
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
