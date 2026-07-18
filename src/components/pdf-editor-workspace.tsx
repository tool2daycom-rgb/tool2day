"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
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

type SelectedWord = {
  str: string;
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

function hasArabic(s: string) {
  return /[\u0600-\u06FF]/.test(s);
}

let arabicFontCache: Uint8Array | null = null;

async function loadArabicFontBytes() {
  if (arabicFontCache) return cloneBytes(arabicFontCache);
  const url = `${window.location.origin}/fonts/NotoNaskhArabic-Regular.ttf`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("تعذر تحميل الخط العربي");
  const buf = new Uint8Array(await res.arrayBuffer());
  arabicFontCache = buf;
  return cloneBytes(buf);
}

export function PdfEditorWorkspace({ title, description }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bytesRef = useRef<Uint8Array | null>(null);
  const pageSizeRef = useRef({ w: 595, h: 842 });
  const displaySizeRef = useRef({ w: 1, h: 1 });
  const loadIdRef = useRef(0);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(
    null,
  );

  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displaySize, setDisplaySize] = useState({ w: 1, h: 1 });
  const [pageSize, setPageSize] = useState({ w: 595, h: 842 });
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [replaceWith, setReplaceWith] = useState("");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("نص جديد");
  const [draftSize, setDraftSize] = useState("22");
  const [selectMode, setSelectMode] = useState(true);
  const selectModeRef = useRef(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    selectModeRef.current = selectMode;
    const layer = textLayerRef.current;
    if (layer) {
      layer.style.opacity = selectMode ? "1" : "0";
      layer.style.pointerEvents = selectMode ? "auto" : "none";
    }
  }, [selectMode]);

  // If React removes the imperatively mounted text layer, put it back.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const layer = textLayerRef.current;
    if (stage && layer && !stage.contains(layer)) {
      stage.appendChild(layer);
    }
  });

  const updateBytes = useCallback((next: Uint8Array) => {
    const cloned = cloneBytes(next);
    bytesRef.current = cloned;
    setBytes(cloned);
    setRevision((r) => r + 1);
  }, []);

  const selectSpan = useCallback((el: HTMLElement, all: HTMLElement[]) => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = r.left - stageRect.left;
    const y = r.top - stageRect.top;
    const w = Math.max(r.width, 4);
    const h = Math.max(r.height, 4);
    const sx = pageSizeRef.current.w / displaySizeRef.current.w;
    const sy = pageSizeRef.current.h / displaySizeRef.current.h;
    const str = (el.textContent || "").trim();
    if (!str) return;

    const word: SelectedWord = {
      str,
      pdfX: x * sx,
      pdfY: pageSizeRef.current.h - (y + h) * sy,
      pdfW: w * sx,
      pdfH: h * sy,
    };
    setSelectedWord(word);
    setReplaceWith(str);
    setStatus(`تم تحديد: «${str}» — اكتب البديل ثم اضغط استبدال أو حذف`);
    all.forEach((s) => s.classList.remove("pdf-word-selected"));
    el.classList.add("pdf-word-selected");
  }, []);

  const loadPreview = useCallback(
    async (data: Uint8Array, pageNum: number) => {
      const loadId = ++loadIdRef.current;
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjs.getDocument({ data: cloneBytes(data) }).promise;
      if (loadId !== loadIdRef.current) return;

      const safePage = Math.min(Math.max(1, pageNum), pdf.numPages);
      const pdfPage = await pdf.getPage(safePage);
      const base = pdfPage.getViewport({ scale: 1 });
      pageSizeRef.current = { w: base.width, h: base.height };
      setPageSize({ w: base.width, h: base.height });

      const containerW = containerRef.current?.clientWidth ?? 1000;
      const scale = Math.min(2.4, Math.max(1.35, (containerW - 32) / base.width));
      const viewport = pdfPage.getViewport({ scale });
      displaySizeRef.current = { w: viewport.width, h: viewport.height };
      setDisplaySize({ w: viewport.width, h: viewport.height });
      setPageCount(pdf.numPages);

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await pdfPage.render({ canvasContext: ctx, viewport, canvas } as never).promise;
      if (loadId !== loadIdRef.current) return;
      setPreviewUrl(canvas.toDataURL("image/png"));
      setSelectedWord(null);

      // Mount text layer as a real DOM node under the stage (not via React children)
      // so later setState re-renders don't wipe the clickable spans.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const stage = stageRef.current;
      if (!stage || loadId !== loadIdRef.current) return;

      let layerEl = textLayerRef.current;
      if (!layerEl || !stage.contains(layerEl)) {
        layerEl = document.createElement("div");
        layerEl.className = "textLayer";
        stage.appendChild(layerEl);
        textLayerRef.current = layerEl;
      }

      layerEl.replaceChildren();
      layerEl.style.width = `${viewport.width}px`;
      layerEl.style.height = `${viewport.height}px`;
      layerEl.style.opacity = selectModeRef.current ? "1" : "0";
      layerEl.style.pointerEvents = selectModeRef.current ? "auto" : "none";
      layerEl.style.setProperty("--total-scale-factor", String(scale));
      layerEl.style.setProperty("--scale-round-x", "1px");
      layerEl.style.setProperty("--scale-round-y", "1px");

      const textContent = await pdfPage.getTextContent({
        includeMarkedContent: true,
        disableNormalization: false,
      });
      const textLayer = new pdfjs.TextLayer({
        textContentSource: textContent,
        container: layerEl,
        viewport,
      });
      await textLayer.render();
      if (loadId !== loadIdRef.current) return;

      const spans = textLayer.textDivs.filter((d) => (d.textContent || "").trim());
      spans.forEach((span) => {
        span.style.cursor = "pointer";
        span.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (!selectModeRef.current) return;
          selectSpan(span, spans);
        };
      });

      if (!spans.length) {
        setStatus("هذه الصفحة بلا نص قابل للتحديد — جرّب إضافة نص جديد");
      }
    },
    [selectSpan],
  );

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
    setStatus("اضغط مباشرة على كلمة في الصفحة لتحديدها");
  }

  useEffect(() => {
    if (!bytes) return;
    setOverlays([]);
    void loadPreview(bytes, page).catch((err) => {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشل المعاينة");
    });
  }, [bytes, page, revision, loadPreview]);

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
        x: displaySize.w * 0.15,
        y: displaySize.h * 0.12,
      },
    ]);
    setSelectedId(id);
    setSelectMode(false);
    setStatus("اسحب النص ثم اضغط تثبيت العناصر");
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
    const maxW = Math.min(280, displaySize.w * 0.35);
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

  async function embedFontFor(doc: PDFDocument, text: string) {
    if (hasArabic(text)) {
      return doc.embedFont(await loadArabicFontBytes(), { subset: true });
    }
    return doc.embedFont(StandardFonts.Helvetica);
  }

  async function paintWordCover(
    doc: PDFDocument,
    word: SelectedWord,
    nextText: string | null,
  ) {
    doc.registerFontkit(fontkit);
    const target = doc.getPage(page - 1);
    const { width, height } = target.getSize();
    const sx = width / pageSizeRef.current.w;
    const sy = height / pageSizeRef.current.h;
    const pad = 3;
    const x = word.pdfX * sx - pad;
    const y = word.pdfY * sy - pad;
    const w = word.pdfW * sx + pad * 2;
    const h = word.pdfH * sy + pad * 2;

    target.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    if (nextText) {
      const font = await embedFontFor(doc, nextText);
      const size = Math.max(8, Math.min(h * 0.85, 36));
      target.drawText(nextText, {
        x: x + 1,
        y: y + Math.max(1, (h - size) * 0.25),
        size,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  async function replaceSelectedWord() {
    const current = bytesRef.current;
    if (!current || !selectedWord) {
      setError("اضغط أولاً على كلمة داخل الصفحة");
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
      await paintWordCover(doc, selectedWord, nextText);
      updateBytes(await doc.save());
      setStatus(`تم الاستبدال: «${selectedWord.str}» ← «${nextText}»`);
      setSelectedWord(null);
      setReplaceWith("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "فشل الاستبدال");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelectedWord() {
    const current = bytesRef.current;
    if (!current || !selectedWord) {
      setError("اضغط أولاً على كلمة داخل الصفحة");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(cloneBytes(current));
      await paintWordCover(doc, selectedWord, null);
      updateBytes(await doc.save());
      setStatus(`تم حذف: «${selectedWord.str}»`);
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
    if (!current || !overlays.length) {
      setError("أضف نصاً أو صورة أولاً");
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

      for (const item of overlays) {
        if (item.type === "text") {
          const font = await embedFontFor(doc, item.text);
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
      setStatus("تم تثبيت العناصر على الصفحة");
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
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <strong>مهم:</strong> مرّر على الكلمة (تصير صفراء) ثم اضغطها (تصير زرقاء).
          بعدها استبدال/حذف من اللوحة الجانبية — راقب المعاينة ثم نزّل PDF.
        </p>
      </div>

      {!file ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-[#d4d4d4] bg-[#fafafa]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white"
          >
            اختيار PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void onPick(e.target.files)}
          />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                className={`ms-2 rounded px-3 py-1 font-semibold ${
                  selectMode
                    ? "bg-[#2563eb] text-white"
                    : "border border-[#ddd] text-[#555]"
                }`}
              >
                {selectMode
                  ? "وضع تحديد الكلمات: تشغيل"
                  : "وضع تحديد الكلمات: إيقاف"}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="ms-auto text-[#2563eb] hover:underline"
              >
                ملف آخر
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => void onPick(e.target.files)}
              />
            </div>

            <div className="max-h-[80vh] overflow-auto rounded-lg border border-[#ddd] bg-[#e8e8e8] p-4">
              {previewUrl ? (
                <div
                  ref={stageRef}
                  className="relative mx-auto bg-white shadow-xl"
                  style={{ width: displaySize.w, height: displaySize.h }}
                  onPointerMove={onPointerMove}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    draggable={false}
                  />
                  {/* Text layer is mounted imperatively so React re-renders don't wipe spans */}

                  {overlays.map((item) => (
                    <div
                      key={item.id}
                      onPointerDown={(e) => onPointerDown(e, item.id)}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      className={`absolute z-10 cursor-move ${
                        selectedId === item.id
                          ? "ring-2 ring-[#2563eb]"
                          : "ring-1 ring-black/30"
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
                          className="rounded bg-yellow-200/90 px-1 font-semibold text-black"
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
                <p className="py-28 text-center text-sm text-[#777]">جاري تحميل الصفحة…</p>
              )}
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-16 xl:self-start">
            <div className="rounded-lg border-2 border-[#2563eb] bg-[#eff6ff] p-4">
              <p className="mb-2 text-base font-bold text-[#1e3a8a]">
                حذف / استبدال كلمة
              </p>
              {selectedWord ? (
                <>
                  <p className="mb-2 text-sm">
                    المحددة:{" "}
                    <span className="rounded bg-white px-2 py-0.5 font-bold">
                      {selectedWord.str}
                    </span>
                  </p>
                  <input
                    className="mb-3 w-full rounded-md border border-[#93c5fd] px-3 py-2 text-sm"
                    value={replaceWith}
                    onChange={(e) => setReplaceWith(e.target.value)}
                    placeholder="اكتب البديل هنا"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void replaceSelectedWord()}
                      className="rounded-md bg-[#2563eb] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      استبدال
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteSelectedWord()}
                      className="rounded-md bg-red-600 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm leading-7 text-[#1e40af]">
                  1) تأكد أن «تحديد الكلمات» مفعّل (أزرق)
                  <br />
                  2) مرّر فوق الكلمة ثم اضغطها
                  <br />
                  3) ستظهر هنا للاستبدال أو الحذف
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[#eee] p-4">
              <p className="mb-2 text-sm font-semibold">إضافة نص للسحب</p>
              <textarea
                className="mb-2 w-full rounded border border-[#ddd] px-3 py-2 text-sm"
                rows={2}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              <div className="mb-2 flex items-center gap-2">
                <label className="text-xs text-[#666]">حجم</label>
                <input
                  className="w-16 rounded border border-[#ddd] px-2 py-1 text-sm"
                  value={draftSize}
                  onChange={(e) => setDraftSize(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={addTextOverlay}
                className="w-full rounded-md bg-[#111] px-3 py-2 text-sm font-semibold text-white"
              >
                وضع النص على الصفحة
              </button>
            </div>

            <div className="rounded-lg border border-[#eee] p-4">
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                className="w-full rounded-md border border-[#ddd] px-3 py-2 text-sm font-semibold"
              >
                إضافة صورة للسحب
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
                disabled={!overlays.length || busy}
                onClick={() => void bakeOverlays()}
                className="col-span-2 rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"
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
                تدوير
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void withDoc(async (doc) => {
                    if (doc.getPageCount() <= 1) throw new Error("صفحة واحدة فقط");
                    doc.removePage(page - 1);
                  })
                }
                className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700"
              >
                حذف صفحة
              </button>
              <button
                type="button"
                disabled={busy || !bytes}
                onClick={download}
                className="col-span-2 rounded-md bg-[#2563eb] px-3 py-2.5 text-sm font-bold text-white"
              >
                تنزيل PDF
              </button>
            </div>
          </aside>
        </div>
      )}

      {status && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {status}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
