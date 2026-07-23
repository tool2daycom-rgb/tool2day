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

export type RemoveBgOptions = {
  /** إخراج الشخص فقط (بدون جدار/درابزين/أشياء) — افتراضي true */
  personOnly?: boolean;
};

/** إزالة خلفية عالية الجودة مع الحفاظ على ألوان الصورة الأصلية */
export async function removeImageBackground(
  file: File,
  onProgress?: (p: number) => void,
  opts: RemoveBgOptions = {},
): Promise<Blob> {
  const personOnly = opts.personOnly !== false;
  onProgress?.(0.02);

  const original = await loadImageElement(file);
  const w = original.naturalWidth;
  const h = original.naturalHeight;
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = w;
  srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true })!;
  srcCtx.drawImage(original, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, w, h);

  // RMBG أولاً لجودة أعلى، ثم imgly
  onProgress?.(0.06);
  let matte = await tryRmbgAlphaMask(file, w, h, onProgress);
  if (!matte) {
    onProgress?.(0.2);
    matte = await tryImglyAlphaMask(file, onProgress);
  }
  if (!matte) {
    throw new Error(
      "تعذر تحميل نموذج إزالة الخلفية. تحقق من الاتصال وأعد المحاولة.",
    );
  }

  onProgress?.(0.7);
  let alpha = resizeAlphaTo(matte.data, w, h, matte.width, matte.height);

  if (personOnly) {
    try {
      const person = await getPersonAlphaMask(original, w, h, onProgress);
      if (person) {
        alpha = combinePersonAndMatte(alpha, person, w, h);
      }
    } catch {
      /* إن فشل قناع الشخص نكمل بالمatte فقط */
    }
  } else {
    alpha = refineAlphaEdges(alpha, w, h);
  }

  onProgress?.(0.92);
  const out = applyAlphaToOriginal(srcData, alpha);
  onProgress?.(1);
  return canvasImageDataToPng(out);
}

type AlphaMask = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

async function tryImglyAlphaMask(
  file: File,
  onProgress?: (p: number) => void,
): Promise<AlphaMask | null> {
  try {
    const { segmentForeground } = await import("@imgly/background-removal");
    const publicPath =
      typeof window !== "undefined"
        ? `${window.location.origin}/imgly-bg/`
        : "/imgly-bg/";
    const maskBlob = await segmentForeground(file, {
      publicPath,
      model: "isnet",
      rescale: true,
      output: { format: "image/png", quality: 1 },
      progress: (_key, current, total) => {
        if (total > 0) onProgress?.(0.08 + 0.55 * Math.min(1, current / total));
      },
    });
    return await blobToAlphaMask(maskBlob);
  } catch {
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const publicPath =
        typeof window !== "undefined"
          ? `${window.location.origin}/imgly-bg/`
          : "/imgly-bg/";
      const fg = await removeBackground(file, {
        publicPath,
        model: "isnet_fp16",
        output: { format: "image/png", quality: 1 },
        progress: (_key, current, total) => {
          if (total > 0)
            onProgress?.(0.08 + 0.55 * Math.min(1, current / total));
        },
      });
      return await blobToAlphaMask(fg);
    } catch {
      return null;
    }
  }
}

