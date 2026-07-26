import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** هل تتوفر مفاتيح التفريغ/التصحيح عالية الدقة؟ */
export async function GET() {
  const groq = Boolean(process.env.GROQ_API_KEY);
  const openai = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({
    highAccuracy: groq || openai,
    providers: {
      groq,
      openai,
      whisperModel: groq
        ? "whisper-large-v3"
        : openai
          ? "whisper-1"
          : null,
      proofread: groq || openai,
    },
  });
}
