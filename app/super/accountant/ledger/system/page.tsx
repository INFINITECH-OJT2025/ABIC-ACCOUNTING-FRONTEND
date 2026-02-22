"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ArrowUpDown, ChevronDown, Download, FileText, Calendar, Image as ImageIcon, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";

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
  outsBalance: number;
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

export default function SystemLedgerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateCreatedSort, setDateCreatedSort] = useState<"newest" | "oldest">("oldest");
  const [highlightTransactionId, setHighlightTransactionId] = useState<string | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
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

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(
        `/api/accountant/ledger/system?sort=${dateCreatedSort}`
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
            outsBalance: Number(t.outsBalance ?? 0),
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
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateCreatedSort]);

  // Handle URL params for highlighting
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setHighlightTransactionId(highlightId);
      setTimeout(() => {
        setHighlightTransactionId(null);
        router.replace(window.location.pathname, { scroll: false });
      }, 3000);
    }
  }, [searchParams, router]);

  const handleTransactionCardClick = (row: LedgerRow) => {
    if (!row.otherOwnerId || !row.otherOwnerType) return;

    if (row.otherOwnerType === "CLIENT") {
      const highlightId = row.transactionId ? String(row.transactionId) : row.createdAt;
      router.push(`/super/accountant/ledger/clients?owner_id=${row.otherOwnerId}&highlight=${highlightId}`);
    }
  };

  const handleOwnerNameClick = (e: React.MouseEvent, ownerId: number | null | undefined) => {
    e.stopPropagation();
    if (!ownerId) return;
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

    const computedRows =
      dateCreatedSort === "newest" ? [...sortedRows].reverse() : sortedRows;

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
          <h1 className="text-lg font-semibold tracking-wide">System Ledger</h1>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">System Ledger</h2>
              <p className="text-sm text-gray-600 mt-1">View system transactions with running balance</p>
            </div>
          </div>

          {/* Balance Summary Stats */}
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

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* No owner selector - System Ledger auto-loads SYSTEM */}
            </div>

            {/* Refresh, Sort, and Column Toggle */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
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
          <div className="mt-3 text-sm text-neutral-600">
            Showing {showing.from} to {showing.to} of {showing.total} entries
          </div>

          {/* Column Header Card */}
          <div className="mt-6 rounded-md border border-gray-200 overflow-hidden bg-white sticky top-0 z-10 shadow-sm">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 border-l-4 border-[#7a0f1f] pl-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                    ABIC REALTY &amp; CONSULTANCY CORPORATION 2025
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mt-0.5">
                    SYSTEM
                  </div>
                </div>
              </div>
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

          {/* Transactions Cards */}
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
                <p className="text-sm font-medium text-gray-700 mb-1">No transactions found</p>
                <p className="text-xs text-gray-500">Transactions will appear here once recorded</p>
              </div>
            ) : (
              <>
                {computed.computedRows.map((r, idx) => {
                  const isHighlighted = highlightTransactionId && (
                    String(r.transactionId) === highlightTransactionId ||
                    r.createdAt === highlightTransactionId
                  );
                  const isCardClickable =
                    Boolean(r.otherOwnerId) && r.otherOwnerType === "CLIENT";
                  return (
                    <div
                      key={idx}
                      className={`rounded-md bg-white border border-gray-200 shadow-none hover:bg-gray-50 transition-all p-3 ${
                        isHighlighted ? "ring-2 ring-[#7a0f1f] ring-offset-2 bg-[#7a0f1f]/5" : ""
                      } ${isCardClickable ? "cursor-pointer hover:bg-[#7a0f1f]/5" : ""}`}
                      onClick={() => {
                        if (isCardClickable) handleTransactionCardClick(r);
                      }}
                      ref={(el) => {
                        if (isHighlighted && el) {
                          setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4 text-xs">
                        <div className="min-w-[110px]">
                          <div className={`text-xs font-semibold text-gray-900 ${r.isVoucherDate === false ? "italic text-gray-500" : ""}`}>
                            {r.voucherDate}
                            {r.isVoucherDate === false && (
                              <span className="ml-1 text-[9px] text-gray-400" title="Created date">*</span>
                            )}
                          </div>
                        </div>

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

                        <div className="flex-1 min-w-0 border-l border-gray-200 pl-3">
                          <div className="text-xs text-gray-900 truncate" title={r.particulars}>
                            {renderParticularsWithBoldUnit(r.particulars) || "—"}
                          </div>
                        </div>

                        {showAdditionalColumns && (
                          <div className="min-w-[120px] border-l border-gray-200 pl-3">
                            <div className="text-xs text-gray-900 truncate" title={r.fundReference || undefined}>
                              {r.fundReference || "—"}
                            </div>
                          </div>
                        )}

                        {showAdditionalColumns && (
                          <div className="min-w-[140px] border-l border-gray-200 pl-3">
                            <div className="text-xs text-gray-900 truncate" title={r.personInCharge || undefined}>
                              {r.personInCharge || "—"}
                            </div>
                          </div>
                        )}

                        <div className="min-w-[90px] text-right border-l border-gray-200 pl-3">
                          <div className={`text-xs ${r.deposit > 0 ? "font-semibold text-green-700" : "text-gray-400"}`}>
                            {r.deposit > 0 ? formatCurrency(r.deposit) : "—"}
                          </div>
                        </div>

                        <div className="min-w-[90px] text-right border-l border-gray-200 pl-3">
                          <div className={`text-xs ${r.withdrawal > 0 ? "font-semibold text-red-700" : "text-gray-400"}`}>
                            {r.withdrawal > 0 ? formatCurrency(r.withdrawal) : "—"}
                          </div>
                        </div>

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

      {/* Image Preview Side Panel */}
      {(showImagePreviewPanel || imagePreviewPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              imagePreviewPanelClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeImagePreviewPanel}
          />

          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-3xl h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: imagePreviewPanelClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
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

            <div className="flex-1 overflow-y-auto">
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
                      <div className="text-gray-400">Use zoom controls to adjust image size</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center min-h-[400px]">
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
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
