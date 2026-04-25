"use client";

import { useState, useEffect, useRef } from "react";

/* ── Ariel Logo SVG ─────────────────────────────────────── */
function ArielLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="url(#logoGrad)" />
      <rect x="7" y="7" width="7" height="7" rx="2" fill="white" />
      <rect x="18" y="7" width="7" height="7" rx="2" fill="white" fillOpacity="0.45" />
      <rect x="7" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.45" />
      <rect x="18" y="18" width="7" height="7" rx="2" fill="white" fillOpacity="0.8" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Icons ─────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ── Floating orb component ─────────────────────────────── */
function FloatingOrb({ style }: { style: React.CSSProperties }) {
  return <div className="lp-orb" style={style} />;
}

/* ── Counter animation hook ─────────────────────────────── */
function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ── Intersection observer hook ─────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Stat counter ─────────────────────────────────────────  */
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, inView } = useInView();
  const count = useCountUp(value, 1400, inView);
  return (
    <div ref={ref} className="lp-stat">
      <div className="lp-stat-number">{count}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

/* ── Static badge stat (non-numeric) ────────────────────── */
function StatBadge({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div
      className="lp-stat"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          width: "8px", height: "8px",
          borderRadius: "50%",
          background: "#7c5cfc",
          display: "inline-block",
          animation: "pulse 2s infinite",
        }} />
        <span className="lp-stat-value" style={{ fontSize: "28px", fontWeight: 800 }}>{label}</span>
      </div>
      <span className="lp-stat-label" style={{ marginTop: "8px" }}>{sublabel}</span>
    </div>
  );
}

