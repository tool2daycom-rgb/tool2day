"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { useToolDisplay } from "@/hooks/use-tool-display";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  MAX_TRANSCRIBE_DURATION_SEC,
  MAX_VIDEO_TO_TEXT_MB,
  transcribeMediaFile,
} from "@/lib/processors/transcribe";
import { formatProcessError } from "@/lib/processors/ffmpeg-client";
import {
  activeCueAt,
  buildSrt,
  buildVtt,
  cuesToEditable,
  downloadVideoWithBurnedSubtitles,
  proofreadCues,
  syncCuesToDuration,
  translateCues,
  type EditableCue,
  type SubtitleLang,
} from "@/lib/processors/subtitles";

type Props = {
  slug: string;
  arTitle: string;
  arDescription: string;
};

const FONT_SIZES = [18, 22, 26, 30, 36, 44, 52];
const COLORS = [
  { id: "white", label: "أبيض", value: "#FFFFFF" },
  { id: "yellow", label: "أصفر", value: "#F5C518" },
  { id: "cyan", label: "سماوي", value: "#7DD3FC" },
  { id: "lime", label: "أخضر", value: "#86EFAC" },
  { id: "orange", label: "برتقالي", value: "#FB923C" },
  { id: "pink", label: "وردي", value: "#F9A8D4" },
];

