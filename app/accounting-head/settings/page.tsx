"use client";

import React from "react";

type SettingsData = {
  theme: "light" | "dark";
  density: "comfortable" | "compact";
  currency: "PHP" | "USD";
  enableSounds: boolean;
  enableAnimations: boolean;
  enableStickyHeader: boolean;
  defaultLanding: "dashboard" | "sbc" | "banks";
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

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="text-xs font-semibold text-neutral-700">{label}</div>
        <div className="text-[11px] font-semibold text-neutral-500">{hint}</div>
      </div>
      {children}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
      <div className="text-sm font-extrabold text-[#5f0c18]">{title}</div>
      <div className="mt-1 text-xs text-neutral-700">{subtitle}</div>
      <div className="mt-4 grid gap-4">{children}</div>
    </div>
  );
}

export default function Page() {
  const [settings, setSettings] = useLocalStorageState<SettingsData>("ah_settings", {
    theme: "light",
    density: "comfortable",
    currency: "PHP",
    enableSounds: false,
    enableAnimations: true,
    enableStickyHeader: true,
    defaultLanding: "dashboard",
  });

  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("ah_settings");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { theme?: unknown };
      if (parsed?.theme === "system") {
        setSettings((s) => ({ ...s, theme: "light" }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    const useDark = settings.theme === "dark";
    root.classList.toggle("dark", useDark);
    root.style.colorScheme = useDark ? "dark" : "light";
  }, [settings.theme]);

  React.useEffect(() => {
    setSavedAt(new Date().toLocaleString());
  }, [settings]);

  return (
    <div className="bg-[#fbfbfc]">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl border bg-white overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
          <div
            className="px-6 py-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(122,15,31,0.10) 0%, rgba(122,15,31,0.00) 55%), linear-gradient(225deg, rgba(95,12,24,0.12) 0%, rgba(255,255,255,0) 60%)",
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-extrabold text-[#5f0c18]">Settings</h1>
                <div className="mt-1 text-sm text-neutral-700">Preferences (UI-only). Saved locally in your browser.</div>
              </div>

              <div className="text-xs font-semibold text-neutral-600">{savedAt ? `Saved: ${savedAt}` : ""}</div>
            </div>
          </div>

          <div className="px-6 py-6 grid gap-4">
            <Section title="Appearance" subtitle="Visual preferences for your dashboard experience">
              <Field label="Theme" hint="UI-only">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["light", "dark"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={
                        "rounded-xl border px-4 py-2 text-sm font-semibold text-left hover:bg-neutral-50 " +
                        (settings.theme === v ? "bg-[#7a0f1f]/5 border-[#7a0f1f]" : "")
                      }
                      style={{ borderColor: settings.theme === v ? "#7a0f1f" : "rgba(0,0,0,0.12)" }}
                      onClick={() => setSettings((s) => ({ ...s, theme: v }))}
                    >
                      <div className="text-[#5f0c18] capitalize">{v}</div>
                      <div className="mt-1 text-[11px] text-neutral-700">{`Force ${v}`}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Density" hint="Tighter spacing = compact">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["comfortable", "compact"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={
                        "rounded-xl border px-4 py-2 text-sm font-semibold text-left hover:bg-neutral-50 " +
                        (settings.density === v ? "bg-[#7a0f1f]/5 border-[#7a0f1f]" : "")
                      }
                      style={{ borderColor: settings.density === v ? "#7a0f1f" : "rgba(0,0,0,0.12)" }}
                      onClick={() => setSettings((s) => ({ ...s, density: v }))}
                    >
                      <div className="text-[#5f0c18] capitalize">{v}</div>
                      <div className="mt-1 text-[11px] text-neutral-700">{v === "compact" ? "More rows visible" : "Best readability"}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Animations" hint="Disable if you prefer static UI">
                <label className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <input
                    type="checkbox"
                    checked={settings.enableAnimations}
                    onChange={(e) => setSettings((s) => ({ ...s, enableAnimations: e.target.checked }))}
                  />
                  <div className="text-sm font-semibold text-neutral-800">Enable animations</div>
                </label>
              </Field>
            </Section>

            <Section title="Behavior" subtitle="Controls for navigation and interaction">
              <Field label="Default landing page" hint="UI-only">
                <select
                  value={settings.defaultLanding}
                  onChange={(e) => setSettings((s) => ({ ...s, defaultLanding: e.target.value as SettingsData["defaultLanding"] }))}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="sbc">SBC</option>
                  <option value="banks">Banks Accounts</option>
                </select>
              </Field>

              <Field label="Sticky header" hint="Keep header pinned while scrolling">
                <label className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <input
                    type="checkbox"
                    checked={settings.enableStickyHeader}
                    onChange={(e) => setSettings((s) => ({ ...s, enableStickyHeader: e.target.checked }))}
                  />
                  <div className="text-sm font-semibold text-neutral-800">Enable sticky header</div>
                </label>
              </Field>

              <Field label="Sounds" hint="Optional">
                <label className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                  <input
                    type="checkbox"
                    checked={settings.enableSounds}
                    onChange={(e) => setSettings((s) => ({ ...s, enableSounds: e.target.checked }))}
                  />
                  <div className="text-sm font-semibold text-neutral-800">Enable subtle sounds</div>
                </label>
              </Field>
            </Section>

            <Section title="Format" subtitle="Currency and number preferences">
              <Field label="Currency" hint="Used in UI placeholders">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["PHP", "USD"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={
                        "rounded-xl border px-4 py-2 text-sm font-semibold text-left hover:bg-neutral-50 " +
                        (settings.currency === v ? "bg-[#7a0f1f]/5 border-[#7a0f1f]" : "")
                      }
                      style={{ borderColor: settings.currency === v ? "#7a0f1f" : "rgba(0,0,0,0.12)" }}
                      onClick={() => setSettings((s) => ({ ...s, currency: v }))}
                    >
                      <div className="text-[#5f0c18]">{v}</div>
                      <div className="mt-1 text-[11px] text-neutral-700">{v === "PHP" ? "₱ Philippine Peso" : "$ US Dollar"}</div>
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="Maintenance" subtitle="Local demo utilities">
              <button
                type="button"
                className="rounded-2xl border px-4 py-3 text-left hover:bg-neutral-50"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                onClick={() => {
                  try {
                    window.localStorage.removeItem("ah_settings");
                  } catch {}
                  window.location.reload();
                }}
              >
                <div className="text-sm font-extrabold text-[#5f0c18]">Reset settings</div>
                <div className="mt-1 text-xs text-neutral-700">Clears local settings then reloads.</div>
              </button>

              <button
                type="button"
                className="rounded-2xl border px-4 py-3 text-left hover:bg-neutral-50"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
                onClick={() => {
                  try {
                    const raw = window.localStorage.getItem("ah_settings");
                    navigator.clipboard.writeText(raw ?? "");
                  } catch {}
                }}
              >
                <div className="text-sm font-extrabold text-[#5f0c18]">Copy settings JSON</div>
                <div className="mt-1 text-xs text-neutral-700">For debugging / future API integration.</div>
              </button>

              <div className="text-[11px] font-semibold text-neutral-500">Ref: {uid().slice(0, 8)}</div>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}
