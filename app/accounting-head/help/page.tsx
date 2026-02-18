"use client";

import React from "react";

type HelpNote = {
  id: string;
  question: string;
  answer: string;
  open: boolean;
};

type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "draft" | "sent";
};

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(initial);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {}
    setHydrated(true);
  }, [key]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
      <div className="text-sm font-extrabold text-[#5f0c18]">{title}</div>
      <div className="mt-1 text-xs text-neutral-700">{subtitle}</div>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

export default function Page() {
  const [faq, setFaq] = useLocalStorageState<HelpNote[]>("ah_help_faq", [
    {
      id: uid(),
      question: "How do I create an SBC cheque transaction with photos?",
      answer:
        "Go to SBC > New Transaction. Choose Pay Mode = Check, then upload up to 2 photos. The file name follows the Voucher No. You can view the images in the modal and also click the Transaction Type link in the table to view again.",
      open: true,
    },
    {
      id: uid(),
      question: "Why are dashboard numbers not updating?",
      answer:
        "The dashboard is UI-only for now (placeholders). It will update once API/database integration is added.",
      open: false,
    },
    {
      id: uid(),
      question: "Where is my data saved?",
      answer:
        "Tasks, notes, activity timeline, notifications, and profile/settings are saved locally in your browser using localStorage.",
      open: false,
    },
  ]);

  const [ticket, setTicket] = useLocalStorageState<SupportTicket>("ah_help_ticket", {
    id: uid(),
    subject: "",
    message: "",
    createdAt: "",
    status: "draft",
  });

  const sendTicket = () => {
    const subject = ticket.subject.trim();
    const message = ticket.message.trim();
    if (!subject || !message) return;
    setTicket((t) => ({ ...t, subject, message, createdAt: new Date().toLocaleString(), status: "sent" }));
  };

  return (
    <div className="bg-[#fbfbfc]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border bg-white overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
          <div
            className="px-6 py-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(122,15,31,0.10) 0%, rgba(122,15,31,0.00) 55%), linear-gradient(225deg, rgba(95,12,24,0.12) 0%, rgba(255,255,255,0) 60%)",
            }}
          >
            <h1 className="text-3xl font-extrabold text-[#5f0c18]">Help</h1>
            <div className="mt-1 text-sm text-neutral-700">Quick guides and FAQ (UI-only).</div>
          </div>

          <div className="px-6 py-6 grid gap-4 xl:grid-cols-12">
            <section className="xl:col-span-7 grid gap-4">
              <Section title="Getting Started" subtitle="Common actions for Accounting Head">
                <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <div className="text-xs font-semibold text-neutral-700">Recommended flow</div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">Dashboard → SBC → Banks Accounts → Owners</div>
                  <div className="mt-1 text-xs text-neutral-700">Use Notifications for recent improvements and reminders.</div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                    <div className="text-sm font-extrabold text-[#5f0c18]">Cheque upload</div>
                    <div className="mt-1 text-xs text-neutral-700">Max 2 photos, auto name by voucher no.</div>
                    <div className="mt-3 text-[11px] font-semibold text-neutral-500">Tip: click Transaction Type in table to view proof.</div>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                    <div className="text-sm font-extrabold text-[#5f0c18]">Local saving</div>
                    <div className="mt-1 text-xs text-neutral-700">Tasks/Notes/Activity are stored locally.</div>
                    <div className="mt-3 text-[11px] font-semibold text-neutral-500">Tip: Settings lets you reset local data.</div>
                  </div>
                </div>
              </Section>

              <Section title="FAQ" subtitle="Click a question to expand">
                {faq.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="rounded-2xl border p-4 text-left hover:bg-neutral-50"
                    style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    onClick={() => setFaq((prev) => prev.map((x) => (x.id === f.id ? { ...x, open: !x.open } : x)))}
                  >
                    <div className="text-sm font-extrabold text-[#5f0c18]">{f.question}</div>
                    {f.open ? <div className="mt-2 text-xs text-neutral-800">{f.answer}</div> : null}
                  </button>
                ))}
              </Section>
            </section>

            <aside className="xl:col-span-5 grid gap-4">
              <Section title="Shortcuts" subtitle="Quick reminders (UI-only)">
                <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <div className="text-xs font-semibold text-neutral-700">SBC</div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">New transaction → Step 3</div>
                  <div className="mt-1 text-xs text-neutral-700">Fund references: attach photo + reference text.</div>
                </div>
                <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <div className="text-xs font-semibold text-neutral-700">Dashboard</div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">Global Search</div>
                  <div className="mt-1 text-xs text-neutral-700">Filters tasks/notes/activity quickly.</div>
                </div>
              </Section>

              <Section title="Support" subtitle="Send a message (UI-only draft)">
                <div className="grid gap-2">
                  <input
                    value={ticket.subject}
                    onChange={(e) => setTicket((t) => ({ ...t, subject: e.target.value, status: "draft" }))}
                    placeholder="Subject"
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                  />
                  <textarea
                    value={ticket.message}
                    onChange={(e) => setTicket((t) => ({ ...t, message: e.target.value, status: "draft" }))}
                    placeholder="Describe your issue / request..."
                    rows={5}
                    className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.12)", color: "#111" }}
                  />

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[11px] font-semibold text-neutral-500">
                      Status: {ticket.status}{ticket.createdAt ? ` • ${ticket.createdAt}` : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                        style={{ background: "#7a0f1f", height: 40 }}
                        onClick={sendTicket}
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border px-4 text-sm font-semibold hover:bg-neutral-50"
                        style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                        onClick={() => setTicket({ id: uid(), subject: "", message: "", createdAt: "", status: "draft" })}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-neutral-500">
                    Note: This does not send to a server yet. It only saves a draft locally.
                  </div>
                </div>
              </Section>

              <Section title="Maintenance" subtitle="Local demo utilities">
                <button
                  type="button"
                  className="rounded-2xl border px-4 py-3 text-left hover:bg-neutral-50"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  onClick={() => {
                    try {
                      window.localStorage.removeItem("ah_help_faq");
                      window.localStorage.removeItem("ah_help_ticket");
                    } catch {}
                    window.location.reload();
                  }}
                >
                  <div className="text-sm font-extrabold text-[#5f0c18]">Reset Help data</div>
                  <div className="mt-1 text-xs text-neutral-700">Clears saved FAQ state and support draft.</div>
                </button>
              </Section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
