import { fetchFile } from "@ffmpeg/util";
import {
  basename,
  downloadBlob,
  extensionForMime,
  getFFmpeg,
  toBlob,
} from "./ffmpeg-client";
import type { MediaProgress } from "./media";

export type VideoProjectOverlay =
  | {
      type: "text" | "emoji";
      text: string;
      fontSize: number;
      fontFamily?: string;
      color?: string;
      x: number;
      y: number;
      w: number;
    }
  | {
      type: "image";
      file: File;
      x: number;
      y: number;
      w: number;
      h: number;
      opacity?: number;
    };

export type VideoAudioTrack = {
  file: File;
  /** Start time within exported timeline (seconds) */
  start: number;
  volume: number;
};

export type VideoProjectExport = {
  file: File;
  trimIn: number;
  trimOut: number;
  speed: number;
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  opacity: number;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
  outW: number;
  outH: number;
  videoX: number;
  videoY: number;
  videoW: number;
  videoH: number;
  overlays: VideoProjectOverlay[];
  audioTracks: VideoAudioTrack[];
};

async function execOrThrow(
  ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>,
  args: string[],
) {
  const code = await ffmpeg.exec(args);
  if (typeof code === "number" && code !== 0) {
    throw new Error(`فشل التصدير (رمز ${code})`);
  }
}

function parseCssColor(color: string | undefined): string {
  const c = (color || "#ffffff").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  return "#ffffff";
}

