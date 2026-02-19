"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Inbox, Plus, Eye, Banknote, ChevronDown } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type AccountStatus = "ACTIVE" | "INACTIVE" | "CLOSED";
type AccountType = "BANK" | "GCASH" | "CASH" | "INTERNAL";

type Owner = {
  id: number;
  name: string;
  owner_type: string;
  status: string;
};

type Bank = {
  id: number;
  name: string;
  short_name?: string | null;
  status: string;
};

type BankAccount = {
  id: number;
  owner_id: number;
  bank_id?: number | null;
  account_name: string;
  account_number?: string | null;
  account_holder: string;
  account_type: AccountType;
  opening_balance: number;
  opening_date: string;
  currency: string;
  status: AccountStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  owner?: Owner | null;
  bank?: Bank | null;
};

const BORDER = "rgba(0,0,0,0.12)";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not available";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString();
  } catch {
    return "Invalid date";
  }
};

const formatCurrency = (amount: number | null | undefined, currency: string = "PHP"): string => {
  if (amount === null || amount === undefined) return `₱0.00`;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const EyeIcon = (props: any) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Reusable Pagination Component
const Pagination = ({
  paginationMeta,
  currentPage,
  setCurrentPage,
  itemName = "items",
}: {
  paginationMeta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  itemName?: string;
}) => {
  if (!paginationMeta || paginationMeta.total === 0) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: BORDER }}>
      <div className="text-sm text-neutral-600">
        Showing {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} {itemName}
      </div>
      {paginationMeta.last_page > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={paginationMeta.current_page === 1}
            className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{ borderColor: BORDER }}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {[...Array(paginationMeta.last_page)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === paginationMeta.last_page || (page >= paginationMeta.current_page - 1 && page <= paginationMeta.current_page + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      paginationMeta.current_page === page ? "bg-[#7a0f1f] text-white" : "border hover:bg-gray-50"
                    }`}
                    style={paginationMeta.current_page !== page ? { borderColor: BORDER } : undefined}
                  >
                    {page}
                  </button>
                );
              } else if (page === paginationMeta.current_page - 2 || page === paginationMeta.current_page + 2) {
                return <span key={page} className="px-2 text-neutral-500">...</span>;
              }
              return null;
            })}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(paginationMeta.last_page, p + 1))}
            disabled={paginationMeta.current_page === paginationMeta.last_page}
            className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{ borderColor: BORDER }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Skeleton Components
const BankAccountCardSkeleton = () => (
  <div className="rounded-md bg-white border shadow-sm p-4" style={{ borderColor: BORDER }}>
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gray-200 rounded-md" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded" />
            <div className="h-3 bg-gray-200 w-1/2 rounded" />
          </div>
        </div>
        <div className="h-5 bg-gray-200 w-16 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 w-24 rounded" />
        <div className="h-8 bg-gray-200 w-20 rounded-md" />
      </div>
    </div>
  </div>
);

const BankAccountTableSkeleton = () => (
  <div>
    <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 shrink-0"></div>
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2 text-sm font-bold text-neutral-900">
            <div>Account Name</div>
            <div>Owner</div>
            <div>Bank</div>
            <div>Account Number</div>
            <div>Type</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-sm font-bold text-neutral-900 w-24">Balance</div>
          <div className="text-sm font-bold text-neutral-900 w-20">Status</div>
          <div className="w-20"></div>
        </div>
      </div>
    </div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-md bg-white border shadow-sm p-4" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse" />
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j}>
                    <div className="h-4 bg-gray-200 w-3/4 mb-1 animate-pulse rounded" />
                    <div className="h-3 bg-gray-200 w-16 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-4 bg-gray-200 w-20 animate-pulse rounded" />
              <div className="h-8 bg-gray-200 w-16 animate-pulse rounded-md" />
              <div className="h-8 bg-gray-200 w-20 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BankAccountDetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function BankAccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get initial values from URL params or defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE">((searchParams.get("status") as "ACTIVE" | "INACTIVE") || "ACTIVE");
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType | "ALL">((searchParams.get("account_type") as AccountType | "ALL") || "ALL");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [sortBy, setSortBy] = useState<"date" | "name">((searchParams.get("sort_by") as "date" | "name") || "date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sort_order") as "asc" | "desc") || "desc");
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successTitle, setSuccessTitle] = useState("");
  const [showCreateLoading, setShowCreateLoading] = useState(false);
  const [showCreateFail, setShowCreateFail] = useState(false);
  const [createFailMessage, setCreateFailMessage] = useState("");
  const [failTitle, setFailTitle] = useState("");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailDrawerClosing, setDetailDrawerClosing] = useState(false);
  const [detailAccount, setDetailAccount] = useState<BankAccount | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailFormData, setDetailFormData] = useState<Partial<BankAccount>>({});
  const [savingAccount, setSavingAccount] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [showCreateAccountConfirm, setShowCreateAccountConfirm] = useState(false);

  // Owners and Banks for dropdowns
  const [owners, setOwners] = useState<Owner[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const [formData, setFormData] = useState({
    owner_id: null as number | null,
    bank_id: null as number | null,
    account_name: "",
    account_number: "",
    account_holder: "",
    account_type: "BANK" as AccountType,
    opening_balance: "",
    opening_date: "",
    currency: "PHP",
    notes: "",
    status: "ACTIVE" as AccountStatus,
  });

  // Sync URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter) params.set("status", statusFilter);
    if (accountTypeFilter && accountTypeFilter !== "ALL") params.set("account_type", accountTypeFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (sortBy !== "date") params.set("sort_by", sortBy);
    if (sortOrder !== "desc") params.set("sort_order", sortOrder);
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, statusFilter, accountTypeFilter, currentPage, sortBy, sortOrder, router]);

  useEffect(() => {
    fetchBankAccounts();
  }, [searchQuery, statusFilter, accountTypeFilter, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchOwners();
    fetchBanks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, accountTypeFilter, searchQuery, sortBy, sortOrder]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/accountant/maintenance/bank-accounts", window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.append("search", searchQuery.trim());
      }
      if (statusFilter) {
        url.searchParams.append("status", statusFilter);
      }
      if (accountTypeFilter && accountTypeFilter !== "ALL") {
        url.searchParams.append("account_type", accountTypeFilter);
      }
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", "10");
      url.searchParams.append("sort_by", sortBy);
      url.searchParams.append("sort_order", sortOrder);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        const accountsList = data.data?.data || data.data || [];
        setBankAccounts(Array.isArray(accountsList) ? accountsList : []);
        
        // Extract pagination metadata
        if (data.data?.current_page !== undefined) {
          setPaginationMeta({
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            per_page: data.data.per_page,
            total: data.data.total,
            from: data.data.from,
            to: data.data.to,
          });
        } else {
          setPaginationMeta(null);
        }
      } else {
        setBankAccounts([]);
        setPaginationMeta(null);
      }
    } catch {
      setBankAccounts([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners?per_page=all&status=active");
      const data = await res.json();
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        setOwners(Array.isArray(ownersList) ? ownersList : []);
      } else {
        setOwners([]);
      }
    } catch {
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch("/api/accountant/maintenance/banks?per_page=all&status=ACTIVE");
      const data = await res.json();
      if (res.ok && data.success) {
        // When per_page=all, backend returns data.data as array directly
        const banksList = data.data?.data || data.data || [];
        setBanks(Array.isArray(banksList) ? banksList : []);
      } else {
        setBanks([]);
      }
    } catch {
      setBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const filteredOwners = useMemo(() => {
    if (!ownerSearchQuery.trim()) {
      return owners.filter(o => o.status === "active");
    }
    const q = ownerSearchQuery.toLowerCase();
    return owners.filter(
      (owner) =>
        owner.status === "active" &&
        (owner.name?.toLowerCase().includes(q) ||
          owner.owner_type?.toLowerCase().includes(q))
    );
  }, [owners, ownerSearchQuery]);

  const filteredBanks = useMemo(() => {
    if (!bankSearchQuery.trim()) {
      return banks.filter(b => b.status === "ACTIVE");
    }
    const q = bankSearchQuery.toLowerCase();
    return banks.filter(
      (bank) =>
        bank.status === "ACTIVE" &&
        (bank.name?.toLowerCase().includes(q) ||
          bank.short_name?.toLowerCase().includes(q))
    );
  }, [banks, bankSearchQuery]);


  const openDetailDrawer = async (accountId: number) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    setDetailLoadError(null);
    try {
      const res = await fetch(`/api/accountant/maintenance/bank-accounts/${accountId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setDetailAccount(data.data);
        setDetailFormData(data.data);
        // Set search queries for dropdowns
        if (data.data.owner) {
          setOwnerSearchQuery(data.data.owner.name);
        }
        if (data.data.bank) {
          setBankSearchQuery(data.data.bank.name);
        }
      } else {
        setDetailLoadError(data.message || "Failed to load bank account details");
      }
    } catch (error) {
      setDetailLoadError("An error occurred while loading bank account details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true);
    setTimeout(() => {
      setDetailDrawerOpen(false);
      setDetailDrawerClosing(false);
      setDetailAccount(null);
      setDetailFormData({});
      setDetailEditing(false);
      setDetailLoadError(null);
      setOwnerSearchQuery("");
      setBankSearchQuery("");
      setShowOwnerDropdown(false);
      setShowBankDropdown(false);
    }, 350);
  };

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreatePanel(false);
      setCreatePanelClosing(false);
      setFormData({
        owner_id: null,
        bank_id: null,
        account_name: "",
        account_number: "",
        account_holder: "",
        account_type: "BANK",
        opening_balance: "",
        opening_date: "",
        currency: "PHP",
        notes: "",
        status: "ACTIVE",
      });
      setOwnerSearchQuery("");
      setBankSearchQuery("");
      setShowOwnerDropdown(false);
      setShowBankDropdown(false);
    }, 350);
  };

  const handleCreateAccountConfirm = () => {
    setShowCreateAccountConfirm(false);
    handleCreateAccount();
  };

  const handleCreateAccount = async () => {
    if (!formData.owner_id) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Owner is required");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.bank_id) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Bank is required for BANK account type");
      setShowCreateFail(true);
      return;
    }

    if (!formData.account_name.trim() || !formData.account_holder.trim() || !formData.opening_date.trim()) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Please fill in all required fields");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.account_number.trim()) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Account number is required for BANK account type");
      setShowCreateFail(true);
      return;
    }

    setShowCreateLoading(true);
    try {
      const body: any = {
        owner_id: formData.owner_id,
        account_name: formData.account_name.trim(),
        account_holder: formData.account_holder.trim(),
        account_type: formData.account_type,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        opening_date: formData.opening_date,
        currency: formData.currency,
        status: formData.status,
      };

      if (formData.account_type === "BANK") {
        body.bank_id = formData.bank_id;
        body.account_number = formData.account_number.trim();
      } else {
        body.account_number = formData.account_number.trim() || null;
      }

      if (formData.notes.trim()) {
        body.notes = formData.notes.trim();
      }

      const res = await fetch("/api/accountant/maintenance/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBankAccounts();
        closeCreatePanel();
        setSuccessTitle("Bank Account Created Successfully");
        setSuccessMessage("The bank account has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Bank Account");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create bank account";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating bank account:", error);
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("An error occurred while creating the bank account");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  const handleSaveAccount = async (formData: Partial<BankAccount>) => {
    if (!detailAccount?.id) return;
    
    if (!formData.owner_id) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Owner is required");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.bank_id) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Bank is required for BANK account type");
      setShowCreateFail(true);
      return;
    }

    if (!formData.account_name?.trim() || !formData.account_holder?.trim() || !formData.opening_date) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Please fill in all required fields");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.account_number?.trim()) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Account number is required for BANK account type");
      setShowCreateFail(true);
      return;
    }
    
    setSavingAccount(true);
    setShowSaveLoading(true);
    try {
      const body: any = {
        owner_id: formData.owner_id,
        account_name: formData.account_name.trim(),
        account_holder: formData.account_holder.trim(),
        account_type: formData.account_type,
        opening_balance: formData.opening_balance || 0,
        opening_date: formData.opening_date,
        currency: formData.currency || "PHP",
        status: formData.status,
      };

      if (formData.account_type === "BANK") {
        body.bank_id = formData.bank_id;
        body.account_number = formData.account_number?.trim();
      } else {
        body.bank_id = null;
        body.account_number = formData.account_number?.trim() || null;
      }

      if (formData.notes?.trim()) {
        body.notes = formData.notes.trim();
      }

      const res = await fetch(`/api/accountant/maintenance/bank-accounts/${detailAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDetailAccount((prev) => (prev ? { ...prev, ...data.data } : null));
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}));
        setDetailEditing(false);
        await fetchBankAccounts();
        setSuccessTitle("Bank Account Updated Successfully");
        setSuccessMessage("The bank account has been updated successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Update Bank Account");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to update bank account";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("An error occurred while updating the bank account");
      setShowCreateFail(true);
    } finally {
      setSavingAccount(false);
      setShowSaveLoading(false);
    }
  };

  // Update owner search query when owner_id changes
  useEffect(() => {
    if (formData.owner_id && owners.length > 0) {
      const selectedOwner = owners.find(o => o.id === formData.owner_id);
      if (selectedOwner && ownerSearchQuery !== selectedOwner.name) {
        setOwnerSearchQuery(selectedOwner.name);
      }
    } else if (!formData.owner_id && ownerSearchQuery && showCreatePanel) {
      setOwnerSearchQuery("");
    }
  }, [formData.owner_id, owners]);

  // Update bank search query when bank_id changes
  useEffect(() => {
    if (formData.bank_id && banks.length > 0) {
      const selectedBank = banks.find(b => b.id === formData.bank_id);
      if (selectedBank && bankSearchQuery !== selectedBank.name) {
        setBankSearchQuery(selectedBank.name);
      }
    } else if (!formData.bank_id && bankSearchQuery && showCreatePanel) {
      setBankSearchQuery("");
    }
  }, [formData.bank_id, banks]);

  // Update owner search query in detail drawer
  useEffect(() => {
    if (detailFormData.owner_id && owners.length > 0 && detailDrawerOpen) {
      const selectedOwner = owners.find(o => o.id === detailFormData.owner_id);
      if (selectedOwner && ownerSearchQuery !== selectedOwner.name) {
        setOwnerSearchQuery(selectedOwner.name);
      }
    }
  }, [detailFormData.owner_id, owners, detailDrawerOpen]);

  // Update bank search query in detail drawer
  useEffect(() => {
    if (detailFormData.bank_id && banks.length > 0 && detailDrawerOpen) {
      const selectedBank = banks.find(b => b.id === detailFormData.bank_id);
      if (selectedBank && bankSearchQuery !== selectedBank.name) {
        setBankSearchQuery(selectedBank.name);
      }
    } else if (!detailFormData.bank_id && bankSearchQuery && detailDrawerOpen) {
      setBankSearchQuery("");
    }
  }, [detailFormData.bank_id, banks, detailDrawerOpen]);

  return (
    <div className="min-h-full flex flex-col">
      {/* Compact Bank Accounts bar - extension of sidebar */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Bank Accounts</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Bank Account List</h2>
              <p className="text-sm text-gray-600 mt-1">Manage bank accounts and their opening balances</p>
            </div>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Plus className="w-4 h-4" />
              Create Bank Account
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "ACTIVE"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter !== "ACTIVE" ? { borderColor: BORDER } : undefined}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "INACTIVE"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter !== "INACTIVE" ? { borderColor: BORDER } : undefined}
              >
                Inactive
              </button>
              <span className="text-sm font-medium text-gray-700 ml-2">Type:</span>
              <button
                onClick={() => setAccountTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  accountTypeFilter === "ALL"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={accountTypeFilter !== "ALL" ? { borderColor: BORDER } : undefined}
              >
                All
              </button>
              <button
                onClick={() => setAccountTypeFilter("BANK")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  accountTypeFilter === "BANK"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={accountTypeFilter !== "BANK" ? { borderColor: BORDER } : undefined}
              >
                Bank
              </button>
              <button
                onClick={() => setAccountTypeFilter("GCASH")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  accountTypeFilter === "GCASH"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={accountTypeFilter !== "GCASH" ? { borderColor: BORDER } : undefined}
              >
                GCash
              </button>
              <button
                onClick={() => setAccountTypeFilter("CASH")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  accountTypeFilter === "CASH"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={accountTypeFilter !== "CASH" ? { borderColor: BORDER } : undefined}
              >
                Cash
              </button>
              <button
                onClick={() => setAccountTypeFilter("INTERNAL")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  accountTypeFilter === "INTERNAL"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={accountTypeFilter !== "INTERNAL" ? { borderColor: BORDER } : undefined}
              >
                Internal
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchBankAccounts()}
                className="p-2 rounded-md border hover:bg-gray-50 transition-colors"
                style={{ borderColor: BORDER }}
                title="Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by account name, number, holder..."
                  className="w-full rounded-md border bg-white px-10 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="appearance-none rounded-md border bg-white px-4 py-2 pr-8 text-sm outline-none cursor-pointer hover:bg-gray-50"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                >
                  <option value="date-desc">Date Promoted (Newest First)</option>
                  <option value="date-asc">Date Promoted (Oldest First)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pagination at the top */}
          {paginationMeta && (
            <Pagination
              paginationMeta={paginationMeta}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemName="accounts"
            />
          )}

          <div className="mt-4">
            {loading ? (
              <BankAccountTableSkeleton />
            ) : bankAccounts.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a bank account or adjust your search.</div>
              </div>
            ) : (
              <div>
                <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 shrink-0"></div>
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2 text-sm font-bold text-neutral-900">
                        <div>Account Name</div>
                        <div>Owner</div>
                        <div>Bank</div>
                        <div>Account Number</div>
                        <div>Type</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-sm font-bold text-neutral-900 w-24">Balance</div>
                      <div className="text-sm font-bold text-neutral-900 w-20">Status</div>
                      <div className="w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center shrink-0">
                            <Banknote className="w-6 h-6 text-[#7a0f1f]" />
                          </div>
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 truncate">{account.account_name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Account Name</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.owner?.name || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Owner</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.bank?.name || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Bank</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.account_number || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Account Number</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.account_type}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Type</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-sm text-neutral-900 font-semibold w-24 text-right">{formatCurrency(account.opening_balance, account.currency)}</div>
                          <div
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                              account.status === "ACTIVE" ? "bg-green-100 text-green-700" : 
                              account.status === "CLOSED" ? "bg-red-100 text-red-700" : 
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {account.status}
                          </div>
                          <button
                            onClick={() => openDetailDrawer(account.id)}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                            style={{ background: "#7a0f1f", height: 32 }}
                            title="View"
                          >
                            <EyeIcon />
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

        {/* Create Panel - Full Height Side Panel */}
        {(showCreatePanel || createPanelClosing) && (
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
                createPanelClosing ? "opacity-0" : "opacity-100"
              }`}
              onClick={closeCreatePanel}
              aria-hidden="true"
            />
            <div
              className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
              style={{
                animation: createPanelClosing
                  ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                  : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                <h2 className="text-lg font-bold">Create Bank Account</h2>
                <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Owner <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                        <input
                          type="text"
                          value={ownerSearchQuery}
                          onChange={(e) => {
                            setOwnerSearchQuery(e.target.value);
                            setShowOwnerDropdown(true);
                          }}
                          onFocus={() => setShowOwnerDropdown(true)}
                          className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                          placeholder="Search owners..."
                        />
                        {formData.owner_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, owner_id: null });
                              setOwnerSearchQuery("");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {showOwnerDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowOwnerDropdown(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                            {loadingOwners ? (
                              <div className="p-4 text-center text-sm text-gray-500">Loading owners...</div>
                            ) : filteredOwners.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500">No owners found</div>
                            ) : (
                              filteredOwners.map((owner) => (
                                <button
                                  key={owner.id}
                                  onClick={() => {
                                    setFormData({ ...formData, owner_id: owner.id });
                                    setOwnerSearchQuery(owner.name);
                                    setShowOwnerDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b ${
                                    formData.owner_id === owner.id ? "bg-gray-50" : ""
                                  }`}
                                  style={{ borderColor: BORDER }}
                                >
                                  <div className="font-medium">{owner.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{owner.owner_type}</div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.account_type}
                      onChange={(e) => {
                        const newType = e.target.value as AccountType;
                        setFormData({ 
                          ...formData, 
                          account_type: newType,
                          bank_id: newType !== "BANK" ? null : formData.bank_id,
                          account_number: newType !== "BANK" ? "" : formData.account_number,
                        });
                      }}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="BANK">Bank</option>
                      <option value="GCASH">GCash</option>
                      <option value="CASH">Cash</option>
                      <option value="INTERNAL">Internal</option>
                    </select>
                  </div>

                  {formData.account_type === "BANK" && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        Bank <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                          <input
                            type="text"
                            value={bankSearchQuery}
                            onChange={(e) => {
                              setBankSearchQuery(e.target.value);
                              setShowBankDropdown(true);
                            }}
                            onFocus={() => setShowBankDropdown(true)}
                            className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                            placeholder="Search banks..."
                          />
                          {formData.bank_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({ ...formData, bank_id: null });
                                setBankSearchQuery("");
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {showBankDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowBankDropdown(false)}
                            />
                            <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                              {loadingBanks ? (
                                <div className="p-4 text-center text-sm text-gray-500">Loading banks...</div>
                              ) : filteredBanks.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No banks found</div>
                              ) : (
                                filteredBanks.map((bank) => (
                                  <button
                                    key={bank.id}
                                    onClick={() => {
                                      setFormData({ ...formData, bank_id: bank.id });
                                      setBankSearchQuery(bank.name);
                                      setShowBankDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b ${
                                      formData.bank_id === bank.id ? "bg-gray-50" : ""
                                    }`}
                                    style={{ borderColor: BORDER }}
                                  >
                                    <div className="font-medium">{bank.name}</div>
                                    {bank.short_name && <div className="text-xs text-gray-500 mt-0.5">{bank.short_name}</div>}
                                  </button>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="e.g., SCB 483 Account"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Number {formData.account_type === "BANK" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder={formData.account_type === "BANK" ? "e.g., 1234567890" : "Optional"}
                      required={formData.account_type === "BANK"}
                    />
                    {formData.account_type === "BANK" && (
                      <p className="text-xs text-gray-500 mt-1">Stored as text to preserve leading zeros</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Holder <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.account_holder}
                      onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="e.g., ABIC Realty & Consultancy Corp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Opening Balance <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.opening_balance}
                      onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Will be converted to opening balance voucher entry</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Opening Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.opening_date}
                      onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Used as voucher date for opening entry</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="PHP">PHP - Philippine Peso</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="Optional description or notes"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
                <button
                  onClick={closeCreatePanel}
                  className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                  style={{ borderColor: BORDER }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateAccountConfirm(true)}
                  disabled={showCreateLoading || !formData.owner_id || (formData.account_type === "BANK" && !formData.bank_id)}
                  className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#7a0f1f" }}
                >
                  {showCreateLoading ? "Creating..." : "Create Bank Account"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Detail Drawer */}
        {(detailDrawerOpen || detailDrawerClosing) && (
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
                detailDrawerClosing ? "opacity-0" : "opacity-100"
              }`}
              onClick={closeDetailDrawer}
              aria-hidden="true"
            />
            <div
              className="fixed top-0 right-0 bottom-0 w-full max-w-4xl h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
              style={{
                animation: detailDrawerClosing
                  ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                  : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{detailAccount ? detailAccount.account_name : loadingDetail ? "Loading..." : "Bank Account Details"}</h2>
                    {detailAccount?.owner && <p className="text-sm text-white/90 mt-0.5">{detailAccount.owner.name}</p>}
                  </div>
                  {detailAccount && (
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        detailAccount.status === "ACTIVE" ? "bg-green-100 text-green-700" : 
                        detailAccount.status === "CLOSED" ? "bg-red-100 text-red-700" : 
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detailAccount.status}
                    </div>
                  )}
                </div>
                <button onClick={closeDetailDrawer} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {loadingDetail ? (
                  <div className="flex-1 overflow-y-auto p-6">
                    <BankAccountDetailSkeleton />
                  </div>
                ) : !detailAccount ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load bank account details.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                              <input
                                type="text"
                                value={ownerSearchQuery}
                                onChange={(e) => {
                                  setOwnerSearchQuery(e.target.value);
                                  setShowOwnerDropdown(true);
                                }}
                                onFocus={() => setShowOwnerDropdown(true)}
                                className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                                style={{ borderColor: BORDER }}
                                placeholder="Search owners..."
                              />
                              {detailFormData.owner_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailFormData({ ...detailFormData, owner_id: undefined });
                                    setOwnerSearchQuery("");
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {showOwnerDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowOwnerDropdown(false)}
                                />
                                <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                                  {loadingOwners ? (
                                    <div className="p-4 text-center text-sm text-gray-500">Loading owners...</div>
                                  ) : filteredOwners.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No owners found</div>
                                  ) : (
                                    filteredOwners.map((owner) => (
                                      <button
                                        key={owner.id}
                                        onClick={() => {
                                          setDetailFormData({ ...detailFormData, owner_id: owner.id });
                                          setOwnerSearchQuery(owner.name);
                                          setShowOwnerDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b ${
                                          detailFormData.owner_id === owner.id ? "bg-gray-50" : ""
                                        }`}
                                        style={{ borderColor: BORDER }}
                                      >
                                        <div className="font-medium">{owner.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{owner.owner_type}</div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.owner?.name || "—"}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Type <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <select
                            value={detailFormData.account_type || "BANK"}
                            onChange={(e) => {
                              const newType = e.target.value as AccountType;
                              setDetailFormData({ 
                                ...detailFormData, 
                                account_type: newType,
                                bank_id: newType !== "BANK" ? null : detailFormData.bank_id,
                                account_number: newType !== "BANK" ? null : detailFormData.account_number,
                              });
                            }}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          >
                            <option value="BANK">Bank</option>
                            <option value="GCASH">GCash</option>
                            <option value="CASH">Cash</option>
                            <option value="INTERNAL">Internal</option>
                          </select>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.account_type}</div>
                        )}
                      </div>

                      {detailEditing && detailFormData.account_type === "BANK" && (
                        <div className="relative">
                          <label className="block text-sm font-medium text-neutral-900 mb-2">
                            Bank <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                              <input
                                type="text"
                                value={bankSearchQuery}
                                onChange={(e) => {
                                  setBankSearchQuery(e.target.value);
                                  setShowBankDropdown(true);
                                }}
                                onFocus={() => setShowBankDropdown(true)}
                                className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                                style={{ borderColor: BORDER }}
                                placeholder="Search banks..."
                              />
                              {detailFormData.bank_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailFormData({ ...detailFormData, bank_id: null });
                                    setBankSearchQuery("");
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {showBankDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowBankDropdown(false)}
                                />
                                <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                                  {loadingBanks ? (
                                    <div className="p-4 text-center text-sm text-gray-500">Loading banks...</div>
                                  ) : filteredBanks.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No banks found</div>
                                  ) : (
                                    filteredBanks.map((bank) => (
                                      <button
                                        key={bank.id}
                                        onClick={() => {
                                          setDetailFormData({ ...detailFormData, bank_id: bank.id });
                                          setBankSearchQuery(bank.name);
                                          setShowBankDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b ${
                                          detailFormData.bank_id === bank.id ? "bg-gray-50" : ""
                                        }`}
                                        style={{ borderColor: BORDER }}
                                      >
                                        <div className="font-medium">{bank.name}</div>
                                        {bank.short_name && <div className="text-xs text-gray-500 mt-0.5">{bank.short_name}</div>}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {!detailEditing && detailAccount.account_type === "BANK" && (
                        <div>
                          <label className="block text-sm font-medium text-neutral-900 mb-2">Bank</label>
                          <div className="text-sm text-neutral-900">{detailAccount.bank?.name || "—"}</div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Name <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <input
                            type="text"
                            value={detailFormData.account_name || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, account_name: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.account_name}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Number {detailAccount.account_type === "BANK" && <span className="text-red-500">*</span>}
                        </label>
                        {detailEditing ? (
                          <input
                            type="text"
                            value={detailFormData.account_number || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, account_number: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                            placeholder={detailFormData.account_type === "BANK" ? "Required" : "Optional"}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.account_number || "—"}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Holder <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <input
                            type="text"
                            value={detailFormData.account_holder || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, account_holder: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.account_holder}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Opening Balance <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={detailFormData.opening_balance || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, opening_balance: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{formatCurrency(detailAccount.opening_balance, detailAccount.currency)}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Opening Date <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <input
                            type="date"
                            value={detailFormData.opening_date ? new Date(detailFormData.opening_date).toISOString().split("T")[0] : ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, opening_date: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{formatDate(detailAccount.opening_date)}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Currency <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <select
                            value={detailFormData.currency || "PHP"}
                            onChange={(e) => setDetailFormData({ ...detailFormData, currency: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          >
                            <option value="PHP">PHP - Philippine Peso</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                          </select>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.currency}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Status <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <select
                            value={detailFormData.status || "ACTIVE"}
                            onChange={(e) => setDetailFormData({ ...detailFormData, status: e.target.value as AccountStatus })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.status}</div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                        {detailEditing ? (
                          <textarea
                            value={detailFormData.notes || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, notes: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                            rows={3}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{detailAccount.notes || "—"}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {detailAccount && (
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
                  {detailEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setDetailEditing(false);
                          setDetailFormData(detailAccount);
                          setOwnerSearchQuery(detailAccount.owner?.name || "");
                          setBankSearchQuery(detailAccount.bank?.name || "");
                        }}
                        className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                        style={{ borderColor: BORDER }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveAccount(detailFormData)}
                        disabled={savingAccount || !detailFormData.owner_id || (detailFormData.account_type === "BANK" && !detailFormData.bank_id)}
                        className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60"
                        style={{ background: "#7a0f1f" }}
                      >
                        {savingAccount ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setDetailFormData({ ...detailAccount });
                          setDetailEditing(true);
                        }}
                        className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                        style={{ borderColor: "#7a0f1f", color: "#7a0f1f" }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateSuccess && (
        <SuccessModal
          isOpen={showCreateSuccess}
          onClose={() => {
            setShowCreateSuccess(false);
            setSuccessMessage("");
            setSuccessTitle("");
          }}
          title={successTitle || "Success"}
          message={successMessage || "Operation completed successfully."}
          buttonText="OK"
        />
      )}

      {showCreateLoading && (
        <LoadingModal 
          isOpen={showCreateLoading} 
          title="Creating Bank Account" 
          message="Please wait while we create the bank account..." 
        />
      )}

      {showSaveLoading && (
        <LoadingModal 
          isOpen={showSaveLoading} 
          title="Updating Bank Account" 
          message="Please wait while we update the bank account..." 
        />
      )}

      {showCreateFail && (
        <FailModal
          isOpen={showCreateFail}
          onClose={() => {
            setShowCreateFail(false);
            setCreateFailMessage("");
            setFailTitle("");
          }}
          title={failTitle || "Operation Failed"}
          message={createFailMessage || "An error occurred. Please try again."}
          buttonText="OK"
        />
      )}

      {detailLoadError && (
        <FailModal
          isOpen={!!detailLoadError}
          onClose={() => {
            setDetailLoadError(null);
            closeDetailDrawer();
          }}
          title="Failed to Load Bank Account"
          message={detailLoadError}
          buttonText="Close"
        />
      )}

      <ConfirmationModal
        isOpen={showCreateAccountConfirm}
        onClose={() => setShowCreateAccountConfirm(false)}
        onConfirm={handleCreateAccountConfirm}
        title="Create Bank Account"
        message={`Are you sure you want to create the bank account "${formData.account_name.trim()}"?`}
        confirmText="Create"
        isLoading={showCreateLoading}
      />

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
    </div>
  );
}
