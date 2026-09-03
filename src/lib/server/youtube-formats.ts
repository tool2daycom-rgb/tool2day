import { ClientType, Innertube, Platform } from "youtubei.js";

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
};

let evalShimInstalled = false;

function installEvalShim() {
  if (evalShimInstalled) return;
  Platform.shim.eval = async (data: { output: string }) =>
    new Function(data.output)();
  evalShimInstalled = true;
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

/**
 * List downloadable YouTube formats (qualities) via InnerTube MWEB + decipher.
 */
export async function listYoutubeFormats(videoId: string): Promise<{
  title: string;
  thumbnail: string;
  items: YoutubeFormatHit[];
}> {
  installEvalShim();

  const yt = await Innertube.create({
    client_type: ClientType.MWEB,
    generate_session_locally: true,
  });
  const info = await yt.getBasicInfo(videoId);
  const title = info.basic_info?.title || `YouTube ${videoId}`;
  const thumbnail =
    info.basic_info?.thumbnail?.slice(-1)?.[0]?.url ||
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  const raw = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || []),
  ];

  type Row = YoutubeFormatHit & { score: number };
  const videoByHeight = new Map<string, Row>();
  let bestAudio: Row | null = null;

  for (const f of raw) {
    try {
      let url = f.url as string | undefined;
      if (!url && yt.session.player) {
        const cipher = f.signature_cipher || f.cipher;
        if (cipher) url = await yt.session.player.decipher(cipher);
      }
      if (!url || !/^https?:\/\//i.test(url)) continue;

      const hasVideo = Boolean(f.has_video);
      const hasAudio = Boolean(f.has_audio);
      if (!hasVideo && !hasAudio) continue;

      const container = containerOf(f.mime_type);
      const size = f.content_length ? Number(f.content_length) : null;
      const itag = f.itag;

      if (hasVideo) {
        const quality = heightOf(f);
        const score =
          (hasAudio ? 10_000 : 0) +
          (container === "MP4" ? 1_000 : 0) +
          Math.min(size || 0, 1e12) / 1e9;
        const titleLabel = hasAudio
          ? `${container} ${quality}`
          : `${container} ${quality}`;
        const row: Row = {
          url,
          type: "video",
          title: titleLabel,
          thumbnail,
          source: "youtube-innertube",
          quality,
          container,
          size,
          hasAudio,
          hasVideo: true,
          itag,
          score,
        };
        const prev = videoByHeight.get(quality);
        if (!prev || score > prev.score) videoByHeight.set(quality, row);
        continue;
      }

      // audio-only — prefer M4A/MP4 over WEBM
      const score =
        (container === "M4A" || container === "MP4" ? 1e15 : 0) + (size || 0);
      const row: Row = {
        url,
        type: "audio",
        title: `${container === "MP4" ? "M4A" : container} صوت`,
        thumbnail,
        source: "youtube-innertube",
        quality: "audio",
        container: container === "MP4" ? "M4A" : container,
        size,
        hasAudio: true,
        hasVideo: false,
        itag,
        score,
      };
      if (!bestAudio || score > bestAudio.score) bestAudio = row;
    } catch {
      /* skip */
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
      // Mark silent tracks like ytb.rip (muted icon / note)
      if (rest.hasVideo && !rest.hasAudio) {
        return { ...rest, title: `${rest.container} ${rest.quality}` };
      }
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

  return { title, thumbnail, items };
}
