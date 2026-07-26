"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { useToolDisplay } from "@/hooks/use-tool-display";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  MAX_VIDEO_TO_TEXT_MB,
  transcribeForKineticCaptions,
  type TranscriptWord,
} from "@/lib/processors/transcribe";
import { formatProcessError } from "@/lib/processors/ffmpeg-client";
import {
  KINETIC_EFFECTS,
  KINETIC_FONTS,
  KINETIC_MAX_DURATION_SEC,
  KINETIC_MIN_DURATION_SEC,
  KINETIC_POSITIONS,
  activeKineticAt,
  buildWordsText,
  downloadKineticBurnedVideo,
  ensureKineticFont,
  groupWordsIntoLines,
  kineticPreviewFontPx,
  kineticPreviewPositionClass,
  resolveKineticFontStack,
  type KineticEffect,
  type KineticLine,
  type KineticPosition,
} from "@/lib/processors/kinetic-captions";

type Props = {
  slug: string;
  arTitle: string;
  arDescription: string;
};

const COLORS = [
  { id: "white", label: "أبيض", value: "#FFFFFF" },
  { id: "yellow", label: "أصفر", value: "#F5C518" },
  { id: "cyan", label: "سماوي", value: "#22D3EE" },
  { id: "lime", label: "ليموني", value: "#A3E635" },
  { id: "orange", label: "برتقالي", value: "#FB923C" },
  { id: "pink", label: "وردي", value: "#F472B6" },
  { id: "red", label: "أحمر", value: "#F87171" },
  { id: "black", label: "أسود", value: "#111111" },
];

function effectClass(effect: KineticEffect, active: boolean): string {
  if (!active) {
    return effect === "fade" ? "opacity-40" : "";
  }
  if (effect === "pulse") return "animate-kinetic-pulse";
  if (effect === "pop") return "animate-kinetic-pop";
  if (effect === "bounce") return "animate-kinetic-bounce";
  if (effect === "slide") return "animate-kinetic-slide";
  if (effect === "zoom") return "animate-kinetic-zoom";
  if (effect === "fade") return "opacity-100";
  return "";
}

function visibleWordText(
  word: string,
  effect: KineticEffect,
  active: boolean,
  progress: number,
): string {
  if (!active || effect !== "typewriter") return word;
  const chars = Array.from(word);
  const n = Math.max(1, Math.ceil(progress * chars.length));
  return chars.slice(0, n).join("") || "\u00A0";
}

