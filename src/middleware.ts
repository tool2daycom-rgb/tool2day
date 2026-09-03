import { NextResponse, type NextRequest } from "next/server";

const CANONICAL = "https://www.tool2day.com";

/** Preview/production *.vercel.app → approved Adsterra host */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (!host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const dest = new URL(`${url.pathname}${url.search}`, CANONICAL);
  return NextResponse.redirect(dest, 308);
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and static assets; still catch pages + /ads/*.html
     */
    "/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg|woff2?)$).*)",
  ],
};
