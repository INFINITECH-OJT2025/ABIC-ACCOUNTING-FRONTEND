"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import AccountingHeadSidebar from "@/components/accounting-head-sidebar";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type User = { name?: string; email?: string };

type Props = {
  user?: User | null;
  onLogout?: () => void;
};

const ROUTES = {
  dashboard: "/accounting-head",
  owners: "/accounting-head/owners",
  transaction: "/accounting-head/transaction",
  banks: "/accounting-head/banks-accounts",
  pmo: "/accounting-head/pmo",
  accountsSummary: "/accounting-head/accounts-summary",
  activityLogs: "/accounting-head/activity-logs",
  sbc: "/accounting-head/SBC",
  properties: "/accounting-head/properties",
  masterfile: "/accounting-head/masterfile",
};

function getPageTitle(pathname: string | null | undefined) {
  if (!pathname) return "";
  if (pathname === ROUTES.dashboard) return "Dashboard";
  if (pathname === ROUTES.properties) return "Properties";
  if (pathname === ROUTES.masterfile) return "Masterfile";
  if (pathname === ROUTES.owners) return "Owners";
  if (pathname === ROUTES.transaction) return "Transaction";
  if (pathname === ROUTES.banks) return "Banks Accounts";
  if (pathname === ROUTES.pmo) return "PMO";
  if (pathname === ROUTES.accountsSummary) return "Accounts Summary";
  if (pathname === ROUTES.activityLogs) return "Activity Logs";
  if (pathname.startsWith(ROUTES.sbc)) return "SBC";

  const last = pathname.split("/").filter(Boolean).pop();
  if (!last) return "";
  return last
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function TopNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group relative px-6 py-4 text-white/90 hover:text-white transition",
        "hover:bg-white/10",
        active ? "bg-white/10 text-white font-semibold" : "",
      ].join(" ")}
    >
      <span className="relative z-10">{label}</span>
      <span
        className={[
          "absolute bottom-0 left-0 h-[2px] bg-white w-full transition-transform origin-left",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        ].join(" ")}
      />
    </Link>
  );
}

function MobileItem({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "block rounded-md px-3 py-2 text-sm transition",
        active ? "bg-white/10 text-white font-semibold" : "text-white/90 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AccountingHeadHeader({ user, onLogout }: Props) {
  const pathname = usePathname();

  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const [isScrolled, setIsScrolled] = React.useState(false);

  const displayName = user?.name === "Super Admin" ? "Accountant Head" : user?.name;
  const displayEmail = user?.name === "Super Admin" ? "accountanthead@example.com" : user?.email;

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href;
  const isSbcActive = pathname?.startsWith("/accounting-head/SBC");
  const isBanksGroupActive =
    pathname === ROUTES.banks || pathname === ROUTES.pmo || pathname === ROUTES.owners || isSbcActive;

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-50">
      {/* TOP BAR */}
      <div
        className={[
          "transition-all duration-300",
          isScrolled
            ? "bg-gradient-to-r from-[#7B0F2B]/95 to-[#A4163A]/95 backdrop-blur-lg shadow-lg"
            : "bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] shadow-md",
        ].join(" ")}
      >
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Mobile + Brand */}
            <div className="flex items-center gap-3">
              <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-white hover:bg-white/10"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>

                {/* MOBILE DRAWER */}
                <SheetContent
                  side="left"
                  className="w-[280px] p-0 border-none bg-[#7B0F2B] text-white"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="h-full">
                    <AccountingHeadSidebar onNavigate={() => setMobileSidebarOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {pageTitle ? (
          <div className="px-4 sm:px-6 pb-4 pt-2">
            <h1 className="text-white text-base font-semibold tracking-wide">{pageTitle}</h1>
          </div>
        ) : null}
      </div>
    </header>
  );
}
