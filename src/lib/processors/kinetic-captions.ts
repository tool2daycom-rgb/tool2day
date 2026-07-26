import type { TranscriptWord } from "@/lib/processors/transcribe";

/** مدة مدعومة: من 5 ثوانٍ حتى 3 دقائق */
export const KINETIC_MIN_DURATION_SEC = 5;
export const KINETIC_MAX_DURATION_SEC = 3 * 60;
/** أسطر أقصر حتى لا يخرج النص من الفيديو العمودي */
export const KINETIC_WORDS_PER_LINE = 3;

export type KineticLine = {
  start: number;
  end: number;
  words: TranscriptWord[];
};

export type KineticPosition = "top" | "center" | "bottom";
export type KineticEffect =
  | "none"
  | "fade"
  | "pulse"
  | "pop"
  | "bounce"
  | "slide"
  | "typewriter"
  | "zoom";

export type KineticStyle = {
  baseColor: string;
  highlightColor: string;
  fontSizePx: number;
  rtl: boolean;
  position: KineticPosition;
  effect: KineticEffect;
  fontFamily: string;
};

export const KINETIC_POSITIONS: { id: KineticPosition; label: string }[] = [
  { id: "top", label: "أعلى" },
  { id: "center", label: "وسط" },
  { id: "bottom", label: "أسفل" },
];

export const KINETIC_EFFECTS: { id: KineticEffect; label: string }[] = [
  { id: "none", label: "تمييز لوني فقط" },
  { id: "fade", label: "تلاشي" },
  { id: "pulse", label: "نبض" },
  { id: "pop", label: "ظهور مفاجئ" },
  { id: "bounce", label: "ارتداد" },
  { id: "slide", label: "انزلاق" },
  { id: "typewriter", label: "آلة كاتبة" },
  { id: "zoom", label: "تكبير / تصغير" },
];

export const KINETIC_FONTS: {
  id: string;
  label: string;
  stack: string;
  google?: string;
}[] = [
  {
    id: "cairo-site",
    label: "Cairo",
    stack: "__SITE_CAIRO__",
    google: "Cairo:wght@700;800;900",
  },
];

export function getSiteCairoFamily(): string {
  if (typeof document === "undefined") return '"Cairo", sans-serif';
  return getComputedStyle(document.body).fontFamily?.trim() || '"Cairo", sans-serif';
}

export function resolveKineticFontStack(stack: string): string {
  if (stack === "__SITE_CAIRO__" || !stack) return getSiteCairoFamily();
  return stack;
}

