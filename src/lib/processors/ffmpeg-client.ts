import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

export async function getFFmpeg(onProgress?: (ratio: number) => void) {
  if (ffmpeg?.loaded) {
    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => onProgress(progress));
    }
    return ffmpeg;
  }

  if (!loading) {
    loading = (async () => {
      const instance = new FFmpeg();
      const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

      instance.on("log", ({ message }) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("[ffmpeg]", message);
        }
      });

      await instance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });

      ffmpeg = instance;
      return instance;
    })();
  }

  const instance = await loading;
  if (onProgress) {
    instance.on("progress", ({ progress }) => onProgress(progress));
  }
  return instance;
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

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
