/** تقييمات Tool2Day — بوابة تنزيل + تخزين محلي ومزامنة API */

export const SITE_RATING_TARGET = "site";
export const RATING_NEEDED_EVENT = "tool2day:rating-needed";
export const RATING_UPDATED_EVENT = "tool2day:rating-updated";

const VOTED_KEY = "tool2day-rated-targets";
const VISITOR_KEY = "tool2day-visitor-id";
const CONTEXT_KEY = "tool2day-download-rating-context";
const LOCAL_PREFIX = "tool2day-rating-local-";
const MY_STARS_PREFIX = "tool2day-my-stars-";

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

function votedSet(): Set<string> {
  if (!canUseStorage()) return new Set();
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveVoted(set: Set<string>) {
  if (!canUseStorage()) return;
  localStorage.setItem(VOTED_KEY, JSON.stringify([...set]));
}

export function hasRated(target: string): boolean {
  return votedSet().has(target);
}

export function markRated(target: string) {
  const set = votedSet();
  set.add(target);
  saveVoted(set);
  window.dispatchEvent(
    new CustomEvent(RATING_UPDATED_EVENT, { detail: { target } }),
  );
  // أي تقييم أداة يحدّث تجميع الموقع
  if (target !== SITE_RATING_TARGET) {
    window.dispatchEvent(
      new CustomEvent(RATING_UPDATED_EVENT, {
        detail: { target: SITE_RATING_TARGET },
      }),
    );
  }
}

/** سياق الأداة الحالية للتنزيل */
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
 * يُستدعى من downloadBlob — إن لم يقيّم المستخدم تظهر النافذة ويُؤجّل التنزيل.
 */
export async function requireRatingThenDownload(
  blob: Blob,
  filename: string,
): Promise<void> {
  const target = getDownloadRatingContext();
  if (!target || hasRated(target)) {
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

/** تجميع كل تقييمات الأدوات (+ الموقع) من التخزين المحلي */
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
  const myKey = `${MY_STARS_PREFIX}${target}`;
  const prevMine = Number(localStorage.getItem(myKey) || 0);
  const prev = readLocalEntry(target);

  let count = prev.count;
  let sum = prev.average * prev.count;

  if (prevMine >= 1 && prevMine <= 5 && count > 0) {
    sum = sum - prevMine + stars;
  } else {
    count += 1;
    sum += stars;
  }

  localStorage.setItem(myKey, String(stars));
  localStorage.setItem(
    `${LOCAL_PREFIX}${target}`,
    JSON.stringify({
      average: count ? sum / count : stars,
      count: Math.max(1, count),
    }),
  );
}

export async function submitRating(
  target: string,
  stars: number,
): Promise<RatingStats> {
  const clamped = Math.min(5, Math.max(1, Math.round(stars)));
  const visitorKey = getVisitorId();

  try {
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, stars: clamped, visitorKey }),
    });
    if (res.ok) {
      const data = (await res.json()) as RatingStats & { localOnly?: boolean };
      markRated(target);
      if (data.localOnly) {
        saveLocalFallback(target, clamped);
        return localFallbackStats(target);
      }
      // بعد تقييم أداة، أعد جلب تجميع الموقع في الواجهة عبر الحدث
      return {
        average: Number(data.average) || clamped,
        count: Number(data.count) || 1,
      };
    }
  } catch {
    /* fall through */
  }

  saveLocalFallback(target, clamped);
  markRated(target);
  return localFallbackStats(target);
}

export function formatRatingAverage(average: number) {
  if (!average) return "—";
  return (Math.round(average * 10) / 10).toFixed(1);
}
