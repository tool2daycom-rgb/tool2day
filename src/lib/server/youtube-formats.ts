import dns from "node:dns";
import { ClientType, Innertube, Platform } from "youtubei.js";

// Vercel/Node often prefers IPv6; googlevideo can fail with "fetch failed"
dns.setDefaultResultOrder("ipv4first");

export type YoutubeFormatHit = {
  url: string;
  type: "video" | "audio" | "image";
  title: string;
  thumbnail?: string;
  source: string;
  quality?: string;
  container?: string;
  size?: number | null;
  hasAudio?: boolean;
  hasVideo?: boolean;
  itag?: number;
  videoId?: string;
};

let evalShimInstalled = false;

function installEvalShim() {
  if (evalShimInstalled) return;
  Platform.shim.eval = async (data: { output: string }) =>
    new Function(data.output)();
  evalShimInstalled = true;
}

async function createTube(
  client: (typeof ClientType)[keyof typeof ClientType],
) {
  installEvalShim();
  return Innertube.create({
    client_type: client,
    generate_session_locally: true,
  });
}

function containerOf(mime: string | undefined): string {
  const m = (mime || "").split(";")[0]?.trim().toLowerCase() || "";
  if (m.includes("webm")) return "WEBM";
  if (m.includes("audio/mp4") || m.includes("m4a")) return "M4A";
  if (m.includes("mp4")) return "MP4";
  return m.replace(/^.*\//, "").toUpperCase() || "FILE";
}

function heightOf(f: {
  quality_label?: string;
  height?: number;
}): string {
  if (f.quality_label) return f.quality_label.replace(/p$/i, "");
  if (f.height) return String(f.height);
  return "auto";
}

type TubeFormat = {
  itag?: number;
  url?: string;
  mime_type?: string;
  quality_label?: string;
  height?: number;
  content_length?: string | number;
  has_video?: boolean;
  has_audio?: boolean;
  signature_cipher?: string;
  cipher?: string;
};

/**
 * List YouTube download options using ANDROID_VR (plain googlevideo URLs).
 * Browser can open these URLs; Vercel often cannot proxy googlevideo.
 */
export async function listYoutubeFormats(videoId: string): Promise<{
  title: string;
  thumbnail: string;
  items: YoutubeFormatHit[];
}> {
  const yt = await createTube(ClientType.ANDROID_VR);
  const info = await yt.getBasicInfo(videoId);

  const title = info.basic_info?.title || `YouTube ${videoId}`;
  const thumbnail =
    info.basic_info?.thumbnail?.slice(-1)?.[0]?.url ||
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  const raw = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || []),
  ] as TubeFormat[];

  type Row = YoutubeFormatHit & { score: number };
  const videoByHeight = new Map<string, Row>();
  let bestAudio: Row | null = null;

  for (const f of raw) {
    const hasVideo = Boolean(f.has_video);
    const hasAudio = Boolean(f.has_audio);
    if (!hasVideo && !hasAudio) continue;
    if (!f.url || !/^https?:\/\//i.test(f.url)) continue;

    const container = containerOf(f.mime_type);
    const size = f.content_length ? Number(f.content_length) : null;
    const itag = f.itag;

    if (hasVideo) {
      const quality = heightOf(f);
      const score =
        (hasAudio ? 100_000 : 0) +
        (container === "MP4" ? 10_000 : 0) +
        Math.min(size || 0, 1e12) / 1e9;
      const row: Row = {
        url: f.url,
        type: "video",
        title: `${container} ${quality}`,
        thumbnail,
        source: "youtube-android-vr",
        quality,
        container,
        size,
        hasAudio,
        hasVideo: true,
        itag,
        videoId,
        score,
      };
      const prev = videoByHeight.get(quality);
      if (!prev || score > prev.score) videoByHeight.set(quality, row);
      continue;
    }

    const score =
      (container === "M4A" || container === "MP4" ? 1e15 : 0) + (size || 0);
    const row: Row = {
      url: f.url,
      type: "audio",
      title: `${container === "MP4" ? "M4A" : container} صوت`,
      thumbnail,
      source: "youtube-android-vr",
      quality: "audio",
      container: container === "MP4" ? "M4A" : container,
      size,
      hasAudio: true,
      hasVideo: false,
      itag,
      videoId,
      score,
    };
    if (!bestAudio || score > bestAudio.score) bestAudio = row;
  }

  // Fallback: ANDROID progressive only
  if (videoByHeight.size === 0) {
    const android = await createTube(ClientType.ANDROID);
    const aInfo = await android.getBasicInfo(videoId);
    for (const f of (aInfo.streaming_data?.formats || []) as TubeFormat[]) {
      if (!f.url || !f.has_video) continue;
      const quality = heightOf(f);
      const container = containerOf(f.mime_type);
      videoByHeight.set(quality, {
        url: f.url,
        type: "video",
        title: `${container} ${quality}`,
        thumbnail,
        source: "youtube-android",
        quality,
        container,
        size: f.content_length ? Number(f.content_length) : null,
        hasAudio: Boolean(f.has_audio),
        hasVideo: true,
        itag: f.itag,
        videoId,
        score: 1,
      });
    }
  }

  const videos = [...videoByHeight.values()]
    .sort(
      (a, b) =>
        (Number.parseInt(b.quality || "0", 10) || 0) -
        (Number.parseInt(a.quality || "0", 10) || 0),
    )
    .map(({ score: _s, ...rest }) => {
      void _s;
      return rest;
    });

  const items: YoutubeFormatHit[] = [...videos];
  if (bestAudio) {
    const { score: _s, ...rest } = bestAudio;
    void _s;
    items.push(rest);
  }

  items.push({
    url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    type: "image",
    title: "صورة — أقصى جودة (maxres)",
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    source: "youtube-thumb",
    quality: "maxres",
    container: "JPG",
    size: null,
    hasAudio: false,
    hasVideo: false,
  });

  if (!videos.length) {
    throw new Error("لم تتوفر روابط فيديو قابلة للتنزيل حالياً");
  }

  return { title, thumbnail, items };
}

