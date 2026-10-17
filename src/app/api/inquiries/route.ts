import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/db/client";
import {
  contactInquirySchema,
  createInquiry,
  projectInquirySchema,
} from "@/lib/inquiries";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function tooFast(formStartedAt?: number) {
  if (!formStartedAt) return false;
  return Date.now() - formStartedAt < 2500;
}

export async function POST(request: Request) {
  try {
    if (!hasDatabaseUrl()) {
      return NextResponse.json(
        {
          ok: false,
          error: "service_unavailable",
          message: "Inquiry storage is not configured yet.",
        },
        { status: 503 },
      );
    }

    const ip = clientIp(request);
    const limited = rateLimit(`inquiry:${ip}`, 10, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          message: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = await request.json();
    const type = body?.type;

    if (type === "contact") {
      const parsed = contactInquirySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: "invalid_input", message: "Please check your entries." },
          { status: 400 },
        );
      }
      if (parsed.data.website.trim()) {
        return NextResponse.json({ ok: true, id: "ignored" });
      }
      if (tooFast(parsed.data.formStartedAt)) {
        return NextResponse.json(
          { ok: false, error: "too_fast", message: "Please wait a moment and try again." },
          { status: 400 },
        );
      }
      const result = await createInquiry(parsed.data);
      return NextResponse.json({ ok: true, id: result.id });
    }

    if (type === "project") {
      const parsed = projectInquirySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: "invalid_input", message: "Please check your entries." },
          { status: 400 },
        );
      }
      if (parsed.data.website.trim()) {
        return NextResponse.json({ ok: true, id: "ignored" });
      }
      if (tooFast(parsed.data.formStartedAt)) {
        return NextResponse.json(
          { ok: false, error: "too_fast", message: "Please wait a moment and try again." },
          { status: 400 },
        );
      }
      if (!parsed.data.projectTypes.length) {
        return NextResponse.json(
          { ok: false, error: "invalid_input", message: "Please choose a project type." },
          { status: 400 },
        );
      }
      const result = await createInquiry(parsed.data);
      return NextResponse.json({ ok: true, id: result.id });
    }

    return NextResponse.json(
      { ok: false, error: "invalid_type", message: "Unknown inquiry type." },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        message: "Could not save your inquiry. Please try again later.",
      },
      { status: 500 },
    );
  }
}
