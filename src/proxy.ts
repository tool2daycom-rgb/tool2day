import { type NextRequest, NextResponse } from "next/server";

/**
 * Keep middleware OFF almost everything so bloated auth cookies do not
 * trigger Vercel 494 (REQUEST_HEADER_TOO_LARGE) on every page.
 * Session refresh happens in the browser client instead.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Match nothing — disables Routing Middleware on Vercel.
  matcher: [],
};
