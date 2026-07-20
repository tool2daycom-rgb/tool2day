/** تقييمات Tool2Day — مرة واحدة بعد كل استخدام أداة قبل التنزيل */

export const SITE_RATING_TARGET = "site";
export const RATING_NEEDED_EVENT = "tool2day:rating-needed";
export const RATING_UPDATED_EVENT = "tool2day:rating-updated";

const VISITOR_KEY = "tool2day-visitor-id";
const CONTEXT_KEY = "tool2day-download-rating-context";
const USE_ID_PREFIX = "tool2day-use-id-";
const USE_RATED_PREFIX = "tool2day-use-rated-";
const LOCAL_PREFIX = "tool2day-rating-local-";
const MY_STARS_PREFIX = "tool2day-my-stars-";
const SITE_VOTED_KEY = "tool2day-site-voted";

export type RatingStats = {
  average: number;
  count: number;
};

type PendingDownload = {
  blob: Blob;
  filename: string;
  resolve: () => void;
  reject: (err: Error) => void;
};

let pendingDownloads: PendingDownload[] = [];
let gateResolvers: Array<(ok: boolean) => void> = [];

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function canUseSession() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function getVisitorId(): string {
  if (!canUseStorage()) return "ssr";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

/** يبدأ استخداماً جديداً للأداة — التقييم مطلوب مرة لكل استخدام */
export function beginToolUse(toolSlug: string) {
  if (!canUseSession() || !toolSlug || toolSlug === SITE_RATING_TARGET) return;
  const useId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `u-${Date.now()}`;
  sessionStorage.setItem(`${USE_ID_PREFIX}${toolSlug}`, useId);
  sessionStorage.removeItem(`${USE_RATED_PREFIX}${toolSlug}`);
}

export function getCurrentUseId(toolSlug: string): string | null {
  if (!canUseSession()) return null;
  return sessionStorage.getItem(`${USE_ID_PREFIX}${toolSlug}`);
}

export function hasRatedCurrentUse(toolSlug: string): boolean {
  if (!canUseSession()) return false;
  const useId = getCurrentUseId(toolSlug);
  if (!useId) return false;
  return sessionStorage.getItem(`${USE_RATED_PREFIX}${toolSlug}`) === useId;
}

export function markRatedCurrentUse(toolSlug: string, stars: number) {
  if (!canUseSession()) return;
  const useId = getCurrentUseId(toolSlug);
  if (useId) {
    sessionStorage.setItem(`${USE_RATED_PREFIX}${toolSlug}`, useId);
  }
  if (canUseStorage() && stars >= 1 && stars <= 5) {
    localStorage.setItem(`${MY_STARS_PREFIX}${toolSlug}`, String(stars));
  }
  window.dispatchEvent(
    new CustomEvent(RATING_UPDATED_EVENT, { detail: { target: toolSlug } }),
  );
  window.dispatchEvent(
    new CustomEvent(RATING_UPDATED_EVENT, {
      detail: { target: SITE_RATING_TARGET },
    }),
  );
}

export function getMyStars(target: string): number {
  if (!canUseStorage()) return 0;
  const n = Number(localStorage.getItem(`${MY_STARS_PREFIX}${target}`) || 0);
  return n >= 1 && n <= 5 ? n : 0;
}

export function hasRatedSite(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(SITE_VOTED_KEY) === "1";
}

export function markRatedSite() {
  if (!canUseStorage()) return;
  localStorage.setItem(SITE_VOTED_KEY, "1");
  window.dispatchEvent(
    new CustomEvent(RATING_UPDATED_EVENT, {
      detail: { target: SITE_RATING_TARGET },
    }),
  );
}

/** @deprecated استخدم hasRatedCurrentUse / hasRatedSite */
export function hasRated(target: string): boolean {
  if (target === SITE_RATING_TARGET) return hasRatedSite();
  return hasRatedCurrentUse(target);
}

export function setDownloadRatingContext(toolSlug: string | null) {
  if (!canUseStorage()) return;
  if (toolSlug) localStorage.setItem(CONTEXT_KEY, toolSlug);
  else localStorage.removeItem(CONTEXT_KEY);
}

export function getDownloadRatingContext(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(CONTEXT_KEY);
}

export function openRatingGate(target: string): Promise<boolean> {
  return new Promise((resolve) => {
    gateResolvers.push(resolve);
    window.dispatchEvent(
      new CustomEvent(RATING_NEEDED_EVENT, { detail: { target } }),
    );
  });
}

export function resolveRatingGate(ok: boolean) {
  const resolvers = gateResolvers;
  gateResolvers = [];
  resolvers.forEach((r) => r(ok));
  if (ok) {
    const queue = pendingDownloads;
    pendingDownloads = [];
    for (const item of queue) {
      try {
        triggerBrowserDownload(item.blob, item.filename);
        item.resolve();
      } catch (e) {
        item.reject(e instanceof Error ? e : new Error("فشل التنزيل"));
      }
    }
  } else {
    const queue = pendingDownloads;
    pendingDownloads = [];
    for (const item of queue) {
      item.reject(new Error("يجب تقييم الأداة قبل التنزيل"));
    }
  }
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * قبل كل تنزيل: تقييم مرة واحدة لهذا الاستخدام.
 */
export async function requireRatingThenDownload(
  blob: Blob,
  filename: string,
): Promise<void> {
  const target = getDownloadRatingContext();
  if (!target) {
    triggerBrowserDownload(blob, filename);
    return;
  }

  // تأكد من وجود استخدام فعّال
  if (!getCurrentUseId(target)) {
    beginToolUse(target);
  }

  if (hasRatedCurrentUse(target)) {
    triggerBrowserDownload(blob, filename);
    return;
  }

  return new Promise((resolve, reject) => {
    pendingDownloads.push({ blob, filename, resolve, reject });
    void openRatingGate(target);
  });
}

export async function fetchRatingStats(target: string): Promise<RatingStats> {
  try {
    const res = await fetch(
      `/api/ratings?target=${encodeURIComponent(target)}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("bad status");
    const data = (await res.json()) as RatingStats;
    return {
      average: Number(data.average) || 0,
      count: Number(data.count) || 0,
    };
  } catch {
    return localFallbackStats(target);
  }
}

function readLocalEntry(target: string): RatingStats {
  if (!canUseStorage()) return { average: 0, count: 0 };
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${target}`);
    if (!raw) return { average: 0, count: 0 };
    return JSON.parse(raw) as RatingStats;
  } catch {
    return { average: 0, count: 0 };
  }
}

function localAggregateAll(): RatingStats {
  if (!canUseStorage()) return { average: 0, count: 0 };
  let sum = 0;
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(LOCAL_PREFIX)) continue;
    try {
      const entry = JSON.parse(localStorage.getItem(key) || "{}") as RatingStats;
      const c = Number(entry.count) || 0;
      const avg = Number(entry.average) || 0;
      if (c > 0) {
        sum += avg * c;
        count += c;
      }
    } catch {
      /* skip */
    }
  }
  if (!count) return { average: 0, count: 0 };
  return { average: sum / count, count };
}

