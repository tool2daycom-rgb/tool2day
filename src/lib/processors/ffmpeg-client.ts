import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;
let lastLog = "";

export function getLastFfmpegLog() {
  return lastLog;
}

export async function getFFmpeg(onProgress?: (ratio: number) => void) {
  if (ffmpeg?.loaded) {
    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => onProgress(Math.min(1, Math.max(0, progress))));
    }
    return ffmpeg;
  }

  if (!loading) {
    loading = (async () => {
      const instance = new FFmpeg();
      instance.on("log", ({ message }) => {
        lastLog = message;
      });

      // Prefer same-origin core (copied to /public/ffmpeg) — more reliable than CDN
      const localBase = `${window.location.origin}/ffmpeg`;
      const cdnBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

      const loadFrom = async (baseURL: string) => {
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });
      };

      try {
        await loadFrom(localBase);
      } catch (localErr) {
        console.warn("Local ffmpeg core failed, trying CDN", localErr);
        await loadFrom(cdnBase);
      }

      ffmpeg = instance;
      return instance;
    })().catch((err) => {
      loading = null;
      ffmpeg = null;
      throw err;
    });
  }

  const instance = await loading;
  if (onProgress) {
    instance.on("progress", ({ progress }) =>
      onProgress(Math.min(1, Math.max(0, progress))),
    );
  }
  return instance;
}

/** Runs ffmpeg and throws if exit code is non-zero. */
export async function runFFmpeg(args: string[]) {
  const ff = await getFFmpeg();
  const code = await ff.exec(args);
  if (typeof code === "number" && code !== 0) {
    throw new Error(
      `فشل FFmpeg (رمز ${code})${lastLog ? `: ${lastLog}` : ""}`,
    );
  }
  return ff;
}

export function extensionForMime(mime: string, fallback: string) {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("quicktime") || mime.includes("mov")) return "mov";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("aac")) return "aac";
  if (mime.includes("ogg")) return "ogg";
  return fallback;
}

export function inputFileName(file: File, fallbackExt: string) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) {
    return `input.${fromName}`;
  }
  return `input.${extensionForMime(file.type, fallbackExt)}`;
}

export async function downloadBlob(blob: Blob, filename: string) {
  const { requireRatingThenDownload } = await import("@/lib/ratings");
  await requireRatingThenDownload(blob, filename);
}

export function toBlob(data: Uint8Array | string, type: string) {
  if (typeof data === "string") {
    return new Blob([data], { type });
  }
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy.buffer], { type });
}

export function basename(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

export function formatProcessError(err: unknown) {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "فشلت المعالجة";
  const log = getLastFfmpegLog();
  if (log && !msg.includes(log)) {
    return `${msg}${log ? ` — ${log}` : ""}`;
  }
  return msg || "فشلت المعالجة";
}
