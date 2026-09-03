/**
 * Fallback media resolver via loader.to / savenow (works from datacenter IPs
 * when YouTube InnerTube returns LOGIN_REQUIRED / empty stream URLs).
 */

export type LoaderToHit = {
  url: string;
  type: "video" | "audio" | "image";
  title: string;
  thumbnail?: string;
  source: string;
  quality?: string;
  container?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  size?: number | null;
};

type StartResponse = {
  success?: boolean | number | string;
  progress_url?: string;
  title?: string;
  thumbnail_url?: string;
  format?: string;
  message?: string;
};

type ProgressResponse = {
  success?: boolean | number | string;
  progress?: number;
  download_url?: string;
  text?: string;
  title?: string;
  thumbnail_url?: string;
  format?: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function okFlag(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

function cleanThumbnail(url?: string): string | undefined {
  if (!url) return undefined;
  if (/logo\.clearbit\.com/i.test(url)) return undefined;
  return url;
}

function qualityFromFormat(format?: string, fallback?: string): string | undefined {
  const m = (format || "").match(/(\d{3,4})\s*p/i);
  if (m) return m[1];
  if (fallback && /^\d{3,4}$/.test(fallback)) return fallback;
  if (/mp3|audio/i.test(format || fallback || "")) return "audio";
  return fallback;
}

function containerOf(format?: string, isAudio?: boolean): string {
  if (isAudio || /mp3|audio/i.test(format || "")) return "MP3";
  if (/webm/i.test(format || "")) return "WEBM";
  return "MP4";
}

async function fetchJson<T>(
  url: string,
  opts?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 12_000;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*",
      "User-Agent": UA,
    },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`loader.to HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function pollDownload(
  progressUrl: string,
  opts?: { maxMs?: number; intervalMs?: number; fetchTimeoutMs?: number },
): Promise<ProgressResponse | null> {
  const maxMs = opts?.maxMs ?? 25_000;
  const intervalMs = opts?.intervalMs ?? 2_000;
  const started = Date.now();
  let last: ProgressResponse | null = null;

  while (Date.now() - started < maxMs) {
    last = await fetchJson<ProgressResponse>(progressUrl, {
      timeoutMs: opts?.fetchTimeoutMs,
    });
    if (okFlag(last.success) && last.download_url) return last;
    const text = (last.text || "").toLowerCase();
    if (text === "failed" || text.includes("error")) return null;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return okFlag(last?.success) && last?.download_url ? last : null;
}

/**
 * Resolve one quality/format for a page URL.
 * `format` examples: "360", "720", "1080", "mp3"
 */
export async function extractOneWithLoaderTo(
  pageUrl: string,
  format: string,
  opts?: { maxMs?: number; fetchTimeoutMs?: number },
): Promise<LoaderToHit | null> {
  const startUrl =
    `https://loader.to/ajax/download.php?format=${encodeURIComponent(format)}` +
    `&url=${encodeURIComponent(pageUrl)}`;

  let start: StartResponse;
  try {
    start = await fetchJson<StartResponse>(startUrl, {
      timeoutMs: opts?.fetchTimeoutMs,
    });
  } catch {
    return null;
  }

  if (!okFlag(start.success) || !start.progress_url) return null;

  const done = await pollDownload(start.progress_url, {
    maxMs: opts?.maxMs,
    fetchTimeoutMs: opts?.fetchTimeoutMs,
  });
  if (!done?.download_url) return null;

  const isAudio = format === "mp3" || /mp3|audio/i.test(done.format || format);
  const quality = qualityFromFormat(done.format, format === "mp3" ? undefined : format);
  const container = containerOf(done.format, isAudio);
  const titleBase = done.title || start.title || "وسائط";

  return {
    url: done.download_url,
    type: isAudio ? "audio" : "video",
    title: isAudio
      ? `${container} صوت`
      : `${container}${quality ? ` ${quality}` : ""} · مع صوت`,
    thumbnail: cleanThumbnail(done.thumbnail_url || start.thumbnail_url),
    source: "loader.to",
    quality: isAudio ? undefined : quality,
    container,
    hasAudio: true,
    hasVideo: !isAudio,
    size: null,
  };
}

/** YouTube: several muxed qualities + optional audio, in parallel. */
export async function youtubeViaLoaderTo(
  pageUrl: string,
  qualities: string[] = ["720", "360", "1080"],
): Promise<{ title?: string; thumbnail?: string; items: LoaderToHit[] }> {
  const jobs = [
    ...qualities.map((q) => extractOneWithLoaderTo(pageUrl, q)),
    extractOneWithLoaderTo(pageUrl, "mp3"),
  ];
  const settled = await Promise.all(jobs);
  const items: LoaderToHit[] = [];
  const seenQ = new Set<string>();

  for (const hit of settled) {
    if (!hit) continue;
    if (hit.type === "video") {
      const key = hit.quality || hit.url;
      if (seenQ.has(key)) continue;
      seenQ.add(key);
    }
    items.push(hit);
  }

  items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "video" ? -1 : b.type === "video" ? 1 : 0;
    }
    return (
      (Number.parseInt(b.quality || "0", 10) || 0) -
      (Number.parseInt(a.quality || "0", 10) || 0)
    );
  });

  const title = items.find((i) => i.title && !i.title.includes("·"))?.title;
  return {
    title: settled.find((s) => s?.thumbnail)?.title || title,
    thumbnail: settled.find((s) => s?.thumbnail)?.thumbnail,
    items,
  };
}

/** Generic social/web page → best-effort video (with audio when muxed). */
export async function socialViaLoaderTo(
  pageUrl: string,
): Promise<{ title?: string; thumbnail?: string; items: LoaderToHit[] } | null> {
  // Sequential to avoid function timeouts on some social pages.
  const hit720 = await extractOneWithLoaderTo(pageUrl, "720", {
    maxMs: 10_000,
    fetchTimeoutMs: 7_000,
  });
  const hit360 = hit720
    ? null
    : await extractOneWithLoaderTo(pageUrl, "360", {
        maxMs: 8_000,
        fetchTimeoutMs: 6_000,
      });
  const hitMp4 =
    hit720 || hit360
      ? null
      : await extractOneWithLoaderTo(pageUrl, "mp4", {
          maxMs: 8_000,
          fetchTimeoutMs: 6_000,
        });

  const hit = hit720 || hit360 || hitMp4 || null;
  if (!hit) return null;

  const items: LoaderToHit[] = [hit];
  if (hit.type === "video") {
    const audio = await extractOneWithLoaderTo(pageUrl, "mp3");
    if (audio) items.push(audio);
  }
  return {
    title: hit.title,
    thumbnail: hit.thumbnail,
    items,
  };
}
