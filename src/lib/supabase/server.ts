import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const AUTH_STORAGE_KEY = "t2d-auth-v2";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookieOptions: {
      name: AUTH_STORAGE_KEY,
      path: "/",
      sameSite: "lax",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — middleware will refresh sessions.
        }
      },
      encode: "tokens-only",
    } as {
      getAll: () => { name: string; value: string }[];
      setAll: (
        cookies: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[],
      ) => void;
      encode?: "tokens-only" | "user-and-tokens";
    },
  });
}
