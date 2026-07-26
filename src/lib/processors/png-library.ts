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
