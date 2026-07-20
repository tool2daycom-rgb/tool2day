import { basename, downloadBlob } from "./ffmpeg-client";

export async function convertImage(
  file: File,
  format: "jpeg" | "png" | "webp",
) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر فتح محرر الصور");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const mime =
    format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
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
