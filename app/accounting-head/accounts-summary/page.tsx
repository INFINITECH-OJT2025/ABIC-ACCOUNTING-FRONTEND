"use client";

import React from "react";

type TabKey =
  | "remaining"
  | "clientDebt"
  | "unitOwner"
  | "bankAccounts"
  | "otherBankAccounts"
  | "condoAccounts"
  | "employeeAccounts"
  | "securityContacts";

type MoneyRow = {
  clientName: string;
  amount: number;
};

type BankRow = {
  name: string;
  bank: string;
  accountName: string;
  accountNumber: string;
};

type OwnerRow = {
  owner: string;
  unit: string;
};

type CondoBankRow = {
  condominium: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  personInCharge: string;
};

type ContactRow = {
  branch: string;
  phoneNo: string;
  emailAddress: string;
  viber: string;
};

function peso(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}₱${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CellMoney({ value }: { value: number }) {
  const negative = value < 0;
  return <span className={negative ? "font-extrabold text-red-600" : "font-semibold text-neutral-900"}>{peso(value)}</span>;
}

const BORDER = "rgba(0,0,0,0.12)";

function TableShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: BORDER }}>
      <div className="px-4 py-3 text-xs font-extrabold border-b bg-white" style={{ borderColor: BORDER, color: "#5f0c18" }}>
        {title}
      </div>
      <div className="overflow-auto">{children}</div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        "sticky top-0 z-10 px-3 py-2 text-[11px] font-extrabold text-neutral-900 bg-white/95 backdrop-blur border-b border-r whitespace-nowrap [&:last-child]:border-r-0 " +
        (className ?? "")
      }
      style={{ borderColor: BORDER }}
    >
      {children}
    </th>
  );
}

function Td({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={
        "px-3 py-2 text-[11px] text-neutral-900 border-b border-r align-top [&:last-child]:border-r-0 " + (className ?? "")
      }
      style={{ borderColor: BORDER }}
    >
      {children}
    </td>
  );
}

