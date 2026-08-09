import { fetchFile } from "@ffmpeg/util";
import {
  basename,
  downloadBlob,
  extensionForMime,
  getFFmpeg,
  getLastFfmpegLog,
  inputFileName,
  resetFFmpeg,
  toBlob,
} from "./ffmpeg-client";

export type MediaProgress = (ratio: number) => void;

async function execOrThrow(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  args: string[],
) {
  let code: number | undefined;
  try {
    code = await ffmpeg.exec(args);
  } catch (e) {
    const detail =
      e instanceof Error ? e.message : typeof e === "string" ? e : "abort";
    throw new Error(
      `فشل FFmpeg (${detail})${getLastFfmpegLog() ? `: ${getLastFfmpegLog()}` : ""}`,
    );
  }
  if (typeof code === "number" && code !== 0) {
    throw new Error(
      `فشل FFmpeg (رمز ${code})${getLastFfmpegLog() ? `: ${getLastFfmpegLog()}` : ""}`,
    );
  }
}

async function runVideoOut(
  file: File,
  argsAfterInput: string[],
  suffix: string,
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const input = inputFileName(file, "mp4");
  const output = `output.mp4`;
  await ffmpeg.writeFile(input, await fetchFile(file));
  await execOrThrow(ffmpeg, ["-i", input, ...argsAfterInput, output]);
  const data = await ffmpeg.readFile(output);
  await downloadBlob(toBlob(data, "video/mp4"), `${basename(file.name)}-${suffix}.mp4`);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
}

async function runAudioOut(
  file: File,
  argsAfterInput: string[],
  suffix: string,
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const input = inputFileName(file, "mp3");
  const output = `output.mp3`;
  await ffmpeg.writeFile(input, await fetchFile(file));
  await execOrThrow(ffmpeg, ["-i", input, ...argsAfterInput, output]);
  const data = await ffmpeg.readFile(output);
  await downloadBlob(toBlob(data, "audio/mpeg"), `${basename(file.name)}-${suffix}.mp3`);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
}

