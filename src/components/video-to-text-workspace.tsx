"use client";

import { useEffect, useRef, useState } from "react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  TRANSCRIBE_LANGUAGES,
  transcribeMediaFile,
} from "@/lib/processors/transcribe";
import { formatProcessError } from "@/lib/processors/ffmpeg-client";
import { MAX_CLIENT_FILE_MB } from "@/lib/processors/active-tools";

type Props = {
  slug: string;
  title: string;
  description: string;
};

export function VideoToTextWorkspace({ slug, title, description }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("ar");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.size > MAX_CLIENT_FILE_MB * 1024 * 1024) {
      setError(`الحد الأقصى ${MAX_CLIENT_FILE_MB}MB`);
      return;
    }
    setFile(f);
    setText("");
    setProvider(null);
    setError(null);
    setStatus(null);
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
    setText("");
    setProvider(null);
    try {
      const result = await transcribeMediaFile(
        file,
        language,
        (r) => setProgress(Math.round(r * 100)),
        (msg) => setStatus(msg),
      );
      setText(result.text);
      setProvider(result.provider);
      const dur =
        result.durationSec != null
          ? ` · مدة الصوت ${result.durationSec.toFixed(1)}ث`
          : "";
      setStatus(`اكتمل التفريغ الكامل${dur} — راجع النص وعدّل إن لزم`);
      setProgress(100);
    } catch (e) {
      setError(formatProcessError(e));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus("تم نسخ النص");
  }

  async function downloadText() {
    if (!text) return;
    const { downloadBlob } = await import("@/lib/processors/ffmpeg-client");
    await downloadBlob(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
      `${file?.name?.replace(/\.[^.]+$/, "") || "transcript"}.txt`,
    );
  }

  return (
    <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-lg font-semibold text-[#111]">{title}</p>
      <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
      <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">
        يُفرَّغ الفيديو كاملاً بمقاطع متتالية عبر نموذج Whisper Small عالي الدقة.
        اختر لغة الكلام الصحيحة، وفضّل صوتاً واضحاً. التحميل الأول للنموذج أكبر
        وقد يستغرق دقائق ثم يُحفظ محلياً. راجع النص بعد الاستخراج.
      </p>

      <div
        className="mt-5 cursor-pointer rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] px-4 py-10 text-center"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-bold text-[#111]">
          {file ? file.name : "اسحب فيديو أو صوت هنا أو انقر للاختيار"}
        </p>
        <p className="mt-1 text-xs text-[#888]">
          MP4 / WebM / MOV / MP3 / WAV — حتى {MAX_CLIENT_FILE_MB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      <label className="mt-4 block text-sm font-semibold text-[#333]">
        لغة الكلام في الفيديو
        <select
          className="mt-1 block w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={busy}
        >
          {TRANSCRIBE_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        disabled={busy || !file}
        onClick={() => void run()}
        className="mt-4 w-full rounded-md bg-[#111] px-4 py-3 text-sm font-bold text-white hover:bg-[#333] disabled:opacity-50"
      >
        {busy ? "جارٍ التفريغ…" : "حوّل الفيديو إلى نص"}
      </button>

      {busy || progress > 0 ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#eee]">
            <div
              className="h-full bg-[#2563eb] transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      ) : null}
      {status ? (
        <p className="mt-2 text-xs leading-6 text-[#555]">{status}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {text ? (
        <div className="mt-5 space-y-3">
          {provider ? (
            <p className="text-[11px] text-[#888]">المحرك: {provider}</p>
          ) : null}
          <textarea
            className="min-h-56 w-full rounded-md border border-[#ddd] bg-[#fafafa] px-3 py-3 text-sm leading-7 text-[#222]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="auto"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyText()}
              className="rounded-md bg-[#16a34a] px-3 py-2 text-xs font-bold text-white"
            >
              نسخ النص
            </button>
            <button
              type="button"
              onClick={() => void downloadText()}
              className="rounded-md border border-[#ddd] bg-white px-3 py-2 text-xs font-bold text-[#333]"
            >
              تنزيل TXT
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
