"use client";

export type ClientYoutubeHit = {
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

function containerOf(mime: string | undefined): string {
  const m = (mime || "").split(";")[0]?.trim().toLowerCase() || "";
  if (m.includes("webm")) return "WEBM";
  if (m.includes("audio/mp4") || m.includes("m4a")) return "M4A";
  if (m.includes("mp4")) return "MP4";
  return m.replace(/^.*\//, "").toUpperCase() || "FILE";
}

function heightOf(f: { quality_label?: string; height?: number }): string {
  if (f.quality_label) return f.quality_label.replace(/p$/i, "");
  if (f.height) return String(f.height);
  return "auto";
}

/**
 * List YouTube formats in the browser (user IP) — Vercel often cannot reach googlevideo.
 */
export async function listYoutubeFormatsInBrowser(videoId: string): Promise<{
  title: string;
  thumbnail: string;
  items: ClientYoutubeHit[];
}> {
  const { Innertube, Platform, ClientType } = await import("youtubei.js/web");
  Platform.shim.eval = async (data: { output: string }) =>
    new Function(data.output)();

  type Tube = Awaited<ReturnType<typeof Innertube.create>>;
  let yt: Tube;
  try {
    yt = await Innertube.create({
      client_type: ClientType.ANDROID_VR,
      generate_session_locally: true,
    });
  } catch {
    yt = await Innertube.create({
      client_type: ClientType.ANDROID,
      generate_session_locally: true,
    });
  }

  const info = await yt.getBasicInfo(videoId);
  const title = info.basic_info?.title || `YouTube ${videoId}`;
  const thumbnail =
    info.basic_info?.thumbnail?.slice(-1)?.[0]?.url ||
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  type Fmt = {
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

  let raw: Fmt[] = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || []),
  ] as Fmt[];

  // If no plain URLs, try MWEB + decipher
  if (!raw.some((f) => f.url)) {
    const mweb = await Innertube.create({
      client_type: ClientType.MWEB,
      generate_session_locally: true,
    });
    const mInfo = await mweb.getBasicInfo(videoId);
    raw = [
      ...(mInfo.streaming_data?.formats || []),
      ...(mInfo.streaming_data?.adaptive_formats || []),
    ] as Fmt[];
    for (const f of raw) {
      if (f.url) continue;
      try {
        const cipher = f.signature_cipher || f.cipher;
        if (cipher && mweb.session.player) {
          f.url = await mweb.session.player.decipher(cipher);
        }
      } catch {
        /* skip */
      }
    }
  }

  type Row = ClientYoutubeHit & { score: number };
  const videoByHeight = new Map<string, Row>();
  let bestAudio: Row | null = null;

  for (const f of raw) {
    if (!f.url || !/^https?:\/\//i.test(f.url)) continue;
    const hasVideo = Boolean(f.has_video);
    const hasAudio = Boolean(f.has_audio);
    if (!hasVideo && !hasAudio) continue;
    const container = containerOf(f.mime_type);
    const size = f.content_length ? Number(f.content_length) : null;

    if (hasVideo) {
      const quality = heightOf(f);
      const score =
        (hasAudio ? 100_000 : 0) +
        (container === "MP4" ? 10_000 : 0) +
        Math.min(size || 0, 1e12) / 1e9;
      const row: Row = {
        url: f.url,
        type: "video",
        title: hasAudio
          ? `${container} ${quality} · مع صوت`
          : `${container} ${quality} · بدون صوت`,
        thumbnail,
        source: "youtube-browser",
        quality,
        container,
        size,
        hasAudio,
        hasVideo: true,
        itag: f.itag,
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
      source: "youtube-browser",
      quality: "audio",
      container: container === "MP4" ? "M4A" : container,
      size,
      hasAudio: true,
      hasVideo: false,
      itag: f.itag,
      videoId,
      score,
    };
    if (!bestAudio || score > bestAudio.score) bestAudio = row;
  }

  const videos = [...videoByHeight.values()]
    .sort((a, b) => {
      if (a.hasAudio !== b.hasAudio) return a.hasAudio ? -1 : 1;
      return (
        (Number.parseInt(b.quality || "0", 10) || 0) -
        (Number.parseInt(a.quality || "0", 10) || 0)
      );
    })
    .map(({ score: _s, ...rest }) => {
      void _s;
      return rest;
    });

  const items: ClientYoutubeHit[] = [...videos];
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
    throw new Error("لم تتوفر روابط فيديو من يوتيوب حالياً");
  }

  return { title, thumbnail, items };
}