function localFallbackStats(target: string): RatingStats {
  if (target === SITE_RATING_TARGET) return localAggregateAll();
  return readLocalEntry(target);
}

function saveLocalFallback(target: string, stars: number) {
  if (!canUseStorage()) return;
  const prev = readLocalEntry(target);
  const count = prev.count + 1;
  const sum = prev.average * prev.count + stars;
  localStorage.setItem(`${MY_STARS_PREFIX}${target}`, String(stars));
  localStorage.setItem(
    `${LOCAL_PREFIX}${target}`,
    JSON.stringify({ average: sum / count, count }),
  );
}

export async function submitRating(
  target: string,
  stars: number,
): Promise<RatingStats> {
  const clamped = Math.min(5, Math.max(1, Math.round(stars)));
  const visitorId = getVisitorId();
  const useId =
    target === SITE_RATING_TARGET
      ? "site"
      : getCurrentUseId(target) || `once-${Date.now()}`;
  // مفتاح فريد لكل استخدام حتى يُحسب صوتاً جديداً
  const visitorKey =
    target === SITE_RATING_TARGET
      ? visitorId
      : `${visitorId}:${useId}`;

  try {
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target,
        stars: clamped,
        visitorKey,
        once: target === SITE_RATING_TARGET,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as RatingStats & { localOnly?: boolean };
      if (target === SITE_RATING_TARGET) {
        markRatedSite();
      } else {
        markRatedCurrentUse(target, clamped);
      }
      if (data.localOnly) {
        saveLocalFallback(target, clamped);
        return localFallbackStats(target);
      }
      return {
        average: Number(data.average) || clamped,
        count: Number(data.count) || 1,
      };
    }
  } catch {
    /* fall through */
  }

  saveLocalFallback(target, clamped);
  if (target === SITE_RATING_TARGET) markRatedSite();
  else markRatedCurrentUse(target, clamped);
  return localFallbackStats(target);
}

export function formatRatingAverage(average: number) {
  if (!average) return "—";
  return (Math.round(average * 10) / 10).toFixed(1);
}
