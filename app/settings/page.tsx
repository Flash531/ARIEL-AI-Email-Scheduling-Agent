"use client";

import { useState, useEffect } from "react";
import SharedNav from "@/components/SharedNav";

type Settings = {
  userName: string;
  timezone: string;
  model: string;
  emailSignature: string;
  autoSchedule: boolean;
  autoMarkRead: boolean;
};

type Session = {
  loggedIn: boolean;
  profile?: { name?: string; email?: string; picture?: string } | null;
};

const TIMEZONES = [
  "Asia/Kolkata", "America/New_York", "America/Chicago",
  "America/Los_Angeles", "Europe/London", "Europe/Paris",
  "Asia/Dubai", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney",
];

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini  —  Fast & affordable" },
  { value: "gpt-4o",      label: "GPT-4o  —  Most capable" },
];

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface-2)", border: "1px solid var(--border-mid)",
      borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18,
      boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
      background: checked ? "var(--accent)" : "var(--surface-3)",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3, width: 16, height: 16,
        borderRadius: "50%", background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    userName: "Muhammad",
    timezone: "Asia/Kolkata",
    model: "gpt-4o-mini",
    emailSignature: "Ariel (Muhammad's AI assistant)",
    autoSchedule: true,
    autoMarkRead: true,
  });
  const [session, setSession] = useState<Session>({ loggedIn: false });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()),
    ]).then(([s, sess]) => {
      setSettings(s);
      setSession(sess);
    }).finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-mid)",
    background: "var(--surface)", color: "var(--text-primary)", fontSize: 13,
    fontFamily: "inherit", outline: "none", width: 220, letterSpacing: "-0.01em",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "var(--font-inter)" }}>
        <SharedNav />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading settings…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "var(--font-inter)", overflow: "hidden" }}>
      <SharedNav />

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Page title */}
          <div style={{ marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>Settings</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Manage your Ariel preferences and connected accounts.</p>
          </div>

          {/* Connected Account */}
          <SectionCard title="Connected Account" subtitle="Your Google account linked to Ariel.">
            {session.loggedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {session.profile?.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.profile.picture} alt={session.profile.name ?? "Avatar"} width={44} height={44} style={{ borderRadius: "50%" }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>
                    {session.profile?.name?.[0] ?? "U"}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{session.profile?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{session.profile?.email}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--green)", background: "var(--green-dim)", borderRadius: 20, padding: "2px 8px" }}>Gmail ✓</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--green)", background: "var(--green-dim)", borderRadius: 20, padding: "2px 8px" }}>Calendar ✓</span>
                  </div>
                </div>
                <a href="/api/auth/logout" style={{
                  marginLeft: "auto", padding: "6px 14px", borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
                  color: "#ef4444", fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                  letterSpacing: "-0.01em",
                }}>Disconnect</a>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", flex: 1 }}>No Google account connected.</p>
                <a href="/api/auth/login" style={{
                  padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border-mid)",
                  background: "var(--surface-3)", color: "var(--text-primary)", fontSize: 13,
                  fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em",
                }}>Connect Google →</a>
              </div>
            )}
          </SectionCard>

          {/* AI Preferences */}
          <SectionCard title="AI Preferences" subtitle="Customize how Ariel identifies and represents you.">
            <FieldRow label="Your name" hint="Ariel will address you and sign emails with this name.">
              <input
                style={inputStyle}
                value={settings.userName}
                onChange={(e) => set("userName", e.target.value)}
                placeholder="Your name"
              />
            </FieldRow>
            <FieldRow label="Email signature" hint="Appended to every email Ariel sends on your behalf.">
              <input
                style={inputStyle}
                value={settings.emailSignature}
                onChange={(e) => set("emailSignature", e.target.value)}
                placeholder="e.g. Ariel (John's AI assistant)"
              />
            </FieldRow>
            <FieldRow label="AI model" hint="More capable models are slower and cost more.">
              <select style={{ ...inputStyle, cursor: "pointer" }} value={settings.model} onChange={(e) => set("model", e.target.value)}>
                {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Timezone" hint="Used when scheduling events and parsing meeting times.">
              <select style={{ ...inputStyle, cursor: "pointer" }} value={settings.timezone} onChange={(e) => set("timezone", e.target.value)}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </FieldRow>
          </SectionCard>

          {/* Agent Behaviour */}
          <SectionCard title="Agent Behaviour" subtitle="Control what Ariel does automatically.">
            <FieldRow label="Auto-schedule meetings" hint="When a meeting request is detected and the slot is free, book it immediately.">
              <Toggle checked={settings.autoSchedule} onChange={(v) => set("autoSchedule", v)} />
            </FieldRow>
            <FieldRow label="Auto-mark as read" hint="Mark processed emails as read after Ariel handles them.">
              <Toggle checked={settings.autoMarkRead} onChange={(v) => set("autoMarkRead", v)} />
            </FieldRow>
          </SectionCard>

          {/* Save bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, paddingTop: 4, paddingBottom: 24 }}>
            {saved && (
              <span style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 500 }}>✓ Settings saved</span>
            )}
            <button onClick={handleSave} disabled={saving} style={{
              padding: "9px 22px", borderRadius: 10, border: "none", background: "var(--accent)",
              color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "default" : "pointer",
              letterSpacing: "-0.01em", opacity: saving ? 0.7 : 1, transition: "opacity 0.15s",
              fontFamily: "inherit",
            }}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
