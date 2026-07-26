import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg, runFFmpeg, toBlob } from "./ffmpeg-client";

export type TranscribeLanguage = {
  code: string;
  label: string;
  whisperName: string;
};

/** لغات Whisper الشائعة — الرمز لواجهة API، والاسم للنموذج المحلي */
export const TRANSCRIBE_LANGUAGES: TranscribeLanguage[] = [
  { code: "ar", label: "العربية", whisperName: "arabic" },
  { code: "en", label: "English", whisperName: "english" },
  { code: "fr", label: "Français", whisperName: "french" },
  { code: "de", label: "Deutsch", whisperName: "german" },
  { code: "es", label: "Español", whisperName: "spanish" },
  { code: "tr", label: "Türkçe", whisperName: "turkish" },
  { code: "ru", label: "Русский", whisperName: "russian" },
  { code: "it", label: "Italiano", whisperName: "italian" },
  { code: "pt", label: "Português", whisperName: "portuguese" },
  { code: "nl", label: "Nederlands", whisperName: "dutch" },
  { code: "pl", label: "Polski", whisperName: "polish" },
  { code: "hi", label: "हिन्दी", whisperName: "hindi" },
  { code: "zh", label: "中文", whisperName: "chinese" },
  { code: "ja", label: "日本語", whisperName: "japanese" },
  { code: "ko", label: "한국어", whisperName: "korean" },
  { code: "auto", label: "اكتشاف تلقائي", whisperName: "auto" },
];

const SAMPLE_RATE = 16000;
/** مقاطع قصيرة بدقّة أعلى وتغطية كاملة */
const CHUNK_SECONDS = 20;
const OVERLAP_SECONDS = 2;
/** مقاطع أدق لمسار الترجمة الفرعية */
const ACCURATE_CHUNK_SECONDS = 15;
const ACCURATE_OVERLAP_SECONDS = 2.5;
/** الحد الأقصى المدعوم: 30 دقيقة */
export const MAX_TRANSCRIBE_DURATION_SEC = 30 * 60;
/** حجم ملف معقول لفيديو ~30 دقيقة */
export const MAX_VIDEO_TO_TEXT_MB = 800;
/** لا نرفع للصوت الطويل للخادم (حد Vercel) — نقطع محلياً ثم نرفع */
const MAX_SERVER_AUDIO_BYTES = 20 * 1024 * 1024;
const SERVER_CHUNK_SECONDS = 55;
const SERVER_CHUNK_OVERLAP = 1.2;

export type TranscribeQuality = "fast" | "accurate";

/**
 * يستخرج صوت الفيديو كـ WAV أحادي 16kHz — يقصّ عند 30 دقيقة كحد أقصى.
 */
export async function extractTranscriptionAudio(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<{ audio: File; durationSec: number }> {
  const ffmpeg = await getFFmpeg(onProgress);
  const inputExt =
    file.name.split(".").pop()?.toLowerCase() ||
    (file.type.includes("audio") ? "mp3" : "mp4");
  const input = `in.${inputExt}`;
  const output = "speech.wav";
  await ffmpeg.writeFile(input, await fetchFile(file));
  await runFFmpeg([
    "-i",
    input,
    "-t",
    String(MAX_TRANSCRIBE_DURATION_SEC),
    "-vn",
    "-ac",
    "1",
    "-ar",
    String(SAMPLE_RATE),
    "-c:a",
    "pcm_s16le",
    output,
  ]);
  const data = await ffmpeg.readFile(output);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
  const blob = toBlob(data, "audio/wav");
  const audio = new File([blob], "speech.wav", { type: "audio/wav" });
  // تقدير المدة من حجم PCM 16-bit mono
  const durationSec = Math.max(
    0.1,
    (blob.size - 44) / (SAMPLE_RATE * 2),
  );
  if (durationSec > MAX_TRANSCRIBE_DURATION_SEC + 1) {
    throw new Error(
      `الحد الأقصى ${MAX_TRANSCRIBE_DURATION_SEC / 60} دقيقة — قصّ الفيديو أولاً`,
    );
  }
  return { audio, durationSec };
}

export async function transcribeViaServer(
  audio: File,
  languageCode: string,
  withTimestamps = false,
): Promise<{
  text: string;
  provider: string;
  cues?: TranscriptCue[];
} | null> {
  if (audio.size > MAX_SERVER_AUDIO_BYTES) return null;
  const form = new FormData();
  form.append("file", audio, audio.name);
  form.append("language", languageCode);
  if (withTimestamps) form.append("timestamps", "1");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (res.status === 501) return null;
  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    provider?: string;
    error?: string;
    message?: string;
    cues?: TranscriptCue[];
  };
  if (!res.ok) {
    throw new Error(data.error || data.message || "فشل التفريغ على الخادم");
  }
  if (!data.text) throw new Error("لم يُرجع الخادم نصاً");
  return {
    text: data.text,
    provider: data.provider || "server",
    cues: Array.isArray(data.cues) ? data.cues : undefined,
  };
}

