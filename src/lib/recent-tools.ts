/** Recently used tools — pinned to Daily section for 24 hours (client-only). */

export const RECENT_TOOLS_EVENT = "tool2day:recent-tools";
export const RECENT_TOOLS_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "tool2day-recent-tools-v1";

type RecentEntry = {
  slug: string;
  usedAt: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readRaw(): RecentEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as RecentEntry).slug === "string" &&
        typeof (e as RecentEntry).usedAt === "number",
    );
  } catch {
    return [];
  }
}

function writeRaw(entries: RecentEntry[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(RECENT_TOOLS_EVENT));
}

function prune(entries: RecentEntry[], now = Date.now()): RecentEntry[] {
  const cutoff = now - RECENT_TOOLS_TTL_MS;
  return entries
    .filter((e) => e.usedAt >= cutoff && e.slug)
    .sort((a, b) => b.usedAt - a.usedAt);
}

/** Call when the user actually uses a tool — pins it under Daily for 24h. */
export function recordRecentTool(slug: string) {
  if (!slug || slug === "site") return;
  const now = Date.now();
  const next = prune(readRaw(), now).filter((e) => e.slug !== slug);
  next.unshift({ slug, usedAt: now });
  writeRaw(next.slice(0, 40));
}

export function getRecentToolSlugs(): string[] {
  const pruned = prune(readRaw());
  if (pruned.length !== readRaw().length) writeRaw(pruned);
  return pruned.map((e) => e.slug);
}

export function subscribeRecentTools(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(RECENT_TOOLS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(RECENT_TOOLS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
