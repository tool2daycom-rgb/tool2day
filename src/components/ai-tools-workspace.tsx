"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  eraseMaskedRegion,
  extractiveSummarize,
  removeImageBackground,
  runOcr,
  upscaleImageTo4k,
} from "@/lib/processors/ai-micro-tools";

export type AiToolKind =
  | "ai-ocr"
  | "ai-summarize"
  | "ai-remove-bg"
  | "ai-upscale"
  | "ai-erase";

type Props = {
  kind: AiToolKind;
  slug: string;
  title: string;
  description: string;
};

const field =
  "w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#2563eb]";
const btn =
  "rounded-md px-4 py-2 text-sm font-bold transition disabled:opacity-50";
const btnPrimary = `${btn} bg-[#111] text-white hover:bg-[#333]`;
const btnGhost = `${btn} border border-[#ddd] text-[#222] hover:bg-[#f7f7f7]`;

export function AiToolsWorkspace({ kind, slug, title, description }: Props) {
  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  if (kind === "ai-ocr") {
    return <OcrPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "ai-summarize") {
    return <SummarizePanel slug={slug} title={title} description={description} />;
  }
  if (kind === "ai-remove-bg") {
    return <RemoveBgPanel slug={slug} title={title} description={description} />;
  }
  if (kind === "ai-upscale") {
    return <UpscalePanel slug={slug} title={title} description={description} />;
  }
  return <ErasePanel slug={slug} title={title} description={description} />;
}

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-lg font-extrabold text-[#0a0a0a]">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-7 text-[#333]">
        {description}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label ? (
        <p className="mb-1 text-xs font-semibold text-[#555]">{label}</p>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-[#eee]">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function FilePick({
  accept,
  file,
  onPick,
}: {
  accept: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-xl border border-dashed border-[#ccc] bg-[#fafafa] px-4 py-6 text-center hover:border-[#2563eb] hover:bg-[#f5f8ff]">
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
      <p className="text-sm font-bold text-[#222]">
        {file ? file.name : "اضغط لاختيار صورة"}
      </p>
      <p className="mt-1 text-xs text-[#777]">PNG · JPG · WEBP</p>
    </label>
  );
}

async function downloadBlob(blob: Blob, name: string) {
  const { downloadBlob: dl } = await import("@/lib/processors/ffmpeg-client");
  await dl(blob, name);
}

/* ─── OCR ─── */

function OcrPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [langs, setLangs] = useState("auto");
  const [detected, setDetected] = useState<string | null>(null);

  async function run(f: File, langOverride?: string) {
    setBusy(true);
    setError(null);
    setText("");
    setDetected(null);
    beginToolUse(slug);
    try {
      const out = await runOcr(f, langOverride ?? langs, (p, s) => {
        setProgress(p);
        setStatus(s);
      });
      setText(out.text || "لم يُعثر على نص واضح في الصورة.");
      setDetected(out.langLabel);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الاستخراج");
    } finally {
      setBusy(false);
    }
  }

  function onPick(f: File | null) {
    setFile(f);
    setText("");
    setError(null);
    setDetected(null);
    if (f) void run(f, "auto");
  }

  return (
    <Shell title={title} description={description}>
      <FilePick accept="image/*" file={file} onPick={onPick} />
      <label className="block text-xs font-bold text-[#444]">
        اللغة
        <select
          className={`${field} mt-1`}
          value={langs}
          disabled={busy}
          onChange={(e) => setLangs(e.target.value)}
        >
          <option value="auto">تلقائي — اكتشاف لغة الصورة</option>
          <option value="deu+eng">Deutsch + English (ألمانية)</option>
          <option value="por+eng">Português + English</option>
          <option value="eng">English فقط</option>
          <option value="ara+eng">العربية + English</option>
          <option value="ara">العربية فقط</option>
          <option value="spa+eng">Español + English</option>
          <option value="fra+eng">Français + English</option>
          <option value="ita+eng">Italiano + English</option>
          <option value="tur+eng">Türkçe + English</option>
          <option value="eng+por+spa+fra+deu+ita">لاتينية متعددة</option>
        </select>
      </label>
      <p className="text-[11px] font-semibold text-[#777]">
        عند اختيار الصورة يبدأ الاستخراج تلقائياً مع اكتشاف اللغة واتجاه النص.
      </p>
      {detected ? (
        <p className="text-xs font-bold text-emerald-800">
          اللغة المكتشفة: {detected}
        </p>
      ) : null}
      <button
        type="button"
        className={btnPrimary}
        disabled={!file || busy}
        onClick={() => file && void run(file)}
      >
        {busy ? "جارٍ الاستخراج…" : "إعادة الاستخراج"}
      </button>
      {busy ? <ProgressBar value={progress} label={status || "…"} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {text ? (
        <>
          <textarea className={`${field} min-h-48`} value={text} onChange={(e) => setText(e.target.value)} dir="auto" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={() => void navigator.clipboard.writeText(text)}
            >
              نسخ
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() =>
                void downloadBlob(
                  new Blob([text], { type: "text/plain;charset=utf-8" }),
                  "ocr-tool2day.txt",
                )
              }
            >
              تنزيل TXT
            </button>
          </div>
        </>
      ) : null}
    </Shell>
  );
}

/* ─── Summarize ─── */

function SummarizePanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setSummary("");
    beginToolUse(slug);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          text: text.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        summary?: string;
        provider?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "فشل التلخيص");
      setSummary(data.summary || "");
      setProvider(data.provider || "");
    } catch (e) {
      // احتياطي محلي إن فشل الخادم والنص موجود
      if (text.trim().length > 40) {
        setSummary(extractiveSummarize(text, 6));
        setProvider("local");
      } else {
        setError(e instanceof Error ? e.message : "فشل التلخيص");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={title} description={description}>
      <label className="block text-xs font-bold text-[#444]">
        رابط المقال / الصفحة
        <input
          className={`${field} mt-1`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          dir="ltr"
        />
      </label>
      <label className="block text-xs font-bold text-[#444]">
        أو الصق النص مباشرة
        <textarea
          className={`${field} mt-1 min-h-36`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="الصق المقال هنا…"
          dir="auto"
        />
      </label>
      <button
        type="button"
        className={btnPrimary}
        disabled={busy || (!url.trim() && text.trim().length < 40)}
        onClick={() => void run()}
      >
        {busy ? "جارٍ التلخيص…" : "لخّص الآن"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {summary ? (
        <>
          {provider ? (
            <p className="text-[11px] font-semibold text-[#888]">
              المصدر: {provider}
            </p>
          ) : null}
          <textarea
            className={`${field} min-h-40 font-semibold`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            dir="auto"
          />
          <button
            type="button"
            className={btnGhost}
            onClick={() => void navigator.clipboard.writeText(summary)}
          >
            نسخ الملخص
          </button>
        </>
      ) : null}
    </Shell>
  );
}

/* ─── Remove BG ─── */

function RemoveBgPanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    beginToolUse(slug);
    try {
      const blob = await removeImageBackground(file, setProgress);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const u = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشلت إزالة الخلفية");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={title} description={description}>
      <FilePick accept="image/*" file={file} onPick={setFile} />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mx-auto max-h-56 rounded-lg object-contain" />
      ) : null}
      <button type="button" className={btnPrimary} disabled={!file || busy} onClick={() => void run()}>
        {busy ? "جارٍ إزالة الخلفية…" : "إزالة الخلفية"}
      </button>
      {busy ? <ProgressBar value={progress} label="تحميل النموذج والمعالجة…" /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {resultUrl ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-[length:16px_16px] bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="بدون خلفية" className="mx-auto max-h-72 object-contain" />
          </div>
          <button
            type="button"
            className={btnPrimary}
            onClick={() =>
              resultBlob &&
              void downloadBlob(resultBlob, "no-bg-tool2day.png")
            }
          >
            تنزيل PNG شفاف
          </button>
        </div>
      ) : null}
    </Shell>
  );
}

/* ─── Upscale ─── */

function UpscalePanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState(3840);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [info, setInfo] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    beginToolUse(slug);
    try {
      const { blob, width, height } = await upscaleImageTo4k(file, {
        targetLongEdge: target,
        onProgress: setProgress,
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setInfo(`${width}×${height}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التكبير");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={title} description={description}>
      <FilePick accept="image/*" file={file} onPick={setFile} />
      <label className="block text-xs font-bold text-[#444]">
        الحجم المستهدف (الضلع الأطول)
        <select
          className={`${field} mt-1`}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
        >
          <option value={1920}>Full HD — 1920px</option>
          <option value={2560}>2K — 2560px</option>
          <option value={3840}>4K — 3840px</option>
        </select>
      </label>
      <button type="button" className={btnPrimary} disabled={!file || busy} onClick={() => void run()}>
        {busy ? "جارٍ التكبير…" : "كبّر الصورة"}
      </button>
      {busy ? <ProgressBar value={progress} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {resultUrl ? (
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#222]">النتيجة: {info}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="مكبّرة" className="mx-auto max-h-80 rounded-lg object-contain" />
          <button
            type="button"
            className={btnPrimary}
            onClick={() =>
              resultBlob &&
              void downloadBlob(resultBlob, "upscale-4k-tool2day.jpg")
            }
          >
            تنزيل الصورة
          </button>
        </div>
      ) : null}
    </Shell>
  );
}

/* ─── Erase object ─── */

function ErasePanel({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [brush, setBrush] = useState(28);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);

  const viewRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const paintAt = useCallback(
    (clientX: number, clientY: number) => {
      const view = viewRef.current;
      const mask = maskRef.current;
      if (!view || !mask) return;
      const rect = view.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * view.width;
      const y = ((clientY - rect.top) / rect.height) * view.height;
      const scale = view.width / rect.width;
      const r = (brush * scale) / 2;

      for (const c of [view, mask]) {
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = c === mask ? "rgba(255,0,0,1)" : "rgba(239,68,68,0.55)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [brush],
  );

  async function loadFile(f: File | null) {
    setFile(f);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
      img.src = url;
    });
    URL.revokeObjectURL(url);
    imgRef.current = img;

    const maxW = 900;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    for (const ref of [viewRef, maskRef]) {
      const c = ref.current;
      if (!c) continue;
      c.width = w;
      c.height = h;
    }
    const view = viewRef.current!;
    const vctx = view.getContext("2d")!;
    vctx.clearRect(0, 0, w, h);
    vctx.drawImage(img, 0, 0, w, h);
    maskRef.current!.getContext("2d")!.clearRect(0, 0, w, h);
  }

  function clearMask() {
    const img = imgRef.current;
    const view = viewRef.current;
    const mask = maskRef.current;
    if (!img || !view || !mask) return;
    const vctx = view.getContext("2d")!;
    vctx.clearRect(0, 0, view.width, view.height);
    vctx.drawImage(img, 0, 0, view.width, view.height);
    mask.getContext("2d")!.clearRect(0, 0, mask.width, mask.height);
  }

  async function run() {
    if (!file || !maskRef.current) return;
    setBusy(true);
    setError(null);
    beginToolUse(slug);
    try {
      // rebuild full-res mask
      const img = imgRef.current!;
      const fullMask = document.createElement("canvas");
      fullMask.width = img.naturalWidth;
      fullMask.height = img.naturalHeight;
      fullMask
        .getContext("2d")!
        .drawImage(
          maskRef.current,
          0,
          0,
          fullMask.width,
          fullMask.height,
        );
      const blob = await eraseMaskedRegion(file, fullMask, setProgress);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل المسح");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  return (
    <Shell title={title} description={description}>
      <FilePick
        accept="image/*"
        file={file}
        onPick={(f) => void loadFile(f)}
      />
      <label className="block text-xs font-bold text-[#444]">
        حجم الفرشاة: {brush}
        <input
          type="range"
          min={8}
          max={80}
          value={brush}
          onChange={(e) => setBrush(Number(e.target.value))}
          className="mt-1 w-full"
        />
      </label>
      <p className="text-xs font-semibold text-[#666]">
        ظلّل المنطقة المراد حذفها بالفرشاة الحمراء ثم اضغط «امسح».
      </p>
      <div className="overflow-auto rounded-xl border border-[#eee] bg-[#fafafa] p-2">
        <canvas
          ref={viewRef}
          className="mx-auto max-w-full cursor-crosshair touch-none"
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            setDrawing(true);
            paintAt(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!drawing) return;
            paintAt(e.clientX, e.clientY);
          }}
          onPointerUp={() => setDrawing(false)}
          onPointerCancel={() => setDrawing(false)}
        />
        <canvas ref={maskRef} className="hidden" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnGhost} onClick={clearMask} disabled={!file}>
          مسح التظليل
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={!file || busy}
          onClick={() => void run()}
        >
          {busy ? "جارٍ المسح…" : "امسح المنطقة"}
        </button>
      </div>
      {busy ? <ProgressBar value={progress} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {resultUrl ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="بعد المسح" className="mx-auto max-h-80 rounded-lg object-contain" />
          <button
            type="button"
            className={btnPrimary}
            onClick={() =>
              resultBlob && void downloadBlob(resultBlob, "erased-tool2day.png")
            }
          >
            تنزيل النتيجة
          </button>
        </div>
      ) : null}
    </Shell>
  );
}