async function textToPngFile(
  text: string,
  fontSize: number,
  maxW: number,
  opts?: { fontFamily?: string; color?: string; emoji?: boolean },
): Promise<File> {
  const pad = opts?.emoji ? 8 : 16;
  const canvas = document.createElement("canvas");
  const measure = canvas.getContext("2d");
  if (!measure) throw new Error("تعذر رسم النص");
  const family = opts?.fontFamily || "Cairo, Tajawal, sans-serif";
  measure.font = `${opts?.emoji ? "" : "bold "}${fontSize}px ${family}`;
  const lines = (text || "نص").split("\n").slice(0, 6);
  const measured = Math.min(
    maxW,
    Math.max(...lines.map((l) => measure.measureText(l || " ").width), 40) +
      pad * 2,
  );
  const lineH = fontSize * (opts?.emoji ? 1.1 : 1.35);
  canvas.width = Math.ceil(Math.max(measured, fontSize + pad * 2));
  canvas.height = Math.ceil(lines.length * lineH + pad * 2);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!opts?.emoji) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = parseCssColor(opts?.color);
  ctx.font = `${opts?.emoji ? "" : "bold "}${fontSize}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    ctx.fillText(
      line || " ",
      canvas.width / 2,
      pad + lineH * i + lineH / 2,
      canvas.width - pad * 2,
    );
  });
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل إنشاء طبقة النص"))),
      "image/png",
    );
  });
  return new File([blob], "text-overlay.png", { type: "image/png" });
}

/** Export a full video project including TTS/music audio tracks. */
export async function exportVideoProject(
  project: VideoProjectExport,
  onProgress?: MediaProgress,
) {
  const {
    file,
    trimIn,
    trimOut,
    speed: rawSpeed,
    rotate,
    flipH,
    flipV,
    opacity,
    volume,
    muted,
    fadeIn,
    fadeOut,
    outW,
    outH,
    videoX,
    videoY,
    videoW,
    videoH,
    overlays,
    audioTracks,
  } = project;

  if (trimOut <= trimIn + 0.05) {
    throw new Error("مدة المقطع قصيرة جداً");
  }

  const speed = Math.min(2, Math.max(0.5, rawSpeed));
  const ffmpeg = await getFFmpeg(onProgress);
  const vExt = extensionForMime(file.type, "mp4");
  const input = `in.${vExt}`;
  await ffmpeg.writeFile(input, await fetchFile(file));

  const args: string[] = [
    "-ss",
    String(trimIn),
    "-to",
    String(trimOut),
    "-i",
    input,
  ];
  const tempFiles: string[] = [input];

  const overlayNames: string[] = [];
  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i]!;
    if (ov.type === "image") {
      const ext = ov.file.type.includes("png") ? "png" : "jpg";
      const name = `ov${i}.${ext}`;
      await ffmpeg.writeFile(name, await fetchFile(ov.file));
      overlayNames.push(name);
      tempFiles.push(name);
      args.push("-i", name);
    } else {
      const png = await textToPngFile(
        ov.text,
        Math.max(18, Math.round(ov.fontSize)),
        Math.round(outW * Math.max(0.05, ov.w)),
        {
          fontFamily: ov.fontFamily,
          color: ov.color,
          emoji: ov.type === "emoji",
        },
      );
      const name = `ov${i}.png`;
      await ffmpeg.writeFile(name, await fetchFile(png));
      overlayNames.push(name);
      tempFiles.push(name);
      args.push("-i", name);
    }
  }

  const audioStartIndex = 1 + overlays.length;
  for (let i = 0; i < audioTracks.length; i++) {
    const track = audioTracks[i]!;
    const ext = extensionForMime(track.file.type, "mp3");
    const name = `aud${i}.${ext}`;
    await ffmpeg.writeFile(name, await fetchFile(track.file));
    tempFiles.push(name);
    args.push("-i", name);
  }

  const rotateFilter =
    rotate === 90
      ? "transpose=1"
      : rotate === 270
        ? "transpose=2"
        : rotate === 180
          ? "transpose=1,transpose=1"
          : null;

  const pts = (1 / speed).toFixed(4);
  const vw = Math.max(2, Math.round(videoW / 2) * 2);
  const vh = Math.max(2, Math.round(videoH / 2) * 2);
  const vx = Math.max(0, Math.round(videoX));
  const vy = Math.max(0, Math.round(videoY));
  const ow = Math.max(2, Math.round(outW / 2) * 2);
  const oh = Math.max(2, Math.round(outH / 2) * 2);

  const transforms: string[] = [];
  if (rotateFilter) transforms.push(rotateFilter);
  if (flipH) transforms.push("hflip");
  if (flipV) transforms.push("vflip");
  transforms.push(
    `scale=${vw}:${vh}:force_original_aspect_ratio=decrease`,
    `pad=${vw}:${vh}:(ow-iw)/2:(oh-ih)/2`,
    `setpts=${pts}*PTS`,
  );
  const op = Math.max(0.05, Math.min(1, opacity));
  if (op < 0.999) {
    transforms.push(`format=rgba,colorchannelmixer=aa=${op.toFixed(3)}`);
  }

  const fc: string[] = [];
  fc.push(`[0:v]${transforms.join(",")}[scaled]`);
  fc.push(`[scaled]pad=${ow}:${oh}:${vx}:${vy}:black[v0]`);

  let vlabel = "v0";
  overlays.forEach((ov, i) => {
    const inputIdx = i + 1;
    const ox = Math.round(ov.x * ow);
    const oy = Math.round(ov.y * oh);
    const next = `v${i + 1}`;
    if (ov.type === "image") {
      const iw = Math.max(2, Math.round(ov.w * ow));
      const ih = Math.max(2, Math.round(ov.h * oh));
      const a = Math.max(0.05, Math.min(1, ov.opacity ?? 1));
      if (a < 0.999) {
        fc.push(
          `[${inputIdx}:v]scale=${iw}:${ih},format=rgba,colorchannelmixer=aa=${a.toFixed(3)}[img${i}]`,
        );
      } else {
        fc.push(`[${inputIdx}:v]scale=${iw}:${ih}[img${i}]`);
      }
      fc.push(`[${vlabel}][img${i}]overlay=${ox}:${oy}[${next}]`);
    } else {
      const tw = Math.max(2, Math.round(ov.w * ow));
      fc.push(`[${inputIdx}:v]scale=${tw}:-1[img${i}]`);
      fc.push(`[${vlabel}][img${i}]overlay=${ox}:${oy}[${next}]`);
    }
    vlabel = next;
  });

  const vol = muted ? 0 : Math.max(0, Math.min(2, volume));
  const duration = (trimOut - trimIn) / speed;
  const afades: string[] = [`atempo=${speed}`, `volume=${vol}`];
  if (fadeIn > 0) {
    afades.push(
      `afade=t=in:st=0:d=${Math.min(fadeIn, duration / 2).toFixed(3)}`,
    );
  }
  if (fadeOut > 0) {
    const st = Math.max(0, duration - fadeOut);
    afades.push(
      `afade=t=out:st=${st.toFixed(3)}:d=${Math.min(fadeOut, duration / 2).toFixed(3)}`,
    );
  }

  // Mix original audio + TTS/music tracks
  fc.push(`[0:a]${afades.join(",")}[abase]`);
  let aOutLabel = "abase";
  if (audioTracks.length > 0) {
    const mixInputs = ["[abase]"];
    audioTracks.forEach((track, i) => {
      const idx = audioStartIndex + i;
      const label = `ax${i}`;
      const delayMs = Math.max(0, Math.round(track.start * 1000));
      const tvol = Math.max(0, Math.min(2, track.volume));
      fc.push(
        `[${idx}:a]volume=${tvol},adelay=${delayMs}|${delayMs}[${label}]`,
      );
      mixInputs.push(`[${label}]`);
    });
    fc.push(
      `${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=2[aout]`,
    );
    aOutLabel = "aout";
  }

  const output = "project-out.mp4";
  tempFiles.push(output);

  const runWithAudio = async () => {
    await execOrThrow(ffmpeg, [
      ...args,
      "-filter_complex",
      fc.join(";"),
      "-map",
      `[${vlabel}]`,
      "-map",
      `[${aOutLabel}]`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-shortest",
      output,
    ]);
  };

  const runVideoOnly = async () => {
    const videoOnlyFc = fc.filter(
      (p) =>
        !p.includes("[0:a]") &&
        !p.includes(":a]") &&
        !p.includes("amix") &&
        !p.includes("[abase]") &&
        !p.includes("[aout]") &&
        !p.includes("adelay"),
    );
    const videoArgs = [
      "-ss",
      String(trimIn),
      "-to",
      String(trimOut),
      "-i",
      input,
    ];
    for (const name of overlayNames) {
      videoArgs.push("-i", name);
    }
    await execOrThrow(ffmpeg, [
      ...videoArgs,
      "-filter_complex",
      videoOnlyFc.join(";"),
      "-map",
      `[${vlabel}]`,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-movflags",
      "+faststart",
      output,
    ]);
  };

  try {
    await runWithAudio();
  } catch {
    await runVideoOnly();
  }

  const data = await ffmpeg.readFile(output);
  downloadBlob(toBlob(data, "video/mp4"), `${basename(file.name)}-edited.mp4`);

  for (const name of tempFiles) {
    try {
      await ffmpeg.deleteFile(name);
    } catch {
      /* ignore */
    }
  }
}
