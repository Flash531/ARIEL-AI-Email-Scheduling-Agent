"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { AgentStep, MeetingCard, EmailCard, Message, ArielEmail, ArielMeeting } from "@/lib/store";

/* ── Local types (not in store) ───────────────────────────── */
type Role = "user" | "assistant";
type ApiMessage = { role: Role; content: string };

/* ── Tool labels ──────────────────────────────────────────── */
const TOOL_LABELS: Record<string, string> = {
  getUnreadEmails: "Reading Gmail inbox",
  getCalendarEvents: "Checking calendar availability",
  createCalendarEvent: "Scheduling event",
  sendEmail: "Sending confirmation email",
  markEmailAsRead: "Marking email as read",
};

function buildStepsFromToolCalls(toolCalls: { toolName: string }[]): AgentStep[] {
  const seen = new Set<string>();
  const steps: AgentStep[] = [];
  let id = 1;
  const usedTools = toolCalls.map((t) => t.toolName);
  const fetchedEmails = usedTools.includes("getUnreadEmails");
  const didScheduling = usedTools.some((t) =>
    ["getCalendarEvents", "createCalendarEvent"].includes(t)
  );
  for (const call of toolCalls) {
    const label = TOOL_LABELS[call.toolName];
    if (!label || seen.has(call.toolName)) continue;
    seen.add(call.toolName);
    if (call.toolName === "getCalendarEvents" && fetchedEmails && didScheduling && !seen.has("__detect__")) {
      seen.add("__detect__");
      steps.push({ id: id++, label: "Detecting meeting request", status: "done" });
    }
    steps.push({ id: id++, label, status: "done" });
  }
  return steps;
}

/* ═══════════════════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════════════════ */
function IconChat() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 10h20M7 14h.01M12 14h.01M17 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconMeetings() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconFilter() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSignOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
function ArielLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="url(#dLogoGrad)" />
      <rect x="7" y="7" width="7" height="7" rx="2" fill="white" />
      <rect x="18" y="7" width="7" height="7" rx="2" fill="white" fillOpacity="0.45" />
      <rect x="7" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.45" />
      <rect x="18" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.8" />
      <defs>
        <linearGradient id="dLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Typing dots ──────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 20 }}>
      <span className="d-dot" />
      <span className="d-dot" />
      <span className="d-dot" />
    </div>
  );
}

/* ── Message text renderer ────────────────────────────────── */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0, fontSize: 14 }}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ fontWeight: 600 }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </p>
  );
}


/* ═══════════════════════════════════════════════════════════
   PREVIEW CARD (pre-auth)
═══════════════════════════════════════════════════════════ */
function PreviewCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="d-preview-card">
      <div className="d-preview-icon">{icon}</div>
      <div className="d-preview-title">{title}</div>
      <div className="d-preview-desc">{desc}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE HERO (pre-auth)