/* ── Section fade-in wrapper ─────────────────────────────── */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`lp-fade ${inView ? "lp-fade-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Testimonial card ────────────────────────────────────── */
function TestimonialCard({
  quote, name, role, initials, delay,
}: {
  quote: string; name: string; role: string; initials: string; delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div className="lp-testimonial-card">
        <div className="lp-stars">
          {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
        </div>
        <p className="lp-testimonial-quote">"{quote}"</p>
        <div className="lp-testimonial-author">
          <div className="lp-author-avatar">{initials}</div>
          <div>
            <div className="lp-author-name">{name}</div>
            <div className="lp-author-role">{role}</div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ── Email waitlist form ─────────────────────────────────── */
const LS_KEY = "ariel_waitlist_joined";

function WaitlistForm({ id = "waitlist-form" }: { id?: string }) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);

  // Sync across all form instances in real-time via window event
  useEffect(() => {
    const syncState = () => {
      try {
        if (localStorage.getItem(LS_KEY) === "true") {
          setStatus("success");
          setMessage("You're on the list! Check your inbox.");
        }
      } catch { /* localStorage unavailable */ }
    };

    syncState(); // initial mount check
    window.addEventListener(LS_KEY, syncState);
    return () => window.removeEventListener(LS_KEY, syncState);
  }, []);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading" || !isValid) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list! Check your inbox.");
        setEmail("");
        try {
          localStorage.setItem(LS_KEY, "true");
          window.dispatchEvent(new Event(LS_KEY));
        } catch { /* ignore */ }
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  // ── Success state ──────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="lp-success-pill">
        <span className="lp-success-icon"><CheckIcon /></span>
        {message}
      </div>
    );
  }

  // ── Form (idle / loading / error) ─────────────────────────
  return (
    <form id={id} className="lp-waitlist-form" onSubmit={handleSubmit}
      style={{ flexDirection: "column", alignItems: "center", gap: 8 }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <div className={`lp-input-wrap ${focused ? "lp-input-focused" : ""}`}>
          <input
            type="email"
            required
            placeholder="Enter your work email to join →"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="lp-email-input"
            aria-label="Email address"
            disabled={status === "loading"}
          />
        </div>
        <button
          type="submit"
          className="lp-btn-primary lp-btn-glow"
          disabled={status === "loading"}
          style={{ opacity: status === "loading" ? 0.7 : 1 }}
        >
          {status === "loading" ? "Joining…" : <>Join Waitlist <ArrowIcon /></>}
        </button>
      </div>

      {/* Error message */}
      {status === "error" && (
        <p style={{
          fontSize: 13,
          color: "#f87171",
          margin: "4px 0 0",
          textAlign: "center",
        }}>
          {message}
        </p>
      )}
    </form>
  );
}


/* ── How it works step ───────────────────────────────────── */
function StepCard({
  number, title, description, icon, delay,
}: {
  number: string; title: string; description: string; icon: React.ReactNode; delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div className="lp-step-card">
        <div className="lp-step-number">{number}</div>
        <div className="lp-step-icon-wrap">{icon}</div>
        <h3 className="lp-step-title">{title}</h3>
        <p className="lp-step-desc">{description}</p>
      </div>
    </FadeIn>
  );
}

/* ── Feature card ────────────────────────────────────────── */
function FeatureCard({
  title, description, icon, delay,
}: {
  title: string; description: string; icon: React.ReactNode; delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div className="lp-feature-card">
        <div className="lp-feature-icon">{icon}</div>
        <h3 className="lp-feature-title">{title}</h3>
        <p className="lp-feature-desc">{description}</p>
      </div>
    </FadeIn>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="lp-root">

      {/* ── Ambient background orbs ─────────────────────── */}
      <FloatingOrb style={{ top: "-20%", left: "-10%", width: 700, height: 700, background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
      <FloatingOrb style={{ top: "30%", right: "-15%", width: 600, height: 600, background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)" }} />
      <FloatingOrb style={{ bottom: "10%", left: "20%", width: 500, height: 500, background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)" }} />

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className={`lp-nav ${scrolled ? "lp-nav-scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-nav-brand">
            <ArielLogo size={28} />
            <span className="lp-brand-name">Ariel</span>
          </div>
          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={() => scrollTo("how-it-works")}>How it works</button>
            <button className="lp-nav-link" onClick={() => scrollTo("features")}>Features</button>
            <button className="lp-nav-link" onClick={() => scrollTo("testimonials")}>Reviews</button>
          </div>
          <div className="lp-nav-actions">
            <a href="/chat" className="lp-nav-signin">Sign in</a>
            <button className="lp-btn-primary lp-btn-sm" onClick={() => scrollTo("final-cta")}>
              Get early access
            </button>
          </div>
          <button
            className="lp-hamburger"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`lp-hamburger-bar ${mobileMenuOpen ? "lp-hb-open-1" : ""}`} />
            <span className={`lp-hamburger-bar ${mobileMenuOpen ? "lp-hb-open-2" : ""}`} />
            <span className={`lp-hamburger-bar ${mobileMenuOpen ? "lp-hb-open-3" : ""}`} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            <button className="lp-mobile-link" onClick={() => scrollTo("how-it-works")}>How it works</button>
            <button className="lp-mobile-link" onClick={() => scrollTo("features")}>Features</button>
            <button className="lp-mobile-link" onClick={() => scrollTo("testimonials")}>Reviews</button>
            <a href="/chat" className="lp-mobile-link">Sign in</a>
            <button className="lp-btn-primary lp-mt-8" onClick={() => scrollTo("final-cta")}>Get early access</button>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="lp-hero" id="hero">
        <div className="lp-container">

          {/* Badge */}
          <div className="lp-hero-badge lp-fade-hero">
            <span className="lp-badge-dot" />
            Now in private beta
          </div>

          {/* Headline */}
          <h1 className="lp-hero-headline lp-fade-hero lp-delay-1">
            Your inbox has been<br />
            <span className="lp-gradient-text">running you.</span><br />
            Not anymore.
          </h1>

          {/* Sub-headline */}
          <p className="lp-hero-sub lp-fade-hero lp-delay-2">
            Ariel reads every email, grasps the context, and executes — scheduling meetings,
            drafting replies, clearing the noise. Automatically.
          </p>

          {/* CTAs */}
          <div className="lp-hero-ctas lp-fade-hero lp-delay-3">
            <WaitlistForm id="hero-waitlist-form" />
            <button className="lp-btn-ghost" onClick={() => scrollTo("how-it-works")}>
              See how it works ↓
            </button>
          </div>

          {/* Social trust */}
          <p className="lp-hero-trust lp-fade-hero lp-delay-4">
            Joined by 100 founders, operators, and executives in our private pilot.
          </p>

         {/* Stats */}
