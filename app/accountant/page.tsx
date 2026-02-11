"use client";


import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

type User = { name: string; email: string; role: string };


type TxType = "deposit" | "withdrawal";
type PayMode = "cash" | "check";


type AccountKey =
  | "SBC 443 ACCOUNT"
  | "SBC 444 ACCOUNT"
  | "SBC 445 ACCOUNT"
  | "SBC 446 ACCOUNT"
  | "No permission"; // ✅ trial


type Transaction = {
  id: string;
  date: string;
  voucherNo: string; // auto (CSH/CHK)
  transType: string; // input (last transaction no / ref)
  owner: string;
  particulars: string;
  deposit: number;
  withdrawal: number;
  fundReferences?: string;
  personInCharge?: string;
};


const ROWS_PER_PAGE = 15;


// ✅ 5 options now (trial)
const ACCOUNT_OPTIONS: AccountKey[] = [
  "SBC 443 ACCOUNT",
  "SBC 444 ACCOUNT",
  "SBC 445 ACCOUNT",
  "SBC 446 ACCOUNT",
  "No permission",
];


// ✅ starting balances for real accounts
const STARTING_BALANCE_BY_ACCOUNT: Record<Exclude<AccountKey, "No permission">, number> = {
  "SBC 443 ACCOUNT": 41000,
  "SBC 444 ACCOUNT": 25000,
  "SBC 445 ACCOUNT": 87500,
  "SBC 446 ACCOUNT": 12000,
};


const OWNER_OPTIONS = ["ABIC", "Supplier", "Client", "Employee", "SBC"];


/* ---------- Theme ---------- */
const THEME = {
  maroon: "#7A0D26",
  maroon2: "#8E1030",
  maroonDark: "#5F0A1D",


  pageBg: "#F5F6F8",
  cardBg: "#FFFFFF",
  cardBorder: "#E7E8EE",


  tableHeaderBg: "#F2E8EB",
  tableGrid: "#E7E8EE",
  tableText: "#1E1E24",
  muted: "#6B6E76",


  green: "#1E9E53",
  red: "#D21D2A",
};


function fontFamily() {
  return `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif`;
}


