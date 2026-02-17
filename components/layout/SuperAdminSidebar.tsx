"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Settings2,
  User,
  ChevronLeft,
  PanelLeft,
  Bell,
  MoreHorizontal,
  Calculator,
  Banknote,
  BarChart3,
  ClipboardList,
  Clock,
  Calendar,
  Crown,
  Shield,
  Search,
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
import { NavSearchModal } from "./NavSearchModal";
import { cn } from "@/lib/utils";

interface SuperAdminSidebarProps {
  user: { name?: string; email?: string } | null;
  onLogout: () => void;
}

const isActive = (pathname: string, href: string, exact?: boolean) => {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
};

/** Submenu popover for collapsed sidebar - shows on hover (desktop) or tap (mobile), rendered via Portal */
function CollapsedSubmenuPopover({
  label,
  items,
  pathname,
  children,
}: {
  label: string;
  items: { href: string; label: string; icon: React.ReactNode }[];
  pathname: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [openedByClick, setOpenedByClick] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = () => {
    if (triggerRef.current && typeof window !== "undefined") {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 200;
      const popoverMaxHeight = 400;
      const gap = 4;
      const isRtl = document.documentElement.dir === "rtl";
      let left: number;
      if (isRtl) {
        left = rect.left - popoverWidth - gap;
      } else if (rect.right + popoverWidth + gap > window.innerWidth) {
        left = rect.left - popoverWidth - gap;
      } else {
        left = rect.right + gap;
      }
      let top = rect.top;
      if (top + popoverMaxHeight > window.innerHeight - 16) {
        top = Math.max(16, window.innerHeight - popoverMaxHeight - 16);
      }
      if (top < 16) top = 16;
      setPosition({ top, left });
    }
  };

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setOpen(true);
      setOpenedByClick(false);
    }, 150);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!openedByClick) {
      timeoutRef.current = setTimeout(() => setOpen(false), 100);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition();
    setOpen((prev) => !prev);
    setOpenedByClick(true);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  useEffect(() => {
    if (!open || !openedByClick) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return;
      setOpen(false);
      setOpenedByClick(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open, openedByClick]);

  const popoverContent = open && typeof document !== "undefined" && createPortal(
    <div
      ref={(el) => { popoverRef.current = el; }}
      className="fixed min-w-[200px] max-w-[min(280px,90vw)] max-h-[min(70vh,400px)] overflow-y-auto py-2 px-2 rounded-lg bg-white shadow-xl border border-gray-200 z-[9999]"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <div className="px-3 py-2 mb-1 border-b border-gray-100">
        <p className="text-xs font-semibold text-[#7B0F2B] uppercase tracking-wider">{label}</p>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const exact = item.href === "/super/accountant" || item.href === "/super";
          const active = isActive(pathname, item.href, exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[#7B0F2B]/10 text-[#7B0F2B]"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <span className="shrink-0 text-gray-500">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>,
    document.body
  );

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <div
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleTriggerClick(e as unknown as React.MouseEvent);
        }}
        className="contents"
      >
        {children}
      </div>
      {popoverContent}
    </div>
  );
}

const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 360;
const SIDEBAR_DEFAULT = 280;

