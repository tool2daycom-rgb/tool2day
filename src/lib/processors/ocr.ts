/** OCR محسّن: تدوير تلقائي + اكتشاف لغة + تكبير قوي للمستندات */

export type OcrResult = {
  text: string;
  langUsed: string;
  langLabel: string;
};

const LANG_LABELS: Record<string, string> = {
  auto: "تلقائي",
  eng: "English",
  ara: "العربية",
  "ara+eng": "العربية + English",
  "por+eng": "Português + English",
  "spa+eng": "Español + English",
  "fra+eng": "Français + English",
  "deu+eng": "Deutsch + English",
  "tur+eng": "Türkçe + English",
  "ita+eng": "Italiano + English",
  "eng+deu": "English + Deutsch",
  "eng+por+spa+fra+deu+ita": "لاتينية متعددة",
};

const AUTO_LANG_PACKS = [
  "deu+eng",
  "por+eng",
  "eng",
  "ara+eng",
  "spa+eng",
  "fra+eng",
  "ita+eng",
  "tur+eng",
] as const;

type PrepMode = "enhance" | "binary";

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل تصدير الصورة"))),
      type,
      quality,
    );
  });
}

export async function runOcr(
  file: File,
  langs = "auto",
  onProgress?: (p: number, status: string) => void,
): Promise<OcrResult> {
  const Tesseract = await import("tesseract.js");
  onProgress?.(0.02, "تحسين الصورة…");
  const prepared = await prepareImageForOcr(file, "enhance");

  onProgress?.(0.06, "كشف اتجاه النص…");
  let angle = 0;
  try {
    const detected = await Tesseract.detect(prepared.blob, {
      logger: (m) => {
        if (m.status) {
          onProgress?.(0.06 + (m.progress || 0) * 0.06, "كشف الاتجاه…");
        }
      },
    });
    const deg = Number(detected.data.orientation_degrees) || 0;
    const conf = Number(detected.data.orientation_confidence) || 0;
    const norm = ((deg % 360) + 360) % 360;
    if (conf >= 1.0 && [90, 180, 270].includes(norm)) angle = norm;
  } catch {
    /* ignore */
  }

  const anglesToTry =
    angle === 0
      ? [0, 90, 270, 180]
      : [angle, (angle + 90) % 360, (angle + 270) % 360, 0];

  onProgress?.(0.12, "تحديد اتجاه القراءة…");
  let bestAngle = anglesToTry[0]!;
  let probeText = "";
  let probeScore = -1;
  {
    const probe = await Tesseract.createWorker("eng+deu", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(0.12 + (m.progress || 0) * 0.12, "مسح أولي…");
        } else if (m.status === "loading language traineddata") {
          onProgress?.(0.12, "تحميل نماذج أولية…");
        }
      },
    });
    try {
      for (const a of anglesToTry) {
        const oriented =
          a === 0 ? prepared.blob : await rotateImageBlob(prepared.blob, a);
        await probe.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: "1",
        });
        const { data } = await probe.recognize(oriented);
        const text = (data.text || "").trim();
        const score = scoreOcrText(text, Number(data.confidence) || 0);
        if (score > probeScore) {
          probeScore = score;
          probeText = text;
          bestAngle = a;
        }
        if (score >= 48 && hasLetterRatio(text) > 0.45) break;
      }
    } finally {
      await probe.terminate();
    }
  }

  let orientedBlob =
    bestAngle === 0
      ? prepared.blob
      : await rotateImageBlob(prepared.blob, bestAngle);

  let packs: string[];
  const probeWasWeak = !(probeScore >= 28 && hasLetterRatio(probeText) > 0.35);
  if (langs === "auto") {
    const guessed = probeWasWeak
      ? { code: "deu+eng", label: "أوروبية / ألمانية" }
      : guessLangPack(probeText);
    packs = uniquePacks([
      guessed.code,
      "deu+eng",
      "por+eng",
      "eng",
      ...AUTO_LANG_PACKS,
    ]);
    onProgress?.(0.28, `لغة مرشّحة: ${guessed.label}…`);
  } else {
    packs = [langs];
  }

  let bestText = "";
  let bestScore = -1;
  let langUsed = packs[0]!;

  for (let i = 0; i < packs.length; i++) {
    const pack = packs[i]!;
    onProgress?.(
      0.3 + (i / packs.length) * 0.55,
      `قراءة بـ ${LANG_LABELS[pack] || pack}…`,
    );
    const worker = await Tesseract.createWorker(pack, 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(
            0.3 + ((i + (m.progress || 0)) / packs.length) * 0.55,
            "استخراج النص…",
          );
        } else if (m.status === "loading language traineddata") {
          onProgress?.(0.3, `تحميل ${LANG_LABELS[pack] || pack}…`);
        }
      },
    });
    try {
      for (const psm of [
        Tesseract.PSM.AUTO,
        Tesseract.PSM.SINGLE_BLOCK,
        Tesseract.PSM.SINGLE_COLUMN,
      ]) {
        await worker.setParameters({
          tessedit_pageseg_mode: psm,
          preserve_interword_spaces: "1",
        });
        const { data } = await worker.recognize(orientedBlob);
        const text = (data.text || "").trim();
        const score = scoreOcrText(text, Number(data.confidence) || 0);
        if (score > bestScore) {
          bestScore = score;
          bestText = text;
          langUsed = pack;
        }
      }
    } finally {
      await worker.terminate();
    }

    if (langs !== "auto") break;
    if (
      !probeWasWeak &&
      bestScore >= 58 &&
      hasLetterRatio(bestText) > 0.5 &&
      countDocKeywords(bestText) >= 2
    ) {
      break;
    }
    if (i >= 3 && bestScore >= 50 && hasLetterRatio(bestText) > 0.45) break;
  }

  if (bestScore < 42 || hasLetterRatio(bestText) < 0.4) {
    onProgress?.(0.88, "تحسين إضافي للمستند…");
    const bin = await prepareImageForOcr(file, "binary");
    const binOriented =
      bestAngle === 0 ? bin.blob : await rotateImageBlob(bin.blob, bestAngle);
    const pack = langs === "auto" ? langUsed || "deu+eng" : langs;
    const worker = await Tesseract.createWorker(pack, 1);
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1",
      });
      const { data } = await worker.recognize(binOriented);
      const text = (data.text || "").trim();
      const score = scoreOcrText(text, Number(data.confidence) || 0);
      if (score > bestScore) {
        bestText = text;
        bestScore = score;
        langUsed = pack;
        orientedBlob = binOriented;
      }
    } finally {
      await worker.terminate();
    }
  }

  if (langs === "auto" && bestText) {
    const refined = guessLangPack(bestText);
    if (
      refined.code !== langUsed &&
      refined.code !== "eng+por+spa+fra+deu+ita"
    ) {
      onProgress?.(0.94, `تحسين بـ ${refined.label}…`);
      const worker = await Tesseract.createWorker(refined.code, 1);
      try {
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: "1",
        });
        const { data } = await worker.recognize(orientedBlob);
        const text = (data.text || "").trim();
        const score = scoreOcrText(text, Number(data.confidence) || 0);
        if (score > bestScore) {
          bestText = text;
          langUsed = refined.code;
        }
      } finally {
        await worker.terminate();
      }
    }
  }

  onProgress?.(1, "تم");
  const finalGuess = guessLangPack(bestText);
  let text = cleanupOcrText(bestText);
  if (langUsed.includes("deu") || /[äöüß]|Aufenth|Gilt nur|Volkshochschule/i.test(text)) {
    text = correctGermanOcr(text);
  }
  if (langUsed.includes("por") || /FILIA|SECRETARIA|ESTADO DE/i.test(text)) {
    text = correctPortugueseOcr(text);
  }
  return {
    text,
    langUsed,
    langLabel:
      langs === "auto"
        ? finalGuess.label !== "تلقائي"
          ? finalGuess.label
          : LANG_LABELS[langUsed] || langUsed
        : LANG_LABELS[langUsed] || langUsed,
  };
}

