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
export { runOcr, guessLangPack, postCorrectOcrText } from "./ocr";
import type { OcrResult } from "./ocr";

/** OCR سحابي بدقة أعلى للمستندات (مع تكبير محلي ثم /api/ocr) */
export async function runCloudOcr(
  file: File,
  langs = "auto",
  onProgress?: (p: number, status: string) => void,
): Promise<OcrResult | null> {
  onProgress?.(0.05, "تحسين الصورة للإرسال…");
  const prepared = await prepareJpegForCloudOcr(file);
  onProgress?.(0.2, "استخراج سحابي…");
  const body = new FormData();
  body.append("file", prepared, "document.jpg");
  body.append("langs", langs);
  const res = await fetch("/api/ocr", { method: "POST", body });
  if (res.status === 501) return null;
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `فشل OCR السحابي (${res.status})`);
  }
  const data = (await res.json()) as {
    text?: string;
    langLabel?: string;
    provider?: string;
  };
  const text = (data.text || "").trim();
  if (!text) return null;
  onProgress?.(1, "تم");
  return {
    text,
    langUsed: langs === "auto" ? "cloud" : langs,
    langLabel: data.langLabel || "سحابي",
  };
}

async function prepareJpegForCloudOcr(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
      img.src = url;
    });
    const long = Math.max(img.naturalWidth, img.naturalHeight);
    const target = long < 900 ? Math.round(long * 5) : long < 1600 ? Math.round(long * 2.5) : Math.min(3600, long);
    const scale = target / long;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("فشل تصدير JPEG"))),
        "image/jpeg",
        0.92,
      );
    });
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** إزالة الخلفية في المتصفح — عبر imgly (نفس الأصل) مع احتياطي transformers */
export async function removeImageBackground(
  file: File,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  onProgress?.(0.03);
  try {
    return await removeBackgroundImgly(file, onProgress);
  } catch (imglyErr) {
    onProgress?.(0.08);
    try {
      return await removeBackgroundTransformers(file, onProgress);
    } catch {
      const msg =
        imglyErr instanceof Error ? imglyErr.message : "فشلت إزالة الخلفية";
      if (/failed to fetch|network|cors|load/i.test(msg)) {
        throw new Error(
          "تعذر تحميل نموذج إزالة الخلفية. تحقق من الاتصال وأعد المحاولة.",
        );
      }
      throw imglyErr instanceof Error
        ? imglyErr
        : new Error("فشلت إزالة الخلفية");
    }
  }
}

async function removeBackgroundImgly(
  file: File,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");
  const publicPath =
    typeof window !== "undefined"
      ? `${window.location.origin}/imgly-bg/`
      : "/imgly-bg/";
  onProgress?.(0.05);
  const blob = await removeBackground(file, {
    publicPath,
    model: "isnet_fp16",
    output: { format: "image/png", quality: 0.92 },
    progress: (_key, current, total) => {
      if (total > 0) onProgress?.(0.05 + 0.9 * Math.min(1, current / total));
    },
  });
  onProgress?.(1);
  return blob;
}

