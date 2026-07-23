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
/** الحد الأقصى المدعوم: 30 دقيقة */
export const MAX_TRANSCRIBE_DURATION_SEC = 30 * 60;
/** حجم ملف معقول لفيديو ~30 دقيقة */
export const MAX_VIDEO_TO_TEXT_MB = 800;
/** لا نرفع للصوت الطويل للخادم (حد Vercel) */
const MAX_SERVER_AUDIO_BYTES = 20 * 1024 * 1024;

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
): Promise<{ text: string; provider: string } | null> {
  if (audio.size > MAX_SERVER_AUDIO_BYTES) return null;
  const form = new FormData();
  form.append("file", audio, audio.name);
  form.append("language", languageCode);
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (res.status === 501) return null;
  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    provider?: string;
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || data.message || "فشل التفريغ على الخادم");
  }
  if (!data.text) throw new Error("لم يُرجع الخادم نصاً");
  return { text: data.text, provider: data.provider || "server" };
}

type WhisperResult = {
  text?: string;
  chunks?: Array<{ text?: string }>;
};

type WhisperPipeline = (
  audio: Float32Array | string,
  opts?: Record<string, unknown>,
) => Promise<WhisperResult | string>;

let pipelinePromise: Promise<{
  pipe: WhisperPipeline;
  label: string;
}> | null = null;

async function getLocalWhisper(
  onStatus?: (msg: string) => void,
): Promise<{ pipe: WhisperPipeline; label: string }> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const attempts: Array<{
        model: string;
        device: "wasm";
        dtype: "fp32";
        label: string;
      }> = [
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
            `تحميل نموذج عالي الدقة (${attempt.label}) — مرة واحدة ثم يُخزَّن…`,
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
      pipelinePromise = null;
      throw err;
    });
  }
  return pipelinePromise;
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
): AsyncGenerator<{ view: Float32Array; index: number; total: number }> {
  const chunkLen = CHUNK_SECONDS * SAMPLE_RATE;
  const hop = Math.max(
    SAMPLE_RATE,
    (CHUNK_SECONDS - OVERLAP_SECONDS) * SAMPLE_RATE,
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
): Promise<{ text: string; provider: string; durationSec: number }> {
  const { pipe, label } = await getLocalWhisper(onStatus);
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

  const lang = TRANSCRIBE_LANGUAGES.find((l) => l.code === languageCode);
  const baseOpts: Record<string, unknown> = {
    task: "transcribe",
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  };
  if (lang && lang.code !== "auto") {
    baseOpts.language = lang.whisperName;
  }

  const parts: string[] = [];
  let processed = 0;
  let totalChunks = 1;

  for await (const { view, index, total } of iterateAudioChunks(samples)) {
    totalChunks = total;
    const at = (index * CHUNK_SECONDS * (1 - OVERLAP_SECONDS / CHUNK_SECONDS));
    onStatus?.(
      `تفريغ المقطع ${index + 1} من ~${total} · عند ${formatClock(at)} / ${formatClock(durationSec)}`,
    );
    onProgress?.(0.12 + (0.85 * index) / Math.max(1, total));
    // نسخ مقطع واحد فقط للنموذج (يتجنب مشاكل الـ views أحياناً)
    const slice = new Float32Array(view);
    const result = await pipe(slice, baseOpts);
    const text = extractText(result);
    if (text) parts.push(text);
    processed += 1;
    await yieldUi();
  }

  onProgress?.(0.98);
  const text = mergeChunkTexts(parts);
  if (!text) throw new Error("لم يُكتشف كلام واضح في الملف");
  return {
    text,
    provider: `${label} · ${processed || totalChunks} مقطع · حتى 30د`,
    durationSec,
  };
}

export async function transcribeMediaFile(
  file: File,
  languageCode: string,
  onProgress?: (ratio: number) => void,
  onStatus?: (msg: string) => void,
): Promise<{ text: string; provider: string; durationSec?: number }> {
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

  // الملفات القصيرة فقط قد تمر عبر الخادم إن وُجد مفتاح
  if (audio.size <= MAX_SERVER_AUDIO_BYTES && durationSec <= 8 * 60) {
    onStatus?.("محاولة التفريغ عالي الدقة على الخادم…");
    try {
      const server = await transcribeViaServer(audio, languageCode);
      if (server) {
        onProgress?.(1);
        return { ...server, durationSec };
      }
    } catch {
      // سقوط محلي
    }
  }

  onStatus?.("التفريغ الكامل داخل المتصفح (جودة عالية · حتى 30 دقيقة)…");
  return transcribeLocally(
    audio,
    languageCode,
    onStatus,
    onProgress,
    durationSec,
  );
}
