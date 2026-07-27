import { createBrowserClient } from "@supabase/ssr";

/** New storage key — ignore legacy bloated sb-* cookie chunks after user clears them. */
const AUTH_STORAGE_KEY = "t2d-auth-v2";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient(url, key, {
    cookieOptions: {
      name: AUTH_STORAGE_KEY,
      path: "/",
      sameSite: "lax",
    },
    cookies: {
      // Avoid stuffing the full user object into cookies (Vercel header limits).
      encode: "tokens-only",
    },
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
