"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Landmark,
  NotebookTabs,
  ScrollText,
  ClipboardList,
  StickyNote,
  Search,
  BarChart3,
  PieChart,
  TrendingUp,
  Wallet,
  CalendarDays,
  FileText,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

type Task = {
  id: string;
  text: string;
  done: boolean;
};

type ActivityItem = {
  id: string;
  title: string;
  details: string;
  createdAt: string;
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

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-neutral-700">{title}</div>
          <div className="mt-2 text-2xl font-extrabold text-[#5f0c18]">{value}</div>
          <div className="mt-1 text-xs text-neutral-700">{subtitle}</div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-[#7a0f1f]/10 grid place-items-center text-[#7a0f1f] flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
      <div className="px-5 py-4 border-b flex items-start justify-between gap-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[#5f0c18]">{title}</div>
          <div className="mt-1 text-xs text-neutral-700">{subtitle}</div>
        </div>
        <div className="h-9 w-9 rounded-xl bg-[#7a0f1f]/10 grid place-items-center text-[#7a0f1f] flex-shrink-0">{icon}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MetricRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border bg-white px-4 py-3" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-neutral-700">{label}</div>
          <div className="mt-1 text-lg font-extrabold text-[#5f0c18] truncate">{value}</div>
        </div>
        <div className="text-[11px] font-semibold text-neutral-600 text-right">{hint}</div>
      </div>
    </div>
  );
}

function SparkBars({ values, colors }: { values: number[]; colors: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {values.map((v, idx) => (
        <div
          key={idx}
          className="w-2.5 rounded-md"
          style={{ height: `${Math.max(8, Math.round((v / max) * 64))}px`, background: colors[idx % colors.length] }}
        />
      ))}
    </div>
  );
}

