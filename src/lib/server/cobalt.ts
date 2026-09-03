import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

export type CobaltHit = {
  url: string;
  type: "video" | "audio" | "image";
  title: string;
  thumbnail?: string;
  source: string;
  quality?: string;
  container?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  size?: number | null;
};

type CobaltResponse = {
  status?: string;
  url?: string;
  filename?: string;
  picker?: Array<{ type?: string; url?: string; thumb?: string }>;
  audio?: string;
  audioFilename?: string;
  error?: { code?: string };
};

const DEFAULT_INSTANCES = [
  process.env.COBALT_API_URL,
  "https://cobaltapi.cjs.nz",
].filter(Boolean) as string[];

function authHeaders(): Record<string, string> {
  const key = process.env.COBALT_API_KEY?.trim();
  if (!key) return {};
  if (key.startsWith("Bearer ") || key.startsWith("Api-Key ")) {
    return { Authorization: key };
  }
  return { Authorization: `Api-Key ${key}` };
}

async function cobaltPost(
  apiBase: string,
  body: Record<string, unknown>,
): Promise<CobaltResponse> {
  const base = apiBase.replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22_000);
  try {
    const res = await fetch(`${base}/`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    });
    return (await res.json()) as CobaltResponse;
  } finally {
    clearTimeout(timer);
  }
}

function guessContainer(filename?: string, url?: string): string {
  const s = `${filename || ""} ${url || ""}`.toLowerCase();
  if (s.includes(".webm")) return "WEBM";
  if (s.includes(".m4a") || s.includes("audio")) return "M4A";
  if (s.includes(".mp3")) return "MP3";
  if (s.includes(".jpg") || s.includes(".jpeg")) return "JPG";
  if (s.includes(".png")) return "PNG";
  if (s.includes(".webp")) return "WEBP";
  return "MP4";
}

function qualityFromFilename(filename?: string): string | undefined {
  const m = filename?.match(/(\d{3,4})p/i);
  return m?.[1];
}

/**
 * Resolve media via Cobalt instances (video+audio mux when possible).
 */
export async function extractWithCobalt(
  pageUrl: string,
  opts?: {
    videoQuality?: string;
    downloadMode?: "auto" | "audio" | "mute";
  },
): Promise<{ title?: string; items: CobaltHit[]; instance?: string } | null> {
  const instances = [
    ...DEFAULT_INSTANCES,
    ...(process.env.COBALT_API_FALLBACKS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ];
  const unique = [...new Set(instances)];

  let lastError = "";
  for (const api of unique) {
    try {
      const data = await cobaltPost(api, {
        url: pageUrl,
        downloadMode: opts?.downloadMode || "auto",
        videoQuality: opts?.videoQuality || "1080",
        youtubeVideoCodec: "h264",
        filenameStyle: "basic",
        alwaysProxy: false,
      });

      if (data.status === "error") {
        lastError = data.error?.code || "error";
        // auth/turnstile — try next instance
        if (/auth|jwt|turnstile/i.test(lastError)) continue;
        // hard fail for this URL on this instance
        continue;
      }

      const items: CobaltHit[] = [];
      const filename = data.filename;
      const title = filename?.replace(/\.[a-z0-9]+$/i, "") || undefined;

      if (
        (data.status === "tunnel" || data.status === "redirect") &&
        data.url
      ) {
        const isAudio = opts?.downloadMode === "audio";
        const quality = qualityFromFilename(filename) || opts?.videoQuality;
        items.push({
          url: data.url,
          type: isAudio ? "audio" : "video",
          title: isAudio
            ? `${guessContainer(filename, data.url)} صوت`
            : `${guessContainer(filename, data.url)}${quality ? ` ${quality}` : ""} · مع صوت`,
          source: `cobalt:${new URL(api).hostname}`,
          quality,
          container: guessContainer(filename, data.url),
          hasAudio: true,
          hasVideo: !isAudio,
          size: null,
        });
      }

      if (data.status === "picker" && Array.isArray(data.picker)) {
        for (const p of data.picker) {
          if (!p.url) continue;
          const type =
            p.type === "photo" || p.type === "gif" ? "image" : "video";
          items.push({
            url: p.url,
            type,
            title:
              type === "image"
                ? "صورة — أقصى جودة (maxres)"
                : "فيديو · مع صوت",
            thumbnail: p.thumb,
            source: `cobalt-picker:${new URL(api).hostname}`,
            hasAudio: type === "video",
            hasVideo: type === "video",
            container: type === "image" ? "JPG" : "MP4",
          });
        }
        if (data.audio) {
          items.push({
            url: data.audio,
            type: "audio",
            title: data.audioFilename || "صوت",
            source: `cobalt-audio:${new URL(api).hostname}`,
            hasAudio: true,
            hasVideo: false,
            container: "M4A",
          });
        }
      }

      if (items.length) {
        return { title, items, instance: api };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "fail";
    }
  }

  if (lastError) {
    return null;
  }
  return null;
}

/** Build YouTube with-audio quality rows via Cobalt tunnels. */
export async function youtubeWithAudioViaCobalt(
  pageUrl: string,
  qualities: string[] = ["1080", "720", "480", "360"],
): Promise<CobaltHit[]> {
  const out: CobaltHit[] = [];
  // sequential to reduce rate-limit
  for (const q of qualities) {
    const got = await extractWithCobalt(pageUrl, {
      videoQuality: q,
      downloadMode: "auto",
    });
    if (!got?.items.length) continue;
    for (const item of got.items) {
      if (item.type !== "video") continue;
      // dedupe by quality
      if (out.some((x) => x.quality === (item.quality || q))) continue;
      out.push({
        ...item,
        quality: item.quality || q,
        title: `MP4 ${item.quality || q} · مع صوت`,
        hasAudio: true,
        hasVideo: true,
      });
    }
  }
  const audio = await extractWithCobalt(pageUrl, { downloadMode: "audio" });
  if (audio?.items[0]) {
    out.push({
      ...audio.items[0],
      type: "audio",
      title: "MP3 صوت",
      hasAudio: true,
      hasVideo: false,
      container: "MP3",
    });
  }
  return out;
}
