export type TiktokHit = {
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

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const SSSTIK_UA =
  "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0";

export function extractTiktokVideoId(raw: string): string | null {
  const m = raw.match(
    /(?:tiktok\.com\/(?:@[\w.-]+\/(?:video|photo)\/|v\/|embed\/)|item_id=|shareId=)(\d{15,21})/i,
  );
  if (m?.[1]) return m[1];
  const digits = raw.match(/\/(\d{17,21})(?:\?|$)/);
  return digits?.[1] || null;
}

export function canonicalTiktokUrl(raw: string, id?: string | null): string {
  try {
    const u = new URL(raw.trim());
    const handle = u.pathname.match(/@([\w.-]+)/)?.[1];
    const vid = id || extractTiktokVideoId(raw);
    if (handle && vid) {
      return `https://www.tiktok.com/@${handle}/video/${vid}`;
    }
    if (vid) return `https://www.tiktok.com/video/${vid}`;
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return raw.trim();
  }
}

function firstUrl(v: unknown): string | undefined {
  if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
  if (Array.isArray(v)) {
    for (const x of v) {
      const u = firstUrl(x);
      if (u) return u;
    }
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return firstUrl(o.url_list || o.urlList || o.url || o.uri);
  }
  return undefined;
}

function pickCover(video: Record<string, unknown> | undefined): string | undefined {
  if (!video) return undefined;
  return (
    firstUrl(video.originCover) ||
    firstUrl(video.origin_cover) ||
    firstUrl(video.cover) ||
    firstUrl(video.dynamicCover) ||
    firstUrl(video.dynamic_cover) ||
    firstUrl(video.zoomCover) ||
    firstUrl(video.thumbnail)
  );
}

function buildItems(opts: {
  title: string;
  videoUrl?: string;
  audioUrl?: string;
  coverUrl?: string;
  source: string;
}): TiktokHit[] {
  const items: TiktokHit[] = [];
  const thumb = opts.coverUrl;
  if (opts.videoUrl) {
    items.push({
      url: opts.videoUrl,
      type: "video",
      title: "MP4 بدون علامة مائية",
      thumbnail: thumb,
      source: opts.source,
      quality: "720",
      container: "MP4",
      hasAudio: true,
      hasVideo: true,
      size: null,
    });
  }
  if (opts.audioUrl) {
    items.push({
      url: opts.audioUrl,
      type: "audio",
      title: "MP3",
      thumbnail: thumb,
      source: opts.source,
      container: "MP3",
      hasAudio: true,
      hasVideo: false,
      size: null,
    });
  }
  if (opts.coverUrl) {
    items.push({
      url: opts.coverUrl,
      type: "image",
      title: "صورة الغلاف",
      thumbnail: opts.coverUrl,
      source: `${opts.source}-cover`,
      quality: "maxres",
      container: "JPG",
      hasAudio: false,
      hasVideo: false,
      size: null,
    });
  }
  return items;
}

async function fetchText(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<{ text: string; finalUrl: string; status: number }> {
  const timeoutMs = init?.timeoutMs ?? 18_000;
  const res = await fetch(url, {
    ...init,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  return {
    text: await res.text(),
    finalUrl: res.url || url,
    status: res.status,
  };
}

function parseRehydrationItem(html: string): {
  statusCode?: number;
  statusMsg?: string;
  item?: Record<string, unknown>;
} {
  const m = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!m?.[1]) return {};
  try {
    const data = JSON.parse(m[1]) as {
      __DEFAULT_SCOPE__?: Record<string, unknown>;
    };
    const scope = data.__DEFAULT_SCOPE__ || {};
    const detail = (scope["webapp.video-detail"] ||
      scope["webapp.reflow.video.detail"]) as
      | Record<string, unknown>
      | undefined;
    if (!detail) return {};
    const statusCode =
      typeof detail.statusCode === "number" ? detail.statusCode : undefined;
    const statusMsg =
      typeof detail.statusMsg === "string" ? detail.statusMsg : undefined;
    const itemInfo = detail.itemInfo as Record<string, unknown> | undefined;
    const item = (itemInfo?.itemStruct ||
      detail.itemStruct ||
      detail.item) as Record<string, unknown> | undefined;
    return { statusCode, statusMsg, item };
  } catch {
    return {};
  }
}

async function fromTiktokPage(pageUrl: string): Promise<{
  title?: string;
  thumbnail?: string;
  items: TiktokHit[];
  darkPost?: boolean;
} | null> {
  try {
    await fetchText("https://www.tiktok.com/", {
      headers: { "User-Agent": DESKTOP_UA, Accept: "text/html" },
      timeoutMs: 10_000,
    });
  } catch {
    /* cookies optional */
  }

  let html: string;
  try {
    const page = await fetchText(pageUrl, {
      headers: {
        "User-Agent": DESKTOP_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.tiktok.com/",
      },
      timeoutMs: 16_000,
    });
    html = page.text;
  } catch {
    return null;
  }

  const parsed = parseRehydrationItem(html);
  const msg = `${parsed.statusMsg || ""} ${parsed.statusCode || ""}`.toLowerCase();
  const darkPost =
    parsed.statusCode === 10204 ||
    parsed.statusCode === 10240 ||
    msg.includes("dark_post") ||
    msg.includes("dark post");

  const item = parsed.item;
  if (!item || typeof item !== "object") {
    return darkPost ? { items: [], darkPost: true } : null;
  }

  const video = (item.video || {}) as Record<string, unknown>;
  const music = (item.music || {}) as Record<string, unknown>;
  const videoUrl =
    firstUrl(video.playAddr) ||
    firstUrl(video.play_addr) ||
    firstUrl(video.downloadAddr) ||
    firstUrl(video.download_addr);
  const audioUrl = firstUrl(music.playUrl) || firstUrl(music.play_url);
  const coverUrl = pickCover(video);
  const title =
    (typeof item.desc === "string" && item.desc) ||
    (typeof item.nickname === "string" && item.nickname) ||
    "تيك توك";

  const items = buildItems({
    title,
    videoUrl,
    audioUrl,
    coverUrl,
    source: "tiktok",
  });
  if (!items.length) {
    return darkPost ? { items: [], darkPost: true, title } : null;
  }
  return { title, thumbnail: coverUrl, items, darkPost };
}

async function fromSsstik(pageUrl: string): Promise<{
  title?: string;
  thumbnail?: string;
  items: TiktokHit[];
} | null> {
  try {
    const home = await fetchText("https://ssstik.io/", {
      headers: { "User-Agent": SSSTIK_UA, Accept: "text/html" },
      timeoutMs: 12_000,
    });
    const tt = home.text.match(/s_tt\s*=\s*['"]([^'"]+)['"]/)?.[1];
    if (!tt) return null;

    const body = new URLSearchParams({
      id: pageUrl,
      locale: "en",
      tt,
    });
    const res = await fetch("https://ssstik.io/abc?url=dl", {
      method: "POST",
      headers: {
        "User-Agent": SSSTIK_UA,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://ssstik.io",
        Referer: "https://ssstik.io/",
        "HX-Request": "true",
        "HX-Target": "target",
        "HX-Current-URL": "https://ssstik.io/",
        Accept: "*/*",
      },
      body,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const html = await res.text();
    if (!html || /currently unavailable|critical/i.test(html)) return null;

    const videoUrl = html.match(
      /<a[^>]+class="[^"]*without_watermark[^"]*"[^>]+href="([^"]+)"/i,
    )?.[1];
    const audioUrl = html.match(
      /<a[^>]+class="[^"]*music(?:_direct)?[^"]*"[^>]+href="([^"]+)"/i,
    )?.[1];
    const coverUrl =
      html.match(/<img[^>]+class="[^"]*result_author[^"]*"[^>]+src="([^"]+)"/i)?.[1] ||
      html.match(/<img[^>]+src="(https?:\/\/[^"]+tiktokcdn[^"]+)"/i)?.[1];
    const title =
      html.match(/<p class="maintext">([^<]+)<\/p>/i)?.[1]?.trim() || "تيك توك";

    const items = buildItems({
      title,
      videoUrl,
      audioUrl,
      coverUrl,
      source: "ssstik",
    });
    if (!items.some((i) => i.type === "video" || i.type === "audio")) return null;
    return { title, thumbnail: coverUrl, items };
  } catch {
    return null;
  }
}

