import { NextResponse } from "next/server";
import { extractOneWithLoaderTo } from "@/lib/server/loader-to";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      url?: string;
      format?: string;
    };

    const pageUrl = (body.url || "").trim();
    const requestedFormat = (body.format || "").trim() || "720";

    if (!pageUrl) {
      return NextResponse.json({ error: "الصق رابطاً أولاً" }, { status: 400 });
    }

    const candidateFormats =
      requestedFormat === "mp3"
        ? ["mp3"]
        : [requestedFormat, "720", "360", "mp4", "1080"];

    for (const format of candidateFormats) {
      const hit = await extractOneWithLoaderTo(pageUrl, format, {
        maxMs: 12_000,
        fetchTimeoutMs: 8_000,
      });
      if (hit?.url) {
        return NextResponse.json({ ok: true, url: hit.url });
      }
    }

    return NextResponse.json(
      { error: "تعذّر تجهيز رابط تنزيل مباشر (جرّب “ابدأ” مرة أخرى)" },
      { status: 400 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل تجهيز رابط loader.to";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

