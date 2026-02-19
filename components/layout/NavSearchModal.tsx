"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings2,
  User,
  Calculator,
  Banknote,
  BarChart3,
  Clock,
  Calendar,
  Shield,
  BookOpen,
  ArrowRightLeft,
  Plus,
  Minus,
  Wrench,
  Receipt,
  CheckCircle2,
  Coins,
  BookMarked,
  Calendar as CalendarIcon,
  UsersRound,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  category?: string;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/super", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/super/head/admins", label: "Admins", icon: <Shield className="w-4 h-4" />, category: "Head" },
  { href: "/super/head/accountants", label: "Accountants", icon: <Calculator className="w-4 h-4" />, category: "Head" },
  { href: "/super/admin/employee/masterfile", label: "Masterfile", icon: <User className="w-4 h-4" />, category: "Employee" },
  { href: "/super/admin/employee/onboard", label: "Onboard Employee", icon: <User className="w-4 h-4" />, category: "Employee" },
  { href: "/super/admin/employee/terminate", label: "Terminate Employee", icon: <User className="w-4 h-4" />, category: "Employee" },
  { href: "/super/admin/employee/evaluation", label: "Evaluation", icon: <FileText className="w-4 h-4" />, category: "Employee" },
  { href: "/super/admin/forms/onboarding-checklist", label: "Onboarding Checklist", icon: <FileText className="w-4 h-4" />, category: "Forms" },
  { href: "/super/admin/forms/clearance-checklist", label: "Clearance Checklist", icon: <FileText className="w-4 h-4" />, category: "Forms" },
  { href: "/super/admin/directory/process", label: "Process", icon: <FileText className="w-4 h-4" />, category: "Directory" },
  { href: "/super/admin/directory/contacts", label: "Contacts", icon: <User className="w-4 h-4" />, category: "Directory" },
  { href: "/super/admin/attendance/tardiness", label: "Tardiness", icon: <Clock className="w-4 h-4" />, category: "Attendance" },
  { href: "/super/admin/attendance/leave", label: "Leave", icon: <Calendar className="w-4 h-4" />, category: "Attendance" },
  { href: "/super/admin/attendance/leave-credits", label: "Leave Credits", icon: <Calendar className="w-4 h-4" />, category: "Attendance" },
  { href: "/super/accountant/transactions/deposit", label: "New Deposit", icon: <Plus className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/transactions/withdrawal", label: "New Withdrawal", icon: <Minus className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/transactions/transfer", label: "Bank Transfer", icon: <ArrowRightLeft className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/transactions/journal-entry", label: "Journal Entry", icon: <Receipt className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/bank-account", label: "Bank Account Ledger", icon: <BookOpen className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/bank-owner", label: "Bank Owner Ledger", icon: <BookOpen className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/transfer-register", label: "Transfer Register", icon: <ArrowRightLeft className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/bank-reconciliation", label: "Bank Reconciliation", icon: <CheckCircle2 className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/cash-book", label: "Cash Book", icon: <BookOpen className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/petty-cash", label: "Petty Cash", icon: <Coins className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/general-ledger-book", label: "General Ledger Book", icon: <BookOpen className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/ledger/chart-of-accounts", label: "Chart of Accounts", icon: <BookMarked className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/reports/bank-balance", label: "Bank Balance Summary", icon: <BarChart3 className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/reports/bank-ledger", label: "Bank Ledger Report", icon: <FileText className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/reports/owner-fund", label: "Owner Fund Report", icon: <BarChart3 className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/reports/transfer", label: "Transfer Report", icon: <ArrowRightLeft className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/reports/voucher-register", label: "Voucher Register", icon: <FileText className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/reports/cash-flow", label: "Cash Flow Report", icon: <BarChart3 className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/maintenance/banks", label: "Banks", icon: <Banknote className="w-4 h-4" />, category: "Maintenance" },
  { href: "/super/accountant/maintenance/owners", label: "Owners", icon: <User className="w-4 h-4" />, category: "Maintenance" },
  { href: "/super/accountant/maintenance/properties", label: "Properties", icon: <User className="w-4 h-4" />, category: "Maintenance" },
  { href: "/super/accountant/maintenance/bank-accounts", label: "Bank Accounts", icon: <User className="w-4 h-4" />, category: "Maintenance" },
  { href: "/super/accountant/maintenance/fund-references", label: "Fund References", icon: <FolderOpen className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/maintenance/voucher-series", label: "Voucher Series", icon: <FileText className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/maintenance/chart-of-accounts", label: "Chart of Accounts", icon: <BookMarked className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/settings/fiscal-year", label: "Fiscal Year", icon: <CalendarIcon className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/settings/user-roles", label: "User Roles & Permissions", icon: <UsersRound className="w-4 h-4" />, category: "Accountant" },
  { href: "/super/accountant/settings/system-preferences", label: "System Preferences", icon: <Sliders className="w-4 h-4" />, category: "Accountant" },
];

interface NavSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function NavSearchModal({ open, onClose }: NavSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return ALL_NAV_ITEMS;
    const q = query.trim().toLowerCase();
    return ALL_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.category?.toLowerCase().includes(q) ?? false)
    );
  }, [query]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        router.push(filteredItems[selectedIndex].href);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, filteredItems, selectedIndex, router]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search navigation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Spotlight style */}
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200/80 dark:border-gray-700/80">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search navigation..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 text-base outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[min(60vh,400px)] overflow-y-auto py-2"
        >
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item, index) => (
                <button
                  key={item.href}
                  data-index={index}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                    selectedIndex === index
                      ? "bg-[#7B0F2B]/10 text-[#7B0F2B]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <span className="shrink-0 text-gray-500">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.label}</span>
                    {item.category && (
                      <span className="ml-2 text-xs text-gray-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between text-xs text-gray-500">
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded ml-1">↓</kbd>
            to navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
            to select
          </span>
        </div>
      </div>
    </div>
  );
}
