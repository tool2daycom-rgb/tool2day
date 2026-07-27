import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_HEADER_LIMIT = 12_000;

function clearSupabaseCookies(res: NextResponse, request: NextRequest) {
  for (const c of request.cookies.getAll()) {
    if (
      c.name.startsWith("sb-") ||
      c.name.includes("supabase") ||
      c.name.includes("auth-token")
    ) {
      res.cookies.set(c.name, "", {
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });
    }
  }
}

/** Call from proxy/middleware when auth is enabled. Safe if keys are missing or invalid. */
export async function updateSession(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";

  // Soft limit: shrink cookies before Vercel hard-fails with 494 (~16–32KB).
  if (cookieHeader.length > COOKIE_HEADER_LIMIT) {
    const path = request.nextUrl.pathname;
    const allowThrough =
      path.startsWith("/api/auth/repair-avatars") ||
      path.startsWith("/_next") ||
      path === "/login";
    const res = allowThrough
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL("/login?session=reset", request.url));
    clearSupabaseCookies(res, request);
    return res;
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
        // Keep cookies small — user object lives outside the cookie jar.
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

    await supabase.auth.getUser();
  } catch {
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
