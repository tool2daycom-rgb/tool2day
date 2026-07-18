import { fetchFile } from "@ffmpeg/util";
import {
  basename,
  downloadBlob,
  extensionForMime,
  getFFmpeg,
  toBlob,
} from "./ffmpeg-client";

export type MediaProgress = (ratio: number) => void;

export async function convertVideo(
  file: File,
  format: "mp4" | "webm" | "mov",
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const inputExt = extensionForMime(file.type, "mp4");
  const input = `input.${inputExt}`;
  const output = `output.${format}`;

  await ffmpeg.writeFile(input, await fetchFile(file));

  if (format === "webm") {
    await ffmpeg.exec([
      "-i",
      input,
      "-c:v",
      "libvpx",
      "-b:v",
      "1M",
      "-c:a",
      "libvorbis",
      output,
    ]);
  } else {
    await ffmpeg.exec([
      "-i",
      input,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "aac",
      output,
    ]);
  }

  const data = await ffmpeg.readFile(output);
  const mime =
    format === "webm"
      ? "video/webm"
      : format === "mov"
        ? "video/quicktime"
        : "video/mp4";
  const blob = toBlob(data, mime);
  downloadBlob(blob, `${basename(file.name)}.${format}`);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
}

export async function trimMedia(
  file: File,
  startSec: number,
  endSec: number,
  kind: "video" | "audio",
  onProgress?: MediaProgress,
) {
  if (endSec <= startSec) {
    throw new Error("وقت النهاية يجب أن يكون أكبر من البداية");
  }

  const ffmpeg = await getFFmpeg(onProgress);
  const inputExt = extensionForMime(
    file.type,
    kind === "video" ? "mp4" : "mp3",
  );
  const outputExt = kind === "video" ? "mp4" : "mp3";
  const input = `input.${inputExt}`;
  const output = `output.${outputExt}`;

  await ffmpeg.writeFile(input, await fetchFile(file));

  const args = [
    "-ss",
    String(startSec),
    "-to",
    String(endSec),
    "-i",
    input,
  ];

  if (kind === "video") {
    args.push("-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", output);
  } else {
    args.push("-vn", "-acodec", "libmp3lame", output);
  }

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(output);
  const mime = kind === "video" ? "video/mp4" : "audio/mpeg";
  const blob = toBlob(data, mime);
  downloadBlob(blob, `${basename(file.name)}-trimmed.${outputExt}`);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
}

export async function convertAudio(
  file: File,
  format: "mp3" | "wav" | "aac" | "ogg",
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const inputExt = extensionForMime(file.type, "mp3");
  const input = `input.${inputExt}`;
  const output = `output.${format}`;

  await ffmpeg.writeFile(input, await fetchFile(file));

  const codecArgs: string[] =
    format === "mp3"
      ? ["-vn", "-acodec", "libmp3lame"]
      : format === "wav"
        ? ["-vn", "-acodec", "pcm_s16le"]
        : format === "aac"
          ? ["-vn", "-c:a", "aac"]
          : ["-vn", "-c:a", "libvorbis"];

  await ffmpeg.exec(["-i", input, ...codecArgs, output]);

  const data = await ffmpeg.readFile(output);
  const mimeMap = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    aac: "audio/aac",
    ogg: "audio/ogg",
  } as const;
  const blob = toBlob(data, mimeMap[format]);
  downloadBlob(blob, `${basename(file.name)}.${format}`);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
}
