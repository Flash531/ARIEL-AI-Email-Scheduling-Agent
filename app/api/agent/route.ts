import { generateText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { cookies } from "next/headers";

import { requireAuth } from "@/lib/googleAuth";
import { getUnreadEmails } from "@/tools/emailTool";
import { getCalendarEvents } from "@/tools/calendarTool";
import { createCalendarEvent } from "@/tools/createCalendarEvent";
import { sendEmail } from "@/tools/sendEmail";
import { markEmailAsRead } from "@/tools/markEmailAsRead";
import { isValidRecipient, isJobAlert } from "@/tools/emailSafetyUtils";

const SETTING_DEFAULTS = {
    userName: "Muhammad",
    timezone: "Asia/Kolkata",
    model: "gpt-4o-mini",
    emailSignature: "Ariel (Muhammad's AI assistant)",
};

export async function POST(req: Request) {
    // ── Auth gate ─────────────────────────────────────────────────────────
    const isAuthenticated = await requireAuth();
    if (!isAuthenticated) {
        return Response.json(
            { error: "unauthenticated", message: "Please sign in with Google to use Ariel." },
            { status: 401 }
        );
    }

    // ── Load user settings from cookie ────────────────────────────────────
    const cookieStore = await cookies();
    const settingsRaw = cookieStore.get("ariel_settings")?.value;
    const userSettings = settingsRaw ? { ...SETTING_DEFAULTS, ...JSON.parse(settingsRaw) } : SETTING_DEFAULTS;
    const { userName, timezone, model, emailSignature } = userSettings;

    const body = await req.json();

    const messages: { role: "user" | "assistant"; content: string }[] =
        body.messages || [];

    // ── Confirmation token check ──────────────────────────────────────────
    // The frontend sends `confirmedEmailPayload` when the user explicitly
    // approves a pending email preview.
    const confirmedEmailPayload: {
        to: string;
        subject: string;
        message: string;
        inReplyTo?: string;
    } | null = body.confirmedEmailPayload ?? null;

    const now = new Date();
    const localTime = now.toLocaleString("en-US", {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    // ── If user confirmed an email preview, send it directly ──────────────
    if (confirmedEmailPayload) {
        const { to, subject, message, inReplyTo } = confirmedEmailPayload;

        if (!isValidRecipient(to)) {
            return Response.json({
                text: "⛔ I couldn't send that email — the recipient appears to be an automated address. Please specify a real person's email address.",
                toolCalls: [],
                emails: [],
                meetings: [],
            });
        }

        try {
            const result = await sendEmail(to, subject, message, inReplyTo);
            if (result.status === "blocked") {
                return Response.json({
                    text: `⛔ Email blocked: ${result.reason}`,
                    toolCalls: [],
                    emails: [],
                    meetings: [],
                });
            }
            return Response.json({
                text: `✅ Email sent to **${to}**.\n\nSubject: *${subject}*`,
                toolCalls: [{ toolName: "sendEmail" }],
                emails: [],
                meetings: [],
            });
        } catch (err) {
            return Response.json({
                text: "❌ Failed to send the email. Please try again.",
                toolCalls: [],
                emails: [],
                meetings: [],
            });
        }
    }

    // Capture buckets — populated by tool execute wrappers inside generateText
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailCapture: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meetingCapture: any[] = [];

    // Track any pending email preview the agent wants to send
    // (to be confirmed by the user on the frontend)
    const pendingEmailPreview: {
        to: string;
        subject: string;
        message: string;
        inReplyTo?: string;
    } | null = null;

    const agentResult = await generateText({
        model: openai.chat(model as "gpt-4o-mini" | "gpt-4o"),

        system: `
You are Ariel, an autonomous AI scheduling assistant for ${userName}.
You manage their Gmail inbox and Google Calendar, taking real actions via tools.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Current date/time : ${localTime} (${timezone})
• User name         : ${userName}
• User timezone     : ${timezone}
• Email signature   : ${emailSignature}
• All calendar times must be ISO 8601 with the correct UTC offset for ${timezone}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL SAFETY RULES  ⚠️  (NEVER VIOLATE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NEVER send emails to automated or noreply addresses (e.g. noreply@*, no-reply@*, notifications@*, alerts@*, jobalert@*, newsletter@*, support@*, bounce@*, mailer@*, postmaster@*).
2. NEVER derive recipients from the inbox sender's address. The sender of an email is NOT the correct reply target for meeting modifications/cancellations.
3. For ANY meeting modification or cancellation, ONLY use Google Calendar event attendees as recipients — never the email that triggered the action.
4. ALWAYS generate an email preview and request user confirmation before calling sendEmail. The preview must include To, Subject, and the body. Ask: "Do you want me to send this?"
5. NEVER act on job alerts, newsletters, or automated emails (from glassdoor.com, linkedin.com, indeed.com, naukri.com, monster.com, ziprecruiter.com, etc.). Tag them as "Job Alert" and skip.
6. When in doubt, ask ${userName} instead of acting autonomously.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOOLS AND WHEN TO USE THEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
getUnreadEmails       → Always call this first before any email-related action.
                        Returns: id, messageId, fromName, fromEmail, subject, date, body.
                        IMPORTANT: fromEmail is only valid for human senders — always validate before using.
                        Use "messageId" in sendEmail's inReplyTo field to thread replies.

getCalendarEvents     → Call this to check for scheduling conflicts.
                        Returns events with title, start, end, and attendees (array of { email, displayName, self }).
                        For meeting actions (modify/cancel/notify), ONLY use attendees (excluding self) as recipients.

createCalendarEvent   → Call this when a time slot is confirmed free.
                        Pass times with "+05:30" offset (IST). Defaults to 1-hour meetings.
                        Pass attendeeEmail to send an automatic Google Calendar invite.

sendEmail             → NEVER call this without prior user confirmation.
                        Show a preview first (To / Subject / body). Only call after the user says "yes" or "send it".
                        Do NOT call this for job alerts, noreply addresses, or automated senders.

markEmailAsRead       → Call this after processing any email (meeting or not).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When asked to check emails:
  1. getUnreadEmails
  2. For each email, first check: is it a JOB ALERT or NEWSLETTER?
     (from glassdoor, linkedin, indeed, naukri, monster, ziprecruiter, etc.,
      or subject contains "job alert", "new jobs", "newsletter", "unsubscribe")
     → If YES: tag as "Job Alert", DO NOT extract meetings, DO NOT reply, skip it.
  3. For remaining emails, decide: is it a MEETING REQUEST?
     (Look for dates, times, "meet", "call", "schedule", "zoom", "google meet",
      "available", "slot", "appointment", "book", "invite".)
  4. If YES → meeting request:
       a. getCalendarEvents
       b. Compare requested time to existing events.
       c. FREE  → createCalendarEvent (with attendeeEmail) → PREVIEW email to user → wait for confirmation → markEmailAsRead
       d. BUSY  → PREVIEW polite decline email with 2 alternative slots → wait for confirmation → markEmailAsRead
  5. If NO → briefly summarise the email, markEmailAsRead only if the user asked to clear it.

When modifying or cancelling meetings:
  1. getCalendarEvents to find the event and its attendees.
  2. Use ONLY attendees[].email (excluding self) as the recipient — NEVER the email sender.
  3. Filter out any attendee email that looks automated (noreply, alerts, etc.).
  4. If no valid attendees remain: ask "${userName}: I couldn't find valid participants to notify. Who should I contact?"
  5. PREVIEW the notification email → wait for confirmation before sending.

When asked to reply or respond to someone:
  1. Verify the fromEmail is a valid human address (not noreply/automated).
  2. PREVIEW the reply to the user. Ask: "Do you want me to send this?"
  3. Only call sendEmail after explicit confirmation.

When asked about calendar / schedule:
  1. getCalendarEvents and present events clearly with dates and times in IST.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ALWAYS call tools — never describe what you *would* do.
• Never hallucinate email addresses.
• Event times MUST include the +05:30 offset, e.g. 2026-03-28T10:00:00+05:30.
• If a meeting email is ambiguous about the time, ask ${userName} for confirmation before booking.
• Be concise. Avoid repeating the full email list if the user just wants action taken.
• ALWAYS show an email preview and wait for "yes"/"send it" before calling sendEmail.
`,

        messages,

        tools: {
            getUnreadEmails: tool({
                description:
                    `Fetch ${userName}'s unread Gmail emails. Returns: id, messageId, fromName, fromEmail, subject, date, and the full email body. Always call this first before any email action. Job alerts and newsletters will be auto-flagged.`,
                inputSchema: z.object({}),
                execute: async () => {
                    const emails = await getUnreadEmails();
                    // Flag job alert emails and filter them from actionable list
                    const flagged = emails.map((e: any) => ({
                        ...e,
                        isJobAlert: isJobAlert({ from: e.fromEmail || e.from || "", subject: e.subject }),
                    }));
                    emailCapture.push(...flagged);
                    return flagged;
                },
            }),

            getCalendarEvents: tool({
                description:
                    `Returns ${userName}'s upcoming Google Calendar events (next 2 weeks). Each event has title, start, end, and attendees (array of { email, displayName, self }). Use attendees (excluding self) as the ONLY valid recipients for meeting-related notifications — never use email senders.`,
                inputSchema: z.object({}),
                execute: async () => getCalendarEvents(),
            }),

            createCalendarEvent: tool({
                description:
                    `Creates a Google Calendar event for ${userName}. Times MUST be ISO 8601 with +05:30 offset (IST). Pass attendeeEmail to automatically send a Google Calendar invite to the other person.`,
                inputSchema: z.object({
                    title: z.string().describe("Meeting title, e.g. 'Google Meet with Farhan'"),
                    startTime: z
                        .string()
                        .describe("Start time in ISO 8601 with IST offset, e.g. 2026-03-28T10:00:00+05:30"),
                    endTime: z
                        .string()
                        .describe("End time in ISO 8601 with IST offset, e.g. 2026-03-28T11:00:00+05:30"),
                    description: z
                        .string()
                        .optional()
                        .describe("Optional: short description or agenda for the meeting"),
                    attendeeEmail: z
                        .string()
                        .optional()
                        .describe("Optional: email address of the other person, so they receive a calendar invite"),
                }),
                execute: async ({ title, startTime, endTime, description, attendeeEmail }) => {
                    // Validate attendee email if provided
                    if (attendeeEmail && !isValidRecipient(attendeeEmail)) {
                        return {
                            status: "blocked",
                            reason: `Attendee email "${attendeeEmail}" appears to be an automated address. Calendar invite was not sent to this address.`,
                            title,
                        };
                    }
                    const result = await createCalendarEvent(title, startTime, endTime, description, attendeeEmail);
                    meetingCapture.push(result);
                    return result;
                },
            }),

            sendEmail: tool({
                description:
                    `Send an email via ${userName}'s Gmail. SAFETY RULES: (1) Only call this AFTER showing the user a preview and receiving explicit confirmation. (2) Never send to noreply/automated addresses. (3) Never send to job alert senders. (4) For meeting actions, only use calendar attendees as recipients. Always set inReplyTo to the original messageId when replying.`,
                inputSchema: z.object({
                    to: z
                        .string()
                        .describe("Recipient email — must be a real human address. NEVER use noreply/automated addresses."),
                    subject: z.string().describe("Email subject. Prefix with 'Re: ' when replying"),
                    message: z
                        .string()
                        .describe(
                            `Full email body in plain text. Be warm and professional. Sign off as: '${emailSignature}'.`
                        ),
                    inReplyTo: z
                        .string()
                        .optional()
                        .describe(
                            "The original email's messageId header — set this when replying so Gmail threads the message correctly"
                        ),
                    userConfirmed: z
                        .boolean()
                        .describe("Must be true. The agent must have shown a preview and received explicit user confirmation before setting this to true."),
                }),
                execute: async ({ to, subject, message, inReplyTo, userConfirmed }) => {
                    // Gate 1: valid recipient
                    if (!isValidRecipient(to)) {
                        return {
                            status: "blocked",
                            reason: `I couldn't send that email — "${to}" appears to be an automated address. Please specify a real person's email address.`,
                        };
                    }
                    // Gate 3: user confirmed (gate 2 / job-alert check is done
                    // by the system prompt — this is the structural gate)
                    if (!userConfirmed) {
                        return {
                            status: "pending_confirmation",
                            preview: { to, subject, message },
                            reason: "Email preview generated. Awaiting user confirmation before sending.",
                        };
                    }
                    return sendEmail(to, subject, message, inReplyTo);
                },
            }),

            markEmailAsRead: tool({
                description:
                    "Mark a Gmail message as read. Always call this after processing a meeting-request email.",
                inputSchema: z.object({
                    messageId: z.string().describe("The Gmail message id (from getUnreadEmails 'id' field)"),
                }),
                execute: async ({ messageId }) => markEmailAsRead(messageId),
            }),
        },

        toolChoice: "auto",
        stopWhen: stepCountIs(15),
    });

    // ── Collect tool names used (for Activity panel) ──────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSteps: any[] = (agentResult as any).steps ?? [];
    const allToolCalls: { toolName: string }[] = allSteps.length
        ? allSteps.flatMap((s: any) => s.toolCalls ?? [])
        : ((agentResult as any).toolCalls ?? []);

    // ── Check if there is a pending email confirmation in the tool results ─
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allToolResults: any[] = allSteps.flatMap((s: any) => s.toolResults ?? []);
    const pendingConfirmation = allToolResults.find(
        (r: any) => r?.result?.status === "pending_confirmation"
    );

    // ── Extract email / meeting data from captured results ────────────────
    const capturedEmails: any[] = emailCapture;
    const capturedMeetings: any[] = meetingCapture;

    // ── Build plain-English summary if the model produced no prose ────────
    let finalText = agentResult.text;

    if (!finalText) {
        const summaryParts: string[] = [];
        if (capturedEmails.length) summaryParts.push(`Found ${capturedEmails.length} unread email(s).`);
        if (capturedMeetings.length) {
            capturedMeetings.forEach((m: any) => {
                summaryParts.push(`Scheduled "${m.title}" on ${m.start ?? "TBD"}.`);
            });
        }
        if (summaryParts.length) finalText = summaryParts.join(" ");
    }

    // ── Shape emails for the frontend ─────────────────────────────────────
    const emailCards = capturedEmails.slice(0, 10).map((email: any, i: number) => {
        const isAlert = email.isJobAlert === true;
        const name: string = email.fromName || email.fromEmail || "Unknown";
        const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
        const subjectLower = (email.subject ?? "").toLowerCase();
        const bodyLower = (email.body ?? "").toLowerCase();
        const isMeeting = !isAlert && ["meet","call","schedule","zoom","google meet","available","slot","appointment","book","invite","sync"]
            .some((kw) => subjectLower.includes(kw) || bodyLower.includes(kw));
        return {
            id: i + 1,
            sender: name,
            initials,
            subject: email.subject || "(No subject)",
            snippet: (email.body || "").slice(0, 120),
            time: email.date ? new Date(email.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
            tag: isAlert ? "Job Alert" : isMeeting ? "Meeting Request" : "Email",
        };
    });

    // ── Shape meetings for the frontend ───────────────────────────────────
    const emailToName: Record<string, string> = {};
    for (const em of capturedEmails) {
        if (em.fromEmail) emailToName[em.fromEmail.toLowerCase()] = em.fromName || em.fromEmail;
    }

    const meetingCards = capturedMeetings.map((ev: any, i: number) => {
        const start = ev.start ? new Date(ev.start) : null;
        const end   = ev.end   ? new Date(ev.end)   : null;
        const durationMin = (start && end) ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
        const attendeeEmail: string = ev.attendeeEmail ?? "";
        const attendeeName = attendeeEmail
            ? (emailToName[attendeeEmail.toLowerCase()] || attendeeEmail)
            : "";
        return {
            id: i + 1,
            title: ev.title,
            date: start ? start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
            time: start ? start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
            duration: durationMin ? `${durationMin} min` : "",
            attendee: attendeeName,
            platform: "Google Meet",
        };
    });

    return Response.json({
        text: finalText || "Done — no actions needed.",
        toolCalls: allToolCalls,
        emails: emailCards,
        meetings: meetingCards,
        // Surfaces a pending email preview to the frontend for user confirmation
        pendingEmailConfirmation: pendingConfirmation?.result?.preview ?? null,
    });
}