export async function ensureKineticFont(stack: string): Promise<void> {
  const resolved = resolveKineticFontStack(stack);
  const font = KINETIC_FONTS.find((f) => f.stack === stack);
  if (font?.google && typeof document !== "undefined") {
    const id = `kinetic-font-${font.id}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
      document.head.appendChild(link);
    }
  }
  if (typeof document === "undefined" || !document.fonts) return;
  const name = resolved.split(",")[0]!.trim().replace(/"/g, "");
  try {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load(`700 48px "${name}"`),
      document.fonts.load(`800 48px "${name}"`),
      document.fonts.load(`900 48px "${name}"`),
      document.fonts.load(`800 64px ${resolved}`),
      document.fonts.load(`900 64px ${resolved}`),
    ]);
    let tries = 0;
    while (
      !document.fonts.check(`800 48px "${name}"`) &&
      !document.fonts.check(`900 48px "${name}"`) &&
      !document.fonts.check(`700 48px "${name}"`) &&
      tries < 30
    ) {
      await new Promise((r) => setTimeout(r, 80));
      tries += 1;
    }
  } catch {
    /* ignore */
  }
}

export function kineticOverlayY(
  position: KineticPosition,
  videoH: number,
): string {
  const pad = Math.max(36, Math.round(videoH * 0.08));
  if (position === "top") return String(pad);
  if (position === "center") return "(H-h)/2";
  return `H-h-${pad}`;
}

export function kineticPreviewPositionClass(position: KineticPosition): string {
  if (position === "top") return "top-[8%]";
  if (position === "center") return "top-1/2 -translate-y-1/2";
  return "bottom-[10%]";
}

export function groupWordsIntoLines(
  words: TranscriptWord[],
  wordsPerLine = KINETIC_WORDS_PER_LINE,
): KineticLine[] {
  const cleaned = words
    .map((w) => ({
      ...w,
      word: w.word.trim(),
      start: Math.max(0, w.start),
      end: Math.max(w.start + 0.04, w.end),
    }))
    .filter((w) => w.word);
  if (!cleaned.length) return [];

  const lines: KineticLine[] = [];
  for (let i = 0; i < cleaned.length; i += wordsPerLine) {
    const chunk = cleaned.slice(i, i + wordsPerLine);
    lines.push({
      start: chunk[0]!.start,
      end: chunk[chunk.length - 1]!.end,
      words: chunk,
    });
  }
  return lines;
}

export function activeKineticAt(
  lines: KineticLine[],
  time: number,
): { line: KineticLine; activeIndex: number; progress: number } | null {
  for (const line of lines) {
    if (time >= line.start - 0.05 && time <= line.end + 0.08) {
      let activeIndex = 0;
      for (let i = 0; i < line.words.length; i++) {
        if (time >= line.words[i]!.start - 0.02) activeIndex = i;
      }
      const w = line.words[activeIndex]!;
      const next = line.words[activeIndex + 1];
      const end = next ? next.start : line.end;
      const dur = Math.max(0.05, end - w.start);
      const progress = Math.min(1, Math.max(0, (time - w.start) / dur));
      return { line, activeIndex, progress };
    }
  }
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type RenderOpts = {
  charCount?: number;
  slideProgress?: number;
  zoomScale?: number;
};

/**
 * يرسم عبر HTML + html2canvas حتى تبقى الحروف العربية متصلة بشكل صحيح.
 */
export async function renderKineticPng(
  line: KineticLine,
  activeIndex: number,
  videoW: number,
  videoH: number,
  style: KineticStyle,
  opts: RenderOpts = {},
): Promise<Blob> {
  await ensureKineticFont(style.fontFamily);
  const family = resolveKineticFontStack(style.fontFamily);
  const maxW = Math.max(120, Math.floor(videoW * 0.84));
  const maxH = Math.max(80, Math.floor(videoH * 0.32));

  let fontSize = Math.max(
    22,
    Math.min(style.fontSizePx, Math.round(videoW * 0.065)),
  );

  const host = document.createElement("div");
  host.setAttribute("dir", style.rtl ? "rtl" : "ltr");
  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${maxW}px`,
    "padding:12px 16px",
    "box-sizing:border-box",
    "background:transparent",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  const paint = (size: number) => {
    const parts: string[] = [];
    line.words.forEach((w, i) => {
      const isActive = i === activeIndex;
      let text = w.word;
      if (isActive && typeof opts.charCount === "number") {
        text = Array.from(w.word).slice(0, opts.charCount).join("");
        if (!text) text = "\u00A0";
      }
      const color = isActive ? style.highlightColor : style.baseColor;
      let opacity = "1";
      let transform = "none";
      if (style.effect === "fade" && !isActive) opacity = "0.45";
      if (isActive && style.effect === "pulse") transform = "scale(1.12)";
      if (isActive && style.effect === "pop") transform = "scale(1.2)";
      if (isActive && style.effect === "bounce") transform = "translateY(-6px) scale(1.08)";
      if (isActive && style.effect === "zoom") {
        const z = opts.zoomScale ?? 1.18;
        transform = `scale(${z})`;
      }
      if (isActive && style.effect === "slide") {
        const p = opts.slideProgress ?? 1;
        const from = style.rtl ? 28 : -28;
        const x = from * (1 - p);
        transform = `translateX(${x}px)`;
      }
      parts.push(
        `<span style="display:inline-block;color:${color};opacity:${opacity};transform:${transform};transform-origin:center;margin:0 0.42em;padding:0 0.08em;vertical-align:middle;white-space:nowrap">${escapeHtml(text)}</span>`,
      );
    });

    host.innerHTML = `<div style="
      font-family:${family};
      font-weight:900;
      font-size:${size}px;
      line-height:1.45;
      text-align:center;
      color:#fff;
      text-shadow:
        0 0 2px #000,
        1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000,
        2px 0 #000,-2px 0 #000,0 2px #000,0 -2px #000,
        1px 1px #000,-1px -1px #000;
      word-spacing:0.35em;
      letter-spacing:0;
      overflow-wrap:normal;
      max-width:100%;
    ">${parts.join(" ")}</div>`;
  };

  document.body.appendChild(host);
  try {
    paint(fontSize);
    // صغّر الخط حتى يبقى داخل عرض الفيديو
    let guard = 0;
    while (
      guard < 24 &&
      fontSize > 18 &&
      (host.scrollWidth > maxW + 2 || host.scrollHeight > maxH)
    ) {
      fontSize -= 2;
      paint(fontSize);
      guard += 1;
    }

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(host, {
      backgroundColor: null,
      scale: 1,
      logging: false,
      useCORS: true,
      width: Math.min(maxW, Math.ceil(host.scrollWidth + 16)),
      height: Math.min(maxH, Math.ceil(host.scrollHeight + 12)),
      windowWidth: maxW,
      windowHeight: maxH,
    });

    // قصّ لأي فائض
    const out = document.createElement("canvas");
    const tw = Math.min(canvas.width, maxW * 2);
    const th = Math.min(canvas.height, maxH * 2);
    out.width = tw;
    out.height = th;
    const ctx = out.getContext("2d");
    if (!ctx) throw new Error("Canvas غير متاح");
    ctx.drawImage(canvas, 0, 0, tw, th, 0, 0, tw, th);

    return await new Promise((resolve, reject) => {
      out.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("فشل رسم الترجمة الحركية"))),
        "image/png",
      );
    });
  } finally {
    host.remove();
  }
}

