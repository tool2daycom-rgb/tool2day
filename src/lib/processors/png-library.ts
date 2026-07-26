export type PngLibraryItem = {
  id: string;
  source: "community" | "pixabay" | "openverse";
  title: string;
  previewUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  fileSize?: number;
  pageUrl?: string;
  tags?: string[];
};

export function formatBytes(n?: number) {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}

export async function readPngDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // PNG IHDR: width/height at bytes 16..23
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const view = new DataView(buf);
    return {
      width: view.getUint32(16),
      height: view.getUint32(20),
    };
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      URL.revokeObjectURL(url);
      if (!width || !height) reject(new Error("تعذّر قراءة أبعاد الصورة"));
      else resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("الملف ليس صورة PNG صالحة"));
    };
    img.src = url;
  });
}

/** هل للصورة شفافية حقيقية؟ (PNG شفاف جاهز — لا حاجة لقص AI) */
export async function imageHasTransparency(file: File): Promise<boolean> {
  const type = file.type || "";
  const name = file.name.toLowerCase();
  if (!type.includes("png") && !name.endsWith(".png")) return false;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const w = Math.min(img.naturalWidth || 0, 256);
        const h = Math.min(img.naturalHeight || 0, 256);
        if (!w || !h) {
          resolve(false);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(false);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let transparent = 0;
        const step = 16; // عيّنة سريعة
        for (let i = 3; i < data.length; i += 4 * step) {
          if ((data[i] ?? 255) < 250) transparent += 1;
        }
        // نسبة كافية من البكسلات الشفافة = PNG جاهز
        resolve(transparent > 8);
      } catch {
        resolve(false);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

export const PNG_ZIP_MAX = 50;

function safeFileName(title: string, index: number, ext = "png") {
  const base = (title || `image-${index}`)
    .replace(/[^\w\u0600-\u06FF\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${String(index).padStart(2, "0")}-${base || "image"}.${ext}`;
}

/** يبني ZIP من روابط الصور (حد أقصى PNG_ZIP_MAX) */
export async function buildPngZip(
  items: PngLibraryItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const list = items.slice(0, PNG_ZIP_MAX);
  let done = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i]!;
    try {
      const res = await fetch(item.downloadUrl || item.previewUrl);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const type = res.headers.get("content-type") || "";
      const ext = type.includes("jpeg") || type.includes("jpg") ? "jpg" : "png";
      zip.file(safeFileName(item.title, i + 1, ext), buf);
    } catch {
      // تجاهل الفاشل وأكمل
    }
    done += 1;
    onProgress?.(done, list.length);
  }
  const files = Object.keys(zip.files);
  if (!files.length) throw new Error("لم يُحمَّل أي ملف للضغط");
  return zip.generateAsync({ type: "blob" });
}
