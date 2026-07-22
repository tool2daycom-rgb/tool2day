/**
 * Allow relative paths and known Tool2Day hosts only (prevent open redirects).
 */
export function safeAuthRedirect(next: string | null | undefined, origin: string): string {
  const fallback = `${origin.replace(/\/$/, "")}/`;
  if (!next) return fallback;

  const allowedHosts = new Set([
    "tool2day.com",
    "www.tool2day.com",
    "lookup.tool2day.com",
    "aman.tool2day.com",
    "design.tool2day.com",
  ]);

  if (next.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, origin).toString();
  }

  try {
    const url = new URL(next);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    if (!allowedHosts.has(url.hostname)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}
