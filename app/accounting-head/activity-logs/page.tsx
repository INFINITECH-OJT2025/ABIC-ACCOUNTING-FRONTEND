"use client";

import React, { useMemo, useState } from "react";
import { Search, Eye, Filter, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Severity = "Info" | "Warning" | "Critical";

type ActivityLog = {
  id: string;
  actor: string;
  action: string;
  module: string;
  target: string;
  severity: Severity;
  createdAt: string;
  details: string;
};

const BORDER = "rgba(0,0,0,0.12)";

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Badge({ severity }: { severity: Severity }) {
  const style =
    severity === "Critical"
      ? { bg: "rgba(239,68,68,0.12)", fg: "#991b1b" }
      : severity === "Warning"
        ? { bg: "rgba(245,158,11,0.12)", fg: "#92400e" }
        : { bg: "rgba(16,185,129,0.12)", fg: "#065f46" };

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold"
      style={{ background: style.bg, color: style.fg }}
    >
      {severity}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-extrabold text-neutral-700">{children}</div>;
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<ActivityLog | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const logs = useMemo<ActivityLog[]>(
    () => [
      {
        id: uid(),
        actor: "Super Admin",
        action: "Created",
        module: "PMO",
        target: "PMO Account: ABIC Realty",
        severity: "Info",
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toLocaleString(),
        details: "Created PMO account record using Create Account form.",
      },
      {
        id: uid(),
        actor: "Super Admin",
        action: "Updated",
        module: "Owners",
        target: "Owner Account: 0134-6000-7685",
        severity: "Warning",
        createdAt: new Date(Date.now() - 1000 * 60 * 31).toLocaleString(),
        details: "Updated owner bank details. Previous value was overwritten.",
      },
      {
        id: uid(),
        actor: "Accountant Head",
        action: "Deleted",
        module: "Banks",
        target: "Bank Account: SECURITY BANK (202)",
        severity: "Critical",
        createdAt: new Date(Date.now() - 1000 * 60 * 63).toLocaleString(),
        details: "Deleted bank account mapping. This action is irreversible.",
      },
      {
        id: uid(),
        actor: "Super Admin",
        action: "Logged in",
        module: "Auth",
        target: "Login",
        severity: "Info",
        createdAt: new Date(Date.now() - 1000 * 60 * 92).toLocaleString(),
        details: "Successful login.",
      },
      ...Array.from({ length: 26 }).map((_, i) => {
        const sev: Severity = i % 9 === 0 ? "Critical" : i % 4 === 0 ? "Warning" : "Info";
        const mod = i % 5 === 0 ? "SBC" : i % 3 === 0 ? "Accounts Summary" : i % 2 === 0 ? "PMO" : "Banks";
        const act = i % 3 === 0 ? "Exported" : i % 2 === 0 ? "Viewed" : "Updated";
        return {
          id: uid(),
          actor: i % 6 === 0 ? "Accountant Head" : "Super Admin",
          action: act,
          module: mod,
          target: mod === "SBC" ? "Cheque list" : mod === "Accounts Summary" ? "Summary table" : "Record",
          severity: sev,
          createdAt: new Date(Date.now() - 1000 * 60 * (140 + i * 12)).toLocaleString(),
          details: `${act} in ${mod}. (Sample log)`,
        };
      }),
    ],
    []
  );

  const modules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.module));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [logs]);

  const filtered = useMemo(() => {
    let items = logs;
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter((l) => {
        const hay = `${l.actor} ${l.action} ${l.module} ${l.target} ${l.details}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (severity !== "all") items = items.filter((l) => l.severity === severity);
    if (moduleFilter !== "all") items = items.filter((l) => l.module === moduleFilter);

    if (dateRange.start || dateRange.end) {
      const start = dateRange.start ? new Date(dateRange.start) : new Date("1900-01-01");
      const end = dateRange.end ? new Date(dateRange.end + "T23:59:59") : new Date("2100-12-31");
      items = items.filter((l) => {
        const t = new Date(l.createdAt);
        return t >= start && t <= end;
      });
    }

    return items;
  }, [dateRange.end, dateRange.start, logs, moduleFilter, query, severity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const current = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  function downloadReport() {
    const stamp = new Date().toISOString().slice(0, 10);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.setFontSize(14);
    doc.text("Activity Logs Report", 40, 40);

    doc.setFontSize(10);
    const meta = [
      `Generated: ${new Date().toLocaleString()}`,
      query.trim() ? `Search: ${query.trim()}` : "Search: —",
      severity !== "all" ? `Severity: ${severity}` : "Severity: All",
      moduleFilter !== "all" ? `Module: ${moduleFilter}` : "Module: All",
      dateRange.start || dateRange.end
        ? `Date: ${dateRange.start || "—"} to ${dateRange.end || "—"}`
        : "Date: —",
      `Rows: ${filtered.length}`,
    ];
    doc.text(meta, 40, 60);

    const head = [["Date", "User", "Severity", "Module", "Action", "Target", "Details"]];
    const body = filtered.map((l) => [l.createdAt, l.actor, l.severity, l.module, l.action, l.target, l.details]);

    autoTable(doc, {
      head,
      body,
      startY: 110,
      styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [122, 15, 31], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 80 },
        2: { cellWidth: 55 },
        3: { cellWidth: 85 },
        4: { cellWidth: 70 },
        5: { cellWidth: 140 },
        6: { cellWidth: "auto" },
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`activity-logs-${stamp}.pdf`);
  }

  React.useEffect(() => {
    setPage(1);
  }, [query, severity, moduleFilter, dateRange.start, dateRange.end]);

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#5f0c18]">ACTIVITY LOGS</h1>
            <div className="mt-1 text-sm text-neutral-700">UI-only audit trail preview.</div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={
                "inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-3 md:px-4 text-xs md:text-sm font-semibold whitespace-nowrap border hover:bg-neutral-50 " +
                (showFilters ? "bg-[#7a0f1f] text-white border-transparent hover:bg-[#7a0f1f]" : "text-neutral-900")
              }
              style={{ borderColor: showFilters ? undefined : BORDER, height: 36 }}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <button
              type="button"
              onClick={downloadReport}
              className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl px-3 md:px-4 text-xs md:text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap"
              style={{ background: "#7a0f1f", height: 36 }}
            >
              <Download className="h-4 w-4" />
              Report
            </button>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search logs (user, module, action, target...)"
                className="w-full rounded-xl border bg-white px-10 py-2 text-sm outline-none"
                style={{ borderColor: BORDER, height: 40, color: "#111" }}
              />
            </div>

            <div className="text-xs font-semibold text-neutral-600">{filtered.length} result(s)</div>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label>Severity</Label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity | "all")}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                >
                  <option value="all">All</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label>Module</Label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                >
                  {modules.map((m) => (
                    <option key={m} value={m}>
                      {m === "all" ? "All" : m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label>Date start</Label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                />
              </div>

              <div className="grid gap-2">
                <Label>Date end</Label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                  style={{ borderColor: BORDER, height: 40, color: "#111" }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 hidden md:block overflow-x-auto">
            <div className="min-w-[920px] overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: BORDER }}>
              <div
                className="sticky top-0 z-10 grid bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-neutral-900 backdrop-blur border-b"
                style={{ borderColor: BORDER, gridTemplateColumns: "150px 140px 150px 1fr 44px" }}
              >
                <div>Date</div>
                <div>User</div>
                <div>Module</div>
                <div>Action</div>
                <div className="text-right"> </div>
              </div>

              {current.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm font-semibold text-neutral-600">
                  No activity logs found.
                </div>
              ) : (
                current.map((l, idx) => (
                  <div
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(l)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(l);
                    }}
                    className={
                      "group grid items-center px-3 py-2 text-sm border-t cursor-pointer outline-none transition-colors hover:bg-[#7a0f1f]/[0.04] focus-visible:ring-2 focus-visible:ring-[#7a0f1f]/30 " +
                      (idx % 2 === 0 ? "bg-white" : "bg-neutral-50")
                    }
                    style={{ borderColor: BORDER, gridTemplateColumns: "150px 140px 150px 1fr 44px" }}
                  >
                    <div className="text-[11px] font-semibold text-neutral-700 truncate" title={l.createdAt}>
                      {l.createdAt}
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-neutral-900 truncate" title={l.actor}>
                        {l.actor}
                      </div>
                      <div className="text-[11px] text-neutral-600 truncate">Audit</div>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <Badge severity={l.severity} />
                      <div className="text-[11px] font-semibold text-neutral-900 truncate" title={l.module}>
                        {l.module}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-[#5f0c18] truncate" title={`${l.action} • ${l.target}`}>
                        {l.action}
                        <span className="text-neutral-500 font-semibold"> • {l.target}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-neutral-700 truncate" title={l.details}>
                        {l.details}
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-white text-neutral-700 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ borderColor: BORDER }}
                        title="View details"
                        aria-hidden="true"
                      >
                        <Eye className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:hidden">
            {current.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm font-semibold text-neutral-600">
                No activity logs found.
              </div>
            ) : (
              current.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelected(l)}
                  className="rounded-2xl border bg-white p-4 text-left"
                  style={{ borderColor: BORDER }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#5f0c18] truncate">{l.action}</div>
                      <div className="mt-1 text-xs font-semibold text-neutral-700 truncate">{l.target}</div>
                    </div>
                    <Badge severity={l.severity} />
                  </div>
                  <div className="mt-3 grid gap-1">
                    <div className="text-[11px] text-neutral-700">
                      <span className="font-extrabold">User:</span> {l.actor}
                    </div>
                    <div className="text-[11px] text-neutral-700">
                      <span className="font-extrabold">Module:</span> {l.module}
                    </div>
                    <div className="text-[11px] text-neutral-700">
                      <span className="font-extrabold">Date:</span> {l.createdAt}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] font-semibold text-neutral-700 line-clamp-2">{l.details}</div>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#7a0f1f]">
                    <Eye className="h-4 w-4" />
                    View details
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold text-neutral-600">
              Page {safePage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                style={{ borderColor: BORDER, height: 32 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                style={{ borderColor: BORDER, height: 32 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl border"
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-extrabold text-[#5f0c18] truncate">{selected.action}</div>
                <div className="mt-1 text-xs font-semibold text-neutral-700 truncate">{selected.target}</div>
              </div>
              <button
                type="button"
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                style={{ borderColor: BORDER, color: "#111" }}
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
                  <div className="text-[11px] font-extrabold text-neutral-700">Severity</div>
                  <div className="mt-2">
                    <Badge severity={selected.severity} />
                  </div>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
                  <div className="text-[11px] font-extrabold text-neutral-700">Module</div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">{selected.module}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
                  <div className="text-[11px] font-extrabold text-neutral-700">User</div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">{selected.actor}</div>
                </div>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
                <div className="text-[11px] font-extrabold text-neutral-700">Date</div>
                <div className="mt-2 text-sm font-semibold text-neutral-900">{selected.createdAt}</div>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
                <div className="text-[11px] font-extrabold text-neutral-700">Details</div>
                <div className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">{selected.details}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}