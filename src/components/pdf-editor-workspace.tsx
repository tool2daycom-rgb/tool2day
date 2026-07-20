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
import { beginToolUse, setDownloadRatingContext } from "@/lib/ratings";

type Props = {
  title: string;
  description: string;
  slug?: string;
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
      naturalW: number;
      naturalH: number;
    };

type SelectedWord = {
  str: string;
  pdfX: number;
  pdfY: number;
  pdfW: number;
  pdfH: number;
  /** Exact PDF font size from text layer metrics */
  fontSize: number;
  /** Baseline Y in PDF space */
  pdfBaseline: number;
  color: { r: number; g: number; b: number };
  bg: { r: number; g: number; b: number };
  underlined: boolean;
  fontKind: "helvetica" | "times" | "courier" | "arabic";
  bold: boolean;
  italic: boolean;
};

function cloneBytes(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.byteLength);
  out.set(data);
  return out;
}

function hasArabic(s: string) {
  return /[\u0600-\u06FF]/.test(s);
}

function inferFontKind(fontFamily: string, sampleText: string): SelectedWord["fontKind"] {
  if (hasArabic(sampleText)) return "arabic";
  const f = fontFamily.toLowerCase();
  if (f.includes("courier") || f.includes("mono")) return "courier";
  if (f.includes("times") || f.includes("serif") || f.includes("georgia")) return "times";
  return "helvetica";
}

function pickStandardFont(
  kind: SelectedWord["fontKind"],
  bold: boolean,
  italic: boolean,
): StandardFonts {
  if (kind === "courier") {
    if (bold && italic) return StandardFonts.CourierBoldOblique;
    if (bold) return StandardFonts.CourierBold;
    if (italic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  if (kind === "times") {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold) return StandardFonts.TimesRomanBold;
    if (italic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (bold && italic) return StandardFonts.HelveticaBoldOblique;
  if (bold) return StandardFonts.HelveticaBold;
  if (italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

/** Sample text/background color and underline from the rendered page canvas. */
function sampleWordStyle(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; w: number; h: number },
): Pick<SelectedWord, "color" | "bg" | "underlined"> {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const fallback = {
    color: { r: 0, g: 0, b: 0 },
    bg: { r: 1, g: 1, b: 1 },
    underlined: false,
  };
  if (!ctx) return fallback;

  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(canvas.width, Math.ceil(box.x + box.w));
  const y1 = Math.min(canvas.height, Math.ceil(box.y + box.h));
  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);

  let data: ImageData;
  try {
    data = ctx.getImageData(x0, y0, w, h);
  } catch {
    return fallback;
  }

  type Bucket = { r: number; g: number; b: number; n: number; lum: number };
  const dark: Bucket[] = [];
  const light: Bucket[] = [];

  const push = (list: Bucket[], r: number, g: number, b: number) => {
    for (const bkt of list) {
      if (
        Math.abs(bkt.r - r) < 18 &&
        Math.abs(bkt.g - g) < 18 &&
        Math.abs(bkt.b - b) < 18
      ) {
        bkt.r = (bkt.r * bkt.n + r) / (bkt.n + 1);
        bkt.g = (bkt.g * bkt.n + g) / (bkt.n + 1);
        bkt.b = (bkt.b * bkt.n + b) / (bkt.n + 1);
        bkt.n += 1;
        return;
      }
    }
    list.push({ r, g, b, n: 1, lum: 0.299 * r + 0.587 * g + 0.114 * b });
  };

  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3]! < 128) continue;
    const r = px[i]!;
    const g = px[i + 1]!;
    const b = px[i + 2]!;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 140) push(dark, r, g, b);
    else push(light, r, g, b);
  }

  dark.sort((a, b) => b.n - a.n);
  light.sort((a, b) => b.n - a.n);
  const ink = dark[0];
  const paper = light[0];

  // Underline: look at a thin strip just under the glyph box
  let underlined = false;
  const uy0 = Math.min(canvas.height - 1, y1);
  const uy1 = Math.min(canvas.height, y1 + Math.max(3, Math.round(h * 0.22)));
  const uw = w;
  const uh = Math.max(1, uy1 - uy0);
  if (uh > 0 && ink) {
    try {
      const under = ctx.getImageData(x0, uy0, uw, uh).data;
      let darkCount = 0;
      let total = 0;
      for (let i = 0; i < under.length; i += 4) {
        if (under[i + 3]! < 128) continue;
        total += 1;
        const lum = 0.299 * under[i]! + 0.587 * under[i + 1]! + 0.114 * under[i + 2]!;
        if (lum < 150) darkCount += 1;
      }
      // A real underline paints a dense horizontal band; random noise won't.
      underlined = total > 8 && darkCount / total > 0.28;
    } catch {
      underlined = false;
    }
  }

  return {
    color: ink
      ? { r: ink.r / 255, g: ink.g / 255, b: ink.b / 255 }
      : fallback.color,
    bg: paper
      ? { r: paper.r / 255, g: paper.g / 255, b: paper.b / 255 }
      : fallback.bg,
    underlined,
  };
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

