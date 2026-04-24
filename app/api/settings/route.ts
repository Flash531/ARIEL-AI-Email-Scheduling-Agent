import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEFAULTS = {
  userName: "Muhammad",
  timezone: "Asia/Kolkata",
  model: "gpt-4o-mini",
  emailSignature: "Aria (Muhammad's AI assistant)",
  autoSchedule: true,
  autoMarkRead: true,
};

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("ariel_settings")?.value;
  try {
    const saved = raw ? JSON.parse(raw) : {};
    return NextResponse.json({ ...DEFAULTS, ...saved });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const merged = { ...DEFAULTS, ...body };
    const res = NextResponse.json({ success: true, settings: merged });
    res.cookies.set("ariel_settings", JSON.stringify(merged), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 400 });
  }
}