/** يقطع WAV ويرسله لمحرك الخادم (Groq large-v3) بمزامنة أزمنة دقيقة */
export async function transcribeViaServerChunked(
  audio: File,
  languageCode: string,
  durationSec: number,
  onStatus?: (msg: string) => void,
  onProgress?: (ratio: number) => void,
): Promise<{
  text: string;
  provider: string;
  cues: TranscriptCue[];
} | null> {
  // فحص سريع: هل المفتاح متاح؟
  const caps = await fetch("/api/transcribe/capabilities")
    .then((r) => r.json())
    .catch(() => null) as { highAccuracy?: boolean } | null;
  if (!caps?.highAccuracy) return null;

  const samples = await decodeWavToFloat32(audio);
  const chunkLen = Math.floor(SERVER_CHUNK_SECONDS * SAMPLE_RATE);
  const hop = Math.floor((SERVER_CHUNK_SECONDS - SERVER_CHUNK_OVERLAP) * SAMPLE_RATE);
  const slices: Array<{ startSec: number; file: File; index: number }> = [];

  if (samples.length <= chunkLen) {
    slices.push({ startSec: 0, file: audio, index: 0 });
  } else {
    let index = 0;
    for (let start = 0; start < samples.length; start += hop) {
      const end = Math.min(samples.length, start + chunkLen);
      const view = samples.subarray(start, end);
      if (view.length < SAMPLE_RATE * 0.5 && index > 0) break;
      const wav = float32ToWavFile(view, SAMPLE_RATE, `part-${index}.wav`);
      slices.push({
        startSec: start / SAMPLE_RATE,
        file: wav,
        index,
      });
      index += 1;
      if (end >= samples.length) break;
    }
  }

  const allCues: TranscriptCue[] = [];
  const texts: string[] = [];
  let provider = "server";

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i]!;
    const nextStart =
      i + 1 < slices.length ? slices[i + 1]!.startSec : Number.POSITIVE_INFINITY;
    // قص عند منتصف التداخل حتى لا نفقد كلاماً ولا نكرّر
    const keepUntil =
      i + 1 < slices.length
        ? (slice.startSec + SERVER_CHUNK_SECONDS + nextStart) / 2
        : Number.POSITIVE_INFINITY;
    const keepFrom =
      i === 0 ? 0 : (slices[i - 1]!.startSec + SERVER_CHUNK_SECONDS + slice.startSec) / 2;

    onStatus?.(
      `تفريغ سحابي عالي الدقة ${i + 1}/${slices.length} (Whisper Large)…`,
    );
    onProgress?.(0.1 + (0.8 * i) / Math.max(1, slices.length));
    const part = await transcribeViaServer(slice.file, languageCode, true);
    if (!part) return null;
    provider = part.provider;
    if (part.text) texts.push(part.text);
    const cues = (part.cues?.length
      ? part.cues
      : splitTextToCues(part.text, Math.min(SERVER_CHUNK_SECONDS, durationSec - slice.startSec))
    ).map((c) => ({
      start: c.start + slice.startSec,
      end: c.end + slice.startSec,
      text: c.text,
    }));
    const filtered = cues.filter((c) => {
      const mid = (c.start + c.end) / 2;
      return mid >= keepFrom - 0.01 && mid < keepUntil + 0.01;
    });
    allCues.push(...filtered);
    await yieldUi();
  }

  const merged = mergeTimedCues(allCues);
  const text = mergeChunkTexts(texts) || merged.map((c) => c.text).join(" ");
  if (!text) return null;
  return {
    text,
    provider: `${provider}-large · ${slices.length} جزء`,
    cues: merged.length ? merged : splitTextToCues(text, durationSec),
  };
}

