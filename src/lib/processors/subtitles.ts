import type { TranscriptCue } from "./transcribe";

export type SubtitleLang = "ar" | "en";

export type EditableCue = TranscriptCue & {
  id: string;
};

export function cuesToEditable(cues: TranscriptCue[]): EditableCue[] {
  return cues.map((c, i) => ({
    ...c,
    id: `c${i + 1}`,
  }));
}

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function pad3(n: number) {
  return String(Math.floor(n)).padStart(3, "0");
}

/** SRT: 00:00:01,000 */
export function formatSrtTime(sec: number) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const whole = Math.floor(r);
  const ms = Math.round((r - whole) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(whole)},${pad3(ms)}`;
}

/** VTT: 00:00:01.000 */
export function formatVttTime(sec: number) {
  return formatSrtTime(sec).replace(",", ".");
}

export function buildSrt(cues: TranscriptCue[]): string {
  return cues
    .map((c, i) => {
      const text = c.text.trim();
      return `${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${text}\n`;
    })
    .join("\n");
}

export function buildVtt(
  cues: TranscriptCue[],
  style?: { color?: string; fontSizePx?: number },
): string {
  const color = style?.color || "#FFFFFF";
  const fontSize = style?.fontSizePx || 28;
  const lines = [
    "WEBVTT",
    "",
    "STYLE",
    "::cue {",
    `  color: ${color};`,
    `  font-size: ${fontSize}px;`,
    "  background-color: rgba(0, 0, 0, 0.55);",
    "  font-family: system-ui, sans-serif;",
    "}",
    "",
  ];
  cues.forEach((c, i) => {
    lines.push(String(i + 1));
    lines.push(`${formatVttTime(c.start)} --> ${formatVttTime(c.end)}`);
    lines.push(c.text.trim());
    lines.push("");
  });
  return lines.join("\n");
}

export async function translateCues(
  cues: EditableCue[],
  from: SubtitleLang,
  to: SubtitleLang,
  onProgress?: (ratio: number) => void,
): Promise<EditableCue[]> {
  if (from === to) return cues.map((c) => ({ ...c }));
  const out: EditableCue[] = [];
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i]!;
    const translated = await translateText(c.text, from, to);
    out.push({ ...c, text: translated });
    onProgress?.((i + 1) / cues.length);
  }
  return out;
}

export async function translateText(
  text: string,
  from: SubtitleLang,
  to: SubtitleLang,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return trimmed;
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmed, from, to }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "فشل الترجمة");
  }
  return (data.text || trimmed).trim();
}

export function activeCueAt(cues: TranscriptCue[], time: number) {
  return cues.find((c) => time >= c.start && time < c.end) || null;
}

/**
 * تصحيح إملائي شائع لأخطاء Whisper في العربية (لهجات + أسماء دول).
 */
export function polishArabicText(input: string): string {
  let t = input;

  const replacements: Array<[RegExp, string]> = [
    // أسماء دول/مدن شائعة يخطئ فيها Whisper
    [/أكرانيا|إكرانيا|اكرانيا|أوكراينا|إوكراينا/gu, "أوكرانيا"],
    [/النمسة|النمسه|انمسا/gu, "النمسا"],
    [/أوربا(?![اوي])|اوروبا|أوروبه/gu, "أوروبا"],
    [/أمريكا|امريكا/gu, "أمريكا"],
    [/روسيا/gu, "روسيا"],
    [/تركي[اة]/gu, "تركيا"],
    [/بولونيا/gu, "بولندا"],
    [/المانيا|ألمانيا/gu, "ألمانيا"],
    [/سويسرا/gu, "سويسرا"],
    [/ايطاليا|إيطاليا/gu, "إيطاليا"],
    [/فرنسا/gu, "فرنسا"],
    [/بريطانيا/gu, "بريطانيا"],
    [/كندا/gu, "كندا"],
    [/الصين/gu, "الصين"],
    [/اليابان/gu, "اليابان"],
    // أدوات لهجة شامية يسمعها Whisper خطأ
    [/وعب\s+/gu, "وعم "],
    [/وعن?\s*عب\s+/gu, "وعن عم "],
    [/(^|\s)عب\s+/gu, "$1عم "],
    [/(^|\s)عَب\s+/gu, "$1عم "],
    [/نتنطل/gu, "ننتقل"],
    [/بتنطل/gu, "بنتقل"],
    [/تنطل/gu, "تنتقل"],
    [/عب\s*تهيس/gu, "عم نعيش"],
    [/عم\s*تهيس/gu, "عم نعيش"],
    [/(^|[^\u0600-\u06FF])تهيس(?=[^\u0600-\u06FF]|$)/gu, "$1نعيش"],
    [/يعني\s+عيش/gu, "يعني نعيش"],
    [/يعني\s+عيس/gu, "يعني نعيش"],
    [/بإكرانيا|باكرانيا|بإوكرانيا/gu, "بأوكرانيا"],
    [/في\s*أكرانيا|في\s*إكرانيا/gu, "في أوكرانيا"],
    // مسافات وعلامات
    [/\s{2,}/gu, " "],
    [/\s+([,.!?؟،])/gu, "$1"],
  ];

  for (const [re, to] of replacements) {
    t = t.replace(re, to);
  }

  return t.trim();
}

export function polishCueText(text: string, lang: SubtitleLang): string {
  if (lang === "ar") return polishArabicText(text);
  // إنجليزي: تصحيحات بسيطة لأخطاء Whisper الشائعة
  return text
    .replace(/\bi\b/g, "I")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function polishCues(
  cues: EditableCue[],
  lang: SubtitleLang,
): EditableCue[] {
  return cues.map((c) => ({
    ...c,
    text: polishCueText(c.text, lang),
  }));
}

/** تصحيح إضافي عبر الخادم إن وُجد مفتاح، وإلا يبقى التصحيح المحلي */
export async function proofreadCues(
  cues: EditableCue[],
  lang: SubtitleLang,
  onProgress?: (ratio: number) => void,
): Promise<EditableCue[]> {
  const local = polishCues(cues, lang);
  try {
    const res = await fetch("/api/proofread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang,
        cues: local.map((c) => ({ id: c.id, text: c.text })),
      }),
    });
    if (res.status === 501) {
      onProgress?.(1);
      return local;
    }
    const data = (await res.json().catch(() => ({}))) as {
      cues?: Array<{ id: string; text: string }>;
      error?: string;
    };
    if (!res.ok || !Array.isArray(data.cues)) {
      onProgress?.(1);
      return local;
    }
    const map = new Map(data.cues.map((c) => [c.id, c.text]));
    const out = local.map((c) => ({
      ...c,
      text: polishCueText(map.get(c.id) || c.text, lang),
    }));
    onProgress?.(1);
    return out;
  } catch {
    onProgress?.(1);
    return local;
  }
}
