"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  BookOpen,
  ChevronLeft,
  Clock,
  FolderOpen,
  HelpCircle,
  Home,
  LogOut,
  PanelLeft,
  Settings,
  User,
  Receipt,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ROUTES = {
  dashboard: "/accounting-head",
  owners: "/accounting-head/owners",
  transaction: "/accounting-head/transaction",
  banks: "/accounting-head/banks-accounts",
  pmo: "/accounting-head/pmo",
  units: "/accounting-head/units",
  properties: "/accounting-head/properties",
  accountsSummary: "/accounting-head/accounts-summary",
  activityLogs: "/accounting-head/activity-logs",
  sbc: "/accounting-head/SBC",
  profile: "/accounting-head/profile",
  settings: "/accounting-head/settings",
  help: "/accounting-head/help",
} as const;

type NotificationItem = {
  id: string;
  title: string;
  details: string;
  createdAt: string;
  read: boolean;
};

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}

function NotificationsDrawer({
  open,
  onClose,
  notifications,
  setNotifications,
}: {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}) {
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div
        className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{
          animation: "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <div className="text-sm font-extrabold text-neutral-900">Notifications</div>
            <div className="text-xs text-neutral-600">{unreadCount} unread</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-neutral-100"
            aria-label="Close notifications"
          >
            <ChevronLeft className="w-5 h-5 rotate-180 text-neutral-700" />
          </button>
        </div>

        <div className="p-3 border-b flex items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border hover:bg-neutral-50"
            style={{ borderColor: "rgba(0,0,0,0.12)", height: 34 }}
            onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          >
            Mark all read
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border text-red-600 hover:bg-red-50"
            style={{ borderColor: "rgba(0,0,0,0.12)", height: 34 }}
            onClick={() => setNotifications([])}
          >
            Clear
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-neutral-600">No notifications</div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            {notifications.slice(0, 50).map((n) => (
              <div key={n.id} className="px-4 py-4 border-b hover:bg-neutral-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={"text-sm font-semibold truncate " + (n.read ? "text-neutral-700" : "text-[#5f0c18]")}>{n.title}</div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-[#7B0F2B] flex-shrink-0" />}
                    </div>
                    {n.details?.trim() ? <div className="mt-1 text-xs text-neutral-700">{n.details}</div> : null}
                    <div className="mt-2 text-[11px] font-semibold text-neutral-500">{n.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-neutral-100"
                      onClick={() => setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                      disabled={n.read}
                      title={n.read ? "Read" : "Mark as read"}
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-red-50 text-red-600"
                      onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const isActive = (pathname: string, href: string, exact?: boolean) => {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
};

function CollapsedSubmenuPopover({
  label,
  items,
  pathname,
  children,
  onNavigate,
}: {
  label: string;
  items: { href: string; label: string; icon: React.ReactNode }[];
  pathname: string;
  children: React.ReactNode;
  onNavigate?: () => void;
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
      const popoverWidth = 220;
      const popoverMaxHeight = 420;
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !openedByClick) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
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

  const popoverContent =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={(el) => {
          popoverRef.current = el;
        }}
        className="fixed min-w-[220px] max-w-[min(320px,90vw)] max-h-[min(70vh,420px)] overflow-y-auto py-2 px-2 rounded-lg bg-white shadow-xl border border-gray-200 z-[9999]"
        style={{ top: position.top, left: position.left }}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <div className="px-3 py-2 mb-1 border-b border-gray-100">
          <p className="text-xs font-semibold text-[#7B0F2B] uppercase tracking-wider">{label}</p>
        </div>
        <div className="space-y-0.5">
          {items.map((item) => {
            const active = isActive(pathname, item.href, item.href === ROUTES.dashboard);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-[#7B0F2B]/10 text-[#7B0F2B]" : "text-gray-700 hover:bg-gray-100"
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
    <div ref={triggerRef} className="relative" onMouseEnter={show} onMouseLeave={hide}>
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

function SearchModal({
  open,
  onClose,
  items,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  items: { href: string; label: string; icon: React.ReactNode }[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((x) => x.label.toLowerCase().includes(query) || x.href.toLowerCase().includes(query));
  }, [items, q]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-16 w-[min(720px,92vw)] -translate-x-1/2 rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search navigation..."
              className="w-full outline-none text-sm"
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[min(60vh,520px)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No results</div>
          ) : (
            <div className="space-y-0.5">
              {filtered.slice(0, 50).map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    onNavigate?.();
                    router.push(item.href);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50"
                >
                  <span className="shrink-0 text-gray-500">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto text-xs text-gray-400">{item.href}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 360;
const SIDEBAR_DEFAULT = 280;

export default function AccountingHeadSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchModalKey, setSearchModalKey] = useState(0);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useLocalStorageState<NotificationItem[]>("ah_notifications", [
    {
      id: uid(),
      title: "SBC cheque upload enabled",
      details: "Cheque pay mode now supports up to 2 photo proofs.",
      createdAt: new Date().toLocaleString(),
      read: false,
    },
  ]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const [banksExpanded, setBanksExpanded] = useState(
    isActive(pathname, ROUTES.banks) ||
      isActive(pathname, ROUTES.pmo) ||
      isActive(pathname, ROUTES.owners) ||
      isActive(pathname, ROUTES.sbc)
  );

  const navItem = (href: string, label: string, icon: React.ReactNode, exact?: boolean) => {
    const active = isActive(pathname, href, exact);
    return (
      <Link
        href={href}
        onClick={onNavigate}
        title={label}
        aria-label={label}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isCollapsed && "justify-center",
          active
            ? "bg-white/25 text-white ring-1 ring-white/20"
            : "text-white/80 hover:bg-white/25 hover:text-white hover:ring-1 hover:ring-white/20 focus-visible:bg-white/25 focus-visible:ring-1 focus-visible:ring-white/20"
        )}
      >
        <span className={cn("shrink-0", active ? "text-white" : "text-white/70")}>{icon}</span>
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const actionItem = (label: string, icon: React.ReactNode, onClick: () => void, badge?: React.ReactNode) => {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onClick();
        }}
        title={label}
        aria-label={label}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isCollapsed && "justify-center",
          "text-white/80 hover:bg-white/25 hover:text-white hover:ring-1 hover:ring-white/20 focus-visible:bg-white/25 focus-visible:ring-1 focus-visible:ring-white/20"
        )}
      >
        <span className="shrink-0 text-white/70 relative">
          {icon}
          {badge}
        </span>
        {!isCollapsed && (
          <span className="truncate flex-1 text-left">
            {label}
          </span>
        )}
        {!isCollapsed && badge ? <span className="ml-auto" /> : null}
      </button>
    );
  };

  const searchItems = useMemo(
    () => [
      { href: ROUTES.dashboard, label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
      { href: ROUTES.banks, label: "BANKS", icon: <FolderOpen className="w-4 h-4" /> },
      { href: ROUTES.pmo, label: "PMO", icon: <Clock className="w-4 h-4" /> },
      { href: ROUTES.sbc, label: "SBC", icon: <Receipt className="w-4 h-4" /> },
      { href: ROUTES.owners, label: "OWNERS", icon: <BookOpen className="w-4 h-4" /> },
      { href: ROUTES.units, label: "Units", icon: <Home className="w-4 h-4" /> },
      { href: ROUTES.properties, label: "Properties", icon: <Building2 className="w-4 h-4" /> },
      { href: ROUTES.transaction, label: "Transaction", icon: <Receipt className="w-4 h-4" /> },
      { href: ROUTES.accountsSummary, label: "Accounts Summary", icon: <BarChart3 className="w-4 h-4" /> },
      { href: ROUTES.activityLogs, label: "Activity Logs", icon: <Clock className="w-4 h-4" /> },
      { href: ROUTES.profile, label: "Profile", icon: <User className="w-4 h-4" /> },
      { href: ROUTES.settings, label: "Settings", icon: <Settings className="w-4 h-4" /> },
      { href: ROUTES.help, label: "Help", icon: <HelpCircle className="w-4 h-4" /> },
    ],
    []
  );

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#7B0F2B] via-[#8B1535] to-[#A4163A] border-r border-[#6A0D25]/50 shrink-0 shadow-lg shadow-[#7B0F2B]/20 relative",
        !isCollapsed && "transition-[width] duration-200 ease-out"
      )}
      style={{ width: isCollapsed ? 72 : sidebarWidth }}
    >
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

      <div className="p-4 border-b border-white/20">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-end")}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 shrink-0"
            title={isCollapsed ? "Expand" : "Collapse"}
            type="button"
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={() => {
            setSearchModalKey((k) => k + 1);
            setSearchOpen(true);
          }}
          className={cn(
            "mt-2 w-full flex items-center gap-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90 text-sm transition-colors",
            isCollapsed ? "justify-center p-2" : "px-3 py-2"
          )}
          title="Search navigation"
          type="button"
        >
          <Search className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">Search navigation...</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/20">Ctrl K</kbd>
            </>
          )}
        </button>
      </div>

      <SearchModal
        key={searchModalKey}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={searchItems}
        onNavigate={onNavigate}
      />

      <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
        {navItem(ROUTES.dashboard, "Dashboard", <BarChart3 className="w-5 h-5" />, true)}

        <div className="pt-2">
          {isCollapsed ? (
            <CollapsedSubmenuPopover
              label="Banks"
              items={[
                { href: ROUTES.banks, label: "BANKS", icon: <FolderOpen className="w-4 h-4" /> },
                { href: ROUTES.pmo, label: "PMO", icon: <Clock className="w-4 h-4" /> },
                { href: ROUTES.sbc, label: "SBC", icon: <Receipt className="w-4 h-4" /> },
                { href: ROUTES.owners, label: "OWNERS", icon: <BookOpen className="w-4 h-4" /> },
              ]}
              pathname={pathname}
              onNavigate={onNavigate}
            >
              <button
                onClick={() => {
                  onNavigate?.();
                  router.push(ROUTES.banks);
                }}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg",
                  isActive(pathname, ROUTES.banks) ||
                    isActive(pathname, ROUTES.pmo) ||
                    isActive(pathname, ROUTES.owners) ||
                    isActive(pathname, ROUTES.sbc)
                    ? "bg-white/25 text-white ring-1 ring-white/20"
                    : "text-white/70 hover:bg-white/25 hover:ring-1 hover:ring-white/20"
                )}
                title="Banks"
                type="button"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
            </CollapsedSubmenuPopover>
          ) : (
            <>
              <button
                onClick={() => setBanksExpanded(!banksExpanded)}
                title="Banks"
                aria-label="Banks"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
                type="button"
              >
                <span className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-white/70" />
                  Banks
                </span>
                <ChevronLeft
                  className={cn("w-4 h-4 transition-transform text-white/70", banksExpanded && "rotate-[-90deg]")}
                />
              </button>

              {banksExpanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                  {navItem(ROUTES.banks, "BANKS", <FolderOpen className="w-4 h-4" />)}
                  {navItem(ROUTES.pmo, "PMO", <Clock className="w-4 h-4" />)}
                  {navItem(ROUTES.sbc, "SBC", <Receipt className="w-4 h-4" />)}
                  {navItem(ROUTES.owners, "OWNERS", <BookOpen className="w-4 h-4" />)}
                </div>
              )}
            </>
          )}
        </div>

        {navItem(ROUTES.units, "Units", <Home className="w-5 h-5" />)}
        {navItem(ROUTES.properties, "Properties", <Building2 className="w-5 h-5" />)}

        {navItem(ROUTES.transaction, "Transaction", <Receipt className="w-5 h-5" />)}
        {navItem(ROUTES.accountsSummary, "Accounts Summary", <BarChart3 className="w-5 h-5" />)}
        {navItem(ROUTES.activityLogs, "Activity Logs", <Clock className="w-5 h-5" />)}

        <div className="pt-3 mt-3 border-t border-white/20" />

        {actionItem(
          "Notifications",
          <Bell className="w-5 h-5" />,
          () => setNotificationsOpen(true),
          unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-white text-[#7B0F2B] text-[10px] font-extrabold grid place-items-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null
        )}

        {navItem(ROUTES.profile, "Profile", <User className="w-5 h-5" />)}
        {navItem(ROUTES.settings, "Settings", <Settings className="w-5 h-5" />)}
        {navItem(ROUTES.help, "Help", <HelpCircle className="w-5 h-5" />)}

        {actionItem("Logout", <LogOut className="w-5 h-5" />, () => router.push("/login"))}
      </nav>

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
      />

      <div className="p-4 border-t border-white/20 flex justify-center">
        <Link href={ROUTES.dashboard} className="shrink-0 flex items-center justify-center">
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