export async function convertVideo(
  file: File,
  format: "mp4" | "webm" | "mov",
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const input = inputFileName(file, "mp4");
  const output = `output.${format}`;
  await ffmpeg.writeFile(input, await fetchFile(file));

  const run = (args: string[]) => execOrThrow(ffmpeg, args);

  try {
    if (format === "webm") {
      await run([
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
      try {
        await run(["-i", input, "-c", "copy", output]);
      } catch {
        try {
          await run([
            "-i",
            input,
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-movflags",
            "+faststart",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            output,
          ]);
        } catch {
          await run([
            "-i",
            input,
            "-c:v",
            "mpeg4",
            "-q:v",
            "5",
            "-c:a",
            "aac",
            output,
          ]);
        }
      }
    }
  } catch (err) {
    try {
      await ffmpeg.deleteFile(input);
    } catch {
      /* ignore */
    }
    const detail = getLastFfmpegLog();
    throw new Error(
      err instanceof Error
        ? `${err.message}${detail ? ` (${detail})` : ""}`
        : `فشل تحويل الفيديو${detail ? `: ${detail}` : ""}`,
    );
  }

  const data = await ffmpeg.readFile(output);
  const mime =
    format === "webm"
      ? "video/webm"
      : format === "mov"
        ? "video/quicktime"
        : "video/mp4";
  await downloadBlob(toBlob(data, mime), `${basename(file.name)}.${format}`);
  try {
    await ffmpeg.deleteFile(input);
    await ffmpeg.deleteFile(output);
  } catch {
    /* ignore */
  }
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

  if (kind === "video") {
    await runVideoOut(
      file,
      [
        "-ss",
        String(startSec),
        "-to",
        String(endSec),
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-c:a",
        "aac",
      ],
      "trimmed",
      onProgress,
    );
    return;
  }

  await runAudioOut(
    file,
    [
      "-ss",
      String(startSec),
      "-to",
      String(endSec),
      "-vn",
      "-acodec",
      "libmp3lame",
    ],
    "trimmed",
    onProgress,
  );
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

  await execOrThrow(ffmpeg, ["-i", input, ...codecArgs, output]);
  const data = await ffmpeg.readFile(output);
  const mimeMap = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    aac: "audio/aac",
    ogg: "audio/ogg",
  } as const;
  await downloadBlob(toBlob(data, mimeMap[format]), `${basename(file.name)}.${format}`);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
}

export async function rotateVideo(
  file: File,
  degrees: 90 | 180 | 270,
  onProgress?: MediaProgress,
) {
  const transpose =
    degrees === 90 ? "transpose=1" : degrees === 270 ? "transpose=2" : "transpose=1,transpose=1";
  await runVideoOut(
    file,
    ["-vf", transpose, "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "copy"],
    `rot${degrees}`,
    onProgress,
  );
}

export async function flipVideo(
  file: File,
  mode: "h" | "v",
  onProgress?: MediaProgress,
) {
  await runVideoOut(
    file,
    [
      "-vf",
      mode === "h" ? "hflip" : "vflip",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "copy",
    ],
    mode === "h" ? "flip-h" : "flip-v",
    onProgress,
  );
}

export async function resizeVideo(
  file: File,
  width: number,
  onProgress?: MediaProgress,
) {
  await runVideoOut(
    file,
    [
      "-vf",
      `scale=${width}:-2`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "aac",
    ],
    `w${width}`,
    onProgress,
  );
}

export async function changeVideoSpeed(
  file: File,
  speed: number,
  onProgress?: MediaProgress,
) {
  if (speed <= 0) throw new Error("السرعة يجب أن تكون أكبر من صفر");
  const pts = (1 / speed).toFixed(4);
  await runVideoOut(
    file,
    [
      "-filter_complex",
      `[0:v]setpts=${pts}*PTS[v];[0:a]atempo=${Math.min(2, Math.max(0.5, speed))}[a]`,
      "-map",
      "[v]",
      "-map",
      "[a]",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
    ],
    `speed${speed}`,
    onProgress,
  );
}

export async function changeVideoVolume(
  file: File,
  volume: number,
  onProgress?: MediaProgress,
) {
  await runVideoOut(
    file,
    [
      "-af",
      `volume=${volume}`,
      "-c:v",
      "copy",
      "-c:a",
      "aac",
    ],
    `vol${volume}`,
    onProgress,
  );
}

export async function loopVideo(
  file: File,
  times: number,
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const inputExt = extensionForMime(file.type, "mp4");
  const input = `input.${inputExt}`;
  const output = `output.mp4`;
  await ffmpeg.writeFile(input, await fetchFile(file));
  await execOrThrow(ffmpeg, [
    "-stream_loop",
    String(Math.max(1, times) - 1),
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
  const data = await ffmpeg.readFile(output);
  await downloadBlob(toBlob(data, "video/mp4"), `${basename(file.name)}-loop.mp4`);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
}

export async function mergeVideos(files: File[], onProgress?: MediaProgress) {
  if (files.length < 2) throw new Error("اختر مقطعين على الأقل");
  const ffmpeg = await getFFmpeg(onProgress);
  const listLines: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const ext = extensionForMime(files[i].type, "mp4");
    const name = `part${i}.${ext}`;
    await ffmpeg.writeFile(name, await fetchFile(files[i]));
    // re-encode each to mp4 for concat safety
    const norm = `norm${i}.mp4`;
    await execOrThrow(ffmpeg, [
      "-i",
      name,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "aac",
      norm,
    ]);
    listLines.push(`file '${norm}'`);
    await ffmpeg.deleteFile(name);
  }

  await ffmpeg.writeFile("list.txt", listLines.join("\n"));
  await execOrThrow(ffmpeg, [
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "list.txt",
    "-c",
    "copy",
    "output.mp4",
  ]);
  const data = await ffmpeg.readFile("output.mp4");
  await downloadBlob(toBlob(data, "video/mp4"), "merged-video.mp4");
}

export async function compressVideo(file: File, onProgress?: MediaProgress) {
  await runVideoOut(
    file,
    [
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "32",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
    ],
    "compressed",
    onProgress,
  );
}

export async function changeAudioVolume(
  file: File,
  volume: number,
  onProgress?: MediaProgress,
) {
  await runAudioOut(
    file,
    ["-af", `volume=${volume}`, "-acodec", "libmp3lame"],
    `vol${volume}`,
    onProgress,
  );
}

export async function changeAudioSpeed(
  file: File,
  speed: number,
  onProgress?: MediaProgress,
) {
  const tempo = Math.min(2, Math.max(0.5, speed));
  await runAudioOut(
    file,
    ["-af", `atempo=${tempo}`, "-acodec", "libmp3lame"],
    `speed${tempo}`,
    onProgress,
  );
}

export async function changeAudioPitch(
  file: File,
  semitones: number,
  onProgress?: MediaProgress,
) {
  const factor = Math.pow(2, semitones / 12);
  await runAudioOut(
    file,
    [
      "-af",
      `asetrate=44100*${factor.toFixed(4)},aresample=44100`,
      "-acodec",
      "libmp3lame",
    ],
    `pitch${semitones}`,
    onProgress,
  );
}

export async function reverseAudio(file: File, onProgress?: MediaProgress) {
  await runAudioOut(
    file,
    ["-af", "areverse", "-acodec", "libmp3lame"],
    "reversed",
    onProgress,
  );
}

export async function joinAudio(files: File[], onProgress?: MediaProgress) {
  if (files.length < 2) throw new Error("اختر ملفين صوتيين على الأقل");
  const ffmpeg = await getFFmpeg(onProgress);
  const listLines: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const ext = extensionForMime(files[i].type, "mp3");
    const name = `a${i}.${ext}`;
    const norm = `an${i}.mp3`;
    await ffmpeg.writeFile(name, await fetchFile(files[i]));
    await execOrThrow(ffmpeg, ["-i", name, "-acodec", "libmp3lame", norm]);
    listLines.push(`file '${norm}'`);
    await ffmpeg.deleteFile(name);
  }

  await ffmpeg.writeFile("alist.txt", listLines.join("\n"));
  await execOrThrow(ffmpeg, [
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "alist.txt",
    "-c",
    "copy",
    "output.mp3",
  ]);
  const data = await ffmpeg.readFile("output.mp3");
  await downloadBlob(toBlob(data, "audio/mpeg"), "merged-audio.mp3");
}

export async function editVideoBasic(
  file: File,
  opts: { start: number; end: number; rotate: 0 | 90 | 180 | 270; speed: number },
  onProgress?: MediaProgress,
) {
  if (opts.end <= opts.start) {
    throw new Error("وقت النهاية يجب أن يكون أكبر من البداية");
  }
  const filters: string[] = [];
  if (opts.rotate === 90) filters.push("transpose=1");
  if (opts.rotate === 270) filters.push("transpose=2");
  if (opts.rotate === 180) filters.push("transpose=1,transpose=1");
  const vf = filters.length ? filters.join(",") : null;
  const speed = Math.min(2, Math.max(0.5, opts.speed));
  const pts = (1 / speed).toFixed(4);

  const args = ["-ss", String(opts.start), "-to", String(opts.end)];
  if (vf) {
    args.push(
      "-filter_complex",
      `[0:v]${vf},setpts=${pts}*PTS[v];[0:a]atempo=${speed}[a]`,
      "-map",
      "[v]",
      "-map",
      "[a]",
    );
  } else {
    args.push(
      "-filter_complex",
      `[0:v]setpts=${pts}*PTS[v];[0:a]atempo=${speed}[a]`,
      "-map",
      "[v]",
      "-map",
      "[a]",
    );
  }
  args.push("-c:v", "libx264", "-preset", "ultrafast");

  await runVideoOut(file, args, "edited", onProgress);
}

export async function cropVideo(
  file: File,
  crop: { x: number; y: number; w: number; h: number },
  onProgress?: MediaProgress,
) {
  await runVideoOut(
    file,
    [
      "-vf",
      `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "copy",
    ],
    "cropped",
    onProgress,
  );
}

export async function addAudioToVideo(
  video: File,
  audio: File,
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const vExt = extensionForMime(video.type, "mp4");
  const aExt = extensionForMime(audio.type, "mp3");
  await ffmpeg.writeFile(`v.${vExt}`, await fetchFile(video));
  await ffmpeg.writeFile(`a.${aExt}`, await fetchFile(audio));
  await execOrThrow(ffmpeg, [
    "-i",
    `v.${vExt}`,
    "-i",
    `a.${aExt}`,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-shortest",
    "output.mp4",
  ]);
  const data = await ffmpeg.readFile("output.mp4");
  await downloadBlob(toBlob(data, "video/mp4"), `${basename(video.name)}-audio.mp4`);
}

export type ImageOverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export type ImageOverlayOptions = {
  /** نسبة عرض الصورة من عرض الفيديو (0.1–0.8) */
  scale?: number;
  position?: ImageOverlayPosition;
  /** شفافية 0–1 (1 = غير شفاف) */
  opacity?: number;
};

function overlayXy(position: ImageOverlayPosition): string {
  const m = 24;
  switch (position) {
    case "top-right":
      return `main_w-overlay_w-${m}:${m}`;
    case "bottom-left":
      return `${m}:main_h-overlay_h-${m}`;
    case "bottom-right":
      return `main_w-overlay_w-${m}:main_h-overlay_h-${m}`;
    case "center":
      return `(main_w-overlay_w)/2:(main_h-overlay_h)/2`;
    case "top-left":
    default:
      return `${m}:${m}`;
  }
}

export async function addImageToVideo(
  video: File,
  image: File,
  onProgress?: MediaProgress,
  options?: ImageOverlayOptions,
) {
  if (!video.type.startsWith("video/") && !/\.(mp4|webm|mov|mkv)$/i.test(video.name)) {
    throw new Error("الملف الأول يجب أن يكون فيديو");
  }
  if (
    !image.type.startsWith("image/") &&
    !/\.(png|jpe?g|webp|gif|bmp)$/i.test(image.name)
  ) {
    throw new Error("الملف الثاني يجب أن يكون صورة (PNG / JPG / WebP)");
  }

  const scale = Math.min(0.8, Math.max(0.08, options?.scale ?? 0.28));
  const opacity = Math.min(1, Math.max(0.05, options?.opacity ?? 1));
  const position = options?.position ?? "top-right";
  const xy = overlayXy(position);

  const ffmpeg = await getFFmpeg(onProgress);
  const vExt = extensionForMime(video.type, "mp4");
  const name = image.name.toLowerCase();
  const iExt = name.endsWith(".png")
    ? "png"
    : name.endsWith(".webp")
      ? "webp"
      : name.endsWith(".gif")
        ? "gif"
        : "jpg";

  await ffmpeg.writeFile(`v.${vExt}`, await fetchFile(video));
  await ffmpeg.writeFile(`i.${iExt}`, await fetchFile(image));

  // scale2ref: حجم نسبةً لعرض الفيديو + شفافية + موضع
  const filter =
    `[1:v]format=rgba,colorchannelmixer=aa=${opacity.toFixed(3)}[img0];` +
    `[img0][0:v]scale2ref=w=iw*${scale.toFixed(3)}:h=ow/mdar[img][base];` +
    `[base][img]overlay=${xy}:format=auto`;

  await execOrThrow(ffmpeg, [
    "-i",
    `v.${vExt}`,
    "-i",
    `i.${iExt}`,
    "-filter_complex",
    filter,
    "-c:a",
    "copy",
    "-movflags",
    "+faststart",
    "output.mp4",
  ]);
  const data = await ffmpeg.readFile("output.mp4");
  await downloadBlob(
    toBlob(data, "video/mp4"),
    `${basename(video.name)}-image.mp4`,
  );
}

export async function addTextToVideo(
  video: File,
  text: string,
  onProgress?: MediaProgress,
) {
  // Render text to PNG then overlay (drawtext font often missing in wasm)
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر إنشاء طبقة النص");
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 48px Cairo, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text.slice(0, 60) || "Tool2Day", canvas.width / 2, 75);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل إنشاء النص"))),
      "image/png",
    );
  });
  const overlay = new File([blob], "text.png", { type: "image/png" });
  await addImageToVideo(video, overlay, onProgress);
}

/**
 * إزالة علامة مائية مع إظهار السطح الأصلي (مثل الحذاء):
 * مسح تدريجي يستنسخ شرائح رفيعة من جهة السطح نفسه — بدون مربع لون/غبش سميك.
 */
export async function removeLogo(
  file: File,
  boxOrBoxes:
    | { x: number; y: number; w: number; h: number }
    | Array<{ x: number; y: number; w: number; h: number }>,
  onProgress?: MediaProgress,
) {
  const boxes = Array.isArray(boxOrBoxes) ? boxOrBoxes : [boxOrBoxes];
  if (!boxes.length) {
    throw new Error("حدّد منطقة الشعار أولاً");
  }

  const { w: vw, h: vh } = await probeVideoSize(file);
  if (!vw || !vh) throw new Error("تعذّر قراءة أبعاد الفيديو");

  const cleaned = boxes.map((raw) => tightenBox(raw, vw, vh));
  const frame = await grabVideoFrameData(file);
  const plans = cleaned.map((box) => planCleanFix(frame, box, vw, vh));

  const ffmpeg = await getFFmpeg(onProgress);
  const input = inputFileName(file, "mp4");
  const output = "output.mp4";
  await ffmpeg.writeFile(input, await fetchFile(file));

  const filter = buildCleanFilter(plans, vw, vh);
  const useComplex = filter.includes("[outv]");

  let active = ffmpeg;
  try {
    if (useComplex) {
      await execOrThrow(active, [
        "-i",
        input,
        "-filter_complex",
        filter,
        "-map",
        "[outv]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        output,
      ]);
    } else {
      await execOrThrow(active, [
        "-i",
        input,
        "-vf",
        filter,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        output,
      ]);
    }
  } catch (firstErr) {
    await resetFFmpeg();
    active = await getFFmpeg(onProgress);
    await active.writeFile(input, await fetchFile(file));
    // Fallback: single-side clone if possible, else delogo
    const fallback = cleaned
      .map((b) => {
        if (b.x - b.w >= 0) {
          return null; // handled below via complex if needed
        }
        return `delogo=x=${b.x}:y=${b.y}:w=${b.w}:h=${b.h}:show=0`;
      })
      .filter(Boolean)
      .join(",");
    try {
      const b0 = cleaned[0]!;
      if (b0.x - Math.min(8, b0.w) >= 0) {
        const sw = Math.min(8, b0.w);
        await execOrThrow(active, [
          "-i",
          input,
          "-filter_complex",
          `[0:v]split=2[a][b];[b]crop=${b0.w}:${b0.h}:${b0.x - sw}:${b0.y}[p];[a][p]overlay=${b0.x}:${b0.y},format=yuv420p[outv]`,
          "-map",
          "[outv]",
          "-map",
          "0:a?",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "18",
          "-c:a",
          "copy",
          "-movflags",
          "+faststart",
          output,
        ]);
      } else {
        await execOrThrow(active, [
          "-i",
          input,
          "-vf",
          `${fallback || `delogo=x=${b0.x}:y=${b0.y}:w=${b0.w}:h=${b0.h}:show=0`},format=yuv420p`,
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "18",
          "-c:a",
          "copy",
          "-movflags",
          "+faststart",
          output,
        ]);
      }
    } catch {
      throw firstErr instanceof Error
        ? firstErr
        : new Error("تعذّر حذف العلامة المائية من الفيديو");
    }
  }

  const data = await active.readFile(output);
  await downloadBlob(
    toBlob(data, "video/mp4"),
    `${basename(file.name)}-no-watermark.mp4`,
  );
  try {
    await active.deleteFile(input);
    await active.deleteFile(output);
  } catch {
    /* ignore */
  }
}

type SweepDir = "left" | "right" | "up" | "down";

type CleanPlan = {
  x: number;
  y: number;
  w: number;
  h: number;
  mode: "sweep" | "delogo";
  rgb: [number, number, number];
  dir?: SweepDir;
};

function tightenBox(
  raw: { x: number; y: number; w: number; h: number },
  vw: number,
  vh: number,
) {
  let x = Math.round(raw.x) + 1;
  let y = Math.round(raw.y) + 1;
  let w = Math.max(4, Math.round(raw.w) - 2);
  let h = Math.max(4, Math.round(raw.h) - 2);
  const margin = 2;
  x = Math.max(margin, Math.min(vw - margin - 4, x));
  y = Math.max(margin, Math.min(vh - margin - 4, y));
  w = Math.max(4, Math.min(vw - x - margin, w));
  h = Math.max(4, Math.min(vh - y - margin, h));
  return { x, y, w, h };
}

function buildCleanFilter(
  plans: CleanPlan[],
  vw: number,
  vh: number,
): string {
  // سلسلة واحدة: نطبّق كل خطة بالتتابع على نفس الفيديو
  let chain = `[0:v]format=yuv420p[v0];`;
  let idx = 0;

  for (const plan of plans) {
    const src = `[v${idx}]`;
    const dst = `[v${idx + 1}]`;
    if (plan.mode === "sweep" && plan.dir) {
      chain += buildSweepChain(src, dst, plan, plan.dir, vw, vh);
    } else {
      chain += `${src}delogo=x=${plan.x}:y=${plan.y}:w=${plan.w}:h=${plan.h}:show=0${dst};`;
    }
    idx += 1;
  }

  chain += `[v${idx}]setsar=1,format=yuv420p[outv]`;
  return chain;
}

/** استنساخ شرائح رفيعة باتجاه السطح (يُظهر الحذاء بدل غبش مختلط). */
function buildSweepChain(
  srcLabel: string,
  dstLabel: string,
  box: { x: number; y: number; w: number; h: number },
  dir: SweepDir,
  vw: number,
  vh: number,
): string {
  const strip =
    dir === "left" || dir === "right"
      ? Math.max(2, Math.min(6, Math.round(box.w / 8)))
      : Math.max(2, Math.min(6, Math.round(box.h / 8)));

  const steps =
    dir === "left" || dir === "right"
      ? Math.ceil(box.w / strip)
      : Math.ceil(box.h / strip);

  if (dir === "left" && box.x - strip < 0) {
    return `${srcLabel}delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:show=0${dstLabel};`;
  }
  if (dir === "right" && box.x + box.w + strip > vw) {
    return `${srcLabel}delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:show=0${dstLabel};`;
  }
  if (dir === "up" && box.y - strip < 0) {
    return `${srcLabel}delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:show=0${dstLabel};`;
  }
  if (dir === "down" && box.y + box.h + strip > vh) {
    return `${srcLabel}delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:show=0${dstLabel};`;
  }

  let chain = `${srcLabel}format=yuv420p[s0];`;
  let last = 0;

  for (let i = 0; i < steps; i++) {
    let dx = box.x;
    let dy = box.y;
    let dw = box.w;
    let dh = box.h;
    let sx = box.x;
    let sy = box.y;

    if (dir === "left") {
      dx = box.x + i * strip;
      dw = Math.min(strip, box.x + box.w - dx);
      dh = box.h;
      dy = box.y;
      sx = dx - strip;
      sy = box.y;
    } else if (dir === "right") {
      const end = box.x + box.w - i * strip;
      dw = Math.min(strip, end - box.x);
      dx = end - dw;
      dy = box.y;
      dh = box.h;
      sx = dx + dw;
      sy = box.y;
    } else if (dir === "up") {
      dy = box.y + i * strip;
      dh = Math.min(strip, box.y + box.h - dy);
      dx = box.x;
      dw = box.w;
      sx = box.x;
      sy = dy - strip;
    } else {
      const end = box.y + box.h - i * strip;
      dh = Math.min(strip, end - box.y);
      dy = end - dh;
      dx = box.x;
      dw = box.w;
      sx = box.x;
      sy = dy + dh;
    }

    if (dw < 1 || dh < 1) continue;
    chain +=
      `[s${i}]split=2[a${i}][b${i}];` +
      `[b${i}]crop=${dw}:${dh}:${sx}:${sy}[p${i}];` +
      `[a${i}][p${i}]overlay=${dx}:${dy}[s${i + 1}];`;
    last = i + 1;
  }

  chain += `[s${last}]format=yuv420p${dstLabel};`;
  return chain;
}

function planCleanFix(
  imageData: ImageData,
  box: { x: number; y: number; w: number; h: number },
  vw: number,
  vh: number,
): CleanPlan {
  const left = sampleBand(
    imageData,
    box.x - 4,
    box.y,
    box.x,
    box.y + box.h,
    vw,
    vh,
  );
  const right = sampleBand(
    imageData,
    box.x + box.w,
    box.y,
    box.x + box.w + 4,
    box.y + box.h,
    vw,
    vh,
  );
  const top = sampleBand(
    imageData,
    box.x,
    box.y - 4,
    box.x + box.w,
    box.y,
    vw,
    vh,
  );
  const bottom = sampleBand(
    imageData,
    box.x,
    box.y + box.h,
    box.x + box.w,
    box.y + box.h + 4,
    vw,
    vh,
  );

  const candidates: Array<{
    dir: SweepDir;
    score: number;
    rgb: [number, number, number];
  }> = [];

  // نفضّل الجهة الأقرب للون حافة التحديد من نفس الجهة = استمرار السطح (حذاء أبيض)
  if (left && box.x >= 4) {
    candidates.push({
      dir: "left",
      rgb: left.median,
      score: left.variance - brightness(left.median) * 0.15,
    });
  }
  if (right && box.x + box.w + 4 <= vw) {
    candidates.push({
      dir: "right",
      rgb: right.median,
      score: right.variance - brightness(right.median) * 0.15,
    });
  }
  if (top && box.y >= 4) {
    candidates.push({
      dir: "up",
      rgb: top.median,
      score: top.variance - brightness(top.median) * 0.1,
    });
  }
  if (bottom && box.y + box.h + 4 <= vh) {
    candidates.push({
      dir: "down",
      rgb: bottom.median,
      score: bottom.variance - brightness(bottom.median) * 0.1,
    });
  }

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];
  if (best) {
    return { ...box, mode: "sweep", dir: best.dir, rgb: best.rgb };
  }

  return {
    ...box,
    mode: "delogo",
    rgb: left?.median || right?.median || ([200, 200, 200] as [number, number, number]),
  };
}

function brightness([r, g, b]: [number, number, number]) {
  return (r + g + b) / 3;
}

function sampleBand(
  imageData: ImageData,
  xs: number,
  ys: number,
  xe: number,
  ye: number,
  vw: number,
  vh: number,
) {
  const samples: Array<[number, number, number]> = [];
  const { data, width } = imageData;
  for (let py = Math.floor(ys); py < Math.ceil(ye); py++) {
    for (let px = Math.floor(xs); px < Math.ceil(xe); px++) {
      if (px < 0 || py < 0 || px >= vw || py >= vh) continue;
      const sx = Math.min(width - 1, Math.round((px / vw) * width));
      const sy = Math.min(
        imageData.height - 1,
        Math.round((py / vh) * imageData.height),
      );
      const i = (sy * width + sx) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  if (samples.length < 6) return null;
  const median = medianRgb(samples);
  return { median, variance: colorVariance(samples, median) };
}

function medianRgb(samples: Array<[number, number, number]>): [number, number, number] {
  if (!samples.length) return [0, 0, 0];
  const mid = Math.floor(samples.length / 2);
  const r = [...samples].map((s) => s[0]).sort((a, b) => a - b)[mid]!;
  const g = [...samples].map((s) => s[1]).sort((a, b) => a - b)[mid]!;
  const b = [...samples].map((s) => s[2]).sort((a, b) => a - b)[mid]!;
  return [r, g, b];
}

function colorVariance(
  samples: Array<[number, number, number]>,
  mean: [number, number, number],
) {
  if (!samples.length) return 999;
  let acc = 0;
  for (const s of samples) {
    const dr = s[0] - mean[0];
    const dg = s[1] - mean[1];
    const db = s[2] - mean[2];
    acc += dr * dr + dg * dg + db * db;
  }
  return Math.sqrt(acc / samples.length);
}

function grabVideoFrameData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذّر قراءة إطار الفيديو"));
    };
    video.onloadedmetadata = () => {
      const t =
        Number.isFinite(video.duration) && video.duration > 0.2
          ? Math.min(0.12, video.duration * 0.02)
          : 0.001;
      const done = () => {
        const w = video.videoWidth || 0;
        const h = video.videoHeight || 0;
        if (!w || !h) {
          URL.revokeObjectURL(url);
          reject(new Error("أبعاد الفيديو غير صالحة"));
          return;
        }
        const maxW = 720;
        const scale = Math.min(1, maxW / w);
        const cw = Math.max(2, Math.round(w * scale));
        const ch = Math.max(2, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("تعذّر إنشاء كانفاس"));
          return;
        }
        ctx.drawImage(video, 0, 0, cw, ch);
        const data = ctx.getImageData(0, 0, cw, ch);
        URL.revokeObjectURL(url);
        resolve(data);
      };
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        done();
      };
      video.addEventListener("seeked", onSeeked);
      try {
        video.currentTime = t;
      } catch {
        void video
          .play()
          .then(() => {
            video.pause();
            done();
          })
          .catch(() => done());
      }
    };
    video.src = url;
    video.load();
  });
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

export async function stabilizeVideo(file: File, onProgress?: MediaProgress) {
  await runVideoOut(
    file,
    [
      "-vf",
      "deshake",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "copy",
    ],
    "stable",
    onProgress,
  );
}

export type EnhanceTarget = "1080" | "1440" | "4k";
export type EnhanceStrength = "light" | "medium" | "strong";

function evenDim(n: number) {
  const v = Math.max(2, Math.round(n));
  return v % 2 === 0 ? v : v - 1;
}

function enhanceTargetMaxEdge(target: EnhanceTarget) {
  if (target === "1080") return 1920;
  if (target === "1440") return 2560;
  return 3840; // 4K على الجانب الأطول
}

function buildEnhanceFilter(
  outW: number,
  outH: number,
  strength: EnhanceStrength,
): string {
  const denoise =
    strength === "light"
      ? "hqdn3d=0.6:0.6:2:2"
      : strength === "strong"
        ? "hqdn3d=2.2:1.8:6:5"
        : "hqdn3d=1.2:1.0:4:3";
  const sharp =
    strength === "light"
      ? "unsharp=5:5:0.55:5:5:0.0"
      : strength === "strong"
        ? "unsharp=7:7:1.15:5:5:0.0"
        : "unsharp=5:5:0.9:5:5:0.0";
  const eq =
    strength === "light"
      ? "eq=contrast=1.04:saturation=1.05:brightness=0.01"
      : strength === "strong"
        ? "eq=contrast=1.1:saturation=1.14:brightness=0.015"
        : "eq=contrast=1.07:saturation=1.09:brightness=0.012";

  return [
    denoise,
    `scale=${outW}:${outH}:flags=lanczos+accurate_rnd+full_chroma_int`,
    sharp,
    eq,
    "format=yuv420p",
  ].join(",");
}

/**
 * تحسين جودة الفيديو: تنعيم ضوضاء + رفع دقة (حتى 4K) + توضيح + تباين/تشبع،
 * ثم ترميز عالي الجودة (CRF منخفض).
 */
export async function enhanceVideoQuality(
  file: File,
  opts: {
    target?: EnhanceTarget;
    strength?: EnhanceStrength;
  } = {},
  onProgress?: MediaProgress,
) {
  const target = opts.target ?? "4k";
  const strength = opts.strength ?? "medium";
  const { w: srcW, h: srcH } = await probeVideoSize(file);
  if (!srcW || !srcH) throw new Error("تعذّر قراءة أبعاد الفيديو");

  const maxEdge = enhanceTargetMaxEdge(target);
  const long = Math.max(srcW, srcH);
  const scale = maxEdge / long;
  // لا نصغّر إن كان المصدر أكبر من الهدف — نحسّن فقط
  const factor = scale < 1 ? 1 : scale;
  const outW = evenDim(srcW * factor);
  const outH = evenDim(srcH * factor);

  const preset = strength === "strong" ? "slow" : "medium";
  const crf = strength === "strong" ? "16" : strength === "light" ? "19" : "17";

  const tryChains = [
    buildEnhanceFilter(outW, outH, strength),
    // احتياطي بدون hqdn3d إن لم يتوفر في البناء
    [
      `scale=${outW}:${outH}:flags=lanczos+accurate_rnd+full_chroma_int`,
      strength === "strong"
        ? "unsharp=7:7:1.1:5:5:0.0"
        : "unsharp=5:5:0.85:5:5:0.0",
      "eq=contrast=1.07:saturation=1.1:brightness=0.01",
      "format=yuv420p",
    ].join(","),
    // أبسط مسار
    `scale=${outW}:${outH}:flags=lanczos,unsharp=5:5:0.7:5:5:0.0,format=yuv420p`,
  ];

  const ffmpeg = await getFFmpeg(onProgress);
  const input = inputFileName(file, "mp4");
  const output = "output.mp4";
  await ffmpeg.writeFile(input, await fetchFile(file));

  let lastError: unknown = null;
  for (const vf of tryChains) {
    try {
      await execOrThrow(ffmpeg, [
        "-i",
        input,
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        crf,
        "-profile:v",
        "high",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        output,
      ]);
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      try {
        await ffmpeg.deleteFile(output);
      } catch {
        /* ignore */
      }
    }
  }

  if (lastError) {
    try {
      await ffmpeg.deleteFile(input);
    } catch {
      /* ignore */
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("فشل تحسين جودة الفيديو");
  }

  const data = await ffmpeg.readFile(output);
  const label =
    target === "4k" ? "4k-enhance" : target === "1440" ? "1440p-enhance" : "1080p-enhance";
  await downloadBlob(
    toBlob(data, "video/mp4"),
    `${basename(file.name)}-${label}.mp4`,
  );
  try {
    await ffmpeg.deleteFile(input);
    await ffmpeg.deleteFile(output);
  } catch {
    /* ignore */
  }
}

export async function extractAudioTrack(
  file: File,
  onProgress?: MediaProgress,
): Promise<File> {
  const ffmpeg = await getFFmpeg(onProgress);
  const vExt = extensionForMime(file.type, "mp4");
  const input = `detach-in.${vExt}`;
  const output = "detached-audio.mp3";
  await ffmpeg.writeFile(input, await fetchFile(file));
  try {
    await execOrThrow(ffmpeg, [
      "-i",
      input,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-q:a",
      "4",
      output,
    ]);
  } catch {
    await execOrThrow(ffmpeg, [
      "-i",
      input,
      "-vn",
      "-c:a",
      "aac",
      "detached-audio.m4a",
    ]);
    const data = await ffmpeg.readFile("detached-audio.m4a");
    await ffmpeg.deleteFile(input);
    try {
      await ffmpeg.deleteFile("detached-audio.m4a");
    } catch {
      /* ignore */
    }
    return new File([toBlob(data, "audio/mp4")], `${basename(file.name)}-audio.m4a`, {
      type: "audio/mp4",
    });
  }
  const data = await ffmpeg.readFile(output);
  await ffmpeg.deleteFile(input);
  try {
    await ffmpeg.deleteFile(output);
  } catch {
    /* ignore */
  }
  return new File([toBlob(data, "audio/mpeg")], `${basename(file.name)}-audio.mp3`, {
    type: "audio/mpeg",
  });
}

export async function equalizeAudio(file: File, onProgress?: MediaProgress) {
  await runAudioOut(
    file,
    [
      "-af",
      "equalizer=f=100:t=q:w=1:g=2,equalizer=f=1000:t=q:w=1:g=1,equalizer=f=4000:t=q:w=1:g=2",
      "-acodec",
      "libmp3lame",
    ],
    "eq",
    onProgress,
  );
}
