"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import SuccessModal from "@/components/ui/SuccessModal";

type User = { name: string; email: string; role: string };

type TxType = "deposit" | "withdrawal";
type PayMode = "cash" | "check";

type FundRef = {
  photoName: string;
  reference: string;
  photoUrl?: string;
};

type Transaction = {
  id: string;
  date: string;
  voucherNo: string;
  transType: string;
  transTypeProofs?: FundRef[];
  owner: string;
  particulars: string;
  deposit: number;
  withdrawal: number;
  fundRefs: FundRef[];
  personInCharge?: string;
};

type FundRefDraftItem = {
  id: string;
  file: File;
  reference: string;
  photoName: string;
  previewUrl: string;
  photoDataUrl: string;
};

type ChequeDraftItem = {
  id: string;
  file: File;
  previewUrl: string;
  photoDataUrl: string;
};

const BORDER = "rgba(0,0,0,0.12)";
const ROWS_PER_PAGE = 4;
const OWNER_OPTIONS = ["ABIC", "Supplier", "Client", "Employee", "SBC"];

type SbcKey = "443" | "444" | "445" | "446";

const SBC_CONFIG: Record<SbcKey, { label: string; accountName: string; startingFund: number; route: string }> = {
  "443": {
    label: "SBC443",
    accountName: "SBC 443 ACCOUNT",
    startingFund: 41000,
    route: "/accounting-head/transaction?sbc=443",
  },
  "444": {
    label: "SBC444",
    accountName: "SBC 444 ACCOUNT",
    startingFund: 0,
    route: "/accounting-head/transaction?sbc=444",
  },
  "445": {
    label: "SBC445",
    accountName: "SBC 445 ACCOUNT",
    startingFund: 0,
    route: "/accounting-head/transaction?sbc=445",
  },
  "446": {
    label: "SBC446",
    accountName: "SBC 446 ACCOUNT",
    startingFund: 0,
    route: "/accounting-head/transaction?sbc=446",
  },
};

function pad2(x: number) {
  return String(x).padStart(2, "0");
}
function nowTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}:${pad2(d.getSeconds())}`;
}
function ymdCompact(d = new Date()) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}
function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseAmount(v: string) {
  const cleaned = (v ?? "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
function genVoucherNoFromMode(mode: PayMode, existing: Transaction[]) {
  const prefix = mode === "cash" ? "CSH" : "CHK";
  const datePart = ymdCompact(new Date());
  const pattern = new RegExp(`^${prefix}-${datePart}-(\\d{4})$`);
  let maxSeq = 0;

  for (const t of existing) {
    const m = t.voucherNo.match(pattern);
    if (m?.[1]) {
      const seq = Number(m[1]);
      if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
    }
  }

  const next = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}-${datePart}-${next}`;
}

