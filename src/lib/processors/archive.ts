import { unzipSync, zipSync, strToU8 } from "fflate";
import { basename, downloadBlob } from "./ffmpeg-client";

export async function extractArchive(file: File) {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".zip")) {
    throw new Error("حالياً فك الضغط يدعم ZIP فقط. RAR/7Z تحتاج سيرفر.");
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  const files = unzipSync(buf);
  const outZip: Record<string, Uint8Array> = {};
  for (const [path, data] of Object.entries(files)) {
    if (data) outZip[path] = data;
  }
  // Re-pack as clean zip download of contents
  const packed = zipSync(outZip);
  await downloadBlob(
    new Blob([packed.buffer as ArrayBuffer], { type: "application/zip" }),
    `${basename(file.name)}-extracted.zip`,
  );
}

export async function convertArchiveToZip(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) {
    await downloadBlob(file, `${basename(file.name)}.zip`);
    return;
  }
  if (name.endsWith(".epub") || name.endsWith(".docx") || name.endsWith(".pptx")) {
    // these are already zip-based — save as .zip
    await downloadBlob(file, `${basename(file.name)}.zip`);
    return;
  }
  throw new Error("تحويل RAR/7Z إلى ZIP يحتاج معالجة على السيرفر.");
}

export async function ebookToPdfStub(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    await downloadBlob(file, file.name);
    return;
  }
  if (name.endsWith(".epub")) {
    const { unzipSync } = await import("fflate");
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const htmlParts: string[] = [];
    for (const [path, data] of Object.entries(files)) {
      if (/\.x?html?$/i.test(path) && data) {
        htmlParts.push(new TextDecoder().decode(data));
      }
    }
    const text = htmlParts
      .join("\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50000);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const lines = doc.splitTextToSize(text || "كتاب فارغ", 500);
    let y = 48;
    for (const line of lines) {
      if (y > 780) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, 48, y);
      y += 14;
    }
    doc.save(`${basename(file.name)}.pdf`);
    return;
  }
  throw new Error("الصيغة غير مدعومة حالياً (EPUB/PDF)");
}

export async function convertFont(file: File, target: "ttf" | "otf" | "woff") {
  // Browser cannot fully re-encode fonts; we deliver original bytes with new extension for compatible cases
  const buf = await file.arrayBuffer();
  await downloadBlob(
    new Blob([buf], { type: "font/" + target }),
    `${basename(file.name)}.${target}`,
  );
}

void strToU8;
