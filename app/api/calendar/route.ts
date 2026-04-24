import { NextResponse } from "next/server";
import { requireAuth, oauth2Client, loadTokensFromCookie } from "@/lib/googleAuth";
import { google } from "googleapis";

export async function GET() {
  const isAuth = await requireAuth();
  if (!isAuth) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  await loadTokensFromCookie();
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 2);

  try {
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (res.data.items || []).map((ev) => ({
      id: ev.id || "",
      title: ev.summary || "(No title)",
      start: ev.start?.dateTime || ev.start?.date || "",
      end: ev.end?.dateTime || ev.end?.date || "",
      location: ev.location || "",
      description: ev.description || "",
      attendees: (ev.attendees || [])
        .slice(0, 5)
        .map((a) => ({ email: a.email || "", name: a.displayName || a.email || "" })),
      htmlLink: ev.htmlLink || "",
      allDay: !ev.start?.dateTime,
    }));

    return NextResponse.json({ events });
  } catch (err) {
    console.error("Calendar fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
