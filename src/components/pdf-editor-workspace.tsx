"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

type PdfWord = {
  id: string;
  str: string;
  /** viewport CSS pixels (top-left origin) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** PDF user space (bottom-left origin) */
  pdfX: number;
  pdfY: number;
  pdfW: number;
  pdfH: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const bytesRef = useRef<Uint8Array | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(
    null,
  );

  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ w: 595, h: 842 });
  const [displaySize, setDisplaySize] = useState({ w: 1, h: 1 });
  const [words, setWords] = useState<PdfWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<PdfWord | null>(null);
  const [replaceWith, setReplaceWith] = useState("");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("نص جديد");
  const [draftSize, setDraftSize] = useState("22");
  const [selectMode, setSelectMode] = useState(true);

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

    const containerW = containerRef.current?.clientWidth ?? 900;
    const scale = Math.min(2.2, Math.max(1.2, (containerW - 24) / base.width));
    const viewport = p.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await p.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    setPreviewUrl(canvas.toDataURL("image/png"));
    setDisplaySize({ w: viewport.width, h: viewport.height });
    setPageCount(pdf.numPages);

    const content = await p.getTextContent();
    const Util = pdfjs.Util;
    const nextWords: PdfWord[] = [];
    let i = 0;
    for (const item of content.items) {
      if (!("str" in item) || !item.str?.trim()) continue;
      const m = Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.hypot(m[2], m[3]);
      const width = (item.width || 0) * Math.hypot(m[0], m[1]) || fontHeight * item.str.length * 0.5;
      const height = fontHeight || 12;
      // viewport y is from top after transform in pdf.js default
      const x = m[4];
      const y = m[5] - height;

      // PDF space from unscaled viewport
      const pdfViewport = p.getViewport({ scale: 1 });
      const pm = Util.transform(pdfViewport.transform, item.transform);
      const pdfFontH = Math.hypot(pm[2], pm[3]) || 10;
      const pdfW =
        (item.width || 0) * Math.hypot(pm[0], pm[1]) || pdfFontH * item.str.length * 0.45;
      const pdfH = pdfFontH;
      const pdfX = pm[4];
      const pdfY = pm[5] - pdfH;

      nextWords.push({
        id: `w-${safePage}-${i++}`,
        str: item.str,
        x,
        y,
        w: Math.max(width, 8),
        h: Math.max(height, 8),
        pdfX,
        pdfY,
        pdfW: Math.max(pdfW, 6),
        pdfH: Math.max(pdfH, 6),
      });
    }
    setWords(nextWords);
    setSelectedWord(null);
  }, []);

  async function onPick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setError(null);
    setFile(f);
    setOverlays([]);
    setSelectedId(null);
    setSelectedWord(null);
    const raw = new Uint8Array(await f.arrayBuffer());
    updateBytes(raw);
    setPage(1);
    setStatus("اضغط على كلمة في الصفحة لتحديدها واستبدالها");
    try {
      await loadPreview(raw, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    }
  }

  useEffect(() => {
    if (!bytes) return;
    setOverlays([]);
    setSelectedWord(null);
    void loadPreview(bytes, page).catch((err) => {
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    });
  }, [bytes, page, loadPreview]);

  function addTextOverlay() {
    if (!previewUrl) return;
    const id = `t-${Date.now()}`;
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: draftText || "نص",
        fontSize: Number(draftSize) || 22,
        x: displaySize.w * 0.2,
        y: displaySize.h * 0.12,
      },
    ]);
    setSelectedId(id);
    setSelectMode(false);
    setStatus("اسحب النص ثم اضغط تثبيت");
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
    const maxW = Math.min(260, displaySize.w * 0.35);
    const scale = Math.min(1, maxW / dims.w);
    const id = `i-${Date.now()}`;
    setOverlays((prev) => [
      ...prev,
      {
        id,
        type: "image",
        src,
        file: imgFile,
        x: displaySize.w * 0.2,
        y: displaySize.h * 0.15,
        width: dims.w * scale,
        height: dims.h * scale,
      },
    ]);
    setSelectedId(id);
    setSelectMode(false);
    setStatus("اسحب الصورة ثم اضغط تثبيت");
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
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
        const maxX = displaySize.w - (item.type === "image" ? item.width : 40);
        const maxY = displaySize.h - (item.type === "image" ? item.height : 24);
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
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
  }

  async function replaceSelectedWord() {
    const current = bytesRef.current;
    if (!current || !selectedWord) {
      setError("حدّد كلمة من الصفحة أولاً");
      return;
    }
    const nextText = replaceWith.trim();
    if (!nextText) {
      setError("اكتب الكلمة البديلة");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(cloneBytes(current));
      doc.registerFontkit(fontkit);
      const target = doc.getPage(page - 1);
      const pad = 1.5;
      // Cover old word
      target.drawRectangle({
        x: selectedWord.pdfX - pad,
        y: selectedWord.pdfY - pad,
        width: selectedWord.pdfW + pad * 2,
        height: selectedWord.pdfH + pad * 2,
        color: rgb(1, 1, 1),
        borderWidth: 0,
      });
      const fontBytes = await loadArabicFontBytes();
      const font = await doc.embedFont(fontBytes, { subset: true });
      const size = Math.max(8, selectedWord.pdfH * 0.9);
      target.drawText(nextText, {
        x: selectedWord.pdfX,
        y: selectedWord.pdfY + selectedWord.pdfH * 0.15,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      updateBytes(await doc.save());
      setSelectedWord(null);
      setReplaceWith("");
      setStatus(`تم استبدال «${selectedWord.str}» بـ «${nextText}»`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشل الاستبدال");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelectedWord() {
    const current = bytesRef.current;
    if (!current || !selectedWord) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(cloneBytes(current));
      const target = doc.getPage(page - 1);
      const pad = 1.5;
      target.drawRectangle({
        x: selectedWord.pdfX - pad,
        y: selectedWord.pdfY - pad,
        width: selectedWord.pdfW + pad * 2,
        height: selectedWord.pdfH + pad * 2,
        color: rgb(1, 1, 1),
        borderWidth: 0,
      });
      updateBytes(await doc.save());
      setStatus(`تم حذف «${selectedWord.str}»`);
      setSelectedWord(null);
      setReplaceWith("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الحذف");
    } finally {
      setBusy(false);
    }
  }

  async function bakeOverlays() {
    const current = bytesRef.current;
    if (!current) return;
    if (!overlays.length) {
      setError("لا توجد عناصر للتثبيت");
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
          target.drawText(item.text, {
            x: item.x * scaleX,
            y: Math.max(8, height - item.y * scaleY - item.fontSize * scaleY),
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
          target.drawImage(image, {
            x: item.x * scaleX,
            y: Math.max(0, height - item.y * scaleY - h),
            width: w,
            height: h,
          });
          URL.revokeObjectURL(item.src);
        }
      }
      updateBytes(await doc.save());
      setOverlays([]);
      setSelectedId(null);
      setStatus("تم تثبيت العناصر");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التثبيت");
    } finally {
      setBusy(false);
    }
  }

  async function withDoc(mutator: (doc: PDFDocument) => Promise<void> | void) {
    const current = bytesRef.current;
    if (!current) return;
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
      setSelectedWord(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التعديل");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const current = bytesRef.current;
    if (!current || !file) return;
    if (overlays.length) {
      setError("ثبّت العناصر قبل التنزيل");
      return;
    }
    downloadBlob(
      toBlob(cloneBytes(current), "application/pdf"),
      `${basename(file.name)}-edited.pdf`,
    );
    setStatus("تم التنزيل");
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 sm:p-6">
      <div className="mb-4">
        <p className="text-lg font-semibold text-[#111]">{title}</p>
        <p className="mt-1 text-sm leading-7 text-[#666]">{description}</p>
        <p className="mt-1 text-xs text-[#888]">
          اضغط على أي كلمة في الصفحة لتحديدها، ثم احذفها أو استبدلها. للنص/الصورة
          الجديدة: ضعها واسحبها ثم ثبّت.
        </p>
      </div>

      {!file ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-[#d4d4d4] bg-[#fafafa] px-4 text-center">
          <p className="font-semibold text-[#111]">اختر ملف PDF للتعديل</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white"
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div ref={containerRef} className="min-w-0">
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
                onClick={() => setSelectMode((v) => !v)}
                className={`rounded px-3 py-1 text-sm font-semibold ${
                  selectMode
                    ? "bg-[#2563eb] text-white"
                    : "border border-[#ddd] text-[#444]"
                }`}
              >
                {selectMode ? "وضع تحديد الكلمات: تشغيل" : "وضع تحديد الكلمات: إيقاف"}
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

            <div className="max-h-[78vh] overflow-auto rounded-lg border border-[#e5e5e5] bg-[#ececec] p-3">
              {previewUrl ? (
                <div
                  ref={stageRef}
                  className="relative mx-auto touch-none"
                  style={{ width: displaySize.w, height: displaySize.h }}
                  onPointerMove={onPointerMove}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`معاينة صفحة ${page}`}
                    className="pointer-events-none absolute inset-0 h-full w-full shadow-lg"
                    draggable={false}
                  />

                  {selectMode &&
                    words.map((word) => (
                      <button
                        key={word.id}
                        type="button"
                        title={word.str}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWord(word);
                          setReplaceWith(word.str);
                          setStatus(`محددة: «${word.str}»`);
                        }}
                        className={`absolute cursor-text rounded-[2px] transition ${
                          selectedWord?.id === word.id
                            ? "bg-[#2563eb]/35 ring-2 ring-[#2563eb]"
                            : "hover:bg-[#f59e0b]/35"
                        }`}
                        style={{
                          left: word.x,
                          top: word.y,
                          width: word.w,
                          height: word.h,
                        }}
                      />
                    ))}

                  {overlays.map((item) => (
                    <div
                      key={item.id}
                      onPointerDown={(e) => onPointerDown(e, item.id)}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      className={`absolute cursor-move ${
                        selectedId === item.id
                          ? "ring-2 ring-[#2563eb]"
                          : "ring-1 ring-black/25"
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
                          className="whitespace-pre rounded bg-white/80 px-1 py-0.5 font-semibold text-black"
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
                <p className="py-24 text-center text-sm text-[#888]">جاري المعاينة…</p>
              )}
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <div className="rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-4">
              <p className="mb-2 text-sm font-semibold text-[#1e3a8a]">
                استبدال كلمة من الصفحة
              </p>
              {selectedWord ? (
                <>
                  <p className="mb-2 text-sm text-[#334155]">
                    المحددة:{" "}
                    <span className="font-bold text-[#0f172a]">{selectedWord.str}</span>
                  </p>
                  <input
                    className="mb-2 w-full rounded-md border border-[#bfdbfe] px-3 py-2 text-sm"
                    value={replaceWith}
                    onChange={(e) => setReplaceWith(e.target.value)}
                    placeholder="الكلمة الجديدة"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void replaceSelectedWord()}
                      className="rounded-md bg-[#2563eb] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      استبدال
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteSelectedWord()}
                      className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm leading-7 text-[#475569]">
                  فعّل «وضع تحديد الكلمات» ثم اضغط على كلمة داخل الصفحة.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[#eee] p-4">
              <p className="mb-2 text-sm font-semibold">نص جديد (قابل للسحب)</p>
              <textarea
                className="mb-2 w-full rounded-md border border-[#ddd] px-3 py-2 text-sm"
                rows={2}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              <input
                className="mb-2 w-full rounded border border-[#ddd] px-2 py-1 text-sm"
                value={draftSize}
                onChange={(e) => setDraftSize(e.target.value)}
                placeholder="الحجم"
              />
              <button
                type="button"
                disabled={busy}
                onClick={addTextOverlay}
                className="w-full rounded-md bg-[#111] px-3 py-2 text-sm font-semibold text-white"
              >
                وضع النص على الصفحة
              </button>
            </div>

            <div className="rounded-lg border border-[#eee] p-4">
              <p className="mb-2 text-sm font-semibold">صورة قابلة للسحب</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => imageRef.current?.click()}
                className="w-full rounded-md border border-[#ddd] px-3 py-2 text-sm font-semibold"
              >
                اختيار صورة
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
                تثبيت العناصر المضافة
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void withDoc(async (doc) => {
                    const t = doc.getPage(page - 1);
                    t.setRotation(degrees((t.getRotation().angle + 90) % 360));
                  })
                }
                className="rounded-md border border-[#ddd] px-3 py-2 text-sm"
              >
                تدوير 90°
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
                className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700"
              >
                حذف الصفحة
              </button>
              <button
                type="button"
                disabled={busy || !bytes}
                onClick={download}
                className="col-span-2 rounded-md bg-[#2563eb] px-3 py-2.5 text-sm font-semibold text-white"
              >
                تنزيل PDF
              </button>
            </div>
          </aside>
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
