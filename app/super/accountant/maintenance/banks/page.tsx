"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Grid, List, X, Inbox, Plus, Eye, Banknote, Edit2, User } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type BankStatus = "ACTIVE" | "INACTIVE";

type Bank = {
  id: number;
  name: string;
  short_name?: string | null;
  country?: string | null;
  status: BankStatus;
  created_at?: string;
  updated_at?: string;
};

type BankContactChannel = {
  id?: number;
  contact_id?: number;
  channel_type: "PHONE" | "MOBILE" | "EMAIL" | "VIBER";
  value: string;
  label?: string | null;
  country_code?: string | null;
};

type BankContact = {
  id: number;
  bank_id: number;
  branch_name: string;
  contact_person?: string | null;
  position?: string | null;
  notes?: string | null;
  channels?: BankContactChannel[];
  created_at?: string;
  updated_at?: string;
};

const BORDER = "rgba(0,0,0,0.12)";

// Country list with common countries
const COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "VN", name: "Vietnam" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
];

// Country phone codes
const COUNTRY_PHONE_CODES = [
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+1", country: "United States/Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
];

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

// Format phone number
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned;
};

// Validate email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const EyeIcon = (props: any) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Reusable Pagination Component
const Pagination = ({
  totalPages,
  currentPage,
  setCurrentPage,
  totalItems,
  startIndex,
  endIndex,
  itemName = "items",
}: {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemName?: string;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: BORDER }}>
      <div className="text-sm text-neutral-600">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} {itemName}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          style={{ borderColor: BORDER }}
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    currentPage === page ? "bg-[#7a0f1f] text-white" : "border hover:bg-gray-50"
                  }`}
                  style={currentPage !== page ? { borderColor: BORDER } : undefined}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-2 text-neutral-500">...</span>;
            }
            return null;
          })}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-md text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          style={{ borderColor: BORDER }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
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
  const [detailBank, setDetailBank] = useState<Bank | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailFormData, setDetailFormData] = useState<Partial<Bank>>({});
  const [savingBank, setSavingBank] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [showCreateBankConfirm, setShowCreateBankConfirm] = useState(false);
  const [showCreateContactConfirm, setShowCreateContactConfirm] = useState(false);

  // Bank Contacts state
  const [bankContacts, setBankContacts] = useState<BankContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<BankContact | null>(null);
  const [contactFormData, setContactFormData] = useState({
    branch_name: "",
    contact_person: "",
    position: "",
    notes: "",
    channels: [] as BankContactChannel[],
  });
  const [savingContact, setSavingContact] = useState(false);
  const [showContactLoading, setShowContactLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    country: "",
    status: "ACTIVE" as BankStatus,
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  // Debounce bank name checking
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkBankNameExists(formData.name);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Debounce bank name checking for edit mode
  useEffect(() => {
    if (!detailEditing || !detailFormData.name?.trim()) {
      return;
    }

    const timeoutId = setTimeout(() => {
      checkBankNameExists(detailFormData.name || "", detailBank?.id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [detailFormData.name, detailEditing, detailBank?.id]);

  const filteredBanks = useMemo(() => {
    let filtered = banks.filter((bank) => bank.status === statusFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (bank) =>
          bank.name?.toLowerCase().includes(q) ||
          bank.short_name?.toLowerCase().includes(q) ||
          bank.country?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [banks, searchQuery, statusFilter]);

  const itemsPerPage = viewMode === "table" ? 10 : 30;
  const totalPages = Math.ceil(filteredBanks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBanks = filteredBanks.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, viewMode]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/banks");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setBanks(data.data);
      } else {
        setBanks([]);
      }
    } catch {
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetailDrawer = async (bankId: number) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    setDetailLoadError(null);
    try {
      const res = await fetch(`/api/accountant/maintenance/banks/${bankId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setDetailBank(data.data);
        setDetailFormData(data.data);
        await fetchBankContacts(bankId);
      } else {
        setDetailLoadError(data.message || "Failed to load bank details");
      }
    } catch (error) {
      setDetailLoadError("An error occurred while loading bank details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchBankContacts = async (bankId: number) => {
    setLoadingContacts(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/bank-contacts?bank_id=${bankId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setBankContacts(data.data);
      } else {
        setBankContacts([]);
      }
    } catch {
      setBankContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true);
    setTimeout(() => {
      setDetailDrawerOpen(false);
      setDetailDrawerClosing(false);
      setDetailBank(null);
      setDetailEditing(false);
      setDetailLoadError(null);
      setBankContacts([]);
      setShowContactForm(false);
      setEditingContact(null);
      setContactFormData({
        branch_name: "",
        contact_person: "",
        position: "",
        notes: "",
        channels: [],
      });
    }, 350);
  };

  const checkBankNameExists = async (name: string, excludeId?: number) => {
    if (!name.trim()) {
      setNameError(null);
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    try {
      const url = `/api/accountant/maintenance/banks/check-name?name=${encodeURIComponent(name.trim())}${excludeId ? `&exclude_id=${excludeId}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.exists) {
        setNameError("A bank with this name already exists.");
      } else {
        setNameError(null);
      }
    } catch (error) {
      console.error("Error checking bank name:", error);
      setNameError(null);
    } finally {
      setCheckingName(false);
    }
  };

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreatePanel(false);
      setCreatePanelClosing(false);
      setFormData({
        name: "",
        short_name: "",
        country: "",
        status: "ACTIVE",
      });
      setNameError(null);
      setCheckingName(false);
    }, 350);
  };

  const handleCreateBankConfirm = () => {
    setShowCreateBankConfirm(false);
    handleCreateBank();
  };

  const handleCreateBank = async () => {
    if (!formData.name.trim()) {
      setFailTitle("Failed to Create Bank");
      setCreateFailMessage("Bank name is required");
      setShowCreateFail(true);
      return;
    }

    if (nameError) {
      setFailTitle("Failed to Create Bank");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    setShowCreateLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          short_name: formData.short_name.trim() || null,
          country: formData.country.trim() || null,
          status: formData.status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBanks();
        closeCreatePanel();
        setSuccessTitle("Bank Created Successfully");
        setSuccessMessage("The bank has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Bank");
        const errorMsg = data.errors?.name?.[0] || data.message || "Failed to create bank";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating bank:", error);
      setFailTitle("Failed to Create Bank");
      setCreateFailMessage("An error occurred while creating the bank");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  const handleSaveBank = async (formData: Partial<Bank>) => {
    if (!detailBank?.id) return;
    
    if (nameError) {
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }
    
    setSavingBank(true);
    setShowSaveLoading(true);
    try {
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (key === "id") return acc;
        acc[key] = value === "" ? null : value;
        return acc;
      }, {} as Record<string, any>);

      const res = await fetch(`/api/accountant/maintenance/banks/${detailBank.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDetailBank((prev) => (prev ? { ...prev, ...data.data } : null));
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}));
        setDetailEditing(false);
        setNameError(null);
        await fetchBanks();
        setSuccessTitle("Bank Updated Successfully");
        setSuccessMessage("The bank has been updated successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Update Bank");
        const errorMsg = data.errors?.name?.[0] || data.message || "Failed to update bank";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch {
      setFailTitle("Failed to Update Bank");
      setCreateFailMessage("An error occurred while updating the bank");
      setShowCreateFail(true);
    } finally {
      setSavingBank(false);
      setShowSaveLoading(false);
    }
  };


  const parsePhoneNumber = (value: string): { countryCode: string; number: string } => {
    for (const codeData of COUNTRY_PHONE_CODES) {
      if (value.startsWith(codeData.code)) {
        return {
          countryCode: codeData.code,
          number: value.substring(codeData.code.length),
        };
      }
    }
    return { countryCode: "+63", number: value };
  };

  const openContactForm = (contact?: BankContact) => {
    if (contact) {
      setEditingContact(contact);
      setContactFormData({
        branch_name: contact.branch_name || "",
        contact_person: contact.contact_person || "",
        position: contact.position || "",
        notes: contact.notes || "",
        channels: contact.channels
          ? contact.channels.map((ch) => {
              if (ch.channel_type === "PHONE" || ch.channel_type === "MOBILE" || ch.channel_type === "VIBER") {
                const parsed = parsePhoneNumber(ch.value);
                return { ...ch, value: parsed.number, country_code: parsed.countryCode };
              }
              return { ...ch };
            })
          : [],
      });
    } else {
      setEditingContact(null);
      setContactFormData({
        branch_name: "",
        contact_person: "",
        position: "",
        notes: "",
        channels: [],
      });
    }
    setShowContactForm(true);
  };

  const closeContactForm = () => {
    setShowContactForm(false);
    setEditingContact(null);
    setContactFormData({
      branch_name: "",
      contact_person: "",
      position: "",
      notes: "",
      channels: [],
    });
  };

  const addChannel = () => {
    setContactFormData({
      ...contactFormData,
      channels: [
        { channel_type: "PHONE", value: "", label: null, country_code: "+63" },
        ...contactFormData.channels,
      ],
    });
  };

  const removeChannel = (index: number) => {
    setContactFormData({
      ...contactFormData,
      channels: contactFormData.channels.filter((_, i) => i !== index),
    });
  };

  const updateChannel = (index: number, field: keyof BankContactChannel, value: any) => {
    const updatedChannels = [...contactFormData.channels];
    const updatedChannel = { ...updatedChannels[index], [field]: value };
    
    // If changing to EMAIL, remove country_code
    if (field === "channel_type" && value === "EMAIL") {
      updatedChannel.country_code = null;
    }
    // If changing from EMAIL to phone type and no country_code exists, set default
    else if (field === "channel_type" && (value === "PHONE" || value === "MOBILE" || value === "VIBER") && !updatedChannel.country_code) {
      updatedChannel.country_code = "+63";
    }
    
    updatedChannels[index] = updatedChannel;
    setContactFormData({ ...contactFormData, channels: updatedChannels });
  };

  const handleSaveContactConfirm = () => {
    setShowCreateContactConfirm(false);
    handleSaveContact();
  };

  const handleSaveContact = async () => {
    if (!detailBank?.id) return;
    if (!contactFormData.branch_name.trim()) {
      setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
      setCreateFailMessage("Branch name is required");
      setShowCreateFail(true);
      return;
    }

    // Validate channels
    for (let i = 0; i < contactFormData.channels.length; i++) {
      const channel = contactFormData.channels[i];
      if (!channel.value.trim()) {
        setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
        setCreateFailMessage(`Channel ${i + 1} value is required`);
        setShowCreateFail(true);
        return;
      }
      if (channel.channel_type === "EMAIL" && !isValidEmail(channel.value.trim())) {
        setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
        setCreateFailMessage(`Channel ${i + 1} has an invalid email address`);
        setShowCreateFail(true);
        return;
      }
    }

    setSavingContact(true);
    setShowContactLoading(true);
    try {
      const url = editingContact
        ? `/api/accountant/maintenance/bank-contacts/${editingContact.id}`
        : `/api/accountant/maintenance/bank-contacts`;
      const method = editingContact ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_id: detailBank.id,
          branch_name: contactFormData.branch_name.trim(),
          contact_person: contactFormData.contact_person.trim() || null,
          position: contactFormData.position.trim() || null,
          notes: contactFormData.notes.trim() || null,
          channels: contactFormData.channels.map((ch) => {
            let value = ch.value.trim();
            // Prepend country code for phone types
            if ((ch.channel_type === "PHONE" || ch.channel_type === "MOBILE" || ch.channel_type === "VIBER") && ch.country_code) {
              // Only add country code if value doesn't already start with it
              if (!value.startsWith(ch.country_code)) {
                value = ch.country_code + value;
              }
            }
            return {
              ...(ch.id && { id: ch.id }),
              channel_type: ch.channel_type,
              value: value,
              label: ch.label?.trim() || null,
            };
          }),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBankContacts(detailBank.id);
        closeContactForm();
        setSuccessTitle(editingContact ? "Contact Updated Successfully" : "Contact Created Successfully");
        setSuccessMessage(editingContact ? "The contact has been updated successfully." : "The contact has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
        const errorMsg = data.errors ? Object.values(data.errors).flat().join(", ") : data.message || `Failed to ${editingContact ? "update" : "create"} contact`;
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
      setCreateFailMessage(`An error occurred while ${editingContact ? "updating" : "creating"} the contact`);
      setShowCreateFail(true);
    } finally {
      setSavingContact(false);
      setShowContactLoading(false);
    }
  };


  return (
    <div className="min-h-full flex flex-col">
      {/* Compact Banks bar - extension of sidebar */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Banks</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Bank List</h2>
              <p className="text-sm text-gray-600 mt-1">Manage bank institutions</p>
            </div>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Plus className="w-4 h-4" />
              Create Bank
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
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchBanks()}
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
                  placeholder="Search by name, short name, or country..."
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

          {/* Pagination at the top */}
          {totalPages > 1 && (
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={filteredBanks.length}
              startIndex={startIndex}
              endIndex={endIndex}
              itemName="banks"
            />
          )}

          <div className="mt-4">
            {loading ? (
              viewMode === "cards" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                  {[...Array(6)].map((_, i) => (
                    <BankCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <BankTableSkeleton />
              )
            ) : filteredBanks.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a bank or adjust your search.</div>
              </div>
            ) : viewMode === "cards" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                  {paginatedBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-md flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-[#7a0f1f]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900">{bank.name}</h3>
                            {bank.short_name && <p className="text-sm text-neutral-600 mt-0.5">{bank.short_name}</p>}
                            {bank.country && <p className="text-xs text-neutral-500 mt-0.5">{bank.country}</p>}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 text-[11px] font-semibold rounded ${
                            bank.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {bank.status}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-neutral-500">Created: {formatDate(bank.created_at)}</div>
                        <button
                          onClick={() => openDetailDrawer(bank.id)}
                          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                          style={{ background: "#7a0f1f", height: 32 }}
                          title="View"
                        >
                          <EyeIcon />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 shrink-0"></div>
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm font-bold text-neutral-900">
                        <div>Name</div>
                        <div>Short Name</div>
                        <div>Country</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-sm font-bold text-neutral-900 w-20">Status</div>
                      <div className="w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {paginatedBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center shrink-0">
                            <Banknote className="w-6 h-6 text-[#7a0f1f]" />
                          </div>
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 truncate">{bank.name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Name</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{bank.short_name || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Short Name</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{bank.country || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Country</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                              bank.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {bank.status}
                          </div>
                          <button
                            onClick={() => openDetailDrawer(bank.id)}
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
                <h2 className="text-lg font-bold">Create Bank</h2>
                <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        nameError ? "border-red-500" : ""
                      }`}
                      style={nameError ? {} : { borderColor: BORDER }}
                      placeholder="e.g., Security Bank"
                      required
                    />
                    {checkingName && (
                      <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                    )}
                    {nameError && !checkingName && (
                      <p className="text-xs text-red-500 mt-1">{nameError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Short Name</label>
                    <input
                      type="text"
                      value={formData.short_name}
                      onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="e.g., SCB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="">Select a country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as BankStatus })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
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
                  onClick={() => setShowCreateBankConfirm(true)}
                  disabled={showCreateLoading || !!nameError}
                  className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#7a0f1f" }}
                >
                  {showCreateLoading ? "Creating..." : "Create Bank"}
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
                    <h2 className="text-lg font-bold">{detailBank ? detailBank.name : loadingDetail ? "Loading..." : "Bank Details"}</h2>
                    {detailBank?.short_name && <p className="text-sm text-white/90 mt-0.5">{detailBank.short_name}</p>}
                  </div>
                  {detailBank && (
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        detailBank.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detailBank.status}
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
                    <BankDetailSkeleton />
                  </div>
                ) : !detailBank ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load bank details.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <div>
                            <input
                              type="text"
                              value={detailFormData.name || ""}
                              onChange={(e) => setDetailFormData({ ...detailFormData, name: e.target.value })}
                              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                                nameError ? "border-red-500" : ""
                              }`}
                              style={nameError ? {} : { borderColor: BORDER }}
                            />
                            {checkingName && (
                              <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                            )}
                            {nameError && !checkingName && (
                              <p className="text-xs text-red-500 mt-1">{nameError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailBank.name}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Short Name</label>
                        {detailEditing ? (
                          <input
                            type="text"
                            value={detailFormData.short_name || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, short_name: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{detailBank.short_name || "—"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Country</label>
                        {detailEditing ? (
                          <select
                            value={detailFormData.country || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, country: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          >
                            <option value="">Select a country</option>
                            {COUNTRIES.map((country) => (
                              <option key={country.code} value={country.name}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailBank.country || "—"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Status <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <select
                            value={detailFormData.status || "ACTIVE"}
                            onChange={(e) => setDetailFormData({ ...detailFormData, status: e.target.value as BankStatus })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailBank.status}</div>
                        )}
                      </div>
                    </div>

                    {/* Bank Contacts Section */}
                    {!detailEditing && (
                      <div className="mt-8 pt-8 border-t" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-neutral-900">Bank Contacts</h3>
                            <p className="text-sm text-neutral-600 mt-0.5">Manage contacts for this bank</p>
                          </div>
                          <button
                            onClick={() => openContactForm()}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white hover:opacity-95"
                            style={{ background: "#7a0f1f" }}
                          >
                            <Plus className="w-4 h-4" />
                            Add Contact
                          </button>
                        </div>

                        {loadingContacts ? (
                          <div className="py-8 flex items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#7a0f1f]"></div>
                          </div>
                        ) : bankContacts.length === 0 ? (
                          <div className="py-8 text-center">
                            <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No contacts added yet</p>
                          </div>
                        ) : (
                          <div>
                            <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2 py-2 text-sm font-bold text-neutral-900">
                                    <div>Branch</div>
                                    <div>Contact Channels</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="w-20"></div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {bankContacts.map((contact) => {
                                const phoneChannels = contact.channels?.filter((ch) => ch.channel_type === "PHONE" || ch.channel_type === "MOBILE") || [];
                                const emailChannels = contact.channels?.filter((ch) => ch.channel_type === "EMAIL") || [];
                                const viberChannels = contact.channels?.filter((ch) => ch.channel_type === "VIBER") || [];
                                
                                return (
                                  <div
                                    key={contact.id}
                                    className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                                    style={{ borderColor: BORDER }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <div className="min-w-0">
                                            <div className="font-semibold text-neutral-900 truncate">{contact.branch_name}</div>
                                            <div className="text-xs text-neutral-500 mt-0.5">Branch</div>
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-sm text-neutral-900">
                                              {phoneChannels.length > 0 && (
                                                <div className="mb-2">
                                                  <span className="font-medium text-neutral-700">Phone:</span>
                                                  <div className="mt-0.5 space-y-0.5">
                                                    {phoneChannels.map((ch, idx) => (
                                                      <div key={idx} className="text-neutral-600">
                                                        {ch.value}
                                                        {ch.label && <span className="text-xs text-neutral-500 ml-1">({ch.label})</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {emailChannels.length > 0 && (
                                                <div className="mb-2">
                                                  <span className="font-medium text-neutral-700">Email:</span>
                                                  <div className="mt-0.5 space-y-0.5">
                                                    {emailChannels.map((ch, idx) => (
                                                      <div key={idx} className="text-neutral-600">
                                                        {ch.value}
                                                        {ch.label && <span className="text-xs text-neutral-500 ml-1">({ch.label})</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {viberChannels.length > 0 && (
                                                <div className="mb-2">
                                                  <span className="font-medium text-neutral-700">Viber:</span>
                                                  <div className="mt-0.5 space-y-0.5">
                                                    {viberChannels.map((ch, idx) => (
                                                      <div key={idx} className="text-neutral-600">
                                                        {ch.value}
                                                        {ch.label && <span className="text-xs text-neutral-500 ml-1">({ch.label})</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {(!contact.channels || contact.channels.length === 0) && (
                                                <span className="text-gray-400">—</span>
                                              )}
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-0.5">Contact Channels</div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => openContactForm(contact)}
                                            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                            title="View contact"
                                          >
                                            <Eye className="w-4 h-4 text-gray-600" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {detailBank && (
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
                  {detailEditing ? (
                    <>
                      <button
                        onClick={() => setDetailEditing(false)}
                        className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                        style={{ borderColor: BORDER }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveBank(detailFormData)}
                        disabled={savingBank}
                        className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60"
                        style={{ background: "#7a0f1f" }}
                      >
                        {savingBank ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setDetailFormData({ ...detailBank });
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
            title="Creating Bank" 
            message="Please wait while we create the bank..." 
          />
        )}

        {showSaveLoading && (
          <LoadingModal 
            isOpen={showSaveLoading} 
            title="Updating Bank" 
            message="Please wait while we update the bank..." 
          />
        )}

        {showContactLoading && (
          <LoadingModal 
            isOpen={showContactLoading} 
            title={editingContact ? "Updating Contact" : "Creating Contact"} 
            message={editingContact ? "Please wait while we update the contact..." : "Please wait while we create the contact..."} 
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
            title="Failed to Load Bank"
            message={detailLoadError}
            buttonText="Close"
          />
        )}

        <ConfirmationModal
          isOpen={showCreateBankConfirm}
          onClose={() => setShowCreateBankConfirm(false)}
          onConfirm={handleCreateBankConfirm}
          title="Create Bank"
          message={`Are you sure you want to create the bank "${formData.name.trim()}"?`}
          confirmText="Create"
          isLoading={showCreateLoading}
        />

        <ConfirmationModal
          isOpen={showCreateContactConfirm}
          onClose={() => setShowCreateContactConfirm(false)}
          onConfirm={handleSaveContactConfirm}
          title="Create Contact"
          message={`Are you sure you want to create a contact for branch "${contactFormData.branch_name.trim()}"?`}
          confirmText="Create"
          isLoading={showContactLoading}
        />

        {/* Contact Form Side Panel */}
        {showContactForm && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-[350ms] opacity-100"
              onClick={closeContactForm}
              aria-hidden="true"
            />
            <div
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
              style={{
                animation: "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                <div>
                  <h2 className="text-lg font-bold">{editingContact ? "Edit Contact" : "Add New Contact"}</h2>
                  <p className="text-sm text-white/90 mt-0.5">
                    {editingContact ? "Update contact information" : "Fill in the details below to add a new contact."}
                  </p>
                </div>
                <button
                  onClick={closeContactForm}
                  className="p-2 rounded-md hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactFormData.branch_name}
                      onChange={(e) => setContactFormData({ ...contactFormData, branch_name: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="Enter branch name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Contact Person</label>
                    <input
                      type="text"
                      value={contactFormData.contact_person}
                      onChange={(e) => setContactFormData({ ...contactFormData, contact_person: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Position</label>
                    <input
                      type="text"
                      value={contactFormData.position}
                      onChange={(e) => setContactFormData({ ...contactFormData, position: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="Enter position"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                    <textarea
                      value={contactFormData.notes}
                      onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="Enter notes"
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-900">Contact Channels</label>
                      <button
                        type="button"
                        onClick={addChannel}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white hover:opacity-95"
                        style={{ background: "#7a0f1f" }}
                      >
                        <Plus className="w-3 h-3" />
                        Add Channel
                      </button>
                    </div>
                    <div className="space-y-2">
                      {contactFormData.channels.map((channel, index) => {
                        const isPhoneType = channel.channel_type === "PHONE" || channel.channel_type === "MOBILE" || channel.channel_type === "VIBER";
                        const isEmailType = channel.channel_type === "EMAIL";
                        const channelValue = channel.value || "";
                        const hasEmailError = isEmailType && channelValue && !isValidEmail(channelValue);
                        
                        return (
                          <div key={index} className="flex gap-2 items-start p-3 rounded-md border" style={{ borderColor: BORDER }}>
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={channel.channel_type}
                                  onChange={(e) => {
                                    const newType = e.target.value as "PHONE" | "MOBILE" | "EMAIL" | "VIBER";
                                    updateChannel(index, "channel_type", newType);
                                  }}
                                  className="rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                                  style={{ borderColor: BORDER }}
                                >
                                  <option value="PHONE">Phone</option>
                                  <option value="MOBILE">Mobile</option>
                                  <option value="EMAIL">Email</option>
                                  <option value="VIBER">Viber</option>
                                </select>
                                <input
                                  type="text"
                                  value={channel.label || ""}
                                  onChange={(e) => updateChannel(index, "label", e.target.value)}
                                  className="rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                                  style={{ borderColor: BORDER }}
                                  placeholder="Label (optional)"
                                />
                              </div>
                              <div className="flex gap-2">
                                {isPhoneType && (
                                  <select
                                    value={channel.country_code || "+63"}
                                    onChange={(e) => updateChannel(index, "country_code", e.target.value)}
                                    className="rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 w-32"
                                    style={{ borderColor: BORDER }}
                                  >
                                    {COUNTRY_PHONE_CODES.map((code) => (
                                      <option key={code.code} value={code.code}>
                                        {code.flag} {code.code}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <div className="flex-1">
                                  <input
                                    type={isEmailType ? "email" : "text"}
                                    value={channelValue}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      if (isPhoneType) {
                                        value = formatPhoneNumber(value);
                                      }
                                      updateChannel(index, "value", value);
                                    }}
                                    className={`rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 w-full ${
                                      hasEmailError ? "border-red-500" : ""
                                    }`}
                                    style={hasEmailError ? {} : { borderColor: BORDER }}
                                    placeholder={isEmailType ? "email@example.com" : "Number"}
                                  />
                                  {hasEmailError && (
                                    <p className="text-xs text-red-500 mt-0.5">Invalid email format</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeChannel(index)}
                              className="p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0"
                              title="Remove channel"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        );
                      })}
                      {contactFormData.channels.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500 border rounded-md" style={{ borderColor: BORDER }}>
                          No channels added. Click "Add Channel" to add contact information.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
                <button
                  onClick={closeContactForm}
                  className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                  style={{ borderColor: BORDER }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingContact) {
                      handleSaveContact();
                    } else {
                      setShowCreateContactConfirm(true);
                    }
                  }}
                  disabled={savingContact || !contactFormData.branch_name.trim()}
                  className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#7a0f1f" }}
                >
                  {savingContact ? "Saving..." : editingContact ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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

function BankDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}>
          <div className="h-4 bg-slate-200 w-24 mb-2 rounded" />
          <div className="h-10 bg-slate-100 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

function BankCardSkeleton() {
  return (
    <div className="rounded-md bg-white border shadow-sm p-4" style={{ borderColor: BORDER }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 w-3/4 mb-2 animate-pulse rounded" />
            <div className="h-3 bg-gray-200 w-1/2 animate-pulse rounded" />
          </div>
        </div>
        <div className="h-5 bg-gray-200 w-16 animate-pulse rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 w-24 animate-pulse rounded" />
        <div className="h-8 bg-gray-200 w-20 animate-pulse rounded-md" />
      </div>
    </div>
  );
}

function BankTableSkeleton() {
  return (
    <div>
      <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 shrink-0"></div>
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="h-4 bg-gray-200 w-20 animate-pulse rounded" />
              <div className="h-4 bg-gray-200 w-24 animate-pulse rounded" />
              <div className="h-4 bg-gray-200 w-20 animate-pulse rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-4 bg-gray-200 w-16 animate-pulse rounded" />
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
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <div className="h-4 bg-gray-200 w-3/4 mb-1 animate-pulse rounded" />
                    <div className="h-3 bg-gray-200 w-16 animate-pulse rounded" />
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 w-1/2 mb-1 animate-pulse rounded" />
                    <div className="h-3 bg-gray-200 w-20 animate-pulse rounded" />
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 w-1/2 mb-1 animate-pulse rounded" />
                    <div className="h-3 bg-gray-200 w-16 animate-pulse rounded" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-8 bg-gray-200 w-20 animate-pulse rounded-md" />
                <div className="h-8 bg-gray-200 w-20 animate-pulse rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
