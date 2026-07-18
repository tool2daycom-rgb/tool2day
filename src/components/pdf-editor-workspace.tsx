"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { basename, downloadBlob } from "@/lib/processors/ffmpeg-client";

type Props = {
  title: string;
  description: string;
};

export function PdfEditorWorkspace({ title, description }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [text, setText] = useState("نص جديد");
  const [fontSize, setFontSize] = useState("18");
  const [posX, setPosX] = useState("50");
  const [posY, setPosY] = useState("50");

  const loadPreview = useCallback(async (data: ArrayBuffer, pageNum: number) => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
    const p = await pdf.getPage(Math.min(Math.max(1, pageNum), pdf.numPages));
    const viewport = p.getViewport({ scale: 1.25 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await p.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    const url = canvas.toDataURL("image/png");
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    setPageCount(pdf.numPages);
  }, []);

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setError(null);
    setFile(f);
    const buf = await f.arrayBuffer();
    setBytes(buf.slice(0));
    setPage(1);
    setStatus("تم تحميل الملف");
    await loadPreview(buf, 1);
  }

  useEffect(() => {
    if (!bytes) return;
    void loadPreview(bytes, page).catch((err) => {
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    });
  }, [bytes, page, loadPreview]);

  async function withDoc(mutator: (doc: PDFDocument) => Promise<void> | void) {
    if (!bytes) {
      setError("اختر ملف PDF أولاً");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(bytes.slice(0));
      await mutator(doc);
      const out = await doc.save();
      const copy = new Uint8Array(out);
      const next = copy.buffer.slice(
        copy.byteOffset,
        copy.byteOffset + copy.byteLength,
      );
      setBytes(next);
      setPageCount(doc.getPageCount());
      setPage((p) => Math.min(p, doc.getPageCount() || 1));
      setStatus("تم تطبيق التعديل — يمكنك المتابعة أو التنزيل");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التعديل");
    } finally {
      setBusy(false);
    }
  }

  async function addText() {
    await withDoc(async (doc) => {
      const pages = doc.getPages();
      const target = pages[page - 1];
      if (!target) throw new Error("رقم الصفحة غير صالح");
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const { height } = target.getSize();
      target.drawText(text || " ", {
        x: Number(posX) || 50,
        y: height - (Number(posY) || 50),
        size: Number(fontSize) || 18,
        font,
        color: rgb(0.05, 0.05, 0.05),
      });
    });
  }

  async function addImage(list: FileList | null) {
    const imgFile = list?.[0];
    if (!imgFile) return;
    await withDoc(async (doc) => {
      const pages = doc.getPages();
      const target = pages[page - 1];
      if (!target) throw new Error("رقم الصفحة غير صالح");
      const bytesImg = await imgFile.arrayBuffer();
      const image = imgFile.type.includes("png")
        ? await doc.embedPng(bytesImg)
        : await doc.embedJpg(bytesImg);
      const maxW = 180;
      const scale = Math.min(1, maxW / image.width);
      target.drawImage(image, {
        x: Number(posX) || 50,
        y: target.getSize().height - (Number(posY) || 50) - image.height * scale,
        width: image.width * scale,
        height: image.height * scale,
      });
    });
  }

  async function rotatePage() {
    await withDoc(async (doc) => {
      const target = doc.getPage(page - 1);
      const current = target.getRotation().angle;
      target.setRotation(degrees((current + 90) % 360));
    });
  }

  async function deletePage() {
    await withDoc(async (doc) => {
      if (doc.getPageCount() <= 1) {
        throw new Error("لا يمكن حذف الصفحة الوحيدة");
      }
      doc.removePage(page - 1);
    });
  }

  async function insertBlank() {
    await withDoc(async (doc) => {
      const ref = doc.getPage(page - 1);
      const { width, height } = ref.getSize();
      doc.insertPage(page, [width, height]);
    });
  }

  function download() {
    if (!bytes || !file) {
      setError("لا يوجد ملف للتنزيل");
      return;
    }
    downloadBlob(
      new Blob([bytes], { type: "application/pdf" }),
      `${basename(file.name)}-edited.pdf`,
    );
    setStatus("تم التنزيل");
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-8">
      <div className="mb-4">
        <p className="text-base font-semibold text-[#111]">{title}</p>
        <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
      </div>

      {!file ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[#d4d4d4] bg-[#fafafa] px-4 text-center">
          <p className="font-semibold text-[#111]">اختر ملف PDF للتعديل</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            اختيار PDF
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void onPick(e.target.files)}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                disabled={page <= 1 || busy}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-[#ddd] px-3 py-1 disabled:opacity-40"
              >
                السابق
              </button>
              <span>
                صفحة {page} / {pageCount || "—"}
              </span>
              <button
                type="button"
                disabled={page >= pageCount || busy}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="rounded border border-[#ddd] px-3 py-1 disabled:opacity-40"
              >
                التالي
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="ms-auto text-[#2563eb] hover:underline"
              >
                ملف آخر
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => void onPick(e.target.files)}
              />
            </div>
            <div className="overflow-auto rounded-lg border border-[#e5e5e5] bg-[#f3f3f3] p-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={`معاينة صفحة ${page}`}
                  className="mx-auto max-w-full shadow"
                />
              ) : (
                <p className="py-16 text-center text-sm text-[#888]">جاري المعاينة…</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[#eee] p-4">
              <p className="mb-3 text-sm font-semibold">إضافة نص</p>
              <textarea
                className="mb-2 w-full rounded-md border border-[#ddd] px-3 py-2 text-sm"
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs">
                  الحجم
                  <input
                    className="mt-1 w-full rounded border border-[#ddd] px-2 py-1"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  X
                  <input
                    className="mt-1 w-full rounded border border-[#ddd] px-2 py-1"
                    value={posX}
                    onChange={(e) => setPosX(e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  Y من الأعلى
                  <input
                    className="mt-1 w-full rounded border border-[#ddd] px-2 py-1"
                    value={posY}
                    onChange={(e) => setPosY(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void addText()}
                className="mt-3 w-full rounded-md bg-[#111] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                إضافة النص للصفحة الحالية
              </button>
            </div>

            <div className="rounded-lg border border-[#eee] p-4">
              <p className="mb-3 text-sm font-semibold">إضافة صورة</p>
              <p className="mb-2 text-xs text-[#777]">
                تستخدم نفس موضع X / Y أعلاه
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => imageRef.current?.click()}
                className="w-full rounded-md border border-[#ddd] px-3 py-2 text-sm font-semibold hover:bg-[#fafafa] disabled:opacity-50"
              >
                اختيار صورة (JPG/PNG)
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => void addImage(e.target.files)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void rotatePage()}
                className="rounded-md border border-[#ddd] px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                تدوير الصفحة 90°
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void insertBlank()}
                className="rounded-md border border-[#ddd] px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                إدراج صفحة فارغة
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void deletePage()}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                حذف الصفحة
              </button>
              <button
                type="button"
                disabled={busy || !bytes}
                onClick={download}
                className="rounded-md bg-[#2563eb] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                تنزيل PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {status && <p className="mt-4 text-sm text-emerald-700">{status}</p>}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
