import type { LocaleCode } from "@/lib/i18n/locales";
import { locales } from "@/lib/i18n/locales";

/** FAQ «where to find this tool free» — every supported language. */
export const findToolFaqByLocale: Record<
  LocaleCode,
  { q: string; a: string }
> = {
  en: {
    q: "Where can I find {{tool}} free online?",
    a: "On Tool2Day: open {{tool}} and start in your browser — free, no install, no watermark.",
  },
  ar: {
    q: "أين أجد {{tool}} مجاناً أونلاين؟",
    a: "على Tool2Day: افتح صفحة {{tool}} وابدأ مباشرة من المتصفح — مجاناً وبدون تثبيت وبدون علامة مائية.",
  },
  de: {
    q: "Wo finde ich {{tool}} kostenlos online?",
    a: "Auf Tool2Day: Öffnen Sie {{tool}} im Browser — kostenlos, ohne Installation, ohne Wasserzeichen.",
  },
  es: {
    q: "¿Dónde encuentro {{tool}} gratis online?",
    a: "En Tool2Day: abre {{tool}} en el navegador — gratis, sin instalar y sin marca de agua.",
  },
  pt: {
    q: "Onde encontro {{tool}} grátis online?",
    a: "No Tool2Day: abra {{tool}} no navegador — grátis, sem instalar e sem marca d'água.",
  },
  it: {
    q: "Dove trovo {{tool}} gratis online?",
    a: "Su Tool2Day: apri {{tool}} nel browser — gratis, senza installazione e senza filigrana.",
  },
  fr: {
    q: "Où trouver {{tool}} gratuit en ligne ?",
    a: "Sur Tool2Day : ouvrez {{tool}} dans le navigateur — gratuit, sans installation, sans filigrane.",
  },
  ru: {
    q: "Где найти {{tool}} бесплатно онлайн?",
    a: "На Tool2Day: откройте {{tool}} в браузере — бесплатно, без установки и без водяного знака.",
  },
  pl: {
    q: "Gdzie znajdę {{tool}} za darmo online?",
    a: "Na Tool2Day: otwórz {{tool}} w przeglądarce — za darmo, bez instalacji i bez znaku wodnego.",
  },
  tr: {
    q: "{{tool}} ücretsiz online nerede?",
    a: "Tool2Day'de: {{tool}} sayfasını tarayıcıda açın — ücretsiz, kurulum yok, filigran yok.",
  },
  id: {
    q: "Di mana saya menemukan {{tool}} gratis online?",
    a: "Di Tool2Day: buka {{tool}} di browser — gratis, tanpa instalasi, tanpa watermark.",
  },
  ja: {
    q: "{{tool}}を無料でオンラインで使うには？",
    a: "Tool2Dayで{{tool}}をブラウザから利用できます。無料・インストール不要・透かしなし。",
  },
  ko: {
    q: "{{tool}} 무료 온라인은 어디서 쓰나요?",
    a: "Tool2Day에서 {{tool}}을(를) 브라우저로 사용하세요 — 무료, 설치 없음, 워터마크 없음.",
  },
  "zh-CN": {
    q: "哪里可以免费在线使用{{tool}}？",
    a: "在 Tool2Day 打开 {{tool}}，浏览器内即可使用——免费、无需安装、无水印。",
  },
  fa: {
    q: "{{tool}} رایگان آنلاین کجاست؟",
    a: "در Tool2Day صفحه {{tool}} را در مرورگر باز کنید — رایگان، بدون نصب و بدون واترمارک.",
  },
  "zh-TW": {
    q: "哪裡可以免費線上使用{{tool}}？",
    a: "在 Tool2Day 開啟 {{tool}}，瀏覽器內即可使用——免費、免安裝、無浮水印。",
  },
  vi: {
    q: "Tìm {{tool}} miễn phí online ở đâu?",
    a: "Trên Tool2Day: mở {{tool}} trong trình duyệt — miễn phí, không cài đặt, không watermark.",
  },
  he: {
    q: "איפה למצוא את {{tool}} בחינם אונליין?",
    a: "ב-Tool2Day: פתחו את {{tool}} בדפדפן — בחינם, בלי התקנה ובלי סימן מים.",
  },
  hi: {
    q: "{{tool}} मुफ़्त ऑनलाइन कहाँ मिलेगा?",
    a: "Tool2Day पर {{tool}} ब्राउज़र में खोलें — मुफ़्त, बिना इंस्टॉल, बिना वॉटरमार्क।",
  },
  th: {
    q: "หา {{tool}} ฟรีออนไลน์ได้ที่ไหน?",
    a: "ที่ Tool2Day: เปิด {{tool}} ในเบราว์เซอร์ — ฟรี ไม่ต้องติดตั้ง ไม่มีลายน้ำ",
  },
};

const EN_STRIP =
  /\b(free|online|generator|converter|calculator|editor|tool|tools|maker|builder)\b/gi;

/** Short searchable forms of a localized tool title. */
export function shortenLocalizedTitle(
  title: string,
  locale: LocaleCode,
): string[] {
  const t = title.trim();
  if (!t) return [];
  const out = [t];

  if (locale === "ar") {
    const stripped = t
      .replace(
        /^(مولد|محوّل|محول|حاسبة|أداة|أدوات|محرر|منسّق|منسق|مستخرج|كاشف|فحص|تحميل|توليد|ترجمة|تحويل|إضافة|إزالة|تغيير|تقسيم|دمج|ضغط|فتح|حماية|تدوير)\s+/u,
        "",
      )
      .trim();
    if (stripped && stripped !== t) out.push(stripped);
    return out;
  }

  if (
    locale === "en" ||
    locale === "de" ||
    locale === "es" ||
    locale === "fr" ||
    locale === "it" ||
    locale === "pt" ||
    locale === "id" ||
    locale === "tr" ||
    locale === "pl"
  ) {
    const stripped = t.replace(EN_STRIP, " ").replace(/\s+/g, " ").trim();
    if (
      stripped &&
      stripped.toLowerCase() !== t.toLowerCase() &&
      stripped.length > 2
    ) {
      out.push(stripped);
    }
  }

  return out;
}

/** Intent-rich keyword variants for one title in one locale. */
export function localizedTitleKeywords(
  title: string,
  locale: LocaleCode,
  suffixes: string[],
): string[] {
  const bases = shortenLocalizedTitle(title, locale);
  const out: string[] = [];
  for (const base of bases) {
    out.push(base);
    for (const s of suffixes) out.push(`${base} ${s}`);
  }
  return out;
}

export function allLocaleTitleKeywords(
  getTitle: (locale: LocaleCode) => string,
  suffixesFor: (locale: LocaleCode) => string[],
): string[] {
  const out: string[] = [];
  for (const loc of locales) {
    out.push(
      ...localizedTitleKeywords(
        getTitle(loc.code),
        loc.code,
        suffixesFor(loc.code),
      ),
    );
  }
  return out;
}
