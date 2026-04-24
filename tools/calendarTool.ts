import { google } from "googleapis";
import { oauth2Client, loadTokensFromCookie } from "@/lib/googleAuth";

export async function getCalendarEvents() {
  await loadTokensFromCookie();

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client
  });

  const now = new Date();

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime"
  });

  const events = res.data.items || [];

  return events.map(event => ({
    id: event.id,
    title: event.summary,
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    // Include attendees so the agent can derive safe recipients
    // for cancellation/modification notifications
    attendees: (event.attendees ?? []).map(a => ({
      email: a.email ?? "",
      displayName: a.displayName ?? "",
      self: a.self ?? false,
    })),
  }));
}