async function removeBackgroundTransformers(
  file: File,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  onProgress?.(0.12);
  const remover = await pipeline("background-removal", "Xenova/modnet", {
    device: "wasm",
    dtype: "fp32",
    progress_callback: (ev: { progress?: number; status?: string }) => {
      if (typeof ev.progress === "number") {
        onProgress?.(0.12 + 0.55 * Math.min(1, ev.progress / 100));
      }
    },
  });
  onProgress?.(0.72);
  const url = URL.createObjectURL(file);
  try {
    const raw = await remover(url);
    onProgress?.(0.9);
    const image = Array.isArray(raw) ? raw[0] : raw;
    if (!image || typeof image.toBlob !== "function") {
      throw new Error("لم يُرجع النموذج صورة صالحة");
    }
    const blob = await image.toBlob("image/png");
    onProgress?.(1);
    return blob as Blob;
  } finally {
    URL.revokeObjectURL(url);
  }
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

/** تلخيص استخراجي محلي منظّم: الهدف + أهم النقاط */
export function extractiveSummarize(text: string, maxPoints = 8): string {
  const cleaned = cleanArticleText(text);
  if (!cleaned) return "";

  const paragraphs = cleaned
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const sentences = cleaned
    .split(/(?<=[.!?؟。！？\n])\s+/)
    .map((s) => s.replace(/^[\s•\-–—*📌✔️🔹⚠️]+\s*/, "").trim())
    .filter((s) => s.length >= 25 && !isNoiseSentence(s));

  if (sentences.length === 0) {
    return cleaned.slice(0, 1200);
  }

  const title =
    paragraphs.find(
      (p) => p.length < 100 && /كيفية|كيف|دليل|خطوات|سيرة ذاتية|CV\b/i.test(p),
    ) ||
    paragraphs.find((p) => p.length < 90) ||
    paragraphs[0]?.slice(0, 90) ||
    "";

  const purposeCandidates = sentences.slice(0, 6).filter((s) =>
    /أول انطباع|من الضروري|يزيد من فرص|يساعد|الغرض|الهدف|دليل|ضروري|سواء كنت|إليك/i.test(
      s,
    ),
  );
  const purpose =
    purposeCandidates.slice(0, 2).join(" ") ||
    sentences.slice(0, 2).join(" ");

  const stop = new Set(
    "the a an and or but in on at to for of is are was were be this that it with as by from عن من في على إلى هذا هذه التي الذي كان تكون يكون ما لا لم لن إن أن أو ثم قد مثل مثلما".split(
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
    if (
      /هيكل|معلومات|خبرات|تعليم|مهارات|نصائح|أخطاء|الفرق|Resume|CV|ملخص|إنجاز|تخصيص|تدقيق|تنسيق/i.test(
        s,
      )
    ) {
      score += 18;
    }
    if (/مثال:|مثل:|✔️|استخدم|اذكر|تجنّب|تجنب|أضف/i.test(s)) score += 8;
    // تقليل تكرار جمل المقدمة الطويلة
    if (i < 2) score += 4;
    if (s.length > 280) score -= 8;
    return { s, score, i };
  });

  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const item of scored) {
    const key = item.s.slice(0, 48);
    if (seen.has(key)) continue;
    // لا تكرر جملة الهدف حرفياً
    if (purpose.includes(item.s.slice(0, 40))) continue;
    seen.add(key);
    picked.push(item.s);
    if (picked.length >= maxPoints) break;
  }
  picked.sort((a, b) => {
    const ia = sentences.indexOf(a);
    const ib = sentences.indexOf(b);
    return ia - ib;
  });

  const lines: string[] = [];
  if (title) lines.push(`الموضوع: ${title.replace(/^الموضوع:\s*/i, "")}`);
  lines.push("");
  lines.push("لماذا المقال موجود / الهدف:");
  lines.push(purpose);
  lines.push("");
  lines.push("أهم النقاط:");
  for (const p of picked) {
    lines.push(`• ${p}`);
  }
  if (picked.length === 0) {
    lines.push(`• ${sentences[0]}`);
  }
  return lines.join("\n").trim();
}

/** تنظيف نص المقال من ضوضاء فيسبوك/واجهات المواقع والكيانات */
export function cleanArticleText(raw: string): string {
  let t = raw
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/gi, " ");

  // قطع قسم التعليقات والتفاعلات إن وُجد
  t = t.replace(
    /\b(All reactions:|Most relevant|Like Comment|View more comments|Write a comment|التعليقات|أضف تعليقاً)[\s\S]*$/i,
    " ",
  );

  const noiseLine =
    /^(Facebook Log In|Shared with Public|Verified account|@highlight|Like|Comment|Share|Most relevant is selected|Log In|Sign Up|Follow|Translated|See more|See translation|\d+\s*(comments?|shares?|w|d|y|mo|h)\b)/i;

  const lines = t
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !noiseLine.test(l))
    .filter((l) => !/^\d+\s*$/.test(l))
    .filter((l) => !/^(?:[\u1000-\u109F\s]+)$/.test(l)); // أحرف بورمية عشوائية من واجهة فيسبوك

  t = lines.join("\n");

  // جمل ضوضاء داخل النص المتصل
  t = t
    .replace(/\bFacebook Log In\b/gi, " ")
    .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}'s Post\b/g, " ")
    .replace(/\bVerified account\b/gi, " ")
    .replace(/\bJanuary \d{1,2}, \d{4}\s*·\s*Shared with Public\b/gi, " ")
    .replace(/\bAll reactions:\s*\d+/gi, " ")
    .replace(/\b\d+\s*comments?\s+\d+\s*shares?\b/gi, " ")
    .replace(/\bLike\s+Comment\b/gi, " ")
    .replace(/\bMost relevant(?: is selected[^.]*\.)?/gi, " ")
    .replace(/\b@highlight\b/gi, " ")
    .replace(/\b\d+[wdhmy]\b/gi, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return t.slice(0, 60_000);
}

function isNoiseSentence(s: string): boolean {
  if (/Facebook|Log In|reactions|Most relevant|Like Comment|@highlight/i.test(s)) {
    return true;
  }
  // تعليق قصير باسم شخص
  if (s.length < 60 && /^(?:[\p{L}\s.'-]{2,40})\s+(?:شكرا|عايز|مساعدة|كيفاش|إلا)/u.test(s)) {
    return true;
  }
  const letters = (s.match(/\p{L}/gu) || []).length;
  return letters < 12;
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
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return cleanArticleText(stripped).slice(0, 60_000);
}
