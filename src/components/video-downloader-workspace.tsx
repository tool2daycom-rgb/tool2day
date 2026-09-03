"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { LogoRemoveControls, type DelogoBox } from "@/components/logo-remove-controls";
import { useToolDisplay } from "@/hooks/use-tool-display";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import { extractYoutubeId } from "@/lib/processors/social-dev-tools";

type PlatformId =
  | "all"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "google"
  | "thumbnails"
  | "delogo-video"
  | "delogo-image";

type MediaItem = {
  url: string;
  type: string;
  title?: string;
  thumbnail?: string;
  source: string;
  quality?: string;
  container?: string;
  size?: number | null;
  hasAudio?: boolean;
  hasVideo?: boolean;
  itag?: number;
  videoId?: string;
};

const PLATFORMS: {
  id: PlatformId;
  label: string;
  hint: string;
  icon?: string;
}[] = [
  { id: "all", label: "الكل", hint: "أي رابط عام" },
  {
    id: "youtube",
    label: "YouTube",
    hint: "يوتيوب / Shorts",
    icon: "/platform-icons/youtube.png",
  },
  {
    id: "tiktok",
    label: "TikTok",
    hint: "تيك توك",
    icon: "/platform-icons/tiktok.png",
  },
  {
    id: "instagram",
    label: "Instagram",
    hint: "ريلز / بوست",
    icon: "/platform-icons/instagram.png",
  },
  {
    id: "facebook",
    label: "Facebook",
    hint: "فيسبوك / Watch",
    icon: "/platform-icons/facebook.png",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    hint: "بينترست",
    icon: "/platform-icons/pinterest.png",
  },
  {
    id: "google",
    label: "Google",
    hint: "Drive / روابط جوجل",
    icon: "/platform-icons/google.png",
  },
  { id: "thumbnails", label: "صور مصغّرة", hint: "يوتيوب maxres" },
  { id: "delogo-video", label: "إزالة شعار فيديو", hint: "بدون علامة مائية" },
  { id: "delogo-image", label: "إزالة شعار صورة", hint: "بدون علامة مائية" },
];

const field =
  "mt-1 block w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-sm font-semibold text-[#222]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#bbb]";