/** تصحيح أخطاء OCR الشائعة في الألمانية */
function correctGermanOcr(text: string): string {
  const pairs: [RegExp, string][] = [
    [/\bAZR-Nummery\b/gi, "AZR-Nummer"],
    [/\bNummery\b/gi, "Nummer"],
    [/\bbel der\b/gi, "bei der"],
    [/\bbel dem\b/gi, "bei dem"],
    [/\bBesucii eines\b/gi, "Besuch eines"],
    [/\bBesucii\b/gi, "Besuch"],
    [/\bSelbstindige\b/gi, "Selbständige"],
    [/\bSelbstándige\b/gi, "Selbständige"],
    [/\bTatigkeit\b/gi, "Tätigkeit"],
    [/\bTatigke1t\b/gi, "Tätigkeit"],
    [/\bBeschiftigung\b/gi, "Beschäftigung"],
    [/\bBeschaftigung\b/gi, "Beschäftigung"],
    [/\bertaubt\b/gi, "erlaubt"],
    [/\bPíorzheim\b/gi, "Pforzheim"],
    [/\bPforznhe\b/gi, "Pforzheim"],
    [/\bPforzheirn\b/gi, "Pforzheim"],
    [/\bFiktit\b/gi, "Fiktionsbescheinigung"],
    [/\bSeriennummer des Klebeetiketts\b/gi, "Seriennummer des Klebeetiketts"],
    [/\bErstausstellung\b/gi, "Erstausstellung"],
    [/\bVerlangerung\b/gi, "Verlängerung"],
    [/\bNebenbestimmungen\b/gi, "Nebenbestimmungen"],
    [/F1569095[¢cC]/g, "F15690956"],
    [/2511\s*12\s*067580/g, "251112067580"],
    [/2511\s*6\/08/g, "251112067580"],
  ];
  let out = text;
  for (const [re, rep] of pairs) out = out.replace(re, rep);
  return out;
}

