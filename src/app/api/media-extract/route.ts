import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { extractYoutubeId } from "@/lib/processors/social-dev-tools";
import { listYoutubeFormats } from "@/lib/server/youtube-formats";

export const runtime = "nodejs";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (compatible; Tool2DayMediaBot/1.0; +https://www.tool2day.com)";
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const MAX_HTML_BYTES = 2_500_000;
const FETCH_TIMEOUT_MS = 18_000;

type PlatformHint =
  | "all"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "google"
  | string;

function detectPlatform(url: string): PlatformHint {
  const h = url.toLowerCase();
  if (/youtube\.com|youtu\.be|youtube-nocookie\.com/.test(h)) return "youtube";
  if (/tiktok\.com|vm\.tiktok\.com/.test(h)) return "tiktok";
  if (/instagram\.com|instagr\.am/.test(h)) return "instagram";
  if (/facebook\.com|fb\.watch|fb\.com/.test(h)) return "facebook";
  if (/pinterest\.com|pin\.it/.test(h)) return "pinterest";
  if (/drive\.google\.com|docs\.google\.com|googleusercontent\.com/.test(h))
    return "google";
  return "all";
}

function normalizeGoogleDriveUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (!/drive\.google\.com|docs\.google\.com/.test(u.hostname)) return null;
    const fileId =
      u.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ||
      u.searchParams.get("id");
    if (!fileId) return null;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  } catch {
    return null;
  }
}

function userAgentFor(platform: PlatformHint): string {
  if (
    platform === "tiktok" ||
    platform === "instagram" ||
    platform === "facebook" ||
    platform === "pinterest"
  ) {
    return MOBILE_UA;
  }
  return UA;
}

export type MediaHit = {
  url: string;
  type: "video" | "audio" | "image" | "file";
  title?: string;
  thumbnail?: string;
  source: string;
  quality?: string;
  container?: string;
  size?: number | null;
  hasAudio?: boolean;
  hasVideo?: boolean;
};

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.") || ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  return false;
}

async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("رابط غير صالح");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("يُسمح فقط بروابط http/https");
  }
  if (u.username || u.password) {
    throw new Error("روابط بمصادقة غير مسموحة");
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("مضيف غير مسموح");
  }

  const ips: string[] = [];
  if (isIP(host)) {
    ips.push(host);
  } else {
    try {
      const v4 = await lookup(host, { all: true, family: 4 });
      ips.push(...v4.map((r) => r.address));
    } catch {
      /* ignore DNS fail — fetch will fail later */
    }
  }
  if (ips.some(isPrivateIp)) {
    throw new Error("عناوين الشبكة الخاصة محظورة");
  }
  return u;
}

function absUrl(base: string, maybe: string | undefined | null): string | null {
  if (!maybe) return null;
  const t = maybe.trim().replace(/^<|>$/g, "");
  if (!t || t.startsWith("data:") || t.startsWith("blob:")) return null;
  try {
    return new URL(t, base).toString();
  } catch {
    return null;
  }
}

function guessType(url: string, hint?: string): MediaHit["type"] {
  const h = `${hint || ""} ${url}`.toLowerCase();
  if (/\.(mp4|webm|mov|m4v|mkv)(\?|$)/i.test(h) || /video\//.test(h)) {
    return "video";
  }
  if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(h) || /audio\//.test(h)) {
    return "audio";
  }
  if (/\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|$)/i.test(h) || /image\//.test(h)) {
    return "image";
  }
  return "file";
}