function float32ToWavFile(
  samples: Float32Array,
  sampleRate: number,
  name: string,
): File {
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new File([buffer], name, { type: "audio/wav" });
}

type WhisperResult = {
  text?: string;
  chunks?: Array<{
    text?: string;
    timestamp?: [number, number] | number[];
  }>;
};

/** مقطع ترجمة فرعية بزمن بالثواني */
export type TranscriptCue = {
  start: number;
  end: number;
  text: string;
};

type WhisperPipeline = (
  audio: Float32Array | string,
  opts?: Record<string, unknown>,
) => Promise<WhisperResult | string>;

const pipelineByQuality: Partial<
  Record<
    TranscribeQuality,
    Promise<{ pipe: WhisperPipeline; label: string }> | null
  >
> = {
  fast: null,
  accurate: null,
};

async function getLocalWhisper(
  onStatus?: (msg: string) => void,
  quality: TranscribeQuality = "fast",
): Promise<{ pipe: WhisperPipeline; label: string }> {
  const cached = pipelineByQuality[quality];
  if (cached) return cached;

  const promise = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const attempts: Array<{
      model: string;
      device: "wasm";
      dtype: "fp32" | "q8" | "q4";
      label: string;
    }> =
      quality === "accurate"
        ? [
            {
              model: "onnx-community/whisper-medium_timestamped",
              device: "wasm",
              dtype: "q8",
              label: "whisper-medium-hq",
            },
            {
              model: "Xenova/whisper-medium",
              device: "wasm",
              dtype: "q8",
              label: "xenova-whisper-medium",
            },
            {
              model: "onnx-community/whisper-small",
              device: "wasm",
              dtype: "fp32",
              label: "whisper-small-hq",
            },
          ]
        : [
            {
              model: "onnx-community/whisper-small",
              device: "wasm",
              dtype: "fp32",
              label: "whisper-small-hq",
            },
            {
              model: "Xenova/whisper-small",
              device: "wasm",
              dtype: "fp32",
              label: "xenova-whisper-small",
            },
            {
              model: "onnx-community/whisper-base",
              device: "wasm",
              dtype: "fp32",
              label: "whisper-base-hq",
            },
          ];

    let lastErr: unknown;
    for (const attempt of attempts) {
      try {
        onStatus?.(
          quality === "accurate"
            ? `تحميل نموذج أدق للترجمة (${attempt.label}) — أول مرة أبطأ ثم يُخزَّن…`
            : `تحميل نموذج التعرف (${attempt.label}) — مرة واحدة ثم يُخزَّن…`,
        );
        const pipe = await pipeline(
          "automatic-speech-recognition",
          attempt.model,
          {
            dtype: attempt.dtype,
            device: attempt.device,
          },
        );
        return {
          pipe: pipe as unknown as WhisperPipeline,
          label: attempt.label,
        };
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 80));
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error("تعذّر تحميل نموذج التعرف على الكلام");
  })().catch((err) => {
    pipelineByQuality[quality] = null;
    throw err;
  });

  pipelineByQuality[quality] = promise;
  return promise;
}

