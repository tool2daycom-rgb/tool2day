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
      type: "text";
      text: string;
      fontSize: number;
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
    };

export type VideoProjectExport = {
  file: File;
  trimIn: number;
  trimOut: number;
  speed: number;
  rotate: 0 | 90 | 180 | 270;
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

async function textToPngFile(
  text: string,
  fontSize: number,
  maxW: number,
): Promise<File> {
  const pad = 16;
  const canvas = document.createElement("canvas");
  const measure = canvas.getContext("2d");
  if (!measure) throw new Error("تعذر رسم النص");
  measure.font = `bold ${fontSize}px Cairo, Tajawal, sans-serif`;
  const lines = (text || "نص").split("\n").slice(0, 4);
  const measured = Math.min(
    maxW,
    Math.max(...lines.map((l) => measure.measureText(l || " ").width), 40) +
      pad * 2,
  );
  const lineH = fontSize * 1.35;
  canvas.width = Math.ceil(measured);
  canvas.height = Math.ceil(lines.length * lineH + pad * 2);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${fontSize}px Cairo, Tajawal, sans-serif`;
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

/** Export a full video project (trim, speed, rotate, volume, canvas, overlays). */
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
  const overlayFiles: string[] = [];

  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i]!;
    if (ov.type === "text") {
      const png = await textToPngFile(
        ov.text,
        Math.max(18, Math.round(ov.fontSize)),
        Math.round(outW * Math.max(0.05, ov.w)),
      );
      const name = `ov${i}.png`;
      await ffmpeg.writeFile(name, await fetchFile(png));
      overlayFiles.push(name);
      args.push("-i", name);
    } else {
      const ext = ov.file.type.includes("png") ? "png" : "jpg";
      const name = `ov${i}.${ext}`;
      await ffmpeg.writeFile(name, await fetchFile(ov.file));
      overlayFiles.push(name);
      args.push("-i", name);
    }
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
  transforms.push(
    `scale=${vw}:${vh}:force_original_aspect_ratio=decrease`,
    `pad=${vw}:${vh}:(ow-iw)/2:(oh-ih)/2`,
    `setpts=${pts}*PTS`,
  );

  const fc: string[] = [];
  fc.push(`[0:v]${transforms.join(",")}[scaled]`);
  fc.push(`[scaled]pad=${ow}:${oh}:${vx}:${vy}:black[v0]`);

  let vlabel = "v0";
  overlays.forEach((ov, i) => {
    const inputIdx = i + 1;
    const ox = Math.round(ov.x * ow);
    const oy = Math.round(ov.y * oh);
    const next = `v${i + 1}`;
    if (ov.type === "text") {
      const tw = Math.max(2, Math.round(ov.w * ow));
      fc.push(`[${inputIdx}:v]scale=${tw}:-1[img${i}]`);
      fc.push(`[${vlabel}][img${i}]overlay=${ox}:${oy}[${next}]`);
    } else {
      const iw = Math.max(2, Math.round(ov.w * ow));
      const ih = Math.max(2, Math.round(ov.h * oh));
      fc.push(`[${inputIdx}:v]scale=${iw}:${ih}[img${i}]`);
      fc.push(`[${vlabel}][img${i}]overlay=${ox}:${oy}[${next}]`);
    }
    vlabel = next;
  });

  const vol = muted ? 0 : Math.max(0, Math.min(2, volume));
  const duration = (trimOut - trimIn) / speed;
  const afades: string[] = [`atempo=${speed}`, `volume=${vol}`];
  if (fadeIn > 0) {
    afades.push(`afade=t=in:st=0:d=${Math.min(fadeIn, duration / 2).toFixed(3)}`);
  }
  if (fadeOut > 0) {
    const st = Math.max(0, duration - fadeOut);
    afades.push(
      `afade=t=out:st=${st.toFixed(3)}:d=${Math.min(fadeOut, duration / 2).toFixed(3)}`,
    );
  }
  fc.push(`[0:a]${afades.join(",")}[aout]`);

  const output = "project-out.mp4";
  const commonTail = [
    "-filter_complex",
    fc.join(";"),
    "-map",
    `[${vlabel}]`,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-movflags",
    "+faststart",
  ];

  try {
    await execOrThrow(ffmpeg, [
      ...args,
      ...commonTail,
      "-map",
      "[aout]",
      "-c:a",
      "aac",
      "-shortest",
      output,
    ]);
  } catch {
    const fcVideoOnly = fc.filter((p) => !p.includes("[0:a]"));
    await execOrThrow(ffmpeg, [
      ...args,
      "-filter_complex",
      fcVideoOnly.join(";"),
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
  }

  const data = await ffmpeg.readFile(output);
  downloadBlob(toBlob(data, "video/mp4"), `${basename(file.name)}-edited.mp4`);

  try {
    await ffmpeg.deleteFile(input);
    await ffmpeg.deleteFile(output);
    for (const name of overlayFiles) await ffmpeg.deleteFile(name);
  } catch {
    /* ignore */
  }
}
