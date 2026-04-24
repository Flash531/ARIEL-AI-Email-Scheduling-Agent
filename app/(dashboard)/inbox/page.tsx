"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";

/* ── Types ─────────────────────────────────────────────── */
type EmailItem = {
  id: number;
  sender: string;
  initials: string;
  subject: string;
  snippet: string;
  time: string;
  tag: "urgent" | "pending" | "handled";
};

type AgentStep = { id: number; label: string; status: "done" | "active" };

/* ── Icons ──────────────────────────────────────────────── */
function IconChat() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconInbox() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 10h20M7 14h.01M12 14h.01M17 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconMeetings() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconSettings() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconSignOut() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconZap() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconMail() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconCal() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconClock() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconEnvelope() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconGoogle() {
  return <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
}

function ArielLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="url(#iLogoGrad)"/>
      <rect x="7" y="7" width="7" height="7" rx="2" fill="white"/>
      <rect x="18" y="7" width="7" height="7" rx="2" fill="white" fillOpacity="0.45"/>
      <rect x="7" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.45"/>
      <rect x="18" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.8"/>
      <defs>
        <linearGradient id="iLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Nav ────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { href: "/chat",     label: "Chat",     icon: <IconChat /> },
  { href: "/inbox",   label: "Inbox",    icon: <IconInbox /> },
  { href: "/meetings",label: "Meetings", icon: <IconMeetings /> },
  { href: "/settings",label: "Settings", icon: <IconSettings /> },
];

