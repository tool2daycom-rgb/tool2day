"use client";

import { useMemo, useRef, useState } from "react";
import {
  getToolKind,
  MAX_CLIENT_FILE_MB,
  type ActiveToolKind,
} from "@/lib/processors/active-tools";

type Props = {
  slug: string;
  title: string;
  description: string;
  accept: string;
};

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ToolWorkspace({ slug, title, description, accept }: Props) {
  const kind = useMemo(() => getToolKind(slug), [slug]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoFormat, setVideoFormat] = useState<"mp4" | "webm" | "mov">("mp4");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav" | "aac" | "ogg">(
    "mp3",
  );
  const [startSec, setStartSec] = useState("0");
  const [endSec, setEndSec] = useState("10");
  const [splitMode, setSplitMode] = useState<"all" | "range">("all");
  const [pageFrom, setPageFrom] = useState("1");
  const [pageTo, setPageTo] = useState("1");

  const multiple = kind === "pdf-merge";

  function setFromList(list: FileList | null) {
    if (!list?.length) return;
    const next = multiple ? Array.from(list) : [list[0]];
    const tooBig = next.find((f) => f.size > MAX_CLIENT_FILE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`الملف كبير جداً للمتصفح (الحد ${MAX_CLIENT_FILE_MB}MB): ${tooBig.name}`);
      return;
    }
    setError(null);
    setStatus(null);
    setFiles(next);
  }

  async function run() {
    if (!files.length) {
      setError("اختر ملفاً أولاً");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(0);
    setStatus("جاري التحضير…");

    try {
      if (kind === "video-convert") {
        setStatus("تحميل محرك الفيديو… قد يستغرق أول مرة دقيقة");
        const { convertVideo } = await import("@/lib/processors/media");
        await convertVideo(files[0], videoFormat, (p) => {
          setProgress(Math.round(p * 100));
          setStatus("جارٍ التحويل…");
        });
      } else if (kind === "video-trim") {
        setStatus("تحميل محرك الفيديو…");
        const { trimMedia } = await import("@/lib/processors/media");
        await trimMedia(
          files[0],
          Number(startSec),
          Number(endSec),
          "video",
          (p) => {
            setProgress(Math.round(p * 100));
            setStatus("جارٍ القص…");
          },
        );
      } else if (kind === "audio-convert") {
        setStatus("تحميل محرك الصوت…");
        const { convertAudio } = await import("@/lib/processors/media");
        await convertAudio(files[0], audioFormat, (p) => {
          setProgress(Math.round(p * 100));
          setStatus("جارٍ التحويل…");
        });
      } else if (kind === "audio-trim") {
        setStatus("تحميل محرك الصوت…");
        const { trimMedia } = await import("@/lib/processors/media");
        await trimMedia(
          files[0],
          Number(startSec),
          Number(endSec),
          "audio",
          (p) => {
            setProgress(Math.round(p * 100));
            setStatus("جارٍ القص…");
          },
        );
      } else if (kind === "pdf-merge") {
        setStatus("جارٍ دمج PDF…");
        const { mergePdfs } = await import("@/lib/processors/pdf");
        await mergePdfs(files);
        setProgress(100);
      } else if (kind === "pdf-split") {
        setStatus("جارٍ تقسيم PDF…");
        const { splitPdf } = await import("@/lib/processors/pdf");
        await splitPdf(
          files[0],
          splitMode,
          Number(pageFrom),
          Number(pageTo),
        );
        setProgress(100);
      } else {
        setError("هذه الأداة قيد التفعيل قريباً");
        return;
      }

      setStatus("تم! بدأ تنزيل النتيجة");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشلت المعالجة");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  if (kind === "coming-soon") {
    return (
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 sm:p-8">
        <p className="text-base font-semibold text-[#111]">{title}</p>
        <p className="mt-2 text-sm leading-7 text-[#666]">{description}</p>
        <p className="mt-4 rounded-lg bg-[#fafafa] px-4 py-3 text-sm text-[#555]">
          هذه الأداة ضمن الخطة القادمة. الأدوات الشغّالة الآن: محوّل/قص الفيديو،
          محوّل/قص الصوت، دمج/تقسيم PDF.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 sm:p-8">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          setFromList(e.dataTransfer.files);
        }}
        className={`flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center transition ${
          dragging
            ? "border-[#2563eb] bg-[#eff6ff]"
            : "border-[#d4d4d4] bg-[#fafafa]"
        }`}
      >
        <p className="text-base font-semibold text-[#111]">
          {multiple ? "اسحب ملفات PDF هنا" : "اسحب الملف هنا أو اختر من جهازك"}
        </p>
        <p className="mt-2 max-w-sm text-sm leading-7 text-[#666]">
          {description}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {multiple ? "اختيار ملفات" : "اختيار ملف"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => setFromList(e.target.files)}
        />
      </div>

      {files.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-4 py-2 text-sm text-[#222]"
            >
              {file.name}
              <span className="ms-2 text-[#888]">({formatBytes(file.size)})</span>
            </li>
          ))}
        </ul>
      ) : null}

      <ToolOptions
        kind={kind}
        videoFormat={videoFormat}
        setVideoFormat={setVideoFormat}
        audioFormat={audioFormat}
        setAudioFormat={setAudioFormat}
        startSec={startSec}
        setStartSec={setStartSec}
        endSec={endSec}
        setEndSec={setEndSec}
        splitMode={splitMode}
        setSplitMode={setSplitMode}
        pageFrom={pageFrom}
        setPageFrom={setPageFrom}
        pageTo={pageTo}
        setPageTo={setPageTo}
      />

      {busy || status ? (
        <div className="mt-4">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#eee]">
            <div
              className="h-full rounded-full bg-[#2563eb] transition-all"
              style={{ width: `${Math.min(100, Math.max(progress, busy ? 8 : 0))}%` }}
            />
          </div>
          {status ? <p className="text-sm text-[#555]">{status}</p> : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || files.length === 0}
        onClick={run}
        className="mt-5 rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
      >
        {busy ? "جارٍ العمل…" : "ابدأ المعالجة"}
      </button>
    </div>
  );
}