export default function Page() {
  const [globalQuery, setGlobalQuery] = useState("");

  const [tasks, setTasks] = useLocalStorageState<Task[]>("ah_dashboard_tasks", [
    { id: uid(), text: "Review SBC transactions", done: false },
    { id: uid(), text: "Check bank accounts status", done: false },
  ]);
  const [newTask, setNewTask] = useState("");
  const [notes, setNotes] = useLocalStorageState<string>(
    "ah_dashboard_notes",
    "Keep notes here. This is saved locally in the browser."
  );

  const [activity, setActivity] = useLocalStorageState<ActivityItem[]>("ah_dashboard_activity", [
    {
      id: uid(),
      title: "Dashboard created",
      details: "UI-only timeline. You can edit or remove entries.",
      createdAt: new Date().toLocaleString(),
    },
  ]);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDetails, setNewActivityDetails] = useState("");

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" });
  }, []);

  const doneCount = tasks.filter((t) => t.done).length;

  const addTask = () => {
    const t = newTask.trim();
    if (!t) return;
    setTasks((prev) => [{ id: uid(), text: t, done: false }, ...prev]);
    setNewTask("");
  };

  const addActivity = () => {
    const t = newActivityTitle.trim();
    const d = newActivityDetails.trim();
    if (!t && !d) return;
    setActivity((prev) => [
      {
        id: uid(),
        title: t || "Untitled",
        details: d,
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setNewActivityTitle("");
    setNewActivityDetails("");
  };

  const q = globalQuery.trim().toLowerCase();

  const filteredTasks = useMemo(() => {
    if (!q) return tasks;
    return tasks.filter((t) => t.text.toLowerCase().includes(q));
  }, [q, tasks]);

  const notesMatches = useMemo(() => {
    if (!q) return true;
    return notes.toLowerCase().includes(q);
  }, [notes, q]);

  const filteredActivity = useMemo(() => {
    if (!q) return activity;
    return activity.filter((a) => `${a.title} ${a.details}`.toLowerCase().includes(q));
  }, [activity, q]);

  const chartData = useMemo(() => {
    const deposits = 62000;
    const withdrawals = 38500;
    const maxCash = Math.max(deposits, withdrawals, 1);

    const monthly = [
      { label: "Oct", deposits: 12000, withdrawals: 8000 },
      { label: "Nov", deposits: 9000, withdrawals: 6500 },
      { label: "Dec", deposits: 15000, withdrawals: 9800 },
      { label: "Jan", deposits: 11000, withdrawals: 7600 },
      { label: "Feb", deposits: 15000, withdrawals: 6600 },
    ];

    const status = [
      { label: "Active", value: 6, color: "#16a34a" },
      { label: "Inactive", value: 2, color: "#64748b" },
    ];

    const statusTotal = status.reduce((a, x) => a + x.value, 0) || 1;

    return {
      cash: {
        deposits,
        withdrawals,
        depositsPct: Math.round((deposits / maxCash) * 100),
        withdrawalsPct: Math.round((withdrawals / maxCash) * 100),
      },
      monthly,
      status,
      statusTotal,
    };
  }, []);

  return (
    <div className="bg-[#fbfbfc]">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-3xl border bg-white overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
          <div
            className="px-6 py-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(122,15,31,0.10) 0%, rgba(122,15,31,0.00) 55%), linear-gradient(225deg, rgba(95,12,24,0.12) 0%, rgba(255,255,255,0) 60%)",
            }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#5f0c18]">Accounting Head Dashboard</h1>
                  <p className="mt-1 text-sm text-neutral-700">Reports snapshot + daily workboard (UI-only placeholders).</p>
                </div>
                <div className="text-xs font-semibold text-neutral-700 inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {today}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl bg-white shadow-sm border p-4 lg:col-span-2" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      value={globalQuery}
                      onChange={(e) => setGlobalQuery(e.target.value)}
                      placeholder="Global search: links, tasks, notes, activity..."
                      className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-neutral-700">Filtering is UI-only. Saved data stays in your browser (localStorage).</div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-700">Today’s Completion</div>
                      <div className="mt-2 text-2xl font-extrabold text-[#5f0c18]">
                        {doneCount}/{tasks.length}
                      </div>
                      <div className="mt-1 text-xs text-neutral-700">Tasks done</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-[#7a0f1f]/10 grid place-items-center text-[#7a0f1f] flex-shrink-0">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.round(((doneCount || 0) / Math.max(tasks.length, 1)) * 100)}%`, background: "#7a0f1f" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Owners" value="2" subtitle="Active owner accounts" icon={<Users className="h-5 w-5" />} />
              <StatCard title="Bank Accounts" value="2" subtitle="Configured bank accounts" icon={<Landmark className="h-5 w-5" />} />
              <StatCard title="PMO Accounts" value="2" subtitle="Tracked PMO accounts" icon={<NotebookTabs className="h-5 w-5" />} />
              <StatCard title="SBC" value="—" subtitle="Ledger monitoring" icon={<Wallet className="h-5 w-5" />} />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-12">
              <section className="xl:col-span-8 grid gap-4">
                <Panel title="Reports Snapshot" subtitle="High level roll-up (UI-only placeholders)" icon={<FileText className="h-5 w-5" />}>
                  <div className="grid gap-3 md:grid-cols-3">
                    <MetricRow label="Total Deposits (MTD)" value={`₱${chartData.cash.deposits.toLocaleString()}`} hint="Target: ₱80,000" />
                    <MetricRow label="Total Withdrawals (MTD)" value={`₱${chartData.cash.withdrawals.toLocaleString()}`} hint="Watchlist" />
                    <MetricRow label="Net Cashflow (MTD)" value={`₱${(chartData.cash.deposits - chartData.cash.withdrawals).toLocaleString()}`} hint="Healthy" />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-extrabold text-[#5f0c18]">Cashflow Mix</div>
                          <div className="mt-1 text-xs text-neutral-700">Deposits vs Withdrawals</div>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-[#7a0f1f]/10 grid place-items-center text-[#7a0f1f] flex-shrink-0">
                          <PieChart className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                            <span>Deposits</span>
                            <span>₱{chartData.cash.deposits.toLocaleString()}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
                            <div className="h-2 rounded-full" style={{ width: `${chartData.cash.depositsPct}%`, background: "#16a34a" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                            <span>Withdrawals</span>
                            <span>₱{chartData.cash.withdrawals.toLocaleString()}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
                            <div className="h-2 rounded-full" style={{ width: `${chartData.cash.withdrawalsPct}%`, background: "#dc2626" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-extrabold text-[#5f0c18]">Monthly Trend</div>
                          <div className="mt-1 text-xs text-neutral-700">Last 5 months snapshot</div>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-[#7a0f1f]/10 grid place-items-center text-[#7a0f1f] flex-shrink-0">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {chartData.monthly.map((m) => (
                          <div key={m.label} className="flex items-center justify-between gap-4">
                            <div className="w-10 text-xs font-bold text-neutral-700">{m.label}</div>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1">
                                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{ width: `${Math.min(100, Math.round((m.deposits / 16000) * 100))}%`, background: "#16a34a" }}
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{ width: `${Math.min(100, Math.round((m.withdrawals / 16000) * 100))}%`, background: "#dc2626" }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="w-32 text-right text-[11px] font-semibold text-neutral-700">
                              ₱{m.deposits.toLocaleString()} / ₱{m.withdrawals.toLocaleString()}
                            </div>
                          </div>
                        ))}
                        <div className="text-[11px] font-semibold text-neutral-500">Green = deposits, Red = withdrawals</div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Account Status" subtitle="Active vs Inactive snapshot" icon={<Building2 className="h-5 w-5" />}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                      <div className="text-sm font-extrabold text-[#5f0c18]">Distribution</div>
                      <div className="mt-1 text-xs text-neutral-700">Counts by status</div>
                      <div className="mt-4 grid gap-3">
                        {chartData.status.map((s) => {
                          const pct = Math.round((s.value / chartData.statusTotal) * 100);
                          return (
                            <div key={s.label}>
                              <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                                <span>{s.label}</span>
                                <span>
                                  {s.value} ({pct}%)
                                </span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
                                <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-[#5f0c18]">Signals</div>
                          <div className="mt-1 text-xs text-neutral-700">UI-only indicators</div>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-[#7a0f1f]/10 grid place-items-center text-[#7a0f1f] flex-shrink-0">
                          <ScrollText className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2">
                        <div className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "rgba(0,0,0,0.12)", color: "#111" }}>
                          SBC monitoring: enabled
                        </div>
                        <div className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "rgba(0,0,0,0.12)", color: "#111" }}>
                          Pending approvals: none (placeholder)
                        </div>
                        <div className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "rgba(0,0,0,0.12)", color: "#111" }}>
                          Anomalies: 0 (placeholder)
                        </div>
                        <div className="mt-3">
                          <SparkBars values={[8, 14, 11, 18, 10, 16, 12, 15]} colors={["#7a0f1f", "#d4d4d8"]} />
                          <div className="mt-2 text-[11px] font-semibold text-neutral-500">Weekly activity (placeholder)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Recent Activity" subtitle="UI-only timeline (editable, saved locally)" icon={<ScrollText className="h-5 w-5" />}>
                  <div className="grid gap-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <input
                        value={newActivityTitle}
                        onChange={(e) => setNewActivityTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                        style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                      />
                      <input
                        value={newActivityDetails}
                        onChange={(e) => setNewActivityDetails(e.target.value)}
                        placeholder="Details (optional)"
                        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none md:col-span-2"
                        style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addActivity();
                        }}
                      />
                      <button
                        type="button"
                        onClick={addActivity}
                        className="rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95 justify-self-end md:col-start-3"
                        style={{ background: "#7a0f1f", height: 40 }}
                      >
                        Add Activity
                      </button>
                    </div>

                    <div className="grid gap-2">
                      {filteredActivity.length === 0 ? (
                        <div
                          className="rounded-2xl border px-4 py-4 text-sm font-semibold text-neutral-700"
                          style={{ borderColor: "rgba(0,0,0,0.12)" }}
                        >
                          No activity matches your search.
                        </div>
                      ) : (
                        filteredActivity.slice(0, 8).map((a) => (
                          <div key={a.id} className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <input
                                  value={a.title}
                                  onChange={(e) =>
                                    setActivity((prev) => prev.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)))
                                  }
                                  className="w-full text-sm font-extrabold text-[#5f0c18] outline-none"
                                />
                                <textarea
                                  value={a.details}
                                  onChange={(e) =>
                                    setActivity((prev) => prev.map((x) => (x.id === a.id ? { ...x, details: e.target.value } : x)))
                                  }
                                  className="mt-2 w-full text-xs text-neutral-800 outline-none"
                                  rows={2}
                                />
                                <div className="mt-2 text-[11px] font-semibold text-neutral-500">{a.createdAt}</div>
                              </div>

                              <button
                                type="button"
                                className="text-xs font-semibold text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                                onClick={() => setActivity((prev) => prev.filter((x) => x.id !== a.id))}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Panel>
              </section>

              <aside className="xl:col-span-4 grid gap-4">
                <Panel title="Tasks" subtitle={`${doneCount}/${tasks.length} completed (saved locally)`} icon={<ClipboardList className="h-5 w-5" />}>
                  <div className="flex items-center gap-2">
                    <input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Add a task..."
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask();
                      }}
                    />
                    <button
                      type="button"
                      onClick={addTask}
                      className="rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                      style={{ background: "#7a0f1f", height: 40 }}
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {filteredTasks.length === 0 ? (
                      <div
                        className="rounded-2xl border px-4 py-4 text-sm font-semibold text-neutral-700"
                        style={{ borderColor: "rgba(0,0,0,0.12)" }}
                      >
                        {q ? "No tasks match your search." : "No tasks yet."}
                      </div>
                    ) : (
                      filteredTasks.slice(0, 8).map((t) => (
                        <div
                          key={t.id}
                          className="rounded-2xl border px-3 py-2 flex items-center justify-between gap-3"
                          style={{ borderColor: "rgba(0,0,0,0.12)" }}
                        >
                          <label className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={t.done}
                              onChange={(e) =>
                                setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x)))
                              }
                            />
                            <span
                              className={
                                "text-sm font-semibold truncate " + (t.done ? "text-neutral-400 line-through" : "text-neutral-800")
                              }
                            >
                              {t.text}
                            </span>
                          </label>

                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                            onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>

                <Panel title="Notes" subtitle="Personal notes for today (saved locally)" icon={<StickyNote className="h-5 w-5" />}>
                  {!notesMatches ? (
                    <div
                      className="rounded-2xl border px-4 py-4 text-sm font-semibold text-neutral-700"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    >
                      Notes do not match your search.
                    </div>
                  ) : (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[220px] rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)", color: "#111" }}
                    />
                  )}
                </Panel>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}