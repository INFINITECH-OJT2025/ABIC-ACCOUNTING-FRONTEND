"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Eye, Trash2, Download, Calendar, FileText, Loader2 } from "lucide-react";
import Image from "next/image";

interface SavedReceipt {
  id: number;
  transaction_id: number | null;
  transaction_type: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  receipt_data: any;
  file_url?: string;
  created_at: string;
  transaction?: {
    id: number;
    voucher_no: string | null;
    amount: string;
  };
}

export default function SavedReceiptsPage() {
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<SavedReceipt | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "DEPOSIT" | "WITHDRAWAL">("ALL");

  useEffect(() => {
    fetchReceipts();
  }, [filterType]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      let url = "/api/accountant/saved-receipts";
      if (filterType !== "ALL") {
        url += `?transaction_type=${filterType}`;
      }

      const response = await fetch(url);

      const data = await response.json();
      if (data.success) {
        console.log("Receipts fetched:", data.data);
        // Log file URLs for debugging
        if (data.data && data.data.length > 0) {
          data.data.forEach((receipt: SavedReceipt) => {
            console.log(`Receipt ${receipt.id} file_url:`, receipt.file_url);
          });
        }
        setReceipts(data.data || []);
      } else {
        console.error("Failed to fetch receipts:", data);
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this receipt?")) {
      return;
    }

    try {
      const response = await fetch(`/api/accountant/saved-receipts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setReceipts(receipts.filter((r) => r.id !== id));
        if (selectedReceipt?.id === id) {
          setSelectedReceipt(null);
        }
      } else {
        alert("Failed to delete receipt");
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      alert("Failed to delete receipt");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₱ ${numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-[#6A0D25]/30">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">Transactions Receipt</h1>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Transactions Receipt</h2>
              <p className="text-sm text-gray-600 mt-1">View and manage transaction receipt images</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === "ALL"
                    ? "bg-[#4A081A] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("DEPOSIT")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === "DEPOSIT"
                    ? "bg-[#4A081A] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Deposits
              </button>
              <button
                onClick={() => setFilterType("WITHDRAWAL")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === "WITHDRAWAL"
                    ? "bg-[#4A081A] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Withdrawals
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#4A081A]" />
            </div>
          ) : receipts.length === 0 ? (
            <div className="rounded-md bg-white border border-gray-200 p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">No transaction receipts yet</p>
              <p className="text-xs text-gray-500">
                Receipt images will appear here after creating deposits or withdrawals
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <div className="relative h-48 bg-gray-100">
                    {receipt.file_url ? (
                      <img
                        src={receipt.file_url}
                        alt={receipt.file_name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error("Image load error for receipt", receipt.id, "URL:", receipt.file_url, e);
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.error-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'error-fallback flex items-center justify-center h-full';
                            fallback.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully for receipt", receipt.id, "URL:", receipt.file_url);
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          receipt.transaction_type === "DEPOSIT"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {receipt.transaction_type}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {receipt.transaction?.voucher_no || "No Voucher"}
                      </p>
                      {receipt.transaction && (
                        <p className="text-sm font-bold text-[#4A081A]">
                          {formatAmount(receipt.transaction.amount)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(receipt.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceipt(receipt);
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#4A081A] text-white rounded text-xs font-medium hover:bg-[#5f0c18] transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (receipt.file_url) {
                            window.open(receipt.file_url, "_blank");
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(receipt.id);
                        }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* View Receipt Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedReceipt.transaction_type} Receipt
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedReceipt.transaction?.voucher_no || "No Voucher"} • {formatDate(selectedReceipt.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>
            <div className="p-6">
              {selectedReceipt.file_url ? (
                <img
                  src={selectedReceipt.file_url}
                  alt={selectedReceipt.file_name}
                  className="w-full h-auto rounded-md"
                  onError={(e) => {
                    console.error("Modal image load error for receipt", selectedReceipt.id, "URL:", selectedReceipt.file_url, e);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.error-fallback-modal')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'error-fallback-modal flex items-center justify-center h-64 bg-gray-100 rounded-md';
                      fallback.innerHTML = '<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                  onLoad={() => {
                    console.log("Modal image loaded successfully for receipt", selectedReceipt.id, "URL:", selectedReceipt.file_url);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
