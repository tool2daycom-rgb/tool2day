import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { basename, downloadBlob } from "./ffmpeg-client";

export async function mergePdfs(files: File[]) {
  if (files.length < 2) {
    throw new Error("اختر ملفين PDF على الأقل للدمج");
  }

  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const out = await merged.save();
  const copy = new Uint8Array(out);
  downloadBlob(
    new Blob([copy.buffer], { type: "application/pdf" }),
    "merged.pdf",
  );
}

export async function splitPdf(file: File, mode: "all" | "range", from = 1, to = 1) {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();

  if (mode === "range") {
    if (from < 1 || to > total || from > to) {
      throw new Error(`نطاق الصفحات غير صالح (1–${total})`);
    }

    const out = await PDFDocument.create();
    const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
    const pages = await out.copyPages(src, indices);
    pages.forEach((page) => out.addPage(page));
    const data = await out.save();
    const copy = new Uint8Array(data);
    downloadBlob(
      new Blob([copy.buffer], { type: "application/pdf" }),
      `${basename(file.name)}-p${from}-${to}.pdf`,
    );
    return;
  }

  const zip = new JSZip();
  for (let i = 0; i < total; i++) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    const data = await out.save();
    zip.file(`${basename(file.name)}-page-${i + 1}.pdf`, data);
  }

  const zipped = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipped, `${basename(file.name)}-pages.zip`);
}
