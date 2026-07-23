import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/** نقاط نهاية خفيفة لقياس زمن الاستجابة وسرعة التنزيل/الرفع */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.has("ping")) {
    return NextResponse.json(
      { ok: true, t: Date.now() },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  const bytes = Math.min(
    12 * 1024 * 1024,
    Math.max(64 * 1024, Number(searchParams.get("bytes") || 2 * 1024 * 1024)),
  );
  const chunk = new Uint8Array(64 * 1024);
  crypto.getRandomValues(chunk);
  const parts: Uint8Array[] = [];
  let left = bytes;
  while (left > 0) {
    const n = Math.min(left, chunk.length);
    parts.push(chunk.subarray(0, n));
    left -= n;
  }
  const body = Buffer.concat(parts.map((p) => Buffer.from(p)));
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(body.length),
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  const buf = await req.arrayBuffer();
  return NextResponse.json(
    { ok: true, received: buf.byteLength, t: Date.now() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
