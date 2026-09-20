import { NextResponse } from "next/server";

/** Media proxy for downloaders removed for AdSense policy compliance. */
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been permanently removed." },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been permanently removed." },
    { status: 410 },
  );
}