═══════════════════════════════════════════════════════════ */
function EmptyStateHero({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) return null;
  return (
    <div className="d-empty-hero">
      <div className="d-empty-glow" />
      <div className="d-empty-logo-wrap">
        <ArielLogo size={52} />
      </div>
      <h2 className="d-empty-headline">Connect your inbox to get started</h2>
      <p className="d-empty-sub">
        Ariel will read, summarize, and act on your emails automatically.
      </p>
      <a href="/api/auth/login" className="d-google-btn">
        <IconGoogle />
        Sign in with Google
      </a>
      <div className="d-preview-cards">
        <PreviewCard
          icon={<IconMail />}
          title="Summarize emails"
          desc="Get the signal, not the noise. Ariel distills what matters."
        />
        <PreviewCard
          icon={<IconMeetings />}
          title="Schedule meetings"
          desc="Meeting requests handled end-to-end — no back-and-forth."
        />
        <PreviewCard
          icon={<IconFilter />}
          title="Prioritize what matters"
          desc="Urgent emails surface first. The rest waits its turn."
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAT AREA (main column)
═══════════════════════════════════════════════════════════ */
const CHIPS = [
  "Check my unread emails",
  "Handle meeting requests",
  "What's on my calendar today?",
  "Schedule a meeting with Farhan",
];

function ChatArea({
  messages,
  loading,
  processingText,
  prompt,
  setPrompt,
  onSend,
  onChip,
  isSignedIn,
  session,
  textareaRef,
  bottomRef,
  onClear,
}: {
  messages: Message[];
  loading: boolean;
  processingText: string;
  prompt: string;
  setPrompt: (v: string) => void;
  onSend: () => void;
  onChip: (text: string) => void;
  isSignedIn: boolean;
  session: { profile?: { name?: string } | null };
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onClear: () => void;
}) {
  const hour = new Date().getHours();
  const tod = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const greeting = isSignedIn
    ? `Good ${tod}, ${session.profile?.name?.split(" ")[0] ?? "there"}`
    : `Good ${tod}`;

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <main className="d-main">
      {/* Topbar */}
      <div className="d-topbar">
        <div className="d-topbar-title">Chat</div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 6, padding: "4px 12px",
              fontSize: 12, cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            Clear chat
          </button>
        )}
        {loading && (
          <div className="d-thinking-pill">
            <span className="d-thinking-dot" />
            {processingText || "Ariel is thinking…"}
          </div>
        )}
      </div>

      {/* Chat feed */}
      <div className="d-chat-feed">
        {isEmpty && !isSignedIn && <EmptyStateHero isSignedIn={isSignedIn} />}

        {isEmpty && isSignedIn && (
          <div className="d-signed-empty">
            <div className="d-signed-logo"><ArielLogo size={44} /></div>
            <h2 className="d-signed-title">{greeting}</h2>
            <p className="d-signed-sub">
              Ask Ariel to manage your inbox, handle meeting requests, or check your calendar.
            </p>
            <div className="d-chips-grid">
              {CHIPS.map((c) => (
                <button key={c} className="d-chip" onClick={() => onChip(c)}>{c}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`d-msg-row ${msg.role === "user" ? "d-msg-user" : "d-msg-ai"}`}
          >
            {msg.role === "assistant" && (
              <div className="d-ai-avatar"><ArielLogo size={24} /></div>
            )}
            <div className={msg.role === "user" ? "d-user-bubble" : "d-ai-bubble"}>
              <MessageText text={msg.text} />
            </div>
            {msg.role === "user" && (
              <div className="d-user-avatar-sm">
                {session.profile?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="d-msg-row d-msg-ai">
            <div className="d-ai-avatar"><ArielLogo size={24} /></div>
            <div className="d-ai-bubble"><TypingDots /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="d-input-area">
        <div className={`d-input-box ${!isSignedIn ? "d-input-disabled" : ""}`}>
          <textarea
            ref={textareaRef}
            className="d-textarea"
            placeholder={isSignedIn ? "Ask Ariel anything about your inbox…" : "Sign in to start…"}
            rows={1}
            disabled={!isSignedIn || loading}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              e.currentTarget.style.height = "22px";
              e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKey}
          />
          <button
            className="d-send-btn"
            onClick={onSend}
            disabled={!prompt.trim() || loading || !isSignedIn}
            aria-label="Send"
            style={{ opacity: (!prompt.trim() || loading || !isSignedIn) ? 0.35 : 1 }}
          >
            <IconSend />
          </button>
        </div>
        {isSignedIn && (
          <p className="d-input-hint">
            Press <kbd className="d-kbd">Enter</kbd> to send · <kbd className="d-kbd">Shift+Enter</kbd> for new line
          </p>
        )}
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITY FEED
═══════════════════════════════════════════════════════════ */
function ActivityFeed({ steps, loading }: { steps: AgentStep[]; loading: boolean }) {
  return (
    <div className="d-panel">
      <div className="d-panel-header">
        <span className="d-panel-title">Agent Activity</span>
        {loading
          ? <span className="d-live-badge"><span className="d-live-dot" />Live</span>
          : steps.length > 0 && <span className="d-count-badge">{steps.length}</span>
        }
      </div>
      <div className="d-panel-body">
        {steps.length === 0 && !loading ? (
          <div className="d-panel-empty">
            <div className="d-panel-empty-icon"><IconZap /></div>
            <p>Ariel hasn&apos;t processed anything yet.<br />Connect your inbox to begin.</p>
          </div>
        ) : (
          <div className="d-activity-list">
            {steps.map((step) => (
              <div key={step.id} className="d-activity-item">
                <span className={`d-activity-icon ${step.status === "done" ? "d-a-done" : "d-a-active"}`}>
                  {step.status === "done" ? "✓" : "⟳"}
                </span>
                <span className="d-activity-label">{step.label}</span>
                <span className="d-activity-time">just now</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MEETING CARD
═══════════════════════════════════════════════════════════ */
function MeetingCardComp({ m }: { m: MeetingCard }) {
  return (
    <div className="d-meeting-card">
      <div className="d-mc-top">
        <div className="d-mc-avatar">
          {m.attendee.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="d-mc-info">
          <div className="d-mc-title">{m.title}</div>
          <div className="d-mc-attendee">{m.attendee}</div>
        </div>
        <span className="d-mc-badge">Scheduled</span>
      </div>
      <div className="d-mc-meta">
        <span className="d-meta-chip"><IconCal />{m.date}</span>
        <span className="d-meta-chip"><IconClock />{m.time}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMAIL ROW
═══════════════════════════════════════════════════════════ */
function EmailRow({ e }: { e: EmailCard }) {
  return (
    <div className="d-email-row">
      <div className="d-email-avatar">{e.initials}</div>
      <div className="d-email-content">
        <div className="d-email-top">
          <span className="d-email-sender">{e.sender}</span>
          <span className="d-email-time">{e.time}</span>
        </div>
        <div className="d-email-subject">{e.subject}</div>
        <div className="d-email-snippet">{e.snippet}</div>
      </div>
      <div className={`d-priority-dot ${e.tag === "urgent" ? "d-p-red" : e.tag === "meeting" ? "d-p-purple" : "d-p-gray"}`} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RIGHT PANEL
═══════════════════════════════════════════════════════════ */
function RightPanel({
  steps,
  meetings,
  emails,
  loading,
}: {
  steps: AgentStep[];
  meetings: MeetingCard[];
  emails: EmailCard[];
  loading: boolean;
}) {
  return (
    <aside className="d-right">
      <ActivityFeed steps={steps} loading={loading} />

      {/* Meetings */}
      <div className="d-panel">
        <div className="d-panel-header">
          <span className="d-panel-title"><IconCal /> Scheduled Meetings</span>
          <span className="d-count-badge">{meetings.length}</span>
        </div>
        <div className="d-panel-body">
          {meetings.length === 0 ? (
            <div className="d-panel-empty">
              <div className="d-panel-empty-icon"><IconMeetings /></div>
              <p>No meetings scheduled yet</p>
            </div>
          ) : (
            <div className="d-meetings-list">
              {meetings.map((m) => <MeetingCardComp key={m.id} m={m} />)}
            </div>
          )}
        </div>
      </div>

      {/* Emails */}
      <div className="d-panel">
        <div className="d-panel-header">
          <span className="d-panel-title"><IconMail /> Email Summary</span>
          <span className="d-count-badge">{emails.length}</span>
        </div>
        <div className="d-panel-body">
          {emails.length === 0 ? (
            <div className="d-panel-empty">
              <div className="d-panel-empty-icon"><IconMail /></div>
              <p>Connect inbox to see summaries</p>
            </div>
          ) : (
            <div className="d-emails-list">
              {emails.map((e) => <EmailRow key={e.id} e={e} />)}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE (DashboardLayout)
═══════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingText, setProcessingText] = useState("");
  const [session, setSession] = useState<{
    loggedIn: boolean;
    profile?: { name?: string; email?: string; picture?: string } | null;
  }>({ loggedIn: false });

  /* Zustand store */
  const messages          = useAppStore((s) => s.messages);
  const addMessage        = useAppStore((s) => s.addMessage);
  const clearMessages     = useAppStore((s) => s.clearMessages);
  const activityItems     = useAppStore((s) => s.activityItems);
  const setActivityItems  = useAppStore((s) => s.setActivityItems);
  const meetings          = useAppStore((s) => s.meetings);
  const storeMeetings     = useAppStore((s) => s.setMeetings);
  const emails            = useAppStore((s) => s.emails);
  const storeEmails       = useAppStore((s) => s.setEmails);
  const setArielEmails    = useAppStore((s) => s.setArielEmails);
  const setArielMeetings  = useAppStore((s) => s.setArielMeetings);

  const historyRef = useRef<ApiMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Fetch session */
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setSession(d))
      .catch(() => setSession({ loggedIn: false }));
  }, []);


  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Processing text cycling */
  useEffect(() => {
    if (!loading) return;
    const msgs = [
      "Ariel is analyzing your inbox…",
      "Scanning for meeting requests…",
      "Checking calendar availability…",
      "Preparing your response…",
    ];
    let i = 0;
    setProcessingText(msgs[0]);
    const t = setInterval(() => { i++; setProcessingText(msgs[i % msgs.length]); }, 1800);
    return () => clearInterval(t);
  }, [loading]);


  const isSignedIn = session.loggedIn;

  const runAgent = async (overrideText?: string) => {
    const userText = (overrideText ?? prompt).trim();
    if (!userText || loading) return;
    if (!isSignedIn) {
      addMessage({ role: "assistant", text: "Please sign in with Google first." });
      return;
    }
    addMessage({ role: "user", text: userText });
    setPrompt("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "22px";

    const updatedHistory: ApiMessage[] = [
      ...historyRef.current,
      { role: "user", content: userText },
    ];

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistory }),
      });
      if (res.status === 401) {
        setSession({ loggedIn: false });
        addMessage({ role: "assistant", text: "Your session has expired. Please sign in again." });
        setLoading(false);
        return;
      }
      const data = await res.json();
      const assistantText = (data.text || "No response.")
        .replace(/\n\n_Tools used:[\s\S]*$/, "").trim() || "Done.";

      historyRef.current = [...updatedHistory, { role: "assistant", content: assistantText }];
      setActivityItems(buildStepsFromToolCalls(data.toolCalls ?? []));

      if (data.emails?.length > 0) {
        storeEmails(data.emails);

        // Transform to ArielEmail format for the Inbox page
        const arielEmails: ArielEmail[] = (data.emails as EmailCard[]).map((e) => ({
          id: String(e.id),
          from: e.sender,
          subject: e.subject,
          summary: e.snippet,
          priority: e.tag === "Meeting Request" ? "urgent" : "normal",
          timestamp: new Date().toISOString(),
          isRead: false,
        }));
        setArielEmails(arielEmails);

        // Derive ArielMeetings from emails with meeting-related keywords
        // (supplements any calendar events actually created by the agent)
        const MEETING_KW = /meeting|call|zoom|schedule|google meet|sync|invite|appointment/i;
        const derivedMeetings: ArielMeeting[] = arielEmails
          .filter((e) => MEETING_KW.test(e.subject + " " + e.summary))
          .map((e) => ({
            id: e.id,
            title: e.subject,
            contactName: e.from,
            dateTime: "TBD",
            duration: "30 min",
          }));
        setArielMeetings(derivedMeetings);
      }

      if (data.meetings?.length > 0) {
        const merged = [
          ...data.meetings,
          ...meetings.filter((m: MeetingCard) => !data.meetings.find((n: MeetingCard) => n.title === m.title)),
        ];
        storeMeetings(merged);

        // Also add confirmed (calendar-created) meetings to ArielMeetings
        const confirmedMeetings: ArielMeeting[] = (data.meetings as MeetingCard[]).map((m) => ({
          id: String(m.id),
          title: m.title,
          contactName: m.attendee,
          dateTime: m.date && m.time ? `${m.date} ${m.time}` : "TBD",
          duration: m.duration || "30 min",
        }));
        // Merge with derived (avoid duplicates by title)
        const existing = useAppStore.getState().arielMeetings;
        const merged2: ArielMeeting[] = [
          ...confirmedMeetings,
          ...existing.filter((e) => !confirmedMeetings.find((c) => c.title === e.title)),
        ];
        setArielMeetings(merged2);
      }
      addMessage({ role: "assistant", text: assistantText });

      try {
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          firstMessage: userText.slice(0, 120),
          messageCount: updatedHistory.length + 1,
          toolsUsed: (data.toolCalls ?? []).map((t: { toolName: string }) => t.toolName),
          meetingsScheduled: (data.meetings ?? []).length,
          emailsProcessed: (data.emails ?? []).length,
        };
        const prev = JSON.parse(localStorage.getItem("ariel_history") || "[]");
        localStorage.setItem("ariel_history", JSON.stringify([entry, ...prev].slice(0, 100)));
      } catch { /* ignore */ }
    } catch {
      addMessage({ role: "assistant", text: "Something went wrong. Please try again." });
    }
    setLoading(false);
    setProcessingText("");
  };

  return (
    <>
      <ChatArea
        messages={messages}
        loading={loading}
        processingText={processingText}
        prompt={prompt}
        setPrompt={setPrompt}
        onSend={runAgent}
        onChip={(t) => runAgent(t)}
        isSignedIn={isSignedIn}
        session={session}
        textareaRef={textareaRef}
        bottomRef={bottomRef}
        onClear={clearMessages}
      />
      <RightPanel
        steps={activityItems}
        meetings={meetings}
        emails={emails}
        loading={loading}
      />
    </>
  );
}