type BurnFrame = {
  start: number;
  end: number;
  line: KineticLine;
  activeIndex: number;
  charCount?: number;
  slideProgress?: number;
  zoomScale?: number;
};

function expandLinesToFrames(
  lines: KineticLine[],
  effect: KineticEffect,
): BurnFrame[] {
  const frames: BurnFrame[] = [];
  for (const line of lines) {
    line.words.forEach((w, i) => {
      const next = line.words[i + 1];
      const start = w.start;
      const end = next ? next.start : line.end;
      const dur = Math.max(0.05, end - start);

      // تأثيرات متعددة الإطارات تبطّئ التنزيل — نبقيها خفيفة
      if (effect === "typewriter") {
        const chars = Array.from(w.word);
        const steps = Math.min(3, Math.max(1, chars.length));
        for (let s = 1; s <= steps; s++) {
          const c = Math.ceil((s / steps) * chars.length);
          const t0 = start + ((s - 1) / steps) * dur;
          const t1 = start + (s / steps) * dur;
          frames.push({
            line,
            activeIndex: i,
            start: t0,
            end: Math.max(t0 + 0.04, t1),
            charCount: c,
          });
        }
        return;
      }

      if (effect === "slide") {
        frames.push({
          line,
          activeIndex: i,
          start,
          end: start + Math.min(0.18, dur * 0.35),
          slideProgress: 0.55,
        });
        frames.push({
          line,
          activeIndex: i,
          start: start + Math.min(0.18, dur * 0.35),
          end,
          slideProgress: 1,
        });
        return;
      }

      if (effect === "zoom") {
        frames.push({
          line,
          activeIndex: i,
          start,
          end,
          zoomScale: 1.16,
        });
        return;
      }

      frames.push({ line, activeIndex: i, start, end });
    });
  }
  return frames.filter((f) => f.end > f.start + 0.03);
}

