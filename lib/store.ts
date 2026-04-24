import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ── Shared types ─────────────────────────────────────────── */
export type Role = "user" | "assistant";

export type Message = { role: Role; text: string };

export type AgentStep = {
  id: number;
  label: string;
  status: "done" | "active" | "pending";
};

export type MeetingCard = {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  attendee: string;
  platform: string;
};

export type EmailCard = {
  id: number;
  sender: string;
  initials: string;
  subject: string;
  snippet: string;
  time: string;
  tag: string;
};

/* ── Store shape ──────────────────────────────────────────── */
interface AppState {
  messages: Message[];
  activityItems: AgentStep[];
  meetings: MeetingCard[];
  emails: EmailCard[];
  scheduledMeetingsCount: number;
  emailSummaryCount: number;

  /* Actions */
  addMessage: (msg: Message) => void;
  setActivityItems: (items: AgentStep[]) => void;
  setMeetings: (items: MeetingCard[]) => void;
  setEmails: (items: EmailCard[]) => void;
  clearMessages: () => void;
  setMeetingsCount: (n: number) => void;
  setEmailCount: (n: number) => void;
}

/* ── Store ────────────────────────────────────────────────── */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      messages: [],
      activityItems: [],
      meetings: [],
      emails: [],
      scheduledMeetingsCount: 0,
      emailSummaryCount: 0,

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      setActivityItems: (items) =>
        set({ activityItems: items }),

      setMeetings: (items) =>
        set({ meetings: items, scheduledMeetingsCount: items.length }),

      setEmails: (items) =>
        set({ emails: items, emailSummaryCount: items.length }),

      clearMessages: () =>
        set({ messages: [], activityItems: [] }),

      setMeetingsCount: (n) => set({ scheduledMeetingsCount: n }),
      setEmailCount: (n)    => set({ emailSummaryCount: n }),
    }),
    { name: "ariel-app-state" }
  )
);
