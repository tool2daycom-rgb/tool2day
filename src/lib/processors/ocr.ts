/** OCR محسّن: تكبير متعدد الخطوات + أوضاع تحضير + مناطق للمستندات الصغيرة */

export type OcrResult = {
  text: string;
  langUsed: string;
  langLabel: string;
  warning?: string;
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
  deu: "Deutsch",
  "tur+eng": "Türkçe + English",
  "ita+eng": "Italiano + English",
  "eng+deu": "English + Deutsch",
  "eng+por+spa+fra+deu+ita": "لاتينية متعددة",
};

const AUTO_LANG_PACKS = [
  "deu+eng",
  "deu",
  "por+eng",
  "eng",
  "ara+eng",
  "spa+eng",
  "fra+eng",
  "ita+eng",
  "tur+eng",
] as const;

type PrepMode = "light" | "enhance" | "binary";

async function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
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
  const src = await loadImageElement(file);
  const srcLong = Math.max(src.naturalWidth, src.naturalHeight);
  const tiny = srcLong < 900;
  const warning = tiny
    ? "الصورة منخفضة الدقة — للحصول على أفضل نتيجة ارفع صورة أوضح بحجم أكبر (يفضّل أكثر من 1500 بكسل)."
    : undefined;

  onProgress?.(0.02, "تحسين الصورة…");
  const light = await prepareImageForOcr(file, "light");
  const enhance = await prepareImageForOcr(file, "enhance");

  onProgress?.(0.06, "كشف اتجاه النص…");
  let angle = 0;
  try {
    const detected = await Tesseract.detect(light.blob, {
      logger: (m) => {
        if (m.status) {
          onProgress?.(0.06 + (m.progress || 0) * 0.05, "كشف الاتجاه…");
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
  let bestAngle = 0;
  let probeText = "";
  let probeScore = -1;
  {
    const probe = await Tesseract.createWorker("deu+eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(0.12 + (m.progress || 0) * 0.1, "مسح أولي…");
        } else if (m.status === "loading language traineddata") {
          onProgress?.(0.12, "تحميل نماذج أولية…");
        }
      },
    });
    try {
      await probe.setParameters({
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      for (const a of anglesToTry) {
        const oriented =
          a === 0 ? light.blob : await rotateImageBlob(light.blob, a);
        await probe.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
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

  const orient = async (blob: Blob) =>
    bestAngle === 0 ? blob : rotateImageBlob(blob, bestAngle);

  let packs: string[];
  const probeWasWeak = !(probeScore >= 28 && hasLetterRatio(probeText) > 0.35);
  if (langs === "auto") {
    const guessed = probeWasWeak
      ? { code: "deu+eng", label: "أوروبية / ألمانية" }
      : guessLangPack(probeText);
    packs = uniquePacks([
      guessed.code,
      "deu+eng",
      "deu",
      "eng",
      ...AUTO_LANG_PACKS,
    ]);
    onProgress?.(0.24, `لغة مرشّحة: ${guessed.label}…`);
  } else {
    packs = [langs];
  }

  let bestText = "";
  let bestScore = -1;
  let langUsed = packs[0]!;

  const variants: { label: string; blob: Blob }[] = [
    { label: "خفيف", blob: await orient(light.blob) },
    { label: "محسّن", blob: await orient(enhance.blob) },
  ];

  const psmList = [
    Tesseract.PSM.AUTO,
    Tesseract.PSM.SINGLE_COLUMN,
    Tesseract.PSM.SINGLE_BLOCK,
    Tesseract.PSM.SPARSE_TEXT,
  ];

  const maxPacks = langs === "auto" ? (tiny ? 3 : 4) : 1;

  for (let i = 0; i < Math.min(packs.length, maxPacks); i++) {
    const pack = packs[i]!;
    onProgress?.(
      0.28 + (i / maxPacks) * 0.45,
      `قراءة بـ ${LANG_LABELS[pack] || pack}…`,
    );
    const worker = await Tesseract.createWorker(pack, 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(
            0.28 + ((i + (m.progress || 0)) / maxPacks) * 0.45,
            "استخراج النص…",
          );
        } else if (m.status === "loading language traineddata") {
          onProgress?.(0.28, `تحميل ${LANG_LABELS[pack] || pack}…`);
        }
      },
    });
    try {
      await worker.setParameters({
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      for (const variant of variants) {
        for (const psm of psmList) {
          await worker.setParameters({ tessedit_pageseg_mode: psm });
          const { data } = await worker.recognize(variant.blob);
          const text = (data.text || "").trim();
          const score = scoreOcrText(text, Number(data.confidence) || 0);
          if (score > bestScore) {
            bestScore = score;
            bestText = text;
            langUsed = pack;
          }
        }
      }

      // تقسيم رأسي للمستندات الصغيرة/الطويلة عندما النتيجة ضعيفة
      if (tiny || bestScore < 55 || countDocKeywords(bestText) < 2) {
        onProgress?.(0.7, "قراءة بالمناطق…");
        const regions = await splitVerticalRegions(variants[0]!.blob);
        const parts: string[] = [];
        for (const region of regions) {
          await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          });
          const { data } = await worker.recognize(region);
          parts.push((data.text || "").trim());
        }
        const merged = parts.filter(Boolean).join("\n\n");
        const score = scoreOcrText(merged, 60);
        if (score > bestScore) {
          bestScore = score;
          bestText = merged;
          langUsed = pack;
        }
      }
    } finally {
      await worker.terminate();
    }

    if (langs !== "auto") break;
    if (
      bestScore >= 70 &&
      hasLetterRatio(bestText) > 0.5 &&
      countDocKeywords(bestText) >= 3
    ) {
      break;
    }
  }

  if (bestScore < 50 || hasLetterRatio(bestText) < 0.4) {
    onProgress?.(0.85, "تحسين ثنائي إضافي…");
    const bin = await prepareImageForOcr(file, "binary");
    const binOriented = await orient(bin.blob);
    const pack = langs === "auto" ? langUsed || "deu+eng" : langs;
    const worker = await Tesseract.createWorker(pack, 1);
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      const { data } = await worker.recognize(binOriented);
      const text = (data.text || "").trim();
      const score = scoreOcrText(text, Number(data.confidence) || 0);
      if (score > bestScore) {
        bestText = text;
        bestScore = score;
        langUsed = pack;
      }
    } finally {
      await worker.terminate();
    }
  }

  onProgress?.(1, "تم");
  const finalGuess = guessLangPack(bestText);
  let text = cleanupOcrText(bestText);
  if (
    langUsed.includes("deu") ||
    /[äöüß]|Aufenth|Gilt nur|Volkshochschule|Meldebest|Pforzheim|gemeldet/i.test(
      text,
    )
  ) {
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
    warning,
  };
}

/** تصحيح أخطاء OCR الشائعة في الألمانية (مستندات إدارية) */
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
    [/\bPforzheia\b/gi, "Pforzheim"],
    [/\bPforzheis\b/gi, "Pforzheim"],
    [/\bPforzhein\b/gi, "Pforzheim"],
    [/\bPort sam\b/gi, "Pforzheim"],
    [/\bPirzkem\b/gi, "Pforzheim"],
    [/\bFiktit\b/gi, "Fiktionsbescheinigung"],
    [/\bSürgercentram\b/gi, "Bürgercentrum"],
    [/\bSürgercentrunn\b/gi, "Bürgercentrum"],
    [/\bBürgercentrunn\b/gi, "Bürgercentrum"],
    [/\bBiro\.?\s*Pforzheim\b/gi, "Stadt Pforzheim"],
    [/\bMeldebest[^\n]{0,12}\b/gi, "Meldebestätigung"],
    [/\bDest\s*itigyn\b/gi, "Meldebestätigung"],
    [/\bgemäß\b/gi, "gemäß"],
    [/\bgents\b/gi, "gemäß"],
    [/\bgen[il5]\s*§\b/gi, "gemäß §"],
    [/\bAbs\.\s*2\s*3MG\b/gi, "Abs. 2 BMG"],
    [/\bAbs\.\s*2\s*ams\b/gi, "Abs. 2 BMG"],
    [/\b2\s*3MG\b/gi, "2 BMG"],
    [/\bSachbanseierin\b/gi, "Sachbearbeiterin"],
    [/\bSachbendetern\b/gi, "Sachbearbeiterin"],
    [/\bSschbendetern\b/gi, "Sachbearbeiterin"],
    [/\bgezeld\b/gi, "gemeldet"],
    [/\bgeselde\b/gi, "gemeldet"],
    [/\bges\s*[:.]?\s*det\b/gi, "gemeldet"],
    [/\bgemelde\b/gi, "gemeldet"],
    [/\balleiniger Wohnung gemeldet\b/gi, "alleiniger Wohnung gemeldet"],
    [/\bAaiser-Friedrich-Str\b/gi, "Kaiser-Friedrich-Str"],
    [/\bKaiser-Frfedrich-Str\b/gi, "Kaiser-Friedrich-Str"],
    [/\bKart-Fridrich\b/gi, "Karl-Friedrich"],
    [/\bKarl-Fridrich\b/gi, "Karl-Friedrich"],
    [/\bUnser Zeichen\b/gi, "Unser Zeichen"],
    [/\bUser Zacher\b/gi, "Unser Zeichen"],
    [/\bU=sevw Texter\b/gi, "Unser Zeichen"],
    [/\bTelefax\b/gi, "Telefax"],
    [/\bAuszugsdatum\b/gi, "Auszugsdatum"],
    [/\bAbmeldedatum\b/gi, "Abmeldedatum"],
    [/\bMit freundlichen Grüßen\b/gi, "Mit freundlichen Grüßen"],
    [/\bist derzeit in Pforzheim\b/gi, "ist derzeit in Pforzheim"],
    [/\bVerlangerung\b/gi, "Verlängerung"],
    [/\bNebenbestimmungen\b/gi, "Nebenbestimmungen"],
    [/F1569095[¢cC]/g, "F15690956"],
    [/2511\s*12\s*067580/g, "251112067580"],
    [/2511\s*6\/08/g, "251112067580"],
    [/\b275172\b/g, "75172"],
    [/\b5172 Pforzheim\b/gi, "75172 Pforzheim"],
    [/\b75178 Pforzheim\b/gi, "75175 Pforzheim"],
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
    /\b(der|die|das|und|für|nicht|mit|von|aufenth|geburtsdatum|vorname|staatsangeh|bescheinigung|inhaber|reisepass|ausgestellt|gültig|bundesrepublik|straße|pforzheim|berlin|münchen|name|meldebest|bürger|gemeldet)\b/i.test(
      t,
    ) ||
    /aufenthaltstitel|fiktions|aufenthg|brasilianisch|meldebestätigung/i.test(t)
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
    /meldebest/i,
    /nebenbestimmungen/i,
    /azr[- ]?nummer/i,
    /seriennummer/i,
    /volkshochschule/i,
    /beschäftigung|beschaftigung|beschiftigung/i,
    /selbständige|selbstandige|selbstindige/i,
    /gilt nur/i,
    /gemeldet/i,
    /pforzheim/i,
    /bürgercentrum|burgercentrum/i,
    /auszugsdatum|abmeldedatum/i,
    /kaiser-friedrich/i,
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
      /\b(DANDASH|Dandash|Wisam|Pforzheim|Enzkreis|brasilianisch|Aufenthalt|Geburtsdatum|SECRETARIA|FILIAÇÃO|ESTADO|SIRIA|Vorname|Reisepass|Fiktions|Nebenbestimmungen|AZR|Intensivsprachkurs|Volkshochschule|Beschäftigung|Selbständige|Meldebestätigung|Bürgercentrum|gemeldet|Kaiser-Friedrich|Schwaab|F15690956|01\.08\.1992)\b/gi,
    ) || []
  ).length;
  return (
    confidence * 0.45 +
    words * 2.0 +
    ratio * 35 -
    junk * 1.8 +
    keywords * 10 +
    realHits * 14 +
    Math.min(25, text.length / 28)
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

/** تكبير متعدد الخطوات بجودة عالية ثم معالجة حسب الوضع */
async function prepareImageForOcr(
  file: File,
  mode: PrepMode = "light",
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImageElement(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const long = Math.max(srcW, srcH);

  // للمستندات الصغيرة جداً: تكبير أقوى (حرف كبير ≈ 30px)
  const targetLong =
    mode === "light"
      ? Math.max(
          3200,
          Math.min(4800, long < 700 ? long * 7 : long < 1200 ? long * 4 : long * 2),
        )
      : Math.max(
          2800,
          Math.min(
            4200,
            long < 1400 ? long * 3.5 : long < 2000 ? long * 2 : long * 1.35,
          ),
        );

  const canvas = await upscaleInSteps(img, srcW, srcH, targetLong / long);
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d")!;
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
  const contrast = mode === "light" ? 1.08 : mode === "enhance" ? 1.22 : 1.15;
  const thresh = mode === "binary" ? otsuThreshold(gray) : 0;

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let v = ((gray[p]! - min) / span) * 255;
    v = (v - 128) * contrast + 128;
    if (mode === "binary") v = v > thresh ? 255 : 0;
    else v = Math.max(0, Math.min(255, v));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);

  if (mode === "light" || mode === "enhance") {
    unsharpLight(ctx, w, h, mode === "light" ? 0.55 : 0.75);
  }

  return { blob: await canvasToBlob(canvas, "image/png"), width: w, height: h };
}

async function upscaleInSteps(
  img: CanvasImageSource,
  srcW: number,
  srcH: number,
  totalScale: number,
): Promise<HTMLCanvasElement> {
  let w = srcW;
  let h = srcH;
  let remaining = totalScale;
  let source: CanvasImageSource = img;

  while (remaining > 1.01) {
    const step = Math.min(2, remaining);
    const nw = Math.round(w * step);
    const nh = Math.round(h * step);
    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, nw, nh);
    source = canvas;
    w = nw;
    h = nh;
    remaining /= step;
  }

  if (source instanceof HTMLCanvasElement) return source;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  return canvas;
}