async function decodeWavToFloat32(file: File): Promise<Float32Array> {
  const buf = await file.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
  try {
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    const ch0 = decoded.getChannelData(0);
    if (Math.abs(decoded.sampleRate - SAMPLE_RATE) < 1) {
      return new Float32Array(ch0);
    }
    const ratio = decoded.sampleRate / SAMPLE_RATE;
    const len = Math.floor(ch0.length / ratio);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = ch0[Math.floor(i * ratio)] ?? 0;
    }
    return out;
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

function extractText(result: WhisperResult | string): string {
  if (typeof result === "string") return result.trim();
  if (result.chunks?.length) {
    return result.chunks
      .map((c) => (c.text || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return (result.text || "").trim();
}

function extractCuesFromResult(
  result: WhisperResult | string,
  offsetSec: number,
): TranscriptCue[] {
  if (typeof result === "string") {
    const text = result.trim();
    if (!text) return [];
    return [{ start: offsetSec, end: offsetSec + 2, text }];
  }
  const chunks = result.chunks;
  if (chunks?.length) {
    const cues: TranscriptCue[] = [];
    for (const c of chunks) {
      const text = (c.text || "").trim();
      if (!text) continue;
      const ts = c.timestamp;
      const start =
        Array.isArray(ts) && typeof ts[0] === "number"
          ? offsetSec + Math.max(0, ts[0])
          : offsetSec;
      const end =
        Array.isArray(ts) && typeof ts[1] === "number"
          ? offsetSec + Math.max(start - offsetSec + 0.4, ts[1])
          : start + Math.max(1.2, text.split(/\s+/u).length * 0.35);
      cues.push({ start, end, text });
    }
    return cues;
  }
  const text = (result.text || "").trim();
  if (!text) return [];
  return [{ start: offsetSec, end: offsetSec + 3, text }];
}

function mergeTimedCues(parts: TranscriptCue[]): TranscriptCue[] {
  if (!parts.length) return [];
  const sorted = [...parts].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: TranscriptCue[] = [];
  for (const cue of sorted) {
    const prev = out[out.length - 1];
    if (!prev) {
      out.push({ ...cue });
      continue;
    }
    // تجاهل تكرار التداخل بين مقاطع الصوت
    if (
      cue.start < prev.end - 0.15 &&
      normalizeCueText(cue.text) === normalizeCueText(prev.text)
    ) {
      prev.end = Math.max(prev.end, cue.end);
      continue;
    }
    if (
      cue.start <= prev.end + 0.35 &&
      cue.text.length < 80 &&
      prev.text.length + cue.text.length < 110
    ) {
      // دمج جمل قصيرة متجاورة
      prev.text = `${prev.text} ${cue.text}`.replace(/\s+/gu, " ").trim();
      prev.end = Math.max(prev.end, cue.end);
      continue;
    }
    if (cue.start < prev.end) {
      cue.start = prev.end + 0.04;
    }
    if (cue.end <= cue.start + 0.25) {
      cue.end = cue.start + 0.8;
    }
    out.push({ ...cue });
  }
  return out;
}

function normalizeCueText(t: string) {
  return t.replace(/\s+/gu, " ").trim().toLowerCase();
}

function mergeChunkTexts(parts: string[]): string {
  if (!parts.length) return "";
  let out = parts[0]!.trim();
  for (let i = 1; i < parts.length; i++) {
    const next = parts[i]!.trim();
    if (!next) continue;
    const outWords = out.split(/\s+/u);
    const nextWords = next.split(/\s+/u);
    let overlap = 0;
    const max = Math.min(12, outWords.length, nextWords.length);
    for (let n = max; n >= 2; n--) {
      const a = outWords.slice(-n).join(" ");
      const b = nextWords.slice(0, n).join(" ");
      if (a === b) {
        overlap = n;
        break;
      }
    }
    const rest = nextWords.slice(overlap).join(" ");
    if (rest) out = `${out} ${rest}`;
  }
  return out.replace(/\s+/gu, " ").trim();
}

function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function yieldUi() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

/**
 * يمرّ على الصوت بمقاطع متداخلة دون نسخ كل المقاطع في الذاكرة دفعة واحدة.
 */
async function* iterateAudioChunks(
  samples: Float32Array,
  chunkSeconds = CHUNK_SECONDS,
  overlapSeconds = OVERLAP_SECONDS,
): AsyncGenerator<{ view: Float32Array; index: number; total: number }> {
  const chunkLen = chunkSeconds * SAMPLE_RATE;
  const hop = Math.max(
    SAMPLE_RATE,
    (chunkSeconds - overlapSeconds) * SAMPLE_RATE,
  );
  const total =
    samples.length <= chunkLen
      ? 1
      : Math.ceil(Math.max(1, samples.length - chunkLen) / hop) + 1;

  if (samples.length <= chunkLen) {
    yield { view: samples, index: 0, total: 1 };
    return;
  }

  let index = 0;
  for (let start = 0; start < samples.length; start += hop) {
    const end = Math.min(samples.length, start + chunkLen);
    const view = samples.subarray(start, end);
    if (view.length < SAMPLE_RATE * 0.4 && index > 0) break;
    yield { view, index, total };
    index += 1;
    if (end >= samples.length) break;
  }
}

export async function transcribeLocally(
  audio: File,
  languageCode: string,
  onStatus?: (msg: string) => void,
  onProgress?: (ratio: number) => void,
  knownDurationSec?: number,
  quality: TranscribeQuality = "fast",
): Promise<{
  text: string;
  provider: string;
  durationSec: number;
  cues: TranscriptCue[];
}> {
  const { pipe, label } = await getLocalWhisper(onStatus, quality);
  onStatus?.("تحميل الصوت في الذاكرة وتقسيمه لمقاطع…");
  const samples = await decodeWavToFloat32(audio);
  const durationSec = knownDurationSec ?? samples.length / SAMPLE_RATE;

  if (durationSec > MAX_TRANSCRIBE_DURATION_SEC + 0.5) {
    throw new Error(
      `الحد الأقصى ${MAX_TRANSCRIBE_DURATION_SEC / 60} دقيقة من الكلام`,
    );
  }

  const mins = (durationSec / 60).toFixed(1);
  onStatus?.(
    `مدة الصوت ${mins} دقيقة (${formatClock(durationSec)}) — تفريغ كل الكلمات…`,
  );

  const chunkSec =
    quality === "accurate" ? ACCURATE_CHUNK_SECONDS : CHUNK_SECONDS;
  const overlapSec =
    quality === "accurate" ? ACCURATE_OVERLAP_SECONDS : OVERLAP_SECONDS;
  const hopSec = chunkSec - overlapSec;

  const lang = TRANSCRIBE_LANGUAGES.find((l) => l.code === languageCode);
  const baseOpts: Record<string, unknown> = {
    task: "transcribe",
    return_timestamps: true,
    chunk_length_s: quality === "accurate" ? 20 : 30,
    stride_length_s: quality === "accurate" ? 3 : 5,
  };
  if (lang && lang.code !== "auto") {
    baseOpts.language = lang.whisperName;
  }
  // prompt قصير جداً فقط — الطويل يجعل Whisper يكرّر التوجيه بدل الكلام
  if (lang?.code === "ar") {
    baseOpts.initial_prompt = "العربية.";
  } else if (lang?.code === "en") {
    baseOpts.initial_prompt = "English.";
  }

  const parts: string[] = [];
  const timed: TranscriptCue[] = [];
  let processed = 0;
  let totalChunks = 1;

  for await (const { view, index, total } of iterateAudioChunks(
    samples,
    chunkSec,
    overlapSec,
  )) {
    totalChunks = total;
    const offsetSec = index * hopSec;
    const at = offsetSec;
    onStatus?.(
      `تفريغ المقطع ${index + 1} من ~${total} · عند ${formatClock(at)} / ${formatClock(durationSec)}`,
    );
    onProgress?.(0.12 + (0.85 * index) / Math.max(1, total));
    const slice = new Float32Array(view);
    const result = await pipe(slice, baseOpts);
    const text = extractText(result);
    if (text) parts.push(text);
    const cues = extractCuesFromResult(result, offsetSec).filter((c) => {
      if (index === 0) return true;
      return c.start >= offsetSec + overlapSec * 0.55;
    });
    timed.push(...cues);
    processed += 1;
    await yieldUi();
  }

  onProgress?.(0.98);
  const text = mergeChunkTexts(parts);
  if (!text) throw new Error("لم يُكتشف كلام واضح في الملف");
  let cues = mergeTimedCues(timed);
  if (!cues.length) {
    cues = splitTextToCues(text, durationSec);
  }
  return {
    text,
    provider: `${label} · ${processed || totalChunks} مقطع · حتى 30د`,
    durationSec,
    cues,
  };
}

function splitTextToCues(text: string, durationSec: number): TranscriptCue[] {
  const sentences = text
    .split(/(?<=[.!?؟。！？\n])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!sentences.length) return [{ start: 0, end: durationSec, text }];
  const totalChars = sentences.reduce((n, s) => n + s.length, 0) || 1;
  let t = 0;
  return sentences.map((s) => {
    const span = Math.max(1.2, (s.length / totalChars) * durationSec);
    const start = t;
    const end = Math.min(durationSec, t + span);
    t = end;
    return { start, end, text: s };
  });
}

export async function transcribeMediaFile(
  file: File,
  languageCode: string,
  onProgress?: (ratio: number) => void,
  onStatus?: (msg: string) => void,
  quality: TranscribeQuality = "fast",
): Promise<{
  text: string;
  provider: string;
  durationSec?: number;
  cues?: TranscriptCue[];
}> {
  if (file.size > MAX_VIDEO_TO_TEXT_MB * 1024 * 1024) {
    throw new Error(`الحد الأقصى لحجم الملف ${MAX_VIDEO_TO_TEXT_MB}MB`);
  }

  onStatus?.("استخراج الصوت (حتى 30 دقيقة كحد أقصى)…");
  onProgress?.(0.04);
  const { audio, durationSec } = await extractTranscriptionAudio(file, (r) =>
    onProgress?.(0.04 + r * 0.08),
  );

  onStatus?.(
    `استُخرج ${formatClock(durationSec)} من الصوت — بدء التفريغ الكامل…`,
  );

  const serverMaxMin = quality === "accurate" ? 12 : 8;
  const fitsSingleUpload =
    audio.size <= MAX_SERVER_AUDIO_BYTES && durationSec <= serverMaxMin * 60;

  // فيديوهات قصيرة/متوسطة: طلب واحد أدق وأكمل من التقطيع
  if (quality === "accurate" && fitsSingleUpload) {
    onStatus?.("تفريغ سحابي كامل دفعة واحدة (Whisper Large)…");
    try {
      const server = await transcribeViaServer(audio, languageCode, true);
      if (server?.text) {
        onProgress?.(1);
        const cues =
          server.cues?.length
            ? server.cues
            : splitTextToCues(server.text, durationSec);
        return {
          ...server,
          provider: `${server.provider}-large`,
          durationSec,
          cues,
        };
      }
    } catch {
      // سقوط للتقطيع ثم المحلي
    }
  }

  // مقاطع أطول: تقطيع ثم Whisper Large
  if (quality === "accurate") {
    onStatus?.("تفريغ سحابي مقطّع عالي الدقة (Whisper Large)…");
    try {
      const cloud = await transcribeViaServerChunked(
        audio,
        languageCode,
        durationSec,
        onStatus,
        onProgress,
      );
      if (cloud) {
        onProgress?.(1);
        return { ...cloud, durationSec };
      }
    } catch {
      // سقوط للمحلي
    }
  }

  if (fitsSingleUpload && quality !== "accurate") {
    onStatus?.("محاولة التفريغ على الخادم…");
    try {
      const server = await transcribeViaServer(audio, languageCode, true);
      if (server) {
        onProgress?.(1);
        const cues =
          server.cues?.length
            ? server.cues
            : splitTextToCues(server.text, durationSec);
        return { ...server, durationSec, cues };
      }
    } catch {
      // سقوط محلي
    }
  }

  onStatus?.(
    quality === "accurate"
      ? "لا يتوفر مفتاح سحابي — التفريغ المحلي الأدق المتاح (قد تقل دقة الإملاء)…"
      : "التفريغ الكامل داخل المتصفح (جودة عالية · حتى 30 دقيقة)…",
  );
  return transcribeLocally(
    audio,
    languageCode,
    onStatus,
    onProgress,
    durationSec,
    quality,
  );
}
