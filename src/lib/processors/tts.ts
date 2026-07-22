import { downloadBlob } from "./ffmpeg-client";

/** أصوات عربية عصبية — الذكور العميقون أولاً ثم الأقرب للحقيقة */
export const TTS_VOICE_OPTIONS = [
  {
    id: "ar-SA-HamedNeural",
    label: "⭐ حامد — ذكر عميق وهادئ (فصحى / السعودية)",
    hint: "الأقرب لـ Marcus / Adam",
  },
  {
    id: "ar-EG-ShakirNeural",
    label: "⭐ شاكر — ذكر رزين (مصر)",
    hint: "عميق وواضح",
  },
  {
    id: "ar-LB-RamiNeural",
    label: "رامي — ذكر هادئ (لبنان)",
    hint: "رزين",
  },
  {
    id: "ar-IQ-BasselNeural",
    label: "باسل — ذكر عميق (العراق)",
    hint: "صوت ثقيل",
  },
  {
    id: "ar-AE-HamdanNeural",
    label: "حمدان — ذكر (الإمارات)",
    hint: "خليجي هادئ",
  },
  {
    id: "ar-SY-LaithNeural",
    label: "ليث — ذكر (سوريا)",
    hint: "شامي",
  },
  {
    id: "ar-JO-TaimNeural",
    label: "تيم — ذكر (الأردن)",
    hint: "شامي",
  },
  {
    id: "ar-KW-FahedNeural",
    label: "فهد — ذكر (الكويت)",
    hint: "خليجي",
  },
  {
    id: "ar-SA-ZariyahNeural",
    label: "زارية — أنثى (فصحى / السعودية)",
    hint: "الأقرب للحقيقة",
  },
  {
    id: "ar-EG-SalmaNeural",
    label: "سلمى — أنثى (مصر)",
    hint: "طبيعي جداً",
  },
  {
    id: "ar-LB-LaylaNeural",
    label: "ليلى — أنثى (لبنان)",
    hint: "واضح وناعم",
  },
  {
    id: "ar-AE-FatimaNeural",
    label: "فاطمة — أنثى (الإمارات)",
    hint: "خليجي",
  },
  {
    id: "ar-SY-AmanyNeural",
    label: "أماني — أنثى (سوريا)",
    hint: "شامي",
  },
  {
    id: "ar-JO-SanaNeural",
    label: "سناء — أنثى (الأردن)",
    hint: "شامي",
  },
  {
    id: "ar-IQ-RanaNeural",
    label: "رنا — أنثى (العراق)",
    hint: "عراقي",
  },
  {
    id: "ar-KW-NouraNeural",
    label: "نورة — أنثى (الكويت)",
    hint: "خليجي",
  },
] as const;

export type TtsVoiceId = (typeof TTS_VOICE_OPTIONS)[number]["id"];

export const TTS_RATE_OPTIONS = [
  { id: "solemn", label: "رزين ومهيب (موصى به)" },
  { id: "slow", label: "أبطأ قليلاً" },
  { id: "default", label: "طبيعي" },
  { id: "fast", label: "أسرع قليلاً" },
] as const;

export const DEFAULT_TTS_VOICE = "ar-SA-HamedNeural";
export const DEFAULT_TTS_RATE = "solemn";

export async function speakText(
  text: string,
  opts?: { lang?: string; rate?: number; pitch?: number },
) {
  const value = text.trim();
  if (!value) throw new Error("اكتب نصاً للتحويل");
  if (!("speechSynthesis" in window)) {
    throw new Error("المتصفح لا يدعم التحويل إلى كلام");
  }

  const lang = opts?.lang || "ar-SA";
  const rate = Math.min(2, Math.max(0.5, opts?.rate ?? 0.85));
  const pitch = Math.min(2, Math.max(0, opts?.pitch ?? 0.9));

  await new Promise<void>((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(value);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("فشل تشغيل الصوت"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
}

export type SynthesizeOpts = {
  voice?: string;
  lang?: string;
  rate?: string;
  pitch?: string;
};

/** توليد ملف MP3 عصبي وتنزيله */
export async function synthesizeAndDownload(
  text: string,
  opts?: SynthesizeOpts,
): Promise<File> {
  const file = await synthesizeToFile(text, opts);
  await downloadBlob(file, file.name);
  return file;
}

/** Generate an audio File (mp3) via server neural TTS. */
export async function synthesizeToFile(
  text: string,
  opts?: SynthesizeOpts,
): Promise<File> {
  const value = text.trim();
  if (!value) throw new Error("اكتب نصاً للتحويل");

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: value,
      voice: opts?.voice || DEFAULT_TTS_VOICE,
      lang: opts?.lang || "ar",
      rate: opts?.rate || DEFAULT_TTS_RATE,
      pitch: opts?.pitch || "deep",
    }),
  });

  if (!res.ok) {
    let msg = "فشل توليد الملف الصوتي";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  if (blob.size < 100) throw new Error("ملف الصوت فارغ");
  const voiceSlug = (opts?.voice || "tts").split("-").slice(-1)[0] || "tts";
  return new File([blob], `tool2day-${voiceSlug}-${Date.now()}.mp3`, {
    type: "audio/mpeg",
  });
}

export function listSpeechVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}
