"use client";

import { useEffect, useMemo, useState } from "react";
import { LogoRemoveControls, type DelogoBox } from "@/components/logo-remove-controls";
import { useToolDisplay } from "@/hooks/use-tool-display";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  extractYoutubeId,
  youtubeThumbnailUrls,
} from "@/lib/processors/social-dev-tools";

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
};

const PLATFORMS: { id: PlatformId; label: string; hint: string }[] = [
  { id: "all", label: "الكل", hint: "أي رابط عام" },
  { id: "youtube", label: "YouTube", hint: "يوتيوب / Shorts" },
  { id: "tiktok", label: "TikTok", hint: "تيك توك" },
  { id: "instagram", label: "Instagram", hint: "ريلز / بوست" },
  { id: "facebook", label: "Facebook", hint: "فيسبوك / Watch" },
  { id: "pinterest", label: "Pinterest", hint: "بينترست" },
  { id: "google", label: "Google", hint: "Drive / روابط جوجل" },
  { id: "thumbnails", label: "صور مصغّرة", hint: "يوتيوب / انستغرام" },
  { id: "delogo-video", label: "إزالة شعار فيديو", hint: "بدون علامة مائية" },
  { id: "delogo-image", label: "إزالة شعار صورة", hint: "بدون علامة مائية" },
];

const field =
  "mt-1 block w-full rounded-xl border border-[#ddd] bg-white px-4 py-3 text-sm font-semibold text-[#222]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#bbb]";
const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-bold text-[#333] transition hover:bg-[#e8e8e8]";

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
        return "رابط يوتيوب أو انستغرام للصورة المصغّرة";
      default:
        return "الصق رابط يوتيوب، تيك توك، انستغرام، فيسبوك، بينترست أو جوجل…";
    }
  }, [platform]);

  const isDelogo = platform === "delogo-video" || platform === "delogo-image";

  async function runThumbnails(raw: string) {
    const yt = extractYoutubeId(raw);
    if (yt) {
      const thumbs = youtubeThumbnailUrls(yt);
      setItems(
        thumbs.map((t) => ({
          url: t.url,
          type: "image",
          title: t.label,
          source: "youtube-thumb",
        })),
      );
      setNote("صور مصغّرة يوتيوب بجودات متعددة");
      setStatus(`وُجدت ${thumbs.length} صور مصغّرة`);
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
        title: data.title || "الصورة المصغّرة",
        source: "thumbnail-api",
      },
    ]);
    setNote(data.title || "صورة مصغّرة");
    setStatus("وُجدت صورة مصغّرة");
  }

  async function runDelogo() {
    if (!file) {
      setError(
        platform === "delogo-image"
          ? "اختر صورة أولاً"
          : "اختر فيديو أولاً",
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
        platform?: string;
        items?: MediaItem[];
      };
      if (!res.ok) throw new Error(data.error || "فشل الاستخراج");

      let next = data.items || [];
      const yt = extractYoutubeId(raw);
      if (yt && (platform === "all" || platform === "youtube")) {
        const thumbs = youtubeThumbnailUrls(yt).map((t) => ({
          url: t.url,
          type: "image",
          title: t.label,
          source: "youtube-thumb",
        }));
        const seen = new Set(next.map((p) => p.url));
        next = [...next, ...thumbs.filter((t) => !seen.has(t.url))];
      }

      setItems(next);
      setNote(
        data.note ||
          (data.title
            ? `صفحة: ${data.title}${data.platform ? ` · ${data.platform}` : ""}`
            : ""),
      );
      setStatus(
        next.length
          ? `وُجد ${next.length} وسيط/وسائط`
          : "لا نتائج عامة — جرّب تبويب الصور المصغّرة أو رابطاً عاماً",
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
      const href = `/api/media-proxy?url=${encodeURIComponent(item.url)}`;
      const res = await fetch(href);
      if (!res.ok) {
        const direct = await fetch(item.url);
        if (!direct.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error || "فشل التحميل");
        }
        const blob = await direct.blob();
        const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
        const ext = blob.type.includes("png")
          ? "png"
          : blob.type.includes("webp")
            ? "webp"
            : blob.type.includes("mp4")
              ? "mp4"
              : "jpg";
        const safe = (item.title || "tool2day-media")
          .replace(/[^\w\u0600-\u06FF-]+/g, "-")
          .slice(0, 40);
        await downloadBlob(blob, `${safe}.${ext}`);
        setStatus("تم التنزيل");
        return;
      }
      const blob = await res.blob();
      const name =
        item.url.split("/").pop()?.split("?")[0] ||
        `tool2day-media-${Date.now()}`;
      const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
      await downloadBlob(blob, name);
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

  return (
    <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-lg font-semibold text-[#111]">{title}</p>
      {description ? (
        <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              platform === p.id
                ? "bg-[#111] text-white"
                : "bg-[#f3f3f3] text-[#444] hover:bg-[#e8e8e8]"
            }`}
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isDelogo ? (
        <div className="mt-4 space-y-4">
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
          <p className="text-xs leading-6 text-[#666]">
            بدون علامة مائية من Tool2Day — ارسم مربعاً صغيراً على الشعار فقط.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-bold text-[#222]">
            الرابط
            <input
              className={field}
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
          </label>
          <div className="flex flex-wrap gap-2">
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
              className={btnPrimary}
              disabled={busy || !url.trim()}
              onClick={() => void run()}
            >
              {busy ? "جارٍ المعالجة…" : "استخراج / تحميل"}
            </button>
          </div>
          <p className="text-xs leading-6 text-[#666]">
            يدعم يوتيوب، تيك توك، انستغرام، فيسبوك، بينترست، وروابط جوجل/الملفات
            العامة، مع صور مصغّرة وإزالة الشعار — بدون علامة مائية من Tool2Day.
            استخدمه للمحتوى الذي يحق لك حفظه.
          </p>
        </div>
      )}

      {status ? (
        <p className="mt-4 text-sm font-semibold text-[#2563eb]">{status}</p>
      ) : null}
      {note ? (
        <p className="mt-2 rounded-lg bg-[#f5f5f5] px-3 py-2 text-xs text-[#555]">
          {note}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {items.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li
              key={`${item.source}-${item.url}`}
              className="flex flex-col gap-2 rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {item.thumbnail || item.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail || item.url}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111]">
                    {item.type === "video"
                      ? "فيديو"
                      : item.type === "audio"
                        ? "صوت"
                        : item.type === "image"
                          ? "صورة"
                          : "ملف"}
                    {item.title ? ` — ${item.title}` : ""}
                  </p>
                  <p
                    className="mt-0.5 truncate text-[11px] text-[#888]"
                    dir="ltr"
                  >
                    {item.url}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() =>
                    window.open(item.url, "_blank", "noopener,noreferrer")
                  }
                >
                  فتح
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={busy}
                  onClick={() => void downloadItem(item)}
                >
                  تنزيل
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