const Icons = {
  Plus: (props: any) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Download: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Print: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M7 8V3h10v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 14h10v7H7v-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
  Columns: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 5h16v14H4V5Z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 5v14" stroke="currentColor" strokeWidth="2" />
      <path d="M15 5v14" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  ChevronLeft: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  X: (props: any) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  Eye: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Trash: (props: any) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6l1 16h10l1-16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold" style={{ color: "#111" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function TransactionLedgerPage({ sbc }: { sbc: SbcKey }) {
  const router = useRouter();

  const { accountName, startingFund, label } = SBC_CONFIG[sbc];

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [showFundCols, setShowFundCols] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [txType, setTxType] = useState<TxType | null>(null);
  const [payMode, setPayMode] = useState<PayMode | null>(null);

  const [fundSectionOpen, setFundSectionOpen] = useState(false);

  const [fundItems, setFundItems] = useState<FundRefDraftItem[]>([]);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftRef, setDraftRef] = useState("");
  const [draftPreviewUrl, setDraftPreviewUrl] = useState<string>("");
  const draftFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [chequeFiles, setChequeFiles] = useState<ChequeDraftItem[]>([]);
  const chequeFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string>("");
  const [photoViewerTitle, setPhotoViewerTitle] = useState<string>("");

  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const [form, setForm] = useState({
    voucherDate: "",
    voucherNo: "",
    transType: "",
    owner: OWNER_OPTIONS[0],
    unit: "",
    particulars: "",
    amount: "",
    personInCharge: "",
  });

  useEffect(() => {
    setUser({ name: "Accountant Head", email: "accountanthead@example.com", role: "accountant" });
    setLoading(false);
  }, [router]);

  useEffect(() => setPage(1), [query]);

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => {
      const fundText = (t.fundRefs ?? []).map((x) => `${x.photoName} ${x.reference}`).join(" ");
      const hay = `${t.date} ${t.voucherNo} ${t.transType} ${t.owner} ${t.particulars} ${fundText} ${
        t.personInCharge ?? ""
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [transactions, query]);

  const computed = useMemo(() => {
    let balance = startingFund;
    const outBalancesAll = transactions.map((t) => {
      balance = balance + t.deposit - t.withdrawal;
      return balance;
    });

    const totalDeposit = transactions.reduce((a, t) => a + t.deposit, 0);
    const totalWithdrawal = transactions.reduce((a, t) => a + t.withdrawal, 0);
    const totalOutBalance = outBalancesAll.length ? outBalancesAll[outBalancesAll.length - 1] : startingFund;

    return { outBalancesAll, totalDeposit, totalWithdrawal, totalOutBalance };
  }, [transactions, startingFund]);

  const currentBalance = computed.totalOutBalance;

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / ROWS_PER_PAGE));
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount]);

  const pageStart = (page - 1) * ROWS_PER_PAGE;
  const pageEnd = pageStart + ROWS_PER_PAGE;
  const visibleTransactions = filteredTransactions.slice(pageStart, pageEnd);

  const getOutBalanceForTx = (txId: string) => {
    const idx = transactions.findIndex((t) => t.id === txId);
    if (idx < 0) return startingFund;
    return computed.outBalancesAll[idx] ?? startingFund;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhotoViewerOpen(false);
    };
    if (photoViewerOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoViewerOpen]);

  const cleanupDraftPreview = () => {
    if (draftPreviewUrl) {
      try {
        URL.revokeObjectURL(draftPreviewUrl);
      } catch {}
      setDraftPreviewUrl("");
    }
  };

  const cleanupChequePreviews = (items: ChequeDraftItem[]) => {
    for (const it of items) {
      try {
        URL.revokeObjectURL(it.previewUrl);
      } catch {}
    }
  };

  const clearDraftInputs = () => {
    setDraftFile(null);
    setDraftRef("");
    if (draftFileInputRef.current) draftFileInputRef.current.value = "";
  };

  const cleanupAllFundItemUrls = (items: FundRefDraftItem[]) => {
    for (const it of items) {
      try {
        URL.revokeObjectURL(it.previewUrl);
      } catch {}
    }
  };

  const resetModalState = () => {
    setStep(1);
    setTxType(null);
    setPayMode(null);

    setFundSectionOpen(false);

    cleanupDraftPreview();
    clearDraftInputs();

    setChequeFiles((prev) => {
      cleanupChequePreviews(prev);
      return [];
    });
    if (chequeFileInputRef.current) chequeFileInputRef.current.value = "";

    setFundItems((prev) => {
      cleanupAllFundItemUrls(prev);
      return [];
    });

    setPhotoViewerOpen(false);
    setPhotoViewerUrl("");
    setPhotoViewerTitle("");
  };

  const voucherBasedPhotoName = (voucherNo: string, index: number, total: number) => {
    const base = (voucherNo ?? "").trim() || "VOUCHER";
    if (total <= 1) return base;
    return `${base}(${index + 1})`;
  };

  const fileExtension = (fileName: string) => {
    const cleaned = (fileName ?? "").trim();
    const dot = cleaned.lastIndexOf(".");
    if (dot <= 0 || dot === cleaned.length - 1) return "";
    return cleaned.slice(dot + 1).toLowerCase();
  };

  const voucherBasedPhotoFileName = (voucherNo: string, index: number, total: number, originalFileName: string) => {
    const base = voucherBasedPhotoName(voucherNo, index, total);
    const ext = fileExtension(originalFileName);
    return ext ? `${base}.${ext}` : base;
  };

  const closeModal = () => {
    setModalOpen(false);
    resetModalState();
  };

  const choosePayMode = (mode: PayMode) => {
    setPayMode(mode);
    const vd = nowTimestamp();
    const vn = genVoucherNoFromMode(mode, transactions);
    setForm((prev) => ({ ...prev, voucherDate: vd, voucherNo: vn }));
    setStep(3);
  };

  const openPhotoViewer = (url: string, title: string) => {
    setPhotoViewerUrl(url);
    setPhotoViewerTitle(title);
    setPhotoViewerOpen(true);
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const submitTx = () => {
    if (!txType || !payMode) return;

    const amt = parseAmount(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) return setError("Please enter a valid amount greater than 0.");
    if (!form.particulars.trim()) return setError("Please enter particulars.");
    if (payMode === "check") {
      if (chequeFiles.length === 0) return setError("Please upload cheque photo (max 2). ");
      if (chequeFiles.length > 2) return setError("Maximum of 2 cheque photos only.");
    } else {
      if (!form.transType.trim()) return setError("Please enter CHEQUE / DEPOSIT SLIP / TRANSACTION TYPE.");
    }

    if (!form.personInCharge.trim()) return setError("Person in Charge is required.");

    if (txType === "withdrawal" && amt > currentBalance) {
      return setError("Withdrawal exceeds available balance.");
    }

    if (fundItems.length === 0) return setError("Please add at least one Fund Reference item (photo + reference).");

    const transTypeProofs: FundRef[] | undefined =
      payMode === "check"
        ? chequeFiles.map((x, idx) => ({
            photoName: voucherBasedPhotoFileName(form.voucherNo, idx, chequeFiles.length, x.file.name),
            reference: "",
            photoUrl: x.photoDataUrl,
          }))
        : undefined;

    const tx: Transaction = {
      id: uid(),
      date: form.voucherDate,
      voucherNo: form.voucherNo,
      transType:
        payMode === "check"
          ? transTypeProofs?.map((p) => p.photoName).join(", ") ?? "CHEQUE"
          : form.transType.trim(),
      transTypeProofs,
      owner: form.owner,
      particulars: `${form.unit.trim()} ${form.particulars.trim()}`.trim(),
      deposit: txType === "deposit" ? amt : 0,
      withdrawal: txType === "withdrawal" ? amt : 0,
      personInCharge: form.personInCharge.trim(),
      fundRefs: fundItems.map((x) => ({ photoName: x.photoName, reference: x.reference, photoUrl: x.photoDataUrl })),
    };

    setTransactions((prev) => [...prev, tx]);

    const nextCount = filteredTransactions.length + 1;
    const nextPageCount = Math.max(1, Math.ceil(nextCount / ROWS_PER_PAGE));
    setPage(nextPageCount);

    setError("");
    setModalOpen(false);
    resetModalState();

    setSuccessModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8]">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="font-semibold" style={{ color: "#111" }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

  const tableMinW = showFundCols ? "min-w-[1800px]" : "min-w-[1400px]";

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="text-2xl md:text-3xl font-extrabold text-[#5f0c18] inline-flex items-center gap-2">
                  {label}
                  <ChevronDown className="h-5 w-5 opacity-90" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-44">
                {(Object.keys(SBC_CONFIG) as SbcKey[]).map((k) => (
                  <DropdownMenuItem
                    key={k}
                    onSelect={(e) => {
                      e.preventDefault();
                      router.replace(SBC_CONFIG[k].route);
                    }}
                  >
                    {SBC_CONFIG[k].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="mt-1 text-sm text-neutral-800">
              Manage deposits and withdrawals for <span className="font-semibold">{accountName}</span>.
            </p>
          </div>

          <button
            onClick={() => {
              setQuery("");
              setError("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 w-full md:w-auto"
            style={{ borderColor: BORDER, height: 40, color: "#111" }}
          >
            <Icons.Refresh />
            Refresh
          </button>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="relative w-full sm:w-[520px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search voucher no., particulars..."
                  className="w-full rounded-xl border bg-white px-10 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                />
              </div>

              <span
                className="inline-flex items-center rounded-full border px-4 text-xs font-semibold"
                style={{
                  borderColor: "rgba(122,15,31,0.18)",
                  background: "rgba(122,15,31,0.08)",
                  color: "#7a0f1f",
                  height: 40,
                  whiteSpace: "nowrap",
                }}
              >
                Starting Fund: ₱{formatMoney(startingFund)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95 w-full sm:w-auto"
                style={{ background: "#7a0f1f", height: 40 }}
                onClick={() => setError("")}
                type="button"
                title="Export (UI only)"
              >
                <Icons.Download />
                Export
              </button>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50 w-full sm:w-auto"
                style={{ borderColor: BORDER, height: 40, color: "#111" }}
                onClick={() => window?.print?.()}
                type="button"
                title="Print"
              >
                <Icons.Print />
                Print
              </button>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95 w-full sm:w-auto"
                style={{ background: "#7a0f1f", height: 40 }}
                type="button"
                onClick={() => {
                  setModalOpen(true);
                  setStep(1);
                  setTxType(null);
                  setPayMode(null);
                  setError("");

                  setForm({
                    voucherDate: "",
                    voucherNo: "",
                    transType: "",
                    owner: OWNER_OPTIONS[0],
                    unit: "",
                    particulars: "",
                    amount: "",
                    personInCharge: "",
                  });

                  setFundSectionOpen(false);

                  cleanupDraftPreview();
                  clearDraftInputs();
                  setFundItems((prev) => {
                    cleanupAllFundItemUrls(prev);
                    return [];
                  });

                  setChequeFiles((prev) => {
                    cleanupChequePreviews(prev);
                    return [];
                  });
                  if (chequeFileInputRef.current) chequeFileInputRef.current.value = "";

                  setPhotoViewerOpen(false);
                  setPhotoViewerUrl("");
                  setPhotoViewerTitle("");
                }}
                title="New Transaction"
              >
                <Icons.Plus />
                New
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "rgba(185,28,28,.25)", background: "rgba(185,28,28,.06)", color: "#b91c1c" }}
          >
            {error}
          </div>
        )}

        <section className="mt-6 rounded-2xl bg-white shadow-sm border" style={{ borderColor: BORDER }}>
          <div
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-5 py-4 border-b"
            style={{ borderColor: BORDER }}
          >
            <div className="text-sm font-semibold text-neutral-900 break-words">
              ABIC Realty & Consultancy Corporation — <span className="text-[#5f0c18] font-extrabold">{accountName}</span>
              <span className="ml-2 text-neutral-800 font-semibold">• Running Balance: ₱{formatMoney(currentBalance)}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowFundCols((s) => !s)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50 w-full md:w-auto"
              style={{ borderColor: BORDER, height: 40, color: "#111" }}
              title="Toggle Fund Reference Columns"
            >
              <Icons.Columns />
              {showFundCols ? "Hide Fund Columns" : "Show Fund Columns"}
            </button>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: BORDER }}>
              <table className={`w-full ${tableMinW} border-collapse`} style={{ color: "#111" }}>
                <thead>
                  <tr className="bg-neutral-50 text-xs font-semibold text-neutral-900">
                    <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                      Date
                    </th>
                    <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                      Voucher No.
                    </th>
                    <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                      Transaction Type
                    </th>
                    <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                      Owner
                    </th>
                    <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                      Particulars
                    </th>
                    {showFundCols && (
                      <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                        Person In Charge
                      </th>
                    )}
                    <th className="px-4 py-3 text-right border-b" style={{ borderColor: BORDER }}>
                      Deposit
                    </th>
                    <th className="px-4 py-3 text-right border-b" style={{ borderColor: BORDER }}>
                      Withdrawal
                    </th>
                    <th className="px-4 py-3 text-right border-b" style={{ borderColor: BORDER }}>
                      Balance
                    </th>
                    {showFundCols && (
                      <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                        Fund Ref Photo(s)
                      </th>
                    )}
                    {showFundCols && (
                      <th className="px-4 py-3 text-left border-b" style={{ borderColor: BORDER }}>
                        Fund Reference(s)
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {visibleTransactions.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-sm font-semibold text-neutral-700" colSpan={showFundCols ? 11 : 8}>
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    visibleTransactions.map((t) => {
                      const outBal = getOutBalanceForTx(t.id);
                      const refs = t.fundRefs ?? [];

                      return (
                        <tr key={t.id} className="text-sm">
                          <td className="px-4 py-3 border-t whitespace-nowrap" style={{ borderColor: BORDER }}>
                            {t.date}
                          </td>
                          <td className="px-4 py-3 border-t whitespace-nowrap font-semibold" style={{ borderColor: BORDER }}>
                            {t.voucherNo}
                          </td>
                          <td className="px-4 py-3 border-t whitespace-nowrap" style={{ borderColor: BORDER }}>
                            {t.transTypeProofs && t.transTypeProofs.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {t.transTypeProofs.map((p, idx) => (
                                  <button
                                    key={`${t.id}-tt-${idx}`}
                                    type="button"
                                    className="text-left font-semibold underline"
                                    style={{ color: "#5f0c18" }}
                                    onClick={() => p.photoUrl && openPhotoViewer(p.photoUrl, p.photoName)}
                                    title={p.photoName}
                                  >
                                    {p.photoName}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="whitespace-nowrap">{t.transType}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 border-t whitespace-nowrap" style={{ borderColor: BORDER }}>
                            {t.owner}
                          </td>
                          <td className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
                            {t.particulars}
                          </td>
                          {showFundCols && (
                            <td className="px-4 py-3 border-t whitespace-nowrap" style={{ borderColor: BORDER }}>
                              {t.personInCharge?.trim() ? t.personInCharge : "—"}
                            </td>
                          )}

                          <td
                            className="px-4 py-3 border-t text-right whitespace-nowrap"
                            style={{ borderColor: BORDER, color: t.deposit ? "#16a34a" : "#6b7280" }}
                          >
                            {t.deposit ? `₱${formatMoney(t.deposit)}` : "—"}
                          </td>

                          <td
                            className="px-4 py-3 border-t text-right whitespace-nowrap"
                            style={{ borderColor: BORDER, color: t.withdrawal ? "#dc2626" : "#6b7280" }}
                          >
                            {t.withdrawal ? `₱${formatMoney(t.withdrawal)}` : "—"}
                          </td>

                          <td className="px-4 py-3 border-t text-right whitespace-nowrap" style={{ borderColor: BORDER }}>
                            ₱{formatMoney(outBal)}
                          </td>

                          {showFundCols && (
                            <td className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
                              {refs.length === 0 ? (
                                "—"
                              ) : (
                                <div className="grid gap-1">
                                  {refs.map((r, idx) => (
                                    <button
                                      key={`${t.id}-photo-${idx}`}
                                      type="button"
                                      className="text-left font-semibold underline"
                                      style={{ color: "#5f0c18" }}
                                      onClick={() => r.photoUrl && openPhotoViewer(r.photoUrl, r.photoName)}
                                      title={r.photoName}
                                    >
                                      {r.photoName}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          )}

                          {showFundCols && (
                            <td className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
                              {refs.length === 0 ? (
                                "—"
                              ) : (
                                <div className="grid gap-1">
                                  {refs.map((r, idx) => (
                                    <div key={`${t.id}-ref-${idx}`} className="font-semibold">
                                      {r.reference}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-white text-sm font-extrabold">
                    <td className="px-4 py-3 border-t text-[#5f0c18]" style={{ borderColor: BORDER }} colSpan={showFundCols ? 6 : 5}>
                      TOTAL
                    </td>

                    <td className="px-4 py-3 border-t text-right whitespace-nowrap" style={{ borderColor: BORDER }}>
                      ₱{formatMoney(computed.totalDeposit)}
                    </td>

                    <td className="px-4 py-3 border-t text-right whitespace-nowrap" style={{ borderColor: BORDER }}>
                      ₱{formatMoney(computed.totalWithdrawal)}
                    </td>

                    <td className="px-4 py-3 border-t text-right whitespace-nowrap" style={{ borderColor: BORDER }}>
                      ₱{formatMoney(computed.totalOutBalance)}
                    </td>

                    {showFundCols && <td className="px-4 py-3 border-t" style={{ borderColor: BORDER }} />}
                    {showFundCols && <td className="px-4 py-3 border-t" style={{ borderColor: BORDER }} />}
                  </tr>
                </tfoot>
              </table>
            </div>

            {filteredTransactions.length > ROWS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs font-semibold text-neutral-700">
                  {pageStart + 1}-{Math.min(pageEnd, filteredTransactions.length)} of {filteredTransactions.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60"
                    style={{ borderColor: BORDER, height: 38, color: "#111" }}
                  >
                    <Icons.ChevronLeft />
                    Prev
                  </button>

                  <div className="text-sm font-extrabold text-neutral-900">
                    {page}/{pageCount}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60"
                    style={{ borderColor: BORDER, height: 38, color: "#111" }}
                  >
                    Next
                    <Icons.ChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {modalOpen && (
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b bg-neutral-50" style={{ borderColor: BORDER }}>
                <div className="text-sm font-extrabold text-neutral-900">New Transaction</div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border hover:bg-white"
                  style={{ borderColor: BORDER, width: 40, height: 40, color: "#111" }}
                  title="Close"
                >
                  <span className="grid place-items-center">
                    <Icons.X />
                  </span>
                </button>
              </div>

              <div className="p-5 max-h-[calc(100vh-180px)] overflow-auto">
                {step === 1 && (
                  <>
                    <div className="text-xs font-semibold text-neutral-700 mb-3">Choose transaction type</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setTxType("deposit");
                          setStep(2);
                        }}
                        className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                        style={{ borderColor: BORDER, color: "#111" }}
                      >
                        Deposit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTxType("withdrawal");
                          setStep(2);
                        }}
                        className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                        style={{ borderColor: BORDER, color: "#111" }}
                      >
                        Withdrawal
                      </button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="text-xs font-semibold text-neutral-700 mb-3">Choose mode</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => choosePayMode("cash")}
                        className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                        style={{ borderColor: BORDER, color: "#111" }}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => choosePayMode("check")}
                        className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                        style={{ borderColor: BORDER, color: "#111" }}
                      >
                        Check
                      </button>
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-neutral-50"
                        style={{ borderColor: BORDER, height: 38, color: "#111" }}
                      >
                        ← Change
                      </button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWrap label="Voucher Date">
                        <input
                          readOnly
                          value={form.voucherDate}
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-neutral-50"
                          style={{ borderColor: BORDER, color: "#111" }}
                        />
                      </FieldWrap>

                      <FieldWrap label="Voucher No.">
                        <input
                          readOnly
                          value={form.voucherNo}
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-neutral-50"
                          style={{ borderColor: BORDER, color: "#111" }}
                        />
                      </FieldWrap>

                      <div className="md:col-span-2">
                        <FieldWrap label="CHEQUE / DEPOSIT SLIP / TRANSACTION TYPE">
                          {payMode === "check" ? (
                            <div className="grid gap-3">
                              <input
                                ref={chequeFileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={chequeFiles.length >= 2}
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files ?? []);
                                  if (files.length === 0) return;
                                  setError("");

                                  const remaining = Math.max(0, 2 - chequeFiles.length);
                                  if (remaining === 0) {
                                    if (chequeFileInputRef.current) chequeFileInputRef.current.value = "";
                                    return;
                                  }

                                  const nextFiles = files.slice(0, remaining);
                                  const mapped: ChequeDraftItem[] = [];
                                  for (const f of nextFiles) {
                                    const dataUrl = await fileToDataUrl(f);
                                    mapped.push({ id: uid(), file: f, previewUrl: URL.createObjectURL(f), photoDataUrl: dataUrl });
                                  }

                                  setChequeFiles((prev) => [...prev, ...mapped]);

                                  if (chequeFileInputRef.current) chequeFileInputRef.current.value = "";
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-white"
                                style={{ borderColor: BORDER, color: "#111" }}
                              />

                              <div className="text-xs text-neutral-700">
                                Upload cheque photo (maximum of 2). File name will follow Voucher No.
                              </div>

                              {chequeFiles.length >= 2 && (
                                <div className="text-xs font-semibold text-neutral-700">Maximum of 2 photos reached.</div>
                              )}

                              {chequeFiles.length > 0 && (
                                <div className="grid gap-2">
                                  {chequeFiles.map((it, idx) => {
                                    const photoName = voucherBasedPhotoFileName(form.voucherNo, idx, chequeFiles.length, it.file.name);
                                    return (
                                      <div
                                        key={it.id}
                                        className="rounded-xl border p-3 flex items-center justify-between gap-3"
                                        style={{ borderColor: BORDER }}
                                      >
                                        <div className="min-w-0">
                                          <div className="text-xs font-extrabold text-[#5f0c18] truncate">{photoName}</div>
                                          <div className="mt-1 text-[11px] text-neutral-700 truncate">{it.file.name}</div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-neutral-50"
                                            style={{ borderColor: BORDER, height: 36, color: "#111" }}
                                            onClick={() => openPhotoViewer(it.previewUrl, photoName)}
                                          >
                                            View
                                          </button>
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white hover:opacity-95"
                                            style={{ background: "#7a0f1f", height: 36 }}
                                            onClick={() => {
                                              setChequeFiles((prev) => {
                                                const item = prev.find((x) => x.id === it.id);
                                                if (item) {
                                                  try {
                                                    URL.revokeObjectURL(item.previewUrl);
                                                  } catch {}
                                                }
                                                const nextList = prev.filter((x) => x.id !== it.id);
                                                if (nextList.length === 0 && chequeFileInputRef.current) {
                                                  chequeFileInputRef.current.value = "";
                                                }
                                                return nextList;
                                              });
                                            }}
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              value={form.transType}
                              onChange={(e) => setForm((p) => ({ ...p, transType: e.target.value }))}
                              placeholder="Enter last transaction number / reference..."
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                              style={{ borderColor: BORDER, color: "#111" }}
                            />
                          )}
                        </FieldWrap>
                      </div>

                      <div className="md:col-span-2">
                        <FieldWrap label="Owner">
                          <select
                            value={form.owner}
                            onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-white"
                            style={{ borderColor: BORDER, color: "#111" }}
                          >
                            {OWNER_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </FieldWrap>
                      </div>

                      <FieldWrap label="Unit">
                        <input
                          value={form.unit}
                          onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                          placeholder="Enter unit..."
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: BORDER, color: "#111" }}
                        />
                      </FieldWrap>

                      <FieldWrap label="Particulars">
                        <input
                          value={form.particulars}
                          onChange={(e) => setForm((p) => ({ ...p, particulars: e.target.value }))}
                          placeholder="Enter particulars..."
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: BORDER, color: "#111" }}
                        />
                      </FieldWrap>

                      <FieldWrap label={txType === "deposit" ? "Deposit Amount" : "Withdrawal Amount"}>
                        <input
                          value={form.amount}
                          onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                          placeholder="0.00"
                          inputMode="decimal"
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none text-right"
                          style={{ borderColor: BORDER, color: "#111" }}
                        />
                      </FieldWrap>

                      <div className="md:col-span-2">
                        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: BORDER }}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="text-sm font-extrabold text-neutral-900">Fund References</div>
                              <div className="mt-1 text-xs text-neutral-700">
                                Click the button to add Person in Charge + Photo + Bank Reference. You can add multiple items.
                              </div>
                            </div>

                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                              style={{ background: "#7a0f1f", height: 40 }}
                              onClick={() => setFundSectionOpen(true)}
                            >
                              <Icons.Plus /> Add Fund References
                            </button>
                          </div>

                          {fundSectionOpen && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <FieldWrap label="Person in Charge">
                                <input
                                  value={form.personInCharge}
                                  onChange={(e) => setForm((p) => ({ ...p, personInCharge: e.target.value }))}
                                  placeholder="Enter person in charge..."
                                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                  style={{ borderColor: BORDER, color: "#111" }}
                                />
                              </FieldWrap>

                              <FieldWrap label="Upload Photo">
                                <input
                                  ref={draftFileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    cleanupDraftPreview();
                                    setDraftFile(file);
                                    if (file) setDraftPreviewUrl(URL.createObjectURL(file));
                                  }}
                                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-white"
                                  style={{ borderColor: BORDER, color: "#111" }}
                                />
                              </FieldWrap>

                              <FieldWrap label="Reference (Bank Ref)">
                                <input
                                  value={draftRef}
                                  onChange={(e) => setDraftRef(e.target.value)}
                                  placeholder="Enter reference..."
                                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none bg-white"
                                  style={{ borderColor: BORDER, color: "#111" }}
                                />
                              </FieldWrap>

                              <div className="md:col-span-3 flex items-center justify-between gap-3 flex-wrap mt-1">
                                <div className="text-xs font-semibold text-red-600">
                                  Please add at least one item before submitting.
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {draftPreviewUrl && (
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-neutral-50"
                                      style={{ borderColor: BORDER, height: 40, color: "#111" }}
                                      onClick={() => openPhotoViewer(draftPreviewUrl, draftFile?.name ?? "Preview")}
                                    >
                                      <Icons.Eye /> Preview
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                                    style={{
                                      background: "#7a0f1f",
                                      height: 40,
                                      opacity: draftFile && draftRef.trim() ? 1 : 0.6,
                                      pointerEvents: draftFile && draftRef.trim() ? "auto" : "none",
                                    }}
                                    onClick={async () => {
                                      if (!draftFile) return;

                                      const refRaw = draftRef.trim();
                                      if (!refRaw) return;

                                      const dataUrl = await fileToDataUrl(draftFile);
                                      const extMatch = draftFile.name.match(/\.[^./\\]+$/);
                                      const ext = extMatch?.[0] ?? "";
                                      const photoName = `${refRaw}${ext}`;

                                      const newItem: FundRefDraftItem = {
                                        id: uid(),
                                        file: draftFile,
                                        reference: refRaw,
                                        photoName,
                                        previewUrl: draftPreviewUrl,
                                        photoDataUrl: dataUrl,
                                      };

                                      setFundItems((prev) => [...prev, newItem]);

                                      setDraftPreviewUrl("");
                                      clearDraftInputs();
                                    }}
                                  >
                                    <Icons.Plus /> Add Item
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50"
                                    style={{ borderColor: BORDER, height: 40, color: "#111" }}
                                    onClick={() => {
                                      cleanupDraftPreview();
                                      clearDraftInputs();
                                    }}
                                  >
                                    Clear
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50"
                                    style={{ borderColor: BORDER, height: 40, color: "#111" }}
                                    onClick={() => setFundSectionOpen(false)}
                                  >
                                    Close Section
                                  </button>
                                </div>
                              </div>

                              {fundItems.length > 0 && (
                                <div className="md:col-span-3 grid gap-3 mt-2">
                                  {fundItems.map((it) => (
                                    <div
                                      key={it.id}
                                      className="rounded-2xl border p-3 bg-white flex items-center justify-between gap-3 flex-wrap"
                                      style={{ borderColor: BORDER }}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <img
                                          src={it.previewUrl}
                                          alt="Fund ref thumbnail"
                                          className="h-14 w-14 rounded-xl object-cover border"
                                          style={{ borderColor: BORDER }}
                                        />
                                        <div className="min-w-0">
                                          <div className="font-semibold text-neutral-900 truncate">{it.photoName}</div>
                                          <div className="mt-1 text-xs font-semibold text-neutral-700 truncate">
                                            Ref: <span className="text-neutral-900">{it.reference}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-neutral-50"
                                          style={{ borderColor: BORDER, height: 40, color: "#111" }}
                                          onClick={() => openPhotoViewer(it.previewUrl, it.file.name)}
                                        >
                                          <Icons.Eye /> View
                                        </button>

                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-neutral-50"
                                          style={{ borderColor: "rgba(185,28,28,.25)", height: 40, color: "#b91c1c" }}
                                          onClick={() => {
                                            setFundItems((prev) => {
                                              const found = prev.find((x) => x.id === it.id);
                                              if (found) URL.revokeObjectURL(found.previewUrl);
                                              return prev.filter((x) => x.id !== it.id);
                                            });
                                          }}
                                        >
                                          <Icons.Trash /> Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50"
                        style={{ borderColor: BORDER, height: 40, color: "#111" }}
                      >
                        ← Change
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50"
                          style={{ borderColor: BORDER, height: 40, color: "#111" }}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={submitTx}
                          className="rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                          style={{ background: "#7a0f1f", height: 40 }}
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {photoViewerOpen && (
          <div
            onClick={() => setPhotoViewerOpen(false)}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,.65)" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl rounded-2xl overflow-hidden border shadow-2xl relative"
              style={{ borderColor: "rgba(255,255,255,.12)", background: "#0b0b0d" }}
            >
              <button
                type="button"
                onClick={() => setPhotoViewerOpen(false)}
                className="absolute top-3 right-3 rounded-xl border"
                style={{
                  borderColor: "rgba(255,255,255,.16)",
                  background: "rgba(255,255,255,.08)",
                  width: 44,
                  height: 44,
                  color: "#fff",
                }}
                title="Close"
              >
                <span className="grid place-items-center">
                  <Icons.X />
                </span>
              </button>

              <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,.10)" }}>
                <div className="text-sm font-extrabold" style={{ color: "rgba(255,255,255,.92)" }}>
                  Fund Ref Photo Preview
                  <span className="ml-2 text-xs font-semibold" style={{ color: "rgba(255,255,255,.65)" }}>
                    {photoViewerTitle ? `• ${photoViewerTitle}` : ""} (click outside or press Esc to close)
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-center">
                {photoViewerUrl ? (
                  <img
                    src={photoViewerUrl}
                    alt="Full Preview"
                    className="w-full rounded-2xl"
                    style={{ maxHeight: "72vh", objectFit: "contain", background: "#111115" }}
                  />
                ) : (
                  <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.75)" }}>
                    No image selected.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <SuccessModal
          isOpen={successModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          title="Transaction Created Successfully"
          message="Your transaction has been created."
          buttonText="OK"
        />
      </main>
    </div>
  );
}

function isSbcKey(v: string | null): v is SbcKey {
  return v === "443" || v === "444" || v === "445" || v === "446";
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TransactionPageInner />
    </Suspense>
  );
}

function TransactionPageInner() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("sbc");
  const sbc: SbcKey = isSbcKey(raw) ? raw : "443";

  return <TransactionLedgerPage sbc={sbc} />;
}
