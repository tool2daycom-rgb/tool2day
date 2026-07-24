import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.") || ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  return false;
}

async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("رابط غير صالح");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("الرابط يجب أن يكون http أو https");
  }
  const { lookup } = await import("node:dns/promises");
  const { isIP } = await import("node:net");
  const host = u.hostname;
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("عنوان غير مسموح");
  } else {
    const addrs = await lookup(host, { all: true });
    for (const a of addrs) {
      if (isPrivateIp(a.address)) throw new Error("عنوان غير مسموح");
    }
  }
  return u;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const raw = (body.url || "").trim();
    if (!raw) {
      return NextResponse.json({ error: "أدخل الرابط" }, { status: 400 });
    }

    const u = await assertSafeUrl(raw.startsWith("http") ? raw : `https://${raw}`);
    const href = u.toString();

    // YouTube يُعالَج في المتصفح — هنا انستغرام/عام عبر oEmbed
    const candidates = [
      `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(href)}`,
      `https://api.instagram.com/oembed?url=${encodeURIComponent(href)}`,
      `https://noembed.com/embed?url=${encodeURIComponent(href)}`,
    ];

    let thumbnail: string | null = null;
    let title: string | null = null;
    let provider: string | null = null;

    for (const endpoint of candidates) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; Tool2Day/1.0; +https://www.tool2day.com)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as {
          thumbnail_url?: string;
          title?: string;
          provider_name?: string;
        };
        if (data.thumbnail_url) {
          thumbnail = data.thumbnail_url;
          title = data.title || null;
          provider = data.provider_name || null;
          break;
        }
      } catch {
        /* جرّب التالي */
      }
    }

    if (!thumbnail) {
      return NextResponse.json(
        {
          error:
            "تعذّر استخراج الصورة المصغّرة. لليوتيوب الصق الرابط مباشرة، ولانستغرام تأكد أن المنشور عام أو جرّب رابط الصورة المباشر.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      thumbnail,
      title,
      provider,
      source: href,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الطلب" },
      { status: 400 },
    );
  }
}