async function tryRmbgAlphaMask(
  file: File,
  _w: number,
  _h: number,
  onProgress?: (p: number) => void,
): Promise<AlphaMask | null> {
  try {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    onProgress?.(0.25);
    const remover = await pipeline("background-removal", "briaai/RMBG-1.4", {
      device: "wasm",
    });
    onProgress?.(0.5);
    const url = URL.createObjectURL(file);
    try {
      const raw = await remover(url);
      const img = Array.isArray(raw) ? raw[0] : raw;
      if (!img) return null;
      const blob = await img.toBlob("image/png");
      onProgress?.(0.65);
      return await blobToAlphaMask(blob as Blob);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    try {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      const remover = await pipeline("background-removal", "Xenova/modnet", {
        device: "wasm",
        dtype: "fp32",
      });
      const url = URL.createObjectURL(file);
      try {
        const raw = await remover(url);
        const img = Array.isArray(raw) ? raw[0] : raw;
        if (!img) return null;
        const blob = await img.toBlob("image/png");
        return await blobToAlphaMask(blob as Blob);
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      return null;
    }
  }
}

let personSegmenterPromise: Promise<unknown> | null = null;

/**
 * يدمج قناع الشخص مع قناع الجودة:
 * - داخل الجسم: ألفا كاملة (لا ثقوب في القميص الداكن)
 * - الحواف: نعومة من نموذج الـ matte
 * - خارج الشخص: شفاف (يزيل الدرابزين)
 */
function combinePersonAndMatte(
  matte: Uint8ClampedArray,
  person: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  // عمليات الشكل على نسخة مصغّرة للسرعة ثم تكبير ناعم
  const mw = Math.min(512, w);
  const mh = Math.max(1, Math.round((h * mw) / w));
  let pSmall = resizeAlphaTo(person, mw, mh, w, h);
  for (let i = 0; i < pSmall.length; i++) {
    pSmall[i] = pSmall[i]! >= 110 ? 255 : 0;
  }
  pSmall = morphOpen(pSmall, mw, mh, 1);
  pSmall = morphClose(pSmall, mw, mh, 3);
  pSmall = dilateAlpha(pSmall, mw, mh, 1);

  const coreSmall = erodeAlpha(
    pSmall,
    mw,
    mh,
    Math.max(2, Math.round(Math.min(mw, mh) / 40)),
  );
  const softSmall = boxBlurAlpha(pSmall, mw, mh, 1);

  const softPerson = resizeAlphaTo(softSmall, w, h, mw, mh);
  const core = resizeAlphaTo(coreSmall, w, h, mw, mh);

  const out = new Uint8ClampedArray(w * h);
  for (let i = 0; i < out.length; i++) {
    const sp = softPerson[i]! / 255;
    if (core[i]! > 200) {
      out[i] = 255;
      continue;
    }
    if (sp < 0.06) {
      out[i] = 0;
      continue;
    }
    const m = matte[i]! / 255;
    const a = sp * Math.max(m, sp * 0.92);
    out[i] = Math.round(Math.max(0, Math.min(255, a * 255)));
  }
  return boxBlurAlpha(out, w, h, 1);
}

async function getPersonAlphaMask(
  img: HTMLImageElement,
  w: number,
  h: number,
  onProgress?: (p: number) => void,
): Promise<Uint8ClampedArray | null> {
  onProgress?.(0.78);
  const { ImageSegmenter, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );

  if (!personSegmenterPromise) {
    personSegmenterPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        outputCategoryMask: true,
        outputConfidenceMasks: true,
      });
    })().catch((e) => {
      personSegmenterPromise = null;
      throw e;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segmenter = (await personSegmenterPromise) as any;
  const result = segmenter.segment(img);

  // فضّل أقنعة الثقة الناعمة لفئات الشخص (1–4)، وتجاهل «أخرى» (5) والدرابزين
  const confMasks = result.confidenceMasks as
    | { width: number; height: number; getAsFloat32Array: () => Float32Array }[]
    | undefined;

  if (confMasks && confMasks.length >= 5) {
    const mw = confMasks[1]!.width;
    const mh = confMasks[1]!.height;
    const hair = confMasks[1]!.getAsFloat32Array();
    const body = confMasks[2]!.getAsFloat32Array();
    const face = confMasks[3]!.getAsFloat32Array();
    const clothes = confMasks[4]!.getAsFloat32Array();
    const person = new Uint8ClampedArray(mw * mh);
    for (let i = 0; i < person.length; i++) {
      const v = Math.max(
        hair[i] ?? 0,
        body[i] ?? 0,
        face[i] ?? 0,
        clothes[i] ?? 0,
      );
      // عتبة أعلى: تقلل التقاط الدرابزين/الجدار
      person[i] = v >= 0.42 ? Math.round(Math.min(1, v) * 255) : 0;
    }
    return resizeAlphaTo(person, w, h, mw, mh);
  }

  const cat = result.categoryMask;
  if (!cat) return null;
  const mw = cat.width as number;
  const mh = cat.height as number;
  const raw = cat.getAsUint8Array() as Uint8Array;
  const person = new Uint8ClampedArray(mw * mh);
  for (let i = 0; i < person.length; i++) {
    const c = raw[i]!;
    person[i] = c >= 1 && c <= 4 ? 255 : 0;
  }
  return resizeAlphaTo(person, w, h, mw, mh);
}

function morphOpen(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
): Uint8ClampedArray {
  return dilateAlpha(erodeAlpha(alpha, w, h, r), w, h, r);
}

function morphClose(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
): Uint8ClampedArray {
  return erodeAlpha(dilateAlpha(alpha, w, h, r), w, h, r);
}

function erodeAlpha(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
): Uint8ClampedArray {
  if (radius <= 0) return alpha;
  const out = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let min = 255;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
            min = 0;
            continue;
          }
          const v = alpha[ny * w + nx]!;
          if (v < min) min = v;
        }
      }
      out[y * w + x] = min;
    }
  }
  return out;
}