export default function Page() {
  const [tab, setTab] = React.useState<TabKey>("remaining");

  const remainingClientMoney: MoneyRow[] = [
    { clientName: "ABIC - UNIT 303", amount: 154_312.08 },
    { clientName: "ABIC REALTY", amount: 1_000.0 },
    { clientName: "ANGELLE SARMiento", amount: -320_939.97 },
    { clientName: "DANDAN LI", amount: -36_026.25 },
    { clientName: "GUO JUNSHENG", amount: -33_566.79 },
    { clientName: "WENJUN LIAO", amount: -54_000.0 },
    { clientName: "ZHAO XUAN", amount: -5_676.07 },
  ];

  const clientDebt: MoneyRow[] = [
    { clientName: "ABIC - UNIT 303", amount: -154_312.08 },
    { clientName: "ABIC REALTY", amount: -1_000.0 },
    { clientName: "ANGELLE SARMiento", amount: -320_939.97 },
    { clientName: "DANDAN LI", amount: -36_026.25 },
    { clientName: "GUO JUNSHENG", amount: -33_566.79 },
    { clientName: "WENJUN LIAO", amount: -54_000.0 },
    { clientName: "ZHAO XUAN", amount: -5_676.07 },
  ];

  const unitOwners: OwnerRow[] = [
    { owner: "ABIGAIL RUTHCHIN LAIFUN LIM", unit: "Bellagio B3 Slot 10" },
    { owner: "ALFONSO VY", unit: "Jazz Res. Tower A 1602" },
    { owner: "AMADOR, KRISTINE ANNE BANTOC", unit: "Air Res. 2470" },
    { owner: "ATHENA SOPHIA RHOSSA TIBI", unit: "Seibu A82" },
  ];

  const bankAccounts: BankRow[] = [
    { name: "ABIC REALTY", bank: "SECURITY BANK (202)", accountName: "ABIC REALTY CORPORATION", accountNumber: "0000-043-381-202" },
    { name: "ABIC REALTY", bank: "SECURITY BANK (443)", accountName: "ABIC REALTY CORPORATION", accountNumber: "0000-043-382-443" },
    { name: "ABIC REALTY", bank: "SECURITY BANK (483)", accountName: "ABIC REALTY CORPORATION", accountNumber: "0000-043-382-483" },
    { name: "ABIC REALTY & CONSULTANCY", bank: "SECURITY BANK (544)", accountName: "ABIC REALTY & CONSULTANCY CORP", accountNumber: "0000-067-389-544" },
    { name: "ABIC UNO TRADING", bank: "SECURITY BANK - USD", accountName: "ABIC UNO TRADING CORP.", accountNumber: "0000-057-905-043" },
  ];

  const otherBankAccounts: BankRow[] = [
    {
      name: "KALBE INTERNATIONAL PTE LTD.",
      bank: "PHILIPPINE BUSINESS BANK",
      accountName: "KALBE INTERNATIONAL PTE LTD.",
      accountNumber: "011000002780",
    },
    {
      name: "INFINITECH ADVERTISING CORPORATION",
      bank: "SECURITY BANK",
      accountName: "INFINITECH ADVERTISING CORPORATION",
      accountNumber: "0000072464883",
    },
  ];

  const condoAccounts: CondoBankRow[] = [
    {
      condominium: "Avida Avenue Tower",
      bank: "SECURITY BANK",
      accountName: "ADB Tower Condominium Corp",
      accountNumber: "000018983147",
      personInCharge: "—",
    },
    {
      condominium: "Alea Residences",
      bank: "GCASH (Bills Payment)",
      accountName: "DMCI Homes (Condo Corp)",
      accountNumber: "Alea Bldg 409",
      personInCharge: "Brent/20%",
    },
    {
      condominium: "Bellagio Two Condominium",
      bank: "CHINABANK",
      accountName: "Bellagio Two Condominium Association, Inc.",
      accountNumber: "2550017017",
      personInCharge: "—",
    },
    {
      condominium: "Brinton Place",
      bank: "GCASH (Bills Payment)",
      accountName: "depends who own the unit property",
      accountNumber: "Brent4204",
      personInCharge: "Brent/20%",
    },
    {
      condominium: "Fairlane",
      bank: "GCASH (Paymongo)",
      accountName: "3518",
      accountNumber: "6000135018",
      personInCharge: "FLN 3518",
    },
  ];

  const employeeBankAccounts: BankRow[] = [
    { name: "ANGELY VICTORIANO", bank: "BDO", accountName: "ANGELY VICTORIANO", accountNumber: "013460007685" },
    { name: "MARIA KRISSA CHAREZ R. BONGON", bank: "SECURITY BANK", accountName: "MARIA KRISSA CHAREZ R. BONGON", accountNumber: "000069637410" },
  ];

  const contactDetails: ContactRow[] = [
    {
      branch: "SECURITY BANK - MEDICAL PLAZA",
      phoneNo: "0917-386-5938",
      emailAddress: "—",
      viber: "0917-886-5938",
    },
    {
      branch: "SECURITY BANK - CHINO ROCES - YAKAL",
      phoneNo: "0917-845-3693 / 0920-986-0419",
      emailAddress: "cmarano@securitybank.com.ph",
      viber: "0917-845-3693",
    },
    {
      branch: "SECURITY BANK - PASAY TAFT BRANCH",
      phoneNo: "0917-801-3469 / 0920-977-9755",
      emailAddress: "sbracemonte@securitybank.com.ph / ajalina@securitybank.phpasaytaft@securitybank.com.ph",
      viber: "—",
    },
  ];

  const totalRemaining = remainingClientMoney.reduce((a, r) => a + r.amount, 0);
  const totalDebt = clientDebt.reduce((a, r) => a + r.amount, 0);
  const totalActualMoney = Math.max(0, totalRemaining);
  const missingAmount = totalRemaining < 0 ? totalRemaining : 0;

  const tabs = React.useMemo(
    () =>
      [
        { key: "remaining" as const, label: "Remaining Client Money" },
        { key: "clientDebt" as const, label: "Client Debt" },
        { key: "unitOwner" as const, label: "Unit Owner" },
        { key: "bankAccounts" as const, label: "Bank Accounts" },
        { key: "otherBankAccounts" as const, label: "Other Bank Accounts" },
        { key: "condoAccounts" as const, label: "Condo/Property GCash/Bank" },
        { key: "employeeAccounts" as const, label: "Employee Bank Accounts" },
        { key: "securityContacts" as const, label: "Security Bank Contacts" },
      ] as const,
    []
  );

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-[#5f0c18]">Accounts Summary</h1>
            <div className="mt-1 text-sm text-neutral-700">UI-only tables based on your spreadsheet layout.</div>
          </div>
        </div>

        <div className="mt-6 border-b" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
          <div className="flex items-center gap-6 text-sm font-semibold text-neutral-700 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={"py-3 relative whitespace-nowrap " + (tab === t.key ? "text-[#7a0f1f]" : "text-neutral-600 hover:text-neutral-900")}
              >
                {t.label}
                {tab === t.key && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#7a0f1f]" />}
              </button>
            ))}
          </div>
        </div>

        {tab === "remaining" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="REMAINING CLIENT MONEY & CLIENT DEBT">
              <table className="min-w-[520px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[70%]">CLIENT NAME</Th>
                    <Th className="w-[30%] text-right">AMOUNT</Th>
                  </tr>
                </thead>
                <tbody>
                  {remainingClientMoney.map((r, idx) => (
                    <tr
                      key={r.clientName}
                      className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}
                    >
                      <Td className="font-semibold">{r.clientName}</Td>
                      <Td className="text-right">
                        <CellMoney value={r.amount} />
                      </Td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-200">
                    <Td className="font-extrabold">TOTAL REMAINING CLIENT MONEY</Td>
                    <Td className="text-right font-extrabold">
                      <CellMoney value={totalRemaining} />
                    </Td>
                  </tr>
                  <tr className="bg-neutral-200">
                    <Td className="font-extrabold">TOTAL CLIENT DEBT</Td>
                    <Td className="text-right font-extrabold">
                      <CellMoney value={totalDebt} />
                    </Td>
                  </tr>
                  <tr>
                    <Td className="font-extrabold bg-neutral-100">TOTAL ACTUAL MONEY</Td>
                    <Td className="text-right font-extrabold bg-neutral-100">
                      <CellMoney value={totalActualMoney} />
                    </Td>
                  </tr>
                  <tr>
                    <Td className="font-extrabold bg-neutral-100">MISSING AMOUNT</Td>
                    <Td className="text-right font-extrabold bg-neutral-100">
                      <CellMoney value={missingAmount} />
                    </Td>
                  </tr>
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {tab === "clientDebt" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="CLIENT DEBT">
              <table className="min-w-[620px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[70%]">CLIENT NAME</Th>
                    <Th className="w-[30%] text-right">AMOUNT</Th>
                  </tr>
                </thead>
                <tbody>
                  {clientDebt.map((r, idx) => (
                    <tr
                      key={r.clientName}
                      className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}
                    >
                      <Td className="font-semibold">{r.clientName}</Td>
                      <Td className="text-right">
                        <CellMoney value={r.amount} />
                      </Td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-200">
                    <Td className="font-extrabold text-right" colSpan={1}>
                      TOTAL DEBT
                    </Td>
                    <Td className="text-right font-extrabold">
                      <CellMoney value={totalDebt} />
                    </Td>
                  </tr>
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {tab === "unitOwner" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="UNIT OWNER">
              <table className="min-w-[720px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th>OWNER</Th>
                    <Th>UNIT</Th>
                  </tr>
                </thead>
                <tbody>
                  {unitOwners.map((r, idx) => (
                    <tr key={r.owner} className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}>
                      <Td className="font-semibold">{r.owner}</Td>
                      <Td className="font-semibold">{r.unit}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {tab === "bankAccounts" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="BANK ACCOUNTS">
              <table className="min-w-[860px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[20%]">NAME</Th>
                    <Th className="w-[20%]">BANK</Th>
                    <Th className="w-[35%]">ACCOUNT NAME</Th>
                    <Th className="w-[25%]">ACCOUNT NUMBER</Th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((r, idx) => (
                    <tr key={idx} className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}>
                      <Td className="font-semibold">{r.name}</Td>
                      <Td className="font-semibold">{r.bank}</Td>
                      <Td className="font-semibold">{r.accountName}</Td>
                      <Td className="font-semibold">{r.accountNumber}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {tab === "otherBankAccounts" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="OTHER BANK ACCOUNTS">
              <table className="min-w-[860px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[30%]">NAME</Th>
                    <Th className="w-[25%]">BANK</Th>
                    <Th className="w-[25%]">ACCOUNT NAME</Th>
                    <Th className="w-[20%]">ACCOUNT NUMBER</Th>
                  </tr>
                </thead>
                <tbody>
                  {otherBankAccounts.map((r, idx) => (
                    <tr key={idx} className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}>
                      <Td className="font-semibold">{r.name}</Td>
                      <Td className="font-semibold">{r.bank}</Td>
                      <Td className="font-semibold">{r.accountName}</Td>
                      <Td className="font-semibold">{r.accountNumber}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {tab === "condoAccounts" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="CONDO / PROPERTY GCASH/BANK ACCOUNTS">
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[22%]">CONDOMINIUM</Th>
                    <Th className="w-[18%]">BANK</Th>
                    <Th className="w-[28%]">ACCOUNT NAME</Th>
                    <Th className="w-[20%]">ACCOUNT NUMBER</Th>
                    <Th className="w-[12%]">PERSON IN CHARGE</Th>
                  </tr>
                </thead>
                <tbody>
                  {condoAccounts.map((r, idx) => (
                    <tr key={idx} className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}>
                      <Td className="font-semibold">{r.condominium}</Td>
                      <Td className="font-semibold">{r.bank}</Td>
                      <Td className="font-semibold">{r.accountName}</Td>
                      <Td className="font-semibold">{r.accountNumber}</Td>
                      <Td className="font-semibold">{r.personInCharge}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {tab === "employeeAccounts" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="ABIC EMPLOYEE BANK ACCOUNTS">
              <table className="min-w-[860px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[35%]">NAME</Th>
                    <Th className="w-[20%]">BANK</Th>
                    <Th className="w-[25%]">ACCOUNT NAME</Th>
                    <Th className="w-[20%]">ACCOUNT NUMBER</Th>
                  </tr>
                </thead>
                <tbody>
                  {employeeBankAccounts.map((r, idx) => (
                    <tr key={idx} className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}>
                      <Td className="font-semibold">{r.name}</Td>
                      <Td className="font-semibold">{r.bank}</Td>
                      <Td className="font-semibold">{r.accountName}</Td>
                      <Td className="font-semibold">{r.accountNumber}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
        )}

        {tab === "securityContacts" && (
          <div className="mt-6 grid gap-6">
            <TableShell title="SECURITY BANK CONTACT DETAILS">
              <table className="min-w-[980px] w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[25%]">BRANCH</Th>
                    <Th className="w-[22%]">PHONE NO.</Th>
                    <Th className="w-[40%]">EMAIL ADDRESS</Th>
                    <Th className="w-[13%]">VIBER</Th>
                  </tr>
                </thead>
                <tbody>
                  {contactDetails.map((r, idx) => (
                    <tr key={idx} className={(idx % 2 === 0 ? "bg-white" : "bg-neutral-50") + " hover:bg-[#7a0f1f]/5"}>
                      <Td className="font-semibold">{r.branch}</Td>
                      <Td className="font-semibold">{r.phoneNo}</Td>
                      <Td className="font-semibold">{r.emailAddress}</Td>
                      <Td className="font-semibold">{r.viber}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
        )}
      </main>
    </div>
  );
}