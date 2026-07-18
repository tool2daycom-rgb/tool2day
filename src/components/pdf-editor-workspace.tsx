"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import { basename, downloadBlob, toBlob } from "@/lib/processors/ffmpeg-client";

type Props = {
  title: string;
  description: string;
};

type Overlay =
  | {
      id: string;
      type: "text";
      text: string;
      fontSize: number;
      x: number;
      y: number;
    }
  | {
      id: string;
      type: "image";
      src: string;
      file: File;
      x: number;
      y: number;
      width: number;
      height: number;
    };

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
      /* next */
    }
  }
  throw new Error("تعذر تحميل خط عربي");
}

export function PdfEditorWorkspace({ title, description }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bytesRef = useRef<Uint8Array | null>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ w: 595, h: 842 });
  const [displaySize, setDisplaySize] = useState({ w: 1, h: 1 });
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("نص جديد");
  const [draftSize, setDraftSize] = useState("22");

  const updateBytes = useCallback((next: Uint8Array) => {
    const cloned = cloneBytes(next);
    bytesRef.current = cloned;
    setBytes(cloned);
  }, []);

  const loadPreview = useCallback(async (data: Uint8Array, pageNum: number) => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const pdf = await pdfjs.getDocument({ data: cloneBytes(data) }).promise;
    const safePage = Math.min(Math.max(1, pageNum), pdf.numPages);
    const p = await pdf.getPage(safePage);
    const base = p.getViewport({ scale: 1 });
    setPageSize({ w: base.width, h: base.height });
    const viewport = p.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await p.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    setPreviewUrl(canvas.toDataURL("image/png"));
    setDisplaySize({ w: viewport.width, h: viewport.height });
    setPageCount(pdf.numPages);
  }, []);

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setError(null);
    setFile(f);
    setOverlays([]);
    setSelectedId(null);
    const raw = new Uint8Array(await f.arrayBuffer());
    updateBytes(raw);
    setPage(1);
    setStatus("تم تحميل الملف — اسحب العناصر على الصفحة");
    try {
      await loadPreview(raw, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    }
  }

  useEffect(() => {
    if (!bytes) return;
    setOverlays([]);
    setSelectedId(null);
    void loadPreview(bytes, page).catch((err) => {
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    });
  }, [bytes, page, loadPreview]);

  function addTextOverlay() {
    if (!previewUrl) {
      setError("حمّل PDF أولاً");
      return;
    }
    const id = `t-${Date.now()}`;
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: draftText || "نص",
        fontSize: Number(draftSize) || 22,
        x: displaySize.w * 0.2,
        y: displaySize.h * 0.15,
      },
    ]);
    setSelectedId(id);
    setStatus("اسحب النص على الصفحة ثم اضغط تثبيت");
  }

  async function addImageOverlay(list: FileList | null) {
    const imgFile = list?.[0];
    if (!imgFile || !previewUrl) return;
    const src = URL.createObjectURL(imgFile);
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error("فشل قراءة الصورة"));
      img.src = src;
    });
    const maxW = Math.min(220, displaySize.w * 0.4);
    const scale = Math.min(1, maxW / dims.w);
    const id = `i-${Date.now()}`;
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "image",
        src,
        file: imgFile,
        x: displaySize.w * 0.25,
        y: displaySize.h * 0.2,
        width: dims.w * scale,
        height: dims.h * scale,
      },
    ]);
    setSelectedId(id);
    setStatus("اسحب الصورة على الصفحة ثم اضغط تثبيت");
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setSelectedId(id);
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const stageRect = stage.getBoundingClientRect();
    const x = e.clientX - stageRect.left - drag.offsetX;
    const y = e.clientY - stageRect.top - drag.offsetY;
    setOverlays((prev) =>
      prev.map((item) => {
        if (item.id !== drag.id) return item;
        const maxX =
          displaySize.w - (item.type === "image" ? item.width : 40);
        const maxY =
          displaySize.h - (item.type === "image" ? item.height : 24);
        return {
          ...item,
          x: Math.max(0, Math.min(maxX, x)),
          y: Math.max(0, Math.min(maxY, y)),
        };
      }),
    );
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
  }

  function removeSelected() {
    if (!selectedId) return;
    setOverlays((prev) => {
      const target = prev.find((o) => o.id === selectedId);
      if (target?.type === "image") URL.revokeObjectURL(target.src);
      return prev.filter((o) => o.id !== selectedId);
    });
    setSelectedId(null);
  }

  async function bakeOverlays() {
    const current = bytesRef.current;
    if (!current) {
      setError("اختر ملف PDF أولاً");
      return;
    }
    if (!overlays.length) {
      setError("أضف نصاً أو صورة أولاً ثم حرّكها");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const scaleX = pageSize.w / displaySize.w;
      const scaleY = pageSize.h / displaySize.h;
      const doc = await PDFDocument.load(cloneBytes(current));
      doc.registerFontkit(fontkit);
      const target = doc.getPage(page - 1);
      const { height } = target.getSize();
      const fontBytes = await loadArabicFontBytes();
      const font = await doc.embedFont(fontBytes, { subset: true });

      for (const item of overlays) {
        if (item.type === "text") {
          const pdfX = item.x * scaleX;
          const pdfY = height - item.y * scaleY - item.fontSize * scaleY;
          target.drawText(item.text, {
            x: pdfX,
            y: Math.max(8, pdfY),
            size: item.fontSize * scaleY,
            font,
            color: rgb(0.05, 0.05, 0.05),
          });
        } else {
          const imgBytes = cloneBytes(new Uint8Array(await item.file.arrayBuffer()));
          const image = item.file.type.includes("png")
            ? await doc.embedPng(imgBytes)
            : await doc.embedJpg(imgBytes);
          const w = item.width * scaleX;
          const h = item.height * scaleY;
          const pdfX = item.x * scaleX;
          const pdfY = height - item.y * scaleY - h;
          target.drawImage(image, {
            x: pdfX,
            y: Math.max(0, pdfY),
            width: w,
            height: h,
          });
          URL.revokeObjectURL(item.src);
        }
      }

      const out = await doc.save();
      updateBytes(out);
      setOverlays([]);
      setSelectedId(null);
      setStatus("تم تثبيت العناصر على الصفحة");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشل التثبيت");
    } finally {
      setBusy(false);
    }
  }

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
      updateBytes(await doc.save());
      setPageCount(doc.getPageCount());
      setPage((p) => Math.min(p, doc.getPageCount() || 1));
      setOverlays([]);
      setStatus("تم");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التعديل");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const current = bytesRef.current;
    if (!current || !file) {
      setError("لا يوجد ملف للتنزيل");
      return;
    }
    if (overlays.length) {
      setError("ثبّت العناصر على الصفحة قبل التنزيل");
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
        <p className="mt-1 text-xs text-[#888]">
          أضف نص/صورة ثم اسحبهم على المعاينة، وبعدين اضغط «تثبيت على الصفحة»
        </p>
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
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
                <div
                  ref={stageRef}
                  className="relative mx-auto touch-none select-none"
                  style={{ width: displaySize.w, height: displaySize.h }}
                  onPointerMove={onPointerMove}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`معاينة صفحة ${page}`}
                    className="pointer-events-none absolute inset-0 h-full w-full shadow"
                    draggable={false}
                  />
                  {overlays.map((item) => (
                    <div
                      key={item.id}
                      onPointerDown={(e) => onPointerDown(e, item.id)}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      className={`absolute cursor-move ${
                        selectedId === item.id
                          ? "ring-2 ring-[#2563eb] ring-offset-1"
                          : "ring-1 ring-black/20"
                      }`}
                      style={{
                        left: item.x,
                        top: item.y,
                        width: item.type === "image" ? item.width : undefined,
                        height: item.type === "image" ? item.height : undefined,
                      }}
                    >
                      {item.type === "text" ? (
                        <div
                          className="whitespace-pre rounded bg-white/70 px-1 py-0.5 font-semibold text-black shadow-sm"
                          style={{ fontSize: item.fontSize }}
                        >
                          {item.text}
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.src}
                          alt=""
                          className="h-full w-full object-contain"
                          draggable={false}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-[#888]">جاري المعاينة…</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[#eee] p-4">
              <p className="mb-3 text-sm font-semibold">إضافة نص قابل للسحب</p>
              <textarea
                className="mb-2 w-full rounded-md border border-[#ddd] px-3 py-2 text-sm"
                rows={2}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              <label className="mb-3 block text-xs">
                الحجم
                <input
                  className="mt-1 w-full rounded border border-[#ddd] px-2 py-1"
                  value={draftSize}
                  onChange={(e) => setDraftSize(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={addTextOverlay}
                className="w-full rounded-md bg-[#111] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                وضع النص على الصفحة
              </button>
            </div>

            <div className="rounded-lg border border-[#eee] p-4">
              <p className="mb-3 text-sm font-semibold">إضافة صورة قابلة للسحب</p>
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
                onChange={(e) => void addImageOverlay(e.target.files)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy || !overlays.length}
                onClick={() => void bakeOverlays()}
                className="col-span-2 rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "جارٍ التثبيت…" : "تثبيت العناصر على الصفحة"}
              </button>
              <button
                type="button"
                disabled={!selectedId}
                onClick={removeSelected}
                className="rounded-md border border-[#ddd] px-3 py-2 text-sm disabled:opacity-40"
              >
                حذف المحدد
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void withDoc(async (doc) => {
                    const target = doc.getPage(page - 1);
                    target.setRotation(
                      degrees((target.getRotation().angle + 90) % 360),
                    );
                  })
                }
                className="rounded-md border border-[#ddd] px-3 py-2 text-sm disabled:opacity-50"
              >
                تدوير 90°
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void withDoc(async (doc) => {
                    const ref = doc.getPage(page - 1);
                    const { width, height } = ref.getSize();
                    doc.insertPage(page, [width, height]);
                  })
                }
                className="rounded-md border border-[#ddd] px-3 py-2 text-sm disabled:opacity-50"
              >
                صفحة فارغة
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void withDoc(async (doc) => {
                    if (doc.getPageCount() <= 1) {
                      throw new Error("لا يمكن حذف الصفحة الوحيدة");
                    }
                    doc.removePage(page - 1);
                  })
                }
                className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
              >
                حذف الصفحة
              </button>
              <button
                type="button"
                disabled={busy || !bytes}
                onClick={download}
                className="col-span-2 rounded-md bg-[#2563eb] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
