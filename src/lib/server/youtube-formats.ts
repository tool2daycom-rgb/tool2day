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

async function createTube(client: (typeof ClientType)[keyof typeof ClientType]) {
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

function downloadApiUrl(
  videoId: string,
  opts: { itag?: number; quality?: string; kind: "video" | "audio" },
): string {
  const q = new URLSearchParams({ v: videoId, kind: opts.kind });
  if (opts.itag) q.set("itag", String(opts.itag));
  if (opts.quality) q.set("quality", opts.quality);
  return `/api/youtube-download?${q.toString()}`;
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
  audio_quality?: string;
};

/**
 * List YouTube download options. Download URLs point to our streaming API
 * (raw googlevideo links expire / 403 from the browser).
 */
export async function listYoutubeFormats(videoId: string): Promise<{
  title: string;
  thumbnail: string;
  items: YoutubeFormatHit[];
}> {
  // ANDROID: reliable progressive MP4 (with audio)
  // MWEB: full quality ladder (video-only + audio) via decipher metadata
  const [androidTube, mwebTube] = await Promise.all([
    createTube(ClientType.ANDROID),
    createTube(ClientType.MWEB),
  ]);

  const [androidInfo, mwebInfo] = await Promise.all([
    androidTube.getBasicInfo(videoId),
    mwebTube.getBasicInfo(videoId),
  ]);

  const title =
    mwebInfo.basic_info?.title ||
    androidInfo.basic_info?.title ||
    `YouTube ${videoId}`;
  const thumbnail =
    mwebInfo.basic_info?.thumbnail?.slice(-1)?.[0]?.url ||
    androidInfo.basic_info?.thumbnail?.slice(-1)?.[0]?.url ||
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  const raw: TubeFormat[] = [
    ...((androidInfo.streaming_data?.formats || []) as TubeFormat[]),
    ...((mwebInfo.streaming_data?.formats || []) as TubeFormat[]),
    ...((mwebInfo.streaming_data?.adaptive_formats || []) as TubeFormat[]),
  ];

  type Row = YoutubeFormatHit & { score: number };
  const videoByHeight = new Map<string, Row>();
  let bestAudio: Row | null = null;

  for (const f of raw) {
    const hasVideo = Boolean(f.has_video);
    const hasAudio = Boolean(f.has_audio);
    if (!hasVideo && !hasAudio) continue;
    if (!f.itag && !f.url && !f.signature_cipher && !f.cipher) continue;

    const container = containerOf(f.mime_type);
    const size = f.content_length ? Number(f.content_length) : null;
    const itag = f.itag;

    if (hasVideo) {
      const quality = heightOf(f);
      // Prefer progressive (A+V), then MP4, then larger
      const score =
        (hasAudio ? 100_000 : 0) +
        (container === "MP4" ? 10_000 : 0) +
        (f.url ? 1_000 : 0) +
        Math.min(size || 0, 1e12) / 1e9;
      const kind = "video" as const;
      const row: Row = {
        url: downloadApiUrl(videoId, {
          itag,
          quality,
          kind,
        }),
        type: "video",
        title: `${container} ${quality}`,
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

    const score =
      (container === "M4A" || container === "MP4" ? 1e15 : 0) + (size || 0);
    const row: Row = {
      url: downloadApiUrl(videoId, { itag, kind: "audio" }),
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
  }

  // Guarantee at least one progressive-with-audio row via ANDROID if missing
  if (![...videoByHeight.values()].some((r) => r.hasAudio)) {
    const progressive = (
      (androidInfo.streaming_data?.formats || []) as TubeFormat[]
    ).find((f) => f.has_video && f.has_audio && f.itag);
    if (progressive?.itag) {
      const quality = heightOf(progressive);
      const container = containerOf(progressive.mime_type);
      videoByHeight.set(quality, {
        url: downloadApiUrl(videoId, {
          itag: progressive.itag,
          quality,
          kind: "video",
        }),
        type: "video",
        title: `${container} ${quality}`,
        thumbnail,
        source: "youtube-android",
        quality,
        container,
        size: progressive.content_length
          ? Number(progressive.content_length)
          : null,
        hasAudio: true,
        hasVideo: true,
        itag: progressive.itag,
        score: 999_999,
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

  // Always one maxres image
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

export async function streamYoutubeDownload(opts: {
  videoId: string;
  itag?: number;
  quality?: string;
  kind: "video" | "audio";
}): Promise<{
  stream: ReadableStream<Uint8Array>;
  filename: string;
  contentType: string;
}> {
  installEvalShim();

  const quality =
    opts.quality && /^\d+$/.test(opts.quality)
      ? (`${opts.quality}p` as `${number}p`)
      : opts.quality === "audio"
        ? "best"
        : ((opts.quality as `${number}p` | "best" | undefined) ?? "best");

  // Prefer ANDROID for progressive (itag 18 etc.) — more reliable URLs
  const clients =
    opts.kind === "audio"
      ? [ClientType.MWEB, ClientType.ANDROID]
      : [ClientType.ANDROID, ClientType.MWEB];

  let lastError: Error | null = null;

  for (const client of clients) {
    try {
      const yt = await createTube(client);
      const info = await yt.getBasicInfo(opts.videoId);

      if (opts.itag) {
        const all = [
          ...(info.streaming_data?.formats || []),
          ...(info.streaming_data?.adaptive_formats || []),
        ] as TubeFormat[];
        const format = all.find((f) => f.itag === opts.itag);
        if (format) {
          let url = format.url;
          if (!url && yt.session.player) {
            const cipher = format.signature_cipher || format.cipher;
            if (cipher) url = await yt.session.player.decipher(cipher);
          }
          if (url) {
            const ua =
              client === ClientType.ANDROID
                ? "com.google.android.youtube/19.28.35 (Linux; U; Android 14) gzip"
                : "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
            const res = await fetch(url, {
              headers: {
                "User-Agent": ua,
                Referer: "https://www.youtube.com/",
                Accept: "*/*",
              },
            });
            if (res.ok && res.body) {
              const mime = format.mime_type?.split(";")[0] || "video/mp4";
              const ext = mime.includes("webm")
                ? "webm"
                : mime.includes("audio")
                  ? "m4a"
                  : "mp4";
              const qLabel = heightOf(format);
              return {
                stream: res.body as ReadableStream<Uint8Array>,
                filename: `youtube-${opts.videoId}-${qLabel}.${ext}`,
                contentType: mime,
              };
            }
          }
        }
      }

      const type =
        opts.kind === "audio"
          ? "audio"
          : opts.itag
            ? "video"
            : "video+audio";

      const stream = await yt.download(opts.videoId, {
        type: type as "video" | "audio" | "video+audio",
        quality: quality === "best" ? "best" : quality,
        format: "mp4",
      });

      const filename =
        opts.kind === "audio"
          ? `youtube-${opts.videoId}-audio.m4a`
          : `youtube-${opts.videoId}-${opts.quality || "video"}.mp4`;

      return {
        stream: stream as ReadableStream<Uint8Array>,
        filename,
        contentType: opts.kind === "audio" ? "audio/mp4" : "video/mp4",
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError || new Error("فشل تنزيل الفيديو من يوتيوب");
}
