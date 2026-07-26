import type { TranscriptWord } from "@/lib/processors/transcribe";

/** مدة مدعومة: من 5 ثوانٍ حتى 3 دقائق */
export const KINETIC_MIN_DURATION_SEC = 5;
export const KINETIC_MAX_DURATION_SEC = 3 * 60;
export const KINETIC_WORDS_PER_LINE = 5;

export type KineticLine = {
  start: number;
  end: number;
  words: TranscriptWord[];
};

export type KineticPosition = "top" | "center" | "bottom";
export type KineticEffect = "none" | "fade" | "pulse" | "pop" | "bounce";

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
];

export const KINETIC_FONTS: { id: string; label: string; stack: string; google?: string }[] = [
  {
    id: "tahoma",
    label: "Tahoma",
    stack: 'Tahoma, "Segoe UI", sans-serif',
  },
  {
    id: "cairo",
    label: "Cairo",
    stack: '"Cairo", Tahoma, sans-serif',
    google: "Cairo:wght@700;800",
  },
  {
    id: "tajawal",
    label: "Tajawal",
    stack: '"Tajawal", Tahoma, sans-serif',
    google: "Tajawal:wght@700;800",
  },
  {
    id: "amiri",
    label: "Amiri",
    stack: '"Amiri", "Times New Roman", serif',
    google: "Amiri:wght@700",
  },
  {
    id: "noto",
    label: "Noto Sans Arabic",
    stack: '"Noto Sans Arabic", Tahoma, sans-serif',
    google: "Noto+Sans+Arabic:wght@700;800",
  },
  {
    id: "arial-black",
    label: "Arial Black",
    stack: '"Arial Black", Arial, sans-serif',
  },
  {
    id: "impact",
    label: "Impact",
    stack: "Impact, Haettenschweiler, sans-serif",
  },
];

export async function ensureKineticFont(stack: string): Promise<void> {
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
  if (typeof document !== "undefined" && document.fonts?.load) {
    try {
      await document.fonts.load(`800 36px ${stack.split(",")[0]!.trim()}`);
    } catch {
      /* ignore */
    }
  }
}

export function kineticOverlayY(
  position: KineticPosition,
  videoH: number,
): string {
  const pad = Math.max(28, Math.round(videoH * 0.1));
  if (position === "top") return String(pad);
  if (position === "center") return "(H-h)/2";
  return `H-h-${pad}`;
}

export function kineticPreviewPositionClass(position: KineticPosition): string {
  if (position === "top") return "top-[10%]";
  if (position === "center") return "top-1/2 -translate-y-1/2";
  return "bottom-[12%]";
}


/**
 * يجمع الكلمات في أسطر قصيرة بأسلوب ريلز/تيك توك.
 */
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
): { line: KineticLine; activeIndex: number } | null {
  for (const line of lines) {
    if (time >= line.start - 0.05 && time <= line.end + 0.08) {
      let activeIndex = 0;
      for (let i = 0; i < line.words.length; i++) {
        if (time >= line.words[i]!.start - 0.02) activeIndex = i;
      }
      return { line, activeIndex };
    }
  }
  return null;
}

function wrapKineticWords(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxWidth: number,
): string[][] {
  const rows: string[][] = [[]];
  for (const w of words) {
    const trial = [...rows[rows.length - 1]!, w];
    const width = ctx.measureText(trial.join(" ")).width;
    if (width > maxWidth && rows[rows.length - 1]!.length) {
      rows.push([w]);
    } else {
      rows[rows.length - 1] = trial;
    }
  }
  return rows.filter((r) => r.length);
}

/**
 * يرسم سطراً مع تمييز كلمة واحدة بلون مميز (Kinetic Typography).
 */
