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
  downloadBlob(toBlob(data, "video/mp4"), `${basename(file.name)}-${suffix}.mp4`);
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
  downloadBlob(toBlob(data, "audio/mpeg"), `${basename(file.name)}-${suffix}.mp3`);
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
  downloadBlob(toBlob(data, mime), `${basename(file.name)}.${format}`);
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
  downloadBlob(toBlob(data, mimeMap[format]), `${basename(file.name)}.${format}`);
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
  downloadBlob(toBlob(data, "video/mp4"), `${basename(file.name)}-loop.mp4`);
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
  downloadBlob(toBlob(data, "video/mp4"), "merged-video.mp4");
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
  downloadBlob(toBlob(data, "audio/mpeg"), "merged-audio.mp3");
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
  downloadBlob(toBlob(data, "video/mp4"), `${basename(video.name)}-audio.mp4`);
}

export async function addImageToVideo(
  video: File,
  image: File,
  onProgress?: MediaProgress,
) {
  const ffmpeg = await getFFmpeg(onProgress);
  const vExt = extensionForMime(video.type, "mp4");
  const iExt = image.type.includes("png") ? "png" : "jpg";
  await ffmpeg.writeFile(`v.${vExt}`, await fetchFile(video));
  await ffmpeg.writeFile(`i.${iExt}`, await fetchFile(image));
  await execOrThrow(ffmpeg, [
    "-i",
    `v.${vExt}`,
    "-i",
    `i.${iExt}`,
    "-filter_complex",
    "[1:v]scale=200:-1[img];[0:v][img]overlay=20:20",
    "-c:a",
    "copy",
    "output.mp4",
  ]);
  const data = await ffmpeg.readFile("output.mp4");
  downloadBlob(toBlob(data, "video/mp4"), `${basename(video.name)}-image.mp4`);
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

export async function removeLogo(
  file: File,
  box: { x: number; y: number; w: number; h: number },
  onProgress?: MediaProgress,
) {
  await runVideoOut(
    file,
    [
      "-vf",
      `delogo=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "copy",
    ],
    "delogo",
    onProgress,
  );
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
