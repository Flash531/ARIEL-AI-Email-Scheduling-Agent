import { oauth2Client } from "@/lib/googleAuth";
import { google } from "googleapis";
import { NextResponse } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/?auth=error", req.url));
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    // Build the redirect response — send user straight to the dashboard
    const redirectUrl = new URL("/chat", req.url);
    const res = NextResponse.redirect(redirectUrl);

    // Store tokens in an httpOnly cookie (7-day expiry)
    // secure: true in production (HTTPS only), false in dev (HTTP)
    res.cookies.set("g_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Store profile in a readable cookie so the frontend can show name/avatar
    res.cookies.set(
      "g_profile",
      JSON.stringify({
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      }),
      {
        httpOnly: false,
        secure: IS_PROD,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    return res;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/?auth=error", req.url));
  }
}