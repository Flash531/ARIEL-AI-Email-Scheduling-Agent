# Ariel — AI Inbox Assistant

> Your inbox has been running you. Not anymore.

Ariel is an autonomous AI inbox assistant that connects to your Gmail, reads and summarizes your emails, detects meeting requests, and schedules them on your calendar — automatically. Built with Next.js, powered by GPT-4o, and designed with a premium dark-native UI.

![Ariel Dashboard](https://ariel-agent.vercel.app)

---

## ✨ Features

- **AI Email Summaries** — Ariel reads your inbox and distills every email into a one-line summary. No more skimming walls of text.
- **Autonomous Meeting Scheduling** — Detects meeting requests in emails, checks your Google Calendar for availability, and books the slot automatically.
- **Agent Activity Feed** — A live, transparent log of everything Ariel does on your behalf. No black boxes.
- **Inbox Prioritization** — Emails are tagged as Urgent, Pending, or Low priority so you always know what needs attention first.
- **Chat Interface** — Talk to Ariel like a colleague. Ask it to handle meeting requests, check your calendar, or summarize unread emails.
- **Persistent State** — Chat history, email summaries, and meeting data persist across page navigation using Zustand + localStorage.
- **Safety Guardrails** — Triple-gate email safety system prevents rogue sends to automated or noreply addresses.

---

## 🛡️ Safety System

Ariel is built with production-grade email safety guardrails. Before any email is sent, three independent gates must all pass:

### Gate 1 — Recipient Validation
```ts
isValidRecipient(email: string): boolean
```
Blocks any address containing: `noreply`, `no-reply`, `donotreply`, `notifications`, `alerts`, `newsletter`, `mailer`, `bounce`, `jobs`, and more.

### Gate 2 — Job Alert Detection
```ts
isJobAlert(email: Email): boolean
```
Matches 15+ recruitment domains (Glassdoor, LinkedIn, Indeed, Naukri, etc.) and subject-line keywords. Flagged emails are tagged "Job Alert" in the inbox and are completely skipped by the agent.

### Gate 3 — Explicit User Confirmation
Every email requires explicit user confirmation before sending. Ariel surfaces a preview banner showing:
- **To:** recipient
- **Subject:** subject line
- **Body:** full preview

Only clicking **✓ Send Email** fires the actual send. The API structurally refuses to send without `userConfirmed: true`.

### Recipient Source Rule
When cancelling or modifying meetings, Ariel **only** uses attendees from the actual Google Calendar event — never the inbox sender, never the email subject.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router + Turbopack) |
| Styling | Tailwind CSS |
| AI Model | GPT-4o mini |
| Auth | Google OAuth 2.0 (NextAuth.js) |
| Gmail | Gmail API (read, summarize) |
| Calendar | Google Calendar API (read, create events) |
| State | Zustand + persist middleware (localStorage) |
| Deployment | Vercel |

---

## 📁 Project Structure

```
app/
  (dashboard)/
    layout.tsx          ← shared dashboard layout (prevents state reset)
    chat/page.tsx       ← main chat + agent interface
    inbox/page.tsx      ← email list with AI summaries
    meetings/page.tsx   ← scheduled meetings grid
  settings/
    layout.tsx          ← shared nav for settings
    page.tsx            ← preferences + connected account
  api/
    agent/route.ts      ← main AI agent endpoint
    auth/               ← NextAuth Google OAuth handlers

lib/
  store.ts              ← Zustand global store
  emailSafetyUtils.ts   ← isValidRecipient + isJobAlert
  calendarTool.ts       ← Google Calendar integration
  sendEmail.ts          ← email sending with safety gates

components/
  DashboardLayout.tsx   ← 3-column layout shell
  LeftSidebar.tsx       ← nav + user status
  RightPanel.tsx        ← activity feed + meetings + email summary
  EmailRow.tsx          ← individual email item
  MeetingCard.tsx       ← individual meeting card
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Cloud project with Gmail API and Calendar API enabled
- OAuth 2.0 credentials (Web application)

### Installation

```bash
git clone https://github.com/yourusername/ariel-agent
cd ariel-agent
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔄 Data Flow

```
User sends message in /chat
         │
         ▼
POST /api/agent
  → reads Gmail (last 20 emails)
  → classifies emails (job alert / normal / urgent)
  → detects meeting requests
  → checks Google Calendar availability
  → responds with data.emails + data.meetings
         │
         ▼
chat/page.tsx (runAgent)
  → storeEmails(data.emails)        → right panel email summary
  → storeArielEmails(arielEmails)   → /inbox page
  → setArielMeetings(meetings)      → /meetings page
         │
         ▼
Zustand store (persisted to localStorage)
         │
         ├── /inbox reads arielEmails
         │     urgent   → "Urgent" tag (red)
         │     normal   → "Pending" tag (yellow)
         │     low      → "Low" tag (gray)
         │     isRead   → "Handled" tag
         │
         └── /meetings reads arielMeetings
               derived from keywords → shown as TBD
               confirmed calendar events → override derived
```

---

## 📄 Pages

### `/` — Landing Page
Premium dark landing page with hero, problem/solution sections, how it works, features, testimonials, and waitlist CTA.

### `/chat` — Dashboard
Main agent interface. Chat with Ariel, see agent activity, scheduled meetings, and email summaries in real time.

### `/inbox` — Inbox
All emails read and processed by Ariel, with AI summaries, priority tags, and sender details.

### `/meetings` — Meetings
All meetings detected and scheduled by Ariel, with contact details, date/time, and duration.

### `/settings` — Settings
Manage connected Google account, AI preferences (name, signature, model, timezone), and agent behaviour toggles.

---

## 🔒 Permissions

Ariel requests the following Google OAuth scopes:

| Scope | Purpose |
|---|---|
| `gmail.readonly` | Read inbox emails |
| `gmail.send` | Send emails on your behalf (with confirmation) |
| `calendar.readonly` | Check availability |
| `calendar.events` | Create and manage calendar events |

---

## 🗺️ Roadmap

- [ ] Real-time email polling (push notifications via Gmail API watch)
- [ ] Multi-account support
- [ ] Email drafting and reply suggestions
- [ ] Smarter meeting detection using AI classification (replace regex)
- [ ] Mobile responsive layout
- [ ] Team/shared inbox support
- [ ] Usage analytics dashboard

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📝 License

MIT

---

Built by [Mohd Farhan](https://github.com/yourusername) · Deployed on [Vercel](https://ariel-agent.vercel.app)
