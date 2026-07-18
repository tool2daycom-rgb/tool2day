import { PDFDocument, degrees } from "pdf-lib";
import JSZip from "jszip";
import { basename, downloadBlob } from "./ffmpeg-client";

function pdfBlob(data: Uint8Array) {
  const copy = new Uint8Array(data);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

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

  downloadBlob(pdfBlob(await merged.save()), "merged.pdf");
}

export async function splitPdf(
  file: File,
  mode: "all" | "range",
  from = 1,
  to = 1,
) {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();

  if (mode === "range") {
    if (from < 1 || to > total || from > to) {
      throw new Error(`نطاق الصفحات غير صالح (1–${total})`);
    }
    const out = await PDFDocument.create();
    const indices = Array.from(
      { length: to - from + 1 },
      (_, i) => from - 1 + i,
    );
    const pages = await out.copyPages(src, indices);
    pages.forEach((page) => out.addPage(page));
    downloadBlob(
      pdfBlob(await out.save()),
      `${basename(file.name)}-p${from}-${to}.pdf`,
    );
    return;
  }

  const zip = new JSZip();
  for (let i = 0; i < total; i++) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    zip.file(`${basename(file.name)}-page-${i + 1}.pdf`, await out.save());
  }
  downloadBlob(
    await zip.generateAsync({ type: "blob" }),
    `${basename(file.name)}-pages.zip`,
  );
}

export async function rotatePdf(file: File, angle: 90 | 180 | 270) {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  doc.getPages().forEach((page) => {
    page.setRotation(degrees(angle));
  });
  downloadBlob(pdfBlob(await doc.save()), `${basename(file.name)}-rotated.pdf`);
}

export async function compressPdf(file: File) {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  // Re-save strips some unused objects — light compression
  const out = await doc.save({ useObjectStreams: true });
  downloadBlob(pdfBlob(out), `${basename(file.name)}-compressed.pdf`);
}

export async function imagesToPdf(files: File[]) {
  if (!files.length) throw new Error("اختر صورة واحدة على الأقل");
  const doc = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const isPng = file.type.includes("png");
    const image = isPng
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  downloadBlob(pdfBlob(await doc.save()), "images.pdf");
}
