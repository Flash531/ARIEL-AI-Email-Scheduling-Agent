import { google } from "googleapis";
import { cookies } from "next/headers";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Load tokens from the g_tokens cookie into the oauth2Client.
 * Returns true if a valid session cookie was found, false otherwise.
 * Throws if the cookie is present but malformed.
 * No fallback to env credentials — auth must come from a real user session.
 */
export async function loadTokensFromCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("g_tokens")?.value;

  if (!raw) return false;

  try {
    const tokens = JSON.parse(raw);
    oauth2Client.setCredentials(tokens);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the current request has a valid Google session.
 * Use this at the top of any API route that requires authentication.
 */
export async function requireAuth(): Promise<boolean> {
  return loadTokensFromCookie();
}