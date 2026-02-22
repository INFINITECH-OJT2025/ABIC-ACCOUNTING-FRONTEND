"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Grid, List, X, Inbox, Plus, Eye, User, Building2, ChevronDown, Filter, ArrowUpDown } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type OwnerType = "COMPANY" | "CLIENT" | "EMPLOYEE" | "MAIN" | "SYSTEM";
type OwnerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type Owner = {
  id: number;
  owner_code?: string | null;
  owner_type: OwnerType;
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  /** @deprecated Use phone. Kept for backward compatibility with backend. */
  phone_number?: string | null;
  address?: string | null;
  status: OwnerStatus | string; // Allow string for backward compatibility during transition
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
};

type UnitStatus = "ACTIVE" | "INACTIVE";

type Property = {
  id: number;
  name: string;
  property_type: string;
  address?: string | null;
  status: string;
};

type Unit = {
  id: number;
  owner_id?: number | null;
  property_id?: number | null;
  unit_name: string;
  status: UnitStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  property?: Property | null;
};

const BORDER = "rgba(0,0,0,0.12)";

// Status badge utility function
const getStatusBadge = (status: string): string => {
  const s = status?.toUpperCase();
  if (s === "ACTIVE") return "bg-green-100 text-green-700";
  if (s === "SUSPENDED") return "bg-yellow-100 text-yellow-700";
  if (s === "INACTIVE") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
};

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
const OwnerCardSkeleton = () => (
  <div className="rounded-md bg-white border shadow-sm p-4" style={{ borderColor: BORDER }}>
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
  </div>
);

const OwnerTableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="rounded-md bg-white border shadow-sm p-4" style={{ borderColor: BORDER }}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const OwnerDetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function OwnersPage() {
  const searchParams = useSearchParams();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<OwnerType | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [highlightOwnerId, setHighlightOwnerId] = useState<number | null>(null);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);

  // Handle URL params for highlighting.
  // When opened directly from ledger, force filters/search so the exact owner is visible.
  useEffect(() => {
    const highlightParam = searchParams.get("highlight");
    if (!highlightParam) return;

    const ownerId = parseInt(highlightParam, 10);
    if (isNaN(ownerId)) return;

    const focusOwner = async () => {
      try {
        const res = await fetch(`/api/accountant/maintenance/owners/${ownerId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          const owner = data.data as Owner;
          const ownerStatus = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
          setStatusFilter(ownerStatus === "INACTIVE" ? "INACTIVE" : "ACTIVE");
          setOwnerTypeFilter(owner.owner_type ?? "ALL");
          setSearchQuery(owner.name ?? "");
          setCurrentPage(1);
        }
      } catch {
        // no-op: fallback to current list state
      } finally {
        setHighlightOwnerId(ownerId);
        setTimeout(() => setHighlightOwnerId(null), 3000);
      }
    };

    focusOwner();
  }, [searchParams]);
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
  const [detailOwner, setDetailOwner] = useState<Owner | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailFormData, setDetailFormData] = useState<Partial<Owner>>({});
  const [savingOwner, setSavingOwner] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [showCreateOwnerConfirm, setShowCreateOwnerConfirm] = useState(false);

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormData, setUnitFormData] = useState({
    unit_name: "",
    property_id: null as number | null,
    status: "ACTIVE" as UnitStatus,
    notes: "",
  });
  const [savingUnit, setSavingUnit] = useState(false);
  const [showUnitLoading, setShowUnitLoading] = useState(false);
  const [showCreateUnitConfirm, setShowCreateUnitConfirm] = useState(false);

  // Properties state for dropdown
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  const [formData, setFormData] = useState({
    owner_type: "CLIENT" as OwnerType,
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    opening_balance: "",
    opening_date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [openingBalanceError, setOpeningBalanceError] = useState<string | null>(null);
  const [openingDateError, setOpeningDateError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, [searchQuery, statusFilter, ownerTypeFilter, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Update property search query when property_id changes or properties are loaded
  useEffect(() => {
    if (unitFormData.property_id && properties.length > 0) {
      const selectedProperty = properties.find(p => p.id === unitFormData.property_id);
      if (selectedProperty && propertySearchQuery !== selectedProperty.name) {
        setPropertySearchQuery(selectedProperty.name);
      }
    } else if (!unitFormData.property_id && propertySearchQuery && showUnitForm) {
      // Only clear if we're in the form and property_id is cleared
      setPropertySearchQuery("");
    }
  }, [unitFormData.property_id, properties]);

  // Debounce owner name checking
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkOwnerNameExists(formData.name);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Debounce email validation
  useEffect(() => {
    const error = validateEmail(formData.email);
    setEmailError(error);
  }, [formData.email]);

  // Validate phone number
  useEffect(() => {
    const error = validatePhone(formData.phone);
    setPhoneError(error);
  }, [formData.phone]);

  // Validate description
  useEffect(() => {
    const error = validateDescription(formData.description);
    setDescriptionError(error);
  }, [formData.description]);

  // Validate address
  useEffect(() => {
    const error = validateAddress(formData.address);
    setAddressError(error);
  }, [formData.address]);

  // Validate opening balance
  useEffect(() => {
    const error = validateOpeningBalance(formData.opening_balance);
    setOpeningBalanceError(error);
    
    // Also validate date if balance is provided
    if (formData.opening_balance && parseFloat(formData.opening_balance) > 0) {
      const dateError = validateOpeningDate(formData.opening_date, true);
      setOpeningDateError(dateError);
    } else {
      setOpeningDateError(null);
    }
  }, [formData.opening_balance, formData.opening_date]);

  // Debounce owner name checking for detail form
  useEffect(() => {
    if (!detailOwner?.id || !detailFormData.name?.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkOwnerNameExists(detailFormData.name || "", detailOwner.id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [detailFormData.name, detailOwner?.id]);

  // Debounce email validation for detail form
  useEffect(() => {
    if (!detailOwner?.id) {
      setEmailError(null);
      return;
    }
    const error = validateEmail(detailFormData.email || "");
    setEmailError(error);
  }, [detailFormData.email, detailOwner?.id]);

  // Filtering is now done on the backend, so we just use owners directly
  const paginatedOwners = owners;

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = paginationMeta?.total || owners.length;
    const active = owners.filter(o => {
      const s = typeof o.status === "string" ? o.status.toUpperCase() : "ACTIVE";
      return s === "ACTIVE";
    }).length;
    const inactive = owners.filter(o => {
      const s = typeof o.status === "string" ? o.status.toUpperCase() : "ACTIVE";
      return s === "INACTIVE";
    }).length;
    const suspended = owners.filter(o => {
      const s = typeof o.status === "string" ? o.status.toUpperCase() : "ACTIVE";
      return s === "SUSPENDED";
    }).length;
    return { total, active, inactive, suspended };
  }, [owners, paginationMeta]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, ownerTypeFilter, searchQuery, sortBy, sortOrder]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/accountant/maintenance/owners", window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.append("search", searchQuery.trim());
      }
      if (statusFilter) {
        url.searchParams.append("status", statusFilter);
      }
      if (ownerTypeFilter && ownerTypeFilter !== "ALL") {
        url.searchParams.append("owner_type", ownerTypeFilter);
      }
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", viewMode === "table" ? "10" : "30");
      url.searchParams.append("sort_by", sortBy);
      url.searchParams.append("sort_order", sortOrder);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        // Backend returns paginated data
        const ownersList = data.data?.data || data.data || [];
        setOwners(Array.isArray(ownersList) ? ownersList : []);
        
        // Store pagination metadata
        if (data.data?.current_page !== undefined) {
          setPaginationMeta({
            current_page: data.data.current_page || 1,
            last_page: data.data.last_page || 1,
            per_page: data.data.per_page || 10,
            total: data.data.total || 0,
            from: data.data.from || 0,
            to: data.data.to || 0,
          });
        }
      } else {
        setOwners([]);
        setPaginationMeta(null);
      }
    } catch {
      setOwners([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const openDetailDrawer = async (ownerId: number) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    setDetailLoadError(null);
    try {
      const res = await fetch(`/api/accountant/maintenance/owners/${ownerId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setDetailOwner(data.data);
        setDetailFormData(data.data);
        await fetchUnits(ownerId);
      } else {
        setDetailLoadError(data.message || "Failed to load owner details");
      }
    } catch (error) {
      setDetailLoadError("An error occurred while loading owner details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const res = await fetch("/api/accountant/maintenance/properties?per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const propertiesList = data.data?.data || data.data || [];
        setProperties(Array.isArray(propertiesList) ? propertiesList : []);
      } else {
        setProperties([]);
      }
    } catch {
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  const filteredProperties = useMemo(() => {
    if (!propertySearchQuery.trim()) {
      return properties.filter(p => p.status === "ACTIVE");
    }
    const q = propertySearchQuery.toLowerCase();
    return properties.filter(
      (property) =>
        property.status === "ACTIVE" &&
        (property.name?.toLowerCase().includes(q) ||
          property.property_type?.toLowerCase().includes(q) ||
          property.address?.toLowerCase().includes(q))
    );
  }, [properties, propertySearchQuery]);

  const fetchUnits = async (ownerId: number) => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/units?owner_id=${ownerId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setUnits(data.data);
      } else {
        setUnits([]);
      }
    } catch {
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true);
    setTimeout(() => {
      setDetailDrawerOpen(false);
      setDetailDrawerClosing(false);
      setDetailOwner(null);
      setDetailFormData({});
      setDetailLoadError(null);
      setNameError(null);
      setEmailError(null);
      setUnits([]);
      setShowUnitForm(false);
      setEditingUnit(null);
    }, 350);
  };

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreatePanel(false);
      setCreatePanelClosing(false);
      setFormData({
        owner_type: "CLIENT",
        name: "",
        description: "",
        phone: "",
        email: "",
        address: "",
        opening_balance: "",
        opening_date: new Date().toISOString().split('T')[0],
      });
      setNameError(null);
      setEmailError(null);
      setPhoneError(null);
      setOpeningBalanceError(null);
      setOpeningDateError(null);
      setDescriptionError(null);
      setAddressError(null);
      setCheckingName(false);
    }, 350);
  };

  // Validation helper functions
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return "Owner name is required";
    }
    if (name.trim().length < 2) {
      return "Owner name must be at least 2 characters";
    }
    if (name.trim().length > 255) {
      return "Owner name must not exceed 255 characters";
    }
    // Check for potentially dangerous characters (basic XSS prevention)
    if (/<script|javascript:|onerror=|onclick=/i.test(name)) {
      return "Owner name contains invalid characters";
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return null; // Email is optional
    }
    if (!isValidEmail(email.trim())) {
      return "Invalid email format";
    }
    if (email.trim().length > 255) {
      return "Email must not exceed 255 characters";
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
      return null; // Phone is optional
    }
    // Remove formatting characters for validation
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length > 20) {
      return "Phone number is too long";
    }
    // Allow digits, spaces, dashes, parentheses, and plus sign
    if (!/^[\d\s\-\(\)\+]+$/.test(phone)) {
      return "Phone number contains invalid characters";
    }
    return null;
  };

  const validateDescription = (description: string): string | null => {
    if (!description.trim()) {
      return null; // Description is optional
    }
    if (description.trim().length > 1000) {
      return "Description must not exceed 1000 characters";
    }
    return null;
  };

  const validateAddress = (address: string): string | null => {
    if (!address.trim()) {
      return null; // Address is optional
    }
    if (address.trim().length > 500) {
      return "Address must not exceed 500 characters";
    }
    return null;
  };

  const validateOpeningBalance = (balance: string): string | null => {
    if (!balance.trim()) {
      return null; // Opening balance is optional
    }
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      return "Opening balance must be a valid number";
    }
    if (numBalance < 0) {
      return "Opening balance cannot be negative";
    }
    if (numBalance > 999999999999.99) {
      return "Opening balance is too large (maximum: 999,999,999,999.99)";
    }
    // Check decimal places (max 2)
    const decimalParts = balance.split('.');
    if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      return "Opening balance can have maximum 2 decimal places";
    }
    return null;
  };

  const validateOpeningDate = (date: string, hasBalance: boolean): string | null => {
    if (!hasBalance) {
      return null; // Date not required if no balance
    }
    if (!date.trim()) {
      return "Opening date is required when opening balance is provided";
    }
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (isNaN(selectedDate.getTime())) {
      return "Invalid date format";
    }
    if (selectedDate > today) {
      return "Opening date cannot be in the future";
    }
    return null;
  };

  const validateOwnerType = (ownerType: string): string | null => {
    const validTypes = ['CLIENT', 'COMPANY', 'EMPLOYEE', 'MAIN'];
    if (!ownerType) {
      return "Owner type is required";
    }
    if (!validTypes.includes(ownerType)) {
      return "Invalid owner type selected";
    }
    if (ownerType === 'SYSTEM') {
      return "SYSTEM owner type cannot be manually created";
    }
    return null;
  };

  const checkOwnerNameExists = async (name: string, excludeId?: number) => {
    if (!name.trim()) {
      setNameError(null);
      setCheckingName(false);
      return;
    }

    // First check basic validation
    const nameValidationError = validateName(name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    try {
      // Check if name exists by searching
      const url = new URL("/api/accountant/maintenance/owners", window.location.origin);
      url.searchParams.append("search", name.trim());
      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        const matchingOwner = Array.isArray(ownersList) 
          ? ownersList.find((owner: Owner) => 
              owner.name.toLowerCase() === name.trim().toLowerCase() && 
              (!excludeId || owner.id !== excludeId)
            )
          : null;
        
        if (matchingOwner) {
          setNameError("An owner with this name already exists.");
        } else {
          setNameError(null);
        }
      }
    } catch (error) {
      console.error("Error checking owner name:", error);
      setNameError(null);
    } finally {
      setCheckingName(false);
    }
  };

  const handleCreateOwnerConfirm = () => {
    setShowCreateOwnerConfirm(false);
    handleCreateOwner();
  };

  const handleCreateOwner = async () => {
    // Comprehensive validation
    const nameValidationError = validateName(formData.name);
    if (nameValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(nameValidationError);
      setShowCreateFail(true);
      return;
    }

    const ownerTypeError = validateOwnerType(formData.owner_type);
    if (ownerTypeError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(ownerTypeError);
      setShowCreateFail(true);
      return;
    }

    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(emailValidationError);
      setShowCreateFail(true);
      return;
    }

    const phoneValidationError = validatePhone(formData.phone);
    if (phoneValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(phoneValidationError);
      setShowCreateFail(true);
      return;
    }

    const descriptionValidationError = validateDescription(formData.description);
    if (descriptionValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(descriptionValidationError);
      setShowCreateFail(true);
      return;
    }

    const addressValidationError = validateAddress(formData.address);
    if (addressValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(addressValidationError);
      setShowCreateFail(true);
      return;
    }

    const openingBalanceValidationError = validateOpeningBalance(formData.opening_balance);
    if (openingBalanceValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(openingBalanceValidationError);
      setShowCreateFail(true);
      return;
    }

    const hasOpeningBalance = !!(formData.opening_balance && parseFloat(formData.opening_balance) > 0);
    const openingDateValidationError = validateOpeningDate(formData.opening_date, hasOpeningBalance);
    if (openingDateValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(openingDateValidationError);
      setShowCreateFail(true);
      return;
    }

    // Check for async validation errors
    if (nameError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    if (emailError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(emailError);
      setShowCreateFail(true);
      return;
    }

    // Check if name is still being validated
    if (checkingName) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage("Please wait while we verify the owner name");
      setShowCreateFail(true);
      return;
    }

    setShowCreateLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: formData.owner_type,
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          address: formData.address?.trim() || null,
          opening_balance: formData.opening_balance && parseFloat(formData.opening_balance) > 0 
            ? parseFloat(formData.opening_balance) 
            : null,
          opening_date: formData.opening_balance && parseFloat(formData.opening_balance) > 0 && formData.opening_date
            ? formData.opening_date
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchOwners();
        closeCreatePanel();
        setSuccessTitle("Owner Created Successfully");
        setSuccessMessage("The owner has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Owner");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create owner";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating owner:", error);
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage("An error occurred while creating the owner");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  const openUnitForm = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      // Convert ARCHIVED status to ACTIVE for editing (only ACTIVE/INACTIVE allowed)
      const editableStatus = (unit.status === "ACTIVE" || unit.status === "INACTIVE" ? unit.status : "ACTIVE");
      setUnitFormData({
        unit_name: unit.unit_name || "",
        property_id: unit.property_id || null,
        status: editableStatus as UnitStatus,
        notes: unit.notes || "",
      });
      // Set property search query to show selected property name
      if (unit.property_id && unit.property) {
        setPropertySearchQuery(unit.property.name);
      } else if (unit.property_id && properties.length > 0) {
        const selectedProperty = properties.find(p => p.id === unit.property_id);
        if (selectedProperty) {
          setPropertySearchQuery(selectedProperty.name);
        } else {
          setPropertySearchQuery("");
        }
      } else {
        setPropertySearchQuery("");
      }
    } else {
      setEditingUnit(null);
      setUnitFormData({
        unit_name: "",
        property_id: null,
        status: "ACTIVE",
        notes: "",
      });
      setPropertySearchQuery("");
    }
    setShowPropertyDropdown(false);
    setShowUnitForm(true);
  };

  const closeUnitForm = () => {
    setShowUnitForm(false);
    setEditingUnit(null);
    setUnitFormData({
      unit_name: "",
      property_id: null,
      status: "ACTIVE",
      notes: "",
    });
    setPropertySearchQuery("");
    setShowPropertyDropdown(false);
  };

  const handleSaveUnitConfirm = () => {
    setShowCreateUnitConfirm(false);
    handleSaveUnit();
  };

  const handleSaveUnit = async () => {
    if (!detailOwner?.id) return;
    if (!unitFormData.unit_name.trim()) {
      setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
      setCreateFailMessage("Unit name is required");
      setShowCreateFail(true);
      return;
    }

    // Validate status - only ACTIVE or INACTIVE allowed
    if (unitFormData.status !== "ACTIVE" && unitFormData.status !== "INACTIVE") {
      setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
      setCreateFailMessage("Status must be either ACTIVE or INACTIVE");
      setShowCreateFail(true);
      return;
    }

    setSavingUnit(true);
    setShowUnitLoading(true);
    try {
      const url = editingUnit
        ? `/api/accountant/maintenance/units/${editingUnit.id}`
        : `/api/accountant/maintenance/units`;
      const method = editingUnit ? "PUT" : "POST";

      // Ensure status is only ACTIVE or INACTIVE
      const statusToSend = unitFormData.status === "ACTIVE" || unitFormData.status === "INACTIVE" 
        ? unitFormData.status 
        : "ACTIVE";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: detailOwner.id,
          property_id: unitFormData.property_id || null,
          unit_name: unitFormData.unit_name.trim(),
          status: statusToSend,
          notes: unitFormData.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUnits(detailOwner.id);
        closeUnitForm();
        setSuccessTitle(editingUnit ? "Unit Updated Successfully" : "Unit Created Successfully");
        setSuccessMessage(editingUnit ? "The unit has been updated successfully." : "The unit has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
        const errorMsg = data.errors ? Object.values(data.errors).flat().join(", ") : data.message || `Failed to ${editingUnit ? "update" : "create"} unit`;
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error saving unit:", error);
      setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
      setCreateFailMessage(`An error occurred while ${editingUnit ? "updating" : "creating"} the unit`);
      setShowCreateFail(true);
    } finally {
      setSavingUnit(false);
      setShowUnitLoading(false);
    }
  };

  const handleSaveOwner = async (formData: Partial<Owner>) => {
    if (!detailOwner?.id) return;
    
    // Comprehensive validation
    const nameValidationError = validateName(formData.name || "");
    if (nameValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(nameValidationError);
      setShowCreateFail(true);
      return;
    }

    const ownerTypeError = validateOwnerType(formData.owner_type || "");
    if (ownerTypeError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(ownerTypeError);
      setShowCreateFail(true);
      return;
    }

    const emailValidationError = validateEmail(formData.email || "");
    if (emailValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(emailValidationError);
      setShowCreateFail(true);
      return;
    }

    const phoneValidationError = validatePhone(formData.phone || "");
    if (phoneValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(phoneValidationError);
      setShowCreateFail(true);
      return;
    }

    const descriptionValidationError = validateDescription(formData.description || "");
    if (descriptionValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(descriptionValidationError);
      setShowCreateFail(true);
      return;
    }

    const addressValidationError = validateAddress(formData.address || "");
    if (addressValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(addressValidationError);
      setShowCreateFail(true);
      return;
    }

    // Validate status - only ACTIVE, INACTIVE, or SUSPENDED allowed
    if (formData.status && formData.status !== "ACTIVE" && formData.status !== "INACTIVE" && formData.status !== "SUSPENDED" 
        && formData.status !== "active" && formData.status !== "inactive" && formData.status !== "suspended") {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("Status must be ACTIVE, INACTIVE, or SUSPENDED");
      setShowCreateFail(true);
      return;
    }

    // Check for async validation errors
    if (nameError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    if (emailError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(emailError);
      setShowCreateFail(true);
      return;
    }

    // Check if name is still being validated
    if (checkingName) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("Please wait while we verify the owner name");
      setShowCreateFail(true);
      return;
    }
    
    setSavingOwner(true);
    setShowSaveLoading(true);
    try {
      // Normalize status to uppercase
      const statusToSend = formData.status 
        ? (formData.status.toUpperCase() === "ACTIVE" || formData.status.toUpperCase() === "INACTIVE" || formData.status.toUpperCase() === "SUSPENDED"
            ? formData.status.toUpperCase() 
            : "ACTIVE")
        : "ACTIVE";

      // TypeScript guard: name is already validated above
      const ownerName = formData.name || "";
      
      const cleanedData: Record<string, any> = {
        owner_type: formData.owner_type,
        name: ownerName.trim(),
        description: formData.description?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        status: statusToSend,
      };

      const res = await fetch(`/api/accountant/maintenance/owners/${detailOwner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDetailOwner((prev) => (prev ? { ...prev, ...data.data } : null));
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}));
        setNameError(null);
        setEmailError(null);
        await fetchOwners();
        setSuccessTitle("Owner Updated Successfully");
        setSuccessMessage("The owner has been updated successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Update Owner");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to update owner";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("An error occurred while updating the owner");
      setShowCreateFail(true);
    } finally {
      setSavingOwner(false);
      setShowSaveLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-[#6A0D25]/30">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">Owners</h1>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Owner List</h2>
              <p className="text-sm text-gray-600 mt-1">Manage fund owners</p>
            </div>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 h-10 text-sm font-semibold bg-[#7a0f1f] text-white hover:opacity-95 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create Owner
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white border rounded-lg p-4 border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Owners</div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
            </div>
            <div className="bg-white border rounded-lg p-4 border-green-200 bg-green-50/50">
              <div className="text-sm text-gray-600 mb-1">Active</div>
              <div className="text-2xl font-bold text-green-700">{summaryStats.active}</div>
            </div>
            <div className="bg-white border rounded-lg p-4 border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Inactive</div>
              <div className="text-2xl font-bold text-gray-700">{summaryStats.inactive}</div>
            </div>
            <div className="bg-white border rounded-lg p-4 border-yellow-200 bg-yellow-50/50">
              <div className="text-sm text-gray-600 mb-1">Suspended</div>
              <div className="text-2xl font-bold text-yellow-700">{summaryStats.suspended}</div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6">
            {/* Filters Section - Lighter Design */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#7a0f1f]">
                  <Filter className="w-4 h-4" />
                  <label>Status</label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusFilter("ACTIVE")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      statusFilter === "ACTIVE"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter("INACTIVE")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      statusFilter === "INACTIVE"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Owner Type Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#7a0f1f]">
                  <User className="w-4 h-4" />
                  <label>Type</label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setOwnerTypeFilter("ALL")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      ownerTypeFilter === "ALL"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setOwnerTypeFilter("CLIENT")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      ownerTypeFilter === "CLIENT"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    Client
                  </button>
                  <button
                    onClick={() => setOwnerTypeFilter("COMPANY")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      ownerTypeFilter === "COMPANY"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    Company
                  </button>
                  <button
                    onClick={() => setOwnerTypeFilter("EMPLOYEE")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      ownerTypeFilter === "EMPLOYEE"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    Employee
                  </button>
                  <button
                    onClick={() => setOwnerTypeFilter("MAIN")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      ownerTypeFilter === "MAIN"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    Main
                  </button>
                  <button
                    onClick={() => setOwnerTypeFilter("SYSTEM")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      ownerTypeFilter === "SYSTEM"
                        ? "bg-[#7a0f1f] text-white shadow-sm border-[#7a0f1f]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#7a0f1f]/40"
                    }`}
                  >
                    System
                  </button>
                </div>
              </div>
            </div>

            {/* Search, View Toggle, and Sort Section */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              {/* Refresh Button */}
              <button
                onClick={() => fetchOwners()}
                className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-all hover:border-[#7a0f1f]/40"
                title="Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Search Input */}
              <div className="relative flex-1 group min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none z-10 transition-colors group-hover:text-[#7a0f1f]/70" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, type, phone, email..."
                  className="w-full rounded-md border border-gray-200 bg-white px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all hover:border-[#7a0f1f]/40 hover:bg-gray-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#7a0f1f] transition-colors p-0.5 rounded hover:bg-[#7a0f1f]/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-2 text-sm transition-all ${
                    viewMode === "cards" 
                      ? "bg-[#7a0f1f] text-white" 
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 text-sm transition-all ${
                    viewMode === "table" 
                      ? "bg-[#7a0f1f] text-white" 
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#7a0f1f]">
                  <ArrowUpDown className="w-4 h-4" />
                  <label>Sort</label>
                </div>
                <div className="relative min-w-[220px]">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm transition-all hover:border-[#7a0f1f]/40 hover:bg-gray-50/50 focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="date-desc">Date Created (Newest First)</option>
                    <option value="date-asc">Date Created (Oldest First)</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Pagination at the top */}
          {paginationMeta && (
            <Pagination
              paginationMeta={paginationMeta}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemName="owners"
            />
          )}

          <div className="mt-4">
            {loading ? (
              viewMode === "cards" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                  {[...Array(6)].map((_, i) => (
                    <OwnerCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <OwnerTableSkeleton />
              )
            ) : paginatedOwners.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800 mb-4">Create an owner or adjust your search.</div>
                <button
                  onClick={() => setShowCreatePanel(true)}
                  className="px-4 py-2 bg-[#7a0f1f] text-white rounded-md hover:opacity-95 transition-opacity inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Owner
                </button>
              </div>
            ) : viewMode === "cards" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                  {paginatedOwners.map((owner) => {
                    const isHighlighted = highlightOwnerId === owner.id;
                    return (
                      <div
                        key={owner.id}
                        className={`rounded-md bg-white border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all ${
                          isHighlighted ? "ring-2 ring-[#7a0f1f] ring-offset-2 bg-[#7a0f1f]/5" : ""
                        }`}
                        ref={(el) => {
                          if (isHighlighted && el) {
                            setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => openDetailDrawer(owner.id)}>
                            <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-md flex items-center justify-center">
                              <User className="w-5 h-5 text-[#7a0f1f]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-neutral-900">{owner.name}</h3>
                              <p className="text-sm text-neutral-600 mt-0.5">{owner.owner_type}</p>
                              {(owner.phone ?? owner.phone_number) && <p className="text-xs text-neutral-500 mt-0.5">{owner.phone ?? owner.phone_number}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(owner.status || "ACTIVE")}`}
                            >
                              {typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE"}
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => openDetailDrawer(owner.id)}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Created: {formatDate(owner.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div>
                <div className="rounded-md border bg-neutral-50 mb-2" style={{ borderColor: BORDER }}>
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-neutral-900">
                      <div className="min-w-[100px]">CODE</div>
                      <div className="min-w-[180px] border-l pl-3" style={{ borderColor: BORDER }}>NAME</div>
                      <div className="min-w-[120px] border-l pl-3" style={{ borderColor: BORDER }}>TYPE</div>
                      <div className="min-w-[140px] border-l pl-3" style={{ borderColor: BORDER }}>PHONE</div>
                      <div className="flex-1 min-w-0 border-l pl-3" style={{ borderColor: BORDER }}>EMAIL</div>
                      <div className="min-w-[100px] text-right border-l pl-3" style={{ borderColor: BORDER }}>STATUS</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {paginatedOwners.map((owner) => {
                    const isHighlighted = highlightOwnerId === owner.id;
                    return (
                    <div
                      key={owner.id}
                      onClick={() => openDetailDrawer(owner.id)}
                      className={`rounded-md bg-white border shadow-sm hover:shadow-md transition-all p-3 cursor-pointer ${
                        isHighlighted ? "ring-2 ring-[#7a0f1f] ring-offset-2 bg-[#7a0f1f]/5" : ""
                      }`}
                      style={{ borderColor: BORDER }}
                      ref={(el) => {
                        if (isHighlighted && el) {
                          setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4 text-sm">
                        {/* Owner Code */}
                        <div className="min-w-[100px]">
                          <div className="text-sm font-mono text-gray-900">
                            {owner.owner_code || "—"}
                          </div>
                        </div>

                        {/* Owner Name */}
                        <div className="min-w-[180px] border-l pl-3" style={{ borderColor: BORDER }}>
                          <div className="text-sm font-semibold text-gray-900 truncate" title={owner.name}>
                            {owner.name}
                          </div>
                        </div>

                        {/* Owner Type */}
                        <div className="min-w-[120px] border-l pl-3" style={{ borderColor: BORDER }}>
                          <div className="text-sm text-gray-900">
                            {owner.owner_type || "—"}
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="min-w-[140px] border-l pl-3" style={{ borderColor: BORDER }}>
                          <div className="text-sm text-gray-900 truncate" title={owner.phone ?? owner.phone_number ?? undefined}>
                            {owner.phone ?? owner.phone_number ?? "—"}
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex-1 min-w-0 border-l pl-3" style={{ borderColor: BORDER }}>
                          <div className="text-sm text-gray-900 truncate" title={owner.email ?? undefined}>
                            {owner.email || "—"}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-[100px] text-right border-l border-gray-200 pl-3">
                          <div className={`px-2 py-1 rounded text-xs font-semibold inline-block ${getStatusBadge(owner.status || "ACTIVE")}`}>
                            {typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE"}
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
              style={{
                animation: createPanelClosing
                  ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                  : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                <h2 className="text-lg font-bold">Create Owner</h2>
                <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Owner Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.owner_type}
                      onChange={(e) => setFormData({ ...formData, owner_type: e.target.value as OwnerType })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="CLIENT">Client</option>
                      <option value="COMPANY">Company</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MAIN">Main</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Owner code will be auto-generated</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Owner Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        nameError ? "border-red-500" : ""
                      }`}
                      style={nameError ? {} : { borderColor: BORDER }}
                      placeholder="e.g., John Doe"
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
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        descriptionError ? "border-red-500" : ""
                      }`}
                      style={descriptionError ? {} : { borderColor: BORDER }}
                      placeholder="Optional internal notes (e.g., Primary operational account)"
                      rows={3}
                    />
                    {descriptionError ? (
                      <p className="text-xs text-red-500 mt-1">{descriptionError}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Optional internal notes for clarification</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        emailError ? "border-red-500" : ""
                      }`}
                      style={emailError ? {} : { borderColor: BORDER }}
                      placeholder="e.g., john@example.com"
                    />
                    {emailError && (
                      <p className="text-xs text-red-500 mt-1">{emailError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Optional - recommended for CLIENT and EMPLOYEE</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        phoneError ? "border-red-500" : ""
                      }`}
                      style={phoneError ? {} : { borderColor: BORDER }}
                      placeholder="e.g., +63 917 123 4567"
                    />
                    {phoneError ? (
                      <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Optional - recommended for CLIENT and EMPLOYEE</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        addressError ? "border-red-500" : ""
                      }`}
                      style={addressError ? {} : { borderColor: BORDER }}
                      placeholder="Enter address"
                      rows={3}
                    />
                    {addressError && (
                      <p className="text-xs text-red-500 mt-1">{addressError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Opening Balance
                    </label>
                    <input
                      type="text"
                      value={formData.opening_balance}
                      onChange={(e) => {
                        // Allow only numbers, decimal point, and empty string
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setFormData({ ...formData, opening_balance: value });
                        }
                      }}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        openingBalanceError ? "border-red-500" : ""
                      }`}
                      style={openingBalanceError ? {} : { borderColor: BORDER }}
                      placeholder="0.00"
                    />
                    {openingBalanceError ? (
                      <p className="text-xs text-red-500 mt-1">{openingBalanceError}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Leave blank if no starting balance</p>
                    )}
                  </div>
                  {formData.opening_balance && parseFloat(formData.opening_balance) > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        Opening Date
                      </label>
                      <input
                        type="date"
                        value={formData.opening_date}
                        onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                          openingDateError ? "border-red-500" : ""
                        }`}
                        style={openingDateError ? {} : { borderColor: BORDER }}
                      />
                      {openingDateError ? (
                        <p className="text-xs text-red-500 mt-1">{openingDateError}</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Voucher date for the opening balance transaction</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={closeCreatePanel}
                  className="px-6 py-2.5 rounded-md font-semibold border-2 border-gray-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateOwnerConfirm(true)}
                  disabled={
                    showCreateLoading || 
                    !!nameError || 
                    !!emailError || 
                    !!phoneError || 
                    !!openingBalanceError || 
                    !!openingDateError || 
                    !!descriptionError || 
                    !!addressError ||
                    checkingName ||
                    !formData.name.trim() ||
                    !formData.owner_type
                  }
                  className="px-6 py-2.5 rounded-md font-semibold bg-[#7a0f1f] text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {showCreateLoading ? "Creating..." : "Create Owner"}
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
                    <h2 className="text-lg font-bold">{detailOwner ? detailOwner.name : loadingDetail ? "Loading..." : "Owner Details"}</h2>
                    {detailOwner?.owner_type && <p className="text-sm text-white/90 mt-0.5">{detailOwner.owner_type}</p>}
                  </div>
                  {detailOwner && (
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(detailOwner.status || "ACTIVE")}`}>
                      {(typeof detailOwner.status === "string" ? detailOwner.status.toUpperCase() : "ACTIVE")}
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
                    <OwnerDetailSkeleton />
                  </div>
                ) : !detailOwner ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load owner details.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner Code
                        </label>
                        <input
                          type="text"
                          value={detailFormData.owner_code || ""}
                          disabled
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none bg-gray-50 text-gray-600 cursor-not-allowed"
                          style={{ borderColor: BORDER }}
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-generated, cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={detailFormData.owner_type || "CLIENT"}
                          onChange={(e) => setDetailFormData({ ...detailFormData, owner_type: e.target.value as OwnerType })}
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                          disabled={detailOwner?.is_system === true}
                        >
                          <option value="CLIENT">Client</option>
                          <option value="COMPANY">Company</option>
                          <option value="EMPLOYEE">Employee</option>
                          <option value="MAIN">Main</option>
                          {detailOwner?.is_system && <option value="SYSTEM">System</option>}
                        </select>
                        {detailOwner?.is_system && (
                          <p className="text-xs text-gray-500 mt-1">System owners cannot change type</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner Name <span className="text-red-500">*</span>
                        </label>
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
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Description
                        </label>
                        <textarea
                          value={detailFormData.description || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, description: e.target.value })}
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                          placeholder="Optional internal notes (e.g., Primary operational account)"
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional internal notes for clarification</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Email
                        </label>
                        <div>
                          <input
                            type="email"
                            value={detailFormData.email || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, email: e.target.value })}
                            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                              emailError ? "border-red-500" : ""
                            }`}
                            style={emailError ? {} : { borderColor: BORDER }}
                          />
                          {emailError && (
                            <p className="text-xs text-red-500 mt-1">{emailError}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={detailFormData.phone || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, phone: formatPhoneNumber(e.target.value) })}
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Address
                        </label>
                        <textarea
                          value={detailFormData.address || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, address: e.target.value })}
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={(() => {
                            if (!detailFormData.status) return "ACTIVE";
                            const statusStr = String(detailFormData.status).toUpperCase();
                            return statusStr === "ACTIVE" || statusStr === "INACTIVE" || statusStr === "SUSPENDED" ? statusStr : "ACTIVE";
                          })()}
                          onChange={(e) => {
                            const newStatus = e.target.value.toUpperCase() as OwnerStatus;
                            // Ensure only valid statuses can be selected
                            if (newStatus === "ACTIVE" || newStatus === "INACTIVE" || newStatus === "SUSPENDED") {
                              setDetailFormData({ ...detailFormData, status: newStatus });
                            }
                          }}
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </div>
                    </div>

                    {/* Units Section */}
                    <div className="mt-8 pt-8 border-t" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-neutral-900">Units</h3>
                            <p className="text-sm text-neutral-600 mt-0.5">Manage units for this owner</p>
                          </div>
                          <button
                            onClick={() => openUnitForm()}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white hover:opacity-95"
                            style={{ background: "#7a0f1f" }}
                          >
                            <Plus className="w-4 h-4" />
                            Add Unit
                          </button>
                        </div>

                        {loadingUnits ? (
                          <div className="py-8 flex items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#7a0f1f]"></div>
                          </div>
                        ) : units.length === 0 ? (
                          <div className="py-8 text-center">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No units added yet</p>
                          </div>
                        ) : (
                          <div>
                            <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2 py-2 text-sm font-bold text-neutral-900">
                                    <div>Unit Name</div>
                                    <div>Property</div>
                                    <div>Status</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="w-20"></div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {units.map((unit) => (
                                <div
                                  key={unit.id}
                                  className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                                  style={{ borderColor: BORDER }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="min-w-0">
                                          <div className="font-semibold text-neutral-900 truncate">{unit.unit_name}</div>
                                          <div className="text-xs text-neutral-500 mt-0.5">Unit Name</div>
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-sm text-neutral-900 truncate">{unit.property?.name || "—"}</div>
                                          <div className="text-xs text-neutral-500 mt-0.5">Property</div>
                                        </div>
                                        <div className="min-w-0">
                                          <div
                                            className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block ${
                                              unit.status === "ACTIVE" ? "bg-green-100 text-green-700" : 
                                              unit.status === "INACTIVE" ? "bg-gray-100 text-gray-700" : 
                                              "bg-red-100 text-red-700"
                                            }`}
                                          >
                                            {unit.status}
                                          </div>
                                          <div className="text-xs text-neutral-500 mt-0.5">Status</div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <button
                                        onClick={() => openUnitForm(unit)}
                                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                        title="View unit"
                                      >
                                        <Eye className="w-4 h-4 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                  {unit.notes && (
                                    <div className="mt-3 pt-3 border-t" style={{ borderColor: BORDER }}>
                                      <div className="text-xs text-neutral-500 mb-1">Notes:</div>
                                      <div className="text-sm text-neutral-700 whitespace-pre-wrap">{unit.notes}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                  </div>
                )}
              </div>
              {detailOwner && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 flex items-center justify-end gap-3 p-4 z-10">
                  <button
                    onClick={() => handleSaveOwner(detailFormData)}
                    disabled={savingOwner || !!nameError || !!emailError}
                    className="px-6 py-2.5 rounded-md font-semibold bg-[#7a0f1f] text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingOwner ? "Saving..." : "Save"}
                  </button>
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
          title="Creating Owner" 
          message="Please wait while we create the owner..." 
        />
      )}

      {showSaveLoading && (
        <LoadingModal 
          isOpen={showSaveLoading} 
          title="Updating Owner" 
          message="Please wait while we update the owner..." 
        />
      )}

      {showUnitLoading && (
        <LoadingModal 
          isOpen={showUnitLoading} 
          title={editingUnit ? "Updating Unit" : "Creating Unit"} 
          message={editingUnit ? "Please wait while we update the unit..." : "Please wait while we create the unit..."} 
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
          title="Failed to Load Owner"
          message={detailLoadError}
          buttonText="Close"
        />
      )}

      <ConfirmationModal
        isOpen={showCreateOwnerConfirm}
        onClose={() => setShowCreateOwnerConfirm(false)}
        onConfirm={handleCreateOwnerConfirm}
        title="Create Owner"
        message={`Are you sure you want to create the owner "${formData.name.trim()}"?`}
        confirmText="Create"
        isLoading={showCreateLoading}
      />

      <ConfirmationModal
        isOpen={showCreateUnitConfirm}
        onClose={() => setShowCreateUnitConfirm(false)}
        onConfirm={handleSaveUnitConfirm}
        title="Create Unit"
        message={`Are you sure you want to create the unit "${unitFormData.unit_name.trim()}"?`}
        confirmText="Create"
        isLoading={showUnitLoading}
      />

      {/* Unit Form Side Panel */}
      {showUnitForm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-[350ms] opacity-100"
            onClick={closeUnitForm}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div>
                <h2 className="text-lg font-bold">{editingUnit ? "Edit Unit" : "Add New Unit"}</h2>
                <p className="text-sm text-white/90 mt-0.5">
                  {editingUnit ? "Update unit information" : "Fill in the details below to add a new unit."}
                </p>
              </div>
              <button
                onClick={closeUnitForm}
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
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unitFormData.unit_name}
                    onChange={(e) => setUnitFormData({ ...unitFormData, unit_name: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                    placeholder="Enter unit name"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-neutral-900 mb-2">Property</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                      <input
                        type="text"
                        value={propertySearchQuery}
                        onChange={(e) => {
                          setPropertySearchQuery(e.target.value);
                          setShowPropertyDropdown(true);
                        }}
                        onFocus={() => setShowPropertyDropdown(true)}
                        className="w-full rounded-md border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                        style={{ borderColor: BORDER }}
                        placeholder="Search properties..."
                      />
                      {unitFormData.property_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnitFormData({ ...unitFormData, property_id: null });
                            setPropertySearchQuery("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {showPropertyDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowPropertyDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" style={{ borderColor: BORDER }}>
                          {loadingProperties ? (
                            <div className="p-4 text-center text-sm text-gray-500">Loading properties...</div>
                          ) : filteredProperties.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No properties found</div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setUnitFormData({ ...unitFormData, property_id: null });
                                  setPropertySearchQuery("");
                                  setShowPropertyDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                  !unitFormData.property_id ? "bg-gray-50" : ""
                                }`}
                              >
                                <div className="font-medium">None (Optional)</div>
                              </button>
                              {filteredProperties.map((property) => (
                                <button
                                  key={property.id}
                                  onClick={() => {
                                    setUnitFormData({ ...unitFormData, property_id: property.id });
                                    setPropertySearchQuery(property.name);
                                    setShowPropertyDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t ${
                                    unitFormData.property_id === property.id ? "bg-gray-50" : ""
                                  }`}
                                  style={{ borderColor: BORDER }}
                                >
                                  <div className="font-medium">{property.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{property.property_type}</div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {unitFormData.property_id && (
                    <div className="mt-2 text-xs text-gray-600">
                      Selected: {properties.find(p => p.id === unitFormData.property_id)?.name || "Loading..."}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={unitFormData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as UnitStatus;
                      // Ensure only ACTIVE or INACTIVE can be selected
                      if (newStatus === "ACTIVE" || newStatus === "INACTIVE") {
                        setUnitFormData({ ...unitFormData, status: newStatus });
                      }
                    }}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                  <textarea
                    value={unitFormData.notes}
                    onChange={(e) => setUnitFormData({ ...unitFormData, notes: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
              <button
                onClick={closeUnitForm}
                  className="px-6 py-2.5 rounded-md font-semibold border-2 border-gray-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingUnit) {
                    handleSaveUnit();
                  } else {
                    setShowCreateUnitConfirm(true);
                  }
                }}
                disabled={savingUnit || !unitFormData.unit_name.trim()}
                className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#7a0f1f" }}
              >
                {savingUnit ? "Saving..." : editingUnit ? "Update" : "Create"}
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
