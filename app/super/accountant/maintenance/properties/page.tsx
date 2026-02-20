"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Grid, List, X, Inbox, Plus, Eye, Building2, ChevronDown } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type PropertyType = "CONDOMINIUM" | "HOUSE" | "LOT" | "COMMERCIAL";
type PropertyStatus = "ACTIVE" | "INACTIVE";

type Property = {
  id: number;
  name: string;
  property_type: PropertyType;
  address?: string | null;
  status: PropertyStatus;
  created_at?: string;
  updated_at?: string;
};

type UnitStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

type Unit = {
  id: number;
  owner_id?: number | null;
  property_id?: number | null;
  unit_name: string;
  status: UnitStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  owner?: {
    id: number;
    name: string;
  } | null;
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
const PropertyCardSkeleton = () => (
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

const PropertyTableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="rounded-md bg-white border shadow-sm p-4" style={{ borderColor: BORDER }}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
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

const PropertyDetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get initial values from URL params or defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE">((searchParams.get("status") as "ACTIVE" | "INACTIVE") || "ACTIVE");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyType | "ALL">((searchParams.get("property_type") as PropertyType | "ALL") || "ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
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
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailFormData, setDetailFormData] = useState<Partial<Property>>({});
  const [savingProperty, setSavingProperty] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [showCreatePropertyConfirm, setShowCreatePropertyConfirm] = useState(false);

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    property_type: "CONDOMINIUM" as PropertyType,
    address: "",
    status: "ACTIVE" as PropertyStatus,
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  // Sync URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter) params.set("status", statusFilter);
    if (propertyTypeFilter && propertyTypeFilter !== "ALL") params.set("property_type", propertyTypeFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (sortBy !== "date") params.set("sort_by", sortBy);
    if (sortOrder !== "desc") params.set("sort_order", sortOrder);
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, statusFilter, propertyTypeFilter, currentPage, sortBy, sortOrder, router]);

  useEffect(() => {
    fetchProperties();
  }, [searchQuery, statusFilter, propertyTypeFilter, currentPage, viewMode, sortBy, sortOrder]);

  // Debounce property name checking
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkPropertyNameExists(formData.name);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Debounce property name checking for detail form
  useEffect(() => {
    if (!detailProperty?.id || !detailFormData.name?.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkPropertyNameExists(detailFormData.name || "", detailProperty.id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [detailFormData.name, detailProperty?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, propertyTypeFilter, searchQuery, viewMode, sortBy, sortOrder]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/accountant/maintenance/properties", window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.append("search", searchQuery.trim());
      }
      if (statusFilter) {
        url.searchParams.append("status", statusFilter);
      }
      if (propertyTypeFilter && propertyTypeFilter !== "ALL") {
        url.searchParams.append("property_type", propertyTypeFilter);
      }
      const itemsPerPage = viewMode === "table" ? 10 : 30;
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", itemsPerPage.toString());
      url.searchParams.append("sort_by", sortBy);
      url.searchParams.append("sort_order", sortOrder);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        const propertiesList = data.data?.data || data.data || [];
        setProperties(Array.isArray(propertiesList) ? propertiesList : []);
        
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
        setProperties([]);
        setPaginationMeta(null);
      }
    } catch {
      setProperties([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async (propertyId: number) => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/units?property_id=${propertyId}`);
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

  const openDetailDrawer = async (propertyId: number) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    setDetailLoadError(null);
    try {
      const res = await fetch(`/api/accountant/maintenance/properties/${propertyId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setDetailProperty(data.data);
        setDetailFormData(data.data);
        // Fetch units for this property
        await fetchUnits(propertyId);
      } else {
        setDetailLoadError(data.message || "Failed to load property details");
      }
    } catch (error) {
      setDetailLoadError("An error occurred while loading property details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true);
    setTimeout(() => {
      setDetailDrawerOpen(false);
      setDetailDrawerClosing(false);
      setDetailProperty(null);
      setDetailFormData({});
      setDetailLoadError(null);
      setNameError(null);
      setUnits([]);
    }, 350);
  };

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreatePanel(false);
      setCreatePanelClosing(false);
      setFormData({
        name: "",
        property_type: "CONDOMINIUM",
        address: "",
        status: "ACTIVE",
      });
      setNameError(null);
      setCheckingName(false);
    }, 350);
  };

  const checkPropertyNameExists = async (name: string, excludeId?: number) => {
    if (!name.trim()) {
      setNameError(null);
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    try {
      const url = new URL("/api/accountant/maintenance/properties", window.location.origin);
      url.searchParams.append("search", name.trim());
      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (res.ok && data.success) {
        const propertiesList = data.data?.data || data.data || [];
        const matchingProperty = Array.isArray(propertiesList) 
          ? propertiesList.find((property: Property) => 
              property.name.toLowerCase() === name.trim().toLowerCase() && 
              (!excludeId || property.id !== excludeId)
            )
          : null;
        
        if (matchingProperty) {
          setNameError("A property with this name already exists.");
        } else {
          setNameError(null);
        }
      }
    } catch (error) {
      console.error("Error checking property name:", error);
      setNameError(null);
    } finally {
      setCheckingName(false);
    }
  };

  const handleCreatePropertyConfirm = () => {
    setShowCreatePropertyConfirm(false);
    handleCreateProperty();
  };

  const handleCreateProperty = async () => {
    if (!formData.name.trim()) {
      setFailTitle("Failed to Create Property");
      setCreateFailMessage("Property name is required");
      setShowCreateFail(true);
      return;
    }

    if (nameError) {
      setFailTitle("Failed to Create Property");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    setShowCreateLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          property_type: formData.property_type,
          address: formData.address?.trim() || null,
          status: formData.status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchProperties();
        closeCreatePanel();
        setSuccessTitle("Property Created Successfully");
        setSuccessMessage("The property has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Property");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create property";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating property:", error);
      setFailTitle("Failed to Create Property");
      setCreateFailMessage("An error occurred while creating the property");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  const handleSaveProperty = async (formData: Partial<Property>) => {
    if (!detailProperty?.id) return;
    
    if (!formData.name?.trim()) {
      setFailTitle("Failed to Update Property");
      setCreateFailMessage("Property name is required");
      setShowCreateFail(true);
      return;
    }

    if (!formData.property_type) {
      setFailTitle("Failed to Update Property");
      setCreateFailMessage("Property type is required");
      setShowCreateFail(true);
      return;
    }

    if (nameError) {
      setFailTitle("Failed to Update Property");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }
    
    setSavingProperty(true);
    setShowSaveLoading(true);
    try {
      const cleanedData: Record<string, any> = {
        name: formData.name.trim(),
        property_type: formData.property_type,
        address: formData.address?.trim() || null,
        status: formData.status,
      };

      const res = await fetch(`/api/accountant/maintenance/properties/${detailProperty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDetailProperty((prev) => (prev ? { ...prev, ...data.data } : null));
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}));
        setNameError(null);
        await fetchProperties();
        setSuccessTitle("Property Updated Successfully");
        setSuccessMessage("The property has been updated successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Update Property");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to update property";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch {
      setFailTitle("Failed to Update Property");
      setCreateFailMessage("An error occurred while updating the property");
      setShowCreateFail(true);
    } finally {
      setSavingProperty(false);
      setShowSaveLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Compact Properties bar - extension of sidebar */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Properties</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Property List</h2>
              <p className="text-sm text-gray-600 mt-1">Manage properties</p>
            </div>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "#7a0f1f", height: 40 }}
            >
              <Plus className="w-4 h-4" />
              Create Property
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
                onClick={() => setPropertyTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  propertyTypeFilter === "ALL"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={propertyTypeFilter !== "ALL" ? { borderColor: BORDER } : undefined}
              >
                All
              </button>
              <button
                onClick={() => setPropertyTypeFilter("CONDOMINIUM")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  propertyTypeFilter === "CONDOMINIUM"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={propertyTypeFilter !== "CONDOMINIUM" ? { borderColor: BORDER } : undefined}
              >
                Condominium
              </button>
              <button
                onClick={() => setPropertyTypeFilter("HOUSE")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  propertyTypeFilter === "HOUSE"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={propertyTypeFilter !== "HOUSE" ? { borderColor: BORDER } : undefined}
              >
                House
              </button>
              <button
                onClick={() => setPropertyTypeFilter("LOT")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  propertyTypeFilter === "LOT"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={propertyTypeFilter !== "LOT" ? { borderColor: BORDER } : undefined}
              >
                Lot
              </button>
              <button
                onClick={() => setPropertyTypeFilter("COMMERCIAL")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  propertyTypeFilter === "COMMERCIAL"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
                style={propertyTypeFilter !== "COMMERCIAL" ? { borderColor: BORDER } : undefined}
              >
                Commercial
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchProperties()}
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
                  placeholder="Search by name, type, address..."
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
                  <option value="date-desc">Date Created (Newest First)</option>
                  <option value="date-asc">Date Created (Oldest First)</option>
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
              itemName="properties"
            />
          )}

          <div className="mt-4">
            {loading ? (
              viewMode === "cards" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                  {[...Array(6)].map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <PropertyTableSkeleton />
              )
            ) : properties.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
                <div className="text-3xl font-bold text-[#5f0c18]">No data</div>
                <div className="mt-2 text-xs text-neutral-800">Create a property or adjust your search.</div>
              </div>
            ) : viewMode === "cards" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#7a0f1f]/10 rounded-md flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#7a0f1f]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900">{property.name}</h3>
                            <p className="text-sm text-neutral-600 mt-0.5">{property.property_type}</p>
                            {property.address && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{property.address}</p>}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 text-[11px] font-semibold rounded ${
                            property.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {property.status}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-neutral-500">Created: {formatDate(property.created_at)}</div>
                        <button
                          onClick={() => openDetailDrawer(property.id)}
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
                        <div>Type</div>
                        <div>Address</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-sm font-bold text-neutral-900 w-20">Status</div>
                      <div className="w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-[#7a0f1f]" />
                          </div>
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 truncate">{property.name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Name</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{property.property_type || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Type</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{property.address || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Address</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                              property.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {property.status}
                          </div>
                          <button
                            onClick={() => openDetailDrawer(property.id)}
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
                <h2 className="text-lg font-bold">Create Property</h2>
                <button onClick={closeCreatePanel} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Property Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 ${
                        nameError ? "border-red-500" : ""
                      }`}
                      style={nameError ? {} : { borderColor: BORDER }}
                      placeholder="e.g., Greenfield Residences"
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
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.property_type}
                      onChange={(e) => setFormData({ ...formData, property_type: e.target.value as PropertyType })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="CONDOMINIUM">Condominium</option>
                      <option value="HOUSE">House</option>
                      <option value="LOT">Lot</option>
                      <option value="COMMERCIAL">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                      style={{ borderColor: BORDER }}
                      placeholder="Enter property address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
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
                  onClick={() => setShowCreatePropertyConfirm(true)}
                  disabled={showCreateLoading || !!nameError}
                  className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#7a0f1f" }}
                >
                  {showCreateLoading ? "Creating..." : "Create Property"}
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
                    <h2 className="text-lg font-bold">{detailProperty ? detailProperty.name : loadingDetail ? "Loading..." : "Property Details"}</h2>
                    {detailProperty?.property_type && <p className="text-sm text-white/90 mt-0.5">{detailProperty.property_type}</p>}
                  </div>
                  {detailProperty && (
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        detailProperty.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detailProperty.status}
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
                    <PropertyDetailSkeleton />
                  </div>
                ) : !detailProperty ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load property details.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Property Name <span className="text-red-500">*</span>
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
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Property Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={detailFormData.property_type || "CONDOMINIUM"}
                          onChange={(e) => setDetailFormData({ ...detailFormData, property_type: e.target.value as PropertyType })}
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                        >
                          <option value="CONDOMINIUM">Condominium</option>
                          <option value="HOUSE">House</option>
                          <option value="LOT">Lot</option>
                          <option value="COMMERCIAL">Commercial</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Address</label>
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
                          value={detailFormData.status || "ACTIVE"}
                          onChange={(e) => setDetailFormData({ ...detailFormData, status: e.target.value as PropertyStatus })}
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                          style={{ borderColor: BORDER }}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Units Section */}
                    <div className="mt-8 pt-8 border-t" style={{ borderColor: BORDER }}>
                        <div className="mb-4">
                          <h3 className="text-base font-semibold text-neutral-900">Units</h3>
                          <p className="text-sm text-neutral-600 mt-0.5">Units associated with this property</p>
                        </div>

                        {loadingUnits ? (
                          <div className="py-8 flex items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#7a0f1f]"></div>
                          </div>
                        ) : units.length === 0 ? (
                          <div className="py-8 text-center">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No units associated with this property</p>
                          </div>
                        ) : (
                          <div>
                            <div className="rounded-md border bg-neutral-50 px-4 py-0 mb-3" style={{ borderColor: BORDER }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2 py-2 text-sm font-bold text-neutral-900">
                                    <div>Unit Name</div>
                                    <div>Owner</div>
                                    <div>Status</div>
                                  </div>
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
                                          <div className="text-sm text-neutral-900 truncate">{unit.owner?.name || "—"}</div>
                                          <div className="text-xs text-neutral-500 mt-0.5">Owner</div>
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
              {detailProperty && (
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
                  <button
                    onClick={() => handleSaveProperty(detailFormData)}
                    disabled={savingProperty || !!nameError}
                    className="px-6 py-2.5 rounded-md font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "#7a0f1f" }}
                  >
                    {savingProperty ? "Saving..." : "Save"}
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
          title="Creating Property" 
          message="Please wait while we create the property..." 
        />
      )}

      {showSaveLoading && (
        <LoadingModal 
          isOpen={showSaveLoading} 
          title="Updating Property" 
          message="Please wait while we update the property..." 
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
          title="Failed to Load Property"
          message={detailLoadError}
          buttonText="Close"
        />
      )}

      <ConfirmationModal
        isOpen={showCreatePropertyConfirm}
        onClose={() => setShowCreatePropertyConfirm(false)}
        onConfirm={handleCreatePropertyConfirm}
        title="Create Property"
        message={`Are you sure you want to create the property "${formData.name.trim()}"?`}
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
