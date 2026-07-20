import { basename, downloadBlob } from "./ffmpeg-client";

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

  // تأكد من وجود xmlns لأبعاد صحيحة في المتصفح
  if (!/xmlns\s*=/.test(text)) {
    text = text.replace(
      /<svg\b/i,
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  // أبعاد افتراضية إن لم تُحدد
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
    // انتظر أبعاداً حقيقية (بعض المتصفحات تعطي 0 أولاً)
    if (!img.naturalWidth || !img.naturalHeight) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    if (!img.naturalWidth || !img.naturalHeight) {
      // فرض حجم عبر canvas من viewBox تقريبي
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

function sourceSize(source: CanvasImageSource): { w: number; h: number } {
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

export async function convertImage(
  file: File,
  format: "jpeg" | "png" | "webp",
) {
  if (!file || file.size === 0) {
    // بعض أنظمة الملفات تعرض SVG بحجم 0 رغم وجود محتوى
    if (!isSvgFile(file)) {
      throw new Error("الملف فارغ أو تالف — اختر صورة صالحة");
    }
  }

  const source = isSvgFile(file)
    ? await loadSvgAsImage(file)
    : await loadRasterAsImage(file);

  const { w, h } = sourceSize(source);
  if (!w || !h) {
    throw new Error("تعذّر تحديد أبعاد الصورة");
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر فتح محرر الصور");

  // خلفية بيضاء لـ JPEG (لا يدعم الشفافية)
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    source.close();
  }

  const mime =
    format === "png"
      ? "image/png"
      : format === "webp"
        ? "image/webp"
        : "image/jpeg";
  const quality = format === "png" ? undefined : 0.92;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل تحويل الصورة"))),
      mime,
      quality,
    );
  });

  const ext = format === "jpeg" ? "jpg" : format;
  await downloadBlob(blob, `${basename(file.name)}.${ext}`);
}
