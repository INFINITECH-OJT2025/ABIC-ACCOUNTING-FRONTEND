import type { ReactNode } from "react";
import AccountingHeadHeader from "@/components/accounting-head-header";
import AccountingHeadSidebar from "@/components/accounting-head-sidebar";

export default function AccountingHeadLayout({ children }: { children: ReactNode }) {
  // sample user lang (palitan mo later kapag may auth ka na)
  const user = { name: "Super Admin", email: "superadmin@example.com" };

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        <div className="hidden md:block h-screen sticky top-0">
          <AccountingHeadSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <AccountingHeadHeader user={user} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
