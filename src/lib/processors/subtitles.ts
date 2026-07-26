import type { TranscriptCue } from "./transcribe";

export type SubtitleLang = "ar" | "en";

export type EditableCue = TranscriptCue & {
  id: string;
};

export function cuesToEditable(cues: TranscriptCue[]): EditableCue[] {
  return cues.map((c, i) => ({
    ...c,
    id: `c${i + 1}`,
  }));
}

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function pad3(n: number) {
  return String(Math.floor(n)).padStart(3, "0");
}

/** SRT: 00:00:01,000 */
export function formatSrtTime(sec: number) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const whole = Math.floor(r);
  const ms = Math.round((r - whole) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(whole)},${pad3(ms)}`;
}

/** VTT: 00:00:01.000 */
export function formatVttTime(sec: number) {
  return formatSrtTime(sec).replace(",", ".");
}

export function buildSrt(cues: TranscriptCue[]): string {
  return cues
    .map((c, i) => {
      const text = c.text.trim();
      return `${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${text}\n`;
    })
    .join("\n");
}

export function buildVtt(
  cues: TranscriptCue[],
  style?: { color?: string; fontSizePx?: number },
): string {
  const color = style?.color || "#FFFFFF";
  const fontSize = style?.fontSizePx || 28;
  const lines = [
    "WEBVTT",
    "",
    "STYLE",
    "::cue {",
    `  color: ${color};`,
    `  font-size: ${fontSize}px;`,
    "  background-color: rgba(0, 0, 0, 0.55);",
    "  font-family: system-ui, sans-serif;",
    "}",
    "",
  ];
  cues.forEach((c, i) => {
    lines.push(String(i + 1));
    lines.push(`${formatVttTime(c.start)} --> ${formatVttTime(c.end)}`);
    lines.push(c.text.trim());
    lines.push("");
  });
  return lines.join("\n");
}

export async function translateCues(
  cues: EditableCue[],
  from: SubtitleLang,
  to: SubtitleLang,
  onProgress?: (ratio: number) => void,
): Promise<EditableCue[]> {
  if (from === to) return cues.map((c) => ({ ...c }));
  const out: EditableCue[] = [];
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i]!;
    const translated = await translateText(c.text, from, to);
    out.push({ ...c, text: translated });
    onProgress?.((i + 1) / cues.length);
  }
  return out;
}

export async function translateText(
  text: string,
  from: SubtitleLang,
  to: SubtitleLang,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return trimmed;
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmed, from, to }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "فشل الترجمة");
  }
  return (data.text || trimmed).trim();
}

export function activeCueAt(cues: TranscriptCue[], time: number) {
  return cues.find((c) => time >= c.start && time < c.end) || null;
}

/**
 * تصحيح إملائي شائع لأخطاء Whisper في العربية (لهجات + أسماء دول).
 */
export function polishArabicText(input: string): string {
  let t = input;

  const replacements: Array<[RegExp, string]> = [
    // أسماء دول/مدن شائعة يخطئ فيها Whisper
    [/أكرانيا|إكرانيا|اكرانيا|أوكراينا|إوكراينا|أكراكيا|اكراكيا|كراكيا|أوكراكيا|اوكراكيا|أوكرانياا/gu, "أوكرانيا"],
    [/النمسة|النمسه|انمسا|النمسى/gu, "النمسا"],
    [/أوربا(?![اوي])|اوروبا|أوروبه|أوروبى/gu, "أوروبا"],
    [/للماني|الالماني|الألمانى|للالماني/gu, "للألماني"],
    [/(^|[^\u0600-\u06FF])الماني(?=[^\u0600-\u06FF]|$)/gu, "$1الألماني"],
    [/أمريكا|امريكا/gu, "أمريكا"],
    [/روسيا/gu, "روسيا"],
    [/تركي[اة]/gu, "تركيا"],
    [/بولونيا/gu, "بولندا"],
    [/المانيا|ألمانيا/gu, "ألمانيا"],
    [/سويسرا/gu, "سويسرا"],
    [/ايطاليا|إيطاليا/gu, "إيطاليا"],
    [/فرنسا/gu, "فرنسا"],
    [/بريطانيا/gu, "بريطانيا"],
    [/كندا/gu, "كندا"],
    [/الصين/gu, "الصين"],
    [/اليابان/gu, "اليابان"],
    [/بالنسبة\s+للألماني/gu, "بالنسبة للألماني"],
    [/فرق كبير بالأسفل/gu, "فرق كبير بالأسعار"],
    [/فرق كبير بالاسفل/gu, "فرق كبير بالأسعار"],
    [/فرق\s+كبير\s+بالاسعار/gu, "فرق كبير بالأسعار"],
    // أدوات لهجة شامية يسمعها Whisper خطأ
    [/وعب\s+/gu, "وعم "],
    [/وعن?\s*عب\s+/gu, "وعن عم "],
    [/(^|\s)عب\s+/gu, "$1عم "],
    [/(^|\s)عَب\s+/gu, "$1عم "],
    [/نتنطل/gu, "ننتقل"],
    [/بتنطل/gu, "بنتقل"],
    [/تنطل/gu, "تنتقل"],
    [/عب\s*تهيس/gu, "عم نعيش"],
    [/عم\s*تهيس/gu, "عم نعيش"],
    [/(^|[^\u0600-\u06FF])تهيس(?=[^\u0600-\u06FF]|$)/gu, "$1نعيش"],
    [/يعني\s+عيش/gu, "يعني نعيش"],
    [/يعني\s+عيس/gu, "يعني نعيش"],
    [/بإكرانيا|باكرانيا|بإوكرانيا/gu, "بأوكرانيا"],
    [/في\s*أكرانيا|في\s*إكرانيا/gu, "في أوكرانيا"],
    // مسافات وعلامات
    [/\s{2,}/gu, " "],
    [/\s+([,.!?؟،])/gu, "$1"],
  ];

  for (const [re, to] of replacements) {
    t = t.replace(re, to);
  }

  return t.trim();
}

export function polishCueText(text: string, lang: SubtitleLang): string {
  if (lang === "ar") return polishArabicText(text);
  // إنجليزي: تصحيحات بسيطة لأخطاء Whisper الشائعة
  return text
    .replace(/\bi\b/g, "I")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function polishCues(
  cues: EditableCue[],
  lang: SubtitleLang,
): EditableCue[] {
  return cues.map((c) => ({
    ...c,
    text: polishCueText(c.text, lang),
  }));
}

/**
 * مزامنة أزمنة المقاطع مع مدة الفيديو وإزالة الفجوات/التداخل.
 */
export function syncCuesToDuration(
  cues: TranscriptCue[],
  durationSec: number,
): TranscriptCue[] {
  if (!cues.length || durationSec <= 0) return cues;
  const sorted = [...cues]
    .map((c) => ({
      start: Math.max(0, c.start),
      end: Math.max(c.start + 0.35, c.end),
      text: c.text.trim(),
    }))
    .filter((c) => c.text)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (!sorted.length) return [];

  // إزالة التداخل وتوصيل الفجوات الصغيرة
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur.start < prev.end) {
      const mid = (prev.end + cur.start) / 2;
      prev.end = mid;
      cur.start = mid;
    } else if (cur.start - prev.end < 0.35) {
      prev.end = cur.start;
    }
    if (cur.end <= cur.start + 0.3) {
      cur.end = cur.start + 0.8;
    }
  }

  const last = sorted[sorted.length - 1]!;
  // لا نوسّع التوقيت لملء المدة إن كان التفريغ ناقصاً — فقط نقصّ ما تجاوز المدة
  if (last.end > durationSec + 0.4) {
    const origin = sorted[0]!.start;
    const span = Math.max(0.5, last.end - origin);
    const targetSpan = Math.max(0.5, durationSec - origin - 0.05);
    const scale = targetSpan / span;
    for (const c of sorted) {
      c.start = origin + (c.start - origin) * scale;
      c.end = origin + (c.end - origin) * scale;
    }
  }

  for (const c of sorted) {
    c.start = Math.max(0, Math.min(durationSec - 0.2, c.start));
    c.end = Math.max(c.start + 0.35, Math.min(durationSec, c.end));
  }
  if (last.end > durationSec - 0.05) {
    sorted[sorted.length - 1]!.end = Math.min(
      durationSec,
      Math.max(sorted[sorted.length - 1]!.start + 0.35, durationSec - 0.05),
    );
  }

  return sorted;
}

/** تصحيح إضافي عبر الخادم إن وُجد مفتاح، وإلا يبقى التصحيح المحلي */
export async function proofreadCues(
  cues: EditableCue[],
  lang: SubtitleLang,
  onProgress?: (ratio: number) => void,
): Promise<EditableCue[]> {
  const local = polishCues(cues, lang);
  try {
    const res = await fetch("/api/proofread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang,
        cues: local.map((c) => ({ id: c.id, text: c.text })),
      }),
    });
    if (res.status === 501) {
      onProgress?.(1);
      return local;
    }
    const data = (await res.json().catch(() => ({}))) as {
      cues?: Array<{ id: string; text: string }>;
      error?: string;
    };
    if (!res.ok || !Array.isArray(data.cues)) {
      onProgress?.(1);
      return local;
    }
    const map = new Map(data.cues.map((c) => [c.id, c.text]));
    const out = local.map((c) => ({
      ...c,
      text: polishCueText(map.get(c.id) || c.text, lang),
    }));
    onProgress?.(1);
    return out;
  } catch {
    onProgress?.(1);
    return local;
  }
}

function probeVideoSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      URL.revokeObjectURL(url);
      if (!w || !h) reject(new Error("أبعاد الفيديو غير صالحة"));
      else resolve({ w, h });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذّر قراءة الفيديو"));
    };
    video.src = url;
  });
}

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.replace(/\s+/gu, " ").trim().split(" ");
  if (!words.length) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth) {
      line = trial;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

async function renderCuePng(
  text: string,
  videoWidth: number,
  opts: { color: string; fontSizePx: number; rtl: boolean },
): Promise<Blob> {
  const width = Math.max(320, Math.min(1920, videoWidth));
  const fontSize = Math.max(
    22,
    Math.min(64, Math.round(opts.fontSizePx * (width / 720))),
  );
  const padX = Math.round(width * 0.04);
  const lineH = Math.round(fontSize * 1.35);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر رسم الترجمة");
  ctx.font = `bold ${fontSize}px "Segoe UI", "Noto Sans Arabic", "Tahoma", sans-serif`;
  ctx.direction = opts.rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapCanvasLines(ctx, text, width - padX * 2);
  const boxH = Math.max(lineH + 24, lines.length * lineH + 28);
  canvas.height = boxH;
  // redraw after resize
  ctx.font = `bold ${fontSize}px "Segoe UI", "Noto Sans Arabic", "Tahoma", sans-serif`;
  ctx.direction = opts.rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.clearRect(0, 0, width, boxH);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const bx = Math.round(padX * 0.4);
  const bw = width - bx * 2;
  ctx.fillRect(bx, 4, bw, boxH - 8);
  ctx.fillStyle = opts.color || "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 4;
  const startY = boxH / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, width / 2, startY + i * lineH);
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل إنشاء صورة الترجمة"))),
      "image/png",
    );
  });
}

const BURN_BATCH = 10;

/**
 * يدمج الترجمة داخل الفيديو (حرق) ثم ينزّل MP4 — يمر عبر بوابة التقييم.
 */
export async function downloadVideoWithBurnedSubtitles(
  video: File,
  cues: TranscriptCue[],
  opts: { color: string; fontSizePx: number; rtl: boolean },
  onProgress?: (ratio: number) => void,
  onStatus?: (msg: string) => void,
) {
  const isVideo =
    video.type.startsWith("video/") ||
    /\.(mp4|webm|mov|mkv|m4v)$/i.test(video.name);
  if (!isVideo) {
    throw new Error("الملف ليس فيديو — استخدم تنزيل SRT أو VTT");
  }
  const usable = cues
    .map((c) => ({
      start: Math.max(0, c.start),
      end: Math.max(c.start + 0.2, c.end),
      text: c.text.trim(),
    }))
    .filter((c) => c.text);
  if (!usable.length) throw new Error("لا توجد مقاطع للدمج");

  const { fetchFile } = await import("@ffmpeg/util");
  const {
    basename,
    downloadBlob,
    getFFmpeg,
    inputFileName,
    toBlob,
  } = await import("./ffmpeg-client");

  const { w } = await probeVideoSize(video);
  onStatus?.("تحضير طبقات الترجمة…");

  let current: File = video;
  const batches = Math.ceil(usable.length / BURN_BATCH);

  for (let b = 0; b < batches; b++) {
    const slice = usable.slice(b * BURN_BATCH, (b + 1) * BURN_BATCH);
    onStatus?.(
      batches > 1
        ? `دمج الترجمة في الفيديو ${b + 1}/${batches}…`
        : "دمج الترجمة في الفيديو…",
    );
    const ffmpeg = await getFFmpeg((r) =>
      onProgress?.((b + Math.min(1, Math.max(0, r))) / batches),
    );
    const input = inputFileName(current, "mp4");
    const output = "burned.mp4";
    await ffmpeg.writeFile(input, await fetchFile(current));

    const pngNames: string[] = [];
    for (let i = 0; i < slice.length; i++) {
      const png = await renderCuePng(slice[i]!.text, w, opts);
      const name = `cue${b}_${i}.png`;
      await ffmpeg.writeFile(name, await fetchFile(png));
      pngNames.push(name);
    }

    const parts: string[] = [];
    let lastLabel = "[0:v]";
    for (let i = 0; i < slice.length; i++) {
      const c = slice[i]!;
      const outLabel = i === slice.length - 1 ? "[vout]" : `[vb${b}_${i}]`;
      const start = c.start.toFixed(3);
      const end = c.end.toFixed(3);
      parts.push(
        `${lastLabel}[${i + 1}:v]overlay=(W-w)/2:H-h-48:enable='between(t\\,${start}\\,${end})'${outLabel}`,
      );
      lastLabel = outLabel;
    }

    const args = ["-i", input];
    for (const name of pngNames) {
      args.push("-i", name);
    }
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
      throw new Error("فشل دمج الترجمة في الفيديو");
    }
    const data = await ffmpeg.readFile(output);
    const blob = toBlob(data, "video/mp4");
    current = new File([blob], `partial-${b}.mp4`, { type: "video/mp4" });

    try {
      await ffmpeg.deleteFile(input);
      await ffmpeg.deleteFile(output);
      for (const name of pngNames) await ffmpeg.deleteFile(name);
    } catch {
      /* ignore */
    }
  }

  onStatus?.("تنزيل الفيديو مع الترجمة…");
  await downloadBlob(
    current,
    `${basename(video.name)}-subtitles.mp4`,
  );
  onProgress?.(1);
}
