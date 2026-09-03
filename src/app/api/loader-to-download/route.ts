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
    const format = (body.format || "").trim() || "720";

    if (!pageUrl) {
      return NextResponse.json({ error: "الصق رابطاً أولاً" }, { status: 400 });
    }

    const hit = await extractOneWithLoaderTo(pageUrl, format, {
      maxMs: 15_000,
    });

    if (!hit?.url) {
      return NextResponse.json(
        { error: "تعذّر تجهيز رابط تنزيل مباشر" },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, url: hit.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل تجهيز رابط loader.to";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

