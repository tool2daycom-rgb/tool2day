"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { useToolDisplay } from "@/hooks/use-tool-display";
import {
  beginToolUse,
  getVisitorId,
  setDownloadRatingContext,
} from "@/lib/ratings";
import {
  formatBytes,
  imageHasTransparency,
  readPngDimensions,
  type PngLibraryItem,
} from "@/lib/processors/png-library";

type Props = {
  slug: string;
  arTitle: string;
  arDescription: string;
};

type Tab = "browse" | "submit";

const SOURCE_LABEL: Record<PngLibraryItem["source"], string> = {
  community: "مجتمع Tool2Day",
  pixabay: "Pixabay",
  openverse: "Openverse",
};

export function PngLibraryWorkspace({ slug, arTitle, arDescription }: Props) {
  const { messages } = useLocale();
  const { title, description } = useToolDisplay(slug, arTitle, arDescription);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("browse");
  const [q, setQ] = useState("clipart");
  const [minW, setMinW] = useState("");
  const [minH, setMinH] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PngLibraryItem[]>([]);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pixabayConfigured, setPixabayConfigured] = useState<boolean | null>(
    null,
  );

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [keywords, setKeywords] = useState(["", "", "", ""]);
  const [uploading, setUploading] = useState(false);
  const [cutting, setCutting] = useState(false);
  const [cutProgress, setCutProgress] = useState(0);
  // افتراضياً مقفول: قص AI يخرّب الشعارات والـ PNG الشفافة الجاهزة
  const [autoCut, setAutoCut] = useState(false);
  const [describing, setDescribing] = useState(false);

  const visibleItems = useMemo(
    () => items.filter((item) => !broken[item.id]),
    [items, broken],
  );

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    void search(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(nextPage = 1) {
    setBusy(true);
    setError(null);
    setStatus("جاري البحث في المكتبة…");
    try {
      const params = new URLSearchParams({
        q: q.trim() || "png",
        page: String(nextPage),
      });
      if (minW) params.set("minW", minW);
      if (minH) params.set("minH", minH);
      const res = await fetch(`/api/png-library/search?${params}`);
      const data = (await res.json().catch(() => ({}))) as {
        items?: PngLibraryItem[];
        providers?: { pixabayConfigured?: boolean };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "فشل البحث");
      setItems(Array.isArray(data.items) ? data.items : []);
      setBroken({});
      setPage(nextPage);
      setPixabayConfigured(Boolean(data.providers?.pixabayConfigured));
      setStatus(
        data.items?.length
          ? null
          : "لا نتائج — جرّب كلمة أخرى أو ارفع PNG",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل البحث");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function downloadItem(item: PngLibraryItem) {
    beginToolUse(slug);
    setError(null);
    try {
      const res = await fetch(item.downloadUrl);
      if (!res.ok) throw new Error("تعذّر تنزيل الملف");
      const blob = await res.blob();
      const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
      const safe = (item.title || "image")
        .replace(/[^\w\u0600-\u06FF\-]+/g, "-")
        .slice(0, 40);
      await downloadBlob(blob, `${safe || "image"}.png`);
      setStatus("تم التنزيل");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التنزيل");
    }
  }

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setError(null);
    if (preview) URL.revokeObjectURL(preview);

    // لا نثبت اسم ملف مثل pngegg (13) — الـ AI سيملأ العنوان
    if (
      !caption.trim() ||
      /^pngegg/i.test(caption.trim()) ||
      /^n_\d/i.test(caption.trim())
    ) {
      setCaption("");
    }

    // PNG شفاف جاهز: لا نقصّه أبداً (القص يفسد الجودة)
    const alreadyClear = await imageHasTransparency(f);
    let readyFile = f;
    if (alreadyClear) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setStatus("الصورة شفافة مسبقاً — عُرضت كما هي بدون قص");
    } else if (!autoCut) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setStatus(
        "جاهز للرفع — فعّل إزالة الخلفية فقط إن كانت الصورة بخلفية غير شفافة",
      );
    } else {
      setCutting(true);
      setCutProgress(0);
      setStatus("إزالة الخلفية — إبقاء الشعار/الكتابة فقط…");
      try {
        const { removeImageBackground } = await import(
          "@/lib/processors/ai-micro-tools"
        );
        const blob = await removeImageBackground(f, (p) => setCutProgress(p), {
          personOnly: false,
        });
        readyFile = new File(
          [blob],
          `${f.name.replace(/\.[^.]+$/, "") || "logo"}-transparent.png`,
          { type: "image/png" },
        );
        setFile(readyFile);
        setPreview(URL.createObjectURL(blob));
        setStatus("تم قص الخلفية — جاري اقتراح العنوان…");
      } catch (e) {
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setError(
          e instanceof Error
            ? `تعذّر قص الخلفية: ${e.message} — يمكنك الرفع كما هي`
            : "تعذّر قص الخلفية — يمكنك الرفع كما هي",
        );
        setStatus(null);
        setCutting(false);
        setCutProgress(0);
        void suggestMeta(f);
        return;
      } finally {
        setCutting(false);
        setCutProgress(0);
      }
    }

    void suggestMeta(readyFile);
  }

  async function suggestMeta(imageFile: File) {
    setDescribing(true);
    setError(null);
    try {
      // تصغير الصورة قبل الإرسال حتى لا يعلق الطلب
      const compact = await compactImageForDescribe(imageFile);
      const form = new FormData();
      form.append("file", compact, compact.name || "image.png");
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 45000);
      const res = await fetch("/api/png-library/describe", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const data = (await res.json().catch(() => ({}))) as {
        title?: string;
        keywords?: string[];
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(
          data.message ||
            data.error ||
            "Could not generate title — enter English title manually",
        );
        setStatus(null);
        return;
      }
      if (data.title) setCaption(data.title.slice(0, 120));
      if (Array.isArray(data.keywords) && data.keywords.length) {
        const padded = [...data.keywords.slice(0, 4)];
        while (padded.length < 4) padded.push("");
        setKeywords(padded);
      }
      setStatus("Title & keywords suggested in English — edit if needed, then Submit");
    } catch (e) {
      setError(
        e instanceof Error && e.name === "AbortError"
          ? "Title suggestion timed out — try again"
          : "Could not generate title — enter English title manually",
      );
      setStatus(null);
    } finally {
      setDescribing(false);
    }
  }

  async function compactImageForDescribe(imageFile: File): Promise<File> {
    try {
      const url = URL.createObjectURL(imageFile);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("load failed"));
        el.src = url;
      });
      URL.revokeObjectURL(url);
      const max = 768;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return imageFile;
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) return imageFile;
      return new File([blob], "describe.png", { type: "image/png" });
    } catch {
      return imageFile;
    }
  }

  async function submitPng() {
    if (!file) {
      setError("اختر ملف PNG أولاً");
      return;
    }
    if (!caption.trim()) {
      setError("أدخل عنوان الصورة");
      return;
    }
    setUploading(true);
    setError(null);
    setStatus("جاري الرفع والتخزين…");
    try {
      const dims = await readPngDimensions(file);
      const form = new FormData();
      form.append("file", file, file.name || "image.png");
      form.append("caption", caption.trim());
      form.append(
        "keywords",
        keywords.map((k) => k.trim()).filter(Boolean).join(","),
      );
      form.append("width", String(dims.width));
      form.append("height", String(dims.height));
      form.append("visitorKey", getVisitorId());

      const res = await fetch("/api/png-library/submit", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        item?: PngLibraryItem;
      };
      if (!res.ok) throw new Error(data.error || "فشل الرفع");

      setStatus("تم رفع الصورة وإضافتها للمكتبة");
      if (data.item) {
        setItems((prev) => [data.item!, ...prev]);
      }
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setCaption("");
      setKeywords(["", "", "", ""]);
      setTab("browse");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
      setStatus(null);
    } finally {
      setUploading(false);
    }
  }

  const checker = useMemo(
    () =>
      "linear-gradient(45deg,#e5e5e5 25%,transparent 25%),linear-gradient(-45deg,#e5e5e5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e5e5 75%),linear-gradient(-45deg,transparent 75%,#e5e5e5 75%)",
    [],
  );

  return (
    <section className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-[#111] sm:text-xl">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#555]">{description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("browse")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "browse"
              ? "bg-[#111] text-white"
              : "border border-[#ddd] bg-white text-[#333]"
          }`}
        >
          تصفّح المكتبة
        </button>
        <button
          type="button"
          onClick={() => setTab("submit")}
          className={`rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition ${
            tab === "submit"
              ? "bg-[#c2410c] text-white ring-2 ring-[#fdba74] ring-offset-2"
              : "bg-[#ea580c] text-white hover:bg-[#c2410c]"
          }`}
        >
          رفع PNG (Submit)
        </button>
      </div>

      {tab === "browse" ? (
        <>
          <form
            className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              void search(1);
            }}
          >
            <input
              className="rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
              placeholder="ابحث عن PNG…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <input
              className="rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
              placeholder="min width"
              inputMode="numeric"
              value={minW}
              onChange={(e) => setMinW(e.target.value.replace(/\D/g, ""))}
            />
            <input
              className="rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
              placeholder="min height"
              inputMode="numeric"
              value={minH}
              onChange={(e) => setMinH(e.target.value.replace(/\D/g, ""))}
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "…" : "بحث"}
            </button>
          </form>

          {pixabayConfigured === false && (
            <p className="mt-3 text-xs leading-6 text-[#888]">
              للمكتبة الأكبر أضف مفتاح{" "}
              <code className="rounded bg-[#f3f3f3] px-1">PIXABAY_API_KEY</code>{" "}
              المجاني من pixabay.com/api — حالياً تظهر نتائج Openverse + صور
              المجتمع.
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-[#eee] bg-white"
              >
                <div
                  className="flex aspect-square items-center justify-center p-3"
                  style={{
                    backgroundImage: checker,
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    onError={() =>
                      setBroken((prev) => ({ ...prev, [item.id]: true }))
                    }
                  />
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-2 text-xs font-semibold text-[#222]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#888]">
                    {item.width && item.height
                      ? `${item.width}×${item.height}px`
                      : "—"}
                    {item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}
                    {` · ${SOURCE_LABEL[item.source]}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => void downloadItem(item)}
                    className="mt-1 w-full rounded-lg bg-[#0d9488] px-3 py-2 text-xs font-bold text-white"
                  >
                    تنزيل PNG
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || page <= 1}
              onClick={() => void search(page - 1)}
              className="rounded-lg border border-[#ddd] px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void search(page + 1)}
              className="rounded-lg border border-[#ddd] px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              المزيد
            </button>
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-2 text-sm font-semibold text-[#333]">
            <input
              type="checkbox"
              checked={autoCut}
              onChange={(e) => setAutoCut(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>إزالة الخلفية بالذكاء الاصطناعي</span>
          </label>

          <div
            className="cursor-pointer rounded-xl border border-dashed border-[#99f6e4] bg-[#f0fdfa] px-4 py-10 text-center"
            onClick={() => !cutting && fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!cutting) void onPick(e.dataTransfer.files);
            }}
          >
            <p className="text-sm font-bold text-[#0f766e]">
              ارفع PNG شفاف جاهز (موصى به) أو صورة بخلفية لإزالتها
            </p>
            <p className="mt-1 text-xs text-[#666]">
              PNG · JPG · WEBP · حتى 10MB · الحد الأدنى 128×128px
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="hidden"
              disabled={cutting}
              onChange={(e) => void onPick(e.target.files)}
            />
          </div>

          {cutting && (
            <div>
              <p className="mb-1 text-xs font-semibold text-[#0f766e]">
                جاري قص الخلفية… {Math.round(cutProgress * 100)}%
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                <div
                  className="h-full rounded-full bg-[#0d9488] transition-all"
                  style={{ width: `${Math.round(cutProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {preview && (
            <div className="space-y-2">
              <p className="text-center text-xs font-semibold text-[#666]">
                المعاينة على خلفية شفافة (المربعات)
              </p>
              <div
                className="mx-auto flex max-h-56 max-w-xs items-center justify-center rounded-xl p-4"
                style={{
                  backgroundImage: checker,
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt=""
                  className="max-h-48 max-w-full object-contain"
                />
              </div>
            </div>
          )}

          {preview && file && (
            <button
              type="button"
              disabled={describing || cutting || uploading}
              onClick={() => void suggestMeta(file)}
              className="w-full rounded-lg border border-[#0d9488] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f766e] disabled:opacity-40"
            >
              {describing
                ? "Reading image & suggesting English title…"
                : "Generate English title & keywords from image"}
            </button>
          )}

          <label className="block text-sm font-semibold text-[#333]">
            العنوان
            <input
              className="mt-1.5 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
              placeholder={describing ? "Suggesting…" : "English title"}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={120}
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-[#333]">Keywords (English)</p>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-4">
              {keywords.map((k, i) => (
                <input
                  key={i}
                  className="rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
                  placeholder="keyword"
                  value={k}
                  onChange={(e) => {
                    const next = [...keywords];
                    next[i] = e.target.value;
                    setKeywords(next);
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={uploading || cutting || describing || !file}
            onClick={() => void submitPng()}
            className="w-full rounded-lg bg-[#0d9488] px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {uploading ? "جاري الرفع…" : "Submit — رفع للمكتبة"}
          </button>
        </div>
      )}

      {status && (
        <p className="mt-4 text-sm leading-6 text-[#0d9488]">{status}</p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
        </p>
      )}

      <p className="mt-6 text-xs text-[#999]">
        {title} — {messages.completelyFree}
      </p>
    </section>
  );
}