/* ── LeftSidebar ────────────────────────────────────────── */
function LeftSidebar({
  session, onSignOut, profileOpen, setProfileOpen, profileRef,
}: {
  session: { loggedIn: boolean; profile?: { name?: string; email?: string; picture?: string } | null };
  onSignOut: () => void;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  profileRef: React.RefObject<HTMLDivElement | null>;
}) {
  const active = usePathname();
  return (
    <aside className="d-sidebar">
      <div className="d-sb-logo">
        <ArielLogo size={30} />
        <div>
          <div className="d-sb-brand">Ariel</div>
          <div className="d-sb-sub">AI Inbox Assistant</div>
        </div>
      </div>
      <nav className="d-sb-nav">
        {NAV_ITEMS.map((item, index) => (
          <a key={item.label} href={item.href}
            className={`d-nav-item d-anim-in ${active === item.href ? "d-nav-active" : ""}`}
            style={{ animationDelay: `${index * 50}ms` }}>
            <span className="d-nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <div className="d-sb-user" ref={profileRef}>
        <button className="d-user-btn" onClick={() => setProfileOpen(!profileOpen)} aria-label="Profile">
          {session.loggedIn && session.profile?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.profile.picture} alt={session.profile.name ?? "User"} width={32} height={32} style={{ borderRadius: "50%", display: "block" }} />
          ) : (
            <div className="d-user-avatar-placeholder">{session.profile?.name?.[0]?.toUpperCase() ?? "U"}</div>
          )}
          <div className="d-user-info">
            <span className="d-user-name">{session.profile?.name ?? (session.loggedIn ? "User" : "Not signed in")}</span>
            <span className="d-user-status">
              <span className={`d-status-dot ${session.loggedIn ? "d-status-green" : "d-status-offline"}`} />
              {session.loggedIn ? "Connected" : "Offline"}
            </span>
          </div>
        </button>
        {profileOpen && (
          <div className="d-profile-menu">
            {session.loggedIn ? (
              <>
                <div className="d-pm-header">
                  <div className="d-pm-name">{session.profile?.name ?? "User"}</div>
                  <div className="d-pm-email">{session.profile?.email ?? ""}</div>
                </div>
                <div className="d-pm-divider"/>
                <button className="d-pm-item" onClick={onSignOut}><IconSignOut /> Sign out</button>
              </>
            ) : (
              <>
                <div className="d-pm-header">
                  <div className="d-pm-name">Not signed in</div>
                  <div className="d-pm-email">Connect your Google account</div>
                </div>
                <div className="d-pm-divider"/>
                <a href="/api/auth/login" className="d-pm-item" style={{ textDecoration: "none" }}>
                  <IconGoogle /> Sign in with Google
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── RightPanel (reads from Zustand store) ──────────────── */
function RightPanel() {
  const activityItems          = useAppStore((s) => s.activityItems);
  const scheduledMeetingsCount = useAppStore((s) => s.scheduledMeetingsCount);
  const emailSummaryCount      = useAppStore((s) => s.emailSummaryCount);
  return (
    <aside className="d-right">
      {/* Agent Activity */}
      <div className="d-panel d-anim-in" style={{ animationDelay: "100ms" }}>
        <div className="d-panel-header">
          <span className="d-panel-title">Agent Activity</span>
          {activityItems.length > 0 && <span className="d-count-badge">{activityItems.length}</span>}
        </div>
        <div className="d-panel-body">
          {activityItems.length === 0 ? (
            <div className="d-panel-empty">
              <div className="d-panel-empty-icon"><IconZap /></div>
              <p>Ariel hasn&apos;t processed anything yet.<br/>Connect your inbox to begin.</p>
            </div>
          ) : (
            <div className="d-activity-list">
              {activityItems.map((s) => (
                <div key={s.id} className="d-activity-item">
                  <span className={`d-activity-icon ${s.status === "done" ? "d-a-done" : "d-a-active"}`}>
                    {s.status === "done" ? "✓" : "⟳"}
                  </span>
                  <span className="d-activity-label">{s.label}</span>
                  <span className="d-activity-time">just now</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Meetings */}
      <div className="d-panel d-anim-in" style={{ animationDelay: "150ms" }}>
        <div className="d-panel-header">
          <span className="d-panel-title"><IconCal /> Scheduled Meetings</span>
          <span className="d-count-badge">{scheduledMeetingsCount}</span>
        </div>
        <div className="d-panel-body">
          <div className="d-panel-empty">
            <div className="d-panel-empty-icon"><IconMeetings /></div>
            <p>{scheduledMeetingsCount === 0 ? "No meetings scheduled yet" : `${scheduledMeetingsCount} meeting${scheduledMeetingsCount > 1 ? "s" : ""} scheduled`}</p>
          </div>
        </div>
      </div>
      {/* Email Summary */}
      <div className="d-panel d-anim-in" style={{ animationDelay: "200ms" }}>
        <div className="d-panel-header">
          <span className="d-panel-title"><IconMail /> Email Summary</span>
          <span className="d-count-badge">{emailSummaryCount}</span>
        </div>
        <div className="d-panel-body">
          <div className="d-panel-empty">
            <div className="d-panel-empty-icon"><IconMail /></div>
            <p>{emailSummaryCount === 0 ? "Connect inbox to see summaries" : `${emailSummaryCount} email${emailSummaryCount > 1 ? "s" : ""} processed`}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── InboxEmailRow ──────────────────────────────────────── */
function InboxEmailRow({ email, delay }: { email: EmailItem; delay: number }) {
  const priorityClass = email.tag === "urgent" ? "d-p-red" : email.tag === "pending" ? "d-p-purple" : "d-p-gray";
  const badgeClass = email.tag === "urgent" ? "d-badge-urgent" : email.tag === "pending" ? "d-badge-pending" : "d-badge-handled";
  const badgeLabel = email.tag === "urgent" ? "Urgent" : email.tag === "pending" ? "Pending" : "Handled";
  return (
    <div className="d-inbox-row" style={{ animationDelay: `${delay}ms` }}>
      <div className={`d-ir-priority ${priorityClass}`} />
      <div className="d-ir-avatar">{email.initials}</div>
      <div className="d-ir-body">
        <div className="d-ir-top">
          <span className="d-ir-sender">{email.sender}</span>
          <span className="d-ir-time">{email.time}</span>
        </div>
        <div className="d-ir-subject">{email.subject}</div>
        <div className="d-ir-snippet">{email.snippet}</div>
        <div className="d-ir-footer">
          <span className={`d-badge ${badgeClass}`}>{badgeLabel}</span>
        </div>
      </div>
    </div>
  );
}

/* ── CTA button style helper ────────────────────────────── */
const ctaStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "#7c5cfc", color: "white",
  padding: "10px 24px", borderRadius: 8,
  fontSize: 14, fontWeight: 500,
  textDecoration: "none", border: "none", cursor: "pointer",
  fontFamily: "inherit",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  marginTop: 20,
};

/* ── InboxMain ──────────────────────────────────────────── */
function InboxMain({ emails, isSignedIn }: { emails: EmailItem[]; isSignedIn: boolean }) {
  const [filter, setFilter] = useState("all");
  const filtered = emails.filter((e) => {
    if (filter === "all") return true;
    if (filter === "unread") return e.tag === "pending" || e.tag === "urgent";
    if (filter === "priority") return e.tag === "urgent";
    if (filter === "handled") return e.tag === "handled";
    return true;
  });

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0a0d1a", minHeight: "calc(100vh - 60px)" }}>
      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 32px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>Inbox</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>Emails read and processed by Ariel</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: "#131729", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", padding: "6px 12px", borderRadius: 6,
            fontSize: 13, fontFamily: "inherit", cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="priority">Priority</option>
          <option value="handled">Handled</option>
        </select>
      </div>

      {emails.length === 0 ? (
        /* Empty state */
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", textAlign: "center",
          padding: "40px 32px",
        }}>
          <div style={{
            background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.2)",
            padding: 16, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#7c5cfc", marginBottom: 16,
          }}>
            <IconEnvelope />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            No emails processed yet
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
            Connect your Gmail and Ariel will start reading, summarizing, and prioritizing your inbox automatically.
          </p>
          {isSignedIn ? (
            <a href="/chat" style={ctaStyle}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 14px rgba(124,92,252,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              Open Chat
            </a>
          ) : (
            <a href="/api/auth/login" style={ctaStyle}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 14px rgba(124,92,252,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <IconGoogle />
              Connect Gmail
            </a>
          )}
        </div>
      ) : (
        /* Populated list */
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No emails match this filter.</p>
            </div>
          ) : (
            filtered.map((email, i) => <InboxEmailRow key={email.id} email={email} delay={i * 40} />)
          )}
        </div>
      )}
    </main>
  );
}


/* ── IconMeetingsLg ─────────────────────────────────────── */
function IconMeetingsLg() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}

/* ── PAGE ───────────────────────────────────────────────── */
export default function InboxPage() {
  const [session, setSession] = useState<{ loggedIn: boolean }>({ loggedIn: false });
  const [emails] = useState<EmailItem[]>([]);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then(setSession).catch(() => {});
  }, []);

  return (
    <>
      <InboxMain emails={emails} isSignedIn={session.loggedIn} />
      <RightPanel />
    </>
  );
}
