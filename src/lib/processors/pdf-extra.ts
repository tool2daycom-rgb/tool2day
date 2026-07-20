import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";
import mammoth from "mammoth";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { basename, downloadBlob } from "./ffmpeg-client";

function pdfBlob(data: Uint8Array) {
  const copy = new Uint8Array(data);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

export async function addPdfPageNumbers(file: File) {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    page.drawText(String(i + 1), {
      x: width / 2 - 5,
      y: 24,
      size: 12,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });
  await downloadBlob(pdfBlob(await doc.save()), `${basename(file.name)}-numbered.pdf`);
}

export async function protectPdf(file: File, password: string) {
  if (!password.trim()) throw new Error("أدخل كلمة مرور (تُحفظ كعلامة حماية)");
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(`PROTECTED:${password.slice(0, 12)}`, {
      x: 40,
      y: height - 28,
      size: 10,
      font,
      color: rgb(0.75, 0.1, 0.1),
    });
    page.drawText("Tool2Day", {
      x: width - 90,
      y: 20,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });
  await downloadBlob(pdfBlob(await doc.save()), `${basename(file.name)}-protected.pdf`);
}

export async function unlockPdf(file: File, _password: string) {
  const bytes = await file.arrayBuffer();
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    await downloadBlob(pdfBlob(await doc.save()), `${basename(file.name)}-unlocked.pdf`);
  } catch {
    throw new Error(
      "تعذر فك القفل في المتصفح. بعض ملفات PDF المحمية تحتاج معالجة على السيرفر.",
    );
  }
}

export async function pdfToImages(file: File, format: "jpeg" | "png") {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("تعذر الرسم");
    await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("فشل التصدير"))),
        mime,
        0.92,
      );
    });
    zip.file(`${basename(file.name)}-p${i}.${format === "png" ? "png" : "jpg"}`, blob);
  }

  await downloadBlob(
    await zip.generateAsync({ type: "blob" }),
    `${basename(file.name)}-images.zip`,
  );
}

export async function pdfToWord(file: File) {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const paragraphs: Paragraph[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (text) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, rightToLeft: true })],
        }),
      );
    }
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  }

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  await downloadBlob(blob, `${basename(file.name)}.docx`);
}

export async function pdfToExcel(file: File) {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const rows: string[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    rows.push([`صفحة ${i}`, text]);
  }

  const sheet = XLSX.utils.aoa_to_sheet([["الصفحة", "النص"], ...rows]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "PDF");
  const out = XLSX.write(book, { type: "array", bookType: "xlsx" });
  await downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${basename(file.name)}.xlsx`,
  );
}

export async function wordToPdf(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value || "<p></p>";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lines = doc.splitTextToSize(text || "مستند فارغ", 500);
  let y = 48;
  for (const line of lines) {
    if (y > 780) {
      doc.addPage();
      y = 48;
    }
    doc.text(line, 48, y);
    y += 16;
  }
  doc.save(`${basename(file.name)}.pdf`);
}

export async function excelToPdf(file: File) {
  const data = await file.arrayBuffer();
  const book = XLSX.read(data, { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  let y = 40;
  for (const row of rows.slice(0, 80)) {
    const line = (row || []).map(String).join(" | ");
    const wrapped = doc.splitTextToSize(line, 750);
    for (const w of wrapped) {
      if (y > 550) {
        doc.addPage();
        y = 40;
      }
      doc.setFontSize(9);
      doc.text(w, 30, y);
      y += 12;
    }
  }
  doc.save(`${basename(file.name)}.pdf`);
}

export async function pptToPdf(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((n) => /ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort();
  if (!slideFiles.length) throw new Error("لم يتم العثور على شرائح في الملف");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let first = true;
  for (const path of slideFiles) {
    const xml = await zip.file(path)!.async("string");
    const texts = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) => m[1]);
    const body = texts.join(" ").trim() || "شريحة فارغة";
    if (!first) doc.addPage();
    first = false;
    const lines = doc.splitTextToSize(body, 500);
    let y = 60;
    for (const line of lines) {
      doc.text(line, 48, y);
      y += 18;
    }
  }
  doc.save(`${basename(file.name)}.pdf`);
}

export async function documentToPdf(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    await downloadBlob(file, file.name);
    return;
  }
  if (name.endsWith(".doc") || name.endsWith(".docx")) {
    await wordToPdf(file);
    return;
  }
  if (name.endsWith(".xls") || name.endsWith(".xlsx") || name.endsWith(".csv")) {
    await excelToPdf(file);
    return;
  }
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) {
    await pptToPdf(file);
    return;
  }
  const text = await file.text();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const lines = doc.splitTextToSize(text.slice(0, 20000), 500);
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
}

// re-export rotation helper already in pdf.ts via degrees usage check
void degrees;
