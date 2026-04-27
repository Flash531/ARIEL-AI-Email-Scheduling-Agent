import { NextResponse } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  // Always redirect to "/" — never render raw JSON in the browser
  const res = NextResponse.redirect(new URL("/", req.url));

  const cookieBase = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    maxAge: 0, // expires immediately
    path: "/",
  };

  res.cookies.set("g_tokens", "", cookieBase);
  res.cookies.set("g_profile", "", { ...cookieBase, httpOnly: false });

  return res;
}
