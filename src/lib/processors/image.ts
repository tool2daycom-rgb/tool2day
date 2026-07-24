import { basename, downloadBlob } from "./ffmpeg-client";

export type ImageOutFormat = "jpeg" | "png" | "webp" | "avif";

function isSvgFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/svg+xml" ||
    name.endsWith(".svg") ||
    file.type === "image/svg"
  );
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("تعذّر قراءة الصورة — جرّب ملفاً آخر أو صيغة مختلفة"));
    img.src = src;
  });
}

async function loadSvgAsImage(file: File): Promise<HTMLImageElement> {
  let text = await file.text();
  if (!text.trim()) {
    throw new Error("ملف SVG فارغ");
  }

  if (!/xmlns\s*=/.test(text)) {
    text = text.replace(
      /<svg\b/i,
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  if (!/\b(width|viewBox)\s*=/i.test(text)) {
    text = text.replace(
      /<svg\b([^>]*)>/i,
      '<svg$1 width="512" height="512" viewBox="0 0 512 512">',
    );
  }

  const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(url);
    if (!img.naturalWidth || !img.naturalHeight) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    if (!img.naturalWidth || !img.naturalHeight) {
      const wMatch = text.match(/\bwidth=["']?([\d.]+)/i);
      const hMatch = text.match(/\bheight=["']?([\d.]+)/i);
      const vb = text.match(/viewBox=["']?\s*([\d.\s-]+)/i);
      let w = wMatch ? Number(wMatch[1]) : 0;
      let h = hMatch ? Number(hMatch[1]) : 0;
      if ((!w || !h) && vb) {
        const parts = vb[1]!.trim().split(/[\s,]+/).map(Number);
        if (parts.length >= 4) {
          w = parts[2] || 512;
          h = parts[3] || 512;
        }
      }
      img.width = w || 512;
      img.height = h || 512;
    }
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadRasterAsImage(file: File): Promise<CanvasImageSource> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      return await loadImageElement(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function loadImageSource(
  file: File,
): Promise<CanvasImageSource> {
  return isSvgFile(file)
    ? await loadSvgAsImage(file)
    : await loadRasterAsImage(file);
}

export function sourceSize(source: CanvasImageSource): {
  w: number;
  h: number;
} {
  if (source instanceof HTMLImageElement) {
    return {
      w: source.naturalWidth || source.width || 512,
      h: source.naturalHeight || source.height || 512,
    };
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { w: source.width, h: source.height };
  }
  if (source instanceof HTMLCanvasElement) {
    return { w: source.width, h: source.height };
  }
  return { w: 512, h: 512 };
}

function releaseSource(source: CanvasImageSource) {
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    source.close();
  }
}

function mimeFor(format: ImageOutFormat): string {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  if (format === "avif") return "image/avif";
  return "image/jpeg";
}

function extFor(format: ImageOutFormat): string {
  if (format === "jpeg") return "jpg";
  return format;
}

export async function canvasToImageBlob(
  canvas: HTMLCanvasElement,
  format: ImageOutFormat,
  quality = 0.92,
): Promise<Blob> {
  const mime = mimeFor(format);
  const q = format === "png" ? undefined : quality;

  const tryBlob = (type: string, qual?: number) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), type, qual);
    });

  let blob = await tryBlob(mime, q);

  // AVIF غير مدعوم في بعض المتصفحات — سقوط إلى WebP ثم JPEG
  if (!blob && format === "avif") {
    blob = await tryBlob("image/webp", quality);
    if (blob) {
      return blob;
    }
    blob = await tryBlob("image/jpeg", quality);
  }

  if (!blob) {
    throw new Error(
      format === "avif"
        ? "متصفحك لا يدعم تصدير AVIF — جرّب WebP أو حدّث المتصفح"
        : "فشل تحويل الصورة",
    );
  }
  return blob;
}

async function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  opts?: { fillWhite?: boolean },
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر فتح محرر الصور");
  if (opts?.fillWhite) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** تحويل صيغة متقدم: JPG / PNG / WebP / AVIF */
export async function convertImage(
  file: File,
  format: ImageOutFormat,
  opts?: { quality?: number; download?: boolean },
): Promise<Blob> {
  if (!file || (file.size === 0 && !isSvgFile(file))) {
    throw new Error("الملف فارغ أو تالف — اختر صورة صالحة");
  }

  const source = await loadImageSource(file);
  const { w, h } = sourceSize(source);
  if (!w || !h) throw new Error("تعذّر تحديد أبعاد الصورة");

  const canvas = await drawToCanvas(source, w, h, {
    fillWhite: format === "jpeg",
  });
  releaseSource(source);

  const blob = await canvasToImageBlob(
    canvas,
    format,
    opts?.quality ?? (format === "png" ? 1 : 0.92),
  );

  if (opts?.download !== false) {
    let ext = extFor(format);
    if (format === "avif" && blob.type === "image/webp") ext = "webp";
    if (format === "avif" && blob.type === "image/jpeg") ext = "jpg";
    await downloadBlob(blob, `${basename(file.name)}.${ext}`);
  }
  return blob;
}

/** ضغط وتغيير حجم PNG/JPEG/WebP لتسريع المواقع */
export async function compressAndResizeImage(
  file: File,
  opts: {
    format: ImageOutFormat;
    quality: number;
    maxLongEdge?: number;
    download?: boolean;
  },
): Promise<{ blob: Blob; width: number; height: number; savedPct: number }> {
  const source = await loadImageSource(file);
  const { w, h } = sourceSize(source);
  if (!w || !h) throw new Error("تعذّر تحديد أبعاد الصورة");

  const long = Math.max(w, h);
  const maxEdge = opts.maxLongEdge && opts.maxLongEdge > 0 ? opts.maxLongEdge : long;
  const scale = Math.min(1, maxEdge / long);
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));

  const canvas = await drawToCanvas(source, dw, dh, {
    fillWhite: opts.format === "jpeg",
  });
  releaseSource(source);

  const blob = await canvasToImageBlob(canvas, opts.format, opts.quality);
  const savedPct =
    file.size > 0
      ? Math.max(0, Math.round((1 - blob.size / file.size) * 100))
      : 0;

  if (opts.download !== false) {
    await downloadBlob(
      blob,
      `${basename(file.name)}-compressed.${extFor(opts.format)}`,
    );
  }
  return { blob, width: dw, height: dh, savedPct };
}

/** قص دائري جاهز لصورة الملف الشخصي */
export async function circularCropImage(
  file: File,
  opts: {
    size: number;
    /** إزاحة المركز كنسبة من العرض/الارتفاع (−0.5…0.5) */
    offsetX?: number;
    offsetY?: number;
    /** تكبير المصدر داخل الدائرة */
    zoom?: number;
    download?: boolean;
  },
): Promise<Blob> {
  const source = await loadImageSource(file);
  const { w, h } = sourceSize(source);
  if (!w || !h) throw new Error("تعذّر تحديد أبعاد الصورة");

  const size = Math.max(64, Math.round(opts.size));
  const zoom = Math.max(1, opts.zoom ?? 1);
  const ox = opts.offsetX ?? 0;
  const oy = opts.offsetY ?? 0;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر فتح محرر الصور");

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const cover = Math.max(size / w, size / h) * zoom;
  const dw = w * cover;
  const dh = h * cover;
  const dx = (size - dw) / 2 + ox * size;
  const dy = (size - dh) / 2 + oy * size;
  ctx.drawImage(source, dx, dy, dw, dh);
  releaseSource(source);

  const blob = await canvasToImageBlob(canvas, "png");
  if (opts.download !== false) {
    await downloadBlob(blob, `${basename(file.name)}-avatar.png`);
  }
  return blob;
}

/** قص مستطيل من الصورة (لقطات شاشة) */
export async function cropImageRegion(
  file: File,
  region: { x: number; y: number; w: number; h: number },
  opts?: { format?: ImageOutFormat; download?: boolean },
): Promise<Blob> {
  const source = await loadImageSource(file);
  const { w: iw, h: ih } = sourceSize(source);
  if (!iw || !ih) throw new Error("تعذّر تحديد أبعاد الصورة");

  const x = Math.max(0, Math.min(iw - 1, Math.round(region.x)));
  const y = Math.max(0, Math.min(ih - 1, Math.round(region.y)));
  const cw = Math.max(1, Math.min(iw - x, Math.round(region.w)));
  const ch = Math.max(1, Math.min(ih - y, Math.round(region.h)));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر فتح محرر الصور");
  ctx.drawImage(source, x, y, cw, ch, 0, 0, cw, ch);
  releaseSource(source);

  const format = opts?.format ?? "png";
  const blob = await canvasToImageBlob(
    canvas,
    format,
    format === "png" ? 1 : 0.92,
  );
  if (opts?.download !== false) {
    await downloadBlob(blob, `${basename(file.name)}-crop.${extFor(format)}`);
  }
  return blob;
}

/** دمج عدة صور أفقياً أو عمودياً */
export async function stitchImages(
  files: File[],
  direction: "horizontal" | "vertical",
  opts?: { format?: ImageOutFormat; download?: boolean },
): Promise<Blob> {
  if (files.length < 2) {
    throw new Error("اختر صورتين على الأقل للدمج");
  }

  const sources: { src: CanvasImageSource; w: number; h: number }[] = [];
  for (const f of files) {
    const src = await loadImageSource(f);
    const { w, h } = sourceSize(src);
    sources.push({ src, w, h });
  }

  let outW = 0;
  let outH = 0;
  if (direction === "horizontal") {
    outH = Math.max(...sources.map((s) => s.h));
    outW = sources.reduce(
      (sum, s) => sum + Math.round((s.w * outH) / s.h),
      0,
    );
  } else {
    outW = Math.max(...sources.map((s) => s.w));
    outH = sources.reduce(
      (sum, s) => sum + Math.round((s.h * outW) / s.w),
      0,
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, outW);
  canvas.height = Math.max(1, outH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر فتح محرر الصور");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cursor = 0;
  for (const s of sources) {
    if (direction === "horizontal") {
      const dw = Math.round((s.w * outH) / s.h);
      ctx.drawImage(s.src, cursor, 0, dw, outH);
      cursor += dw;
    } else {
      const dh = Math.round((s.h * outW) / s.w);
      ctx.drawImage(s.src, 0, cursor, outW, dh);
      cursor += dh;
    }
    releaseSource(s.src);
  }

  const format = opts?.format ?? "png";
  const blob = await canvasToImageBlob(
    canvas,
    format,
    format === "png" ? 1 : 0.92,
  );
  if (opts?.download !== false) {
    await downloadBlob(blob, `stitched-tool2day.${extFor(format)}`);
  }
  return blob;
}