function metaContent(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i",
  );
  return html.match(re)?.[1] || html.match(re2)?.[1] || null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function extractFromHtml(pageUrl: string, html: string): MediaHit[] {
  const hits: MediaHit[] = [];
  const push = (
    raw: string | null | undefined,
    source: string,
    typeHint?: string,
    title?: string,
    thumb?: string,
  ) => {
    const url = absUrl(pageUrl, raw ? decodeHtml(raw) : null);
    if (!url || !/^https?:\/\//i.test(url)) return;
    if (/^(javascript:|mailto:)/i.test(url)) return;
    hits.push({
      url,
      type: guessType(url, typeHint),
      title,
      thumbnail: absUrl(pageUrl, thumb) || undefined,
      source,
    });
  };

  const title =
    metaContent(html, "og:title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();

  push(metaContent(html, "og:video:secure_url"), "og:video", "video", title || undefined, metaContent(html, "og:image") || undefined);
  push(metaContent(html, "og:video:url"), "og:video", "video", title || undefined);
  push(metaContent(html, "og:video"), "og:video", "video", title || undefined);
  push(metaContent(html, "twitter:player:stream"), "twitter", "video", title || undefined);
  push(metaContent(html, "og:audio"), "og:audio", "audio", title || undefined);
  push(metaContent(html, "og:image:secure_url"), "og:image", "image", title || undefined);
  push(metaContent(html, "og:image"), "og:image", "image", title || undefined);
  push(metaContent(html, "twitter:image"), "twitter:image", "image", title || undefined);

  // JSON-LD contentUrl / thumbnailUrl
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ld: RegExpExecArray | null;
  while ((ld = ldRe.exec(html))) {
    try {
      const data = JSON.parse(ld[1]!) as unknown;
      const stack = Array.isArray(data) ? data : [data];
      for (const node of stack) {
        if (!node || typeof node !== "object") continue;
        const o = node as Record<string, unknown>;
        const contentUrl = o.contentUrl || o.contentURL;
        if (typeof contentUrl === "string") {
          push(contentUrl, "json-ld", String(o["@type"] || ""), title || undefined);
        }
        const thumb = o.thumbnailUrl;
        if (typeof thumb === "string") {
          push(thumb, "json-ld-thumb", "image", title || undefined);
        }
      }
    } catch {
      /* ignore bad json-ld */
    }
  }

  // <video src> / <source src>
  const mediaSrc = /<(?:video|audio|source)[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = mediaSrc.exec(html))) {
    push(m[1], "html5", undefined, title || undefined);
  }

  // common direct file links in page
  const fileHref =
    /href=["']([^"']+\.(?:mp4|webm|mov|mp3|m4a|wav|pdf|zip|jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;
  while ((m = fileHref.exec(html))) {
    push(m[1], "link", undefined, title || undefined);
  }

  // dedupe
  const seen = new Set<string>();
  const out: MediaHit[] = [];
  for (const h of hits) {
    if (seen.has(h.url)) continue;
    seen.add(h.url);
    out.push(h);
  }
  return out.slice(0, 40);
}

function isDirectMediaUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|mkv|mp3|wav|m4a|aac|ogg|flac|jpe?g|png|gif|webp|avif|pdf|zip|rar|7z)(\?|$)/i.test(
    url,
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string; platform?: string };
    const raw = (body.url || "").trim();
    if (!raw) {
      return NextResponse.json({ error: "الصق رابطاً أولاً" }, { status: 400 });
    }

    const driveDirect = normalizeGoogleDriveUrl(raw);
    const target = await assertSafeUrl(driveDirect || raw);
    const platform =
      (body.platform as PlatformHint) || detectPlatform(target.toString());

    // YouTube: list qualities (دقات) via InnerTube
    const ytId = extractYoutubeId(raw);
    if (
      ytId &&
      (platform === "youtube" ||
        platform === "all" ||
        platform === "thumbnails" ||
        detectPlatform(raw) === "youtube")
    ) {
      try {
        const yt = await listYoutubeFormats(ytId);
        const items =
          platform === "thumbnails"
            ? yt.items.filter((i) => i.type === "image")
            : yt.items;
        return NextResponse.json({
          ok: true,
          pageUrl: target.toString(),
          title: yt.title,
          platform: "youtube",
          thumbnail: yt.thumbnail,
          items,
          note: "جودات يوتيوب — بدون علامة مائية من Tool2Day",
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "فشل استخراج جودات يوتيوب";
        if (platform === "youtube" || detectPlatform(raw) === "youtube") {
          return NextResponse.json({
            ok: true,
            pageUrl: target.toString(),
            title: `YouTube ${ytId}`,
            platform: "youtube",
            items: [
              {
                url: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
                type: "image",
                title: "صورة — أقصى جودة (maxres)",
                thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
                source: "youtube-thumb",
                quality: "maxres",
                container: "JPG",
              } satisfies MediaHit,
            ],
            note: `تعذّر جلب الفيديو (${message}) — تتوفر الصورة المصغّرة`,
          });
        }
      }
    }

    // Direct media link — no HTML scrape needed
    if (isDirectMediaUrl(target.toString()) || driveDirect) {
      return NextResponse.json({
        ok: true,
        pageUrl: target.toString(),
        title: target.pathname.split("/").pop() || "ملف",
        platform,
        items: [
          {
            url: target.toString(),
            type: guessType(target.toString()),
            title: target.pathname.split("/").pop(),
            source: driveDirect ? "google-drive" : "direct",
          } satisfies MediaHit,
        ],
        note: driveDirect
          ? "رابط Google Drive مباشر للتنزيل"
          : "رابط ملف مباشر",
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(target.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": userAgentFor(platform),
          Accept:
            "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "ar,en;q=0.8",
          Referer: target.origin + "/",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `تعذّر فتح الرابط (${res.status})` },
        { status: 502 },
      );
    }

    const ctype = res.headers.get("content-type") || "";
    if (/^(video|audio|image)\//i.test(ctype) || /application\/(pdf|zip)/i.test(ctype)) {
      return NextResponse.json({
        ok: true,
        pageUrl: target.toString(),
        title: target.pathname.split("/").pop() || "ملف",
        platform,
        items: [
          {
            url: target.toString(),
            type: guessType(target.toString(), ctype),
            source: "content-type",
          } satisfies MediaHit,
        ],
      });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_HTML_BYTES) {
      return NextResponse.json(
        { error: "صفحة كبيرة جداً للاستخراج" },
        { status: 413 },
      );
    }
    const html = buf.toString("utf8");
    const items = extractFromHtml(res.url || target.toString(), html);
    const pageTitle =
      metaContent(html, "og:title") ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();

    if (!items.length) {
      return NextResponse.json({
        ok: true,
        pageUrl: res.url || target.toString(),
        title: pageTitle,
        platform,
        items: [],
        note:
          "لم يُعثر على وسائط عامة في الصفحة. بعض المنصات (يوتيوب/تيك توك…) قد تخفي الرابط المباشر — جرّب الصور المصغّرة أو رابط مشاركة عاماً.",
      });
    }

    // Prefer video hits first for downloader UX
    items.sort((a, b) => {
      const rank = (t: string) =>
        t === "video" ? 0 : t === "audio" ? 1 : t === "image" ? 2 : 3;
      return rank(a.type) - rank(b.type);
    });

    return NextResponse.json({
      ok: true,
      pageUrl: res.url || target.toString(),
      title: pageTitle,
      platform,
      items,
      note: `تم الاستخراج من وسائط عامة · ${platform}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل الاستخراج";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
