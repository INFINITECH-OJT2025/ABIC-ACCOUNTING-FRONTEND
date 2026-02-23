"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Upload, Info, Eye, Trash2, FileImage, Plus, FileText, ChevronDown, ChevronUp, Printer, Filter, Image as ImageIcon, ZoomIn, ZoomOut, Download, Calendar } from "lucide-react";
import TransactionSuccessModal from "@/components/ui/TransactionSuccessModal";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import html2canvas from "html2canvas";

const BORDER = "rgba(0,0,0,0.12)";

// Helper functions for validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned;
};

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
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Unit = {
  id: number;
  unit_name: string;
  owner_id: number | null;
  property_id: number | null;
  status: string;
  notes?: string | null;
};

type Property = {
  id: number;
  name: string;
  property_type: string;
  address?: string | null;
  status: string;
};

export default function WithdrawalPage() {
  const [voucherMode, setVoucherMode] = useState<"WITH_VOUCHER" | "NO_VOUCHER">("WITH_VOUCHER");
  
  const [formData, setFormData] = useState({
    voucher_date: "",
    voucher_no: "",
    transaction_type: "CASH" as TransactionType,
    instrument_type: "CASH" as string, // Default to CASH for initial transaction type
    instrument_no: "",
    fund_reference: "",
    person_in_charge: "",
    from_owner_id: null as number | null,
    to_owner_id: null as number | null,
    unit_id: null as number | null,
    unit_name: "",
    particulars: "",
    amount: "",
  });

  const [fromOwners, setFromOwners] = useState<Owner[]>([]);
  const [toOwners, setToOwners] = useState<Owner[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [fromOwnerSearchQuery, setFromOwnerSearchQuery] = useState("");
  const [toOwnerSearchQuery, setToOwnerSearchQuery] = useState("");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [showFromOwnerDropdown, setShowFromOwnerDropdown] = useState(false);
  const [showToOwnerDropdown, setShowToOwnerDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [loadingFromOwners, setLoadingFromOwners] = useState(false);
  const [loadingToOwners, setLoadingToOwners] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isAttachmentSectionOpen, setIsAttachmentSectionOpen] = useState(false);

  // Create Owner Panel State
  const [showCreateOwnerPanel, setShowCreateOwnerPanel] = useState(false);
  const [createOwnerPanelClosing, setCreateOwnerPanelClosing] = useState(false);
  const [createOwnerForm, setCreateOwnerForm] = useState({
    owner_type: "CLIENT" as string,
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    opening_balance: "",
    opening_date: "",
  });
  
  // Create Owner Validation States
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [openingBalanceError, setOpeningBalanceError] = useState<string | null>(null);
  const [openingDateError, setOpeningDateError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  // Create Unit Panel State
  const [showCreateUnitPanel, setShowCreateUnitPanel] = useState(false);
  const [createUnitPanelClosing, setCreateUnitPanelClosing] = useState(false);
  const [createUnitForm, setCreateUnitForm] = useState({
    unit_name: "",
    property_id: null as number | null,
    status: "ACTIVE" as string,
    notes: "",
  });

  // Properties state for unit creation
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  // Modal States
  const [showCreateOwnerConfirm, setShowCreateOwnerConfirm] = useState(false);
  const [showCreateOwnerLoading, setShowCreateOwnerLoading] = useState(false);
  const [showCreateOwnerSuccess, setShowCreateOwnerSuccess] = useState(false);
  const [showCreateOwnerFail, setShowCreateOwnerFail] = useState(false);
  const [createOwnerSuccessTitle, setCreateOwnerSuccessTitle] = useState("");
  const [createOwnerSuccessMessage, setCreateOwnerSuccessMessage] = useState("");
  const [createOwnerFailTitle, setCreateOwnerFailTitle] = useState("");
  const [createOwnerFailMessage, setCreateOwnerFailMessage] = useState("");

  // Unit Modal States
  const [showCreateUnitConfirm, setShowCreateUnitConfirm] = useState(false);
  const [showCreateUnitLoading, setShowCreateUnitLoading] = useState(false);
  const [showCreateUnitSuccess, setShowCreateUnitSuccess] = useState(false);
  const [showCreateUnitFail, setShowCreateUnitFail] = useState(false);
  const [createUnitSuccessTitle, setCreateUnitSuccessTitle] = useState("");
  const [createUnitSuccessMessage, setCreateUnitSuccessMessage] = useState("");
  const [createUnitFailTitle, setCreateUnitFailTitle] = useState("");
  const [createUnitFailMessage, setCreateUnitFailMessage] = useState("");

  // Withdrawal submission states
  const [showCreateWithdrawalLoading, setShowCreateWithdrawalLoading] = useState(false);
  const [showCreateWithdrawalSuccess, setShowCreateWithdrawalSuccess] = useState(false);
  const [successPanelClosing, setSuccessPanelClosing] = useState(false);
  const [showCreateWithdrawalFail, setShowCreateWithdrawalFail] = useState(false);
  const [createWithdrawalFailMessage, setCreateWithdrawalFailMessage] = useState("");
  const [successTransactionData, setSuccessTransactionData] = useState<{
    voucherMode: "WITH_VOUCHER" | "NO_VOUCHER";
    voucher_date?: string;
    voucher_no?: string;
    transaction_type: string;
    instrument_no?: string;
    instrumentNumbers?: string[];
    fromOwnerName: string;
    toOwnerName: string;
    unit_name?: string;
    particulars?: string;
    fund_reference?: string;
    person_in_charge?: string;
    attachmentsCount: number;
    amount: string;
  } | null>(null);

  // Constants for labels
  const title = "Withdrawal";
  const typeLabel = "Withdrawal Type";
  const recordDescription = "Record a new withdrawal transaction";
  const noVoucherLabel = "No Voucher Withdrawal";
  const actionLabel = "Create Withdrawal";

  /* ================= FUZZY SEARCH FUNCTION ================= */

  // Fuzzy search function - matches characters in order (not necessarily consecutive)
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!text || !query) return false;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    let queryIndex = 0;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length;
  };

  /* ================= FILTERS ================= */

  const filteredFromOwners = useMemo(() => {
    if (!fromOwnerSearchQuery.trim()) {
      return fromOwners.filter((owner) => {
        const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
        return status === "ACTIVE" && owner.owner_type === "MAIN";
      });
    }
    const q = fromOwnerSearchQuery.toLowerCase();
    return fromOwners.filter(
      (owner) => {
        const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
        return status === "ACTIVE" &&
          owner.owner_type === "MAIN" &&
          (owner.name?.toLowerCase().includes(q) ||
            owner.email?.toLowerCase().includes(q) ||
            owner.phone?.toLowerCase().includes(q));
      }
    );
  }, [fromOwners, fromOwnerSearchQuery]);

  const filteredToOwners = useMemo(() => {
    // Exclude MAIN type owners
    let filtered = toOwners.filter((owner) => {
      const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
      return status === "ACTIVE" && owner.owner_type !== "MAIN";
    });
    
    if (!toOwnerSearchQuery.trim()) {
      return filtered;
    }
    
    const q = toOwnerSearchQuery.trim();
    return filtered.filter(
      (owner) =>
        fuzzyMatch(owner.name || "", q) ||
        fuzzyMatch(owner.email || "", q) ||
        fuzzyMatch(owner.phone || "", q) ||
        owner.name?.toLowerCase().includes(q.toLowerCase()) ||
        owner.email?.toLowerCase().includes(q.toLowerCase()) ||
        owner.phone?.toLowerCase().includes(q.toLowerCase())
    );
  }, [toOwners, toOwnerSearchQuery]);

  const filteredUnits = useMemo(() => {
    if (!unitSearchQuery.trim()) {
      return units.filter((unit) => unit.status === "ACTIVE");
    }
    
    const q = unitSearchQuery.trim();
    return units.filter(
      (unit) =>
        unit.status === "ACTIVE" &&
        (fuzzyMatch(unit.unit_name || "", q) ||
        unit.unit_name?.toLowerCase().includes(q.toLowerCase()))
    );
  }, [units, unitSearchQuery]);

  /* ================= API FETCHING ================= */

  const fetchFromOwners = async () => {
    setLoadingFromOwners(true);
    try {
      // Fetch owners with type MAIN only (backend normalizes status to uppercase)
      const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all&owner_type=MAIN");
      const data = await res.json();
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        // Filter out SYSTEM owners - SYSTEM should not be used for normal transactions
        const filteredOwners = Array.isArray(ownersList) 
          ? ownersList.filter((owner: Owner) => owner.owner_type !== "SYSTEM")
          : [];
        setFromOwners(filteredOwners);
      } else {
        setFromOwners([]);
      }
    } catch (error) {
      console.error("Error fetching from owners:", error);
      setFromOwners([]);
    } finally {
      setLoadingFromOwners(false);
    }
  };

  const fetchToOwners = async (fromOwnerId?: number | null) => {
    setLoadingToOwners(true);
    try {
      // Fetch all active owners (backend normalizes status to uppercase)
      const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        let filteredOwners = Array.isArray(ownersList) ? ownersList : [];
        
        // Exclude MAIN type owners and SYSTEM owners
        // SYSTEM should only be used for OPENING, ADJUSTMENT, REVERSAL transactions, not for normal deposits/withdrawals
        filteredOwners = filteredOwners.filter((owner: Owner) => {
          const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
          return status === "ACTIVE" && owner.owner_type !== "MAIN" && owner.owner_type !== "SYSTEM";
        });
        
        // Exclude the selected from owner to prevent same-owner transactions
        if (fromOwnerId) {
          filteredOwners = filteredOwners.filter((owner: Owner) => owner.id !== fromOwnerId);
        }
        
        setToOwners(filteredOwners);
      } else {
        setToOwners([]);
      }
    } catch (error) {
      console.error("Error fetching to owners:", error);
      setToOwners([]);
    } finally {
      setLoadingToOwners(false);
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

  // Validation helper functions for create owner
  const validateName = (name: string | undefined | null): string | null => {
    if (!name || !name.trim()) {
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

  const validateEmail = (email: string | undefined | null): string | null => {
    if (!email || !email.trim()) {
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

  const validatePhone = (phone: string | undefined | null): string | null => {
    if (!phone || !phone.trim()) {
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

  const validateDescription = (description: string | undefined | null): string | null => {
    if (!description || !description.trim()) {
      return null; // Description is optional
    }
    if (description.trim().length > 1000) {
      return "Description must not exceed 1000 characters";
    }
    return null;
  };

  const validateAddress = (address: string | undefined | null): string | null => {
    if (!address || !address.trim()) {
      return null; // Address is optional
    }
    if (address.trim().length > 500) {
      return "Address must not exceed 500 characters";
    }
    return null;
  };

  const validateOpeningBalance = (balance: string | undefined | null): string | null => {
    if (!balance || !balance.trim()) {
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

  const validateOpeningDate = (date: string | undefined | null, hasBalance: boolean): string | null => {
    if (!hasBalance) {
      return null; // Date not required if no balance
    }
    if (!date || !date.trim()) {
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

  const validateOwnerType = (ownerType: string | undefined | null): string | null => {
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

  const checkOwnerNameExists = async (name: string | undefined | null) => {
    if (!name || !name.trim()) {
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
        const existingOwner = ownersList.find((owner: Owner) => 
          owner.name?.toUpperCase() === name.trim().toUpperCase()
        );
        
        if (existingOwner) {
          setNameError("Owner name already exists");
        } else {
          setNameError(null);
        }
      } else {
        setNameError(null); // If search fails, don't block creation
      }
    } catch (error) {
      console.error("Error checking owner name:", error);
      setNameError(null); // If check fails, don't block creation
    } finally {
      setCheckingName(false);
    }
  };

  // Validation effects for create owner form
  useEffect(() => {
    if (!createOwnerForm.name.trim()) {
      setNameError(null);
      setCheckingName(false);
      return;
    }
    const error = validateName(createOwnerForm.name);
    setNameError(error);
    if (!error) {
      // Debounce name checking
      const timeoutId = setTimeout(() => {
        checkOwnerNameExists(createOwnerForm.name);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [createOwnerForm.name]);

  useEffect(() => {
    const error = validateEmail(createOwnerForm.email);
    setEmailError(error);
  }, [createOwnerForm.email]);

  useEffect(() => {
    const error = validatePhone(createOwnerForm.phone);
    setPhoneError(error);
  }, [createOwnerForm.phone]);

  useEffect(() => {
    const error = validateDescription(createOwnerForm.description);
    setDescriptionError(error);
  }, [createOwnerForm.description]);

  useEffect(() => {
    const error = validateAddress(createOwnerForm.address);
    setAddressError(error);
  }, [createOwnerForm.address]);

  useEffect(() => {
    const error = validateOpeningBalance(createOwnerForm.opening_balance);
    setOpeningBalanceError(error);
    
    // Also validate date if balance is provided
    if (createOwnerForm.opening_balance && parseFloat(createOwnerForm.opening_balance) > 0) {
      const dateError = validateOpeningDate(createOwnerForm.opening_date, true);
      setOpeningDateError(dateError);
    } else {
      setOpeningDateError(null);
    }
  }, [createOwnerForm.opening_balance, createOwnerForm.opening_date]);

  useEffect(() => {
    fetchFromOwners();
    fetchToOwners();
    fetchProperties();
  }, []);

  const fetchUnits = async (ownerId?: number | null) => {
    if (!ownerId) {
      setUnits([]);
      return;
    }
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/units?owner_id=${ownerId}&status=ACTIVE`);
      const data = await res.json();
      if (res.ok && data.success) {
        const unitsList = data.data?.data || data.data || [];
        setUnits(Array.isArray(unitsList) ? unitsList : []);
      } else {
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
    fetchToOwners(formData.from_owner_id);
  }, [formData.from_owner_id]);

  useEffect(() => {
    fetchUnits(formData.to_owner_id);
  }, [formData.to_owner_id]);

  // Update from owner search query when from_owner_id changes
  useEffect(() => {
    if (formData.from_owner_id && fromOwners.length > 0) {
      const selectedOwner = fromOwners.find(owner => owner.id === formData.from_owner_id);
      if (selectedOwner && fromOwnerSearchQuery !== selectedOwner.name) {
        setFromOwnerSearchQuery(selectedOwner.name);
      }
    } else if (!formData.from_owner_id) {
      setFromOwnerSearchQuery("");
    }
  }, [formData.from_owner_id, fromOwners]);

  // Update to owner search query when to_owner_id changes
  useEffect(() => {
    if (formData.to_owner_id && toOwners.length > 0) {
      const selectedOwner = toOwners.find(owner => owner.id === formData.to_owner_id);
      if (selectedOwner && toOwnerSearchQuery !== selectedOwner.name) {
        setToOwnerSearchQuery(selectedOwner.name);
      }
    } else if (!formData.to_owner_id) {
      setToOwnerSearchQuery("");
      // Clear unit selection when to_owner_id is cleared
      setFormData({ ...formData, unit_id: null, unit_name: "" });
      setUnitSearchQuery("");
      setUnits([]);
    }
  }, [formData.to_owner_id, toOwners]);

  // Update unit search query when unit_id changes
  useEffect(() => {
    if (formData.unit_id && units.length > 0) {
      const selectedUnit = units.find(unit => unit.id === formData.unit_id);
      if (selectedUnit && unitSearchQuery !== selectedUnit.unit_name) {
        setUnitSearchQuery(selectedUnit.unit_name);
        setFormData({ ...formData, unit_name: selectedUnit.unit_name });
      }
    } else if (!formData.unit_id) {
      setUnitSearchQuery("");
      setFormData({ ...formData, unit_name: "" });
    }
  }, [formData.unit_id, units]);

  // Update property search query when property_id changes or properties are loaded
  useEffect(() => {
    if (createUnitForm.property_id && properties.length > 0) {
      const selectedProperty = properties.find(p => p.id === createUnitForm.property_id);
      if (selectedProperty && propertySearchQuery !== selectedProperty.name) {
        setPropertySearchQuery(selectedProperty.name);
      }
    } else if (!createUnitForm.property_id && propertySearchQuery && showCreateUnitPanel) {
      // Only clear if we're in the form and property_id is cleared
      setPropertySearchQuery("");
    }
  }, [createUnitForm.property_id, properties]);

  /* ================= CREATE UNIT ================= */

  const closeCreateUnitPanel = () => {
    setCreateUnitPanelClosing(true);
    setTimeout(() => {
      setShowCreateUnitPanel(false);
      setCreateUnitPanelClosing(false);
      setCreateUnitForm({
        unit_name: "",
        property_id: null,
        status: "ACTIVE",
        notes: "",
      });
      setPropertySearchQuery("");
      setShowPropertyDropdown(false);
    }, 350);
  };

  const handleCreateUnitConfirm = () => {
    setShowCreateUnitConfirm(false);
    handleCreateUnit();
  };

  const handleCreateUnit = async () => {
    if (!createUnitForm.unit_name.trim()) {
      setCreateUnitFailTitle("Validation Error");
      setCreateUnitFailMessage("Unit name is required");
      setShowCreateUnitFail(true);
      return;
    }

    if (!formData.to_owner_id) {
      setCreateUnitFailTitle("Validation Error");
      setCreateUnitFailMessage("Please select an Owner first");
      setShowCreateUnitFail(true);
      return;
    }

    // Validate status - only ACTIVE or INACTIVE allowed
    if (createUnitForm.status !== "ACTIVE" && createUnitForm.status !== "INACTIVE") {
      setCreateUnitFailTitle("Validation Error");
      setCreateUnitFailMessage("Status must be either ACTIVE or INACTIVE");
      setShowCreateUnitFail(true);
      return;
    }

    setShowCreateUnitLoading(true);
    try {
      const statusToSend = createUnitForm.status === "ACTIVE" || createUnitForm.status === "INACTIVE" 
        ? createUnitForm.status 
        : "ACTIVE";

      const res = await fetch("/api/accountant/maintenance/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: formData.to_owner_id,
          property_id: createUnitForm.property_id || null,
          unit_name: createUnitForm.unit_name.trim().toUpperCase(),
          status: statusToSend,
          notes: createUnitForm.notes?.trim() ? createUnitForm.notes.trim().toUpperCase() : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh units list
        await fetchUnits(formData.to_owner_id);
        // Select the newly created unit
        if (data.data?.id) {
          setFormData({ ...formData, unit_id: data.data.id, unit_name: data.data.unit_name });
          setUnitSearchQuery(data.data.unit_name);
        }
        // Close panel and reset form
        closeCreateUnitPanel();
        setCreateUnitSuccessTitle("Unit Created Successfully");
        setCreateUnitSuccessMessage("The unit has been created successfully.");
        setShowCreateUnitSuccess(true);
      } else {
        setCreateUnitFailTitle("Failed to Create Unit");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create unit";
        setCreateUnitFailMessage(errorMsg);
        setShowCreateUnitFail(true);
      }
    } catch (error) {
      console.error("Error creating unit:", error);
      setCreateUnitFailTitle("Failed to Create Unit");
      setCreateUnitFailMessage("An error occurred while creating the unit");
      setShowCreateUnitFail(true);
    } finally {
      setShowCreateUnitLoading(false);
    }
  };

  /* ================= CREATE OWNER ================= */

  const closeCreateOwnerPanel = () => {
    setCreateOwnerPanelClosing(true);
    setTimeout(() => {
      setShowCreateOwnerPanel(false);
      setCreateOwnerPanelClosing(false);
      setCreateOwnerForm({
        owner_type: "CLIENT",
        name: "",
        description: "",
        email: "",
        phone: "",
        address: "",
        opening_balance: "",
        opening_date: "",
      });
      // Reset validation errors
      setNameError(null);
      setEmailError(null);
      setPhoneError(null);
      setDescriptionError(null);
      setAddressError(null);
      setOpeningBalanceError(null);
      setOpeningDateError(null);
      setCheckingName(false);
    }, 350);
  };

  const handleCreateOwnerConfirm = () => {
    setShowCreateOwnerConfirm(false);
    handleCreateOwner();
  };

  const handleCreateOwner = async () => {
    // Comprehensive validation (same as owners page)
    const nameValidationError = validateName(createOwnerForm.name);
    if (nameValidationError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(nameValidationError);
      setShowCreateOwnerFail(true);
      return;
    }

    const ownerTypeError = validateOwnerType(createOwnerForm.owner_type);
    if (ownerTypeError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(ownerTypeError);
      setShowCreateOwnerFail(true);
      return;
    }

    const emailValidationError = validateEmail(createOwnerForm.email);
    if (emailValidationError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(emailValidationError);
      setShowCreateOwnerFail(true);
      return;
    }

    const phoneValidationError = validatePhone(createOwnerForm.phone);
    if (phoneValidationError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(phoneValidationError);
      setShowCreateOwnerFail(true);
      return;
    }

    const descriptionValidationError = validateDescription(createOwnerForm.description);
    if (descriptionValidationError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(descriptionValidationError);
      setShowCreateOwnerFail(true);
      return;
    }

    const addressValidationError = validateAddress(createOwnerForm.address);
    if (addressValidationError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(addressValidationError);
      setShowCreateOwnerFail(true);
      return;
    }

    const openingBalanceValidationError = validateOpeningBalance(createOwnerForm.opening_balance);
    if (openingBalanceValidationError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(openingBalanceValidationError);
      setShowCreateOwnerFail(true);
      return;
    }

    const hasOpeningBalance = !!(createOwnerForm.opening_balance && parseFloat(createOwnerForm.opening_balance) > 0);
    const openingDateValidationError = validateOpeningDate(createOwnerForm.opening_date, hasOpeningBalance);
    if (openingDateValidationError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(openingDateValidationError);
      setShowCreateOwnerFail(true);
      return;
    }

    // Check for async validation errors
    if (nameError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(nameError);
      setShowCreateOwnerFail(true);
      return;
    }

    if (emailError) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage(emailError);
      setShowCreateOwnerFail(true);
      return;
    }

    // Check if name is still being validated
    if (checkingName) {
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage("Please wait while we verify the owner name");
      setShowCreateOwnerFail(true);
      return;
    }

    setShowCreateOwnerLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: createOwnerForm.owner_type,
          name: createOwnerForm.name.trim(),
          description: createOwnerForm.description?.trim() || null,
          email: createOwnerForm.email?.trim() || null,
          phone: createOwnerForm.phone?.trim() || null,
          address: createOwnerForm.address?.trim() || null,
          opening_balance: createOwnerForm.opening_balance && parseFloat(createOwnerForm.opening_balance) > 0 
            ? parseFloat(createOwnerForm.opening_balance) 
            : null,
          opening_date: createOwnerForm.opening_balance && parseFloat(createOwnerForm.opening_balance) > 0 && createOwnerForm.opening_date
            ? createOwnerForm.opening_date
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh owners list
        await fetchToOwners(formData.from_owner_id);
        // Select the newly created owner
        if (data.data?.id) {
          setFormData({ ...formData, to_owner_id: data.data.id });
          setToOwnerSearchQuery(data.data.name);
        }
        // Close panel and reset form
        closeCreateOwnerPanel();
        setCreateOwnerSuccessTitle("Owner Created Successfully");
        setCreateOwnerSuccessMessage("The owner has been created successfully.");
        setShowCreateOwnerSuccess(true);
      } else {
        setCreateOwnerFailTitle("Failed to Create Owner");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create owner";
        setCreateOwnerFailMessage(errorMsg);
        setShowCreateOwnerFail(true);
      }
    } catch (error) {
      console.error("Error creating owner:", error);
      setCreateOwnerFailTitle("Failed to Create Owner");
      setCreateOwnerFailMessage("An error occurred while creating the owner");
      setShowCreateOwnerFail(true);
    } finally {
      setShowCreateOwnerLoading(false);
    }
  };

  /* ================= CONDITIONS ================= */

  const requiresFileUpload =
    formData.transaction_type === "CHEQUE" ||
    formData.transaction_type === "DEPOSIT_SLIP";

  // Show attachments list when:
  // - Deposit Type = With Voucher (always show)
  // - OR Deposit Type = No Voucher AND Transaction Type is Cheque or Deposit Slip
  const shouldShowAttachments =
    voucherMode === "WITH_VOUCHER" ||
    (voucherMode === "NO_VOUCHER" && requiresFileUpload);

  // Show upload section when Transaction Type is Cheque or Deposit Slip
  const shouldShowUploadSection = requiresFileUpload;

  // Determine instrument type based on transaction type
  const getInstrumentType = (): string => {
    switch (formData.transaction_type) {
      case "CHEQUE":
        return "CHEQUE";
      case "DEPOSIT_SLIP":
        return "DEPOSIT_SLIP";
      case "CASH":
        return "CASH";
      case "INTERNAL":
        return "BANK_TRANSFER";
      default:
        return "";
    }
  };

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

    // Auto-open attachment section when files are uploaded
    setIsAttachmentSectionOpen(true);

    // Auto-fill instrument_no from first file name (without extension) if not already set
    if (imageFiles.length > 0 && !formData.instrument_no.trim()) {
      const fileNameWithoutExt = imageFiles[0].name.replace(/\.[^/.]+$/, "");
      setFormData({ ...formData, instrument_no: fileNameWithoutExt });
    }

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

  /* ================= PREPARE DATA FOR API ================= */
  
  // Prepare transaction payload according to schema
  const prepareTransactionPayload = () => {
    // Clean and validate amount
    let amount = 0;
    if (formData.amount) {
      // Remove commas, spaces, and any non-numeric characters except decimal point
      const cleanedAmount = formData.amount.toString().replace(/[^\d.]/g, '');
      const parsedAmount = parseFloat(cleanedAmount);
      
      // Validate amount is a valid number and within realistic range
      if (!isNaN(parsedAmount) && parsedAmount >= 0.01 && parsedAmount <= 999999999.99) {
        // Round to 2 decimal places
        amount = Math.round(parsedAmount * 100) / 100;
      }
    }
    
    return {
      voucher_no: formData.voucher_no ? formData.voucher_no.toUpperCase().trim() : null,
      voucher_date: formData.voucher_date,
      trans_method: "WITHDRAWAL", // Always WITHDRAWAL for this page
      trans_type: formData.transaction_type, // CASH | CHEQUE | DEPOSIT_SLIP | INTERNAL
      from_owner_id: formData.from_owner_id,
      to_owner_id: formData.to_owner_id,
      unit_id: formData.unit_id || null,
      amount: amount,
      fund_reference: formData.fund_reference ? formData.fund_reference.toUpperCase().trim() : null,
      particulars: formData.particulars ? formData.particulars.toUpperCase().trim() : null,
      transfer_group_id: null, // Optional, can be set later if needed
      person_in_charge: formData.person_in_charge ? formData.person_in_charge.toUpperCase().trim() : null,
      // created_by will be handled by backend from session
    };
  };

  // Prepare transaction_instruments payload
  const prepareTransactionInstrumentsPayload = () => {
    const instruments = [];
    const seenInstrumentNos = new Set<string>();
    
    // If there's a manually entered instrument_no, add it
    if (formData.instrument_no.trim()) {
      const manualInstrumentNo = formData.instrument_no.toUpperCase().trim();
      instruments.push({
        instrument_type: formData.instrument_type || formData.transaction_type,
        instrument_no: manualInstrumentNo,
        notes: null,
      });
      seenInstrumentNos.add(manualInstrumentNo);
    }
    
    // Add instruments from uploaded files (excluding voucher)
    // Skip if the file name matches the manually entered instrument_no to avoid duplicates
    uploadedFiles.forEach((file) => {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
      // Only add if not already added (either manually or from another file)
      if (!seenInstrumentNos.has(fileNameWithoutExt)) {
        instruments.push({
          instrument_type: formData.instrument_type || formData.transaction_type,
          instrument_no: fileNameWithoutExt,
          notes: null,
        });
        seenInstrumentNos.add(fileNameWithoutExt);
      }
    });
    
    return instruments;
  };

  // Prepare transaction_attachments payload (file metadata)
  const prepareTransactionAttachmentsPayload = () => {
    const attachments = [];
    
    // Add voucher file if exists
    if (voucherFile) {
      attachments.push({
        file_name: voucherFile.name,
        file_type: voucherFile.type || voucherFile.name.split('.').pop() || null,
        // file_path will be set by backend after upload
      });
    }
    
    // Add uploaded files
    uploadedFiles.forEach((file) => {
      attachments.push({
        file_name: file.name,
        file_type: file.type || file.name.split('.').pop() || null,
        // file_path will be set by backend after upload
      });
    });
    
    return attachments;
  };

  // Prepare complete payload for API submission
  const prepareWithdrawalPayload = () => {
    return {
      transaction: prepareTransactionPayload(),
      instruments: prepareTransactionInstrumentsPayload(),
      attachments: prepareTransactionAttachmentsPayload(),
      // Files will be sent separately as FormData
      files: {
        voucher: voucherFile,
        uploaded: uploadedFiles,
      },
    };
  };

  const handleCreateWithdrawal = async () => {
    // 🔥 Frontend validation (UX) - Backend will re-validate everything
    // Validate required fields
    if (!formData.from_owner_id) {
      setCreateWithdrawalFailMessage("From Owner is required");
      setShowCreateWithdrawalFail(true);
      return;
    }

    if (!formData.to_owner_id) {
      setCreateWithdrawalFailMessage("To Owner is required");
      setShowCreateWithdrawalFail(true);
      return;
    }

    if (formData.from_owner_id === formData.to_owner_id) {
      setCreateWithdrawalFailMessage("From Owner and To Owner cannot be the same");
      setShowCreateWithdrawalFail(true);
      return;
    }

    // Validate amount
    if (!formData.amount || !formData.amount.toString().trim()) {
      setCreateWithdrawalFailMessage("Amount is required");
      setShowCreateWithdrawalFail(true);
      return;
    }
    
    // Clean and validate amount
    const cleanedAmount = formData.amount.toString().replace(/[^\d.]/g, '');
    const parsedAmount = parseFloat(cleanedAmount);
    
    if (isNaN(parsedAmount) || parsedAmount < 0.01) {
      setCreateWithdrawalFailMessage("Amount must be at least ₱0.01");
      setShowCreateWithdrawalFail(true);
      return;
    }
    
    if (parsedAmount > 999999999.99) {
      setCreateWithdrawalFailMessage("Amount cannot exceed ₱999,999,999.99");
      setShowCreateWithdrawalFail(true);
      return;
    }

    if (!formData.particulars || !formData.particulars.trim()) {
      setCreateWithdrawalFailMessage("Particulars is required");
      setShowCreateWithdrawalFail(true);
      return;
    }

    // 🔥 10️⃣ Enforce voucher mode: if voucher_no exists, voucher_date must exist
    if (voucherMode === "WITH_VOUCHER") {
      if (!formData.voucher_date) {
        setCreateWithdrawalFailMessage("Voucher Date is required when voucher mode is enabled");
        setShowCreateWithdrawalFail(true);
        return;
      }
      if (!formData.voucher_no || !formData.voucher_no.trim()) {
        setCreateWithdrawalFailMessage("Voucher Number is required when voucher mode is enabled");
        setShowCreateWithdrawalFail(true);
        return;
      }
    }

    // If voucher_no is provided, voucher_date must be provided
    if (formData.voucher_no && formData.voucher_no.trim() && !formData.voucher_date) {
      setCreateWithdrawalFailMessage("Voucher Date is required when Voucher Number is provided");
      setShowCreateWithdrawalFail(true);
      return;
    }

    const payload = prepareWithdrawalPayload();
    const formDataToSend = new FormData();
    
    // 🔥 9️⃣ Do NOT send transaction_category - backend will set it automatically
    formDataToSend.append("transaction", JSON.stringify(payload.transaction));
    formDataToSend.append("instruments", JSON.stringify(payload.instruments));
    formDataToSend.append("attachments", JSON.stringify(payload.attachments));
    if (voucherFile) formDataToSend.append("voucher", voucherFile);
    payload.files.uploaded.forEach((file, index) => {
      formDataToSend.append(`file_${index}`, file);
    });

    setShowCreateWithdrawalLoading(true);
    try {
      const res = await fetch("/api/accountant/transactions/withdrawal", {
        method: "POST",
        body: formDataToSend,
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Store transaction data before resetting
        const getAllInstrumentNumbers = (): string[] => {
          const instrumentNumbers: string[] = [];
          uploadedFiles.forEach((file) => {
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            instrumentNumbers.push(fileName);
          });
          if (instrumentNumbers.length === 0 && formData.instrument_no.trim()) {
            instrumentNumbers.push(formData.instrument_no);
          }
          return instrumentNumbers;
        };

        const fromOwnerName = formData.from_owner_id 
          ? (fromOwners.find(owner => owner.id === formData.from_owner_id)?.name || "—")
          : "—";
        
        const toOwnerName = formData.to_owner_id 
          ? (toOwners.find(owner => owner.id === formData.to_owner_id)?.name || "—")
          : "—";

        const transactionDataForSuccess = {
          voucherMode,
          voucher_date: formData.voucher_date,
          voucher_no: formData.voucher_no,
          transaction_type: formData.transaction_type,
          instrument_no: formData.instrument_no,
          instrumentNumbers: getAllInstrumentNumbers(),
          fromOwnerName,
          toOwnerName,
          unit_name: formData.unit_name,
          particulars: formData.particulars,
          fund_reference: formData.fund_reference,
          person_in_charge: formData.person_in_charge,
          attachmentsCount: [voucherFile, ...uploadedFiles].filter(Boolean).length,
          amount: formData.amount,
        };

        setSuccessTransactionData(transactionDataForSuccess);

        // Save receipt as image
        saveReceiptAsImage(transactionDataForSuccess, data.data?.id || null, "WITHDRAWAL");

        setShowCreateWithdrawalLoading(false);
        resetForm();
        setShowCreateWithdrawalSuccess(true);
      } else {
        setShowCreateWithdrawalLoading(false);
        setCreateWithdrawalFailMessage(
          data.errors ? Object.values(data.errors).flat().join(", ") : data.message || "Failed to create withdrawal"
        );
        setShowCreateWithdrawalFail(true);
      }
    } catch (err) {
      setShowCreateWithdrawalLoading(false);
      setCreateWithdrawalFailMessage("An error occurred while creating the withdrawal.");
      setShowCreateWithdrawalFail(true);
    }
  };

  /* ================= SAVE RECEIPT AS IMAGE ================= */

  const saveReceiptAsImage = async (
    transactionData: typeof successTransactionData,
    transactionId: number | null,
    transactionType: "DEPOSIT" | "WITHDRAWAL"
  ) => {
    if (!transactionData) return;

    try {
      // Generate the print HTML (same as handleSuccessPrint)
      const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      };

      const formatAmount = (amount: string) => {
        if (!amount) return "₱ 0.00";
        return `₱ ${parseFloat(amount.replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const getTransactionTypeLabel = (type: string) => {
        switch (type) {
          case "CHEQUE": return "Cheque";
          case "DEPOSIT_SLIP": return "Deposit Slip";
          case "CASH": return "Cash";
          case "INTERNAL": return "Internal";
          default: return type || "—";
        }
      };

      const voucherMode = transactionData.voucherMode;
      const formData = {
        voucher_date: transactionData.voucher_date,
        voucher_no: transactionData.voucher_no,
        transaction_type: transactionData.transaction_type,
        instrument_no: transactionData.instrument_no || "",
        unit_name: transactionData.unit_name,
        particulars: transactionData.particulars,
        fund_reference: transactionData.fund_reference,
        person_in_charge: transactionData.person_in_charge,
        amount: transactionData.amount,
      };
      const instrumentNumbers = transactionData.instrumentNumbers || [];
      const fromOwnerName = transactionData.fromOwnerName;
      const toOwnerName = transactionData.toOwnerName;
      const attachmentsCount = transactionData.attachmentsCount;

      const printHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Transaction Summary</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: white;
                padding: 20px;
                color: #111827;
              }
              .summary-wrapper {
                max-width: 100%;
                margin: 0 auto;
              }
              .summary-container {
                border-radius: 8px;
                border: 2px solid #4A081A;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(74, 8, 26, 0.15), 0 2px 4px -1px rgba(74, 8, 26, 0.08);
              }
              .summary-header {
                background-color: #4A081A !important;
                background: #4A081A !important;
                color: white !important;
                padding: 16px 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .summary-header h3 {
                font-size: 16px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin: 0;
                color: white !important;
              }
              .summary-content {
                background: white;
                padding: 24px;
              }
              .summary-section {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #FFE5EC;
              }
              .summary-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
              }
              .summary-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .summary-row + .summary-row {
                margin-top: 8px;
              }
              .summary-label {
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .summary-value {
                font-size: 14px;
                font-weight: 600;
                color: #111827;
                text-align: right;
                max-width: 60%;
                word-wrap: break-word;
              }
              .summary-value-medium {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
                text-align: right;
                max-width: 60%;
                word-wrap: break-word;
              }
              .summary-sub-label {
                font-size: 12px;
                color: #4b5563;
              }
              .summary-sub-value {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
                text-align: right;
              }
              .summary-text {
                font-size: 14px;
                color: #111827;
                line-height: 1.6;
                word-wrap: break-word;
                margin-top: 4px;
              }
              .summary-amount-box {
                background-color: #f3f4f6 !important;
                background: #f3f4f6 !important;
                padding: 12px 16px;
                border-radius: 6px;
                margin-top: 8px;
              }
              .summary-amount-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .summary-amount-label {
                font-size: 14px;
                font-weight: 700;
                color: #111827;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .summary-amount-value {
                font-size: 24px;
                font-weight: 700;
                color: #4A081A !important;
              }
              .summary-space-y-2 > * + * {
                margin-top: 8px;
              }
            </style>
          </head>
          <body>
            <div class="summary-wrapper">
              <div class="summary-container">
                <div class="summary-header">
                  <h3>Transaction Summary</h3>
                </div>
                <div class="summary-content">
                  <div class="summary-section">
                    <div class="summary-row">
                      <span class="summary-label">${transactionType === "DEPOSIT" ? "Deposit Type" : "Withdrawal Type"}</span>
                      <span class="summary-value">${voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}</span>
                    </div>
                  </div>
                  ${voucherMode === "WITH_VOUCHER" && (formData.voucher_date || formData.voucher_no) ? `
                  <div class="summary-section summary-space-y-2">
                    ${formData.voucher_date ? `
                    <div class="summary-row">
                      <span class="summary-sub-label">Voucher Date</span>
                      <span class="summary-sub-value">${formatDate(formData.voucher_date)}</span>
                    </div>
                    ` : ''}
                    ${formData.voucher_no ? `
                    <div class="summary-row">
                      <span class="summary-sub-label">Voucher No.</span>
                      <span class="summary-sub-value" style="font-family: monospace;">${formData.voucher_no}</span>
                    </div>
                    ` : ''}
                  </div>
                  ` : ''}
                  <div class="summary-section">
                    <div class="summary-row">
                      <span class="summary-label">Transaction Type</span>
                      <span class="summary-value">${getTransactionTypeLabel(formData.transaction_type)}</span>
                    </div>
                    ${instrumentNumbers.length > 0 ? `
                    <div style="margin-top: 8px;">
                      <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">${formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL" ? "Transaction Instrument" : "Instrument No."}</div>
                      ${instrumentNumbers.map(num => `
                        <div class="summary-row" style="margin-top: 4px;">
                          <span class="summary-sub-value" style="width: 100%; text-align: right;">${num}</span>
                        </div>
                      `).join('')}
                    </div>
                    ` : formData.instrument_no.trim() ? `
                    <div class="summary-row">
                      <span class="summary-sub-label">${formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL" ? "Transaction Instrument" : "Instrument No."}</span>
                      <span class="summary-sub-value">${formData.instrument_no}</span>
                    </div>
                    ` : ''}
                  </div>
                  <div class="summary-section summary-space-y-2">
                    <div class="summary-row">
                      <span class="summary-label">Main</span>
                      <span class="summary-value-medium" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fromOwnerName}</span>
                    </div>
                    <div class="summary-row">
                      <span class="summary-label">Owner</span>
                      <span class="summary-value-medium" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${toOwnerName}</span>
                    </div>
                  </div>
                  ${formData.unit_name ? `
                  <div class="summary-section">
                    <div class="summary-row">
                      <span class="summary-label">Unit</span>
                      <span class="summary-value-medium">${formData.unit_name}</span>
                    </div>
                  </div>
                  ` : ''}
                  ${formData.particulars ? `
                  <div class="summary-section">
                    <div>
                      <span class="summary-label" style="display: block; margin-bottom: 4px;">Particulars</span>
                      <p class="summary-text" style="text-align: right;">${formData.particulars}</p>
                    </div>
                  </div>
                  ` : ''}
                  ${formData.fund_reference ? `
                  <div class="summary-section">
                    <div class="summary-row">
                      <span class="summary-label">Fund Reference</span>
                      <span class="summary-value-medium">${formData.fund_reference}</span>
                    </div>
                  </div>
                  ` : ''}
                  ${formData.person_in_charge ? `
                  <div class="summary-section">
                    <div class="summary-row">
                      <span class="summary-label">Person in Charge</span>
                      <span class="summary-value-medium">${formData.person_in_charge}</span>
                    </div>
                  </div>
                  ` : ''}
                  ${attachmentsCount > 0 ? `
                  <div class="summary-section">
                    <div class="summary-row">
                      <span class="summary-label">Attachments</span>
                      <span class="summary-value-medium">${attachmentsCount} file${attachmentsCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  ` : ''}
                  <div class="summary-section">
                    <div class="summary-amount-box">
                      <div class="summary-amount-row">
                        <span class="summary-amount-label">Total Amount</span>
                        <span class="summary-amount-value">${formatAmount(formData.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Create a temporary iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '1200px';
      document.body.appendChild(iframe);

      return new Promise<void>((resolve) => {
        iframe.onload = async () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
              document.body.removeChild(iframe);
              resolve();
              return;
            }

            iframeDoc.open();
            iframeDoc.write(printHTML);
            iframeDoc.close();

            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 500));

            const bodyElement = iframeDoc.body;
            if (!bodyElement) {
              document.body.removeChild(iframe);
              resolve();
              return;
            }

            // Convert to canvas
            const canvas = await html2canvas(bodyElement, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              logging: false,
            });

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
              if (!blob) {
                document.body.removeChild(iframe);
                resolve();
                return;
              }

              // Create FormData and upload
              const formDataToSend = new FormData();
              formDataToSend.append('receipt_image', blob, `receipt_${Date.now()}.png`);
              formDataToSend.append('transaction_type', transactionType);
              if (transactionId) {
                formDataToSend.append('transaction_id', transactionId.toString());
              }
              formDataToSend.append('receipt_data', JSON.stringify(transactionData));

              try {
                const response = await fetch('/api/accountant/saved-receipts', {
                  method: 'POST',
                  body: formDataToSend,
                });

                // Silently fail - don't show error to user
                if (!response.ok) {
                  console.error('Failed to save receipt');
                }
              } catch (error) {
                console.error('Error saving receipt:', error);
              }

              document.body.removeChild(iframe);
              resolve();
            }, 'image/png', 0.95);
          } catch (error) {
            console.error('Error generating receipt image:', error);
            document.body.removeChild(iframe);
            resolve();
          }
        };

        iframe.src = 'about:blank';
      });
    } catch (error) {
      console.error('Error in saveReceiptAsImage:', error);
    }
  };

  /* ================= PRINT & DOWNLOAD FOR SUCCESS MODAL ================= */

  const handleSuccessPrint = () => {
    if (!successTransactionData) return;

    const formatDate = (dateString?: string) => {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    const formatAmount = (amount: string) => {
      if (!amount) return "₱ 0.00";
      return `₱ ${parseFloat(amount.replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getTransactionTypeLabel = (type: string) => {
      switch (type) {
        case "CHEQUE": return "Cheque";
        case "DEPOSIT_SLIP": return "Deposit Slip";
        case "CASH": return "Cash";
        case "INTERNAL": return "Internal";
        default: return type || "—";
      }
    };

    const voucherMode = successTransactionData.voucherMode;
    const formData = {
      voucher_date: successTransactionData.voucher_date,
      voucher_no: successTransactionData.voucher_no,
      transaction_type: successTransactionData.transaction_type,
      instrument_no: successTransactionData.instrument_no || "",
      unit_name: successTransactionData.unit_name,
      particulars: successTransactionData.particulars,
      fund_reference: successTransactionData.fund_reference,
      person_in_charge: successTransactionData.person_in_charge,
      amount: successTransactionData.amount,
    };
    const instrumentNumbers = successTransactionData.instrumentNumbers || [];
    const fromOwnerName = successTransactionData.fromOwnerName;
    const toOwnerName = successTransactionData.toOwnerName;
    const attachmentsCount = successTransactionData.attachmentsCount;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build the HTML structure matching the exact summary structure
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Summary</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              size: Envelope #10;
              margin: 0;
            }
            @media print {
              @page {
                size: Envelope #10;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .summary-wrapper {
                margin: 0;
              }
              .summary-container {
                border-radius: 0 !important;
                margin: 0;
              }
              .summary-amount-box {
                border-radius: 0 !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: white;
              padding: 20px;
              color: #111827;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .summary-wrapper {
              max-width: 100%;
              margin: 0 auto;
            }
            .summary-container {
              border-radius: 8px;
              border: 2px solid #4A081A;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(74, 8, 26, 0.15), 0 2px 4px -1px rgba(74, 8, 26, 0.08);
            }
            .summary-header {
              background-color: #4A081A !important;
              background: #4A081A !important;
              color: white !important;
              padding: 16px 24px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .summary-header h3 {
              font-size: 16px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0;
              color: white !important;
            }
            .summary-content {
              background: white;
              padding: 24px;
            }
            .summary-section {
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 1px solid #FFE5EC;
            }
            .summary-section:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .summary-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .summary-row + .summary-row {
              margin-top: 8px;
            }
            .summary-label {
              font-size: 12px;
              font-weight: 500;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .summary-value {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
              text-align: right;
              max-width: 60%;
              word-wrap: break-word;
            }
            .summary-value-medium {
              font-size: 14px;
              font-weight: 500;
              color: #111827;
              text-align: right;
              max-width: 60%;
              word-wrap: break-word;
            }
            .summary-sub-label {
              font-size: 12px;
              color: #4b5563;
            }
            .summary-sub-value {
              font-size: 14px;
              font-weight: 500;
              color: #111827;
              text-align: right;
            }
            .summary-text {
              font-size: 14px;
              color: #111827;
              line-height: 1.6;
              word-wrap: break-word;
              margin-top: 4px;
            }
            .summary-amount-box {
              background-color: #f3f4f6 !important;
              background: #f3f4f6 !important;
              padding: 12px 16px;
              border-radius: 6px;
              margin-top: 8px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .summary-amount-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .summary-amount-label {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .summary-amount-value {
              font-size: 24px;
              font-weight: 700;
              color: #4A081A !important;
            }
            .summary-space-y-2 > * + * {
              margin-top: 8px;
            }
            @media print {
              @page {
                size: Envelope #10;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-wrapper {
                margin: 0;
              }
              .summary-container {
                border-radius: 0 !important;
                margin: 0;
              }
              .summary-amount-box {
                border-radius: 0 !important;
              }
              .summary-header {
                background-color: #4A081A !important;
                background: #4A081A !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-header h3 {
                color: white !important;
              }
              .summary-amount-box {
                background-color: #f3f4f6 !important;
                background: #f3f4f6 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-amount-value {
                color: #4A081A !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="summary-wrapper">
            <div class="summary-container">
              <div class="summary-header">
                <h3>Transaction Summary</h3>
              </div>
              <div class="summary-content">
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Withdrawal Type</span>
                    <span class="summary-value">${voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}</span>
                  </div>
                </div>
                ${voucherMode === "WITH_VOUCHER" && (formData.voucher_date || formData.voucher_no) ? `
                <div class="summary-section summary-space-y-2">
                  ${formData.voucher_date ? `
                  <div class="summary-row">
                    <span class="summary-sub-label">Voucher Date</span>
                    <span class="summary-sub-value">${formatDate(formData.voucher_date)}</span>
                  </div>
                  ` : ''}
                  ${formData.voucher_no ? `
                  <div class="summary-row">
                    <span class="summary-sub-label">Voucher No.</span>
                    <span class="summary-sub-value" style="font-family: monospace;">${formData.voucher_no}</span>
                  </div>
                  ` : ''}
                </div>
                ` : ''}
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Transaction Type</span>
                    <span class="summary-value">${getTransactionTypeLabel(formData.transaction_type)}</span>
                  </div>
                  ${instrumentNumbers.length > 0 ? `
                  <div style="margin-top: 8px;">
                    <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">${formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL" ? "Transaction Instrument" : "Instrument No."}</div>
                    ${instrumentNumbers.map(num => `
                      <div class="summary-row" style="margin-top: 4px;">
                        <span class="summary-sub-value" style="width: 100%; text-align: right;">${num}</span>
                      </div>
                    `).join('')}
                  </div>
                  ` : formData.instrument_no.trim() ? `
                  <div class="summary-row">
                    <span class="summary-sub-label">${formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL" ? "Transaction Instrument" : "Instrument No."}</span>
                    <span class="summary-sub-value">${formData.instrument_no}</span>
                  </div>
                  ` : ''}
                </div>
                <div class="summary-section summary-space-y-2">
                  <div class="summary-row">
                    <span class="summary-label">Main</span>
                    <span class="summary-value-medium" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fromOwnerName}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Owner</span>
                    <span class="summary-value-medium" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${toOwnerName}</span>
                  </div>
                </div>
                ${formData.unit_name ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Unit</span>
                    <span class="summary-value-medium">${formData.unit_name}</span>
                  </div>
                </div>
                ` : ''}
                ${formData.particulars ? `
                <div class="summary-section">
                  <div>
                    <span class="summary-label" style="display: block; margin-bottom: 4px;">Particulars</span>
                    <p class="summary-text" style="text-align: right;">${formData.particulars}</p>
                  </div>
                </div>
                ` : ''}
                ${formData.fund_reference ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Fund Reference</span>
                    <span class="summary-value-medium">${formData.fund_reference}</span>
                  </div>
                </div>
                ` : ''}
                ${formData.person_in_charge ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Person in Charge</span>
                    <span class="summary-value-medium">${formData.person_in_charge}</span>
                  </div>
                </div>
                ` : ''}
                ${attachmentsCount > 0 ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Attachments</span>
                    <span class="summary-value-medium">${attachmentsCount} file${attachmentsCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                ` : ''}
                <div class="summary-section">
                  <div class="summary-amount-box">
                    <div class="summary-amount-row">
                      <span class="summary-amount-label">Total Amount</span>
                      <span class="summary-amount-value">${formatAmount(formData.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              // Set print settings if possible
              if (window.matchMedia) {
                const mediaQueryList = window.matchMedia('print');
                mediaQueryList.addListener(function(mql) {
                  if (mql.matches) {
                    // Print mode activated
                  }
                });
              }
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  const handleSuccessDownload = () => {
    if (!successTransactionData) return;
    handleSuccessPrint();
  };

  /* ================= PRINT ================= */

  const handlePrint = () => {
    // Format helper functions
    const formatDate = (dateString: string) => {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    const formatAmount = (amount: string) => {
      if (!amount) return "₱ 0.00";
      return `₱ ${parseFloat(amount.replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getTransactionTypeLabel = (type: string) => {
      switch (type) {
        case "CHEQUE": return "Cheque";
        case "DEPOSIT_SLIP": return "Deposit Slip";
        case "CASH": return "Cash";
        case "INTERNAL": return "Internal";
        default: return type || "—";
      }
    };

    const fromOwnerName = formData.from_owner_id 
      ? (fromOwners.find(owner => owner.id === formData.from_owner_id)?.name || "—")
      : "—";
    
    const toOwnerName = formData.to_owner_id 
      ? (toOwners.find(owner => owner.id === formData.to_owner_id)?.name || "—")
      : "—";

    const attachmentsCount = [voucherFile, ...uploadedFiles].filter(Boolean).length;

    // Get all instrument numbers from uploaded files (excluding voucher)
    const getAllInstrumentNumbers = (): string[] => {
      const instrumentNumbers: string[] = [];
      
      // Add all uploaded file names (without extensions) - exclude voucher
      uploadedFiles.forEach((file) => {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        instrumentNumbers.push(fileName);
      });
      
      // If there's a manually entered instrument_no and no files, include it
      if (instrumentNumbers.length === 0 && formData.instrument_no.trim()) {
        instrumentNumbers.push(formData.instrument_no);
      }
      
      return instrumentNumbers;
    };

    const instrumentNumbers = getAllInstrumentNumbers();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build the HTML structure matching the exact summary structure
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Summary</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              size: Envelope #10;
              margin: 0;
            }
            @media print {
              @page {
                size: Envelope #10;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .summary-wrapper {
                margin: 0;
              }
              .summary-container {
                border-radius: 0 !important;
                margin: 0;
              }
              .summary-amount-box {
                border-radius: 0 !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: white;
              padding: 20px;
              color: #111827;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .summary-wrapper {
              max-width: 100%;
              margin: 0 auto;
            }
            .summary-container {
              border-radius: 8px;
              border: 2px solid #4A081A;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(74, 8, 26, 0.15), 0 2px 4px -1px rgba(74, 8, 26, 0.08);
            }
            .summary-header {
              background-color: #4A081A !important;
              background: #4A081A !important;
              color: white !important;
              padding: 16px 24px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .summary-header h3 {
              font-size: 16px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0;
              color: white !important;
            }
            .summary-content {
              background: white;
              padding: 24px;
            }
            .summary-section {
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 1px solid #FFE5EC;
            }
            .summary-section:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .summary-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .summary-row + .summary-row {
              margin-top: 8px;
            }
            .summary-label {
              font-size: 12px;
              font-weight: 500;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .summary-value {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
              text-align: right;
              max-width: 60%;
              word-wrap: break-word;
            }
            .summary-value-medium {
              font-size: 14px;
              font-weight: 500;
              color: #111827;
              text-align: right;
              max-width: 60%;
              word-wrap: break-word;
            }
            .summary-sub-label {
              font-size: 12px;
              color: #4b5563;
            }
            .summary-sub-value {
              font-size: 14px;
              font-weight: 500;
              color: #111827;
              text-align: right;
            }
            .summary-text {
              font-size: 14px;
              color: #111827;
              line-height: 1.6;
              word-wrap: break-word;
              margin-top: 4px;
            }
            .summary-amount-box {
              background-color: #f3f4f6 !important;
              background: #f3f4f6 !important;
              padding: 12px 16px;
              border-radius: 6px;
              margin-top: 8px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .summary-amount-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .summary-amount-label {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .summary-amount-value {
              font-size: 24px;
              font-weight: 700;
              color: #4A081A !important;
            }
            .summary-space-y-2 > * + * {
              margin-top: 8px;
            }
            @media print {
              @page {
                size: Envelope #10;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-wrapper {
                margin: 0;
              }
              .summary-container {
                border-radius: 0 !important;
                margin: 0;
              }
              .summary-amount-box {
                border-radius: 0 !important;
              }
              .summary-header {
                background-color: #4A081A !important;
                background: #4A081A !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-header h3 {
                color: white !important;
              }
              .summary-amount-box {
                background-color: #f3f4f6 !important;
                background: #f3f4f6 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-amount-value {
                color: #4A081A !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="summary-wrapper">
            <div class="summary-container">
              <div class="summary-header">
                <h3>Transaction Summary</h3>
              </div>
              <div class="summary-content">
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Withdrawal Type</span>
                    <span class="summary-value">${voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}</span>
                  </div>
                </div>
                ${voucherMode === "WITH_VOUCHER" && (formData.voucher_date || formData.voucher_no) ? `
                <div class="summary-section summary-space-y-2">
                  ${formData.voucher_date ? `
                  <div class="summary-row">
                    <span class="summary-sub-label">Voucher Date</span>
                    <span class="summary-sub-value">${formatDate(formData.voucher_date)}</span>
                  </div>
                  ` : ''}
                  ${formData.voucher_no ? `
                  <div class="summary-row">
                    <span class="summary-sub-label">Voucher No.</span>
                    <span class="summary-sub-value" style="font-family: monospace;">${formData.voucher_no}</span>
                  </div>
                  ` : ''}
                </div>
                ` : ''}
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Transaction Type</span>
                    <span class="summary-value">${getTransactionTypeLabel(formData.transaction_type)}</span>
                  </div>
                  ${instrumentNumbers.length > 0 ? `
                  <div style="margin-top: 8px;">
                    <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">${formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL" ? "Transaction Instrument" : "Instrument No."}</div>
                    ${instrumentNumbers.map(num => `
                      <div class="summary-row" style="margin-top: 4px;">
                        <span class="summary-sub-value" style="width: 100%; text-align: right;">${num}</span>
                      </div>
                    `).join('')}
                  </div>
                  ` : formData.instrument_no.trim() ? `
                  <div class="summary-row">
                    <span class="summary-sub-label">${formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL" ? "Transaction Instrument" : "Instrument No."}</span>
                    <span class="summary-sub-value">${formData.instrument_no}</span>
                  </div>
                  ` : ''}
                </div>
                <div class="summary-section summary-space-y-2">
                  <div class="summary-row">
                    <span class="summary-label">Main</span>
                    <span class="summary-value-medium" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fromOwnerName}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Owner</span>
                    <span class="summary-value-medium" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${toOwnerName}</span>
                  </div>
                </div>
                ${formData.unit_name ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Unit</span>
                    <span class="summary-value-medium">${formData.unit_name}</span>
                  </div>
                </div>
                ` : ''}
                ${formData.particulars ? `
                <div class="summary-section">
                  <div>
                    <span class="summary-label" style="display: block; margin-bottom: 4px;">Particulars</span>
                    <p class="summary-text" style="text-align: right;">${formData.particulars}</p>
                  </div>
                </div>
                ` : ''}
                ${formData.fund_reference ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Fund Reference</span>
                    <span class="summary-value-medium">${formData.fund_reference}</span>
                  </div>
                </div>
                ` : ''}
                ${formData.person_in_charge ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Person in Charge</span>
                    <span class="summary-value-medium">${formData.person_in_charge}</span>
                  </div>
                </div>
                ` : ''}
                ${attachmentsCount > 0 ? `
                <div class="summary-section">
                  <div class="summary-row">
                    <span class="summary-label">Attachments</span>
                    <span class="summary-value-medium">${attachmentsCount} file${attachmentsCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                ` : ''}
                <div class="summary-section">
                  <div class="summary-amount-box">
                    <div class="summary-amount-row">
                      <span class="summary-amount-label">Total Amount</span>
                      <span class="summary-amount-value">${formatAmount(formData.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              // Set print settings if possible
              if (window.matchMedia) {
                const mediaQueryList = window.matchMedia('print');
                mediaQueryList.addListener(function(mql) {
                  if (mql.matches) {
                    // Print mode activated
                  }
                });
              }
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  /* ================= RESET ================= */

  const resetForm = () => {
    setFormData({
      voucher_date: "",
      voucher_no: "",
      transaction_type: "CASH",
      instrument_type: "",
      instrument_no: "",
      fund_reference: "",
      person_in_charge: "",
      from_owner_id: null,
      to_owner_id: null,
      unit_id: null,
      unit_name: "",
      particulars: "",
      amount: "",
    });
    setUploadedFiles([]);
    setFilePreviews([]);
    setFromOwnerSearchQuery("");
    setToOwnerSearchQuery("");
    setUnitSearchQuery("");
    setUnits([]);
    setVoucherFile(null);
    setVoucherPreview(null);
    setVoucherMode("WITH_VOUCHER");
  };

  // File Preview Panel State
  const [showFilePreviewPanel, setShowFilePreviewPanel] = useState(false);
  const [filePreviewPanelClosing, setFilePreviewPanelClosing] = useState(false);
  const [previewingFileIndex, setPreviewingFileIndex] = useState<number | null>(null);
  const [previewImageZoom, setPreviewImageZoom] = useState(100);
  const [previewFileType, setPreviewFileType] = useState<string | null>(null);
  const [previewImageLoading, setPreviewImageLoading] = useState(false);
  const [previewImageError, setPreviewImageError] = useState<string | null>(null);

  // Voucher File (for voucher mode)
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);

  const closeFilePreviewPanel = () => {
    setFilePreviewPanelClosing(true);
    setTimeout(() => {
      setShowFilePreviewPanel(false);
      setFilePreviewPanelClosing(false);
      setPreviewingFileIndex(null);
      setPreviewImageZoom(100);
      setPreviewFileType(null);
      setPreviewImageLoading(false);
      setPreviewImageError(null);
    }, 350);
  };

  const handleDownloadPreviewImage = () => {
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
    
    if (!previewSrc) return;

    const fileName = previewingFileIndex !== null && previewingFileIndex >= 0 && previewingFileIndex < uploadedFiles.length
      ? uploadedFiles[previewingFileIndex]?.name
      : voucherFile?.name || "image";

    const link = document.createElement("a");
    link.href = previewSrc;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPreviewFileName = (): string => {
    if (previewingFileIndex !== null && previewingFileIndex >= 0 && previewingFileIndex < uploadedFiles.length) {
      return uploadedFiles[previewingFileIndex]?.name || "Image";
    }
    return voucherFile?.name || "Image";
  };

  const getPreviewFileType = (): string | null => {
    if (previewingFileIndex !== null && previewingFileIndex >= 0 && previewingFileIndex < uploadedFiles.length) {
      return uploadedFiles[previewingFileIndex]?.type || null;
    }
    return voucherFile?.type || null;
  };

  const isPreviewVoucher = (): boolean => {
    return (previewingFileIndex === null || previewingFileIndex < 0) && voucherMode === "WITH_VOUCHER" && !!voucherFile;
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
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-[#6A0D25]/30">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">New {title}</h1>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create {title}</h2>
              <p className="text-sm text-gray-600 mt-1">{recordDescription}</p>
            </div>
          </div>

          {/* Voucher Mode Toggle - Segmented Control */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Mode</label>
            <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setVoucherMode("WITH_VOUCHER");
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  voucherMode === "WITH_VOUCHER"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
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
                  if (formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL") {
                    setUploadedFiles([]);
                    setFilePreviews([]);
                  }
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                  voucherMode === "NO_VOUCHER"
                    ? "bg-[#7a0f1f] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {noVoucherLabel}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT SIDE */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Voucher Section - Conditionally Rendered */}
              {voucherMode === "WITH_VOUCHER" && (
                <div className="space-y-6 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Voucher Information
                  </h3>

                <div className="space-y-6">
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
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                    />
                  </div>

                  {/* Voucher No - In its own row */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Voucher No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.voucher_no}
                      readOnly={true}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                      placeholder={voucherFile ? "Auto-filled from uploaded image" : "Upload image to set voucher number"}
                    />
                  </div>

                  {/* Voucher Upload - Same design as Transaction Instrument */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
                        if (imageFiles.length > 0) {
                          handleVoucherUpload(imageFiles[0]);
                        }
                        // Reset input so same file can be selected again
                        e.target.value = '';
                      }}
                      className="hidden"
                      id="voucher-upload"
                    />
                    {voucherFile ? (
                      <div className="space-y-3">
                        <label
                          htmlFor="voucher-upload"
                          className="flex flex-col items-center justify-center gap-2 w-full px-4 py-8 rounded-md cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <Upload className="w-5 h-5" />
                          <span className="text-sm font-medium">Upload Voucher</span>
                          <span className="text-xs text-gray-500">Click to browse or drag and drop</span>
                        </label>
                        {/* Display uploaded file */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowFilePreviewPanel(true);
                              setPreviewingFileIndex(null);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg bg-[#FFE5EC]/50 border-2 border-[#FFE5EC] text-sm text-neutral-900 transition-colors hover:bg-[#FFE5EC]/70 flex items-center gap-2"
                          >
                            <FileImage className="w-4 h-4" />
                            <span className="truncate">{voucherFile.name}</span>
                            <Eye className="w-4 h-4 ml-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setVoucherFile(null);
                              setVoucherPreview(null);
                              setFormData((prev) => ({ ...prev, voucher_no: "" }));
                            }}
                            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-red-300 transition-all"
                            title="Remove voucher"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="voucher-upload"
                        className="flex flex-col items-center justify-center gap-2 w-full px-4 py-8 rounded-md cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors text-gray-600"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files);
                          const imageFiles = files.filter((file) => file.type.startsWith("image/"));
                          if (imageFiles.length > 0) {
                            handleVoucherUpload(imageFiles[0]);
                          }
                        }}
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-sm font-medium">Upload Voucher</span>
                        <span className="text-xs text-gray-500">Click to browse or drag and drop</span>
                      </label>
                    )}
                  </div>
                </div>
                </div>
              )}

              {/* PAYMENT */}
              <div className="space-y-6 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900">
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
                    // Set instrument type based on transaction type
                    let instrumentType = "";
                    switch (newType) {
                      case "CHEQUE":
                        instrumentType = "CHEQUE";
                        break;
                      case "DEPOSIT_SLIP":
                        instrumentType = "DEPOSIT_SLIP";
                        break;
                      case "CASH":
                        instrumentType = "CASH";
                        break;
                      case "INTERNAL":
                        instrumentType = "BANK_TRANSFER";
                        break;
                    }
                    
                    setFormData({ 
                      ...formData, 
                      transaction_type: newType,
                      instrument_type: instrumentType,
                      instrument_no: "",
                    });

                    // Clear files if switching to Cash or Internal
                    if (newType === "CASH" || newType === "INTERNAL") {
                      setUploadedFiles([]);
                      setFilePreviews([]);
                      setIsAttachmentSectionOpen(false);
                    } else {
                      // Open attachment section when switching to Cheque or Deposit Slip
                      setIsAttachmentSectionOpen(true);
                    }
                  }}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="CHEQUE">Cheque</option>
                  <option value="DEPOSIT_SLIP">Deposit Slip</option>
                  <option value="CASH">Cash</option>
                  <option value="INTERNAL">Internal</option>
                </select>
              </div>

              {/* Transaction Instrument / Number - Only for Cash/Internal */}
              {(formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL") && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Transaction Instrument / Number
                  </label>
                  <input
                    type="text"
                    value={formData.instrument_no}
                    onChange={(e) => setFormData({ ...formData, instrument_no: e.target.value })}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                    placeholder={
                      formData.transaction_type === "CASH"
                        ? "e.g., Receipt number, Reference number"
                        : "e.g., Transfer reference number"
                    }
                  />
                </div>
              )}

              {/* Add Attachments Section - Only for Cheque/Deposit Slip */}
              {shouldShowUploadSection && (
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setIsAttachmentSectionOpen(!isAttachmentSectionOpen)}
                    className="flex items-center justify-between w-full mb-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <label className="block text-sm font-medium cursor-pointer">
                      Transaction Instrument / Number
                    </label>
                    {isAttachmentSectionOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {isAttachmentSectionOpen && (
                    <div className="mt-2">
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
                          className="flex flex-col items-center justify-center gap-2 w-full px-4 py-8 rounded-md cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <Upload className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {formData.transaction_type === "CHEQUE" 
                              ? "Upload Cheque"
                              : "Upload Slip"}
                          </span>
                          <span className="text-xs text-gray-500">Click to browse or drag and drop</span>
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
                                <div
                                  key={index}
                                className="relative inline-flex flex-col items-center gap-1 px-2 py-1 rounded-lg bg-[#FFE5EC]/50 border-2 border-[#FFE5EC] text-sm text-neutral-900 transition-colors"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(index);
                                    }}
                                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                                    title="Remove file"
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openFilePreview(index)}
                                    className="cursor-pointer hover:text-gray-700 pt-1"
                                  >
                                    {fileNameWithoutExt}
                                  </button>
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

              {/* Main */}
              <div className="relative md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Main <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search main..."
                    value={fromOwnerSearchQuery}
                    onChange={(e) => {
                      setFromOwnerSearchQuery(e.target.value);
                      setShowFromOwnerDropdown(true);
                    }}
                    onFocus={() => setShowFromOwnerDropdown(true)}
                    className="w-full rounded-md border border-gray-200 bg-white px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                  />
                  {formData.from_owner_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, from_owner_id: null });
                        setFromOwnerSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showFromOwnerDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowFromOwnerDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingFromOwners ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading owners...</div>
                        ) : filteredFromOwners.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No main found.</div>
                        ) : (
                          filteredFromOwners.map((owner) => (
                            <button
                              key={owner.id}
                              onClick={() => {
                                setFormData({ ...formData, from_owner_id: owner.id });
                                setFromOwnerSearchQuery(owner.name);
                                setShowFromOwnerDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                formData.from_owner_id === owner.id ? "bg-[#7a0f1f]/5" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{owner.name}</span>
                                <span className="text-xs text-gray-400 uppercase">{owner.owner_type}</span>
                              </div>
                              {owner.email && (
                                <div className="text-xs text-gray-500 mt-0.5">{owner.email}</div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Owner */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Owner <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search owner..."
                    value={toOwnerSearchQuery}
                    onChange={(e) => {
                      setToOwnerSearchQuery(e.target.value);
                      setShowToOwnerDropdown(true);
                    }}
                    onFocus={() => setShowToOwnerDropdown(true)}
                    className="w-full rounded-md border border-gray-200 bg-white px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                  />
                  {formData.to_owner_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, to_owner_id: null });
                        setToOwnerSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showToOwnerDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowToOwnerDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingToOwners ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading owners...</div>
                        ) : filteredToOwners.length === 0 ? (
                          <div className="p-4">
                            <div className="text-center text-sm text-gray-500 mb-3">
                              No owners found
                            </div>
                            {toOwnerSearchQuery.trim() && (
                              <button
                                onClick={() => {
                                  setCreateOwnerForm({
                                    owner_type: "CLIENT",
                                    name: toOwnerSearchQuery.trim(),
                                    description: "",
                                    email: "",
                                    phone: "",
                                    address: "",
                                    opening_balance: "",
                                    opening_date: "",
                                  });
                                  setShowCreateOwnerPanel(true);
                                  setShowToOwnerDropdown(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-95 transition-opacity"
                                style={{ backgroundColor: "#7a0f1f" }}
                              >
                                <Plus className="w-4 h-4" />
                                Create "{toOwnerSearchQuery.trim()}"
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            {filteredToOwners.map((owner) => (
                              <button
                                key={owner.id}
                                onClick={() => {
                                  setFormData({ ...formData, to_owner_id: owner.id });
                                  setToOwnerSearchQuery(owner.name);
                                  setShowToOwnerDropdown(false);
                                }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                formData.to_owner_id === owner.id ? "bg-[#7a0f1f]/5" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{owner.name}</span>
                                <span className="text-xs text-gray-400 uppercase">{owner.owner_type}</span>
                              </div>
                              {owner.email && (
                                <div className="text-xs text-gray-500 mt-0.5">{owner.email}</div>
                              )}
                            </button>
                            ))}
                            {toOwnerSearchQuery.trim() && (
                              <>
                                <div className="border-t" style={{ borderColor: BORDER }}></div>
                                <button
                                  onClick={() => {
                                    setCreateOwnerForm({
                                      owner_type: "CLIENT",
                                      name: toOwnerSearchQuery.trim(),
                                      description: "",
                                      email: "",
                                      phone: "",
                                      address: "",
                                      opening_balance: "",
                                      opening_date: "",
                                    });
                                    setShowCreateOwnerPanel(true);
                                    setShowToOwnerDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#7a0f1f] hover:bg-[#7a0f1f]/10 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Create "{toOwnerSearchQuery.trim()}"
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Unit Search/Create */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Unit
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={formData.to_owner_id ? "Search unit..." : "Select Owner first"}
                    value={unitSearchQuery}
                    onChange={(e) => {
                      setUnitSearchQuery(e.target.value);
                      setShowUnitDropdown(true);
                    }}
                    onFocus={() => {
                      if (formData.to_owner_id) {
                        setShowUnitDropdown(true);
                      }
                    }}
                    disabled={!formData.to_owner_id}
                    className="w-full rounded-lg border-2 border-[#FFE5EC] px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] disabled:bg-[#FFE5EC]/30 disabled:cursor-not-allowed transition-all"
                  />
                  {formData.unit_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, unit_id: null, unit_name: "" });
                        setUnitSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showUnitDropdown && formData.to_owner_id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUnitDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingUnits ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading units...</div>
                        ) : filteredUnits.length === 0 ? (
                          <div className="p-4">
                            <div className="text-center text-sm text-gray-500 mb-3">
                              No units found
                            </div>
                            {unitSearchQuery.trim() && (
                              <button
                                onClick={() => {
                                  setCreateUnitForm({
                                    unit_name: unitSearchQuery.trim(),
                                    property_id: null,
                                    status: "ACTIVE",
                                    notes: "",
                                  });
                                  setPropertySearchQuery("");
                                  setShowCreateUnitPanel(true);
                                  setShowUnitDropdown(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-95 transition-opacity"
                                style={{ backgroundColor: "#7a0f1f" }}
                              >
                                <Plus className="w-4 h-4" />
                                Create "{unitSearchQuery.trim()}"
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            {filteredUnits.map((unit) => (
                              <button
                                key={unit.id}
                                onClick={() => {
                                  setFormData({ ...formData, unit_id: unit.id, unit_name: unit.unit_name });
                                  setUnitSearchQuery(unit.unit_name);
                                  setShowUnitDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-[#7a0f1f]/10 transition-colors border-b ${
                                  formData.unit_id === unit.id ? "bg-[#7a0f1f]/5" : ""
                                }`}
                                style={{ borderColor: BORDER }}
                              >
                                <div className="font-medium">{unit.unit_name}</div>
                                {unit.notes && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {unit.notes}
                                  </div>
                                )}
                              </button>
                            ))}
                            {unitSearchQuery.trim() && (
                              <>
                                <div className="border-t" style={{ borderColor: BORDER }}></div>
                                <button
                                  onClick={() => {
                                    setCreateUnitForm({
                                      unit_name: unitSearchQuery.trim(),
                                      property_id: null,
                                      status: "ACTIVE",
                                      notes: "",
                                    });
                                    setPropertySearchQuery("");
                                    setShowCreateUnitPanel(true);
                                    setShowUnitDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#7a0f1f] hover:bg-[#7a0f1f]/10 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Create "{unitSearchQuery.trim()}"
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Amount - Standout Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-900">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">₱</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 py-3 text-lg font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-gray-200 pt-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">
                  Particulars <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter transaction particulars..."
                  value={formData.particulars}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      particulars: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                />
              </div>

              {/* Additional Information Section */}
              <div className="space-y-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-900">
                  Additional Information
                </h4>

                <div className="grid md:grid-cols-2 gap-6">
                {/* Fund Reference */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fund Reference
                  </label>
                  <input
                    type="text"
                    value={formData.fund_reference}
                    onChange={(e) => setFormData({ ...formData, fund_reference: e.target.value })}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                    placeholder="Enter fund reference"
                  />
                </div>

                {/* Person in Charge */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Person in Charge
                  </label>
                  <input
                    type="text"
                    value={formData.person_in_charge}
                    onChange={(e) => setFormData({ ...formData, person_in_charge: e.target.value })}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                    placeholder="Enter person in charge"
                  />
                </div>
                </div>
              </div>
            </div>
            </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="space-y-6">
              
              {/* Uploaded Attachments Section - List Only (includes voucher file + uploaded files) */}
              {shouldShowAttachments && (uploadedFiles.length > 0 || voucherFile) && (
                <div className="rounded-md border p-6 bg-white" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
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


              {/* SUMMARY */}
              <div
                className="rounded-md border border-gray-200 sticky top-6 overflow-hidden shadow-sm"
                data-summary-container
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    Transaction Summary
                  </h3>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-2 rounded-md hover:bg-white/20 transition-colors"
                    title="Print"
                  >
                    <Printer className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="bg-white p-6" data-summary-content>
                  <div className="space-y-4">
                    {/* Withdrawal Type */}
                    <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">Withdrawal Type</span>
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
                        <span className="text-xs font-semibold text-gray-700">Transaction Type</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formData.transaction_type === "CHEQUE" ? "Cheque" :
                           formData.transaction_type === "DEPOSIT_SLIP" ? "Deposit Slip" :
                           formData.transaction_type === "CASH" ? "Cash" :
                           formData.transaction_type === "INTERNAL" ? "Internal" :
                           formData.transaction_type || "—"}
                        </span>
                      </div>
                      {(() => {
                        // Get all instrument numbers from uploaded files (excluding voucher)
                        const getAllInstrumentNumbers = (): string[] => {
                          const instrumentNumbers: string[] = [];
                          
                          // Add all uploaded file names (without extensions) - exclude voucher
                          uploadedFiles.forEach((file) => {
                            const fileName = file.name.replace(/\.[^/.]+$/, "");
                            instrumentNumbers.push(fileName);
                          });
                          
                          // If there's a manually entered instrument_no and no files, include it
                          if (instrumentNumbers.length === 0 && formData.instrument_no.trim()) {
                            instrumentNumbers.push(formData.instrument_no);
                          }
                          
                          return instrumentNumbers;
                        };

                        const instrumentNumbers = getAllInstrumentNumbers();

                        if (instrumentNumbers.length > 0) {
                          const label = formData.transaction_type === "CASH" || formData.transaction_type === "INTERNAL" 
                            ? "Transaction Instrument" 
                            : "Instrument No.";
                          return (
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 mb-1">{label}</div>
                              <div className="space-y-1">
                                {instrumentNumbers.map((num, index) => (
                                  <div key={index} className="text-sm font-medium text-gray-900 text-right">
                                    {num}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Owners */}
                    <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">Main</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                          {formData.from_owner_id 
                            ? (fromOwners.find(owner => owner.id === formData.from_owner_id)?.name || "—")
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">Owner</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                          {formData.to_owner_id 
                            ? (toOwners.find(owner => owner.id === formData.to_owner_id)?.name || "—")
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Unit */}
                    {formData.unit_name && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">Unit</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formData.unit_name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Particulars */}
                    {formData.particulars && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-700 block">Particulars</span>
                          <p className="text-sm text-gray-900 leading-relaxed break-words text-right">
                            {formData.particulars}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Fund Reference */}
                    {formData.fund_reference && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">Fund Reference</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formData.fund_reference}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Person in Charge */}
                    {formData.person_in_charge && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">Person in Charge</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formData.person_in_charge}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Attachments Count */}
                    {(voucherFile || uploadedFiles.length > 0) && (
                      <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">Attachments</span>
                          <span className="text-sm font-medium text-gray-900">
                            {[voucherFile, ...uploadedFiles].filter(Boolean).length} file{([voucherFile, ...uploadedFiles].filter(Boolean).length !== 1) ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between py-4 px-4 rounded-md bg-gray-50 border border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ₱ {formData.amount ? parseFloat(formData.amount.replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS - Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-10 -mx-5 -mb-5 rounded-b-md shadow-lg">
            <div className="flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>

              <button
                disabled={
                  showCreateWithdrawalLoading ||
                  (voucherMode === "WITH_VOUCHER" && (!formData.voucher_date || !formData.voucher_no)) ||
                  !formData.amount ||
                  !formData.from_owner_id ||
                  !formData.to_owner_id ||
                  !formData.particulars.trim() ||
                  (requiresFileUpload && uploadedFiles.length === 0)
                }
                className="px-6 py-2 rounded-md text-white bg-[#7a0f1f] hover:bg-[#5f0c18] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
                onClick={handleCreateWithdrawal}
              >
                Create Withdrawal
              </button>
            </div>
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
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5" />
                <div>
                  <h2 className="text-lg font-bold">
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
                      const hasPreview = filePreviewSrc || voucherPreviewSrc;
                      
                      if (hasPreview) {
                        return isPreviewVoucher() ? "Voucher Preview" : "Attachment Preview";
                      }
                      return voucherMode === "WITH_VOUCHER" 
                        ? voucherFile
                          ? "Preview Voucher Image"
                          : "Upload Voucher Image"
                        : "Upload Attachment";
                    })()}
                  </h2>
                  <p className="text-xs text-white/80 mt-0.5">{getPreviewFileName()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  const hasPreview = filePreviewSrc || voucherPreviewSrc;
                  
                  if (hasPreview) {
                    return (
                      <>
                        <button
                          onClick={() => setPreviewImageZoom(Math.max(50, previewImageZoom - 25))}
                          className="p-2 rounded-md hover:bg-white/20 transition"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewImageZoom(Math.min(200, previewImageZoom + 25))}
                          className="p-2 rounded-md hover:bg-white/20 transition"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleDownloadPreviewImage}
                          className="p-2 rounded-md hover:bg-white/20 transition"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    );
                  }
                  return null;
                })()}
                <button
                  onClick={closeFilePreviewPanel}
                  className="p-2 rounded-md hover:bg-white/20 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
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

                if (shouldShowPreview && previewSrc) {
                  return (
                    <>
                      {/* File Information Section */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">File Name</div>
                              <div className="text-sm text-gray-900 font-medium">{getPreviewFileName()}</div>
                            </div>
                          </div>
                          {getPreviewFileType() && (
                            <div className="flex items-start gap-3">
                              <ImageIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">File Type</div>
                                <div className="text-sm text-gray-900">{getPreviewFileType()}</div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
                              <div className="text-sm text-gray-900">
                                {isPreviewVoucher() ? (
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

                      {/* Image Preview Section */}
                      <div className="p-6">
                        <div className="space-y-4">
                          {/* Image Container */}
                          <div
                            className="rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center shadow-lg"
                            style={{ minHeight: "400px" }}
                          >
                            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                              <img
                                src={previewSrc}
                                alt={isPreviewVoucher() ? "Voucher Preview" : "Attachment Preview"}
                                className="max-w-full max-h-[70vh] object-contain transition-transform"
                                style={{ transform: `scale(${previewImageZoom / 100})` }}
                              />
                            </div>
                          </div>
                          
                          {/* Zoom Indicator */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>Zoom: {previewImageZoom}%</span>
                              <button
                                onClick={() => setPreviewImageZoom(100)}
                                className="text-[#7a0f1f] hover:underline"
                              >
                                Reset
                              </button>
                            </div>
                            <div className="text-gray-400">
                              Use zoom controls to adjust image size
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                }
                return null;
              })()}

              {/* Show upload area if not previewing a specific file */}
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
                const hasPreview = filePreviewSrc || voucherPreviewSrc;
                return !hasPreview && previewingFileIndex === null;
              })() && (
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
                      
                      // Auto-open attachment section when files are uploaded
                      setIsAttachmentSectionOpen(true);
                      
                      // Auto-fill instrument_no from first file name (without extension) if not already set
                      if (imageFiles.length > 0 && !formData.instrument_no.trim()) {
                        const fileNameWithoutExt = imageFiles[0].name.replace(/\.[^/.]+$/, "");
                        setFormData({ ...formData, instrument_no: fileNameWithoutExt });
                      }
                      
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
                        
                        // Auto-open attachment section when files are uploaded
                        setIsAttachmentSectionOpen(true);
                        
                        // Auto-fill instrument_no from first file name (without extension) if not already set
                        if (imageFiles.length > 0 && !formData.instrument_no.trim()) {
                          const fileNameWithoutExt = imageFiles[0].name.replace(/\.[^/.]+$/, "");
                          setFormData({ ...formData, instrument_no: fileNameWithoutExt });
                        }
                        
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

          </div>
        </>
      )}

      {/* ================= CREATE OWNER PANEL ================= */}
      {(showCreateOwnerPanel || createOwnerPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              createOwnerPanelClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeCreateOwnerPanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: createOwnerPanelClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <h2 className="text-lg font-bold">Create Owner</h2>
              <button
                onClick={closeCreateOwnerPanel}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Owner Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Owner Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createOwnerForm.owner_type}
                    onChange={(e) =>
                      setCreateOwnerForm({ ...createOwnerForm, owner_type: e.target.value })
                    }
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

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createOwnerForm.name}
                    onChange={(e) =>
                      setCreateOwnerForm({ ...createOwnerForm, name: e.target.value })
                    }
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createOwnerForm.description}
                    onChange={(e) =>
                      setCreateOwnerForm({ ...createOwnerForm, description: e.target.value })
                    }
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

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createOwnerForm.email}
                    onChange={(e) =>
                      setCreateOwnerForm({ ...createOwnerForm, email: e.target.value })
                    }
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={createOwnerForm.phone}
                    onChange={(e) =>
                      setCreateOwnerForm({ ...createOwnerForm, phone: formatPhoneNumber(e.target.value) })
                    }
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

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Address
                  </label>
                  <textarea
                    value={createOwnerForm.address}
                    onChange={(e) =>
                      setCreateOwnerForm({ ...createOwnerForm, address: e.target.value })
                    }
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

                {/* Opening Balance */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Opening Balance
                  </label>
                  <input
                    type="text"
                    value={createOwnerForm.opening_balance}
                    onChange={(e) => {
                      // Allow only numbers, decimal point, and empty string
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setCreateOwnerForm({ ...createOwnerForm, opening_balance: value });
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

                {/* Opening Date - shown only if opening balance > 0 */}
                {createOwnerForm.opening_balance && parseFloat(createOwnerForm.opening_balance) > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Opening Date
                    </label>
                    <input
                      type="date"
                      value={createOwnerForm.opening_date}
                      onChange={(e) =>
                        setCreateOwnerForm({ ...createOwnerForm, opening_date: e.target.value })
                      }
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
            <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
              <button
                onClick={closeCreateOwnerPanel}
                className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                style={{ borderColor: BORDER }}
                disabled={showCreateOwnerLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateOwnerConfirm(true)}
                disabled={
                  showCreateOwnerLoading || 
                  !!nameError || 
                  !!emailError || 
                  !!phoneError || 
                  !!openingBalanceError || 
                  !!openingDateError || 
                  !!descriptionError || 
                  !!addressError ||
                  checkingName ||
                  !createOwnerForm.name.trim() ||
                  !createOwnerForm.owner_type
                }
                className="px-6 py-2.5 rounded-md font-semibold bg-[#7a0f1f] text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {showCreateOwnerLoading ? "Creating..." : "Create Owner"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= CREATE UNIT PANEL ================= */}
      {(showCreateUnitPanel || createUnitPanelClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
              createUnitPanelClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeCreateUnitPanel}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
            style={{
              animation: createUnitPanelClosing
                ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <h2 className="text-lg font-bold">Create Unit</h2>
              <button
                onClick={closeCreateUnitPanel}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Owner Info (Read-only) */}
                {formData.to_owner_id && (
                  <div className="p-3 bg-gray-50 rounded-md border" style={{ borderColor: BORDER }}>
                    <div className="text-xs text-gray-500 mb-1">Owner</div>
                    <div className="text-sm font-medium text-gray-900">
                      {toOwners.find(owner => owner.id === formData.to_owner_id)?.name || "—"}
                    </div>
                  </div>
                )}

                {/* Unit Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createUnitForm.unit_name}
                    onChange={(e) =>
                      setCreateUnitForm({ ...createUnitForm, unit_name: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                    placeholder="Enter unit name"
                    required
                  />
                </div>

                {/* Property */}
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
                      {createUnitForm.property_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateUnitForm({ ...createUnitForm, property_id: null });
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
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {loadingProperties ? (
                            <div className="p-4 text-center text-sm text-gray-500">Loading properties...</div>
                          ) : filteredProperties.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No properties found</div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setCreateUnitForm({ ...createUnitForm, property_id: null });
                                  setPropertySearchQuery("");
                                  setShowPropertyDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                  !createUnitForm.property_id ? "bg-gray-50" : ""
                                }`}
                              >
                                <div className="font-medium">None (Optional)</div>
                              </button>
                              {filteredProperties.map((property) => (
                                <button
                                  key={property.id}
                                  onClick={() => {
                                    setCreateUnitForm({ ...createUnitForm, property_id: property.id });
                                    setPropertySearchQuery(property.name);
                                    setShowPropertyDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t ${
                                    createUnitForm.property_id === property.id ? "bg-gray-50" : ""
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
                  {createUnitForm.property_id && (
                    <div className="mt-2 text-xs text-gray-600">
                      Selected: {properties.find(p => p.id === createUnitForm.property_id)?.name || "Loading..."}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createUnitForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      // Ensure only ACTIVE or INACTIVE can be selected
                      if (newStatus === "ACTIVE" || newStatus === "INACTIVE") {
                        setCreateUnitForm({ ...createUnitForm, status: newStatus });
                      }
                    }}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                  <textarea
                    value={createUnitForm.notes}
                    onChange={(e) =>
                      setCreateUnitForm({ ...createUnitForm, notes: e.target.value })
                    }
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
                onClick={closeCreateUnitPanel}
                className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                style={{ borderColor: BORDER }}
                disabled={showCreateUnitLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateUnitConfirm(true)}
                disabled={showCreateUnitLoading || !createUnitForm.unit_name.trim() || !formData.to_owner_id}
                className="px-6 py-2.5 rounded-md font-bold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#7a0f1f" }}
              >
                Create Unit
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= MODALS ================= */}
      <ConfirmationModal
        isOpen={showCreateOwnerConfirm}
        onClose={() => setShowCreateOwnerConfirm(false)}
        onConfirm={handleCreateOwnerConfirm}
        title="Create Owner"
        message={`Are you sure you want to create "${createOwnerForm.name}"?`}
        confirmText="Create"
        cancelText="Cancel"
        isLoading={showCreateOwnerLoading}
      />

      <ConfirmationModal
        isOpen={showCreateUnitConfirm}
        onClose={() => setShowCreateUnitConfirm(false)}
        onConfirm={handleCreateUnitConfirm}
        title="Create Unit"
        message={`Are you sure you want to create "${createUnitForm.unit_name}" for ${toOwners.find(owner => owner.id === formData.to_owner_id)?.name || "this owner"}?`}
        confirmText="Create"
        cancelText="Cancel"
        isLoading={showCreateUnitLoading}
      />

      <LoadingModal
        isOpen={showCreateOwnerLoading}
        title="Creating Owner"
        message="Please wait while we create the owner..."
      />

      <SuccessModal
        isOpen={showCreateOwnerSuccess}
        onClose={() => setShowCreateOwnerSuccess(false)}
        title={createOwnerSuccessTitle}
        message={createOwnerSuccessMessage}
        buttonText="OK"
      />

      <FailModal
        isOpen={showCreateOwnerFail}
        onClose={() => setShowCreateOwnerFail(false)}
        title={createOwnerFailTitle}
        message={createOwnerFailMessage}
        buttonText="OK"
      />

      <LoadingModal
        isOpen={showCreateUnitLoading}
        title="Creating Unit"
        message="Please wait while we create the unit..."
      />

      <SuccessModal
        isOpen={showCreateUnitSuccess}
        onClose={() => setShowCreateUnitSuccess(false)}
        title={createUnitSuccessTitle}
        message={createUnitSuccessMessage}
        buttonText="OK"
      />

      <FailModal
        isOpen={showCreateUnitFail}
        onClose={() => setShowCreateUnitFail(false)}
        title={createUnitFailTitle}
        message={createUnitFailMessage}
        buttonText="OK"
      />

      <LoadingModal
        isOpen={showCreateWithdrawalLoading}
        title="Creating Withdrawal"
        message="Please wait while we create the withdrawal..."
      />

      {successTransactionData && (
        <TransactionSuccessModal
          isOpen={showCreateWithdrawalSuccess}
          isClosing={successPanelClosing}
          onClose={() => {
            setSuccessPanelClosing(true);
            setTimeout(() => {
              setShowCreateWithdrawalSuccess(false);
              setSuccessPanelClosing(false);
              setSuccessTransactionData(null);
            }, 350);
          }}
          title="Withdrawal Created Successfully"
          message="The withdrawal has been created successfully."
          voucherTypeLabel="Withdrawal Type"
          transactionData={successTransactionData}
          onPrint={handleSuccessPrint}
          onDownload={handleSuccessDownload}
        />
      )}

      <FailModal
        isOpen={showCreateWithdrawalFail}
        onClose={() => {
          setShowCreateWithdrawalFail(false);
          setCreateWithdrawalFailMessage("");
        }}
        title="Failed to Create Withdrawal"
        message={createWithdrawalFailMessage || "An error occurred. Please try again."}
        buttonText="OK"
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