export default function SuperAdminSidebar({ user, onLogout }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isResizing) return;
    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, x - rect.left));
        setSidebarWidth(newWidth);
      }
    };
    const onMouseUp = () => setIsResizing(false);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // Cmd/Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const [employeeExpanded, setEmployeeExpanded] = useState(isActive(pathname, "/super/employee"));
  const [formsExpanded, setFormsExpanded] = useState(isActive(pathname, "/super/forms"));
  const [directoryExpanded, setDirectoryExpanded] = useState(isActive(pathname, "/super/directory"));
  const [attendanceExpanded, setAttendanceExpanded] = useState(isActive(pathname, "/super/attendance"));
  const [headExpanded, setHeadExpanded] = useState(isActive(pathname, "/super/head"));
  const [accountantTransactionsExpanded, setAccountantTransactionsExpanded] = useState(isActive(pathname, "/super/accountant/transactions"));
  const [accountantLedgerExpanded, setAccountantLedgerExpanded] = useState(isActive(pathname, "/super/accountant/ledger"));
  const [accountantBankLedgersExpanded, setAccountantBankLedgersExpanded] = useState(isActive(pathname, "/super/accountant/ledger/bank"));
  const [accountantCashLedgerExpanded, setAccountantCashLedgerExpanded] = useState(isActive(pathname, "/super/accountant/ledger/cash"));
  const [accountantGeneralLedgerExpanded, setAccountantGeneralLedgerExpanded] = useState(isActive(pathname, "/super/accountant/ledger/general"));
  const [accountantReportsExpanded, setAccountantReportsExpanded] = useState(isActive(pathname, "/super/accountant/reports"));
  const [accountantMaintenanceExpanded, setAccountantMaintenanceExpanded] = useState(isActive(pathname, "/super/accountant/maintenance"));
  const [accountantSettingsExpanded, setAccountantSettingsExpanded] = useState(isActive(pathname, "/super/accountant/settings"));

  const navItem = (
    href: string,
    label: string,
    icon: React.ReactNode,
    exact?: boolean
  ) => {
    const active = isActive(pathname, href, exact);
    return (
      <Link
        href={href}
        title={isCollapsed ? label : undefined}
        aria-label={isCollapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          active
            ? "bg-white/20 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <span className={cn("shrink-0", active ? "text-white" : "text-white/70")}>
          {icon}
        </span>
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#7B0F2B] via-[#8B1535] to-[#A4163A] border-r border-[#6A0D25]/50 shrink-0 shadow-lg shadow-[#7B0F2B]/20 relative",
        !isCollapsed && "transition-[width] duration-200 ease-out"
      )}
      style={{
        width: isCollapsed ? 72 : sidebarWidth,
      }}
    >
      {/* Resize handle - only when expanded */}
      {!isCollapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={sidebarWidth}
          onMouseDown={() => setIsResizing(true)}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-white/20 transition-colors group"
          title="Drag to resize"
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 rounded-l bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      {/* Header: Toggle + Search */}
      <div className="p-4 border-b border-white/20">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-end")}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 shrink-0"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "mt-2 w-full flex items-center gap-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90 text-sm transition-colors",
            isCollapsed ? "justify-center p-2" : "px-3 py-2"
          )}
          title="Search navigation (⌘K)"
        >
          <Search className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">Search navigation...</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/20">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      <NavSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Main Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1">
        {navItem("/super", "Dashboard", <LayoutDashboard className="w-5 h-5" />, true)}

        {/* Head Section */}
        <div className="pt-2">
          {isCollapsed ? (
            <CollapsedSubmenuPopover
              label="Head"
              items={[
                { href: "/super/head/admins", label: "Admins", icon: <Shield className="w-4 h-4" /> },
                { href: "/super/head/accountants", label: "Accountants", icon: <Calculator className="w-4 h-4" /> },
              ]}
              pathname={pathname}
            >
              <button
                onClick={() => router.push("/super/head/admins")}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg",
                  isActive(pathname, "/super/head")
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10"
                )}
                title="Head"
              >
                <Crown className="w-5 h-5" />
              </button>
            </CollapsedSubmenuPopover>
          ) : (
            <>
              <button
                onClick={() => setHeadExpanded(!headExpanded)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
              >
                <span className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-white/70" />
                  Head
                </span>
                <ChevronLeft
                  className={cn("w-4 h-4 transition-transform text-white/70", headExpanded && "rotate-[-90deg]")}
                />
              </button>
              {headExpanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                  {navItem("/super/head/admins", "Admins", <Shield className="w-4 h-4" />)}
                  {navItem("/super/head/accountants", "Accountants", <Calculator className="w-4 h-4" />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Admin Section */}
        {!isCollapsed && (
          <div className="pt-6 mt-4 border-t border-white/20">
            <p className="px-3 mb-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">
              Admin
            </p>
            <div className="space-y-1">
              {/* Employee Section */}
              <div>
                <button
                  onClick={() => setEmployeeExpanded(!employeeExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-white/70" />
                    Employee
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", employeeExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {employeeExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/employee/masterfile", "Masterfile", <User className="w-4 h-4" />)}
                    {navItem("/super/employee/onboard", "Onboard Employee", <User className="w-4 h-4" />)}
                    {navItem("/super/employee/terminate", "Terminate Employee", <User className="w-4 h-4" />)}
                    {navItem("/super/employee/evaluation", "Evaluation", <FileText className="w-4 h-4" />)}
                  </div>
                )}
              </div>

              {/* Forms Section */}
              <div>
                <button
                  onClick={() => setFormsExpanded(!formsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-white/70" />
                    Forms
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", formsExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {formsExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/forms/onboarding-checklist", "Onboarding Checklist", <FileText className="w-4 h-4" />)}
                    {navItem("/super/forms/clearance-checklist", "Clearance Checklist", <FileText className="w-4 h-4" />)}
                  </div>
                )}
              </div>

              {/* Directory Section */}
              <div>
                <button
                  onClick={() => setDirectoryExpanded(!directoryExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-white/70" />
                    Directory
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", directoryExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {directoryExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/directory/process", "Process", <FileText className="w-4 h-4" />)}
                    {navItem("/super/directory/contacts", "Contacts", <User className="w-4 h-4" />)}
                  </div>
                )}
              </div>

              {/* Attendance Section */}
              <div>
                <button
                  onClick={() => setAttendanceExpanded(!attendanceExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-white/70" />
                    Attendance
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", attendanceExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {attendanceExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/attendance/tardiness", "Tardiness", <Clock className="w-4 h-4" />)}
                    {navItem("/super/attendance/leave", "Leave", <Calendar className="w-4 h-4" />)}
                    {navItem("/super/attendance/leave-credits", "Leave Credits", <Calendar className="w-4 h-4" />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Admin Section */}
        {isCollapsed && (
          <>
            <div className="pt-2">
              <CollapsedSubmenuPopover
                label="Employee"
                items={[
                  { href: "/super/employee/masterfile", label: "Masterfile", icon: <User className="w-4 h-4" /> },
                  { href: "/super/employee/onboard", label: "Onboard Employee", icon: <User className="w-4 h-4" /> },
                  { href: "/super/employee/terminate", label: "Terminate Employee", icon: <User className="w-4 h-4" /> },
                  { href: "/super/employee/evaluation", label: "Evaluation", icon: <FileText className="w-4 h-4" /> },
                ]}
                pathname={pathname}
              >
                <button
                  onClick={() => router.push("/super/employee/masterfile")}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-lg",
                    isActive(pathname, "/super/employee")
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10"
                  )}
                  title="Employee"
                >
                  <Users className="w-5 h-5" />
                </button>
              </CollapsedSubmenuPopover>
            </div>

            <div>
              <CollapsedSubmenuPopover
                label="Forms"
                items={[
                  { href: "/super/forms/onboarding-checklist", label: "Onboarding Checklist", icon: <FileText className="w-4 h-4" /> },
                  { href: "/super/forms/clearance-checklist", label: "Clearance Checklist", icon: <FileText className="w-4 h-4" /> },
                ]}
                pathname={pathname}
              >
                <button
                  onClick={() => router.push("/super/forms/onboarding-checklist")}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-lg",
                    isActive(pathname, "/super/forms")
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10"
                  )}
                  title="Forms"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>
              </CollapsedSubmenuPopover>
            </div>

            <div>
              <CollapsedSubmenuPopover
                label="Directory"
                items={[
                  { href: "/super/directory/process", label: "Process", icon: <FileText className="w-4 h-4" /> },
                  { href: "/super/directory/contacts", label: "Contacts", icon: <User className="w-4 h-4" /> },
                ]}
                pathname={pathname}
              >
                <button
                  onClick={() => router.push("/super/directory/process")}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-lg",
                    isActive(pathname, "/super/directory")
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10"
                  )}
                  title="Directory"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
              </CollapsedSubmenuPopover>
            </div>

            <div>
              <CollapsedSubmenuPopover
                label="Attendance"
                items={[
                  { href: "/super/attendance/tardiness", label: "Tardiness", icon: <Clock className="w-4 h-4" /> },
                  { href: "/super/attendance/leave", label: "Leave", icon: <Calendar className="w-4 h-4" /> },
                  { href: "/super/attendance/leave-credits", label: "Leave Credits", icon: <Calendar className="w-4 h-4" /> },
                ]}
                pathname={pathname}
              >
                <button
                  onClick={() => router.push("/super/attendance/tardiness")}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-lg",
                    isActive(pathname, "/super/attendance")
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10"
                  )}
                  title="Attendance"
                >
                  <Clock className="w-5 h-5" />
                </button>
              </CollapsedSubmenuPopover>
            </div>
          </>
        )}

        {/* Accountant Section */}
        {!isCollapsed && (
          <div className="pt-6 mt-4 border-t border-white/20">
            <p className="px-3 mb-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">
              Accountant
            </p>
            <div className="space-y-1">
              {/* Transactions */}
              <div>
                <button
                  onClick={() => setAccountantTransactionsExpanded(!accountantTransactionsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-white/70" />
                    Transactions
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", accountantTransactionsExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {accountantTransactionsExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/accountant/transactions/deposit", "New Deposit", <Plus className="w-4 h-4" />)}
                    {navItem("/super/accountant/transactions/withdrawal", "New Withdrawal", <Minus className="w-4 h-4" />)}
                    {navItem("/super/accountant/transactions/transfer", "Bank Transfer", <ArrowRightLeft className="w-4 h-4" />)}
                    {navItem("/super/accountant/transactions/journal-entry", "Journal Entry", <Receipt className="w-4 h-4" />)}
                  </div>
                )}
              </div>

              {/* Ledger */}
              <div>
                <button
                  onClick={() => setAccountantLedgerExpanded(!accountantLedgerExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-white/70" />
                    Ledger
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", accountantLedgerExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {accountantLedgerExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                    {/* Bank Ledgers */}
                    <div>
                      <button
                        onClick={() => setAccountantBankLedgersExpanded(!accountantBankLedgersExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-white/60" />
                          Bank Ledgers
                        </span>
                        <ChevronLeft
                          className={cn("w-3 h-3 transition-transform text-white/60", accountantBankLedgersExpanded && "rotate-[-90deg]")}
                        />
                      </button>
                      {accountantBankLedgersExpanded && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-3">
                          {navItem("/super/accountant/ledger/bank-account", "Bank Account Ledger", <BookOpen className="w-3.5 h-3.5" />)}
                          {navItem("/super/accountant/ledger/bank-owner", "Bank Owner Ledger", <User className="w-3.5 h-3.5" />)}
                          {navItem("/super/accountant/ledger/transfer-register", "Transfer Register", <ArrowRightLeft className="w-3.5 h-3.5" />)}
                          {navItem("/super/accountant/ledger/bank-reconciliation", "Bank Reconciliation", <CheckCircle2 className="w-3.5 h-3.5" />)}
                        </div>
                      )}
                    </div>

                    {/* Cash Ledger */}
                    <div>
                      <button
                        onClick={() => setAccountantCashLedgerExpanded(!accountantCashLedgerExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-white/60" />
                          Cash Ledger
                        </span>
                        <ChevronLeft
                          className={cn("w-3 h-3 transition-transform text-white/60", accountantCashLedgerExpanded && "rotate-[-90deg]")}
                        />
                      </button>
                      {accountantCashLedgerExpanded && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-3">
                          {navItem("/super/accountant/ledger/cash-book", "Cash Book", <BookOpen className="w-3.5 h-3.5" />)}
                          {navItem("/super/accountant/ledger/petty-cash", "Petty Cash", <Coins className="w-3.5 h-3.5" />)}
                        </div>
                      )}
                    </div>

                    {/* General Ledger */}
                    <div>
                      <button
                        onClick={() => setAccountantGeneralLedgerExpanded(!accountantGeneralLedgerExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          <BookMarked className="w-4 h-4 text-white/60" />
                          General Ledger
                        </span>
                        <ChevronLeft
                          className={cn("w-3 h-3 transition-transform text-white/60", accountantGeneralLedgerExpanded && "rotate-[-90deg]")}
                        />
                      </button>
                      {accountantGeneralLedgerExpanded && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-3">
                          {navItem("/super/accountant/ledger/general-ledger-book", "General Ledger Book", <BookOpen className="w-3.5 h-3.5" />)}
                          {navItem("/super/accountant/ledger/chart-of-accounts", "Chart of Accounts", <BookMarked className="w-3.5 h-3.5" />)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reports */}
              <div>
                <button
                  onClick={() => setAccountantReportsExpanded(!accountantReportsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-white/70" />
                    Reports
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", accountantReportsExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {accountantReportsExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/accountant/reports/bank-balance", "Bank Balance Summary", <BarChart3 className="w-4 h-4" />)}
                    {navItem("/super/accountant/reports/bank-ledger", "Bank Ledger Report", <FileText className="w-4 h-4" />)}
                    {navItem("/super/accountant/reports/owner-fund", "Owner Fund Report", <BarChart3 className="w-4 h-4" />)}
                    {navItem("/super/accountant/reports/transfer", "Transfer Report", <ArrowRightLeft className="w-4 h-4" />)}
                    {navItem("/super/accountant/reports/voucher-register", "Voucher Register", <FileText className="w-4 h-4" />)}
                    {navItem("/super/accountant/reports/cash-flow", "Cash Flow Report", <BarChart3 className="w-4 h-4" />)}
                  </div>
                )}
              </div>

              {/* Maintenance */}
              <div>
                <button
                  onClick={() => setAccountantMaintenanceExpanded(!accountantMaintenanceExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-white/70" />
                    Maintenance
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", accountantMaintenanceExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {accountantMaintenanceExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/accountant/maintenance/banks", "Banks", <Banknote className="w-4 h-4" />)}
                    {navItem("/super/accountant/maintenance/fund-references", "Fund References", <FolderOpen className="w-4 h-4" />)}
                    {navItem("/super/accountant/maintenance/voucher-series", "Voucher Series", <FileText className="w-4 h-4" />)}
                    {navItem("/super/accountant/maintenance/chart-of-accounts", "Chart of Accounts", <BookMarked className="w-4 h-4" />)}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div>
                <button
                  onClick={() => setAccountantSettingsExpanded(!accountantSettingsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-white/70" />
                    Settings
                  </span>
                  <ChevronLeft
                    className={cn("w-4 h-4 transition-transform text-white/70", accountantSettingsExpanded && "rotate-[-90deg]")}
                  />
                </button>
                {accountantSettingsExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                    {navItem("/super/accountant/settings/fiscal-year", "Fiscal Year", <CalendarIcon className="w-4 h-4" />)}
                    {navItem("/super/accountant/settings/user-roles", "User Roles & Permissions", <UsersRound className="w-4 h-4" />)}
                    {navItem("/super/accountant/settings/system-preferences", "System Preferences", <Sliders className="w-4 h-4" />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Accountant Section */}
        {isCollapsed && (
          <div className="pt-2 space-y-1">
            {/* Transactions */}
            <CollapsedSubmenuPopover
              label="Transactions"
              items={[
                { href: "/super/accountant/transactions/deposit", label: "New Deposit", icon: <Plus className="w-4 h-4" /> },
                { href: "/super/accountant/transactions/withdrawal", label: "New Withdrawal", icon: <Minus className="w-4 h-4" /> },
                { href: "/super/accountant/transactions/transfer", label: "Bank Transfer", icon: <ArrowRightLeft className="w-4 h-4" /> },
                { href: "/super/accountant/transactions/journal-entry", label: "Journal Entry", icon: <Receipt className="w-4 h-4" /> },
              ]}
              pathname={pathname}
            >
              <button
                onClick={() => router.push("/super/accountant/transactions/deposit")}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg",
                  isActive(pathname, "/super/accountant/transactions")
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10"
                )}
                title="Transactions"
              >
                <FileText className="w-5 h-5" />
              </button>
            </CollapsedSubmenuPopover>

            {/* Ledger */}
            <CollapsedSubmenuPopover
              label="Ledger"
              items={[
                { href: "/super/accountant/ledger/bank-account", label: "Bank Account Ledger", icon: <BookOpen className="w-4 h-4" /> },
                { href: "/super/accountant/ledger/bank-owner", label: "Bank Owner Ledger", icon: <BookOpen className="w-4 h-4" /> },
                { href: "/super/accountant/ledger/transfer-register", label: "Transfer Register", icon: <ArrowRightLeft className="w-4 h-4" /> },
                { href: "/super/accountant/ledger/bank-reconciliation", label: "Bank Reconciliation", icon: <CheckCircle2 className="w-4 h-4" /> },
                { href: "/super/accountant/ledger/cash-book", label: "Cash Book", icon: <BookOpen className="w-4 h-4" /> },
                { href: "/super/accountant/ledger/petty-cash", label: "Petty Cash", icon: <Coins className="w-4 h-4" /> },
                { href: "/super/accountant/ledger/general-ledger-book", label: "General Ledger Book", icon: <BookOpen className="w-4 h-4" /> },
                { href: "/super/accountant/ledger/chart-of-accounts", label: "Chart of Accounts", icon: <BookMarked className="w-4 h-4" /> },
              ]}
              pathname={pathname}
            >
              <button
                onClick={() => router.push("/super/accountant/ledger/bank-account")}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg",
                  isActive(pathname, "/super/accountant/ledger")
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10"
                )}
                title="Ledger"
              >
                <BookOpen className="w-5 h-5" />
              </button>
            </CollapsedSubmenuPopover>

            {/* Reports */}
            <CollapsedSubmenuPopover
              label="Reports"
              items={[
                { href: "/super/accountant/reports/bank-balance", label: "Bank Balance Summary", icon: <BarChart3 className="w-4 h-4" /> },
                { href: "/super/accountant/reports/bank-ledger", label: "Bank Ledger Report", icon: <FileText className="w-4 h-4" /> },
                { href: "/super/accountant/reports/owner-fund", label: "Owner Fund Report", icon: <BarChart3 className="w-4 h-4" /> },
                { href: "/super/accountant/reports/transfer", label: "Transfer Report", icon: <ArrowRightLeft className="w-4 h-4" /> },
                { href: "/super/accountant/reports/voucher-register", label: "Voucher Register", icon: <FileText className="w-4 h-4" /> },
                { href: "/super/accountant/reports/cash-flow", label: "Cash Flow Report", icon: <BarChart3 className="w-4 h-4" /> },
              ]}
              pathname={pathname}
            >
              <button
                onClick={() => router.push("/super/accountant/reports/bank-balance")}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg",
                  isActive(pathname, "/super/accountant/reports")
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10"
                )}
                title="Reports"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </CollapsedSubmenuPopover>

            {/* Maintenance */}
            <CollapsedSubmenuPopover
              label="Maintenance"
              items={[
                { href: "/super/accountant/maintenance/banks", label: "Banks", icon: <Banknote className="w-4 h-4" /> },
                { href: "/super/accountant/maintenance/fund-references", label: "Fund References", icon: <FolderOpen className="w-4 h-4" /> },
                { href: "/super/accountant/maintenance/voucher-series", label: "Voucher Series", icon: <FileText className="w-4 h-4" /> },
                { href: "/super/accountant/maintenance/chart-of-accounts", label: "Chart of Accounts", icon: <BookMarked className="w-4 h-4" /> },
              ]}
              pathname={pathname}
            >
              <button
                onClick={() => router.push("/super/accountant/maintenance/banks")}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg",
                  isActive(pathname, "/super/accountant/maintenance")
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10"
                )}
                title="Maintenance"
              >
                <Wrench className="w-5 h-5" />
              </button>
            </CollapsedSubmenuPopover>

            {/* Settings */}
            <CollapsedSubmenuPopover
              label="Settings"
              items={[
                { href: "/super/accountant/settings/fiscal-year", label: "Fiscal Year", icon: <CalendarIcon className="w-4 h-4" /> },
                { href: "/super/accountant/settings/user-roles", label: "User Roles & Permissions", icon: <UsersRound className="w-4 h-4" /> },
                { href: "/super/accountant/settings/system-preferences", label: "System Preferences", icon: <Sliders className="w-4 h-4" /> },
              ]}
              pathname={pathname}
            >
              <button
                onClick={() => router.push("/super/accountant/settings/fiscal-year")}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg",
                  isActive(pathname, "/super/accountant/settings")
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10"
                )}
                title="Settings"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            </CollapsedSubmenuPopover>
          </div>
        )}

        {/* Account Section */}
        {!isCollapsed && (
          <div className="pt-6 mt-4 border-t border-white/20">
            <p className="px-3 mb-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">
              Account
            </p>
            <div className="space-y-0.5">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10" title="Notifications">
                <Bell className="w-5 h-5 text-white/60" />
                Notifications
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10" title="Settings">
                <Settings2 className="w-5 h-5 text-white/60" />
                Settings
              </button>
            </div>
          </div>
        )}

        {/* Collapsed Account Section */}
        {isCollapsed && (
          <div className="pt-4 mt-4 border-t border-white/20 space-y-1">
            <button
              className="w-full flex items-center justify-center p-2.5 rounded-lg text-white/70 hover:bg-white/10"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              className="w-full flex items-center justify-center p-2.5 rounded-lg text-white/70 hover:bg-white/10"
              title="Settings"
              aria-label="Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-white/20">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-white/60 truncate">{user?.email || ""}</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-white/60 shrink-0" />
              </>
            )}
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Settings
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Company Logo */}
      <div className="p-4 border-t border-white/20 flex justify-center">
        <Link href="/super" className="shrink-0 flex items-center justify-center">
          <img
            src="/images/logo/abic-logo.png"
            alt="ABIC"
            className={cn("h-8 object-contain", isCollapsed ? "w-8" : "max-w-[120px]")}
          />
        </Link>
      </div>
    </aside>
  );
}
