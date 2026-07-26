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

export type KineticStyle = {
  baseColor: string;
  highlightColor: string;
  fontSizePx: number;
  rtl: boolean;
};

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
  const fontSize = Math.max(
    22,
    Math.round(style.fontSizePx * (videoH / 720)),
  );
  const padX = Math.round(fontSize * 0.55);
  const padY = Math.round(fontSize * 0.45);
  const lineH = Math.round(fontSize * 1.25);
  const maxTextW = Math.min(videoW * 0.9, videoW - 48);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas غير متاح");

  ctx.font = `800 ${fontSize}px "Segoe UI", "Tahoma", "Arial Black", sans-serif`;
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
        padX * 2,
    ),
  );
  const boxH = rows.length * lineH + padY * 2;
  canvas.width = boxW;
  canvas.height = boxH;

  ctx.clearRect(0, 0, boxW, boxH);
  ctx.font = `800 ${fontSize}px "Segoe UI", "Tahoma", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = style.rtl ? "rtl" : "ltr";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  let flat = 0;
  rows.forEach((row, rowIdx) => {
    const y = padY + lineH / 2 + rowIdx * lineH;
    const full = row.join(" ");
    const totalW = ctx.measureText(full).width;
    let x = boxW / 2 - totalW / 2;
    if (style.rtl) {
      // رسم من اليمين لليسار: نبدأ من الطرف الأيمن للنص
      x = boxW / 2 + totalW / 2;
    }
    for (let i = 0; i < row.length; i++) {
      const word = row[i]!;
      const wWidth = ctx.measureText(word).width;
      const space = i < row.length - 1 ? ctx.measureText(" ").width : 0;
      const centerX = style.rtl
        ? x - wWidth / 2
        : x + wWidth / 2;
      const isActive = flat === activeIndex;
      const color = isActive ? style.highlightColor : style.baseColor;

      ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.14));
      ctx.strokeStyle = "#000000";
      ctx.strokeText(word, centerX, y);
      ctx.fillStyle = color;
      ctx.fillText(word, centerX, y);

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

    const bottomPad = Math.max(28, Math.round(h * 0.1));
    const parts: string[] = [];
    let lastLabel = "[0:v]";
    for (let i = 0; i < slice.length; i++) {
      const f = slice[i]!;
      const outLabel = i === slice.length - 1 ? "[vout]" : `[kb${b}_${i}]`;
      parts.push(
        `${lastLabel}[${i + 1}:v]overlay=(W-w)/2:H-h-${bottomPad}:enable='between(t\\,${f.start.toFixed(3)}\\,${f.end.toFixed(3)})'${outLabel}`,
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
