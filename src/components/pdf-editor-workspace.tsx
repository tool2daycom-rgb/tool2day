"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import { basename, downloadBlob, toBlob } from "@/lib/processors/ffmpeg-client";

type Props = {
  title: string;
  description: string;
};

/** Always clone — pdf.js / workers detach ArrayBuffers. */
function cloneBytes(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.byteLength);
  out.set(data);
  return out;
}

let arabicFontCache: Uint8Array | null = null;

async function loadArabicFontBytes() {
  if (arabicFontCache) return cloneBytes(arabicFontCache);
  const urls = [
    `${typeof window !== "undefined" ? window.location.origin : ""}/fonts/NotoNaskhArabic-Regular.ttf`,
    "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Regular.ttf",
  ];
  for (const url of urls) {
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > 1000) {
        arabicFontCache = buf;
        return cloneBytes(buf);
      }
    } catch {
      /* try next */
    }
  }
  throw new Error("تعذر تحميل خط عربي — تحقق من الاتصال");
}

export function PdfEditorWorkspace({ title, description }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const bytesRef = useRef<Uint8Array | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
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

  const updateBytes = useCallback((next: Uint8Array) => {
    const cloned = cloneBytes(next);
    bytesRef.current = cloned;
    setBytes(cloned);
  }, []);

  const loadPreview = useCallback(async (data: Uint8Array, pageNum: number) => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    // Pass a fresh copy so the worker cannot detach our stored buffer
    const pdf = await pdfjs.getDocument({ data: cloneBytes(data) }).promise;
    const safePage = Math.min(Math.max(1, pageNum), pdf.numPages);
    const p = await pdf.getPage(safePage);
    const viewport = p.getViewport({ scale: 1.25 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await p.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    setPreviewUrl(canvas.toDataURL("image/png"));
    setPageCount(pdf.numPages);
  }, []);

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setError(null);
    setFile(f);
    const raw = new Uint8Array(await f.arrayBuffer());
    updateBytes(raw);
    setPage(1);
    setStatus("تم تحميل الملف");
    try {
      await loadPreview(raw, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    }
  }

  useEffect(() => {
    if (!bytes) return;
    void loadPreview(bytes, page).catch((err) => {
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    });
  }, [bytes, page, loadPreview]);

  async function withDoc(mutator: (doc: PDFDocument) => Promise<void> | void) {
    const current = bytesRef.current;
    if (!current) {
      setError("اختر ملف PDF أولاً");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(cloneBytes(current));
      doc.registerFontkit(fontkit);
      await mutator(doc);
      const out = await doc.save();
      updateBytes(out);
      const count = doc.getPageCount();
      setPageCount(count);
      setPage((p) => Math.min(p, count || 1));
      setStatus("تم تطبيق التعديل — راجع المعاينة ثم نزّل الملف");
    } catch (err) {
      console.error(err);
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
      const fontBytes = await loadArabicFontBytes();
      const font = await doc.embedFont(fontBytes, { subset: true });
      const { height } = target.getSize();
      const value = (text || " ").trim() || " ";
      target.drawText(value, {
        x: Number(posX) || 50,
        y: Math.max(20, height - (Number(posY) || 50)),
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
      const bytesImg = cloneBytes(new Uint8Array(await imgFile.arrayBuffer()));
      const image = imgFile.type.includes("png")
        ? await doc.embedPng(bytesImg)
        : await doc.embedJpg(bytesImg);
      const maxW = 180;
      const scale = Math.min(1, maxW / image.width);
      const { height } = target.getSize();
      target.drawImage(image, {
        x: Number(posX) || 50,
        y: height - (Number(posY) || 50) - image.height * scale,
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
    const current = bytesRef.current;
    if (!current || !file) {
      setError("لا يوجد ملف للتنزيل");
      return;
    }
    downloadBlob(
      toBlob(cloneBytes(current), "application/pdf"),
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
                {busy ? "جارٍ…" : "إضافة النص للصفحة الحالية"}
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
