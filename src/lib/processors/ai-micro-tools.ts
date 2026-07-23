/** معالجات أدوات الذكاء الاصطناعي السريعة */

export async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل تصدير الصورة"))),
      type,
      quality,
    );
  });
}

export type { OcrResult } from "./ocr";
export { runOcr, guessLangPack } from "./ocr";

/** إزالة الخلفية عبر @imgly/background-removal */
export async function removeImageBackground(
  file: File,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");
  onProgress?.(0.05);
  const blob = await removeBackground(file, {
    progress: (_key, current, total) => {
      if (total > 0) onProgress?.(Math.min(0.99, current / total));
    },
  });
  onProgress?.(1);
  return blob;
}

/**
 * تكبير الصورة نحو عرض/ارتفاع هدف (افتراضي عرض 4K = 3840)
 * مع تنعيم عالي الجودة وتحسين حواف بسيط.
 */
export async function upscaleImageTo4k(
  file: File,
  opts?: { targetLongEdge?: number; onProgress?: (p: number) => void },
): Promise<{ blob: Blob; width: number; height: number }> {
  const targetLong = opts?.targetLongEdge ?? 3840;
  const onProgress = opts?.onProgress;
  onProgress?.(0.1);
  const img = await loadImageElement(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const long = Math.max(srcW, srcH);
  const scale = Math.max(1, targetLong / long);
  const dstW = Math.round(srcW * scale);
  const dstH = Math.round(srcH * scale);

  // تكبير متعدد الخطوات لجودة أفضل
  let cur = document.createElement("canvas");
  cur.width = srcW;
  cur.height = srcH;
  let ctx = cur.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0);
  onProgress?.(0.35);

  let w = srcW;
  let h = srcH;
  while (w * 2 < dstW || h * 2 < dstH) {
    const nw = Math.min(dstW, w * 2);
    const nh = Math.min(dstH, h * 2);
    const next = document.createElement("canvas");
    next.width = nw;
    next.height = nh;
    const nctx = next.getContext("2d")!;
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = "high";
    nctx.drawImage(cur, 0, 0, nw, nh);
    cur = next;
    w = nw;
    h = nh;
    onProgress?.(0.35 + 0.4 * (w / dstW));
  }

  if (w !== dstW || h !== dstH) {
    const final = document.createElement("canvas");
    final.width = dstW;
    final.height = dstH;
    const fctx = final.getContext("2d")!;
    fctx.imageSmoothingEnabled = true;
    fctx.imageSmoothingQuality = "high";
    fctx.drawImage(cur, 0, 0, dstW, dstH);
    cur = final;
  }
  onProgress?.(0.85);

  // Unsharp mask خفيف
  sharpenCanvas(cur, 0.35);
  onProgress?.(0.95);
  const blob = await canvasToBlob(cur, "image/jpeg", 0.92);
  onProgress?.(1);
  return { blob, width: dstW, height: dstH };
}

function sharpenCanvas(canvas: HTMLCanvasElement, amount: number) {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data;
  const d = out.data;
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let v = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const i = ((y + ky) * w + (x + kx)) * 4 + c;
            v += s[i]! * k[ki++]!;
          }
        }
        const i = (y * w + x) * 4 + c;
        const orig = s[i]!;
        d[i] = Math.max(
          0,
          Math.min(255, Math.round(orig * (1 - amount) + v * amount)),
        );
      }
      const a = (y * w + x) * 4 + 3;
      d[a] = s[a]!;
    }
  }
  // copy borders
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 4; c++) {
      d[x * 4 + c] = s[x * 4 + c]!;
      d[((h - 1) * w + x) * 4 + c] = s[((h - 1) * w + x) * 4 + c]!;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 4; c++) {
      d[(y * w) * 4 + c] = s[(y * w) * 4 + c]!;
      d[(y * w + w - 1) * 4 + c] = s[(y * w + w - 1) * 4 + c]!;
    }
  }
  ctx.putImageData(out, 0, 0);
}

/**
 * مسح منطقة مظلّلة وملؤها من الجوار (inpainting بسيط سريع).
 * mask: ImageData حيث alpha>0 أو أحمر>0 يعني منطقة للحذف.
 */
export async function eraseMaskedRegion(
  imageFile: File,
  maskCanvas: HTMLCanvasElement,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  onProgress?.(0.1);
  const img = await loadImageElement(imageFile);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);

  const mctx = maskCanvas.getContext("2d")!;
  // scale mask to image size if needed
  const scaled = document.createElement("canvas");
  scaled.width = w;
  scaled.height = h;
  const sctx = scaled.getContext("2d")!;
  sctx.drawImage(maskCanvas, 0, 0, w, h);
  const mask = sctx.getImageData(0, 0, w, h);

  const data = imgData.data;
  const md = mask.data;
  const isMask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = md[i * 4 + 3]!;
    const r = md[i * 4]!;
    isMask[i] = a > 20 || r > 40 ? 1 : 0;
  }
  onProgress?.(0.3);

  // عدة تمريرات: متوسط الجيران غير المقنّعين ثم توسيع تدريجي
  const passes = 40;
  const filled = new Uint8Array(w * h);
  for (let pass = 0; pass < passes; pass++) {
    const copy = new Uint8ClampedArray(data);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (!isMask[idx] || filled[idx]) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const ni = ny * w + nx;
            if (isMask[ni] && !filled[ni]) continue;
            const p = ni * 4;
            r += copy[p]!;
            g += copy[p + 1]!;
            b += copy[p + 2]!;
            n++;
          }
        }
        if (n > 0) {
          const p = idx * 4;
          data[p] = Math.round(r / n);
          data[p + 1] = Math.round(g / n);
          data[p + 2] = Math.round(b / n);
          filled[idx] = 1;
        }
      }
    }
    if (pass % 5 === 0) onProgress?.(0.3 + 0.6 * (pass / passes));
  }

  ctx.putImageData(imgData, 0, 0);
  onProgress?.(0.95);
  const blob = await canvasToBlob(canvas, "image/png");
  onProgress?.(1);
  return blob;
}

/** تلخيص استخراجي محلي (احتياطي بدون مفاتيح API) */
export function extractiveSummarize(text: string, maxSentences = 5): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const sentences = cleaned
    .split(/(?<=[.!?؟。！？\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);
  if (sentences.length <= maxSentences) return sentences.join(" ") || cleaned.slice(0, 800);

  const stop = new Set(
    "the a an and or but in on at to for of is are was were be this that it with as by from عن من في على إلى هذا هذه التي الذي كان تكون يكون ما لا لم لن إن أن أو ثم قد".split(
      /\s+/,
    ),
  );
  const freq = new Map<string, number>();
  for (const s of sentences) {
    for (const w of s.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (w.length < 3 || stop.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  const scored = sentences.map((s, i) => {
    let score = 0;
    for (const w of s.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      score += freq.get(w) || 0;
    }
    // تفضيل الجمل الأولى قليلاً
    score += Math.max(0, 3 - i) * 2;
    return { s, score, i };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, maxSentences)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)
    .join(" ");
}

export function htmlToPlainText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|br|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return stripped.slice(0, 60_000);
}
