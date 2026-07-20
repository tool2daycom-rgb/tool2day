import { fetchFile } from "@ffmpeg/util";
import {
  basename,
  downloadBlob,
  extensionForMime,
  getFFmpeg,
  getLastFfmpegLog,
  inputFileName,
  toBlob,
} from "./ffmpeg-client";

export type MediaProgress = (ratio: number) => void;

async function execOrThrow(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  args: string[],
) {
  const code = await ffmpeg.exec(args);
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

function evenInt(n: number) {
  const v = Math.max(2, Math.round(n));
  return v % 2 === 0 ? v : v + 1;
}

/**
 * إزالة شعار بتغطية ناعمة من المنطقة المحيطة (أفضل بكثير من delogo).
 * ينسخ محيط الشعار، يموّهه بقوة، ثم يغطي الشعار بحواف أنعم.
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

  const chains: string[] = [];
  boxes.forEach((raw, i) => {
    let x = Math.max(0, Math.min(vw - 4, Math.round(raw.x)));
    let y = Math.max(0, Math.min(vh - 4, Math.round(raw.y)));
    let w = evenInt(Math.max(8, Math.min(vw - x, Math.round(raw.w))));
    let h = evenInt(Math.max(8, Math.min(vh - y, Math.round(raw.h))));
    if (x + w >= vw) w = evenInt(Math.max(8, vw - x - 2));
    if (y + h >= vh) h = evenInt(Math.max(8, vh - y - 2));

    // منطقة أوسع حول الشعار لأخذ ألوان الخلفية الحقيقية
    const pad = evenInt(Math.max(20, Math.round(Math.min(w, h) * 0.9)));
    let cx = Math.max(0, x - pad);
    let cy = Math.max(0, y - pad);
    let cw = evenInt(Math.min(vw - cx, w + 2 * pad));
    let ch = evenInt(Math.min(vh - cy, h + 2 * pad));
    if (cx + cw > vw) cw = evenInt(vw - cx);
    if (cy + ch > vh) ch = evenInt(vh - cy);

    const ox = Math.max(0, Math.min(cw - w, x - cx));
    const oy = Math.max(0, Math.min(ch - h, y - cy));
    // تمويه قوي من المحيط (ليس delogo الرمادي)
    const blur = Math.max(14, Math.min(56, Math.round(Math.min(w, h) * 0.65)));
    const blurLuma = Math.max(3, Math.floor(blur / 2));

    // طبقة أوسع قليلاً لدمج الحواف مع الخلفية
    const feather = evenInt(Math.max(8, Math.round(Math.min(w, h) * 0.18)));
    const fx = Math.max(0, x - feather);
    const fy = Math.max(0, y - feather);
    const fw = evenInt(Math.min(vw - fx, w + 2 * feather));
    const fh = evenInt(Math.min(vh - fy, h + 2 * feather));
    const fox = Math.max(0, Math.min(cw - fw, fx - cx));
    const foy = Math.max(0, Math.min(ch - fh, fy - cy));
    const softBlur = Math.max(8, Math.floor(blur * 0.4));
    const softLuma = Math.max(2, Math.floor(blurLuma * 0.4));

    const src = i === 0 ? "[0:v]" : `[v${i}]`;
    const dst = i === boxes.length - 1 ? "[vout]" : `[v${i + 1}]`;

    // 1) تمويه المحيط → طبقة ريش أوسع
    // 2) تغطية مركز الشعار بتمويه أقوى من نفس المحيط
    chains.push(
      `${src}split=2[base${i}][nb${i}];` +
        `[nb${i}]crop=${cw}:${ch}:${cx}:${cy},boxblur=${blur}:${blurLuma}[blur${i}];` +
        `[blur${i}]split=2[bcore${i}][bedge${i}];` +
        `[bedge${i}]crop=${fw}:${fh}:${fox}:${foy},boxblur=${softBlur}:${softLuma}[edge${i}];` +
        `[base${i}][edge${i}]overlay=${fx}:${fy}[soft${i}];` +
        `[bcore${i}]crop=${w}:${h}:${ox}:${oy}[core${i}];` +
        `[soft${i}][core${i}]overlay=${x}:${y}${dst}`,
    );
  });

  const filterComplex = `${chains.join("")};[vout]format=yuv420p[outv]`;

  const ffmpeg = await getFFmpeg(onProgress);
  const input = inputFileName(file, "mp4");
  const output = "output.mp4";
  await ffmpeg.writeFile(input, await fetchFile(file));
  await execOrThrow(ffmpeg, [
    "-i",
    input,
    "-filter_complex",
    filterComplex,
    "-map",
    "[outv]",
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
  ]);
  const data = await ffmpeg.readFile(output);
  await downloadBlob(
    toBlob(data, "video/mp4"),
    `${basename(file.name)}-delogo.mp4`,
  );
  try {
    await ffmpeg.deleteFile(input);
    await ffmpeg.deleteFile(output);
  } catch {
    /* ignore */
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