export function PdfEditorWorkspace({
  title,
  description,
  slug = "pdf-editor",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bytesRef = useRef<Uint8Array | null>(null);
  const pageSizeRef = useRef({ w: 595, h: 842 });
  const displaySizeRef = useRef({ w: 1, h: 1 });
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadIdRef = useRef(0);
  const dragRef = useRef<
    | {
        mode: "move";
        id: string;
        offsetX: number;
        offsetY: number;
      }
    | {
        mode: "resize";
        id: string;
        corner: "nw" | "ne" | "sw" | "se";
        startX: number;
        startY: number;
        originX: number;
        originY: number;
        originW: number;
        originH: number;
        aspect: number;
      }
    | null
  >(null);

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

  useEffect(() => {
    setDownloadRatingContext(slug);
    return () => setDownloadRatingContext(null);
  }, [slug]);
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
    const canvas = previewCanvasRef.current;
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

    // pdf.js TextLayer stores unscaled font height on the span
    const fontHeightRaw = parseFloat(
      el.style.getPropertyValue("--font-height") || "0",
    );
    const fontSize =
      fontHeightRaw > 0
        ? fontHeightRaw
        : Math.max(7, h * sy * 0.92);

    const fontFamily =
      el.dataset.pdfFont ||
      el.dataset.pdfFontName ||
      el.style.fontFamily ||
      window.getComputedStyle(el).fontFamily ||
      "";
    const familyLower = fontFamily.toLowerCase();
    const bold =
      familyLower.includes("bold") ||
      (el.dataset.pdfFontName || "").toLowerCase().includes("bold") ||
      parseInt(window.getComputedStyle(el).fontWeight, 10) >= 600;
    const italic =
      familyLower.includes("italic") ||
      familyLower.includes("oblique") ||
      (el.dataset.pdfFontName || "").toLowerCase().includes("italic") ||
      (el.dataset.pdfFontName || "").toLowerCase().includes("oblique") ||
      window.getComputedStyle(el).fontStyle === "italic";

    const style = canvas
      ? sampleWordStyle(canvas, { x, y, w, h })
      : {
          color: { r: 0, g: 0, b: 0 },
          bg: { r: 1, g: 1, b: 1 },
          underlined: false,
        };

    // Baseline ≈ bottom of box minus a small descent fraction
    const pdfY = pageSizeRef.current.h - (y + h) * sy;
    const pdfBaseline = pdfY + Math.max(0.5, fontSize * 0.12);

    const word: SelectedWord = {
      str,
      pdfX: x * sx,
      pdfY,
      pdfW: w * sx,
      pdfH: h * sy,
      fontSize,
      pdfBaseline,
      color: style.color,
      bg: style.bg,
      underlined: style.underlined,
      fontKind: inferFontKind(fontFamily, str),
      bold,
      italic,
    };
    setSelectedWord(word);
    setReplaceWith(str);
    setStatus(
      `تم تحديد: «${str}» — الحجم ${fontSize.toFixed(1)}` +
        (style.underlined ? " · مسطّر" : "") +
        " — اكتب البديل ثم استبدال",
    );
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
      previewCanvasRef.current = canvas;
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
      const textItems = textContent.items.flatMap((it) => {
        if (
          typeof it === "object" &&
          it !== null &&
          "str" in it &&
          typeof (it as { str?: unknown }).str === "string"
        ) {
          return [it as { str: string; fontName: string; transform: number[] }];
        }
        return [];
      });
      const textLayer = new pdfjs.TextLayer({
        textContentSource: textContent,
        container: layerEl,
        viewport,
      });
      await textLayer.render();
      if (loadId !== loadIdRef.current) return;

      const spans = textLayer.textDivs;
      const strings = textLayer.textContentItemsStr;
      const clickable: HTMLElement[] = [];
      spans.forEach((span, idx) => {
        const str = (strings[idx] || span.textContent || "").trim();
        if (!str) return;
        clickable.push(span);
        const item = textItems[idx];
        const styleMeta = item?.fontName
          ? textContent.styles?.[item.fontName]
          : undefined;
        span.style.cursor = "pointer";
        span.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (!selectModeRef.current) return;
          // Prefer transform font size from the PDF item when available
          if (item?.transform) {
            const fontFromItem = Math.hypot(item.transform[2]!, item.transform[3]!);
            if (fontFromItem > 0) {
              span.style.setProperty("--font-height", `${fontFromItem}px`);
            }
          }
          if (styleMeta?.fontFamily) {
            span.dataset.pdfFont = styleMeta.fontFamily;
          }
          if (item?.fontName) {
            span.dataset.pdfFontName = item.fontName;
          }
          selectSpan(span, clickable);
        };
      });

      if (!clickable.length) {
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
        naturalW: dims.w,
        naturalH: dims.h,
      },
    ]);
    setSelectedId(id);
    setSelectMode(false);
    setStatus("اسحب الصورة لتغيير مكانها، ومن الزوايا لتغيير الحجم");
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      mode: "move",
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setSelectedId(id);
    el.setPointerCapture(e.pointerId);
  }

  function onResizePointerDown(
    e: ReactPointerEvent<HTMLDivElement>,
    id: string,
    corner: "nw" | "ne" | "sw" | "se",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const item = overlays.find((o) => o.id === id);
    if (!item || item.type !== "image") return;
    dragRef.current = {
      mode: "resize",
      id,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      originX: item.x,
      originY: item.y,
      originW: item.width,
      originH: item.height,
      aspect: item.width / Math.max(1, item.height),
    };
    setSelectedId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const stageRect = stage.getBoundingClientRect();

    if (drag.mode === "move") {
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
      return;
    }

    // resize
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const minSize = 32;
    const maxW = displaySize.w;
    const maxH = displaySize.h;

    setOverlays((prev) =>
      prev.map((item) => {
        if (item.id !== drag.id || item.type !== "image") return item;

        let { originX: x, originY: y, originW: w, originH: h } = drag;
        const aspect = drag.aspect;

        if (drag.corner === "se") {
          w = Math.max(minSize, drag.originW + dx);
          h = w / aspect;
        } else if (drag.corner === "sw") {
          w = Math.max(minSize, drag.originW - dx);
          h = w / aspect;
          x = drag.originX + drag.originW - w;
        } else if (drag.corner === "ne") {
          w = Math.max(minSize, drag.originW + dx);
          h = w / aspect;
          y = drag.originY + drag.originH - h;
        } else {
          // nw
          w = Math.max(minSize, drag.originW - dx);
          h = w / aspect;
          x = drag.originX + drag.originW - w;
          y = drag.originY + drag.originH - h;
        }

        // Clamp inside page
        if (x < 0) {
          w += x;
          h = w / aspect;
          x = 0;
          if (drag.corner === "ne" || drag.corner === "nw") {
            y = drag.originY + drag.originH - h;
          }
        }
        if (y < 0) {
          h = Math.max(minSize, h + y);
          w = h * aspect;
          y = 0;
          if (drag.corner === "nw" || drag.corner === "sw") {
            x = drag.originX + drag.originW - w;
          }
        }
        if (x + w > maxW) {
          w = maxW - x;
          h = w / aspect;
          if (drag.corner === "ne" || drag.corner === "nw") {
            y = drag.originY + drag.originH - h;
          }
        }
        if (y + h > maxH) {
          h = maxH - y;
          w = h * aspect;
          if (drag.corner === "nw" || drag.corner === "sw") {
            x = drag.originX + drag.originW - w;
          }
        }

        return {
          ...item,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.max(minSize, Math.min(maxW, w)),
          height: Math.max(minSize, Math.min(maxH, h)),
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

  function resizeSelectedImage(nextWidth: number) {
    setOverlays((prev) =>
      prev.map((item) => {
        if (item.id !== selectedId || item.type !== "image") return item;
        const aspect = item.naturalW / Math.max(1, item.naturalH);
        const width = Math.max(32, Math.min(displaySize.w - item.x, nextWidth));
        const height = Math.max(32, Math.min(displaySize.h - item.y, width / aspect));
        return { ...item, width, height };
      }),
    );
  }

  const selectedImage =
    overlays.find(
      (o): o is Extract<Overlay, { type: "image" }> =>
        o.id === selectedId && o.type === "image",
    ) ?? null;

  async function embedFontFor(
    doc: PDFDocument,
    text: string,
    style?: Pick<SelectedWord, "fontKind" | "bold" | "italic">,
  ) {
    if (hasArabic(text) || style?.fontKind === "arabic") {
      return doc.embedFont(await loadArabicFontBytes(), { subset: true });
    }
    const kind = style?.fontKind ?? "helvetica";
    return doc.embedFont(
      pickStandardFont(kind, !!style?.bold, !!style?.italic),
    );
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

    const fontSize = Math.max(5, word.fontSize * sy);
    const font = nextText
      ? await embedFontFor(doc, nextText, word)
      : null;

    const padX = 2;
    const padY = 2;
    const underlineExtra = word.underlined ? Math.max(3, fontSize * 0.3) : 0;

    // Cover the original glyph box fully (prevents leftover overlapping text)
    let coverX = word.pdfX * sx - padX;
    let coverY = word.pdfY * sy - padY - underlineExtra;
    let coverW = word.pdfW * sx + padX * 2;
    let coverH = word.pdfH * sy + padY * 2 + underlineExtra;

    if (nextText && font) {
      const measured = font.widthOfTextAtSize(nextText, fontSize);
      coverW = Math.max(coverW, measured + padX * 2);
      // Ensure cover also fits ascent above baseline
      const baseline = word.pdfBaseline * sy;
      const topNeeded = baseline + fontSize * 0.85;
      const bottomNeeded = baseline - fontSize * 0.25 - underlineExtra;
      coverY = Math.min(coverY, bottomNeeded - padY);
      coverH = Math.max(coverH, topNeeded - coverY + padY);
    }

    const bg = rgb(word.bg.r, word.bg.g, word.bg.b);
    target.drawRectangle({
      x: coverX,
      y: coverY,
      width: coverW,
      height: coverH,
      color: bg,
      borderWidth: 0,
    });

    if (nextText && font) {
      const ink = rgb(word.color.r, word.color.g, word.color.b);
      const baseline = word.pdfBaseline * sy;
      target.drawText(nextText, {
        x: word.pdfX * sx,
        y: baseline,
        size: fontSize,
        font,
        color: ink,
      });

      if (word.underlined) {
        const textW = font.widthOfTextAtSize(nextText, fontSize);
        const ulY = baseline - Math.max(1, fontSize * 0.12);
        target.drawLine({
          start: { x: word.pdfX * sx, y: ulY },
          end: { x: word.pdfX * sx + textW, y: ulY },
          thickness: Math.max(0.6, fontSize * 0.06),
          color: ink,
        });
      }
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

  async function download() {
    const current = bytesRef.current;
    if (!current || !file) return;
    if (overlays.length) {
      setError("ثبّت العناصر قبل التنزيل");
      return;
    }
    beginToolUse(slug);
    try {
      await downloadBlob(
        toBlob(cloneBytes(current), "application/pdf"),
        `${basename(file.name)}-edited.pdf`,
      );
      setStatus("تم التنزيل");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التنزيل");
    }
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
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
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
                      onPointerMove={onPointerMove}
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
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.src}
                            alt=""
                            className="h-full w-full object-contain"
                            draggable={false}
                          />
                          {selectedId === item.id &&
                            (
                              [
                                {
                                  corner: "nw" as const,
                                  style: {
                                    left: 0,
                                    top: 0,
                                    cursor: "nwse-resize",
                                    transform: "translate(-50%, -50%)",
                                  },
                                },
                                {
                                  corner: "ne" as const,
                                  style: {
                                    right: 0,
                                    top: 0,
                                    cursor: "nesw-resize",
                                    transform: "translate(50%, -50%)",
                                  },
                                },
                                {
                                  corner: "sw" as const,
                                  style: {
                                    left: 0,
                                    bottom: 0,
                                    cursor: "nesw-resize",
                                    transform: "translate(-50%, 50%)",
                                  },
                                },
                                {
                                  corner: "se" as const,
                                  style: {
                                    right: 0,
                                    bottom: 0,
                                    cursor: "nwse-resize",
                                    transform: "translate(50%, 50%)",
                                  },
                                },
                              ] as const
                            ).map(({ corner, style }) => (
                              <div
                                key={corner}
                                role="slider"
                                aria-label={`تغيير الحجم ${corner}`}
                                onPointerDown={(e) =>
                                  onResizePointerDown(e, item.id, corner)
                                }
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={onPointerUp}
                                className="absolute z-20 h-3.5 w-3.5 rounded-sm border-2 border-white bg-[#2563eb] shadow"
                                style={style}
                              />
                            ))}
                        </>
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
                  <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#1e40af]">
                    <span
                      className="inline-block h-3 w-3 rounded-sm border border-black/20"
                      style={{
                        background: `rgb(${Math.round(selectedWord.color.r * 255)},${Math.round(selectedWord.color.g * 255)},${Math.round(selectedWord.color.b * 255)})`,
                      }}
                      title="لون النص"
                    />
                    <span>حجم {selectedWord.fontSize.toFixed(1)}</span>
                    <span>
                      {selectedWord.fontKind === "arabic"
                        ? "عربي"
                        : selectedWord.fontKind}
                      {selectedWord.bold ? " · عريض" : ""}
                      {selectedWord.italic ? " · مائل" : ""}
                    </span>
                    {selectedWord.underlined ? <span>· مسطّر</span> : null}
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
              {selectedImage ? (
                <div className="mt-3 space-y-2 rounded-md bg-[#f8fafc] p-3">
                  <p className="text-xs font-semibold text-[#334155]">
                    حجم الصورة المحددة
                  </p>
                  <input
                    type="range"
                    min={40}
                    max={Math.max(40, Math.floor(displaySize.w * 0.95))}
                    value={Math.round(selectedImage.width)}
                    onChange={(e) => resizeSelectedImage(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-xs text-[#666]">العرض</label>
                    <input
                      type="number"
                      min={32}
                      className="w-20 rounded border border-[#ddd] px-2 py-1"
                      value={Math.round(selectedImage.width)}
                      onChange={(e) =>
                        resizeSelectedImage(Number(e.target.value) || 32)
                      }
                    />
                    <span className="text-xs text-[#888]">
                      × {Math.round(selectedImage.height)} بكسل
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded border border-[#ddd] px-2 py-1 text-xs"
                      onClick={() =>
                        resizeSelectedImage(selectedImage.width * 0.8)
                      }
                    >
                      أصغر
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded border border-[#ddd] px-2 py-1 text-xs"
                      onClick={() =>
                        resizeSelectedImage(selectedImage.width * 1.25)
                      }
                    >
                      أكبر
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded border border-[#ddd] px-2 py-1 text-xs"
                      onClick={() =>
                        resizeSelectedImage(
                          Math.min(displaySize.w * 0.5, selectedImage.naturalW),
                        )
                      }
                    >
                      وسط
                    </button>
                  </div>
                  <p className="text-[11px] leading-5 text-[#64748b]">
                    أو اسحب المربعات الزرقاء على زوايا الصورة
                  </p>
                </div>
              ) : null}
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