export function VideoSubtitlesWorkspace({
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
  const [sourceLang, setSourceLang] = useState<SubtitleLang>("ar");
  const [outputLang, setOutputLang] = useState<SubtitleLang>("ar");
  const [fontSize, setFontSize] = useState(30);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [cues, setCues] = useState<EditableCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [highAccuracy, setHighAccuracy] = useState<boolean | null>(null);
  const [exportingVideo, setExportingVideo] = useState(false);

  const isVideoFile = Boolean(
    file &&
      (file.type.startsWith("video/") ||
        /\.(mp4|webm|mov|mkv|m4v)$/i.test(file.name)),
  );

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  useEffect(() => {
    fetch("/api/transcribe/capabilities")
      .then((r) => r.json())
      .then((d: { highAccuracy?: boolean }) =>
        setHighAccuracy(Boolean(d.highAccuracy)),
      )
      .catch(() => setHighAccuracy(false));
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const active = useMemo(
    () => activeCueAt(cues, currentTime),
    [cues, currentTime],
  );

  function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.size > MAX_VIDEO_TO_TEXT_MB * 1024 * 1024) {
      setError(`الحد الأقصى ${MAX_VIDEO_TO_TEXT_MB}MB (حتى 30 دقيقة)`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setCues([]);
    setProvider(null);
    setError(null);
    setStatus(null);
    setProgress(0);
  }

  async function run() {
    if (!file) {
      setError("اختر فيديو أو ملف صوت أولاً");
      return;
    }
    beginToolUse(slug);
    setBusy(true);
    setError(null);
    setProgress(0);
    setCues([]);
    setProvider(null);
    try {
      const result = await transcribeMediaFile(
        file,
        sourceLang,
        (r) => setProgress(Math.round(r * 70)),
        (msg) => setStatus(msg),
        "accurate",
      );
      let next = cuesToEditable(
        syncCuesToDuration(
          result.cues || [],
          result.durationSec || videoRef.current?.duration || 0,
        ),
      );
      if (!next.length && result.text) {
        next = cuesToEditable([
          {
            start: 0,
            end: Math.max(2, result.durationSec || 4),
            text: result.text,
          },
        ]);
      }
      if (!next.length) {
        throw new Error("لم يُستخرج كلام واضح لإنشاء الترجمة");
      }

      setStatus(
        outputLang === "ar" || sourceLang === "ar"
          ? "تصحيح الإملاء والأسماء…"
          : "Proofreading spelling…",
      );
      next = await proofreadCues(
        next,
        outputLang !== sourceLang ? sourceLang : outputLang,
        (r) => setProgress(70 + Math.round(r * 10)),
      );

      if (outputLang !== sourceLang) {
        setStatus(
          outputLang === "ar"
            ? "ترجمة المقاطع إلى العربية…"
            : "Translating cues to English…",
        );
        next = await translateCues(next, sourceLang, outputLang, (r) =>
          setProgress(80 + Math.round(r * 15)),
        );
        // تصحيح بعد الترجمة للعربية
        if (outputLang === "ar") {
          setStatus("مراجعة الإملاء بعد الترجمة…");
          next = await proofreadCues(next, "ar", (r) =>
            setProgress(95 + Math.round(r * 5)),
          );
        }
      } else {
        setProgress(100);
      }

      setCues(next);
      setProvider(result.provider);
      const dur =
        result.durationSec != null
          ? ` · ${(result.durationSec / 60).toFixed(1)} دقيقة`
          : "";
      setStatus(
        `اكتملت الترجمة الفرعية (${next.length} مقطعاً)${dur} — راجع النص وعدّل إن لزم ثم نزّل`,
      );
      setProgress(100);
    } catch (e) {
      setError(formatProcessError(e));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  function updateCue(id: string, patch: Partial<EditableCue>) {
    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  }

  async function download(format: "srt" | "vtt") {
    if (!cues.length) return;
    const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
    const base = file?.name?.replace(/\.[^.]+$/, "") || "subtitles";
    const lang = outputLang;
    if (format === "srt") {
      await downloadBlob(
        new Blob([buildSrt(cues)], { type: "application/x-subrip;charset=utf-8" }),
        `${base}.${lang}.srt`,
      );
    } else {
      await downloadBlob(
        new Blob(
          [buildVtt(cues, { color: fontColor, fontSizePx: fontSize })],
          { type: "text/vtt;charset=utf-8" },
        ),
        `${base}.${lang}.vtt`,
      );
    }
    setStatus(format === "srt" ? "تم تنزيل ملف SRT" : "تم تنزيل ملف VTT");
  }

  async function downloadBurnedVideo() {
    if (!file || !cues.length) return;
    setExportingVideo(true);
    setError(null);
    try {
      await downloadVideoWithBurnedSubtitles(
        file,
        cues,
        {
          color: fontColor,
          fontSizePx: fontSize,
          rtl: outputLang === "ar",
        },
        (r) => setProgress(Math.round(r * 100)),
        (msg) => setStatus(msg),
      );
      setStatus("تم تنزيل الفيديو مع الترجمة — شكراً لتقييمك");
      setProgress(100);
    } catch (e) {
      setError(formatProcessError(e));
    } finally {
      setExportingVideo(false);
    }
  }

  const isRtl = outputLang === "ar";

  return (
    <section className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-[#111] sm:text-xl">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#555]">{description}</p>
      <p className="mt-2 text-xs leading-6 text-[#777]">
        للدقة القصوى في الإملاء والمزامنة يُستخدم Whisper Large عبر Groq ثم تصحيح
        إملائي. بدون مفتاح سحابي يعمل التفريغ محلياً بدقة أقل. راجع المقاطع دائماً
        قبل التنزيل. الحد الأقصى {MAX_TRANSCRIBE_DURATION_SEC / 60} دقيقة.
      </p>

      {highAccuracy === false && (
        <div className="mt-3 rounded-xl border border-[#f0d78c] bg-[#fff8e8] px-4 py-3 text-sm leading-7 text-[#6b4e00]">
          <p className="font-bold">لتفعيل الدقة العالية (موصى به جداً)</p>
          <p className="mt-1">
            أنشئ مفتاحاً مجانياً من{" "}
            <a
              className="font-semibold underline"
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
            >
              Groq Console
            </a>{" "}
            ثم أضفه في Vercel باسم <code className="rounded bg-white px-1">GROQ_API_KEY</code>{" "}
            وأعد النشر. يستخدم النموذج{" "}
            <strong>whisper-large-v3</strong> وهو أفضل بكثير للعربية من النموذج
            المحلي.
          </p>
        </div>
      )}
      {highAccuracy === true && (
        <div className="mt-3 rounded-xl border border-[#b7e4c7] bg-[#f0fdf4] px-4 py-2 text-sm text-[#166534]">
          محرك سحابي عالي الدقة مفعّل (Whisper Large + تصحيح).
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[#333]">
          لغة الصوت في الفيديو
          <select
            className="mt-1.5 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
            value={sourceLang}
            disabled={busy}
            onChange={(e) => setSourceLang(e.target.value as SubtitleLang)}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-[#333]">
          لغة ملف الترجمة
          <select
            className="mt-1.5 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
            value={outputLang}
            disabled={busy}
            onChange={(e) => setOutputLang(e.target.value as SubtitleLang)}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <div
        className="mt-5 cursor-pointer rounded-xl border border-dashed border-[#c5d0e0] bg-[#f7f9fc] px-4 py-8 text-center transition hover:border-[#2563eb]/40"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-semibold text-[#222]">
          اسحب الفيديو هنا أو اختر من جهازك
        </p>
        <p className="mt-1 text-xs text-[#777]">
          MP4 · WebM · MOV · MP3 · WAV — حتى {MAX_VIDEO_TO_TEXT_MB}MB
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white"
        >
          اختيار ملف
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {file && (
        <p className="mt-3 text-sm text-[#444]">
          الملف: <span className="font-semibold">{file.name}</span>
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !file}
          onClick={() => void run()}
          className="rounded-lg bg-[#111] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "جاري التوليد…" : "توليد الترجمة الفرعية"}
        </button>
        {busy && (
          <div className="min-w-[140px] flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-[#eee]">
              <div
                className="h-full rounded-full bg-[#2563eb] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {status && (
        <p className="mt-3 text-sm leading-6 text-[#2563eb]">{status}</p>
      )}
      {provider && (
        <p className="mt-1 text-xs text-[#888]">المحرك: {provider}</p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
        </p>
      )}

      {previewUrl && (
        <div className="relative mt-6 overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            className="max-h-[420px] w-full"
            onTimeUpdate={(e) =>
              setCurrentTime((e.target as HTMLVideoElement).currentTime)
            }
          />
          {active && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-4"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <span
                className="max-w-[92%] rounded-md px-3 py-1.5 text-center font-semibold leading-snug shadow-lg"
                style={{
                  color: fontColor,
                  fontSize: `${fontSize}px`,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {active.text}
              </span>
            </div>
          )}
        </div>
      )}

      {cues.length > 0 && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#333]">
              حجم الخط
              <select
                className="mt-1.5 w-full rounded-lg border border-[#ddd] bg-[#fafafa] px-3 py-2.5 text-sm"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              >
                {FONT_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}px
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="block text-sm font-semibold text-[#333]">
              <legend className="mb-1.5">لون الخط</legend>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => setFontColor(c.value)}
                    className={`h-9 w-9 rounded-full border-2 ${
                      fontColor === c.value
                        ? "border-[#111] ring-2 ring-[#111]/20"
                        : "border-[#ddd]"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-[#ddd] bg-white p-0.5"
                  title="لون مخصص"
                />
              </div>
            </fieldset>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-bold text-[#111]">
              المقاطع ({cues.length}) — عدّل النص للوصول لأقصى دقة
            </h3>
            {cues.map((c, i) => (
              <div
                key={c.id}
                className="rounded-xl border border-[#eee] bg-[#fafafa] p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#666]">
                  <span className="font-semibold text-[#333]">#{i + 1}</span>
                  <label className="flex items-center gap-1">
                    من
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      className="w-20 rounded border border-[#ddd] bg-white px-1.5 py-1"
                      value={Number(c.start.toFixed(1))}
                      onChange={(e) =>
                        updateCue(c.id, { start: Number(e.target.value) || 0 })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    إلى
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      className="w-20 rounded border border-[#ddd] bg-white px-1.5 py-1"
                      value={Number(c.end.toFixed(1))}
                      onChange={(e) =>
                        updateCue(c.id, { end: Number(e.target.value) || 0 })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="ms-auto text-[#2563eb] underline"
                    onClick={() => {
                      const v = videoRef.current;
                      if (v) v.currentTime = c.start;
                    }}
                  >
                    انتقال
                  </button>
                </div>
                <textarea
                  dir={isRtl ? "rtl" : "ltr"}
                  className="min-h-[64px] w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm leading-6"
                  value={c.text}
                  onChange={(e) => updateCue(c.id, { text: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-5">
            <h3 className="text-base font-bold text-[#111]">التنزيلات</h3>
            <p className="mt-1 text-xs leading-6 text-[#666]">
              بعد التقييم يُفتح التنزيل تلقائياً. يُفضّل مراجعة المقاطع ثم تنزيل
              الفيديو مع الترجمة المدمجة.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {isVideoFile && (
                <button
                  type="button"
                  disabled={exportingVideo || busy}
                  onClick={() => void downloadBurnedVideo()}
                  className="rounded-lg bg-[#111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {exportingVideo
                    ? "جاري دمج الترجمة في الفيديو…"
                    : "تنزيل الفيديو مع الترجمة"}
                </button>
              )}
              <button
                type="button"
                disabled={exportingVideo || busy}
                onClick={() => void download("srt")}
                className="rounded-lg border border-[#ddd] bg-white px-4 py-3 text-sm font-semibold text-[#222] hover:border-[#bbb] disabled:opacity-40"
              >
                تنزيل SRT
              </button>
              <button
                type="button"
                disabled={exportingVideo || busy}
                onClick={() => void download("vtt")}
                className="rounded-lg border border-[#ddd] bg-white px-4 py-3 text-sm font-semibold text-[#222] hover:border-[#bbb] disabled:opacity-40"
              >
                تنزيل VTT (مع اللون والحجم)
              </button>
            </div>
            {exportingVideo && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                  <div
                    className="h-full rounded-full bg-[#2563eb] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-[#999]">
        {title} — {messages.completelyFree} · معالجة في المتصفح
      </p>
    </section>
  );
}
