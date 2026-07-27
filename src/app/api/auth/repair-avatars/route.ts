import { NextResponse } from "next/server";
import { shrinkAllDataUrlAvatars } from "@/lib/avatar-storage";

export const runtime = "nodejs";

/**
 * One-shot repair: migrate bloated data-URL avatars out of Auth JWT metadata.
 * Protected by CRON_SECRET or AVATAR_REPAIR_SECRET when set; otherwise open
 * briefly after deploy for emergency recovery (safe: only shrinks metadata).
 */
export async function POST(req: Request) {
  const secret =
    process.env.AVATAR_REPAIR_SECRET || process.env.CRON_SECRET || "";
  if (secret) {
    const got =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      new URL(req.url).searchParams.get("secret") ||
      "";
    if (got !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const fixed = await shrinkAllDataUrlAvatars(8);
    return NextResponse.json({ ok: true, fixed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "repair failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