<div className="lp-stats-row lp-fade-hero lp-delay-4">
  <StatBadge label="Early access" sublabel="82/100 slots filled" />
  {/* <StatCounter value={100} suffix=" spots" label="Early access limit" /> */}
  <div className="lp-stat-divider" />
  <StatCounter value={11} suffix="hrs" label="Saved per week" />
  <div className="lp-stat-divider" />
  <StatBadge label="Beta" sublabel="Waitlist moving weekly" />
</div>


          {/* Hero UI preview */}
          <div className="lp-hero-preview lp-fade-hero lp-delay-5">
            <div className="lp-preview-card">
              <div className="lp-preview-header">
                <div className="lp-preview-dots">
                  <span className="lp-preview-dot lp-dot-red" />
                  <span className="lp-preview-dot lp-dot-yellow" />
                  <span className="lp-preview-dot lp-dot-green" />
                </div>
                <span className="lp-preview-title">Ariel · Agent Activity</span>
              </div>
              <div className="lp-preview-body">
                <div className="lp-preview-email lp-preview-email-in">
                  <div className="lp-pe-avatar">SC</div>
                  <div className="lp-pe-content">
                    <div className="lp-pe-meta"><span className="lp-pe-sender">Sarah Chen</span><span className="lp-pe-time">9:02 AM</span></div>
                    <div className="lp-pe-subject">Re: Q2 sync — are you free Thursday?</div>
                    <div className="lp-pe-snippet">Hey, would love to connect this week. Thursday 2–3pm works for me…</div>
                  </div>
                </div>
                <div className="lp-preview-step lp-preview-step-in" style={{ animationDelay: "0.3s" }}>
                  <span className="lp-ps-icon lp-ps-done">✓</span>
                  Reading Gmail inbox
                </div>
                <div className="lp-preview-step lp-preview-step-in" style={{ animationDelay: "0.55s" }}>
                  <span className="lp-ps-icon lp-ps-done">✓</span>
                  Detected meeting request
                </div>
                <div className="lp-preview-step lp-preview-step-in" style={{ animationDelay: "0.8s" }}>
                  <span className="lp-ps-icon lp-ps-done">✓</span>
                  Checking calendar availability
                </div>
                <div className="lp-preview-step lp-preview-step-in" style={{ animationDelay: "1.05s" }}>
                  <span className="lp-ps-icon lp-ps-active">✓</span>
                  Scheduling event — Thursday, 2:00 PM
                </div>
                <div className="lp-preview-result lp-preview-step-in" style={{ animationDelay: "1.3s" }}>
                  <span className="lp-pr-icon">📅</span>
                  <div>
                    <div className="lp-pr-label">Meeting scheduled</div>
                    <div className="lp-pr-value">Q2 Sync with Sarah Chen · Thu, 2:00–3:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. PROBLEM
      ══════════════════════════════════════════════════ */}
      <section className="lp-section lp-problem-section" id="problem">
        <div className="lp-container">
          <FadeIn>
            <div className="lp-section-eyebrow">The problem</div>
            <h2 className="lp-section-headline">
              Your inbox is a<br />full-time job you never signed up for.
            </h2>
          </FadeIn>

          <div className="lp-problem-grid">
            <FadeIn delay={100}>
              <div className="lp-problem-card">
                <div className="lp-problem-icon">📬</div>
                <h3 className="lp-problem-title">It never stops growing</h3>
                <p className="lp-problem-desc">
                  You clear it. It refills. The average professional gets <strong style={{ color: '#a5b4fc', fontWeight: 700 }}>121 emails a day</strong> and spends <strong style={{ color: '#a5b4fc', fontWeight: 700 }}>28% of their workweek</strong> managing them.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={180}>
              <div className="lp-problem-card">
                <div className="lp-problem-icon">🔍</div>
                <h3 className="lp-problem-title">Critical things get buried</h3>
                <p className="lp-problem-desc">
                  The deal update. The follow-up that needed a reply yesterday. It was there — somewhere between the newsletters and the pings.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={260}>
              <div className="lp-problem-card">
                <div className="lp-problem-icon">🔄</div>
                <h3 className="lp-problem-title">Scheduling is a time tax</h3>
                <p className="lp-problem-desc">
                  <strong style={{ color: '#a5b4fc', fontWeight: 700 }}>4 emails</strong> to set up one call. Two time zones. One &ldquo;does 3pm work?&rdquo; thread that somehow takes all afternoon.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. SOLUTION
      ══════════════════════════════════════════════════ */}
      <section className="lp-section lp-solution-section" id="solution">
        <div className="lp-container">
          <div className="lp-solution-inner">
            <FadeIn className="lp-solution-text">
              <div className="lp-section-eyebrow">The solution</div>
              <h2 className="lp-section-headline lp-solution-headline">
                Ariel doesn&apos;t<br />
                <span className="lp-gradient-text">assist.</span><br />
                It acts.
              </h2>
              <p className="lp-solution-body">
                Most AI tools give you a summary and call it help. Ariel goes further. It reads every email, understands what&apos;s needed, and executes — so completed tasks land in your calendar, not your to-do list.
              </p>
              <ul className="lp-solution-list">
                {[
                  "Reads and prioritizes every incoming email",
                  "Detects meeting requests and checks your calendar",
                  "Schedules, confirms, and marks emails as handled",
                  "Gives you full visibility into everything it does",
                ].map((item) => (
                  <li key={item} className="lp-solution-item">
                    <span className="lp-check-icon"><CheckIcon /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={150} className="lp-solution-visual">
              <div className="lp-solution-card">
                <div className="lp-sc-header">
                  <ArielLogo size={22} />
                  <span>Ariel just handled this</span>
                </div>
                <div className="lp-sc-body">
                  <div className="lp-sc-row lp-sc-row-from">
                    <span className="lp-sc-label">From</span>
                    <span>marcus@acmecorp.com</span>
                  </div>
                  <div className="lp-sc-row">
                    <span className="lp-sc-label">Subject</span>
                    <span>Intro call — this week?</span>
                  </div>
                  <div className="lp-sc-divider" />
                  <div className="lp-sc-actions">
                    <div className="lp-sc-action lp-sca-done">
                      <span>✓</span> Detected scheduling intent
                    </div>
                    <div className="lp-sc-action lp-sca-done">
                      <span>✓</span> Found free slot: Wed 11 AM
                    </div>
                    <div className="lp-sc-action lp-sca-done">
                      <span>✓</span> Created calendar event
                    </div>
                    <div className="lp-sc-action lp-sca-done">
                      <span>✓</span> Sent confirmation to Marcus
                    </div>
                    <div className="lp-sc-action lp-sca-done">
                      <span>✓</span> Marked email as read
                    </div>
                  </div>
                  <div className="lp-sc-result">
                    Meeting booked. Nothing left for you to do.
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="lp-section" id="how-it-works">
        <div className="lp-container">
          <FadeIn>
            <div className="lp-section-eyebrow">How it works</div>
            <h2 className="lp-section-headline lp-center">
              Set it up once.<br />Let Ariel handle it from there.
            </h2>
          </FadeIn>

          <div className="lp-steps-grid">
            <StepCard
              number="01"
              delay={80}
              title="Connect your Gmail"
              description="One click. Ariel gets read access to your inbox and write access for calendar events. Nothing else. No shady permissions."
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              }
            />
            <StepCard
              number="02"
              delay={180}
              title="Ariel reads the room"
              description="It doesn't just skim subjects. It reads the full thread, understands tone, intent, and urgency — then decides what needs to happen."
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              }
            />
            <StepCard
              number="03"
              delay={280}
              title="Tasks get done"
              description="Meetings are scheduled, confirmations are sent, threads are closed. Ariel shows you everything it did — with full transparency."
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. FEATURES
      ══════════════════════════════════════════════════ */}
      <section className="lp-section lp-features-section" id="features">
        <div className="lp-container">
          <FadeIn>
            <div className="lp-section-eyebrow">Features</div>
            <h2 className="lp-section-headline lp-center">
              Built for people who<br />can&apos;t afford to miss a thing.
            </h2>
          </FadeIn>

          <div className="lp-features-grid">
            <FeatureCard
              delay={60}
              title="Instant clarity on any email"
              description="Get the signal, not the noise. Ariel tells you what matters, what needs action, and what you can safely ignore."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <FeatureCard
              delay={140}
              title="Meetings — fully automated"
              description="Someone asks for a call, Ariel books it. Checks your calendar, finds the best slot, creates the event, and sends the invite."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
            />
            <FeatureCard
              delay={220}
              title="Full visibility, always"
              description="Every action Ariel takes is logged and shown to you in real time. You stay in control — without staying in your inbox."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              }
            />
            <FeatureCard
              delay={300}
              title="Nothing slips through"
              description="Ariel flags follow-ups, unanswered threads, and time-sensitive requests before they become problems."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
            />
            <FeatureCard
              delay={380}
              title="Learns your style"
              description="Over time, Ariel adapts to how you communicate — your tone, your scheduling preferences, your patterns."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              }
            />
            <FeatureCard
              delay={460}
              title="Private by design"
              description="Your emails stay yours. Ariel processes data in real time — nothing is stored, trained on, or shared."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. SOCIAL PROOF
      ══════════════════════════════════════════════════ */}
      <section className="lp-section" id="testimonials">
        <div className="lp-container">
          <FadeIn>
            <div className="lp-section-eyebrow">Early adopters</div>
            <h2 className="lp-section-headline lp-center">
              People who switched.<br />
              <span className="lp-gradient-text">They didn&apos;t switch back.</span>
            </h2>
          </FadeIn>

          <div className="lp-testimonials-grid">
            <TestimonialCard
              delay={80}
              quote="I used to start every morning in my inbox. Now I start with what actually matters. Ariel handles the rest before I even open Gmail."
              name="James Okafor"
              role="Founder, Series A SaaS"
              initials="JO"
            />
            <TestimonialCard
              delay={180}
              quote="The scheduling part alone is worth it. Back-and-forth emails to book a call felt so normal — until Ariel made it disappear."
              name="Priya Mehta"
              role="VP of Sales, B2B Startup"
              initials="PM"
            />
            <TestimonialCard
              delay={280}
              quote="Every tool I've tried summarizes. Ariel actually does the work. That difference is everything when you're running on no time."
              name="David Lam"
              role="Operator & Angel Investor"
              initials="DL"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="lp-section lp-final-cta-section" id="final-cta">
        <div className="lp-container">
          <FadeIn>
            <div className="lp-final-cta-inner">
              <div className="lp-final-cta-glow" />
              <div className="lp-section-eyebrow">Early access</div>
              <h2 className="lp-final-headline">
                Be among the first to<br />
                <span className="lp-gradient-text">experience Ariel.</span>
              </h2>
              <p className="lp-final-sub">
                A small group of founders and operators are getting access first.
                Spots are limited — drop your email and we&apos;ll reach out personally.
              </p>
              <WaitlistForm id="final-waitlist-form" />
              <p className="lp-final-footnote">
                No spam. No pressure. Just early access when it&apos;s ready.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <ArielLogo size={22} />
            <span className="lp-footer-name">Ariel</span>
          </div>
          <p className="lp-footer-copy">© 2026 Ariel. All rights reserved.</p>
          <div className="lp-footer-links">
            <a href="#" className="lp-footer-link">Privacy</a>
            <a href="#" className="lp-footer-link">Terms</a>
            <a href="/chat" className="lp-footer-link">App</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