function boxBlurAlpha(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
): Uint8ClampedArray {
  if (radius <= 0) return alpha;
  const out = new Uint8ClampedArray(alpha.length);
  const area = (2 * radius + 1) ** 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const ny = Math.min(h - 1, Math.max(0, y + dy));
          sum += alpha[ny * w + nx]!;
        }
      }
      out[y * w + x] = Math.round(sum / area);
    }
  }
  return out;
}

function dilateAlpha(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let max = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const v = alpha[ny * w + nx]!;
          if (v > max) max = v;
        }
      }
      out[y * w + x] = max;
    }
  }
  return out;
}

function refineAlphaEdges(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  const blurred = new Uint8ClampedArray(alpha.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += alpha[(y + dy) * w + (x + dx)]!;
        }
      }
      blurred[y * w + x] = Math.round(sum / 9);
    }
  }
  for (let i = 0; i < w; i++) {
    blurred[i] = alpha[i]!;
    blurred[(h - 1) * w + i] = alpha[(h - 1) * w + i]!;
  }
  for (let y = 0; y < h; y++) {
    blurred[y * w] = alpha[y * w]!;
    blurred[y * w + w - 1] = alpha[y * w + w - 1]!;
  }
  const out = new Uint8ClampedArray(alpha.length);
  for (let i = 0; i < out.length; i++) {
    const v = blurred[i]! / 255;
    const t = v < 0.12 ? 0 : v > 0.88 ? 1 : (v - 0.12) / 0.76;
    const smooth = t * t * (3 - 2 * t);
    out[i] = Math.round(smooth * 255);
  }
  return out;
}

function applyAlphaToOriginal(
  src: ImageData,
  alpha: Uint8ClampedArray,
): ImageData {
  const out = new ImageData(src.width, src.height);
  const s = src.data;
  const d = out.data;
  for (let i = 0, p = 0; i < s.length; i += 4, p++) {
    d[i] = s[i]!;
    d[i + 1] = s[i + 1]!;
    d[i + 2] = s[i + 2]!;
    d[i + 3] = alpha[p]!;
  }
  return out;
}

async function canvasImageDataToPng(data: ImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d")!.putImageData(data, 0, 0);
  return canvasToBlob(canvas, "image/png", 1);
}

async function blobToAlphaMask(blob: Blob): Promise<AlphaMask> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("تعذر قراءة القناع"));
      img.src = url;
    });
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, width, height);
    const alpha = new Uint8ClampedArray(width * height);
    let hasAlpha = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) {
        hasAlpha = true;
        break;
      }
    }
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      alpha[p] = hasAlpha
        ? data[i + 3]!
        : Math.round(
            0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!,
          );
    }
    return { data: alpha, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function resizeAlphaTo(
  src: Uint8ClampedArray,
  dstW: number,
  dstH: number,
  srcW?: number,
  srcH?: number,
): Uint8ClampedArray {
  let sw = srcW;
  let sh = srcH;
  if (!sw || !sh) {
    const n = src.length;
    if (n === dstW * dstH) return src;
    sw = Math.round(Math.sqrt(n));
    sh = Math.max(1, Math.round(n / sw));
  }
  if (sw === dstW && sh === dstH) return src;

  const out = new Uint8ClampedArray(dstW * dstH);
  for (let y = 0; y < dstH; y++) {
    const sy = ((y + 0.5) * sh) / dstH - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < dstW; x++) {
      const sx = ((x + 0.5) * sw) / dstW - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;
      const v00 = src[y0 * sw + x0]!;
      const v10 = src[y0 * sw + x1]!;
      const v01 = src[y1 * sw + x0]!;
      const v11 = src[y1 * sw + x1]!;
      const v0 = v00 * (1 - fx) + v10 * fx;
      const v1 = v01 * (1 - fx) + v11 * fx;
      out[y * dstW + x] = Math.round(v0 * (1 - fy) + v1 * fy);
    }
  }
  return out;
}

