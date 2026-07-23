import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (compatible; Tool2DayMediaBot/1.0; +https://www.tool2day.com)";
const MAX_BYTES = 80 * 1024 * 1024; // 80MB

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.") || ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
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
    throw new Error("يُسمح فقط بروابط http/https");
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    throw new Error("مضيف غير مسموح");
  }
  if (isIP(host) && isPrivateIp(host)) {
    throw new Error("عنوان خاص محظور");
  }
  if (!isIP(host)) {
    try {
      const records = await lookup(host, { all: true, family: 4 });
      if (records.some((r) => isPrivateIp(r.address))) {
        throw new Error("عنوان خاص محظور");
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("محظور")) throw e;
    }
  }
  return u;
}

function filenameFrom(url: URL, ctype: string): string {
  const last = url.pathname.split("/").filter(Boolean).pop() || "media";
  if (/\.[a-z0-9]{2,5}$/i.test(last)) return last.slice(0, 120);
  if (ctype.includes("mp4")) return "video.mp4";
  if (ctype.includes("webm")) return "video.webm";
  if (ctype.includes("mpeg") || ctype.includes("mp3")) return "audio.mp3";
  if (ctype.includes("jpeg")) return "image.jpg";
  if (ctype.includes("png")) return "image.png";
  if (ctype.includes("webp")) return "image.webp";
  if (ctype.includes("pdf")) return "file.pdf";
  return "download.bin";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("url") || "";
    const target = await assertSafeUrl(raw);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);
    let res: Response;
    try {
      res = await fetch(target.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": UA,
          Accept: "*/*",
          Referer: target.origin + "/",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok || !res.body) {
      return NextResponse.json(
        { error: `تعذّر التحميل (${res.status})` },
        { status: 502 },
      );
    }

    const len = Number(res.headers.get("content-length") || 0);
    if (len > MAX_BYTES) {
      return NextResponse.json(
        { error: "الملف أكبر من 80MB" },
        { status: 413 },
      );
    }

    const ctype = res.headers.get("content-type") || "application/octet-stream";
    const name = filenameFrom(target, ctype);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "الملف أكبر من 80MB" },
        { status: 413 },
      );
    }

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": ctype,
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل التحميل";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