function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


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
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`; // YYYYMMDD
}


function parseAmount(v: string) {
  const cleaned = (v ?? "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}


function needsExtraFields(owner: string) {
  const o = (owner || "").trim().toLowerCase();
  return o === "abic" || o === "supplier";
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


/* ---------- Icons ---------- */
const IconSearch = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke={THEME.muted} strokeWidth="2" />
    <path d="M16.5 16.5 21 21" stroke={THEME.muted} strokeWidth="2" strokeLinecap="round" />
  </svg>
);


const IconDownload = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);


const IconPrint = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 8V3h10v5" stroke={THEME.tableText} strokeWidth="2" strokeLinejoin="round" />
    <path
      d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
      stroke={THEME.tableText}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M7 14h10v7H7v-7Z" stroke={THEME.tableText} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);


const IconEye = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
      stroke={THEME.tableText}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={THEME.tableText} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);


const IconChevronLeft = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" stroke={THEME.tableText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const IconChevronRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6l6 6-6 6" stroke={THEME.tableText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const IconX = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" stroke={THEME.tableText} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);


const IconPlus = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);


/* ---------- UI helpers ---------- */
function cardStyle(): React.CSSProperties {
  return {
    background: THEME.cardBg,
    border: `1px solid ${THEME.cardBorder}`,
    borderRadius: 12,
    boxShadow: "0 4px 14px rgba(16,24,40,.06)",
    padding: 16,
  };
}
function cardTitleStyle(): React.CSSProperties {
  return { color: THEME.maroon, fontWeight: 800, fontSize: 13.5 };
}
function alertStyle(): React.CSSProperties {
  return {
    background: "rgba(210,29,42,.08)",
    border: "1px solid rgba(210,29,42,.20)",
    color: THEME.red,
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
  };
}
function miniBtn(): React.CSSProperties {
  return {
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: `1px solid ${THEME.cardBorder}`,
    background: "#fff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    color: THEME.tableText,
  };
}
function maroonBtn(): React.CSSProperties {
  return {
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: "none",
    background: THEME.maroon2,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 800,
    color: "#fff",
  };
}
function bandHeaderStyle(): React.CSSProperties {
  return {
    textAlign: "left",
    padding: "10px 12px",
    background: "#fff",
    borderBottom: `1px solid ${THEME.tableGrid}`,
    color: THEME.tableText,
    fontSize: 12.5,
    fontWeight: 800,
  };
}
function groupHeaderCell(): React.CSSProperties {
  return {
    padding: "8px 12px",
    background: "#fff",
    borderBottom: `1px solid ${THEME.tableGrid}`,
    color: THEME.muted,
    fontSize: 11.5,
    fontWeight: 800,
  };
}
function thStyle(): React.CSSProperties {
  return {
    textAlign: "left",
    padding: "10px 12px",
    background: THEME.tableHeaderBg,
    borderTop: `1px solid ${THEME.tableGrid}`,
    borderBottom: `1px solid ${THEME.tableGrid}`,
    color: THEME.tableText,
    fontSize: 12,
    fontWeight: 800,
  };
}
function tdStyle(): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderBottom: `1px solid ${THEME.tableGrid}`,
    color: THEME.tableText,
    fontSize: 12.5,
    fontWeight: 600,
    verticalAlign: "top",
    whiteSpace: "nowrap",
  };
}
function tdMoneyStyle(): React.CSSProperties {
  return { ...tdStyle(), textAlign: "right", fontVariantNumeric: "tabular-nums" };
}
function pillStyle(owner: string): React.CSSProperties {
  const special = needsExtraFields(owner);
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    background: special ? "rgba(122,13,38,.10)" : "rgba(107,110,118,.10)",
    border: special ? "1px solid rgba(122,13,38,.18)" : "1px solid rgba(107,110,118,.18)",
    color: special ? THEME.maroon : THEME.tableText,
    fontSize: 12,
    fontWeight: 800,
  };
}
function tfootLabel(): React.CSSProperties {
  return {
    padding: "10px 12px",
    background: "#fff",
    borderTop: `1px solid ${THEME.tableGrid}`,
    color: THEME.maroon,
    fontWeight: 900,
    fontSize: 12.5,
  };
}
function tfootMoney(color: string): React.CSSProperties {
  return {
    padding: "10px 12px",
    background: "#fff",
    borderTop: `1px solid ${THEME.tableGrid}`,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    color,
    fontWeight: 900,
    fontSize: 12.5,
    whiteSpace: "nowrap",
  };
}
function tfootPlain(): React.CSSProperties {
  return {
    padding: "10px 12px",
    background: "#fff",
    borderTop: `1px solid ${THEME.tableGrid}`,
    color: THEME.muted,
    fontWeight: 800,
    fontSize: 12.5,
  };
}
function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${THEME.cardBorder}`,
    background: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    display: "grid",
    placeItems: "center",
  };
}
function choiceBtn(primary: boolean): React.CSSProperties {
  return {
    padding: "12px 12px",
    borderRadius: 10,
    border: primary ? `1px solid rgba(122,13,38,.22)` : `1px solid ${THEME.cardBorder}`,
    background: primary ? "rgba(122,13,38,.08)" : "#fff",
    color: THEME.tableText,
    fontWeight: 800,
    cursor: "pointer",
  };
}
function tag(): React.CSSProperties {
  return { padding: "6px 10px", borderRadius: 999, background: THEME.maroon2, color: "#fff", fontWeight: 900, fontSize: 12 };
}
function tagSoft(): React.CSSProperties {
  return {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(122,13,38,.06)",
    border: "1px solid rgba(122,13,38,.14)",
    color: THEME.maroon,
    fontWeight: 900,
    fontSize: 12,
  };
}
function linkBtn(): React.CSSProperties {
  return { border: "none", background: "transparent", color: THEME.maroon, fontWeight: 800, cursor: "pointer", padding: "4px 6px" };
}
function label(): React.CSSProperties {
  return { display: "block", fontSize: 12, fontWeight: 800, color: THEME.muted, marginBottom: 6 };
}
function input(): React.CSSProperties {
  return {
    width: "100%",
    border: `1px solid ${THEME.cardBorder}`,
    borderRadius: 10,
    padding: "10px 10px",
    fontSize: 12.5,
    fontWeight: 600,
    outline: "none",
    background: "#fff",
    color: THEME.tableText,
  };
}
function inputReadOnly(): React.CSSProperties {
  return { ...input(), background: "#F7F8FB", color: THEME.muted };
}
function btnGhost(): React.CSSProperties {
  return {
    height: 38,
    padding: "0 14px",
    borderRadius: 10,
    border: `1px solid ${THEME.cardBorder}`,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    color: THEME.tableText,
  };
}
function btnMaroon(): React.CSSProperties {
  return { height: 38, padding: "0 16px", borderRadius: 10, border: "none", background: THEME.maroon2, cursor: "pointer", fontWeight: 900, color: "#fff" };
}


