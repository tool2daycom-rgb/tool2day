import { NextResponse } from "next/server";
import { streamYoutubeDownload } from "@/lib/server/youtube-formats";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = (searchParams.get("v") || "").trim();
    const itagRaw = searchParams.get("itag");
    const quality = (searchParams.get("quality") || "").trim() || undefined;
    const kindParam = (searchParams.get("kind") || "video").trim();
    const kind = kindParam === "audio" ? "audio" : "video";

    if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
      return NextResponse.json({ error: "معرّف يوتيوب غير صالح" }, { status: 400 });
    }

    const itag = itagRaw ? Number.parseInt(itagRaw, 10) : undefined;
    if (itagRaw && !Number.isFinite(itag)) {
      return NextResponse.json({ error: "itag غير صالح" }, { status: 400 });
    }

    const { stream, filename, contentType } = await streamYoutubeDownload({
      videoId,
      itag,
      quality,
      kind,
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل تنزيل يوتيوب";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