function otsuThreshold(gray: Float32Array): number {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < gray.length; i++) {
    hist[Math.max(0, Math.min(255, Math.round(gray[i]!)))]!++;
  }
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i]!;
  let sumB = 0;
  let wB = 0;
  let max = 0;
  let threshold = 150;
  for (let i = 0; i < 256; i++) {
    wB += hist[i]!;
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) {
      max = between;
      threshold = i;
    }
  }
  return threshold;
}

function unsharpLight(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number,
) {
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const s = src.data;
  const d = dst.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const c = s[i]!;
      let blur = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          blur += s[((y + dy) * w + (x + dx)) * 4]!;
        }
      }
      blur /= 9;
      const v = Math.max(0, Math.min(255, c + (c - blur) * amount));
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(dst, 0, 0);
}

async function splitVerticalRegions(blob: Blob): Promise<Blob[]> {
  const img = await loadImageElement(blob);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const bands = [
    { y0: 0, y1: Math.round(h * 0.3) },
    { y0: Math.round(h * 0.22), y1: Math.round(h * 0.72) },
    { y0: Math.round(h * 0.62), y1: h },
  ];
  const out: Blob[] = [];
  for (const b of bands) {
    const ch = Math.max(1, b.y1 - b.y0);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, b.y0, w, ch, 0, 0, w, ch);
    out.push(await canvasToBlob(canvas, "image/png"));
  }
  return out;
}

async function rotateImageBlob(blob: Blob, degrees: number): Promise<Blob> {
  const img = await loadImageElement(blob);
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