/**
 * تكبير وتحسين جودة الصورة لأقصى حد ممكن حتى الضلع المستهدف (افتراضي 4K).
 * يفضّل Swin2SR (ذكاء اصطناعي) ثم يُكمَل بالتكبير عالي الجودة إن لزم.
 */
export async function upscaleImageTo4k(
  file: File,
  opts?: { targetLongEdge?: number; onProgress?: (p: number) => void },
): Promise<{ blob: Blob; width: number; height: number }> {
  const targetLong = opts?.targetLongEdge ?? 3840;
  const onProgress = opts?.onProgress;
  onProgress?.(0.04);

  try {
    const ai = await upscaleWithAiSr(file, targetLong, onProgress);
    if (ai) return ai;
  } catch {
    /* احتياطي canvas محسّن */
  }

  return upscaleCanvasMaxQuality(file, targetLong, onProgress);
}

async function upscaleWithAiSr(
  file: File,
  targetLong: number,
  onProgress?: (p: number) => void,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  const img = await loadImageElement(file);
  const srcLong = Math.max(img.naturalWidth, img.naturalHeight);
  // حدّ إدخال النموذج ليبقى الناتج ≈ الهدف دون نفاد الذاكرة
  const aiInLong = Math.min(srcLong, Math.max(512, Math.round(targetLong / 4)));
  const prep = await resizeImageToLongEdge(img, aiInLong);
  onProgress?.(0.12);

  const url = URL.createObjectURL(prep.blob);
  try {
    onProgress?.(0.15);
    // x4 مضغوط — توازن جودة/سرعة للمستعرض
    const upscaler = await pipeline(
      "image-to-image",
      "Xenova/swin2SR-compressed-sr-x4-48",
      {
        device: "wasm",
        dtype: "fp32",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (ev: any) => {
          if (typeof ev?.progress === "number") {
            onProgress?.(0.15 + 0.35 * Math.min(1, ev.progress / 100));
          }
        },
      },
    );
    onProgress?.(0.52);
    const out = await upscaler(url);
    const raw = Array.isArray(out) ? out[0] : out;
    if (!raw || typeof raw.toBlob !== "function") return null;

    let blob = (await raw.toBlob("image/png")) as Blob;
    let width = Number(raw.width) || prep.width * 4;
    let height = Number(raw.height) || prep.height * 4;
    onProgress?.(0.72);

    // إن بقي أصغر من الهدف: أكمل بتكبير عالي الجودة + تحسين
    const long = Math.max(width, height);
    if (long < targetLong * 0.98) {
      const el = await loadImageElement(
        new File([blob], "ai.png", { type: "image/png" }),
      );
      const finished = await canvasUpscaleEnhance(el, targetLong, (p) =>
        onProgress?.(0.72 + 0.22 * p),
      );
      blob = finished.blob;
      width = finished.width;
      height = finished.height;
    } else if (long > targetLong * 1.02) {
      const el = await loadImageElement(
        new File([blob], "ai.png", { type: "image/png" }),
      );
      const fitted = await resizeImageToLongEdge(el, targetLong);
      const canvas = document.createElement("canvas");
      canvas.width = fitted.width;
      canvas.height = fitted.height;
      const ctx = canvas.getContext("2d")!;
      const fittedImg = await loadImageElement(
        new File([fitted.blob], "fit.png", { type: "image/png" }),
      );
      ctx.drawImage(fittedImg, 0, 0);
      enhancePhotoCanvas(canvas);
      blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
      width = fitted.width;
      height = fitted.height;
    } else {
      const el = await loadImageElement(
        new File([blob], "ai.png", { type: "image/png" }),
      );
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(el, 0, 0);
      enhancePhotoCanvas(canvas);
      blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
    }

    onProgress?.(1);
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function upscaleCanvasMaxQuality(
  file: File,
  targetLong: number,
  onProgress?: (p: number) => void,
): Promise<{ blob: Blob; width: number; height: number }> {
  onProgress?.(0.1);
  const img = await loadImageElement(file);
  return canvasUpscaleEnhance(img, targetLong, onProgress);
}

async function canvasUpscaleEnhance(
  img: HTMLImageElement,
  targetLong: number,
  onProgress?: (p: number) => void,
): Promise<{ blob: Blob; width: number; height: number }> {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const long = Math.max(srcW, srcH);
  const scale = Math.max(1, targetLong / long);
  const dstW = Math.round(srcW * scale);
  const dstH = Math.round(srcH * scale);

  let cur = document.createElement("canvas");
  cur.width = srcW;
  cur.height = srcH;
  let ctx = cur.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0);
  onProgress?.(0.25);

  let w = srcW;
  let h = srcH;
  // خطوات ×1.5 ثم ×2 لأقل ضبابية من قفزة واحدة
  while (w < dstW - 1 || h < dstH - 1) {
    const step = w * 2 <= dstW && h * 2 <= dstH ? 2 : Math.min(2, Math.max(1.25, dstW / w));
    const nw = Math.min(dstW, Math.round(w * step));
    const nh = Math.min(dstH, Math.round(h * step));
    const next = document.createElement("canvas");
    next.width = nw;
    next.height = nh;
    const nctx = next.getContext("2d")!;
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = "high";
    nctx.drawImage(cur, 0, 0, nw, nh);
    // شحذ خفيف بين الخطوات للحفاظ على التفاصيل
    if (nw < dstW || nh < dstH) sharpenCanvas(next, 0.22);
    cur = next;
    w = nw;
    h = nh;
    onProgress?.(0.25 + 0.5 * (w / dstW));
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
  enhancePhotoCanvas(cur);
  onProgress?.(0.95);
  const blob = await canvasToBlob(cur, "image/jpeg", 0.95);
  onProgress?.(1);
  return { blob, width: dstW, height: dstH };
}

async function resizeImageToLongEdge(
  img: HTMLImageElement,
  targetLong: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const long = Math.max(srcW, srcH);
  if (long <= targetLong) {
    const c = document.createElement("canvas");
    c.width = srcW;
    c.height = srcH;
    c.getContext("2d")!.drawImage(img, 0, 0);
    return {
      blob: await canvasToBlob(c, "image/png"),
      width: srcW,
      height: srcH,
    };
  }
  const scale = targetLong / long;
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return { blob: await canvasToBlob(c, "image/png"), width: w, height: h };
}

/** تحسين وضوح وتباين وألوان بعد التكبير */
function enhancePhotoCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // تمديد تباين خفيف + تشبع
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  const span = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    let r = ((d[i]! - min) / span) * 255;
    let g = ((d[i + 1]! - min) / span) * 255;
    let b = ((d[i + 2]! - min) / span) * 255;
    // رفع تشبع طفيف
    const avg = (r + g + b) / 3;
    const sat = 1.12;
    r = avg + (r - avg) * sat;
    g = avg + (g - avg) * sat;
    b = avg + (b - avg) * sat;
    d[i] = Math.max(0, Math.min(255, r));
    d[i + 1] = Math.max(0, Math.min(255, g));
    d[i + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(img, 0, 0);
  sharpenCanvas(canvas, 0.45);
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
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 4; c++) {
      d[x * 4 + c] = s[x * 4 + c]!;
      d[((h - 1) * w + x) * 4 + c] = s[((h - 1) * w + x) * 4 + c]!;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 4; c++) {
      d[y * w * 4 + c] = s[y * w * 4 + c]!;
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
