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
/** مقاطع قصيرة بدقّة أعلى وتغطية كاملة للفيديو */
const CHUNK_SECONDS = 20;
const OVERLAP_SECONDS = 2;

/**
 * يستخرج صوت الفيديو كـ WAV أحادي 16kHz لأقصى دقة تفريغ.
 */
export async function extractTranscriptionAudio(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<File> {
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
  return new File([blob], "speech.wav", { type: "audio/wav" });
}

export async function transcribeViaServer(
  audio: File,
  languageCode: string,
): Promise<{ text: string; provider: string } | null> {
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

/**
 * أفضل جودة عملية في المتصفح: whisper-small fp32 على WASM.
 * نتجنب WebGPU (غالباً يقطع النص أو يشوّهه) و q8 المعطوب.
 */
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

/** إزالة تكرار نهاية/بداية المقاطع المتداخلة */
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

function splitAudioChunks(samples: Float32Array): Float32Array[] {
  const chunkLen = CHUNK_SECONDS * SAMPLE_RATE;
  const hop = Math.max(
    SAMPLE_RATE,
    (CHUNK_SECONDS - OVERLAP_SECONDS) * SAMPLE_RATE,
  );
  const chunks: Float32Array[] = [];
  if (samples.length <= chunkLen) {
    chunks.push(samples);
    return chunks;
  }
  for (let start = 0; start < samples.length; start += hop) {
    const end = Math.min(samples.length, start + chunkLen);
    const slice = samples.subarray(start, end);
    // تجاهل ذيل أقصر من نصف ثانية بلا كلام مفيد غالباً
    if (slice.length < SAMPLE_RATE * 0.4 && chunks.length > 0) break;
    chunks.push(new Float32Array(slice));
    if (end >= samples.length) break;
  }
  return chunks;
}

export async function transcribeLocally(
  audio: File,
  languageCode: string,
  onStatus?: (msg: string) => void,
  onProgress?: (ratio: number) => void,
): Promise<{ text: string; provider: string; durationSec: number }> {
  const { pipe, label } = await getLocalWhisper(onStatus);
  onStatus?.("تحليل الصوت وتقسيمه لمقاطع كاملة…");
  const samples = await decodeWavToFloat32(audio);
  const durationSec = samples.length / SAMPLE_RATE;
  onStatus?.(
    `مدة الصوت ${durationSec.toFixed(1)} ثانية — تفريغ كل المقاطع…`,
  );

  const lang = TRANSCRIBE_LANGUAGES.find((l) => l.code === languageCode);
  const baseOpts: Record<string, unknown> = {
    task: "transcribe",
    // ضروري لمعالجة أطول من ~30ث داخل المقطع إن لزم
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  };
  if (lang && lang.code !== "auto") {
    baseOpts.language = lang.whisperName;
  }

  const chunks = splitAudioChunks(samples);
  const parts: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onStatus?.(`تفريغ المقطع ${i + 1} من ${chunks.length}…`);
    onProgress?.(0.15 + (0.8 * i) / Math.max(1, chunks.length));
    const result = await pipe(chunks[i]!, baseOpts);
    const text = extractText(result);
    if (text) parts.push(text);
  }

  onProgress?.(0.98);
  const text = mergeChunkTexts(parts);
  if (!text) throw new Error("لم يُكتشف كلام واضح في الملف");
  return { text, provider: `${label} · ${chunks.length} مقطع`, durationSec };
}

export async function transcribeMediaFile(
  file: File,
  languageCode: string,
  onProgress?: (ratio: number) => void,
  onStatus?: (msg: string) => void,
): Promise<{ text: string; provider: string; durationSec?: number }> {
  onStatus?.("استخراج وتنقية الصوت من الملف…");
  onProgress?.(0.05);
  const audio = await extractTranscriptionAudio(file, (r) =>
    onProgress?.(0.05 + r * 0.1),
  );
  onStatus?.("محاولة التفريغ عالي الدقة على الخادم…");
  try {
    const server = await transcribeViaServer(audio, languageCode);
    if (server) {
      onProgress?.(1);
      return server;
    }
  } catch {
    // سقوط إلى النموذج المحلي عالي الجودة
  }
  onStatus?.("التفريغ الكامل داخل المتصفح (جودة عالية)…");
  return transcribeLocally(audio, languageCode, onStatus, onProgress);
}
