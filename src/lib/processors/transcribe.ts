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
    "16000",
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

type WhisperPipeline = (
  audio: Float32Array | string,
  opts?: Record<string, unknown>,
) => Promise<{ text?: string } | string>;

let pipelinePromise: Promise<{
  pipe: WhisperPipeline;
  label: string;
}> | null = null;

/**
 * q8 معقدّم معطل على transformers.js 4.2 + ORT 1.25
 * (Missing required scale / MatMulNBits) — نستخدم fp32.
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
        device: "webgpu" | "wasm";
        dtype: "fp32" | "fp16";
        label: string;
      }> = [
        {
          model: "onnx-community/whisper-base",
          device: "webgpu",
          dtype: "fp32",
          label: "whisper-base-webgpu",
        },
        {
          model: "onnx-community/whisper-base",
          device: "wasm",
          dtype: "fp32",
          label: "whisper-base-wasm",
        },
        {
          model: "Xenova/whisper-base",
          device: "wasm",
          dtype: "fp32",
          label: "xenova-whisper-base",
        },
      ];

      let lastErr: unknown;
      for (const attempt of attempts) {
        try {
          onStatus?.(
            `تحميل نموذج التعرف (${attempt.label}) — مرة واحدة ثم يُخزَّن…`,
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
          // إفراغ سلسلة التهيئة الفاشلة قبل المحاولة التالية
          await new Promise((r) => setTimeout(r, 50));
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
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    const ch0 = decoded.getChannelData(0);
    if (decoded.sampleRate === 16000) return new Float32Array(ch0);
    const ratio = decoded.sampleRate / 16000;
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

export async function transcribeLocally(
  audio: File,
  languageCode: string,
  onStatus?: (msg: string) => void,
): Promise<{ text: string; provider: string }> {
  const { pipe, label } = await getLocalWhisper(onStatus);
  onStatus?.("تحليل الصوت…");
  const samples = await decodeWavToFloat32(audio);
  const lang = TRANSCRIBE_LANGUAGES.find((l) => l.code === languageCode);
  const opts: Record<string, unknown> = {
    task: "transcribe",
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false,
  };
  if (lang && lang.code !== "auto") {
    opts.language = lang.whisperName;
  }
  const result = await pipe(samples, opts);
  const text =
    typeof result === "string" ? result : (result.text || "").trim();
  if (!text) throw new Error("لم يُكتشف كلام واضح في الملف");
  return { text, provider: label };
}

export async function transcribeMediaFile(
  file: File,
  languageCode: string,
  onProgress?: (ratio: number) => void,
  onStatus?: (msg: string) => void,
): Promise<{ text: string; provider: string }> {
  onStatus?.("استخراج الصوت من الملف…");
  const audio = await extractTranscriptionAudio(file, onProgress);
  onStatus?.("محاولة التفريغ عالي الدقة…");
  try {
    const server = await transcribeViaServer(audio, languageCode);
    if (server) return server;
  } catch {
    // سقوط إلى النموذج المحلي
  }
  onStatus?.("التفريغ داخل المتصفح…");
  return transcribeLocally(audio, languageCode, onStatus);
}
