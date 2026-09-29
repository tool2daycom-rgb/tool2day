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
const SITE_COMMENTED_KEY = "tool2day-site-commented";

export type RatingStats = {
  average: number;
  count: number;
};

/** Starting public tally for the homepage site rating card (grows with real votes). */
export const SITE_RATING_SEED_COUNT = 56_543;
export const SITE_RATING_SEED_AVERAGE = 4.8;

function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic seed count per tool — varies by thousands (≈3k–24k). */
export function toolSeedCount(slug: string): number {
  if (!slug || slug === SITE_RATING_TARGET) return SITE_RATING_SEED_COUNT;
  const h = hashSlug(slug);
  return 3_200 + (h % 21_700);
}

/** Deterministic seed average per tool — 4.5 to 4.9 */
export function toolSeedAverage(slug: string): number {
  if (!slug || slug === SITE_RATING_TARGET) return SITE_RATING_SEED_AVERAGE;
  const h = hashSlug(`${slug}:avg`);
  return 4.5 + ((h % 5) / 10);
}

/** Merge real votes onto the public seed for site or any tool slug. */
export function applySeedStats(
  target: string,
  stats: RatingStats,
): RatingStats {
  const seedCount =
    target === SITE_RATING_TARGET
      ? SITE_RATING_SEED_COUNT
      : toolSeedCount(target);
  const seedAvg =
    target === SITE_RATING_TARGET
      ? SITE_RATING_SEED_AVERAGE
      : toolSeedAverage(target);
  const realCount = Math.max(0, Number(stats.count) || 0);
  const realAvg = Number(stats.average) || 0;
  const realSum = realAvg * realCount;
  const count = seedCount + realCount;
  const average = (seedAvg * seedCount + realSum) / count;
  return { average, count };
}

/** @deprecated use applySeedStats */
export function applySiteSeedStats(stats: RatingStats): RatingStats {
  return applySeedStats(SITE_RATING_TARGET, stats);
}

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

import { recordRecentTool } from "@/lib/recent-tools";

/** يبدأ استخداماً جديداً للأداة — التقييم مطلوب مرة لكل استخدام */
export function beginToolUse(toolSlug: string) {
  if (!canUseSession() || !toolSlug || toolSlug === SITE_RATING_TARGET) return;
  const useId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `u-${Date.now()}`;
  sessionStorage.setItem(`${USE_ID_PREFIX}${toolSlug}`, useId);
  sessionStorage.removeItem(`${USE_RATED_PREFIX}${toolSlug}`);
  recordRecentTool(toolSlug);
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

export function hasPostedSiteComment(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(SITE_COMMENTED_KEY) === "1";
}

export function markPostedSiteComment() {
  if (!canUseStorage()) return;
  localStorage.setItem(SITE_COMMENTED_KEY, "1");
  localStorage.setItem(SITE_VOTED_KEY, "1");
}

export function clearPostedSiteCommentFlag() {
  if (!canUseStorage()) return;
  localStorage.removeItem(SITE_COMMENTED_KEY);
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
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Delay revoke — Safari/iOS often aborts if the blob URL is revoked immediately.
  window.setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
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
  if (target === SITE_RATING_TARGET) {
    return applySeedStats(SITE_RATING_TARGET, localAggregateAll());
  }
  return applySeedStats(target, readLocalEntry(target));
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
  extra?: {
    displayName?: string;
    comment?: string;
    avatarUrl?: string;
    countryCode?: string;
    countryFlag?: string;
    /** One star vote per visitor on the tool/site page (upsert). */
    pageVote?: boolean;
  },
): Promise<RatingStats> {
  const clamped = Math.min(5, Math.max(1, Math.round(stars)));
  const visitorId = getVisitorId();
  const hasComment = Boolean(extra?.comment?.trim());
  const pageVote = Boolean(extra?.pageVote) || target === SITE_RATING_TARGET;
  const useId =
    target === SITE_RATING_TARGET
      ? "site"
      : getCurrentUseId(target) || `once-${Date.now()}`;
  // Site/tool page: once per visitor. Download gate: once per tool-use id.
  const visitorKey =
    target === SITE_RATING_TARGET
      ? hasComment
        ? `${visitorId}:c-${Date.now()}`
        : visitorId
      : pageVote
        ? `${visitorId}:page`
        : `${visitorId}:${useId}`;
  const once =
    (target === SITE_RATING_TARGET && !hasComment) ||
    (pageVote && !hasComment);

  try {
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target,
        stars: clamped,
        visitorKey,
        once,
        displayName: extra?.displayName,
        comment: extra?.comment,
        avatarUrl: extra?.avatarUrl,
        countryCode: extra?.countryCode,
        countryFlag: extra?.countryFlag,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as RatingStats & { localOnly?: boolean };
      if (target === SITE_RATING_TARGET) {
        markRatedSite();
        if (extra?.comment?.trim()) markPostedSiteComment();
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

  if (target === SITE_RATING_TARGET) {
    markRatedSite();
    if (extra?.comment?.trim()) markPostedSiteComment();
  } else markRatedCurrentUse(target, clamped);
  saveLocalFallback(target, clamped);
  return localFallbackStats(target);
}

export type PublicReview = {
  id: string;
  displayName: string;
  stars: number;
  comment: string;
  target: string;
  createdAt: string;
  avatarUrl?: string | null;
  countryCode?: string | null;
  countryFlag?: string | null;
};

export async function fetchPublicReviews(
  limit = 60,
): Promise<{ reviews: PublicReview[]; average: number; count: number }> {
  try {
    const res = await fetch(
      `/api/ratings?target=site&reviews=1&limit=${limit}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("bad status");
    const data = (await res.json()) as {
      reviews?: PublicReview[];
      average?: number;
      count?: number;
    };
    return {
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
      average: Number(data.average) || 0,
      count: Number(data.count) || 0,
    };
  } catch {
    return { reviews: [], average: 0, count: 0 };
  }
}

export function formatRatingAverage(average: number) {
  const n = Number(average);
  if (!Number.isFinite(n) || n <= 0) return SITE_RATING_SEED_AVERAGE.toFixed(1);
  return (Math.round(n * 10) / 10).toFixed(1);
}

export function formatRatingCount(count: number) {
  const n = Math.max(0, Math.round(Number(count) || 0));
  return n.toLocaleString("en-US");
}