/** Resolve a fresh direct stream URL for one format (for client download). */
export async function resolveYoutubeStreamUrl(opts: {
  videoId: string;
  itag?: number;
  quality?: string;
  kind: "video" | "audio";
}): Promise<{
  url: string;
  filename: string;
  contentType: string;
  size?: number | null;
}> {
  const yt = await createTube(ClientType.ANDROID_VR);
  const info = await yt.getBasicInfo(opts.videoId);
  const all = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || []),
  ] as TubeFormat[];

  let format: TubeFormat | undefined;
  if (opts.itag) {
    format = all.find((f) => f.itag === opts.itag);
  } else if (opts.kind === "audio") {
    format = all
      .filter((f) => f.has_audio && !f.has_video && f.url)
      .sort((a, b) => Number(b.content_length || 0) - Number(a.content_length || 0))[0];
  } else if (opts.quality) {
    const q = opts.quality.replace(/p$/i, "");
    format = all.find(
      (f) =>
        f.url &&
        f.has_video &&
        heightOf(f) === q &&
        (f.mime_type || "").includes("mp4"),
    );
  }
  if (!format?.url) {
    // ANDROID progressive fallback
    const android = await createTube(ClientType.ANDROID);
    const aInfo = await android.getBasicInfo(opts.videoId);
    format = ((aInfo.streaming_data?.formats || []) as TubeFormat[]).find(
      (f) => f.url && f.has_video && f.has_audio,
    );
  }
  if (!format?.url) {
    throw new Error("تعذّر إيجاد رابط التنزيل");
  }

  const container = containerOf(format.mime_type);
  const quality = heightOf(format);
  const ext =
    opts.kind === "audio" || (!format.has_video && format.has_audio)
      ? "m4a"
      : container === "WEBM"
        ? "webm"
        : "mp4";
  const mime =
    format.mime_type?.split(";")[0] ||
    (ext === "m4a" ? "audio/mp4" : ext === "webm" ? "video/webm" : "video/mp4");

  return {
    url: format.url,
    filename: `youtube-${opts.videoId}-${quality}.${ext}`,
    contentType: mime,
    size: format.content_length ? Number(format.content_length) : null,
  };
}
