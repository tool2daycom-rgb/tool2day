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
  /** Skip into source (seconds) */
  offset?: number;
  /** Play length (seconds) */
  duration?: number;
  /** True when this is the original video audio lane */
  linked?: boolean;
};

/** Timed video/image layers composited above the base clip */
export type VideoLayerClip = {
  file: File;
  kind: "video" | "image";
  /** Start on exported timeline (seconds) */
  start: number;
  duration: number;
  /** Skip into source (seconds) — video only */
  offset?: number;
  /** Normalized 0–1 of output frame */
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
};

export type VideoProjectExport = {
  file: File;
  trimIn: number;
  trimOut: number;
  speed: number;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  opacity: number;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
  audioPitch?: number;
  audioReverse?: boolean;
  noiseReduce?: boolean;
  outW: number;
  outH: number;
  videoX: number;
  videoY: number;
  videoW: number;
  videoH: number;
  /** ضباب خلفية القماش (نسخة مموّهة من الفيديو) */
  bgBlur?: { enabled: boolean; amount: number } | null;
  canvasBg?: string;
  /** Bottom → top stacking order */
  videoLayers?: VideoLayerClip[];
  overlays: VideoProjectOverlay[];
  audioTracks: VideoAudioTrack[];
  /** Normalized crop 0–1 relative to source frame */
  crop?: { x: number; y: number; w: number; h: number } | null;
  chromaKey?: { enabled: boolean; color: string; similarity: number } | null;
  removeLogo?: { x: number; y: number; w: number; h: number } | null;
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
    audioPitch = 1,
    audioReverse = false,
    noiseReduce = false,
    outW,
    outH,
    videoX,
    videoY,
    videoW,
    videoH,
    bgBlur = null,
    canvasBg = "#000000",
    videoLayers = [],
    overlays,
    audioTracks,
    crop,
    chromaKey,
    removeLogo,
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

  const layerNames: string[] = [];
  for (let i = 0; i < videoLayers.length; i++) {
    const layer = videoLayers[i]!;
    const ext =
      layer.kind === "image"
        ? layer.file.type.includes("png")
          ? "png"
          : "jpg"
        : extensionForMime(layer.file.type, "mp4");
    const name = `lyr${i}.${ext}`;
    await ffmpeg.writeFile(name, await fetchFile(layer.file));
    layerNames.push(name);
    tempFiles.push(name);
    args.push("-i", name);
  }

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

  const audioStartIndex = 1 + videoLayers.length + overlays.length;
  const linkedTrack = audioTracks.find((t) => t.linked);
  const extraTracks = audioTracks.filter((t) => !t.linked);
  for (let i = 0; i < extraTracks.length; i++) {
    const track = extraTracks[i]!;
    const ext = extensionForMime(track.file.type, "mp3");
    const name = `aud${i}.${ext}`;
    await ffmpeg.writeFile(name, await fetchFile(track.file));
    tempFiles.push(name);
    args.push("-i", name);
  }

  const rotDeg = ((Number(rotate) % 360) + 360) % 360;
  const useFreeRotate =
    Math.abs(rotDeg) > 0.05 &&
    Math.abs(rotDeg - 90) >= 0.5 &&
    Math.abs(rotDeg - 180) >= 0.5 &&
    Math.abs(rotDeg - 270) >= 0.5 &&
    Math.abs(rotDeg - 360) > 0.05;

  const pts = (1 / speed).toFixed(4);
  const vw = Math.max(2, Math.round(videoW / 2) * 2);
  const vh = Math.max(2, Math.round(videoH / 2) * 2);
  const vx = Math.round(videoX);
  const vy = Math.round(videoY);
  const ow = Math.max(2, Math.round(outW / 2) * 2);
  const oh = Math.max(2, Math.round(outH / 2) * 2);
  const blurOn = Boolean(bgBlur?.enabled && (bgBlur.amount ?? 0) > 0);
  const blurSigma = Math.max(
    1,
    Math.round(((bgBlur?.amount ?? 50) / 100) * 48),
  );
  const bgHex = (canvasBg || "#000000").replace("#", "");

  const prep: string[] = [];
  if (crop && crop.w > 0.02 && crop.h > 0.02) {
    const cx = Math.max(0, Math.min(0.98, crop.x));
    const cy = Math.max(0, Math.min(0.98, crop.y));
    const cw = Math.max(0.02, Math.min(1 - cx, crop.w));
    const ch = Math.max(0.02, Math.min(1 - cy, crop.h));
    prep.push(
      `crop=iw*${cw.toFixed(4)}:ih*${ch.toFixed(4)}:iw*${cx.toFixed(4)}:ih*${cy.toFixed(4)}`,
    );
  }
  if (removeLogo) {
    const lx = Math.max(0, Math.round(removeLogo.x));
    const ly = Math.max(0, Math.round(removeLogo.y));
    const lw = Math.max(8, Math.round(removeLogo.w));
    const lh = Math.max(8, Math.round(removeLogo.h));
    prep.push(`delogo=x=${lx}:y=${ly}:w=${lw}:h=${lh}`);
  }
  if (chromaKey?.enabled) {
    const hex = (chromaKey.color || "#00ff00").replace("#", "");
    const sim = Math.max(0.01, Math.min(1, chromaKey.similarity / 100));
    prep.push(`chromakey=0x${hex}:${sim.toFixed(3)}:0.1`);
  }
  prep.push(
    `scale=${vw}:${vh}:force_original_aspect_ratio=decrease`,
    `pad=${vw}:${vh}:(ow-iw)/2:(oh-ih)/2`,
  );
  if (Math.abs(rotDeg - 90) < 0.5) prep.push("transpose=1");
  else if (Math.abs(rotDeg - 270) < 0.5) prep.push("transpose=2");
  else if (Math.abs(rotDeg - 180) < 0.5) prep.push("transpose=1,transpose=1");
  else if (useFreeRotate) {
    prep.push(
      `rotate=${(rotDeg * Math.PI) / 180}:ow=rotw(iw):oh=roth(ih):c=none@0`,
    );
  }
  if (flipH) prep.push("hflip");
  if (flipV) prep.push("vflip");
  prep.push(`setpts=${pts}*PTS`);
  const op = Math.max(0.05, Math.min(1, opacity));
  if (op < 0.999 || useFreeRotate) {
    prep.push(`format=rgba`);
    if (op < 0.999) {
      prep.push(`colorchannelmixer=aa=${op.toFixed(3)}`);
    }
  }

  const overlayXY = useFreeRotate
    ? `x=${vx}+(${vw}-overlay_w)/2:y=${vy}+(${vh}-overlay_h)/2`
    : `x=${vx}:y=${vy}`;

  const fc: string[] = [];
  if (blurOn) {
    fc.push(
      `[0:v]split[srcfg][srcbg]`,
      `[srcbg]scale=${ow}:${oh}:force_original_aspect_ratio=increase,crop=${ow}:${oh},gblur=sigma=${blurSigma},setsar=1[bg]`,
      `[srcfg]${prep.join(",")}[scaled]`,
      `[bg][scaled]overlay=${overlayXY}:format=auto[v0]`,
    );
  } else if (vx >= 0 && vy >= 0 && !useFreeRotate) {
    fc.push(`[0:v]${prep.join(",")}[scaled]`);
    fc.push(`[scaled]pad=${ow}:${oh}:${vx}:${vy}:0x${bgHex}[v0]`);
  } else {
    fc.push(`[0:v]${prep.join(",")}[scaled]`);
    fc.push(`color=c=0x${bgHex}:s=${ow}x${oh}:d=3600[bg]`);
    fc.push(
      `[bg][scaled]overlay=${overlayXY}:shortest=1:format=auto[v0]`,
    );
  }

  let vlabel = "v0";
  // Video/image montage layers (timed), bottom → top
  videoLayers.forEach((layer, i) => {
    const inputIdx = i + 1;
    const ox = Math.round(layer.x * ow);
    const oy = Math.round(layer.y * oh);
    const iw = Math.max(2, Math.round(layer.w * ow));
    const ih = Math.max(2, Math.round(layer.h * oh));
    const a = Math.max(0.05, Math.min(1, layer.opacity ?? 1));
    const start = Math.max(0, layer.start);
    const dur = Math.max(0.05, layer.duration);
    const end = start + dur;
    const next = `vl${i}`;
    const layerPrep: string[] = [];
    if (layer.kind === "video") {
      const off = Math.max(0, layer.offset || 0);
      layerPrep.push(
        `trim=start=${off.toFixed(3)}:duration=${dur.toFixed(3)}`,
        "setpts=PTS-STARTPTS",
      );
    }
    layerPrep.push(`scale=${iw}:${ih}:force_original_aspect_ratio=decrease`);
    layerPrep.push(`pad=${iw}:${ih}:(ow-iw)/2:(oh-ih)/2`);
    if (a < 0.999) {
      layerPrep.push(`format=rgba,colorchannelmixer=aa=${a.toFixed(3)}`);
    }
    fc.push(`[${inputIdx}:v]${layerPrep.join(",")}[lyr${i}]`);
    fc.push(
      `[${vlabel}][lyr${i}]overlay=${ox}:${oy}:enable='between(t\\,${start.toFixed(3)}\\,${end.toFixed(3)})'[${next}]`,
    );
    vlabel = next;
  });

  overlays.forEach((ov, i) => {
    const inputIdx = 1 + videoLayers.length + i;
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
  const pitch = Math.max(0.5, Math.min(2, audioPitch || 1));
  const afades: string[] = [];
  if (audioReverse) afades.push("areverse");
  if (noiseReduce) afades.push("highpass=f=200,lowpass=f=3000");
  if (Math.abs(pitch - 1) > 0.02) {
    afades.push(
      `asetrate=44100*${pitch.toFixed(3)},aresample=44100,atempo=${(1 / pitch).toFixed(3)}`,
    );
  }
  afades.push(`atempo=${speed}`);

  if (linkedTrack) {
    const off = Math.max(0, linkedTrack.offset || 0);
    const clipDur = Math.max(0.1, linkedTrack.duration || duration);
    if (off > 0.001) {
      afades.push(`atrim=start=${off.toFixed(3)}:duration=${clipDur.toFixed(3)}`);
      afades.push("asetpts=PTS-STARTPTS");
    } else if (linkedTrack.duration && linkedTrack.duration + 0.05 < duration) {
      afades.push(`atrim=start=0:duration=${clipDur.toFixed(3)}`);
      afades.push("asetpts=PTS-STARTPTS");
    }
    const delayMs = Math.max(0, Math.round((linkedTrack.start || 0) * 1000));
    if (delayMs > 0) afades.push(`adelay=${delayMs}|${delayMs}`);
    afades.push(`volume=${Math.max(0, Math.min(2, linkedTrack.volume))}`);
  } else if (extraTracks.some((t) => t.file)) {
    // Detached/music-only: silence original video audio
    afades.push("volume=0");
  } else {
    afades.push(`volume=${vol}`);
  }

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

  // Mix original audio + extra tracks (music / TTS / detached)
  fc.push(`[0:a]${afades.join(",")}[abase]`);
  let aOutLabel = "abase";
  if (extraTracks.length > 0) {
    const mixInputs = ["[abase]"];
    extraTracks.forEach((track, i) => {
      const idx = audioStartIndex + i;
      const label = `ax${i}`;
      const delayMs = Math.max(0, Math.round(track.start * 1000));
      const tvol = Math.max(0, Math.min(2, track.volume));
      const off = Math.max(0, track.offset || 0);
      const parts: string[] = [];
      if (off > 0.001 || track.duration) {
        const d = Math.max(0.1, track.duration || 999);
        parts.push(`atrim=start=${off.toFixed(3)}:duration=${d.toFixed(3)}`);
        parts.push("asetpts=PTS-STARTPTS");
      }
      parts.push(`volume=${tvol}`);
      if (delayMs > 0) parts.push(`adelay=${delayMs}|${delayMs}`);
      fc.push(`[${idx}:a]${parts.join(",")}[${label}]`);
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
    for (const name of layerNames) {
      videoArgs.push("-i", name);
    }
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
  await downloadBlob(toBlob(data, "video/mp4"), `${basename(file.name)}-edited.mp4`);

  for (const name of tempFiles) {
    try {
      await ffmpeg.deleteFile(name);
    } catch {
      /* ignore */
    }
  }
}
