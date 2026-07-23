import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_DOWNLOAD = 16 * 1024 * 1024;
const CHUNK = 64 * 1024;

/**
 * توليد تدفق غير قابل للضغط لقياس تنزيل حقيقي
 * (بيانات عشوائية + منع gzip على الاستجابة)
 */
function randomChunk(): Uint8Array {
  const buf = new Uint8Array(CHUNK);
  crypto.getRandomValues(buf);
  return buf;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.has("ping")) {
    return new NextResponse(JSON.stringify({ ok: true, t: Date.now() }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  }

  const bytes = Math.min(
    MAX_DOWNLOAD,
    Math.max(256 * 1024, Number(searchParams.get("bytes") || 4 * 1024 * 1024)),
  );

  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= bytes) {
        controller.close();
        return;
      }
      const n = Math.min(CHUNK, bytes - sent);
      const chunk = randomChunk();
      controller.enqueue(n === CHUNK ? chunk : chunk.subarray(0, n));
      sent += n;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bytes),
      "Content-Encoding": "identity",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(req: NextRequest) {
  // قراءة كاملة للجسم حتى يُحسب الرفع من طرف العميل بشكل صحيح
  const buf = await req.arrayBuffer();
  return NextResponse.json(
    { ok: true, received: buf.byteLength, t: Date.now() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    },
  );
}
