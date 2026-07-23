/** أدوات نصية خفيفة تعمل بالكامل في المتصفح */

export type TextStats = {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
};

export function analyzeText(text: string): TextStats {
  const trimmed = text.replace(/\s+$/u, "");
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/gu, "").length;
  const words = text.trim()
    ? text
        .trim()
        .split(/\s+/u)
        .filter(Boolean).length
    : 0;
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/u).length;
  const sentences = text.trim()
    ? text
        .split(/(?<=[.!?؟。！？])\s+/u)
        .map((s) => s.trim())
        .filter(Boolean).length
    : 0;
  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/u).filter((p) => p.trim()).length
    : 0;
  return { chars, charsNoSpaces, words, lines, sentences, paragraphs };
}

export function toUpper(text: string) {
  return text.toLocaleUpperCase("ar");
}

export function toLower(text: string) {
  return text.toLocaleLowerCase("ar");
}

export function toTitleCase(text: string) {
  return text.replace(/\S+/gu, (word) => {
    const lower = word.toLocaleLowerCase("ar");
    return lower.charAt(0).toLocaleUpperCase("ar") + lower.slice(1);
  });
}

export function reverseText(text: string) {
  return [...text].reverse().join("");
}

export function collapseSpaces(text: string) {
  return text
    .replace(/[ \t\u00a0]+/gu, " ")
    .replace(/ *\n */gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function removeEmptyLines(text: string) {
  return text
    .split(/\r\n|\r|\n/u)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

export function sortLines(text: string, desc = false) {
  const lines = text.split(/\r\n|\r|\n/u);
  const sorted = [...lines].sort((a, b) =>
    a.localeCompare(b, "ar", { sensitivity: "base" }),
  );
  if (desc) sorted.reverse();
  return sorted.join("\n");
}

export function uniqueLines(text: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r\n|\r|\n/u)) {
    const key = line.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n");
}

export function findReplace(
  text: string,
  find: string,
  replace: string,
  all = true,
) {
  if (!find) return text;
  if (!all) return text.replace(find, replace);
  return text.split(find).join(replace);
}

export type ErrorCheckResult = {
  ok: boolean;
  kind: string;
  message: string;
  details?: string;
  formatted?: string;
};

export function detectErrors(input: string, mode: string): ErrorCheckResult {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, kind: mode, message: "أدخل محتوى للفحص أولاً" };
  }

  if (mode === "json") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return {
        ok: true,
        kind: "json",
        message: "JSON صالح",
        formatted: JSON.stringify(parsed, null, 2),
      };
    } catch (e) {
      return {
        ok: false,
        kind: "json",
        message: "JSON غير صالح",
        details: e instanceof Error ? e.message : String(e),
      };
    }
  }

  if (mode === "url") {
    try {
      const u = new URL(raw);
      if (!/^https?:$/i.test(u.protocol)) {
        return {
          ok: false,
          kind: "url",
          message: "الرابط يجب أن يبدأ بـ http أو https",
        };
      }
      return {
        ok: true,
        kind: "url",
        message: "رابط صالح",
        details: `المضيف: ${u.host}`,
      };
    } catch {
      return { ok: false, kind: "url", message: "رابط غير صالح" };
    }
  }

  if (mode === "email") {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(raw);
    return ok
      ? { ok: true, kind: "email", message: "بريد إلكتروني بصيغة صحيحة" }
      : { ok: false, kind: "email", message: "صيغة البريد غير صحيحة" };
  }

  if (mode === "js") {
    try {
      // فحص صياغة فقط — لا يُنفَّذ الكود
      // eslint-disable-next-line no-new-func
      new Function(raw);
      return { ok: true, kind: "js", message: "صياغة JavaScript تبدو صحيحة" };
    } catch (e) {
      return {
        ok: false,
        kind: "js",
        message: "خطأ في صياغة JavaScript",
        details: e instanceof Error ? e.message : String(e),
      };
    }
  }

  if (mode === "html") {
    const openTags = (raw.match(/<[a-zA-Z][^/>]*>/g) || []).length;
    const closeTags = (raw.match(/<\/[a-zA-Z][^>]*>/g) || []).length;
    const selfClosing = (raw.match(/<[a-zA-Z][^>]*\/>/g) || []).length;
    const issues: string[] = [];
    if (openTags - selfClosing !== closeTags) {
      issues.push(
        `عدم توازن تقريبي في الوسوم (فتح: ${openTags}، إغلاق: ${closeTags})`,
      );
    }
    if (/<script[\s>]/i.test(raw) && !/<\/script>/i.test(raw)) {
      issues.push("وسم script مفتوح بلا إغلاق");
    }
    if (issues.length) {
      return {
        ok: false,
        kind: "html",
        message: "مشاكل محتملة في HTML",
        details: issues.join("\n"),
      };
    }
    return {
      ok: true,
      kind: "html",
      message: "لم يُكتشف خلل واضح في هيكل HTML (فحص سطحي)",
    };
  }

  return { ok: false, kind: mode, message: "وضع فحص غير معروف" };
}
