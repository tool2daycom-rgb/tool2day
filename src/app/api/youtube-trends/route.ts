import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type YtItem = {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail: string | null;
  url: string;
  order: "relevance" | "viewCount" | "date";
};

function getApiKey(): string | null {
  return (
    process.env.YOUTUBE_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_YOUTUBE_API_KEY ||
    null
  );
}

async function youtubeSearch(
  key: string,
  q: string,
  order: "relevance" | "viewCount" | "date",
  maxResults: number,
): Promise<YtItem[]> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q,
    maxResults: String(maxResults),
    order,
    relevanceLanguage: "ar",
    regionCode: "SA",
    key,
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(
      res.status === 403
        ? "مفتاح YouTube مرفوض أو تجاوز الحصة اليومية"
        : `YouTube API ${res.status}: ${err.slice(0, 120)}`,
    );
  }
  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  return (data.items || [])
    .map((item) => {
      const id = item.id?.videoId;
      if (!id) return null;
      const sn = item.snippet;
      return {
        id,
        title: (sn?.title || "").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        channel: sn?.channelTitle || "",
        publishedAt: sn?.publishedAt || "",
        thumbnail:
          sn?.thumbnails?.medium?.url || sn?.thumbnails?.default?.url || null,
        url: `https://www.youtube.com/watch?v=${id}`,
        order,
      } satisfies YtItem;
    })
    .filter((x): x is YtItem => Boolean(x));
}

export async function GET() {
  const configured = Boolean(getApiKey());
  return NextResponse.json({
    configured,
    hint: configured
      ? "YouTube Data API جاهز"
      : "أضف YOUTUBE_API_KEY في بيئة Vercel / .env.local",
  });
}

export async function POST(req: Request) {
  try {
    const key = getApiKey();
    if (!key) {
      return NextResponse.json(
        {
          configured: false,
          videos: [],
          error:
            "لم يُضبط YOUTUBE_API_KEY بعد — أضفه من Google Cloud (YouTube Data API v3)",
        },
        { status: 200 },
      );
    }

    const body = (await req.json()) as { q?: string };
    const q = (body.q || "").trim().slice(0, 80);
    if (!q) {
      return NextResponse.json({ error: "أدخل كلمة مفتاحية" }, { status: 400 });
    }

    // بحثان فقط لتوفير الحصة: صلة + الأكثر مشاهدة
    const [relevant, popular] = await Promise.all([
      youtubeSearch(key, q, "relevance", 12),
      youtubeSearch(key, q, "viewCount", 10),
    ]);

    const seen = new Set<string>();
    const videos: YtItem[] = [];
    for (const v of [...popular, ...relevant]) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      videos.push(v);
    }

    return NextResponse.json({
      configured: true,
      q,
      videos,
      titles: videos.map((v) => v.title),
    });
  } catch (e) {
    return NextResponse.json(
      {
        configured: true,
        videos: [],
        error: e instanceof Error ? e.message : "فشل YouTube API",
      },
      { status: 200 },
    );
  }
}
