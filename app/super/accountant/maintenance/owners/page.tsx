"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Grid, List, X, Inbox, Plus, Eye, User, Edit2, Building2 } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type OwnerType = "COMPANY" | "CLIENT" | "EMPLOYEE" | "INDIVIDUAL" | "PARTNER" | "PROPERTY" | "PROJECT";
type OwnerStatus = "active" | "inactive" | "archived";

type Owner = {
  id: number;
  owner_type: OwnerType;
  name: string;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  status: OwnerStatus;
  created_at?: string;
  updated_at?: string;
};

type UnitStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

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
  if (!paginationMeta || paginationMeta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: BORDER }}>
      <div className="text-sm text-neutral-600">
        Showing {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} {itemName}
      </div>
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
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<OwnerType | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
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
  const [detailOwner, setDetailOwner] = useState<Owner | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
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
    owner_type: "INDIVIDUAL" as OwnerType,
    name: "",
    phone_number: "",
    email: "",
    address: "",
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, [searchQuery, statusFilter, ownerTypeFilter, currentPage]);

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
    if (!formData.email.trim()) {
      setEmailError(null);
      return;
    }

    if (!isValidEmail(formData.email.trim())) {
      setEmailError("Invalid email format");
    } else {
      setEmailError(null);
    }
  }, [formData.email]);

  // Debounce owner name checking for edit mode
  useEffect(() => {
    if (!detailFormData.name?.trim() || !detailOwner?.id) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkOwnerNameExists(detailFormData.name || "", detailOwner.id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [detailFormData.name, detailOwner?.id]);

  // Filtering is now done on the backend, so we just use owners directly
  const paginatedOwners = owners;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, ownerTypeFilter, searchQuery]);

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
      setDetailEditing(false);
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
        owner_type: "INDIVIDUAL",
        name: "",
        phone_number: "",
        email: "",
        address: "",
      });
      setNameError(null);
      setEmailError(null);
      setCheckingName(false);
    }, 350);
  };

  const checkOwnerNameExists = async (name: string, excludeId?: number) => {
    if (!name.trim()) {
      setNameError(null);
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
    if (!formData.name.trim()) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage("Owner name is required");
      setShowCreateFail(true);
      return;
    }

    if (!formData.owner_type) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage("Owner type is required");
      setShowCreateFail(true);
      return;
    }

    // Email validation only if provided
    if (formData.email.trim() && emailError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(emailError);
      setShowCreateFail(true);
      return;
    }

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

    setShowCreateLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: formData.owner_type,
          name: formData.name.trim(),
          email: formData.email?.trim() || null,
          phone_number: formData.phone_number?.trim() || null,
          address: formData.address?.trim() || null,
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
      setUnitFormData({
        unit_name: unit.unit_name || "",
        property_id: unit.property_id || null,
        status: unit.status || "ACTIVE",
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

    setSavingUnit(true);
    setShowUnitLoading(true);
    try {
      const url = editingUnit
        ? `/api/accountant/maintenance/units/${editingUnit.id}`
        : `/api/accountant/maintenance/units`;
      const method = editingUnit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: detailOwner.id,
          property_id: unitFormData.property_id || null,
          unit_name: unitFormData.unit_name.trim(),
          status: unitFormData.status,
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
    
    if (!formData.name?.trim()) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("Owner name is required");
      setShowCreateFail(true);
      return;
    }

    if (!formData.owner_type) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("Owner type is required");
      setShowCreateFail(true);
      return;
    }

    // Email validation only if provided
    if (formData.email?.trim() && emailError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(emailError);
      setShowCreateFail(true);
      return;
    }

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
    
    setSavingOwner(true);
    setShowSaveLoading(true);
    try {
      const cleanedData: Record<string, any> = {
        owner_type: formData.owner_type,
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone_number: formData.phone_number?.trim() || null,
        address: formData.address?.trim() || null,
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
        setDetailEditing(false);
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
      {/* Compact Owners bar - extension of sidebar */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Owners</h1>
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
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Plus className="w-4 h-4" />
              Create Owner
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "active"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter !== "active" ? { borderColor: BORDER } : undefined}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === "inactive"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter !== "inactive" ? { borderColor: BORDER } : undefined}
              >
                Inactive
              </button>
              <span className="text-sm font-medium text-gray-700 ml-2">Type:</span>
              <button
                onClick={() => setOwnerTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "ALL"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "ALL" ? { borderColor: BORDER } : undefined}
              >
                All
              </button>
              <button
                onClick={() => setOwnerTypeFilter("INDIVIDUAL")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "INDIVIDUAL"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "INDIVIDUAL" ? { borderColor: BORDER } : undefined}
              >
                Individual
              </button>
              <button
                onClick={() => setOwnerTypeFilter("COMPANY")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "COMPANY"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "COMPANY" ? { borderColor: BORDER } : undefined}
              >
                Company
              </button>
              <button
                onClick={() => setOwnerTypeFilter("CLIENT")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "CLIENT"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "CLIENT" ? { borderColor: BORDER } : undefined}
              >
                Client
              </button>
              <button
                onClick={() => setOwnerTypeFilter("EMPLOYEE")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "EMPLOYEE"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "EMPLOYEE" ? { borderColor: BORDER } : undefined}
              >
                Employee
              </button>
              <button
                onClick={() => setOwnerTypeFilter("PARTNER")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "PARTNER"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "PARTNER" ? { borderColor: BORDER } : undefined}
              >
                Partner
              </button>
              <button
                onClick={() => setOwnerTypeFilter("PROPERTY")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "PROPERTY"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "PROPERTY" ? { borderColor: BORDER } : undefined}
              >
                Property
              </button>
              <button
                onClick={() => setOwnerTypeFilter("PROJECT")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  ownerTypeFilter === "PROJECT"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={ownerTypeFilter !== "PROJECT" ? { borderColor: BORDER } : undefined}
              >
                Project
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchOwners()}
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
                  placeholder="Search by name, type, phone, email..."
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
          {paginationMeta && paginationMeta.last_page > 1 && (
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
                <div className="mt-2 text-xs text-neutral-800">Create an owner or adjust your search.</div>
              </div>
            ) : viewMode === "cards" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                  {paginatedOwners.map((owner) => (
                    <div
                      key={owner.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-md flex items-center justify-center">
                            <User className="w-5 h-5 text-[#7a0f1f]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900">{owner.name}</h3>
                            <p className="text-sm text-neutral-600 mt-0.5">{owner.owner_type}</p>
                            {owner.phone_number && <p className="text-xs text-neutral-500 mt-0.5">{owner.phone_number}</p>}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 text-[11px] font-semibold rounded ${
                            owner.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {owner.status.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-neutral-500">Created: {formatDate(owner.created_at)}</div>
                        <button
                          onClick={() => openDetailDrawer(owner.id)}
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
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm font-bold text-neutral-900">
                        <div>Name</div>
                        <div>Type</div>
                        <div>Phone</div>
                        <div>Email</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-sm font-bold text-neutral-900 w-20">Status</div>
                      <div className="w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {paginatedOwners.map((owner) => (
                    <div
                      key={owner.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-[#7a0f1f]" />
                          </div>
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 truncate">{owner.name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Name</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{owner.owner_type || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Type</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{owner.phone_number || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Phone</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{owner.email || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Email</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                              owner.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {owner.status.toUpperCase()}
                          </div>
                          <button
                            onClick={() => openDetailDrawer(owner.id)}
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
                      <option value="COMPANY">Company</option>
                      <option value="CLIENT">Client</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="PARTNER">Partner</option>
                      <option value="PROPERTY">Property</option>
                      <option value="PROJECT">Project</option>
                    </select>
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
                      required
                    />
                    {emailError && (
                      <p className="text-xs text-red-500 mt-1">{emailError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: formatPhoneNumber(e.target.value) })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="e.g., +63 917 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="Enter address"
                      rows={3}
                    />
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
                  onClick={() => setShowCreateOwnerConfirm(true)}
                  disabled={showCreateLoading || !!nameError || !!emailError}
                  className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#7a0f1f" }}
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
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        detailOwner.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detailOwner.status.toUpperCase()}
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
                          Owner Type <span className="text-red-500">*</span>
                        </label>
                        {detailEditing ? (
                          <select
                            value={detailFormData.owner_type || "INDIVIDUAL"}
                            onChange={(e) => setDetailFormData({ ...detailFormData, owner_type: e.target.value as OwnerType })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          >
                            <option value="COMPANY">Company</option>
                            <option value="CLIENT">Client</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="PARTNER">Partner</option>
                            <option value="PROPERTY">Property</option>
                            <option value="PROJECT">Project</option>
                          </select>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailOwner.owner_type}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner Name <span className="text-red-500">*</span>
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
                          <div className="text-sm text-neutral-900">{detailOwner.name}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Email
                        </label>
                        {detailEditing ? (
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
                        ) : (
                          <div className="text-sm text-neutral-900">{detailOwner.email || "—"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Phone Number
                        </label>
                        {detailEditing ? (
                          <input
                            type="text"
                            value={detailFormData.phone_number || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, phone_number: formatPhoneNumber(e.target.value) })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{detailOwner.phone_number || "—"}</div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Address
                        </label>
                        {detailEditing ? (
                          <textarea
                            value={detailFormData.address || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, address: e.target.value })}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                            style={{ borderColor: BORDER }}
                            rows={3}
                          />
                        ) : (
                          <div className="text-sm text-neutral-900">{detailOwner.address || "—"}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Status
                        </label>
                        {detailEditing ? (
                          <div className="text-sm text-neutral-500 italic">Status cannot be changed here</div>
                        ) : (
                          <div className="text-sm text-neutral-900">{detailOwner.status.toUpperCase()}</div>
                        )}
                      </div>
                    </div>

                    {/* Units Section */}
                    {!detailEditing && (
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
                    )}
                  </div>
                )}
              </div>
              {detailOwner && (
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
                  {detailEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setDetailEditing(false);
                          setDetailFormData(detailOwner);
                          setNameError(null);
                          setEmailError(null);
                        }}
                        className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                        style={{ borderColor: BORDER }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveOwner(detailFormData)}
                        disabled={savingOwner || !!nameError || !!emailError}
                        className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60"
                        style={{ background: "#7a0f1f" }}
                      >
                        {savingOwner ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setDetailFormData({ ...detailOwner });
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
                    onChange={(e) => setUnitFormData({ ...unitFormData, status: e.target.value as UnitStatus })}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
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
                className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                style={{ borderColor: BORDER }}
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