async function probeVideoSize(
  video: File,
): Promise<{ w: number; h: number }> {
  const url = URL.createObjectURL(video);
  try {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.src = url;
    await new Promise<void>((resolve, reject) => {
      el.onloadedmetadata = () => resolve();
      el.onerror = () => reject(new Error("تعذّر قراءة أبعاد الفيديو"));
    });
    return {
      w: el.videoWidth || 1280,
      h: el.videoHeight || 720,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const BURN_BATCH = 28;

/**
 * يحرق الترجمة الحركية كلمة بكلمة داخل الفيديو.
 */
export async function downloadKineticBurnedVideo(
  video: File,
  lines: KineticLine[],
  style: KineticStyle,
  onProgress?: (ratio: number) => void,
  onStatus?: (msg: string) => void,
) {
  const frames = expandLinesToFrames(lines, style.effect);
  if (!frames.length) throw new Error("لا توجد كلمات لحرق الترجمة");

  const { fetchFile } = await import("@ffmpeg/util");
  const {
    basename,
    downloadBlob,
    getFFmpeg,
    inputFileName,
    toBlob,
  } = await import("./ffmpeg-client");

  const { w, h } = await probeVideoSize(video);
  let current: File = video;
  const batches = Math.ceil(frames.length / BURN_BATCH);

  for (let b = 0; b < batches; b++) {
    const slice = frames.slice(b * BURN_BATCH, (b + 1) * BURN_BATCH);
    onStatus?.(
      batches > 1
        ? `جاري تنزيل الفيديو ${b + 1}/${batches}…`
        : "جاري تنزيل الفيديو مع الترجمة…",
    );
    const ffmpeg = await getFFmpeg((r) =>
      onProgress?.((b + Math.min(1, Math.max(0, r))) / batches),
    );
    const input = inputFileName(current, "mp4");
    const output = "kinetic.mp4";
    await ffmpeg.writeFile(input, await fetchFile(current));

    const pngNames: string[] = [];
    for (let i = 0; i < slice.length; i++) {
      const f = slice[i]!;
      const png = await renderKineticPng(f.line, f.activeIndex, w, h, style, {
        charCount: f.charCount,
        slideProgress: f.slideProgress,
        zoomScale: f.zoomScale,
      });
      const name = `k${b}_${i}.png`;
      await ffmpeg.writeFile(name, await fetchFile(png));
      pngNames.push(name);
    }

    const overlayY = kineticOverlayY(style.position, h);
    const parts: string[] = [];
    let lastLabel = "[0:v]";
    for (let i = 0; i < slice.length; i++) {
      const f = slice[i]!;
      const outLabel = i === slice.length - 1 ? "[vout]" : `[kb${b}_${i}]`;
      parts.push(
        `${lastLabel}[${i + 1}:v]overlay=(W-w)/2:${overlayY}:enable='between(t\\,${f.start.toFixed(3)}\\,${f.end.toFixed(3)})'${outLabel}`,
      );
      lastLabel = outLabel;
    }

    const args = ["-i", input];
    for (const name of pngNames) args.push("-i", name);
    args.push(
      "-filter_complex",
      parts.join(";"),
      "-map",
      "[vout]",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "22",
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      output,
    );

    const code = await ffmpeg.exec(args);
    if (typeof code === "number" && code !== 0) {
      throw new Error("فشل تجهيز الفيديو للتنزيل");
    }
    const data = await ffmpeg.readFile(output);
    current = new File([toBlob(data, "video/mp4")], `kinetic-partial-${b}.mp4`, {
      type: "video/mp4",
    });

    try {
      await ffmpeg.deleteFile(input);
      await ffmpeg.deleteFile(output);
      for (const name of pngNames) await ffmpeg.deleteFile(name);
    } catch {
      /* ignore */
    }
  }

  onStatus?.("بدء حفظ الملف…");
  await downloadBlob(current, `${basename(video.name)}-kinetic-captions.mp4`);
  onProgress?.(1);
}

export function buildWordsText(words: TranscriptWord[]): string {
  return words
    .map((w, i) => {
      const a = w.start.toFixed(2);
      const b = w.end.toFixed(2);
      return `${i + 1}. [${a}s - ${b}s] ${w.word}`;
    })
    .join("\n");
}
