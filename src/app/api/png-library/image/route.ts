import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_HOSTS = [
  "pixabay.com",
  "cdn.pixabay.com",
  "openverse.org",
  "wordpress.org",
  "flickr.com",
  "staticflickr.com",
  "wikimedia.org",
  "wikipedia.org",
  "supabase.co",
  "supabase.in",
];

function isAllowed(urlStr: string) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

/** بروكسي معاينة/تنزيل لتجاوز حظر الـ hotlink */
export async function GET(req: NextRequest) {
  const raw = String(req.nextUrl.searchParams.get("u") || "").trim();
  if (!raw || !isAllowed(raw)) {
    return NextResponse.json({ error: "رابط غير مسموح" }, { status: 400 });
  }

  try {
    const upstream = await fetch(raw, {
      headers: {
        "User-Agent": "Tool2DayPNGLibrary/1.0",
        Accept: "image/*,*/*",
        Referer: "https://pixabay.com/",
      },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `فشل جلب الصورة (${upstream.status})` },
        { status: 502 },
      );
    }
    const type = upstream.headers.get("content-type") || "image/png";
    if (!type.startsWith("image/") && !type.includes("octet-stream")) {
      return NextResponse.json({ error: "ليس ملف صورة" }, { status: 415 });
    }
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type.startsWith("image/") ? type : "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "فشل البروكسي" }, { status: 502 });
  }
}
