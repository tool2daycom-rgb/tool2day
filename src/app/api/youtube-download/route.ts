import dns from "node:dns";
import { NextResponse } from "next/server";
import { resolveYoutubeStreamUrl } from "@/lib/server/youtube-formats";

dns.setDefaultResultOrder("ipv4first");

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Returns a fresh direct googlevideo URL as JSON (Vercel cannot proxy googlevideo
 * reliably). The browser opens/downloads the URL from the user's network.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = (searchParams.get("v") || "").trim();
    const itagRaw = searchParams.get("itag");
    const quality = (searchParams.get("quality") || "").trim() || undefined;
    const kindParam = (searchParams.get("kind") || "video").trim();
    const kind = kindParam === "audio" ? "audio" : "video";
    const redirect = searchParams.get("redirect") === "1";

    if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
      return NextResponse.json({ error: "معرّف يوتيوب غير صالح" }, { status: 400 });
    }

    const itag = itagRaw ? Number.parseInt(itagRaw, 10) : undefined;
    if (itagRaw && !Number.isFinite(itag)) {
      return NextResponse.json({ error: "itag غير صالح" }, { status: 400 });
    }

    const resolved = await resolveYoutubeStreamUrl({
      videoId,
      itag,
      quality,
      kind,
    });

    if (redirect) {
      return NextResponse.redirect(resolved.url, 302);
    }

    return NextResponse.json({
      ok: true,
      url: resolved.url,
      filename: resolved.filename,
      contentType: resolved.contentType,
      size: resolved.size,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل تنزيل يوتيوب";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
