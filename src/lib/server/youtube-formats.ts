import dns from "node:dns";
import { ClientType, Innertube, Platform } from "youtubei.js";

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
  cookie?: string,
) {
  installEvalShim();
  const c =
    cookie?.trim() || process.env.YOUTUBE_COOKIES?.trim() || undefined;
  return Innertube.create({
    client_type: client,
    generate_session_locally: true,
    ...(c ? { cookie: c } : {}),
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

type Row = YoutubeFormatHit & { score: number };

async function ingestFormats(
  raw: TubeFormat[],
  opts: {
    videoId: string;
    thumbnail: string;
    source: string;
    videoByHeight: Map<string, Row>;
    getBestAudio: () => Row | null;
    setBestAudio: (r: Row) => void;
    decipherUrl?: (f: TubeFormat) => Promise<string | undefined>;
  },
) {
  for (const f of raw) {
    try {
      let url = f.url;
      if (!url && opts.decipherUrl) {
        url = await opts.decipherUrl(f);
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
          (hasAudio ? 100_000 : 0) +
          (container === "MP4" ? 10_000 : 0) +
          (f.url ? 500 : 0) +
          Math.min(size || 0, 1e12) / 1e9;
        const row: Row = {
          url,
          type: "video",
          title: hasAudio
            ? `${container} ${quality} · مع صوت`
            : `${container} ${quality} · بدون صوت`,
          thumbnail: opts.thumbnail,
          source: opts.source,
          quality,
          container,
          size,
          hasAudio,
          hasVideo: true,
          itag,
          videoId: opts.videoId,
          score,
        };
        const prev = opts.videoByHeight.get(quality);
        if (!prev || score > prev.score) opts.videoByHeight.set(quality, row);
        continue;
      }

      const score =
        (container === "M4A" || container === "MP4" ? 1e15 : 0) + (size || 0);
      const row: Row = {
        url,
        type: "audio",
        title: `${container === "MP4" ? "M4A" : container} صوت`,
        thumbnail: opts.thumbnail,
        source: opts.source,
        quality: "audio",
        container: container === "MP4" ? "M4A" : container,
        size,
        hasAudio: true,
        hasVideo: false,
        itag,
        videoId: opts.videoId,
        score,
      };
      const prevA = opts.getBestAudio();
      if (!prevA || score > prevA.score) opts.setBestAudio(row);
    } catch {
      /* skip */
    }
  }
}

/**
 * List YouTube download options. Prefer iOS/ANDROID plain CDN URLs,
 * then MWEB decipher. Pass `cookie` when the host IP hits LOGIN_REQUIRED.
 */
export async function listYoutubeFormats(
  videoId: string,
  options?: { cookie?: string },
): Promise<{
  title: string;
  thumbnail: string;
  items: YoutubeFormatHit[];
}> {
  installEvalShim();

  const videoByHeight = new Map<string, Row>();
  let bestAudio: Row | null = null;
  let title = `YouTube ${videoId}`;
  let thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const cookie =
    options?.cookie?.trim() || process.env.YOUTUBE_COOKIES?.trim() || undefined;

  const clients: Array<{
    client: (typeof ClientType)[keyof typeof ClientType];
    source: string;
    decipher: boolean;
  }> = [
    { client: ClientType.IOS, source: "youtube-ios", decipher: false },
    { client: ClientType.ANDROID, source: "youtube-android", decipher: false },
    { client: ClientType.MWEB, source: "youtube-mweb", decipher: true },
    {
      client: ClientType.ANDROID_VR,
      source: "youtube-android-vr",
      decipher: false,
    },
  ];

  for (const { client, source, decipher } of clients) {
    try {
      const yt = await createTube(client, cookie);
      const info = await yt.getBasicInfo(videoId);
      if (info.basic_info?.title) title = info.basic_info.title;
      const thumb = info.basic_info?.thumbnail?.slice(-1)?.[0]?.url;
      if (thumb) thumbnail = thumb;

      const status = info.playability_status?.status;
      if (status && status !== "OK") continue;

      const raw = [
        ...(info.streaming_data?.formats || []),
        ...(info.streaming_data?.adaptive_formats || []),
      ] as TubeFormat[];

      await ingestFormats(raw, {
        videoId,
        thumbnail,
        source,
        videoByHeight,
        getBestAudio: () => bestAudio,
        setBestAudio: (r) => {
          bestAudio = r;
        },
        decipherUrl: decipher
          ? async (f) => {
              if (!yt.session.player) return undefined;
              const cipher = f.signature_cipher || f.cipher;
              if (!cipher) return undefined;
              return yt.session.player.decipher(cipher);
            }
          : undefined,
      });

      // ANDROID progressive is enough to show something useful
      if (
        source === "youtube-android" &&
        [...videoByHeight.values()].some((v) => v.hasAudio)
      ) {
        // still try MWEB for more qualities, but we already have audio video
      }
    } catch {
      /* try next client */
    }
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

  // If we only have video-only + audio (common on iOS), keep both so user can download sound
  const hasMuxed = videos.some((v) => v.hasAudio);
  if (!hasMuxed && bestAudio) {
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i]!;
      if (!v.hasAudio) {
        videos[i] = {
          ...v,
          title: `${v.container} ${v.quality} · فيديو (حمّل الصوت منفصلاً)`,
        };
      }
    }
  }

  const items: YoutubeFormatHit[] = [...videos];
  if (bestAudio) {
    const { score: _s, ...rest } = bestAudio as Row;
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
  cookie?: string;
}): Promise<{
  url: string;
  filename: string;
  contentType: string;
  size?: number | null;
}> {
  const listed = await listYoutubeFormats(opts.videoId, {
    cookie: opts.cookie,
  });
  let hit = listed.items.find(
    (i) =>
      opts.itag
        ? i.itag === opts.itag
        : opts.kind === "audio"
          ? i.type === "audio"
          : i.type === "video" &&
            (opts.quality
              ? i.quality === opts.quality.replace(/p$/i, "")
              : i.hasAudio),
  );
  if (!hit || hit.type === "image") {
    hit = listed.items.find((i) => i.type === "video" && i.hasAudio);
  }
  if (!hit?.url) {
    throw new Error("تعذّر إيجاد رابط التنزيل");
  }

  const ext =
    hit.type === "audio"
      ? "m4a"
      : hit.container === "WEBM"
        ? "webm"
        : "mp4";
  return {
    url: hit.url,
    filename: `youtube-${opts.videoId}-${hit.quality || "media"}.${ext}`,
    contentType:
      hit.type === "audio"
        ? "audio/mp4"
        : ext === "webm"
          ? "video/webm"
          : "video/mp4",
    size: hit.size ?? null,
  };
}
