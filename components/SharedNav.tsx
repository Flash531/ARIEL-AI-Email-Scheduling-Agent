"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Session = {
  loggedIn: boolean;
  profile?: { name?: string; email?: string; picture?: string } | null;
};

function ArielLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect width="26" height="26" rx="7" fill="#6366f1" />
      <rect x="6" y="6" width="6" height="6" rx="1.5" fill="white" />
      <rect x="14" y="6" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.45" />
      <rect x="6" y="14" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.45" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.75" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/", label: "Chat" },
  { href: "/settings", label: "Settings" },
];

export default function SharedNav() {
  const pathname = usePathname();
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
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout");
    setSession({ loggedIn: false });
    setProfileOpen(false);
  }, []);

  const dropdownItemStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 9, width: "100%",
    padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)",
    background: "transparent", border: "none", cursor: "pointer",
    fontFamily: "inherit", letterSpacing: "-0.01em", transition: "background 0.12s",
    textDecoration: "none",
  };

  return (
    <nav style={{
      height: 56, flexShrink: 0, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 24px",
      borderBottom: "1px solid var(--border)", background: "var(--surface-2)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", gap: 16, zIndex: 10,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <ArielLogo />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Ariel</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.2 }}>AI Inbox Assistant</div>
          </div>
        </Link>
      </div>

      {/* Center: nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} style={{
              padding: "5px 13px", borderRadius: 20, fontSize: 12.5,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--accent)" : "var(--text-secondary)",
              background: active ? "var(--accent-dim)" : "transparent",
              border: active ? "1px solid var(--accent-glow)" : "1px solid transparent",
              cursor: "pointer", textDecoration: "none", transition: "all 0.15s",
              letterSpacing: "-0.01em",
            }}>{link.label}</Link>
          );
        })}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7, fontSize: 11.5,
          color: session.loggedIn ? "var(--text-secondary)" : "#ef4444",
          background: "var(--surface)",
          border: `1px solid ${session.loggedIn ? "var(--border-mid)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: 20, padding: "5px 12px", letterSpacing: "-0.01em",
        }}>
          <div style={{ position: "relative", width: 8, height: 8 }}>
            <span className={session.loggedIn ? "ping" : ""} style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: session.loggedIn ? "var(--green)" : "#ef4444", opacity: 0.7,
            }} />
            <span style={{
              position: "absolute", inset: "1.5px", borderRadius: "50%",
              background: session.loggedIn ? "var(--green)" : "#ef4444",
            }} />
          </div>
          <span className="ariel-badge-full">{session.loggedIn ? "Connected" : "Not connected"}</span>
        </div>

        <div ref={profileRef} style={{ position: "relative" }}>
          <button aria-label="Profile" onClick={() => setProfileOpen((o) => !o)} style={{
            width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border-mid)",
            background: session.loggedIn && session.profile?.picture ? "transparent" : "var(--surface-2)",
            color: "var(--text-secondary)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", overflow: "hidden", padding: 0,
          }}>
            {session.loggedIn && session.profile?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.profile.picture} alt={session.profile.name ?? "Profile"} width={32} height={32} style={{ borderRadius: "50%", display: "block" }} />
            ) : session.loggedIn ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{session.profile?.name?.[0] ?? "U"}</span>
            ) : <UserIcon />}
          </button>

          {profileOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220,
              background: "var(--surface)", border: "1px solid var(--border-mid)",
              borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden",
            }}>
              {session.loggedIn ? (<>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{session.profile?.name ?? "Signed in"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.profile?.email}</div>
                </div>
                <div style={{ height: 1, background: "var(--border)" }} />
                <button onClick={handleSignOut} style={dropdownItemStyle as React.CSSProperties}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <SignOutIcon /> Sign out
                </button>
              </>) : (<>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Not signed in</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Connect your Google account</div>
                </div>
                <div style={{ height: 1, background: "var(--border)" }} />
                <a href="/api/auth/login" style={dropdownItemStyle as React.CSSProperties}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <GoogleIcon /> Sign in with Google
                </a>
              </>)}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
