"use client";

import { useState, useRef, useEffect } from "react";

type Role = "user" | "assistant";
type Message = { role: Role; text: string };
type ApiMessage = { role: Role; content: string };

/* ── Tiny icon components ─────────────────────────────────── */
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 8L2.5 2.5L5.5 8L2.5 13.5L13.5 8Z"
        fill="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="2" fill="var(--text-primary)" />
      <rect x="11" y="2" width="7" height="7" rx="2" fill="var(--text-primary)" opacity="0.3" />
      <rect x="2" y="11" width="7" height="7" rx="2" fill="var(--text-primary)" opacity="0.3" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill="var(--text-primary)" opacity="0.6" />
    </svg>
  );
}

/* ── Typing indicator ─────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={styles.dotWrap}>
      <span className="dot" style={styles.dot} />
      <span className="dot" style={styles.dot} />
      <span className="dot" style={styles.dot} />
    </div>
  );
}

/* ── Empty state prompt chips ─────────────────────────────── */
const CHIPS = [
  "Check my unread emails",
  "Handle any meeting requests",
  "What's on my calendar today?",
];

/* ── Markdown-lite: bold and newlines ─────────────────────── */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} style={{ fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const historyRef = useRef<ApiMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const runAgent = async (overrideText?: string) => {
    const userText = (overrideText ?? prompt).trim();
    if (!userText || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setPrompt("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }

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

      const data = await res.json();
      const assistantText = data.text || "No response.";

      historyRef.current = [
        ...updatedHistory,
        { role: "assistant", content: assistantText },
      ];

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: assistantText },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runAgent();
    }
  };

  const clearChat = () => {
    setMessages([]);
    historyRef.current = [];
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div style={styles.root}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoRow}>
            <LogoMark />
            <span style={styles.logoText}>Aria</span>
          </div>

          <button
            onClick={clearChat}
            style={styles.newChatBtn}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1V13M1 7H13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            New chat
          </button>
        </div>

        <div style={styles.sidebarMeta}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Connected
          </div>
          <p style={styles.sidebarFooter}>Google Calendar &amp; Gmail</p>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────── */}
      <main style={styles.main}>

        {/* Header bar */}
        <header style={styles.header}>
          <div>
            <p style={styles.headerTitle}>AI Meeting Assistant</p>
            <p style={styles.headerSub}>
              Reads your inbox · Schedules meetings · Replies automatically
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={styles.clearBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-tertiary)")
              }
            >
              Clear
            </button>
          )}
        </header>

        {/* Messages */}
        <div style={styles.feed}>

          {/* Empty state */}
          {isEmpty && (
            <div style={styles.emptyWrap}>
              <div style={styles.emptyIcon}>
                <LogoMark />
              </div>
              <h2 style={styles.emptyTitle}>Good evening, Muhammad</h2>
              <p style={styles.emptySub}>
                Ask me to handle your inbox or schedule a meeting.
              </p>
              <div style={styles.chipsRow}>
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    style={styles.chip}
                    onClick={() => runAgent(c)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--text-tertiary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className="msg-animate"
              style={{
                ...styles.msgRow,
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div style={styles.avatar}>
                  <LogoMark />
                </div>
              )}
              <div
                style={
                  msg.role === "user" ? styles.userBubble : styles.assistantBubble
                }
              >
                <MessageText text={msg.text} />
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="msg-animate" style={styles.msgRow}>
              <div style={styles.avatar}>
                <LogoMark />
              </div>
              <div style={styles.assistantBubble}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={styles.inputBar}>
          <div style={styles.inputWrap}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              placeholder="Ask Aria something…"
              rows={1}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = "24px";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={() => runAgent()}
              disabled={!prompt.trim() || loading}
              style={{
                ...styles.sendBtn,
                opacity: !prompt.trim() || loading ? 0.3 : 1,
                cursor: !prompt.trim() || loading ? "not-allowed" : "pointer",
              }}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
          <p style={styles.inputFooter}>
            Press <kbd style={styles.kbd}>Enter</kbd> to send ·{" "}
            <kbd style={styles.kbd}>Shift + Enter</kbd> for new line
          </p>
        </div>

      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Styles (CSS-in-JS object, avoids Tailwind class clutter)  */
/* ─────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  /* Layout */
  root: {
    display: "flex",
    height: "100dvh",
    background: "var(--bg)",
    fontFamily: "var(--font-inter)",
  },

  /* ── Sidebar ── */
  sidebar: {
    width: 220,
    flexShrink: 0,
    borderRight: "1px solid var(--border)",
    background: "var(--surface)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 16px",
  },
  sidebarTop: { display: "flex", flexDirection: "column", gap: 20 },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 4px",
  },
  logoText: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--text-primary)",
  },
  newChatBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "inherit",
    width: "100%",
  },
  sidebarMeta: { display: "flex", flexDirection: "column", gap: 6 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 500,
    color: "#3e9e69",
    background: "#f0faf5",
    border: "1px solid #d0edde",
    borderRadius: 20,
    padding: "3px 9px",
    width: "fit-content",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3e9e69",
  },
  sidebarFooter: {
    fontSize: 11,
    color: "var(--text-tertiary)",
    paddingLeft: 2,
  },

  /* ── Main ── */
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  /* Header */
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid var(--border-soft)",
    background: "var(--surface)",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-0.01em",
  },
  headerSub: {
    fontSize: 12,
    color: "var(--text-tertiary)",
    marginTop: 1,
  },
  clearBtn: {
    background: "none",
    border: "none",
    fontSize: 12,
    color: "var(--text-tertiary)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "color 0.15s",
    padding: "4px 8px",
  },

  /* Feed */
  feed: {
    flex: 1,
    overflowY: "auto",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  /* Empty state */
  emptyWrap: {
    margin: "auto",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    maxWidth: 480,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    color: "var(--text-primary)",
  },
  emptySub: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  chip: {
    padding: "8px 14px",
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontSize: 12,
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  },

  /* Messages */
  msgRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  userBubble: {
    maxWidth: "62%",
    padding: "11px 15px",
    borderRadius: "14px 14px 4px 14px",
    background: "var(--text-primary)",
    color: "#FFFFFF",
    fontSize: 13.5,
    lineHeight: 1.65,
    letterSpacing: "-0.005em",
  },
  assistantBubble: {
    maxWidth: "72%",
    padding: "11px 15px",
    borderRadius: "4px 14px 14px 14px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    fontSize: 13.5,
    lineHeight: 1.65,
    letterSpacing: "-0.005em",
  },

  /* Typing dots */
  dotWrap: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    height: 18,
  },
  dot: {
    display: "inline-block",
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--text-tertiary)",
  },

  /* Input bar */
  inputBar: {
    padding: "16px 32px 20px",
    borderTop: "1px solid var(--border-soft)",
    background: "var(--surface)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  inputWrap: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    background: "var(--bg)",
    borderRadius: 12,
    border: "1px solid var(--border)",
    padding: "10px 12px 10px 16px",
    transition: "border-color 0.15s",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: 13.5,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    lineHeight: 1.6,
    minHeight: 24,
    maxHeight: 140,
  },
  sendBtn: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background: "var(--text-primary)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s",
    fontFamily: "inherit",
  },
  inputFooter: {
    fontSize: 11,
    color: "var(--text-tertiary)",
    textAlign: "center" as const,
  },
  kbd: {
    fontFamily: "inherit",
    fontSize: 10,
    fontWeight: 500,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "1px 5px",
    color: "var(--text-secondary)",
  },
};
