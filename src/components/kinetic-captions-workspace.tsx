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
  buildWordsJson,
  downloadKineticBurnedVideo,
  ensureKineticFont,
  groupWordsIntoLines,
  kineticPreviewPositionClass,
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
  if (effect === "fade") return "opacity-100";
  return "";
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
  const [fontSize, setFontSize] = useState(36);
  const [fontFamily, setFontFamily] = useState(KINETIC_FONTS[1]!.stack);
  const [position, setPosition] = useState<KineticPosition>("bottom");
  const [effect, setEffect] = useState<KineticEffect>("pulse");
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

  const rtl = language === "ar" || language === "fa" || language === "he";

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

  async function downloadJson() {
    if (!words.length) return;
    beginToolUse(slug);
    const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
    await downloadBlob(
      new Blob([buildWordsJson(words)], { type: "application/json" }),
      "kinetic-words.json",
    );
  }

  async function burn() {
    if (!file || !lines.length) return;
    if (
      !file.type.startsWith("video/") &&
      !/\.(mp4|webm|mov|mkv|m4v)$/i.test(file.name)
    ) {
      setError("الحرق يحتاج ملف فيديو");
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
          rtl,
          position,
          effect,
          fontFamily,
        },
        (r) => setProgress(Math.round(r * 100)),
        (msg) => setStatus(msg),
      );
      setStatus("تم تنزيل الفيديو مع الترجمة الحركية");
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
          50% { transform: scale(1.18); }
        }
        @keyframes kinetic-pop {
          0% { transform: scale(0.7); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes kinetic-bounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          70% { transform: translateY(-3px); }
        }
        .animate-kinetic-pulse { display: inline-block; animation: kinetic-pulse 0.55s ease-in-out infinite; }
        .animate-kinetic-pop { display: inline-block; animation: kinetic-pop 0.28s ease-out; }
        .animate-kinetic-bounce { display: inline-block; animation: kinetic-bounce 0.45s ease; }
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
            style={{ fontFamily }}
          >
            {KINETIC_FONTS.map((f) => (
              <option key={f.id} value={f.stack} style={{ fontFamily: f.stack }}>
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
            {[28, 32, 36, 44, 52, 60].map((n) => (
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
        <div className="relative mt-5 overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            className="mx-auto max-h-[70vh] w-full"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d)) setDuration(d);
            }}
          />
          {active && (
            <div
              className={`pointer-events-none absolute inset-x-0 flex justify-center px-4 ${kineticPreviewPositionClass(position)}`}
              dir={rtl ? "rtl" : "ltr"}
            >
              <p
                className="max-w-[92%] text-center font-extrabold leading-snug"
                style={{
                  fontFamily,
                  fontSize: `clamp(1.1rem, ${fontSize * 0.045}vw, ${fontSize}px)`,
                  WebkitTextStroke: "2px #000",
                  paintOrder: "stroke fill",
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
                        marginInline: "0.18em",
                      }}
                    >
                      {w.word}
                    </span>
                  );
                })}
              </p>
            </div>
          )}
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
            {exporting ? "جاري الحرق…" : "تنزيل فيديو مع الترجمة الحركية"}
          </button>
          <button
            type="button"
            onClick={() => void downloadJson()}
            className="rounded-lg border border-[#ddd] bg-white px-4 py-2.5 text-sm font-semibold"
          >
            تنزيل JSON (توقيت الكلمات)
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