export function KineticCaptionsWorkspace({
  slug,
  arTitle,
  arDescription,
}: Props) {
  const { messages } = useLocale();
  const { title, description } = useToolDisplay(slug, arTitle, arDescription);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("ar");
  const [baseColor, setBaseColor] = useState("#FFFFFF");
  const [highlight, setHighlight] = useState("#F5C518");
  const [fontSize, setFontSize] = useState(44);
  const [fontFamily, setFontFamily] = useState(KINETIC_FONTS[0]!.stack);
  const [position, setPosition] = useState<KineticPosition>("bottom");
  const [effect, setEffect] = useState<KineticEffect>("none");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [words, setWords] = useState<TranscriptWord[]>([]);
  const [lines, setLines] = useState<KineticLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewClientW, setPreviewClientW] = useState(0);

  const rtl = language === "ar" || language === "fa" || language === "he";
  const resolvedFont = resolveKineticFontStack(fontFamily);
  const previewFontPx = kineticPreviewFontPx(fontSize);

  const active = useMemo(
    () => activeKineticAt(lines, currentTime),
    [lines, currentTime],
  );

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    void ensureKineticFont(fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !previewUrl) return;
    const sync = () => setPreviewClientW(v.clientWidth || 0);
    sync();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(sync)
        : null;
    ro?.observe(v);
    window.addEventListener("resize", sync);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [previewUrl]);

  function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.size > MAX_VIDEO_TO_TEXT_MB * 1024 * 1024) {
      setError(`الحد الأقصى ${MAX_VIDEO_TO_TEXT_MB}MB`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setWords([]);
    setLines([]);
    setProvider(null);
    setError(null);
    setStatus(null);
    setDuration(0);
    setPreviewClientW(0);
  }

  async function run() {
    if (!file) {
      setError("ارفع فيديو أولاً");
      return;
    }
    const el = videoRef.current;
    const dur = el?.duration && Number.isFinite(el.duration) ? el.duration : 0;
    if (dur > 0 && dur < KINETIC_MIN_DURATION_SEC) {
      setError(
        `المدة قصيرة جداً — الحد الأدنى ${KINETIC_MIN_DURATION_SEC} ثوانٍ.`,
      );
      return;
    }
    if (dur > KINETIC_MAX_DURATION_SEC) {
      setError(
        `الحد الأقصى ${KINETIC_MAX_DURATION_SEC / 60} دقائق — قصّ الفيديو أولاً`,
      );
      return;
    }

    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setProgress(0);
    setStatus("بدء التفريغ مع توقيت كلمة بكلمة…");
    try {
      const result = await transcribeForKineticCaptions(
        file,
        language,
        (r) => setProgress(Math.round(r * 100)),
        (msg) => setStatus(msg),
      );
      if (result.durationSec < KINETIC_MIN_DURATION_SEC) {
        throw new Error(
          `المدة ${Math.round(result.durationSec)} ثانية — الحد الأدنى ${KINETIC_MIN_DURATION_SEC} ثوانٍ`,
        );
      }
      if (result.durationSec > KINETIC_MAX_DURATION_SEC) {
        throw new Error(
          `المدة ${Math.round(result.durationSec)} ثانية — الحد الأقصى ${KINETIC_MAX_DURATION_SEC / 60} دقائق`,
        );
      }
      const grouped = groupWordsIntoLines(result.words);
      setWords(result.words);
      setLines(grouped);
      setProvider(result.provider);
      setDuration(result.durationSec);
      setStatus(
        `جاهز: ${result.words.length} كلمة · ${grouped.length} سطر حركي`,
      );
    } catch (e) {
      setError(formatProcessError(e));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  function updateWord(index: number, nextText: string) {
    const next = words.map((w, i) =>
      i === index ? { ...w, word: nextText } : w,
    );
    setWords(next);
    setLines(groupWordsIntoLines(next.filter((w) => w.word.trim())));
  }

  function removeWord(index: number) {
    const next = words.filter((_, i) => i !== index);
    setWords(next);
    setLines(groupWordsIntoLines(next));
  }

  async function downloadText() {
    if (!words.length) return;
    beginToolUse(slug);
    const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
    await downloadBlob(
      new Blob([buildWordsText(words)], {
        type: "text/plain;charset=utf-8",
      }),
      "kinetic-words.txt",
    );
  }

  async function burn() {
    if (!file || !lines.length) return;
    if (
      !file.type.startsWith("video/") &&
      !/\.(mp4|webm|mov|mkv|m4v)$/i.test(file.name)
    ) {
      setError("التنزيل يحتاج ملف فيديو");
      return;
    }
    beginToolUse(slug);
    setExporting(true);
    setError(null);
    try {
      await ensureKineticFont(fontFamily);
      await downloadKineticBurnedVideo(
        file,
        lines,
        {
          baseColor,
          highlightColor: highlight,
          fontSizePx: fontSize,
          previewClientW:
            previewClientW || videoRef.current?.clientWidth || 0,
          rtl,
          position,
          effect,
          fontFamily,
        },
        (r) => setProgress(Math.round(r * 100)),
        (msg) => setStatus(msg),
      );
      setStatus("تم تنزيل الفيديو");
    } catch (e) {
      setError(formatProcessError(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-7">
      <style>{`
        @keyframes kinetic-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.14); }
        }
        @keyframes kinetic-pop {
          0% { transform: scale(0.75); opacity: 0.5; }
          100% { transform: scale(1.18); opacity: 1; }
        }
        @keyframes kinetic-bounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes kinetic-slide {
          0% { transform: translateX(1.2em); opacity: 0.2; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes kinetic-zoom {
          0% { transform: scale(0.7); }
          100% { transform: scale(1.2); }
        }
        .animate-kinetic-pulse { display: inline-block; animation: kinetic-pulse 0.55s ease-in-out infinite; }
        .animate-kinetic-pop { display: inline-block; animation: kinetic-pop 0.28s ease-out; }
        .animate-kinetic-bounce { display: inline-block; animation: kinetic-bounce 0.45s ease; }
        .animate-kinetic-slide { display: inline-block; animation: kinetic-slide 0.35s ease-out; }
        .animate-kinetic-zoom { display: inline-block; animation: kinetic-zoom 0.35s ease-out; }
        [dir="rtl"] .animate-kinetic-slide {
          animation-name: kinetic-slide-rtl;
        }
        @keyframes kinetic-slide-rtl {
          0% { transform: translateX(-1.2em); opacity: 0.2; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <h2 className="text-lg font-bold text-[#111] sm:text-xl">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#555]">{description}</p>
      <p className="mt-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs leading-6 text-[#92400e]">
        المدة المدعومة: من {KINETIC_MIN_DURATION_SEC} ثوانٍ حتى{" "}
        {KINETIC_MAX_DURATION_SEC / 60} دقائق — ترجمة حركية ملونة كلمة بكلمة
        بأسلوب ريلز وتيك توك.
      </p>

      <div
        className="mt-5 cursor-pointer rounded-xl border border-dashed border-[#fdba74] bg-[#fff7ed] px-4 py-10 text-center"
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) onPick(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-bold text-[#c2410c]">
          اسحب فيديو أو اضغط للاختيار
        </p>
        <p className="mt-1 text-xs text-[#777]">
          MP4 · MOV · WEBM · حتى {MAX_VIDEO_TO_TEXT_MB}MB · من{" "}
          {KINETIC_MIN_DURATION_SEC} ثوانٍ حتى {KINETIC_MAX_DURATION_SEC / 60}{" "}
          دقائق
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {file && (
        <p className="mt-3 text-xs text-[#666]">
          {file.name}
          {duration > 0 ? ` · ${Math.round(duration)} ث` : ""}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-semibold text-[#444]">
          لغة الصوت
          <select
            className="mt-1 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={busy}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="auto">تلقائي</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#444]">
          مكان الكلام
          <select
            className="mt-1 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2 text-sm"
            value={position}
            onChange={(e) => setPosition(e.target.value as KineticPosition)}
            disabled={busy}
          >
            {KINETIC_POSITIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#444]">
          طريقة العرض
          <select
            className="mt-1 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2 text-sm"
            value={effect}
            onChange={(e) => setEffect(e.target.value as KineticEffect)}
            disabled={busy}
          >
            {KINETIC_EFFECTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#444]">
          نوع الخط
          <select
            className="mt-1 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2 text-sm"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            disabled={busy}
            style={{ fontFamily: resolvedFont, fontWeight: 800 }}
          >
            {KINETIC_FONTS.map((f) => (
              <option key={f.id} value={f.stack}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#444]">
          لون الخط
          <select
            className="mt-1 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2 text-sm"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            disabled={busy}
          >
            {COLORS.map((c) => (
              <option key={c.id} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#444]">
          لون الكلمة النشطة
          <select
            className="mt-1 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2 text-sm"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            disabled={busy}
          >
            {COLORS.filter((c) => c.id !== "black").map((c) => (
              <option key={c.id} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#444]">
          حجم الخط
          <select
            className="mt-1 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2 text-sm"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            disabled={busy}
          >
            {[28, 32, 36, 44, 52, 60, 72, 84].map((n) => (
              <option key={n} value={n}>
                {n}px
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        disabled={busy || !file}
        onClick={() => void run()}
        className="mt-4 w-full rounded-lg bg-[#ea580c] px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
      >
        {busy ? "جاري التوليد…" : "توليد ترجمة حركية كلمة بكلمة"}
      </button>

      {(busy || exporting) && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
            <div
              className="h-full rounded-full bg-[#ea580c] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="mt-5 flex justify-center">
          <div className="relative inline-block max-h-[75vh] max-w-full">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              playsInline
              className="block max-h-[75vh] w-auto max-w-full rounded-xl bg-black object-contain"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                const d = v.duration;
                if (Number.isFinite(d)) setDuration(d);
                if (v.videoWidth) setVideoNaturalW(v.videoWidth);
                setPreviewClientW(v.clientWidth || 0);
              }}
            />
            {active && (
              <div
                className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center px-[8%] ${kineticPreviewPositionClass(position)}`}
                dir={rtl ? "rtl" : "ltr"}
              >
                <p
                  className="max-w-full overflow-hidden text-center font-extrabold leading-snug"
                  style={{
                    fontFamily: resolvedFont,
                    fontWeight: 900,
                    fontSize: `${previewFontPx}px`,
                    textShadow:
                      "0 0 2px #000, 1px 0 #000, -1px 0 #000, 0 1px #000, 0 -1px #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000",
                    wordBreak: "normal",
                  }}
                >
                  {active.line.words.map((w, i) => {
                    const isActive = i === active.activeIndex;
                    return (
                      <span
                        key={`${w.start}-${i}`}
                        className={effectClass(effect, isActive)}
                        style={{
                          color: isActive ? highlight : baseColor,
                          marginInline: "0.4em",
                          paddingInline: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {visibleWordText(
                          w.word,
                          effect,
                          isActive,
                          active.progress,
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {words.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#eee] bg-[#fafafa] p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#111]">تعديل الكلمات</h3>
              <p className="mt-0.5 text-xs text-[#777]">
                صحّح الأخطاء هنا — التعديل يظهر فوراً في المعاينة والتنزيل
              </p>
            </div>
            <p className="text-[11px] text-[#888]">{words.length} كلمة</p>
          </div>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {words.map((w, i) => (
              <div key={`${w.start}-${i}`} className="flex gap-1">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-[#ddd] bg-white px-2 py-1.5 text-sm"
                  value={w.word}
                  dir={rtl ? "rtl" : "ltr"}
                  onChange={(e) => updateWord(i, e.target.value)}
                  onFocus={() => {
                    const el = videoRef.current;
                    if (el) el.currentTime = Math.max(0, w.start);
                  }}
                  aria-label={`كلمة ${i + 1}`}
                />
                <button
                  type="button"
                  className="rounded-lg px-2 text-xs text-[#b91c1c]"
                  title="حذف"
                  onClick={() => removeWord(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {lines.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={() => void burn()}
            className="rounded-lg bg-[#111] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            {exporting ? "جاري تنزيل…" : "تنزيل فيديو مع الترجمة الحركية"}
          </button>
          <button
            type="button"
            onClick={() => void downloadText()}
            className="rounded-lg border border-[#ddd] bg-white px-4 py-2.5 text-sm font-semibold"
          >
            تنزيل نص الكلمات (.txt)
          </button>
        </div>
      )}

      {provider && (
        <p className="mt-3 text-[11px] text-[#888]">المحرك: {provider}</p>
      )}
      {status && (
        <p className="mt-3 text-sm leading-6 text-[#c2410c]">{status}</p>
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
