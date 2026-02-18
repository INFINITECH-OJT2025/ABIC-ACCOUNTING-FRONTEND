"use client";

import React from "react";

type ProfileData = {
  fullName: string;
  email: string;
  role: string;
  department: string;
  contactNo: string;
  address: string;
};

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-semibold text-neutral-700">{label}</div>
      {children}
    </div>
  );
}

export default function Page() {
  const [profile, setProfile] = useLocalStorageState<ProfileData>("ah_profile", {
    fullName: "Accountant Head",
    email: "accountanthead@example.com",
    role: "Accounting Head",
    department: "Accounting",
    contactNo: "",
    address: "",
  });

  const [editMode, setEditMode] = React.useState(false);

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
                <h1 className="text-3xl font-extrabold text-[#5f0c18]">Profile</h1>
                <div className="mt-1 text-sm text-neutral-700">Your account details (UI-only). Changes are saved locally in your browser.</div>
              </div>

              <button
                type="button"
                className="rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                style={{ background: "#7a0f1f", height: 40 }}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? "Done" : "Edit"}
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                <div className="text-sm font-extrabold text-[#5f0c18]">Basic Information</div>
                <div className="mt-4 grid gap-4">
                  <Field label="Full Name">
                    <input
                      value={profile.fullName}
                      disabled={!editMode}
                      onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:bg-neutral-50"
                      style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      value={profile.email}
                      disabled={!editMode}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:bg-neutral-50"
                      style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                    />
                  </Field>

                  <Field label="Contact No.">
                    <input
                      value={profile.contactNo}
                      disabled={!editMode}
                      onChange={(e) => setProfile((p) => ({ ...p, contactNo: e.target.value }))}
                      placeholder="Add contact number"
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:bg-neutral-50"
                      style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                    />
                  </Field>

                  <Field label="Address">
                    <textarea
                      value={profile.address}
                      disabled={!editMode}
                      onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Add address"
                      rows={3}
                      className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none disabled:bg-neutral-50"
                      style={{ borderColor: "rgba(0,0,0,0.12)", color: "#111" }}
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                <div className="text-sm font-extrabold text-[#5f0c18]">Work Information</div>
                <div className="mt-4 grid gap-4">
                  <Field label="Role">
                    <input
                      value={profile.role}
                      disabled={!editMode}
                      onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:bg-neutral-50"
                      style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                    />
                  </Field>

                  <Field label="Department">
                    <input
                      value={profile.department}
                      disabled={!editMode}
                      onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:bg-neutral-50"
                      style={{ borderColor: "rgba(0,0,0,0.12)", height: 40, color: "#111" }}
                    />
                  </Field>

                  <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                    <div className="text-xs font-semibold text-neutral-700">Access</div>
                    <div className="mt-2 text-sm font-semibold text-neutral-900">Accounting Head</div>
                    <div className="mt-1 text-xs text-neutral-700">Full access to dashboard reports and ledgers (UI-only).</div>
                  </div>

                  <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                    <div className="text-xs font-semibold text-neutral-700">Session</div>
                    <div className="mt-2 text-sm font-semibold text-neutral-900">Local demo profile</div>
                    <div className="mt-1 text-xs text-neutral-700">No backend integration yet.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
              <div className="text-sm font-extrabold text-[#5f0c18]">Quick Actions</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  className="rounded-2xl border px-4 py-3 text-left hover:bg-neutral-50"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  onClick={() => {
                    setProfile({
                      fullName: "Accountant Head",
                      email: "accountanthead@example.com",
                      role: "Accounting Head",
                      department: "Accounting",
                      contactNo: "",
                      address: "",
                    });
                    setEditMode(false);
                  }}
                >
                  <div className="text-sm font-extrabold text-[#5f0c18]">Reset Profile</div>
                  <div className="mt-1 text-xs text-neutral-700">Restore default demo values.</div>
                </button>

                <button
                  type="button"
                  className="rounded-2xl border px-4 py-3 text-left hover:bg-neutral-50"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  onClick={() => {
                    try {
                      window.localStorage.removeItem("ah_profile");
                    } catch {}
                    window.location.reload();
                  }}
                >
                  <div className="text-sm font-extrabold text-[#5f0c18]">Clear Saved Profile</div>
                  <div className="mt-1 text-xs text-neutral-700">Removes saved local values and reloads.</div>
                </button>

                <button
                  type="button"
                  className="rounded-2xl border px-4 py-3 text-left hover:bg-neutral-50"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  onClick={() => {
                    try {
                      const raw = window.localStorage.getItem("ah_profile");
                      navigator.clipboard.writeText(raw ?? "");
                    } catch {}
                  }}
                >
                  <div className="text-sm font-extrabold text-[#5f0c18]">Copy Profile JSON</div>
                  <div className="mt-1 text-xs text-neutral-700">For debugging / future API integration.</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
