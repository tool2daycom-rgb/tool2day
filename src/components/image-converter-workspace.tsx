"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";
import {
  circularCropImage,
  compressAndResizeImage,
  convertImage,
  cropImageRegion,
  stitchImages,
  type ImageOutFormat,
} from "@/lib/processors/image";

type Mode = "convert" | "compress" | "circle" | "crop";

type Props = {
  slug: string;
  title: string;
  description: string;
};

const field =
  "mt-1 block w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm font-semibold text-[#222]";
const btnPrimary =
  "inline-flex w-full items-center justify-center rounded-md bg-[#111] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#bbb]";
const btnGhost =
  "inline-flex items-center justify-center rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm font-bold text-[#333] transition hover:border-[#bbb] disabled:opacity-50";

const modes: { id: Mode; label: string; hint: string }[] = [
  {
    id: "convert",
    label: "محول متقدم",
    hint: "JPG · PNG · WebP · AVIF",
  },
  {
    id: "compress",
    label: "ضغط وحجم",
    hint: "تصغير الحجم للمواقع",
  },
  {
    id: "circle",
    label: "صورة دائرية",
    hint: "ملف شخصي للتواصل",
  },
  {
    id: "crop",
    label: "قص ودمج",
    hint: "قص لقطة أو دمج صور",
  },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageConverterWorkspace({ slug, title, description }: Props) {
  const [mode, setMode] = useState<Mode>("convert");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [format, setFormat] = useState<ImageOutFormat>("webp");
  const [quality, setQuality] = useState(0.82);
  const [maxEdge, setMaxEdge] = useState(1920);
  const [circleSize, setCircleSize] = useState(512);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [stitchDir, setStitchDir] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const [cropAction, setCropAction] = useState<"crop" | "stitch">("crop");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [drawing, setDrawing] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const circleCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);

  useEffect(() => {
    if (!files[0]) {
      setPreviewUrl(null);
      setImgNatural({ w: 0, h: 0 });
      return;
    }
    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      setImgNatural({
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
      setCrop({
        x: Math.round(img.naturalWidth * 0.1),
        y: Math.round(img.naturalHeight * 0.1),
        w: Math.round(img.naturalWidth * 0.8),
        h: Math.round(img.naturalHeight * 0.8),
      });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [files]);

  const redrawCrop = useCallback(() => {
    const canvas = cropCanvasRef.current;
    const file = files[0];
    if (!canvas || !file || !previewUrl) return;
    const img = new Image();
    img.onload = () => {
      const maxW = 720;
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, w, h);
      const sx = crop.x * scale;
      const sy = crop.y * scale;
      const sw = crop.w * scale;
      const sh = crop.h * scale;
      ctx.clearRect(sx, sy, sw, sh);
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, sx, sy, sw, sh);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, sw, sh);
    };
    img.src = previewUrl;
  }, [crop, files, previewUrl]);

  useEffect(() => {
    if (mode === "crop" && cropAction === "crop") redrawCrop();
  }, [mode, cropAction, redrawCrop]);

  const redrawCircle = useCallback(() => {
    const canvas = circleCanvasRef.current;
    if (!canvas || !previewUrl) return;
    const img = new Image();
    img.onload = () => {
      const size = 280;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#f3f3f3";
      ctx.fillRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.clip();
      const cover = Math.max(size / img.naturalWidth, size / img.naturalHeight) * zoom;
      const dw = img.naturalWidth * cover;
      const dh = img.naturalHeight * cover;
      const dx = (size - dw) / 2 + offsetX * size;
      const dy = (size - dh) / 2 + offsetY * size;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.stroke();
    };
    img.src = previewUrl;
  }, [previewUrl, zoom, offsetX, offsetY]);

  useEffect(() => {
    if (mode === "circle") redrawCircle();
  }, [mode, redrawCircle]);

  function pickFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = Array.from(list).filter((f) => f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".svg"));
    if (!next.length) {
      setError("اختر ملفات صور صالحة");
      return;
    }
    setFiles(mode === "crop" && cropAction === "stitch" ? next : [next[0]!]);
    setError(null);
    setStatus(null);
  }

  function toNaturalCoords(clientX: number, clientY: number) {
    const canvas = cropCanvasRef.current;
    if (!canvas || !imgNatural.w) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * canvas.width;
    const sy = ((clientY - rect.top) / rect.height) * canvas.height;
    const scale = canvas.width / imgNatural.w;
    return {
      x: Math.round(sx / scale),
      y: Math.round(sy / scale),
    };
  }

  async function run() {
    if (!files.length) {
      setError("اختر صورة أولاً");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    beginToolUse(slug);
    try {
      if (mode === "convert") {
        await convertImage(files[0]!, format, { quality: 0.92 });
        setStatus(`تم التحويل إلى ${format.toUpperCase()} وتنزيل الملف`);
      } else if (mode === "compress") {
        const r = await compressAndResizeImage(files[0]!, {
          format: format === "png" ? "jpeg" : format,
          quality,
          maxLongEdge: maxEdge,
        });
        setStatus(
          `تم الضغط: ${r.width}×${r.height} — وفّرت حوالي ${r.savedPct}% (${formatBytes(files[0]!.size)} ← ${formatBytes(r.blob.size)})`,
        );
      } else if (mode === "circle") {
        await circularCropImage(files[0]!, {
          size: circleSize,
          zoom,
          offsetX,
          offsetY,
        });
        setStatus("تم تنزيل صورة الملف الشخصي الدائرية (PNG شفاف)");
      } else if (cropAction === "stitch") {
        await stitchImages(files, stitchDir, { format: "png" });
        setStatus(`تم دمج ${files.length} صور وتنزيل النتيجة`);
      } else {
        await cropImageRegion(files[0]!, crop, { format: "png" });
        setStatus(`تم القص ${crop.w}×${crop.h} وتنزيل النتيجة`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشلت المعالجة");
    } finally {
      setBusy(false);
    }
  }

  const multi = mode === "crop" && cropAction === "stitch";

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-[#111]">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-[#666]">{description}</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              setError(null);
              setStatus(null);
              if (m.id !== "crop") setFiles((f) => (f[0] ? [f[0]] : []));
            }}
            className={`rounded-lg border px-3 py-3 text-right transition ${
              mode === m.id
                ? "border-[#111] bg-[#111] text-white"
                : "border-[#e5e5e5] bg-[#fafafa] text-[#333] hover:border-[#ccc]"
            }`}
          >
            <div className="text-sm font-extrabold">{m.label}</div>
            <div
              className={`mt-0.5 text-[11px] font-semibold ${
                mode === m.id ? "text-white/70" : "text-[#888]"
              }`}
            >
              {m.hint}
            </div>
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? "border-[#3b82f6] bg-[#eff6ff]"
            : "border-[#c7d2fe] bg-[#f8faff]"
        }`}
      >
        <p className="text-sm font-bold text-[#333]">
          اسحب {multi ? "الصور" : "الصورة"} هنا أو اختر من جهازك
        </p>
        <p className="mt-1 text-xs font-semibold text-[#777]">
          {mode === "convert" && "حوّل إلى WebP أو AVIF أو JPG/PNG"}
          {mode === "compress" && "قلّل حجم PNG وJPEG لتسريع المواقع"}
          {mode === "circle" && "قص دائري جاهز للبروفايل"}
          {mode === "crop" &&
            (cropAction === "stitch"
              ? "ارفع صورتين أو أكثر للدمج"
              : "قص جزءاً من لقطة الشاشة")}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-[#2563eb] px-5 py-2 text-sm font-bold text-white hover:bg-[#1d4ed8]"
          onClick={() => inputRef.current?.click()}
        >
          اختيار ملف{multi ? "ات" : ""}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.svg,image/svg+xml"
          multiple={multi}
          className="hidden"
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {files.length > 0 ? (
          <ul className="mx-auto mt-3 max-w-md space-y-1 text-xs font-semibold text-[#555]">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`}>
                {f.name} — {formatBytes(f.size)}
                {imgNatural.w && files[0] === f
                  ? ` · ${imgNatural.w}×${imgNatural.h}`
                  : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {mode === "convert" ? (
          <label className="block text-xs font-bold text-[#444]">
            صيغة الصورة
            <select
              className={field}
              value={format}
              onChange={(e) => setFormat(e.target.value as ImageOutFormat)}
            >
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP (موصى به للويب)</option>
              <option value="avif">AVIF (أحدث وأصغر حجماً)</option>
            </select>
          </label>
        ) : null}

        {mode === "compress" ? (
          <>
            <label className="block text-xs font-bold text-[#444]">
              صيغة الإخراج
              <select
                className={field}
                value={format === "png" ? "jpeg" : format}
                onChange={(e) => setFormat(e.target.value as ImageOutFormat)}
              >
                <option value="jpeg">JPEG — أفضل للصور الفوتوغرافية</option>
                <option value="webp">WebP — توازن ممتاز</option>
                <option value="avif">AVIF — أصغر حجم ممكن</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-[#444]">
              الجودة: {Math.round(quality * 100)}%
              <input
                type="range"
                min={0.4}
                max={0.95}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-xs font-bold text-[#444]">
              أقصى ضلع (بكسل)
              <select
                className={field}
                value={maxEdge}
                onChange={(e) => setMaxEdge(Number(e.target.value))}
              >
                <option value={1280}>1280 — سريع للمواقع</option>
                <option value={1920}>1920 — Full HD</option>
                <option value={2560}>2560 — حاد</option>
                <option value={3840}>3840 — بدون تصغير كبير</option>
                <option value={99999}>الحجم الأصلي</option>
              </select>
            </label>
          </>
        ) : null}

        {mode === "circle" ? (
          <>
            <div className="flex justify-center">
              <canvas
                ref={circleCanvasRef}
                className="rounded-full shadow-md"
                width={280}
                height={280}
              />
            </div>
            <label className="block text-xs font-bold text-[#444]">
              حجم التصدير: {circleSize}px
              <input
                type="range"
                min={256}
                max={1024}
                step={64}
                value={circleSize}
                onChange={(e) => setCircleSize(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-xs font-bold text-[#444]">
              التكبير: {zoom.toFixed(2)}×
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-xs font-bold text-[#444]">
              تحريك أفقي
              <input
                type="range"
                min={-0.35}
                max={0.35}
                step={0.01}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-xs font-bold text-[#444]">
              تحريك عمودي
              <input
                type="range"
                min={-0.35}
                max={0.35}
                step={0.01}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </>
        ) : null}

        {mode === "crop" ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cropAction === "crop" ? btnPrimary : btnGhost}
                style={{ width: "auto" }}
                onClick={() => {
                  setCropAction("crop");
                  setFiles((f) => (f[0] ? [f[0]] : []));
                }}
              >
                قص منطقة
              </button>
              <button
                type="button"
                className={cropAction === "stitch" ? btnPrimary : btnGhost}
                style={{ width: "auto" }}
                onClick={() => setCropAction("stitch")}
              >
                دمج صور
              </button>
            </div>

            {cropAction === "crop" && files[0] ? (
              <>
                <p className="text-xs font-semibold text-[#666]">
                  اسحب على الصورة لتحديد منطقة القص
                </p>
                <div className="overflow-auto rounded-lg border border-[#eee] bg-[#fafafa] p-2">
                  <canvas
                    ref={cropCanvasRef}
                    className="mx-auto max-w-full cursor-crosshair touch-none"
                    onPointerDown={(e) => {
                      (e.target as HTMLCanvasElement).setPointerCapture(
                        e.pointerId,
                      );
                      const p = toNaturalCoords(e.clientX, e.clientY);
                      dragStart.current = p;
                      setDrawing(true);
                      setCrop({ x: p.x, y: p.y, w: 1, h: 1 });
                    }}
                    onPointerMove={(e) => {
                      if (!drawing || !dragStart.current) return;
                      const p = toNaturalCoords(e.clientX, e.clientY);
                      const x = Math.min(dragStart.current.x, p.x);
                      const y = Math.min(dragStart.current.y, p.y);
                      const w = Math.abs(p.x - dragStart.current.x);
                      const h = Math.abs(p.y - dragStart.current.y);
                      setCrop({ x, y, w: Math.max(1, w), h: Math.max(1, h) });
                    }}
                    onPointerUp={() => {
                      setDrawing(false);
                      dragStart.current = null;
                    }}
                  />
                </div>
                <p className="text-xs font-bold text-[#555]">
                  المنطقة: {crop.w}×{crop.h} عند ({crop.x}, {crop.y})
                </p>
              </>
            ) : null}

            {cropAction === "stitch" ? (
              <label className="block text-xs font-bold text-[#444]">
                اتجاه الدمج
                <select
                  className={field}
                  value={stitchDir}
                  onChange={(e) =>
                    setStitchDir(e.target.value as "horizontal" | "vertical")
                  }
                >
                  <option value="horizontal">أفقي (جنب بعض)</option>
                  <option value="vertical">عمودي (فوق بعض)</option>
                </select>
              </label>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          className={btnPrimary}
          disabled={busy || files.length === 0}
          onClick={() => void run()}
        >
          {busy ? "جارٍ المعالجة…" : "ابدأ المعالجة"}
        </button>

        {status ? (
          <p className="text-sm font-bold text-emerald-700">{status}</p>
        ) : null}
        {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