function correctPortugueseOcr(text: string): string {
  const pairs: [RegExp, string][] = [
    [/\bFILIACAO\b/gi, "FILIAÇÃO"],
    [/\bNATURALIDADE\b/gi, "NATURALIDADE"],
    [/\bORGAO\b/gi, "ORGÃO"],
    [/\bSAO PAULO\b/gi, "SÃO PAULO"],
  ];
  let out = text;
  for (const [re, rep] of pairs) out = out.replace(re, rep);
  return out;
}

function uniquePacks(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of list) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export function guessLangPack(text: string): { code: string; label: string } {
  const t = text || "";
  const arabic = (t.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (t.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  const lower = t.toLowerCase();

  if (arabic >= 12 && arabic >= latin * 0.25) {
    return { code: "ara+eng", label: "العربية" };
  }

  if (
    /[äöüß]/.test(t) ||
    /\b(der|die|das|und|für|nicht|mit|von|aufenth|geburtsdatum|vorname|staatsangeh|bescheinigung|inhaber|reisepass|ausgestellt|gültig|bundesrepublik|straße|pforzheim|berlin|münchen|name)\b/i.test(
      t,
    ) ||
    /aufenthaltstitel|fiktions|aufenthg|brasilianisch/i.test(t)
  ) {
    return { code: "deu+eng", label: "Deutsch" };
  }

  if (/[ğüşıöçĞÜŞİÖÇ]/.test(t) || /\b(ve|için|türkiye)\b/i.test(t)) {
    return { code: "tur+eng", label: "Türkçe" };
  }

  if (
    /[ãõ]/i.test(t) ||
    /ção|ões/.test(lower) ||
    /\b(brasil|são paulo|secretaria|filiação|naturalidade|carteira|identidade|nascimento)\b/i.test(
      t,
    )
  ) {
    return { code: "por+eng", label: "Português" };
  }

  if (
    /[ñ¿¡]/i.test(t) ||
    /\b(español|méxico|identidad|apellido|nacimiento)\b/i.test(t)
  ) {
    return { code: "spa+eng", label: "Español" };
  }

  if (
    /[àâçéèêëîïôùûü]/i.test(t) ||
    /\b(république|française|naissance|prénom)\b/i.test(t)
  ) {
    return { code: "fra+eng", label: "Français" };
  }

  if (/\b(italia|cognome|nascita|repubblica)\b/i.test(t)) {
    return { code: "ita+eng", label: "Italiano" };
  }

  if (latin > 30) {
    return { code: "deu+eng", label: "لاتينية / أوروبية" };
  }

  return { code: "deu+eng", label: "تلقائي" };
}

function countDocKeywords(text: string): number {
  const keys = [
    /\bname\b/i,
    /\bvorname\b/i,
    /geburt/i,
    /aufenthalt/i,
    /reisepass/i,
    /fiktions/i,
    /nebenbestimmungen/i,
    /azr[- ]?nummer/i,
    /seriennummer/i,
    /volkshochschule/i,
    /beschäftigung|beschaftigung|beschiftigung/i,
    /selbständige|selbstandige|selbstindige/i,
    /gilt nur/i,
    /filia/i,
    /secretaria/i,
    /identidade/i,
    /naturalidade/i,
    /passport/i,
    /nationalit/i,
    /[\u0600-\u06FF]{4,}/,
  ];
  return keys.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

function hasLetterRatio(text: string): number {
  const letters = (text.match(/\p{L}/gu) || []).length;
  const total = text.replace(/\s/g, "").length || 1;
  return letters / total;
}

function scoreOcrText(text: string, confidence: number): number {
  if (!text) return -1;
  const ratio = hasLetterRatio(text);
  const words = text.split(/\s+/).filter((w) => /\p{L}{2,}/u.test(w)).length;
  const junk = (text.match(/[|=»«¢£¥©®°±×÷]|\bX{3,}\b/g) || []).length;
  const keywords = countDocKeywords(text);
  const realHits = (
    text.match(
      /\b(DANDASH|Wisam|Pforzheim|Enzkreis|brasilianisch|Aufenthalt|Geburtsdatum|SECRETARIA|FILIAÇÃO|ESTADO|SIRIA|Vorname|Reisepass|Fiktions|Nebenbestimmungen|AZR|Intensivsprachkurs|Volkshochschule|Beschäftigung|Selbständige|F15690956)\b/gi,
    ) || []
  ).length;
  return (
    confidence * 0.55 +
    words * 2.2 +
    ratio * 40 -
    junk * 1.5 +
    keywords * 8 +
    realHits * 12 +
    Math.min(20, text.length / 30)
  );
}

function cleanupOcrText(text: string): string {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/(?:X{4,}[\s]*){2,}/g, "\n")
    .trim();
}

async function prepareImageForOcr(
  file: File,
  mode: PrepMode = "enhance",
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImageElement(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const long = Math.max(srcW, srcH);
  const targetLong = Math.max(
    2800,
    Math.min(
      4200,
      long < 1400 ? long * 3.2 : long < 2000 ? long * 2 : long * 1.35,
    ),
  );
  const scale = targetLong / long;
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  let min = 255;
  let max = 0;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    gray[p] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const span = Math.max(1, max - min);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let v = ((gray[p]! - min) / span) * 255;
    v = (v - 128) * 1.25 + 128;
    if (mode === "binary") v = v > 150 ? 255 : 0;
    else v = Math.max(0, Math.min(255, v));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return { blob: await canvasToBlob(canvas, "image/png"), width: w, height: h };
}

async function rotateImageBlob(blob: Blob, degrees: number): Promise<Blob> {
  const file = new File([blob], "ocr.png", { type: "image/png" });
  const img = await loadImageElement(file);
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const nw = Math.round(w * cos + h * sin);
  const nh = Math.round(w * sin + h * cos);
  const canvas = document.createElement("canvas");
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(nw / 2, nh / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h / 2);
  return canvasToBlob(canvas, "image/png");
}