/**
 * Public TikTok: MP4 without watermark, MP3, and cover image.
 */
export async function extractTiktokMedia(rawUrl: string): Promise<{
  title?: string;
  thumbnail?: string;
  items: TiktokHit[];
  note?: string;
} | null> {
  const id = extractTiktokVideoId(rawUrl);
  const pageUrl = canonicalTiktokUrl(rawUrl, id);

  const page = await fromTiktokPage(pageUrl);
  if (page?.items.some((i) => i.type === "video" || i.type === "audio")) {
    return {
      title: page.title,
      thumbnail: page.thumbnail,
      items: page.items,
      note: "تيك توك · MP4 بدون علامة + MP3 + الغلاف",
    };
  }

  const ssstik = await fromSsstik(pageUrl);
  if (ssstik?.items.length) {
    return {
      title: ssstik.title,
      thumbnail: ssstik.thumbnail,
      items: ssstik.items,
      note: "تيك توك · MP4 بدون علامة + MP3 + الغلاف",
    };
  }

  try {
    const { extractOneWithLoaderTo } = await import("@/lib/server/loader-to");
    const video =
      (await extractOneWithLoaderTo(pageUrl, "720", {
        maxMs: 22_000,
        fetchTimeoutMs: 10_000,
      })) ||
      (await extractOneWithLoaderTo(pageUrl, "360", {
        maxMs: 16_000,
        fetchTimeoutMs: 8_000,
      }));
    const audio = await extractOneWithLoaderTo(pageUrl, "mp3", {
      maxMs: 18_000,
      fetchTimeoutMs: 10_000,
    });
    const items: TiktokHit[] = [];
    if (video?.url) {
      items.push({
        ...video,
        title: "MP4 بدون علامة مائية",
        type: "video",
        container: "MP4",
        hasAudio: true,
        hasVideo: true,
      });
    }
    if (audio?.url) {
      items.push({
        ...audio,
        title: "MP3",
        type: "audio",
        container: "MP3",
        hasAudio: true,
        hasVideo: false,
      });
    }
    const thumb = video?.thumbnail || audio?.thumbnail;
    if (thumb && !items.some((i) => i.type === "image")) {
      items.push({
        url: thumb,
        type: "image",
        title: "صورة الغلاف",
        thumbnail: thumb,
        source: "loader-thumb",
        quality: "maxres",
        container: "JPG",
        hasAudio: false,
        hasVideo: false,
        size: null,
      });
    }
    if (items.some((i) => i.type === "video" || i.type === "audio")) {
      return {
        title: video?.title || audio?.title || "تيك توك",
        thumbnail: thumb,
        items,
        note: "تيك توك · MP4 بدون علامة + MP3 + الغلاف",
      };
    }
  } catch {
    /* fall through */
  }

  if (page?.darkPost) {
    return {
      title: page.title || "تيك توك",
      items: [],
      note: "هذا المنشور غير عام على تيك توك (إعلان/منشور مخفي). لا يتوفر MP4 أو MP3 أو غلاف للتنزيل من رابط عام.",
    };
  }

  return null;
}