const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-bold text-[#333] transition hover:bg-[#e8e8e8]";
const btnDownload =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#e11d48] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#be123c] disabled:cursor-not-allowed disabled:bg-[#f9a8b4]";

function decodeHtmlEntities(s: string): string {
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  }
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(Number.parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Number.parseInt(n, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function formatSize(n?: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function typeLabel(item: MediaItem): string {
  if (item.title) return item.title;
  if (item.type === "image") return "صورة — أقصى جودة (maxres)";
  if (item.type === "audio") return `${item.container || "M4A"} صوت`;
  if (item.container && item.quality) {
    return `${item.container} ${item.quality}`;
  }
  if (item.type === "video") return "فيديو";
  return "ملف";
}

function platformMetaForKey(key: string): {
  label: string;
  icon?: string;
  tone: string;
} {
  const value = key.toLowerCase();
  if (value.includes("youtube")) {
    return {
      label: "YouTube",
      icon: "/platform-icons/youtube.png",
      tone: "bg-[#fff1f2] text-[#b91c1c]",
    };
  }
  if (value.includes("tiktok")) {
    return {
      label: "TikTok",
      icon: "/platform-icons/tiktok.png",
      tone: "bg-[#f4f4f5] text-[#18181b]",
    };
  }
  if (value.includes("instagram")) {
    return {
      label: "Instagram",
      icon: "/platform-icons/instagram.png",
      tone: "bg-[#fdf2f8] text-[#be185d]",
    };
  }
  if (value.includes("facebook") || value.includes("fb")) {
    return {
      label: "Facebook",
      icon: "/platform-icons/facebook.png",
      tone: "bg-[#eff6ff] text-[#1d4ed8]",
    };
  }
  if (value.includes("pinterest") || value.includes("pin")) {
    return {
      label: "Pinterest",
      icon: "/platform-icons/pinterest.png",
      tone: "bg-[#fff1f2] text-[#be123c]",
    };
  }
  if (value.includes("google") || value.includes("drive")) {
    return {
      label: "Google",
      icon: "/platform-icons/google.png",
      tone: "bg-[#f0fdf4] text-[#15803d]",
    };
  }
  return { label: "Web", tone: "bg-[#f5f5f5] text-[#555]" };
}

function platformMetaForItem(item: MediaItem) {
  return platformMetaForKey(`${item.source} ${item.url} ${item.title || ""}`);
}

export function VideoDownloaderWorkspace({
  slug,
  arTitle,
  arDescription,
}: {
  slug: string;
  arTitle: string;
  arDescription: string;
}) {
  const { title, description } = useToolDisplay(slug, arTitle, arDescription);
  const [platform, setPlatform] = useState<PlatformId>("all");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [delogoBoxes, setDelogoBoxes] = useState<DelogoBox[]>([]);

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  useEffect(() => {
    setFile(null);
    setDelogoBoxes([]);
    setItems([]);
    setError(null);
    setNote("");
    setStatus(null);
    setPageTitle(null);
    setPreviewThumb(null);
  }, [platform]);

  const placeholder = useMemo(() => {
    switch (platform) {
      case "youtube":
        return "https://www.youtube.com/watch?v=… أو Shorts";
      case "tiktok":
        return "https://www.tiktok.com/@user/video/…";
      case "instagram":
        return "https://www.instagram.com/reel/… أو /p/…";
      case "facebook":
        return "https://www.facebook.com/…/videos/… أو fb.watch";
      case "pinterest":
        return "https://www.pinterest.com/pin/…";
      case "google":
        return "https://drive.google.com/file/d/… أو رابط جوجل";
      case "thumbnails":
        return "رابط يوتيوب أو انستغرام للصورة المصغّرة (maxres)";
      default:
        return "الصق رابط يوتيوب، تيك توك، انستغرام، فيسبوك، بينترست أو جوجل…";
    }
  }, [platform]);

  const isDelogo = platform === "delogo-video" || platform === "delogo-image";

  const videoRows = useMemo(
    () => items.filter((i) => i.type === "video" || i.type === "audio"),
    [items],
  );
  const imageRows = useMemo(
    () => items.filter((i) => i.type === "image"),
    [items],
  );
  const otherRows = useMemo(
    () =>
      items.filter(
        (i) => i.type !== "video" && i.type !== "audio" && i.type !== "image",
      ),
    [items],
  );
  const previewVideo = useMemo(
    () => videoRows.find((i) => i.type === "video") || null,
    [videoRows],
  );

  async function runThumbnails(raw: string) {
    const yt = extractYoutubeId(raw);
    if (yt) {
      const thumb = `https://img.youtube.com/vi/${yt}/maxresdefault.jpg`;
      setItems([
        {
          url: thumb,
          type: "image",
          title: "صورة — أقصى جودة (maxres)",
          thumbnail: thumb,
          source: "youtube-thumb",
          quality: "maxres",
          container: "JPG",
        },
      ]);
      setPreviewThumb(thumb);
      setPageTitle("YouTube thumbnail");
      setNote("صورة مصغّرة بأقصى جودة فقط (maxres)");
      setStatus("وُجدت صورة مصغّرة maxres");
      return;
    }
    const res = await fetch("/api/thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: raw }),
    });
    const data = (await res.json()) as {
      thumbnail?: string;
      title?: string;
      error?: string;
    };
    if (!res.ok || !data.thumbnail) {
      throw new Error(data.error || "فشل استخراج الصورة المصغّرة");
    }
    setItems([
      {
        url: data.thumbnail,
        type: "image",
        title: "صورة — أقصى جودة (maxres)",
        thumbnail: data.thumbnail,
        source: "thumbnail-api",
        quality: "maxres",
      },
    ]);
    setPreviewThumb(data.thumbnail);
    setPageTitle(data.title || "الصورة المصغّرة");
    setNote(data.title || "صورة مصغّرة");
    setStatus("وُجدت صورة مصغّرة");
  }

  async function runDelogo() {
    if (!file) {
      setError(
        platform === "delogo-image" ? "اختر صورة أولاً" : "اختر فيديو أولاً",
      );
      return;
    }
    if (!delogoBoxes.length) {
      setError("ارسم منطقة الشعار على المعاينة أولاً");
      return;
    }
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setProgress(10);
    setStatus("جارٍ إزالة الشعار…");
    try {
      const media = await import("@/lib/processors/media");
      const onProgress = (p: number) => {
        setProgress(Math.round(p * 100));
        setStatus("جارٍ المعالجة…");
      };
      if (platform === "delogo-image") {
        await media.removeLogoFromImage(file, delogoBoxes, onProgress);
      } else {
        await media.removeLogo(file, delogoBoxes, onProgress);
      }
      setProgress(100);
      setStatus("تم التنزيل — بدون علامة مائية");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إزالة الشعار");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (isDelogo) {
      await runDelogo();
      return;
    }
    const raw = url.trim();
    if (!raw) {
      setError("الصق رابطاً أولاً");
      return;
    }
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setNote("");
    setItems([]);
    setPageTitle(null);
    setPreviewThumb(null);
    setStatus("جارٍ فحص الرابط…");
    try {
      if (platform === "thumbnails") {
        await runThumbnails(raw);
        return;
      }

      const res = await fetch("/api/media-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw, platform }),
      });
      const data = (await res.json()) as {
        error?: string;
        note?: string;
        title?: string;
        thumbnail?: string;
        platform?: string;
        items?: MediaItem[];
      };
      if (!res.ok) throw new Error(data.error || "فشل الاستخراج");

      let next = data.items || [];

      // Non-YouTube: keep at most one image row (prefer largest / first)
      const isYt = Boolean(extractYoutubeId(raw));
      if (!isYt) {
        const imgs = next.filter((i) => i.type === "image");
        const rest = next.filter((i) => i.type !== "image");
        if (imgs.length > 1) {
          const best = imgs[0]!;
          next = [
            ...rest,
            {
              ...best,
              title: best.title?.includes("maxres")
                ? best.title
                : "صورة — أقصى جودة (maxres)",
            },
          ];
        } else if (imgs.length === 1 && imgs[0]) {
          next = [
            ...rest,
            {
              ...imgs[0],
              title: "صورة — أقصى جودة (maxres)",
            },
          ];
        }
      }

      // If social returned no video, still show what we have
      setItems(next);
      setPageTitle(data.title || null);
      setPreviewThumb(
        data.thumbnail ||
          next.find((i) => i.thumbnail)?.thumbnail ||
          next.find((i) => i.type === "image")?.url ||
          null,
      );
      setNote(
        data.note ||
          (data.title
            ? `صفحة: ${data.title}${data.platform ? ` · ${data.platform}` : ""}`
            : ""),
      );
      setStatus(
        next.length
          ? `وُجد ${next.length} خيار تنزيل`
          : "لا نتائج عامة — جرّب رابط مشاركة عاماً أو يوتيوب/فيسبوك",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الاستخراج");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function downloadItem(item: MediaItem) {
    setBusy(true);
    setError(null);
    setStatus("جارٍ التحميل…");
    try {
      beginToolUse(slug);

      const {
        hasRatedCurrentUse,
        openRatingGate,
        getCurrentUseId,
        beginToolUse: startUse,
      } = await import("@/lib/ratings");
      if (!getCurrentUseId(slug)) startUse(slug);
      if (!hasRatedCurrentUse(slug)) {
        const ok = await openRatingGate(slug);
        if (!ok) throw new Error("يجب تقييم الأداة قبل التنزيل");
      }

      // YouTube video/audio OR Cobalt tunnels: refresh/open in browser
      const ytId =
        item.videoId ||
        (item.source.includes("youtube")
          ? extractYoutubeId(url) || undefined
          : undefined);
      const isDirectStream =
        /^https?:\/\//i.test(item.url) &&
        (item.type === "video" || item.type === "audio") &&
        (/googlevideo\.com/i.test(item.url) ||
          /savenow\.to|loader\.to/i.test(item.url) ||
          /cobalt/i.test(item.source) ||
          /tunnel/i.test(item.url) ||
          /fbcdn\.net|cdninstagram|tiktokcdn|pinimg|twimg/i.test(item.url));

      if (
        (item.type === "video" || item.type === "audio") &&
        (ytId ||
          isDirectStream ||
          item.source.startsWith("cobalt") ||
          item.source === "loader.to")
      ) {
        let direct = item.url;

        // loader.to sometimes returns short-lived URLs; refresh on click.
        if (item.source === "loader.to") {
          try {
            const pageUrl = url.trim();
            const format =
              item.type === "audio" ? "mp3" : item.quality || "720";
            if (pageUrl && format) {
              const res = await fetch("/api/loader-to-download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: pageUrl, format }),
              });
              const data = (await res.json()) as {
                ok?: boolean;
                url?: string;
              };
              if (res.ok && data.url) direct = data.url;
            }
          } catch {
            /* fallback to existing item.url */
          }
        }

        if (
          ytId &&
          item.itag &&
          !item.source.startsWith("cobalt") &&
          item.source !== "youtube-browser"
        ) {
          const q = new URLSearchParams({
            v: ytId,
            kind: item.type === "audio" ? "audio" : "video",
            itag: String(item.itag),
          });
          if (item.quality) q.set("quality", item.quality);
          const res = await fetch(`/api/youtube-download?${q}`);
          const data = (await res.json()) as { url?: string; error?: string };
          if (!res.ok || !data.url) {
            throw new Error(data.error || "فشل تجهيز رابط الفيديو");
          }
          direct = data.url;
        }
        const a = document.createElement("a");
        a.href = direct;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setStatus(
          item.hasAudio === false
            ? "جارٍ فتح رابط التنزيل المباشر للفيديو"
            : "جارٍ فتح رابط التنزيل المباشر مع الصوت",
        );
        return;
      }

      if (item.url.startsWith("/api/youtube-download")) {
        const res = await fetch(item.url);
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          throw new Error(data.error || "فشل تجهيز رابط الفيديو");
        }
        window.open(data.url, "_blank", "noopener,noreferrer");
        setStatus("فُتح الفيديو في تبويب جديد للتنزيل");
        return;
      }

      const href = item.url.startsWith("/")
        ? item.url
        : `/api/media-proxy?url=${encodeURIComponent(item.url)}`;

      const res = await fetch(href);
      if (!res.ok) {
        window.open(item.url, "_blank", "noopener,noreferrer");
        setStatus("فُتح الرابط — احفظه من المتصفح إن لزم");
        return;
      }
      const blob = await res.blob();
      const ext =
        item.container?.toLowerCase() ||
        (blob.type.includes("png")
          ? "png"
          : blob.type.includes("webp")
            ? "webp"
            : blob.type.includes("mp4")
              ? "mp4"
              : item.type === "audio"
                ? "m4a"
                : "jpg");
      const safe = (pageTitle || item.title || "tool2day-media")
        .replace(/[^\w\u0600-\u06FF-]+/g, "-")
        .slice(0, 40);
      const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
      await downloadBlob(blob, `${safe}.${ext}`);
      setStatus("تم التنزيل");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل التحميل";
      if (msg.includes("تقييم")) {
        setError(msg);
        setStatus(null);
        return;
      }
      try {
        window.open(item.url, "_blank", "noopener,noreferrer");
        setStatus("فُتح الرابط — احفظه من المتصفح إن لزم");
        setError(msg);
      } catch {
        setError(msg);
        setStatus(null);
      }
    } finally {
      setBusy(false);
    }
  }

  function DownloadTable({
    rows,
    emptyHint,
  }: {
    rows: MediaItem[];
    emptyHint?: string;
  }) {
    if (!rows.length) {
      return emptyHint ? (
        <p className="text-sm text-[#888]">{emptyHint}</p>
      ) : null;
    }
    return (
      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="bg-[#f7f7f7] text-xs font-bold text-[#555]">
              <th className="px-3 py-2 text-start">النوع / الدقة</th>
              <th className="px-3 py-2 text-start">الحجم</th>
              <th className="px-3 py-2 text-start">تنزيل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr
                key={`${item.source}-${item.quality || ""}-${item.container || ""}-${item.url.slice(0, 64)}`}
                className="border-t border-[#eee] bg-white"
              >
                <td className="px-3 py-2.5 font-bold text-[#111]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      {typeLabel(item)}
                      {item.hasVideo && item.hasAudio === false ? (
                        <span
                          className="text-[10px] font-semibold text-[#e11d48]"
                          title="بدون مسار صوت"
                        >
                          🔇
                        </span>
                      ) : null}
                    </span>
                    {(() => {
                      const meta = platformMetaForItem(item);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}
                        >
                          {meta.icon ? (
                            <Image
                              src={meta.icon}
                              alt=""
                              width={12}
                              height={12}
                              className="h-3 w-3 rounded-sm object-contain"
                            />
                          ) : null}
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-[#666]" dir="ltr">
                  {formatSize(item.size)}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    className={btnDownload}
                    disabled={busy}
                    onClick={() => void downloadItem(item)}
                  >
                    ↓ تنزيل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
      <div className="bg-gradient-to-b from-[#fce7f3] to-[#fff1f2] px-5 py-6 sm:px-6">
        <p className="text-lg font-semibold text-[#111]">{title}</p>
        {description ? (
          <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                platform === p.id
                  ? "bg-[#111] text-white"
                  : "bg-white/80 text-[#444] hover:bg-white"
              }`}
              title={p.hint}
            >
              {p.icon ? (
                <Image
                  src={p.icon}
                  alt=""
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 rounded-sm object-contain"
                />
              ) : null}
              {p.label}
            </button>
          ))}
        </div>

        {isDelogo ? (
          <div className="mt-4 space-y-4 rounded-xl bg-white/90 p-4">
            <label className="block text-sm font-bold text-[#222]">
              {platform === "delogo-image" ? "الصورة" : "الفيديو"}
              <input
                className={`${field} file:me-3 file:rounded-lg file:border-0 file:bg-[#111] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white`}
                type="file"
                accept={platform === "delogo-image" ? "image/*" : "video/*"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <LogoRemoveControls file={file} onBoxesChange={setDelogoBoxes} />
            {busy && progress > 0 ? (
              <div className="h-2 overflow-hidden rounded-full bg-[#eee]">
                <div
                  className="h-full bg-[#2563eb] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
            <button
              type="button"
              className={btnPrimary}
              disabled={busy || !file}
              onClick={() => void run()}
            >
              {busy ? "جارٍ الإزالة…" : "إزالة الشعار وتنزيل"}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              className={`${field} mt-0 flex-1 border-0 shadow-sm`}
              dir="ltr"
              type="url"
              placeholder={placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void run();
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={async () => {
                  try {
                    const t = await navigator.clipboard.readText();
                    if (t) setUrl(t.trim());
                  } catch {
                    setError("تعذّر اللصق من الحافظة — الصق يدوياً");
                  }
                }}
              >
                لصق
              </button>
              <button
                type="button"
                className={`${btnPrimary} bg-[#e11d48] hover:bg-[#be123c]`}
                disabled={busy || !url.trim()}
                onClick={() => void run()}
              >
                {busy ? "…" : "Start ›"}
              </button>
            </div>
          </div>
        )}
        {!isDelogo ? (
          <p className="mt-3 text-[11px] leading-5 text-[#777]">
            استخدمه للمحتوى الذي يحق لك حفظه. التحميل بدون علامة مائية من
            Tool2Day. الجودات العالية قد تكون بدون صوت (مثل يوتيوب).
          </p>
        ) : null}
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {status ? (
          <div
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              busy
                ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                : "border-[#dbeafe] bg-[#f8fbff] text-[#2563eb]"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {busy ? (
                <>
                  <Image
                    src="/icon-192.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-contain"
                    aria-hidden="true"
                  />
                  <span
                    className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-current"
                    aria-hidden="true"
                  />
                </>
              ) : null}
              {status}
            </span>
          </div>
        ) : null}
        {note ? (
          <p className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-xs text-[#555]">
            {note}
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {items.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              {videoRows.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-bold text-[#111]">
                    الفيديو / الصوت — مع صوت عند التوفر
                  </p>
                  <DownloadTable rows={videoRows} />
                </div>
              ) : null}
              {imageRows.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-bold text-[#111]">
                    صورة — أقصى جودة (maxres)
                  </p>
                  <DownloadTable rows={imageRows.slice(0, 1)} />
                </div>
              ) : null}
              {otherRows.length > 0 ? (
                <DownloadTable rows={otherRows} />
              ) : null}
            </div>

            <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-3">
              <div className="mb-3 flex items-center gap-2">
                {(() => {
                  const meta = platformMetaForKey(
                    platform !== "all" ? platform : `${url} ${pageTitle || ""}`,
                  );
                  return (
                    <>
                      {meta.icon ? (
                        <Image
                          src={meta.icon}
                          alt=""
                          width={18}
                          height={18}
                          className="h-4.5 w-4.5 rounded-sm object-contain"
                        />
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                    </>
                  );
                })()}
              </div>
              {previewThumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewThumb}
                  alt=""
                  className="aspect-video w-full rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : previewVideo ? (
                <video
                  src={previewVideo.url}
                  controls
                  preload="metadata"
                  playsInline
                  className="aspect-video w-full rounded-lg bg-[#111] object-contain"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-[#eee] text-xs text-[#888]">
                  معاينة
                </div>
              )}
              {pageTitle ? (
                <p className="mt-3 text-sm font-bold leading-6 text-[#111]">
                  {decodeHtmlEntities(pageTitle)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
