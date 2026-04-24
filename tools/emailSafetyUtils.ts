/**
 * emailSafetyUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised safety checks for all outgoing email actions.
 *
 * Rules enforced here:
 *  1. Block sending to known automated / noreply addresses.
 *  2. Detect job-alert / newsletter senders so the agent ignores them.
 *  3. Provide a strict triple-gate check (recipient ✓, not job alert ✓,
 *     user confirmed ✓) that every send path must pass.
 */

// ── 1. Automated-address block list ──────────────────────────────────────────

const BLOCKED_ADDRESS_WORDS = [
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "notifications",
  "automated",
  "mailer",
  "postmaster",
  "bounce",
  "support",
  "newsletter",
  "jobalert",
  "job-alert",
  "alerts",
  "info",
  "jobs",
  "unsubscribe",
  "marketing",
  "update",
  "updates",
] as const;

/**
 * Returns `true` only when the address looks like a real human recipient.
 * Any match against the block list → `false`.
 */
export function isValidRecipient(email: string): boolean {
  const e = email.toLowerCase();
  return !BLOCKED_ADDRESS_WORDS.some((word) => e.includes(word));
}

// ── 2. Job-alert / newsletter sender domains ──────────────────────────────────

const JOB_ALERT_DOMAINS = [
  "glassdoor.com",
  "linkedin.com",
  "indeed.com",
  "naukri.com",
  "monster.com",
  "ziprecruiter.com",
  "simplyhired.com",
  "dice.com",
  "careerbuilder.com",
  "wellfound.com",
  "angel.co",
  "workday.com",
  "greenhouse.io",
  "lever.co",
  "jobvite.com",
] as const;

export interface EmailLike {
  from: string;
  subject?: string;
}

/**
 * Returns `true` when the email appears to be a job alert or newsletter
 * from a known recruitment platform.
 */
export function isJobAlert(email: EmailLike): boolean {
  const from = email.from.toLowerCase();
  const subject = (email.subject ?? "").toLowerCase();

  // Domain match
  if (JOB_ALERT_DOMAINS.some((domain) => from.includes(domain))) return true;

  // Keyword heuristics in the subject
  const jobKeywords = [
    "job alert",
    "new job",
    "jobs for you",
    "job recommendation",
    "career opportunity",
    "hiring now",
    "newsletter",
    "unsubscribe",
  ];
  if (jobKeywords.some((kw) => subject.includes(kw))) return true;

  return false;
}

// ── 3. Triple-gate fail-safe ──────────────────────────────────────────────────

export interface SendGateOptions {
  recipient: string;
  sourceEmail?: EmailLike | null;
  userConfirmed: boolean;
}

export interface SendGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * All three gates must pass before an email may be sent.
 *
 * Gate 1 – recipient must not be an automated address.
 * Gate 2 – source email must not be a job alert / newsletter.
 * Gate 3 – the user must have explicitly confirmed the send.
 */
export function checkSendGate(opts: SendGateOptions): SendGateResult {
  const { recipient, sourceEmail, userConfirmed } = opts;

  if (!isValidRecipient(recipient)) {
    return {
      allowed: false,
      reason:
        "I couldn't send that email — the recipient appears to be an automated address. " +
        "Please specify a real person's email address.",
    };
  }

  if (sourceEmail && isJobAlert(sourceEmail)) {
    return {
      allowed: false,
      reason:
        "I won't act on this email — it appears to be a job alert or newsletter. " +
        "I'll never reply to automated senders.",
    };
  }

  if (!userConfirmed) {
    return {
      allowed: false,
      reason: "Email send requires explicit user confirmation.",
    };
  }

  return { allowed: true };
}
