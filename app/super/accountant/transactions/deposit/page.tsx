"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Upload, Info, Eye, Trash2, FileImage, Plus, FileText } from "lucide-react";

const BORDER = "rgba(0,0,0,0.12)";

type TransactionType =
  | "CHEQUE"
  | "DEPOSIT_SLIP"
  | "CASH"
  | "INTERNAL";

type Owner = {
  id: number;
  name: string;
  owner_type: string;
  status: string;
};

type BankAccount = {
  id: number;
  owner_id: number;
  account_name: string;
  account_number?: string | null;
  account_holder: string;
  account_type: string;
  status: string;
  owner?: Owner | null;
};

type Unit = {
  id: number;
  unit_name: string;
  owner_id: number;
  property_id?: number | null;
  status: string;
};

export default function DepositPage() {
  const [voucherMode, setVoucherMode] = useState<"WITH_VOUCHER" | "NO_VOUCHER">("WITH_VOUCHER");
  
  const [formData, setFormData] = useState({
    voucher_date: "",
    voucher_no: "",
    transaction_type: "CASH" as TransactionType,
    cash_internal_type: "",
    main_bank_account_id: null as number | null,
    recipient_bank_account_id: null as number | null,
    unit_id: null as number | null,
    particulars: "",
    amount: "",
  });

  const [mainBankAccounts, setMainBankAccounts] = useState<BankAccount[]>([]);
  const [recipientBankAccounts, setRecipientBankAccounts] = useState<BankAccount[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [mainBankAccountSearchQuery, setMainBankAccountSearchQuery] = useState("");
  const [recipientBankAccountSearchQuery, setRecipientBankAccountSearchQuery] = useState("");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [showMainBankAccountDropdown, setShowMainBankAccountDropdown] = useState(false);
  const [showRecipientBankAccountDropdown, setShowRecipientBankAccountDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [loadingMainBankAccounts, setLoadingMainBankAccounts] = useState(false);
  const [loadingRecipientBankAccounts, setLoadingRecipientBankAccounts] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  /* ================= FILTERS ================= */

  const filteredMainBankAccounts = useMemo(() => {
    if (!mainBankAccountSearchQuery.trim()) {
      return mainBankAccounts.filter((acc) => acc.status === "ACTIVE");
    }
    const q = mainBankAccountSearchQuery.toLowerCase();
    return mainBankAccounts.filter(
      (acc) =>
        acc.status === "ACTIVE" &&
        (acc.account_name?.toLowerCase().includes(q) ||
          acc.account_holder?.toLowerCase().includes(q) ||
          acc.account_number?.toLowerCase().includes(q) ||
          acc.owner?.name?.toLowerCase().includes(q))
    );
  }, [mainBankAccounts, mainBankAccountSearchQuery]);

  const filteredRecipientBankAccounts = useMemo(() => {
    if (!recipientBankAccountSearchQuery.trim()) {
      return recipientBankAccounts.filter((acc) => acc.status === "ACTIVE");
    }
    const q = recipientBankAccountSearchQuery.toLowerCase();
    return recipientBankAccounts.filter(
      (acc) =>
        acc.status === "ACTIVE" &&
        (acc.account_name?.toLowerCase().includes(q) ||
          acc.account_holder?.toLowerCase().includes(q) ||
          acc.account_number?.toLowerCase().includes(q) ||
          acc.owner?.name?.toLowerCase().includes(q))
    );
  }, [recipientBankAccounts, recipientBankAccountSearchQuery]);

  const filteredUnits = useMemo(() => {
    const selectedBankAccount = recipientBankAccounts.find(acc => acc.id === formData.recipient_bank_account_id);
    if (!selectedBankAccount) return [];
    
    const ownerId = selectedBankAccount.owner_id || selectedBankAccount.owner?.id;
    if (!ownerId) return [];
    
    let filtered = units.filter(
      (u) =>
        (u.owner_id === ownerId || u.owner_id === selectedBankAccount.owner_id) &&
        u.status === "ACTIVE"
    );
    
    // Apply search filter
    if (unitSearchQuery.trim()) {
      const q = unitSearchQuery.toLowerCase();
      filtered = filtered.filter((u) => u.unit_name?.toLowerCase().includes(q));
    }
    
    return filtered;
  }, [units, formData.recipient_bank_account_id, recipientBankAccounts, unitSearchQuery]);

  /* ================= API FETCHING ================= */

  const fetchMainBankAccounts = async () => {
    setLoadingMainBankAccounts(true);
    try {
      // Fetch bank accounts where owner type is MAIN
      const res = await fetch("/api/accountant/maintenance/bank-accounts?status=ACTIVE&per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const accountsList = data.data?.data || data.data || [];
        // Filter to only include accounts where owner type is MAIN
        const mainAccounts = Array.isArray(accountsList) 
          ? accountsList.filter((acc: BankAccount) => acc.owner?.owner_type === "MAIN")
          : [];
        setMainBankAccounts(mainAccounts);
      } else {
        setMainBankAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching main bank accounts:", error);
      setMainBankAccounts([]);
    } finally {
      setLoadingMainBankAccounts(false);
    }
  };

  const fetchRecipientBankAccounts = async (mainAccountId?: number | null) => {
    setLoadingRecipientBankAccounts(true);
    try {
      // Fetch all active bank accounts
      const res = await fetch("/api/accountant/maintenance/bank-accounts?status=ACTIVE&per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const accountsList = data.data?.data || data.data || [];
        let filteredAccounts = Array.isArray(accountsList) ? accountsList : [];
        
        if (mainAccountId) {
          // Fetch the main account details to check owner type
          const mainAccountRes = await fetch(`/api/accountant/maintenance/bank-accounts/${mainAccountId}`);
          const mainAccountData = await mainAccountRes.json();
          if (mainAccountRes.ok && mainAccountData.success && mainAccountData.data?.owner?.owner_type === "MAIN") {
            // Exclude accounts where owner type is MAIN (prevent main-to-main transactions)
            filteredAccounts = filteredAccounts.filter((acc: BankAccount) => acc.owner?.owner_type !== "MAIN");
          }
          // Also exclude the selected main account itself
          filteredAccounts = filteredAccounts.filter((acc: BankAccount) => acc.id !== mainAccountId);
        }
        
        setRecipientBankAccounts(filteredAccounts);
      } else {
        setRecipientBankAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching recipient bank accounts:", error);
      setRecipientBankAccounts([]);
    } finally {
      setLoadingRecipientBankAccounts(false);
    }
  };

  const fetchUnits = async (ownerId: number) => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/units?owner_id=${ownerId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        // Handle both array response and paginated response
        const unitsList = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        setUnits(unitsList);
      } else {
        console.error("Failed to fetch units:", data);
        setUnits([]);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  useEffect(() => {
    fetchMainBankAccounts();
    fetchRecipientBankAccounts();
  }, []);

  useEffect(() => {
    fetchRecipientBankAccounts(formData.main_bank_account_id);
  }, [formData.main_bank_account_id]);

  useEffect(() => {
    if (formData.recipient_bank_account_id) {
      const selectedBankAccount = recipientBankAccounts.find(acc => acc.id === formData.recipient_bank_account_id);
      
      if (!selectedBankAccount) {
        setUnits([]);
        setFormData((prev) => ({ ...prev, unit_id: null }));
        setUnitSearchQuery("");
        return;
      }

      // Try to get owner_id from the bank account object (could be owner_id directly or owner.id)
      const ownerId = selectedBankAccount.owner_id || selectedBankAccount.owner?.id;
      
      if (ownerId) {
        fetchUnits(ownerId);
      } else {
        // If owner_id is not available in the cached bank account, fetch full details
        const fetchBankAccountDetails = async () => {
          try {
            const res = await fetch(`/api/accountant/maintenance/bank-accounts/${formData.recipient_bank_account_id}`);
            const data = await res.json();
            if (res.ok && data.success && data.data) {
              const fetchedOwnerId = data.data.owner_id || data.data.owner?.id;
              if (fetchedOwnerId) {
                fetchUnits(fetchedOwnerId);
              } else {
                console.warn("Bank account has no owner_id:", data.data);
                setUnits([]);
                setFormData((prev) => ({ ...prev, unit_id: null }));
                setUnitSearchQuery("");
              }
            } else {
              console.error("Failed to fetch bank account details:", data);
              setUnits([]);
              setFormData((prev) => ({ ...prev, unit_id: null }));
              setUnitSearchQuery("");
            }
          } catch (error) {
            console.error("Error fetching bank account details:", error);
            setUnits([]);
            setFormData((prev) => ({ ...prev, unit_id: null }));
            setUnitSearchQuery("");
          }
        };
        fetchBankAccountDetails();
      }
    } else {
      setUnits([]);
      setFormData((prev) => ({ ...prev, unit_id: null }));
      setUnitSearchQuery("");
    }
  }, [formData.recipient_bank_account_id, recipientBankAccounts]);

  // Update main bank account search query when main_bank_account_id changes
  useEffect(() => {
    if (formData.main_bank_account_id && mainBankAccounts.length > 0) {
      const selectedAccount = mainBankAccounts.find(acc => acc.id === formData.main_bank_account_id);
      if (selectedAccount && mainBankAccountSearchQuery !== selectedAccount.account_name) {
        setMainBankAccountSearchQuery(selectedAccount.account_name);
      }
    } else if (!formData.main_bank_account_id) {
      setMainBankAccountSearchQuery("");
    }
  }, [formData.main_bank_account_id, mainBankAccounts]);

  // Update recipient bank account search query when recipient_bank_account_id changes
  useEffect(() => {
    if (formData.recipient_bank_account_id && recipientBankAccounts.length > 0) {
      const selectedAccount = recipientBankAccounts.find(acc => acc.id === formData.recipient_bank_account_id);
      if (selectedAccount && recipientBankAccountSearchQuery !== selectedAccount.account_name) {
        setRecipientBankAccountSearchQuery(selectedAccount.account_name);
      }
    } else if (!formData.recipient_bank_account_id) {
      setRecipientBankAccountSearchQuery("");
    }
  }, [formData.recipient_bank_account_id, recipientBankAccounts]);

  // Update unit search query when unit_id changes
  useEffect(() => {
    if (formData.unit_id && units.length > 0) {
      const selectedUnit = units.find(u => u.id === formData.unit_id);
      if (selectedUnit && unitSearchQuery !== selectedUnit.unit_name) {
        setUnitSearchQuery(selectedUnit.unit_name);
      }
    } else if (!formData.unit_id) {
      setUnitSearchQuery("");
    }
  }, [formData.unit_id, units]);

  /* ================= CONDITIONS ================= */

  const requiresFileUpload =
    formData.transaction_type === "CHEQUE" ||
    formData.transaction_type === "DEPOSIT_SLIP";

  const isCashOrInternal =
    formData.transaction_type === "CASH" ||
    formData.transaction_type === "INTERNAL";

  // Show attachments list when:
  // - Deposit Type = With Voucher (always show)
  // - OR Deposit Type = No Voucher AND Transaction Type is Cheque or Deposit Slip
  const shouldShowAttachments =
    voucherMode === "WITH_VOUCHER" ||
    (voucherMode === "NO_VOUCHER" && requiresFileUpload);

  // Show upload section when Transaction Type is Cheque or Deposit Slip
  const shouldShowUploadSection = requiresFileUpload;

  // Show Cash/Internal info only when:
  // - Deposit Type = No Voucher AND Transaction Type is Cash or Internal
  const shouldShowCashInternalInfo =
    voucherMode === "NO_VOUCHER" && isCashOrInternal;

  /* ================= CURRENCY ================= */

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "");
    const parts = numericValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1
      ? parts[0] + "." + parts[1].slice(0, 2)
      : parts[0];
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatCurrency(e.target.value);
    setFormData({ ...formData, amount: formatted });
  };

  /* ================= FILE UPLOAD ================= */

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) return;

    const newFiles = [...uploadedFiles, ...imageFiles];
    setUploadedFiles(newFiles);

    // Create previews for new files
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  const removeVoucherImage = () => {
    setVoucherFile(null);
    setVoucherPreview(null);
    setFormData((prev) => ({ ...prev, voucher_no: "" }));
  };

  /* ================= RESET ================= */

  const resetForm = () => {
    setFormData({
      voucher_date: "",
      voucher_no: "",
      transaction_type: "CASH",
      cash_internal_type: "",
      main_bank_account_id: null,
      recipient_bank_account_id: null,
      unit_id: null,
      particulars: "",
      amount: "",
    });
    setUploadedFiles([]);
    setFilePreviews([]);
    setMainBankAccountSearchQuery("");
    setRecipientBankAccountSearchQuery("");
    setUnits([]);
    setVoucherFile(null);
    setVoucherPreview(null);
    setVoucherMode("WITH_VOUCHER");
  };

  // File Preview Panel State
  const [showFilePreviewPanel, setShowFilePreviewPanel] = useState(false);
  const [filePreviewPanelClosing, setFilePreviewPanelClosing] = useState(false);
  const [previewingFileIndex, setPreviewingFileIndex] = useState<number | null>(null);

  // Voucher File (for voucher mode)
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);

  const closeFilePreviewPanel = () => {
    setFilePreviewPanelClosing(true);
    setTimeout(() => {
      setShowFilePreviewPanel(false);
      setFilePreviewPanelClosing(false);
      setPreviewingFileIndex(null);
    }, 350);
  };

  const openFilePreview = (index: number) => {
    setPreviewingFileIndex(index);
    setShowFilePreviewPanel(true);
  };
  
  const handleVoucherUpload = (file: File) => {
    setVoucherFile(file);
  
    // Auto-fill voucher number from filename (without extension)
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setFormData((prev) => ({
      ...prev,
      voucher_no: fileNameWithoutExt,
    }));
  
    const reader = new FileReader();
    reader.onloadend = () => {
      setVoucherPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-full flex flex-col">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5">
        <h1 className="text-lg font-semibold">
          New Deposit
        </h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section
          className="bg-white border shadow-sm rounded-md p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#5f0c18]">
              Create Deposit
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Record a new deposit transaction
            </p>
          </div>

          {/* Voucher Mode Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-900 mb-3">
              Deposit Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setVoucherMode("WITH_VOUCHER");
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  voucherMode === "WITH_VOUCHER"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={voucherMode !== "WITH_VOUCHER" ? { borderColor: BORDER } : undefined}
              >
                With Voucher
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoucherMode("NO_VOUCHER");
                  setFormData((prev) => ({ ...prev, voucher_date: "", voucher_no: "" }));
                  setVoucherFile(null);
                  setVoucherPreview(null);
                  // Clear attachments if switching to No Voucher with Cash/Internal transaction type
                  if (formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL") {
                    setUploadedFiles([]);
                    setFilePreviews([]);
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  voucherMode === "NO_VOUCHER"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={voucherMode !== "NO_VOUCHER" ? { borderColor: BORDER } : undefined}
              >
                No Voucher Deposit
              </button>
            </div>
            <div className="mt-4 border-b" style={{ borderColor: BORDER }}></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT SIDE */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Voucher Card - Conditionally Rendered */}
              {voucherMode === "WITH_VOUCHER" && (
                <div
                  className="rounded-md border p-6 bg-gray-50/40"
                  style={{ borderColor: BORDER }}
                >
                  <h3 className="text-sm font-semibold mb-6 uppercase tracking-wide text-gray-600">
                    Voucher Information
                  </h3>

                <div className="grid md:grid-cols-2 gap-6">

                  {/* Voucher Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Voucher Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.voucher_date}
                      onChange={(e) =>
                        setFormData({ ...formData, voucher_date: e.target.value })
                      }
                      className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                      style={{ borderColor: BORDER }}
                    />
                  </div>

                  {/* Voucher No with Upload/Preview Button */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Voucher No. <span className="text-red-500">*</span>
                    </label>

                    <div className="flex items-start gap-3">
                      {/* Voucher Input */}
                      <input
                        type="text"
                        value={formData.voucher_no}
                        readOnly={true}
                        className="flex-1 rounded-md border px-3 py-2 text-sm bg-gray-50"
                        style={{ borderColor: BORDER }}
                        placeholder={voucherFile ? "Auto-filled from uploaded image" : "Upload image to set voucher number"}
                      />

                      {/* Upload Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowFilePreviewPanel(true);
                          setPreviewingFileIndex(null);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition hover:opacity-95"
                        style={{ backgroundColor: "#7a0f1f" }}
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    </div>

                    {voucherFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded: {voucherFile.name}
                      </p>
                    )}
                  </div>

                </div>
              </div>
              )}

          {/* PAYMENT */}
          <div
            className="rounded-md border p-6"
            style={{ borderColor: BORDER }}
          >
            <h3 className="text-sm font-semibold mb-6 uppercase text-gray-600">
              Payment Details
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Transaction Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => {
                    const newType = e.target.value as TransactionType;
                    setFormData({ 
                      ...formData, 
                      transaction_type: newType,
                      cash_internal_type: "",
                    });

                    // Clear files if switching to Cash or Internal
                    if (newType === "CASH" || newType === "INTERNAL") {
                      setUploadedFiles([]);
                      setFilePreviews([]);
                    }
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  style={{ borderColor: BORDER }}
                >
                  <option value="CHEQUE">Cheque</option>
                  <option value="DEPOSIT_SLIP">Deposit Slip</option>
                  <option value="CASH">Cash</option>
                  <option value="INTERNAL">Internal</option>
                </select>
              </div>

              {/* Cash/Internal Type Field */}
              {isCashOrInternal && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    {formData.transaction_type === "CASH" ? "Cash" : "Internal"} Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cash_internal_type}
                    onChange={(e) => setFormData({ ...formData, cash_internal_type: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                    style={{ borderColor: BORDER }}
                    placeholder={formData.transaction_type === "CASH" ? "e.g., Bank Transfer, Over-the-Counter, etc." : "e.g., Internal Transfer, Adjustment, etc."}
                  />
                </div>
              )}

              {/* Add Attachments Section - Only for Cheque/Deposit Slip */}
              {shouldShowUploadSection && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Add Attachments
                  </label>
                  <div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md cursor-pointer hover:opacity-95 transition-opacity text-white"
                      style={{ backgroundColor: "#7a0f1f" }}
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formData.transaction_type === "CHEQUE" 
                          ? "Add Photo"
                          : "Add Attachment"}
                      </span>
                    </label>
                  </div>

                  {/* Display uploaded file names */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-600">Attached: </span>
                      <div className="inline-flex flex-wrap gap-2 mt-1">
                        {uploadedFiles.map((file, index) => {
                          // Remove file extension from name
                          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => openFilePreview(index)}
                              className="inline-block px-2 py-1 rounded-md bg-gray-100 border text-sm text-neutral-900 hover:bg-gray-200 cursor-pointer transition-colors"
                              style={{ borderColor: BORDER }}
                            >
                              {fileNameWithoutExt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Main Bank Account */}
              <div className="relative md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Main Bank Account <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search main bank account..."
                    value={mainBankAccountSearchQuery}
                    onChange={(e) => {
                      setMainBankAccountSearchQuery(e.target.value);
                      setShowMainBankAccountDropdown(true);
                    }}
                    onFocus={() => setShowMainBankAccountDropdown(true)}
                    className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                  />
                  {formData.main_bank_account_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, main_bank_account_id: null });
                        setMainBankAccountSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showMainBankAccountDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMainBankAccountDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                        {loadingMainBankAccounts ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading bank accounts...</div>
                        ) : filteredMainBankAccounts.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No bank accounts found</div>
                        ) : (
                          filteredMainBankAccounts.map((account) => (
                            <button
                              key={account.id}
                            onClick={() => {
                              setFormData({ ...formData, main_bank_account_id: account.id });
                              setMainBankAccountSearchQuery(account.account_name);
                              setShowMainBankAccountDropdown(false);
                            }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b ${
                                formData.main_bank_account_id === account.id ? "bg-gray-50" : ""
                              }`}
                              style={{ borderColor: BORDER }}
                            >
                              <div className="font-medium">{account.account_name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {account.owner?.name} • {account.account_type}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recipient Bank Account */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Recipient Bank Account <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search recipient bank account..."
                    value={recipientBankAccountSearchQuery}
                    onChange={(e) => {
                      setRecipientBankAccountSearchQuery(e.target.value);
                      setShowRecipientBankAccountDropdown(true);
                    }}
                    onFocus={() => setShowRecipientBankAccountDropdown(true)}
                    className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                  />
                  {formData.recipient_bank_account_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, recipient_bank_account_id: null, unit_id: null });
                        setRecipientBankAccountSearchQuery("");
                        setUnitSearchQuery("");
                        setUnits([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showRecipientBankAccountDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowRecipientBankAccountDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                        {loadingRecipientBankAccounts ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading bank accounts...</div>
                        ) : filteredRecipientBankAccounts.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No bank accounts found</div>
                        ) : (
                          filteredRecipientBankAccounts.map((account) => (
                            <button
                              key={account.id}
                              onClick={() => {
                                setFormData({ ...formData, recipient_bank_account_id: account.id, unit_id: null });
                                setRecipientBankAccountSearchQuery(account.account_name);
                                setUnitSearchQuery("");
                                setShowRecipientBankAccountDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b ${
                                formData.recipient_bank_account_id === account.id ? "bg-gray-50" : ""
                              }`}
                              style={{ borderColor: BORDER }}
                            >
                              <div className="font-medium">{account.account_name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {account.owner?.name} • {account.account_type}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Unit Searchable Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Unit <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={loadingUnits ? "Loading units..." : formData.recipient_bank_account_id ? "Search unit..." : "Select recipient bank account first"}
                    value={unitSearchQuery}
                    onChange={(e) => {
                      setUnitSearchQuery(e.target.value);
                      setShowUnitDropdown(true);
                    }}
                    onFocus={() => {
                      if (formData.recipient_bank_account_id && !loadingUnits) {
                        setShowUnitDropdown(true);
                      }
                    }}
                    disabled={!formData.recipient_bank_account_id || loadingUnits}
                    className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    style={{ borderColor: BORDER }}
                  />
                  {formData.unit_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, unit_id: null });
                        setUnitSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showUnitDropdown && formData.recipient_bank_account_id && !loadingUnits && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUnitDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                        {filteredUnits.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No units found</div>
                        ) : (
                          filteredUnits.map((unit) => (
                            <button
                              key={unit.id}
                              onClick={() => {
                                setFormData({ ...formData, unit_id: unit.id });
                                setUnitSearchQuery(unit.unit_name);
                                setShowUnitDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b ${
                                formData.unit_id === unit.id ? "bg-gray-50" : ""
                              }`}
                              style={{ borderColor: BORDER }}
                            >
                              <div className="font-medium">{unit.unit_name}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: BORDER }}
                />
              </div>
            </div>

            <textarea
              rows={4}
              placeholder="Particulars"
              value={formData.particulars}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  particulars: e.target.value,
                })
              }
              className="mt-6 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: BORDER }}
            />
          </div>
          </div> 

            {/* RIGHT SIDE */}
            <div className="space-y-6">
              
              {/* Uploaded Attachments Section - List Only (includes voucher file + uploaded files) */}
              {shouldShowAttachments && (uploadedFiles.length > 0 || voucherFile) && (
                <div
                  className="rounded-md border p-6"
                  style={{ borderColor: BORDER }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold uppercase text-gray-600">
                      Uploaded Attachments
                    </h3>
                    <span className="text-xs text-gray-500">
                      {(uploadedFiles.length + (voucherFile ? 1 : 0))} file{(uploadedFiles.length + (voucherFile ? 1 : 0)) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Voucher File */}
                    {voucherFile && (
                      <>
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Voucher
                          </p>
                        </div>
                        {(() => {
                          // Remove file extension from name
                          const voucherFileNameWithoutExt = voucherFile.name.replace(/\.[^/.]+$/, "");
                          return (
                            <div
                              className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                              style={{ borderColor: BORDER }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0" style={{ borderColor: BORDER }}>
                                  {voucherPreview && voucherPreview.trim() !== "" ? (
                                    <img
                                      src={voucherPreview}
                                      alt="Voucher Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FileText className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-neutral-900 truncate">{voucherFileNameWithoutExt}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewingFileIndex(-1);
                                      setShowFilePreviewPanel(true);
                                    }}
                                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                    title="Preview"
                                  >
                                    <Eye className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={removeVoucherImage}
                                    className="p-2 rounded-md hover:bg-red-50 transition-colors"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {/* Separator */}
                    {voucherFile && uploadedFiles.length > 0 && (
                      <div className="my-4 border-t" style={{ borderColor: BORDER }}></div>
                    )}

                    {/* Payment Attachments */}
                    {uploadedFiles.length > 0 && (
                      <>
                        {voucherFile && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Payment Attachments
                            </p>
                          </div>
                        )}
                        {uploadedFiles.map((file, index) => {
                          // Remove file extension from name
                          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                          return (
                            <div
                              key={index}
                              className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                              style={{ borderColor: BORDER }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0" style={{ borderColor: BORDER }}>
                                  {filePreviews[index] && filePreviews[index].trim() !== "" ? (
                                    <img
                                      src={filePreviews[index]}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FileText className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-neutral-900 truncate">{fileNameWithoutExt}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openFilePreview(index)}
                                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                    title="Preview"
                                  >
                                    <Eye className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="p-2 rounded-md hover:bg-red-50 transition-colors"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Cash/Internal Info */}
              {shouldShowCashInternalInfo && (
                <div
                  className="rounded-md border p-6"
                  style={{ borderColor: BORDER }}
                >
                  <h3 className="text-sm font-semibold mb-6 uppercase text-gray-600">
                    Transaction Info
                  </h3>
                  <div className="rounded-md bg-gray-50 border p-4 text-sm"
                       style={{ borderColor: BORDER }}>
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <p className="text-gray-600">
                        {formData.transaction_type === "CASH" 
                          ? "This is a cash deposit. No attachment required."
                          : "This is an internal transaction. No attachment required."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUMMARY */}
              <div
                className="rounded-lg border-2 sticky top-6 overflow-hidden"
                style={{ 
                  borderColor: "#7a0f1f",
                  boxShadow: "0 4px 6px -1px rgba(122, 15, 31, 0.1), 0 2px 4px -1px rgba(122, 15, 31, 0.06)"
                }}
              >
                {/* Header */}
                <div className="bg-[#7a0f1f] px-6 py-4">
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    Transaction Summary
                  </h3>
                </div>

                {/* Content */}
                <div className="bg-white p-6">
                  <div className="space-y-4">
                    {/* Deposit Type */}
                    <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deposit Type</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                        </span>
                      </div>
                    </div>

                    {/* Voucher Information (if applicable) */}
                    {voucherMode === "WITH_VOUCHER" && (
                      <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                        {formData.voucher_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Voucher Date</span>
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(formData.voucher_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                        {formData.voucher_no && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Voucher No.</span>
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {formData.voucher_no}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Transaction Type */}
                    <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Type</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formData.transaction_type === "CHEQUE" ? "Cheque" :
                           formData.transaction_type === "DEPOSIT_SLIP" ? "Deposit Slip" :
                           formData.transaction_type === "CASH" ? "Cash" :
                           formData.transaction_type === "INTERNAL" ? "Internal" :
                           formData.transaction_type || "—"}
                        </span>
                      </div>
                      {isCashOrInternal && formData.cash_internal_type && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-600">
                            {formData.transaction_type === "CASH" ? "Cash Type" : "Internal Type"}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formData.cash_internal_type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bank Accounts */}
                    <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Main Bank Account</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                          {formData.main_bank_account_id 
                            ? (mainBankAccounts.find(acc => acc.id === formData.main_bank_account_id)?.account_name || "—")
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recipient Bank Account</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                          {formData.recipient_bank_account_id 
                            ? (recipientBankAccounts.find(acc => acc.id === formData.recipient_bank_account_id)?.account_name || "—")
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Unit */}
                    {formData.unit_id && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit</span>
                          <span className="text-sm font-medium text-gray-900">
                            {units.find(u => u.id === formData.unit_id)?.unit_name || "—"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Particulars */}
                    {formData.particulars && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Particulars</span>
                          <p className="text-sm text-gray-900 leading-relaxed break-words">
                            {formData.particulars}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Attachments Count */}
                    {(voucherFile || uploadedFiles.length > 0) && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Attachments</span>
                          <span className="text-sm font-medium text-gray-900">
                            {[voucherFile, ...uploadedFiles].filter(Boolean).length} file{([voucherFile, ...uploadedFiles].filter(Boolean).length !== 1) ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between py-3 px-4 rounded-md bg-gray-50" style={{ borderColor: BORDER }}>
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Total Amount</span>
                        <span className="text-xl font-bold text-[#7a0f1f]">
                          ₱ {formData.amount ? parseFloat(formData.amount.replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div
            className="flex justify-end gap-3 mt-10 pt-6 border-t"
            style={{ borderColor: BORDER }}
          >
            <button
              onClick={resetForm}
              className="px-6 py-2 rounded-md border"
              style={{ borderColor: BORDER }}
            >
              Reset
            </button>

            <button
              disabled={
                (voucherMode === "WITH_VOUCHER" && (!formData.voucher_date || !formData.voucher_no)) ||
                !formData.amount ||
                !formData.main_bank_account_id ||
                !formData.recipient_bank_account_id ||
                (requiresFileUpload && uploadedFiles.length === 0) ||
                (shouldShowCashInternalInfo && !formData.cash_internal_type.trim())
              }
              className="px-6 py-2 rounded-md text-white bg-[#7a0f1f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Deposit
            </button>
          </div>
        </section>
      </div>

      {/* ================= FILE PREVIEW/UPLOAD SIDE PANEL ================= */}
      {(showFilePreviewPanel || filePreviewPanelClosing) && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              filePreviewPanelClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeFilePreviewPanel}
          />

          {/* Panel */}
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-3xl h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: filePreviewPanelClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <h2 className="text-lg font-bold">
                {previewingFileIndex !== null 
                  ? `Preview: ${previewingFileIndex >= 0 && previewingFileIndex < uploadedFiles.length
                      ? uploadedFiles[previewingFileIndex]?.name
                      : voucherFile?.name || "Image"}`
                  : voucherMode === "WITH_VOUCHER" 
                    ? voucherFile
                      ? "Preview Voucher Image"
                      : "Upload Voucher Image"
                    : "Upload Attachment"}
              </h2>
              <button
                onClick={closeFilePreviewPanel}
                className="p-2 rounded-md hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Show preview if viewing a file or if voucher file exists */}
              {(() => {
                const filePreviewSrc = 
                  previewingFileIndex !== null && 
                  previewingFileIndex >= 0 && 
                  previewingFileIndex < filePreviews.length && 
                  filePreviews[previewingFileIndex] && 
                  filePreviews[previewingFileIndex].trim() !== ""
                    ? filePreviews[previewingFileIndex]
                    : null;

                const voucherPreviewSrc = voucherPreview && voucherPreview.trim() !== "" ? voucherPreview : null;
                const previewSrc = filePreviewSrc || voucherPreviewSrc;

                const shouldShowPreview = previewSrc && (previewingFileIndex !== null || (voucherMode === "WITH_VOUCHER" && voucherFile));

                if (!shouldShowPreview || !previewSrc) {
                  return null;
                }

                return (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Preview</h3>
                    <div
                      className="rounded-md border overflow-hidden bg-gray-50"
                      style={{ borderColor: BORDER }}
                    >
                      <img
                        src={previewSrc}
                        alt="Preview"
                        className="w-full object-contain max-h-[70vh]"
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">File:</span>{" "}
                        {previewingFileIndex !== null && previewingFileIndex >= 0 && previewingFileIndex < uploadedFiles.length
                          ? uploadedFiles[previewingFileIndex]?.name
                          : voucherFile?.name || "Unknown"}
                      </p>
                      {previewingFileIndex !== null && previewingFileIndex >= 0 && previewingFileIndex < uploadedFiles.length && uploadedFiles[previewingFileIndex] && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Size:</span> {(uploadedFiles[previewingFileIndex].size / 1024).toFixed(2)} KB
                        </p>
                      )}
                      {voucherFile && (previewingFileIndex === null || previewingFileIndex < 0) && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Size:</span> {(voucherFile.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Show upload area if not previewing a specific file */}
              {previewingFileIndex === null && (
                <div
                  className="rounded-md border-2 border-dashed p-10 text-center cursor-pointer hover:bg-gray-50 transition"
                  style={{ borderColor: BORDER }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
                    
                    if (voucherMode === "WITH_VOUCHER" && imageFiles.length > 0) {
                      handleVoucherUpload(imageFiles[0]);
                    } else if (imageFiles.length > 0) {
                      const newFiles = [...uploadedFiles, ...imageFiles];
                      setUploadedFiles(newFiles);
                      imageFiles.forEach((file) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFilePreviews((prev) => [...prev, reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-500 mb-3" />
                  <p className="text-sm text-gray-600">
                    Drag & drop {voucherMode === "WITH_VOUCHER" ? "voucher" : "image"} here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    or click below to upload
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple={voucherMode !== "WITH_VOUCHER"}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
                      
                      if (voucherMode === "WITH_VOUCHER" && imageFiles.length > 0) {
                        handleVoucherUpload(imageFiles[0]);
                      } else if (imageFiles.length > 0) {
                        const newFiles = [...uploadedFiles, ...imageFiles];
                        setUploadedFiles(newFiles);
                        imageFiles.forEach((file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFilePreviews((prev) => [...prev, reader.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                    }}
                    className="hidden"
                    id="file-preview-input"
                  />

                  <label
                    htmlFor="file-preview-input"
                    className="inline-block mt-4 px-4 py-2 rounded-md bg-[#7a0f1f] text-white text-sm cursor-pointer hover:opacity-95"
                  >
                    Choose {voucherMode === "WITH_VOUCHER" ? "Image" : "Images"}
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 p-4 border-t"
              style={{ borderColor: BORDER }}
            >
              <button
                onClick={closeFilePreviewPanel}
                className="px-6 py-2 rounded-md border"
                style={{ borderColor: BORDER }}
              >
                Done
              </button>
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

    </div>
  );
}