function ToolOptions({
  kind,
  videoFormat,
  setVideoFormat,
  audioFormat,
  setAudioFormat,
  startSec,
  setStartSec,
  endSec,
  setEndSec,
  splitMode,
  setSplitMode,
  pageFrom,
  setPageFrom,
  pageTo,
  setPageTo,
}: {
  kind: ActiveToolKind;
  videoFormat: "mp4" | "webm" | "mov";
  setVideoFormat: (v: "mp4" | "webm" | "mov") => void;
  audioFormat: "mp3" | "wav" | "aac" | "ogg";
  setAudioFormat: (v: "mp3" | "wav" | "aac" | "ogg") => void;
  startSec: string;
  setStartSec: (v: string) => void;
  endSec: string;
  setEndSec: (v: string) => void;
  splitMode: "all" | "range";
  setSplitMode: (v: "all" | "range") => void;
  pageFrom: string;
  setPageFrom: (v: string) => void;
  pageTo: string;
  setPageTo: (v: string) => void;
}) {
  if (kind === "video-convert") {
    return (
      <label className="mt-5 block text-sm text-[#333]">
        صيغة الإخراج
        <select
          value={videoFormat}
          onChange={(e) =>
            setVideoFormat(e.target.value as "mp4" | "webm" | "mov")
          }
          className="mt-2 block w-full rounded-md border border-[#ddd] bg-white px-3 py-2"
        >
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
          <option value="mov">MOV</option>
        </select>
      </label>
    );
  }

  if (kind === "audio-convert") {
    return (
      <label className="mt-5 block text-sm text-[#333]">
        صيغة الإخراج
        <select
          value={audioFormat}
          onChange={(e) =>
            setAudioFormat(e.target.value as "mp3" | "wav" | "aac" | "ogg")
          }
          className="mt-2 block w-full rounded-md border border-[#ddd] bg-white px-3 py-2"
        >
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="aac">AAC</option>
          <option value="ogg">OGG</option>
        </select>
      </label>
    );
  }

  if (kind === "video-trim" || kind === "audio-trim") {
    return (
      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="text-sm text-[#333]">
          البداية (ثانية)
          <input
            type="number"
            min={0}
            step={0.1}
            value={startSec}
            onChange={(e) => setStartSec(e.target.value)}
            className="mt-2 block w-full rounded-md border border-[#ddd] px-3 py-2"
          />
        </label>
        <label className="text-sm text-[#333]">
          النهاية (ثانية)
          <input
            type="number"
            min={0}
            step={0.1}
            value={endSec}
            onChange={(e) => setEndSec(e.target.value)}
            className="mt-2 block w-full rounded-md border border-[#ddd] px-3 py-2"
          />
        </label>
      </div>
    );
  }

  if (kind === "pdf-split") {
    return (
      <div className="mt-5 space-y-3">
        <label className="block text-sm text-[#333]">
          طريقة التقسيم
          <select
            value={splitMode}
            onChange={(e) => setSplitMode(e.target.value as "all" | "range")}
            className="mt-2 block w-full rounded-md border border-[#ddd] px-3 py-2"
          >
            <option value="all">كل صفحة كملف منفصل (ZIP)</option>
            <option value="range">استخراج نطاق صفحات</option>
          </select>
        </label>
        {splitMode === "range" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-[#333]">
              من صفحة
              <input
                type="number"
                min={1}
                value={pageFrom}
                onChange={(e) => setPageFrom(e.target.value)}
                className="mt-2 block w-full rounded-md border border-[#ddd] px-3 py-2"
              />
            </label>
            <label className="text-sm text-[#333]">
              إلى صفحة
              <input
                type="number"
                min={1}
                value={pageTo}
                onChange={(e) => setPageTo(e.target.value)}
                className="mt-2 block w-full rounded-md border border-[#ddd] px-3 py-2"
              />
            </label>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
