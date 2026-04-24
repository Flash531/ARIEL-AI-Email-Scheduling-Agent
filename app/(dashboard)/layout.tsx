"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

/* ── Session type ─────────────────────────────────────────── */
type Session = {
  loggedIn: boolean;
  profile?: { name?: string; email?: string; picture?: string } | null;
};

/* ── Icons ──────────────────────────────────────────────────── */
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
function IconGoogle() {
  return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
}

function ArielLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="url(#dlGrad)"/>
      <rect x="7" y="7" width="7" height="7" rx="2" fill="white"/>
      <rect x="18" y="7" width="7" height="7" rx="2" fill="white" fillOpacity="0.45"/>
      <rect x="7" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.45"/>
      <rect x="18" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.8"/>
      <defs>
        <linearGradient id="dlGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Nav items ───────────────────────────────────────────── */
const NAV_ITEMS = [
  { href: "/chat",     label: "Chat",     icon: <IconChat /> },
  { href: "/inbox",   label: "Inbox",    icon: <IconInbox /> },
  { href: "/meetings",label: "Meetings", icon: <IconMeetings /> },
  { href: "/settings",label: "Settings", icon: <IconSettings /> },
];

/* ── LeftSidebar ─────────────────────────────────────────── */
function LeftSidebar({
  session, onSignOut, profileOpen, setProfileOpen, profileRef,
}: {
  session: Session;
  onSignOut: () => void;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  profileRef: React.RefObject<HTMLDivElement | null>;
}) {
  const active = usePathname();
  return (
    <aside className="d-sidebar">
      <a href="/" className="d-sb-logo" style={{ textDecoration: "none", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <ArielLogo size={30} />
        <div>
          <div className="d-sb-brand">Ariel</div>
          <div className="d-sb-sub">AI Inbox Assistant</div>
        </div>
      </a>
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

/* ── Shared Dashboard Layout ─────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ loggedIn: false });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ loggedIn: false }));
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout");
    setSession({ loggedIn: false });
    setProfileOpen(false);
  }, []);

  return (
    <div className="d-root">
      <LeftSidebar
        session={session}
        onSignOut={handleSignOut}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        profileRef={profileRef}
      />
      {children}
    </div>
  );
}
