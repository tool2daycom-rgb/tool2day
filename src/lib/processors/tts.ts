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
  const rate = Math.min(2, Math.max(0.5, opts?.rate ?? 1));
  const pitch = Math.min(2, Math.max(0, opts?.pitch ?? 1));

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

/** Generate an audio File (mp3) for merging into video via server TTS proxy. */
export async function synthesizeToFile(
  text: string,
  opts?: { lang?: string },
): Promise<File> {
  const value = text.trim();
  if (!value) throw new Error("اكتب نصاً للتحويل");

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: value,
      lang: opts?.lang || "ar",
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
  return new File([blob], `tts-${Date.now()}.mp3`, { type: "audio/mpeg" });
}

export function listSpeechVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}