export async function renderKineticPng(
  line: KineticLine,
  activeIndex: number,
  videoW: number,
  videoH: number,
  style: KineticStyle,
): Promise<Blob> {
  await ensureKineticFont(style.fontFamily);
  const fontSize = Math.max(
    22,
    Math.round(style.fontSizePx * (videoH / 720)),
  );
  const padX = Math.round(fontSize * 0.55);
  const padY = Math.round(fontSize * 0.55);
  const lineH = Math.round(fontSize * 1.35);
  const maxTextW = Math.min(videoW * 0.9, videoW - 48);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas غير متاح");

  const fontCss = `800 ${fontSize}px ${style.fontFamily}`;
  ctx.font = fontCss;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = style.rtl ? "rtl" : "ltr";

  const wordTexts = line.words.map((w) => w.word);
  const rows = wrapKineticWords(ctx, wordTexts, maxTextW - padX * 2);
  const boxW = Math.min(
    videoW,
    Math.ceil(
      Math.max(
        ...rows.map((r) => ctx.measureText(r.join(" ")).width),
        40,
      ) +
        padX * 2 +
        fontSize * 0.4,
    ),
  );
  const boxH = rows.length * lineH + padY * 2 + Math.round(fontSize * 0.25);
  canvas.width = boxW;
  canvas.height = boxH;

  ctx.clearRect(0, 0, boxW, boxH);
  ctx.font = fontCss;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = style.rtl ? "rtl" : "ltr";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  let flat = 0;
  rows.forEach((row, rowIdx) => {
    const yBase = padY + lineH / 2 + rowIdx * lineH;
    const full = row.join(" ");
    const totalW = ctx.measureText(full).width;
    let x = boxW / 2 - totalW / 2;
    if (style.rtl) {
      x = boxW / 2 + totalW / 2;
    }
    for (let i = 0; i < row.length; i++) {
      const word = row[i]!;
      const wWidth = ctx.measureText(word).width;
      const space = i < row.length - 1 ? ctx.measureText(" ").width : 0;
      const centerX = style.rtl ? x - wWidth / 2 : x + wWidth / 2;
      const isActive = flat === activeIndex;
      const color = isActive ? style.highlightColor : style.baseColor;

      let y = yBase;
      let scale = 1;
      let alpha = 1;
      if (style.effect === "fade") {
        alpha = isActive ? 1 : 0.4;
      } else if (style.effect === "pulse" && isActive) {
        scale = 1.18;
      } else if (style.effect === "pop" && isActive) {
        scale = 1.28;
      } else if (style.effect === "bounce" && isActive) {
        scale = 1.12;
        y = yBase - fontSize * 0.12;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(centerX, y);
      ctx.scale(scale, scale);
      ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.14));
      ctx.strokeStyle = "#000000";
      ctx.strokeText(word, 0, 0);
      ctx.fillStyle = color;
      ctx.fillText(word, 0, 0);
      ctx.restore();

      if (style.rtl) x -= wWidth + space;
      else x += wWidth + space;
      flat += 1;
    }
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل رسم الترجمة الحركية"))),
      "image/png",
    );
  });
}

type BurnFrame = {
  start: number;
  end: number;
  line: KineticLine;
  activeIndex: number;
};

function expandLinesToFrames(lines: KineticLine[]): BurnFrame[] {
  const frames: BurnFrame[] = [];
  for (const line of lines) {
    line.words.forEach((w, i) => {
      const next = line.words[i + 1];
      frames.push({
        line,
        activeIndex: i,
        start: w.start,
        end: next ? next.start : line.end,
      });
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

const BURN_BATCH = 12;

/**
 * يحرق الترجمة الحركية كلمة بكلمة داخل الفيديو الطويل.
 */
export async function downloadKineticBurnedVideo(
  video: File,
  lines: KineticLine[],
  style: KineticStyle,
  onProgress?: (ratio: number) => void,
  onStatus?: (msg: string) => void,
) {
  const frames = expandLinesToFrames(lines);
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
        ? `حرق الترجمة الحركية ${b + 1}/${batches}…`
        : "حرق الترجمة الحركية في الفيديو…",
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
      const png = await renderKineticPng(f.line, f.activeIndex, w, h, style);
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
      throw new Error("فشل حرق الترجمة الحركية");
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

  onStatus?.("تنزيل الفيديو مع الترجمة الحركية…");
  await downloadBlob(current, `${basename(video.name)}-kinetic-captions.mp4`);
  onProgress?.(1);
}

export function buildWordsJson(words: TranscriptWord[]): string {
  return JSON.stringify(
    {
      format: "word-level-timed-subtitles",
      words: words.map((w) => ({
        word: w.word,
        start: Number(w.start.toFixed(3)),
        end: Number(w.end.toFixed(3)),
      })),
    },
    null,
    2,
  );
}