function Field({ label: l, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label style={label()}>{l}</label>
      <input value={value} readOnly={readOnly} style={readOnly ? inputReadOnly() : input()} />
    </div>
  );
}


export default function AccountantDashboard() {
  const router = useRouter();


  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");


  // ✅ trial: "No permission" is an option
  const [activeAccount, setActiveAccount] = useState<AccountKey>("SBC 443 ACCOUNT");


  const [transactionsByAccount, setTransactionsByAccount] = useState<Record<AccountKey, Transaction[]>>({
    "SBC 443 ACCOUNT": [],
    "SBC 444 ACCOUNT": [],
    "SBC 445 ACCOUNT": [],
    "SBC 446 ACCOUNT": [],
    "No permission": [],
  });


  const [showExtraCols, setShowExtraCols] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);


  // ✅ TRIAL LOGIC:
  // If user selects "No permission", show blank state.
  // If selects any real account, show table normally (even without permission).
  const isNoPermissionMode = activeAccount === "No permission";


  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [txType, setTxType] = useState<TxType | null>(null);
  const [payMode, setPayMode] = useState<PayMode | null>(null);


  const [form, setForm] = useState({
    voucherDate: "",
    voucherNo: "",
    transType: "",
    owner: OWNER_OPTIONS[0],
    particulars: "",
    amount: "",
    fundReferences: "",
    personInCharge: "",
  });


  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [router]);


  useEffect(() => {
    setPage(1);
  }, [activeAccount, query, showExtraCols]);


  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) router.push("/login");
      else setError("Logout failed");
    } catch {
      setError("Network error");
    }
  };


  const transactions = transactionsByAccount[activeAccount];


  const startingBalance =
    activeAccount === "No permission"
      ? 0
      : STARTING_BALANCE_BY_ACCOUNT[activeAccount as Exclude<AccountKey, "No permission">];


  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => {
      const hay =
        `${t.date} ${t.voucherNo} ${t.transType} ${t.owner} ${t.particulars} ${t.fundReferences ?? ""} ${t.personInCharge ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [transactions, query]);


  const computed = useMemo(() => {
    let balance = startingBalance;
    const outBalancesAll = transactions.map((t) => {
      balance = balance + t.deposit - t.withdrawal;
      return balance;
    });


    const totalDeposit = transactions.reduce((a, t) => a + t.deposit, 0);
    const totalWithdrawal = transactions.reduce((a, t) => a + t.withdrawal, 0);
    const totalOutBalance = outBalancesAll.length ? outBalancesAll[outBalancesAll.length - 1] : startingBalance;


    return { outBalancesAll, totalDeposit, totalWithdrawal, totalOutBalance };
  }, [transactions, startingBalance]);


  const currentBalance = computed.totalOutBalance;


  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / ROWS_PER_PAGE));
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount]);


  const pageStart = (page - 1) * ROWS_PER_PAGE;
  const pageEnd = pageStart + ROWS_PER_PAGE;
  const visibleTransactions = filteredTransactions.slice(pageStart, pageEnd);


  const getOutBalanceForTx = (txId: string) => {
    const idx = transactions.findIndex((t) => t.id === txId);
    if (idx < 0) return startingBalance;
    return computed.outBalancesAll[idx] ?? startingBalance;
  };


  const openModal = () => {
    if (isNoPermissionMode) return; // ✅ block in "No permission"
    setError("");
    setModalOpen(true);
    setStep(1);
    setTxType(null);
    setPayMode(null);
    setForm({
      voucherDate: "",
      voucherNo: "",
      transType: "",
      owner: OWNER_OPTIONS[0],
      particulars: "",
      amount: "",
      fundReferences: "",
      personInCharge: "",
    });
  };


  const closeModal = () => {
    setModalOpen(false);
    setStep(1);
    setTxType(null);
    setPayMode(null);
  };


  const chooseTxType = (type: TxType) => {
    setTxType(type);
    setPayMode(null);
    setStep(2);
  };


  const choosePayMode = (mode: PayMode) => {
    setPayMode(mode);
    const vd = nowTimestamp();
    const vn = genVoucherNoFromMode(mode, transactions);
    setForm((prev) => ({ ...prev, voucherDate: vd, voucherNo: vn }));
    setStep(3);
  };


  const submitTx = () => {
    if (isNoPermissionMode) return;
    if (!txType || !payMode) return;


    const amt = parseAmount(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) return setError("Please enter a valid amount greater than 0.");
    if (!form.particulars.trim()) return setError("Please enter particulars.");
    if (!form.transType.trim()) return setError("Please enter CHEQUE/DEPOSIT SLIP/TRANSTYPE.");


    if (txType === "withdrawal" && amt > currentBalance) {
      return setError(`Withdrawal exceeds available balance. Current Out Balance is ₱${formatMoney(currentBalance)}.`);
    }


    const extraRequired = needsExtraFields(form.owner);
    if (extraRequired) {
      if (!form.fundReferences.trim()) return setError("Fund References is required for ABIC/Supplier.");
      if (!form.personInCharge.trim()) return setError("Person in Charge is required for ABIC/Supplier.");
    }


    const tx: Transaction = {
      id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      date: form.voucherDate,
      voucherNo: form.voucherNo,
      transType: form.transType.trim(),
      owner: form.owner,
      particulars: form.particulars.trim(),
      deposit: txType === "deposit" ? amt : 0,
      withdrawal: txType === "withdrawal" ? amt : 0,
      fundReferences: extraRequired ? form.fundReferences.trim() : "",
      personInCharge: extraRequired ? form.personInCharge.trim() : "",
    };


    setTransactionsByAccount((prev) => ({ ...prev, [activeAccount]: [...prev[activeAccount], tx] }));


    const nextCount = filteredTransactions.length + 1;
    const nextPageCount = Math.max(1, Math.ceil(nextCount / ROWS_PER_PAGE));
    setPage(nextPageCount);


    setError("");
    closeModal();
  };


  const showPagination = filteredTransactions.length > ROWS_PER_PAGE;


  if (loading) {
    return (
      <div style={{ padding: 24, fontFamily: fontFamily(), background: THEME.pageBg, minHeight: "100vh" }}>
        <div style={{ color: THEME.tableText, fontWeight: 700 }}>Loading...</div>
      </div>
    );
  }


  const colSpanTotal = showExtraCols ? 10 : 8;


  return (
    <>
      <style>{`
        :root { color-scheme: light; }
        html, body { margin: 0; padding: 0; background: ${THEME.pageBg}; }
        * { box-sizing: border-box; }
        .tableWrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table { width: 100%; border-collapse: collapse; min-width: ${showExtraCols ? 1400 : 1120}px; }
        .fadeIn { animation: fadeIn .14s ease-out; }
        @keyframes fadeIn { from { opacity:0; transform: translateY(4px);} to { opacity:1; transform: translateY(0);} }
      `}</style>


      <div style={{ minHeight: "100vh", background: THEME.pageBg, fontFamily: fontFamily(), display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            height: 56,
            background: `linear-gradient(90deg, ${THEME.maroon} 0%, ${THEME.maroon2} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            color: "#fff",
            flex: "0 0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
            <div style={{ fontWeight: 700, letterSpacing: ".2px" }}>ABIC Realty & Consultancy Corporation 2026</div>
          </div>


          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,.28)",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
            <div
              title={user?.name ?? "User"}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "rgba(255,255,255,.18)",
                border: "1px solid rgba(255,255,255,.25)",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              {(user?.name?.[0] ?? "U").toUpperCase()}
            </div>
          </div>
        </div>


        {/* Main */}
        <div style={{ padding: 18, flex: "1 1 auto" }}>
          {/* Cards row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div style={cardStyle()}>
              <div style={cardTitleStyle()}>Bank Details</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 12.5, color: "#000" }}>
                <div>
                  <b>Account Name:</b> {isNoPermissionMode ? "—" : activeAccount}
                </div>
                <div>
                  <b>Account Number:</b> {isNoPermissionMode ? "—" : "——"}
                </div>
              </div>
            </div>


            <div style={cardStyle()}>
              <div style={cardTitleStyle()}>Fund Overview</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 12.5, color: "#000" }}>
                <div>
                  <b>Starting Fund:</b> {isNoPermissionMode ? "—" : `₱${formatMoney(startingBalance)}`}
                </div>
                <div>
                  <b>Running Balance:</b> {isNoPermissionMode ? "—" : `₱${formatMoney(currentBalance)}`}
                </div>
              </div>
            </div>
          </div>


          {/* Blank state when "No permission" selected */}
          {isNoPermissionMode ? (
            <div style={{ ...cardStyle(), marginTop: 16, textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>⏳</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: THEME.tableText, marginBottom: 6 }}>
                Waiting for permission
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.muted, maxWidth: 520, margin: "0 auto" }}>
                This is a trial “No permission” account. Select any other account to view tables normally.
              </div>


              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <select
                  value={activeAccount}
                  onChange={(e) => setActiveAccount(e.target.value as AccountKey)}
                  style={{
                    height: 40,
                    borderRadius: 10,
                    border: `1px solid ${THEME.cardBorder}`,
                    padding: "0 12px",
                    fontSize: 12.5,
                    fontWeight: 800,
                    background: "#fff",
                    color: THEME.tableText,
                    minWidth: 260,
                  }}
                >
                  {ACCOUNT_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>


              <div style={{ marginTop: 18, borderRadius: 12, border: `1px dashed ${THEME.cardBorder}`, background: "#fff" }}>
                <div style={{ padding: 14, color: THEME.muted, fontWeight: 800, fontSize: 12.5 }}>
                  Transactions will appear here once you select a real account.
                </div>
                <div style={{ height: 220 }} />
              </div>
            </div>
          ) : (
            /* Normal table view */
            <div style={{ ...cardStyle(), marginTop: 16, padding: 0 }}>
              {/* Toolbar row */}
              <div
                style={{
                  padding: 14,
                  borderBottom: `1px solid ${THEME.cardBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 520px" }}>
                  <div
                    style={{
                      flex: "1 1 520px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      border: `1px solid ${THEME.cardBorder}`,
                      borderRadius: 10,
                      background: "#fff",
                    }}
                  >
                    <IconSearch />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search voucher no., particulars..."
                      style={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        fontSize: 12.5,
                        color: THEME.tableText,
                        background: "transparent",
                      }}
                    />
                  </div>


                  <select
                    value={activeAccount}
                    onChange={(e) => setActiveAccount(e.target.value as AccountKey)}
                    style={{
                      height: 38,
                      borderRadius: 10,
                      border: `1px solid ${THEME.cardBorder}`,
                      padding: "0 10px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: "#fff",
                      color: THEME.tableText,
                      minWidth: 190,
                    }}
                    title="Select account"
                  >
                    {ACCOUNT_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>


                  <button
                    type="button"
                    onClick={() => setShowExtraCols((v) => !v)}
                    style={miniBtn()}
                    title="Toggle extra columns"
                    aria-label="Toggle extra columns"
                  >
                    <IconEye />
                  </button>
                </div>


                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button style={maroonBtn()} type="button" onClick={() => setError("")} title="Export (UI only)">
                    <IconDownload /> <span>Export</span>
                  </button>


                  <button style={miniBtn()} type="button" onClick={() => window?.print?.()} title="Print">
                    <IconPrint /> <span>Print</span>
                  </button>


                  <button style={maroonBtn()} type="button" onClick={openModal} title="New Transaction">
                    <IconPlus /> <span>New</span>
                  </button>
                </div>
              </div>


              {error && (
                <div style={{ padding: "10px 14px 0 14px" }}>
                  <div style={alertStyle()} className="fadeIn">
                    {error}
                  </div>
                </div>
              )}


              <div className="tableWrap">
                <table className="table" aria-label={`${activeAccount} Ledger`}>
                  <thead>
                    <tr>
                      <th colSpan={colSpanTotal} style={bandHeaderStyle()}>
                        ABIC Realty & Consultancy Corporation — <b>{activeAccount}</b>
                      </th>
                    </tr>


                    <tr>
                      <th colSpan={5} style={groupHeaderCell()} />
                      <th colSpan={2} style={{ ...groupHeaderCell(), textAlign: "center" }}>
                        RUNNING BALANCE
                      </th>
                      <th colSpan={1} style={groupHeaderCell()} />
                      {showExtraCols && (
                        <th colSpan={2} style={{ ...groupHeaderCell(), textAlign: "center" }}>
                          PROOF OF DEPOSIT / WITHDRAWAL
                        </th>
                      )}
                    </tr>


                    <tr>
                      {[
                        "Voucher Date",
                        "Voucher No.",
                        "CHEQUE/DEPOSIT SLIP/TRANSTYPE",
                        "Owner",
                        "Particulars",
                        "Deposit",
                        "Withdrawal",
                        "Outstanding Balance",
                      ].map((h) => (
                        <th key={h} style={thStyle()}>
                          {h}
                        </th>
                      ))}


                      {showExtraCols && (
                        <>
                          <th style={thStyle()}>Fund References</th>
                          <th style={thStyle()}>Person In Charge</th>
                        </>
                      )}
                    </tr>
                  </thead>


                  <tbody>
                    {visibleTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={colSpanTotal} style={{ padding: 14, color: THEME.muted, fontWeight: 600 }}>
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      visibleTransactions.map((t, idx) => {
                        const zebra = idx % 2 === 0 ? "#fff" : "#FBFBFD";
                        const outBal = getOutBalanceForTx(t.id);


                        return (
                          <tr key={t.id} style={{ background: zebra }}>
                            <td style={tdStyle()}>{t.date}</td>
                            <td style={tdStyle()}>{t.voucherNo}</td>
                            <td style={tdStyle()}>{t.transType}</td>
                            <td style={tdStyle()}>
                              <span style={pillStyle(t.owner)}>{t.owner}</span>
                            </td>
                            <td style={{ ...tdStyle(), minWidth: 260 }}>{t.particulars}</td>


                            <td style={{ ...tdMoneyStyle(), color: t.deposit ? THEME.green : THEME.muted }}>
                              {t.deposit ? `₱${formatMoney(t.deposit)}` : "₱-----"}
                            </td>


                            <td style={{ ...tdMoneyStyle(), color: t.withdrawal ? THEME.red : THEME.muted }}>
                              {t.withdrawal ? `₱${formatMoney(t.withdrawal)}` : "₱-----"}
                            </td>


                            <td style={{ ...tdMoneyStyle(), fontWeight: 700 }}>{`₱${formatMoney(outBal)}`}</td>


                            {showExtraCols && (
                              <>
                                <td style={tdStyle()}>{t.fundReferences?.trim() ? t.fundReferences : "—"}</td>
                                <td style={tdStyle()}>{t.personInCharge?.trim() ? t.personInCharge : "—"}</td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>


                  <tfoot>
                    <tr>
                      <td colSpan={5} style={tfootLabel()}>
                        TOTAL
                      </td>
                      <td style={tfootMoney(THEME.green)}>{`₱${formatMoney(computed.totalDeposit)}`}</td>
                      <td style={tfootMoney(THEME.red)}>{`₱${formatMoney(computed.totalWithdrawal)}`}</td>
                      <td style={tfootMoney(THEME.tableText)}>{`₱${formatMoney(computed.totalOutBalance)}`}</td>
                      {showExtraCols && (
                        <>
                          <td style={tfootPlain()}>—</td>
                          <td style={tfootPlain()}>—</td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>


              {showPagination && (
                <div
                  style={{
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: `1px solid ${THEME.cardBorder}`,
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12.5, color: THEME.muted }}>
                    Showing <b>{pageStart + 1}</b> to <b>{Math.min(pageEnd, filteredTransactions.length)}</b> of{" "}
                    <b>{filteredTransactions.length}</b> transactions
                  </div>


                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pagerBtn(page === 1)}>
                      <IconChevronLeft />
                    </button>


                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
                        const p = i + 1;
                        const active = p === page;
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 999,
                              border: active ? "none" : `1px solid ${THEME.cardBorder}`,
                              background: active ? THEME.maroon2 : "#fff",
                              color: active ? "#fff" : THEME.tableText,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>


                    <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={pagerBtn(page === pageCount)}>
                      <IconChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Footer */}
        <div
          style={{
            background: THEME.maroon,
            color: "rgba(255,255,255,.92)",
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 18px",
            flex: "0 0 auto",
          }}
        >
          <span>© 2026 ABIC Realty & Consultancy Corporation</span>
          <span>All Rights Reserved</span>
        </div>
      </div>


      {/* MODAL */}
      {modalOpen && !isNoPermissionMode && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fadeIn"
            style={{
              width: "min(760px, 100%)",
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${THEME.cardBorder}`,
              boxShadow: "0 24px 90px rgba(0,0,0,.22)",
              overflow: "hidden",
              fontFamily: fontFamily(),
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: `1px solid ${THEME.cardBorder}`,
                background: THEME.tableHeaderBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 800, color: THEME.tableText }}>New Transaction</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.muted }}>
                  {activeAccount} · Available ₱{formatMoney(currentBalance)}
                </div>
              </div>


              <button
                type="button"
                onClick={closeModal}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: `1px solid ${THEME.cardBorder}`,
                  background: "#fff",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <IconX />
              </button>
            </div>


            <div style={{ padding: 14 }}>
              {step === 1 && (
                <>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.muted, marginBottom: 10 }}>
                    Choose transaction type
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <button type="button" onClick={() => { setTxType("deposit"); setStep(2); }} style={choiceBtn(true)}>
                      Deposit
                    </button>
                    <button type="button" onClick={() => { setTxType("withdrawal"); setStep(2); }} style={choiceBtn(false)}>
                      Withdrawal
                    </button>
                  </div>
                </>
              )}


              {step === 2 && (
                <>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <span style={tag()}>{txType === "deposit" ? "DEPOSIT" : "WITHDRAWAL"}</span>
                    <button type="button" onClick={() => setStep(1)} style={linkBtn()}>
                      ← Change
                    </button>
                  </div>


                  <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.muted, marginBottom: 10 }}>Choose mode</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <button type="button" onClick={() => choosePayMode("cash")} style={choiceBtn(true)}>
                      Cash
                    </button>
                    <button type="button" onClick={() => choosePayMode("check")} style={choiceBtn(false)}>
                      Check
                    </button>
                  </div>
                </>
              )}


              {step === 3 && (
                <>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <span style={tag()}>
                      {(txType === "deposit" ? "DEPOSIT" : "WITHDRAWAL") + " · " + (payMode === "cash" ? "CASH" : "CHECK")}
                    </span>
                    <button type="button" onClick={() => setStep(2)} style={linkBtn()}>
                      ← Change
                    </button>
                    {txType === "withdrawal" && (
                      <span style={{ ...tagSoft(), color: THEME.red, borderColor: "rgba(210,29,42,.25)" }}>
                        Rule: must be ≤ ₱{formatMoney(currentBalance)}
                      </span>
                    )}
                  </div>


                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <Field label="Voucher Date" readOnly value={form.voucherDate} />
                    <Field label="Voucher No." readOnly value={form.voucherNo} />


                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={label()}>CHEQUE/DEPOSIT SLIP/TRANSTYPE</label>
                      <input
                        value={form.transType}
                        onChange={(e) => setForm((p) => ({ ...p, transType: e.target.value }))}
                        placeholder="Enter last transaction number / reference..."
                        style={input()}
                      />
                    </div>


                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={label()}>Owner</label>
                      <select
                        value={form.owner}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            owner: e.target.value,
                            fundReferences: needsExtraFields(e.target.value) ? p.fundReferences : "",
                            personInCharge: needsExtraFields(e.target.value) ? p.personInCharge : "",
                          }))
                        }
                        style={input()}
                      >
                        {OWNER_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>


                    {needsExtraFields(form.owner) && (
                      <>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={label()}>Fund References</label>
                          <input
                            value={form.fundReferences}
                            onChange={(e) => setForm((p) => ({ ...p, fundReferences: e.target.value }))}
                            placeholder="Enter fund references..."
                            style={input()}
                          />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={label()}>Person in Charge</label>
                          <input
                            value={form.personInCharge}
                            onChange={(e) => setForm((p) => ({ ...p, personInCharge: e.target.value }))}
                            placeholder="Enter person in charge..."
                            style={input()}
                          />
                        </div>
                      </>
                    )}


                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={label()}>Particulars</label>
                      <input
                        value={form.particulars}
                        onChange={(e) => setForm((p) => ({ ...p, particulars: e.target.value }))}
                        placeholder="Enter particulars..."
                        style={input()}
                      />
                    </div>


                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={label()}>{txType === "deposit" ? "Deposit Amount" : "Withdrawal Amount"}</label>
                      <input
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                        placeholder="0.00"
                        inputMode="decimal"
                        style={{ ...input(), textAlign: "right" as const }}
                      />
                    </div>
                  </div>


                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                    <button type="button" onClick={closeModal} style={btnGhost()}>
                      Cancel
                    </button>
                    <button type="button" onClick={submitTx} style={btnMaroon()}>
                      Submit
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}