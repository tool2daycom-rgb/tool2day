import type { LocaleCode } from "@/lib/i18n/locales";
import { locales } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";
import {
  getToolTitle,
  toolTitlesByLocale,
  toolTitlesEn,
} from "@/lib/i18n/tool-titles";
import type { Tool } from "@/lib/tools";
import { tools } from "@/lib/tools";
import type { ToolSeoContent } from "@/lib/tool-seo-content";
import { localizedTitleKeywords } from "@/lib/seo-tool-phrases";

/** High-intent suffixes appended to tool names per language (SEO). */
export const intentSuffixesByLocale: Record<LocaleCode, string[]> = {
  en: [
    "free",
    "online",
    "free online",
    "no watermark",
    "in browser",
    "online free",
  ],
  de: [
    "kostenlos",
    "online",
    "kostenlos online",
    "ohne Wasserzeichen",
    "im Browser",
  ],
  es: [
    "gratis",
    "online",
    "gratis online",
    "sin marca de agua",
    "en el navegador",
  ],
  pt: [
    "grátis",
    "online",
    "grátis online",
    "sem marca d'água",
    "no navegador",
  ],
  it: [
    "gratis",
    "online",
    "gratis online",
    "senza filigrana",
    "nel browser",
  ],
  fr: [
    "gratuit",
    "en ligne",
    "gratuit en ligne",
    "sans filigrane",
    "dans le navigateur",
  ],
  ru: [
    "бесплатно",
    "онлайн",
    "бесплатно онлайн",
    "без водяного знака",
    "в браузере",
  ],
  pl: [
    "za darmo",
    "online",
    "za darmo online",
    "bez znaku wodnego",
    "w przeglądarce",
  ],
  tr: [
    "ücretsiz",
    "çevrimiçi",
    "ücretsiz online",
    "filigransız",
    "tarayıcıda",
  ],
  id: [
    "gratis",
    "online",
    "gratis online",
    "tanpa watermark",
    "di browser",
  ],
  ja: ["無料", "オンライン", "無料オンライン", "透かしなし", "ブラウザ"],
  ko: ["무료", "온라인", "무료 온라인", "워터마크 없음", "브라우저"],
  "zh-CN": ["免费", "在线", "免费在线", "无水印", "浏览器"],
  fa: ["رایگان", "آنلاین", "رایگان آنلاین", "بدون واترمارک", "در مرورگر"],
  "zh-TW": ["免費", "線上", "免費線上", "無浮水印", "瀏覽器"],
  vi: [
    "miễn phí",
    "trực tuyến",
    "miễn phí online",
    "không watermark",
    "trên trình duyệt",
  ],
  ar: [
    "مجاناً",
    "مجاني",
    "أونلاين",
    "مجاني أونلاين",
    "بدون علامة مائية",
    "بدون تحميل",
    "في المتصفح",
  ],
  he: ["בחינם", "אונליין", "בחינם אונליין", "ללא סימן מים", "בדפדפן"],
  hi: ["मुफ़्त", "ऑनलाइन", "मुफ़्त ऑनलाइन", "बिना वॉटरमार्क", "ब्राउज़र में"],
  th: ["ฟรี", "ออนไลน์", "ฟรีออนไลน์", "ไม่มีลายน้ำ", "ในเบราว์เซอร์"],
};

/** Brand / category discovery terms per locale. */
export const brandKeywordsByLocale: Record<LocaleCode, string[]> = {
  en: [
    "Tool2Day",
    "tool2day",
    "tool2day.com",
    "online tools",
    "free online tools",
    "file converter",
    "video editor online",
    "PDF tools free",
    "audio tools free",
    "no watermark tools",
    "browser tools",
  ],
  de: [
    "Tool2Day",
    "Online-Tools",
    "kostenlose Online-Tools",
    "Dateikonverter",
    "Video-Editor online",
    "PDF-Tools kostenlos",
    "ohne Wasserzeichen",
  ],
  es: [
    "Tool2Day",
    "herramientas online",
    "herramientas gratis",
    "convertidor de archivos",
    "editor de video online",
    "herramientas PDF gratis",
    "sin marca de agua",
  ],
  pt: [
    "Tool2Day",
    "ferramentas online",
    "ferramentas grátis",
    "conversor de arquivos",
    "editor de vídeo online",
    "ferramentas PDF grátis",
    "sem marca d'água",
  ],
  it: [
    "Tool2Day",
    "strumenti online",
    "strumenti gratis",
    "convertitore file",
    "editor video online",
    "strumenti PDF gratis",
    "senza filigrana",
  ],
  fr: [
    "Tool2Day",
    "outils en ligne",
    "outils gratuits",
    "convertisseur de fichiers",
    "éditeur vidéo en ligne",
    "outils PDF gratuits",
    "sans filigrane",
  ],
  ru: [
    "Tool2Day",
    "онлайн инструменты",
    "бесплатные онлайн инструменты",
    "конвертер файлов",
    "видеоредактор онлайн",
    "PDF инструменты бесплатно",
    "без водяного знака",
  ],
  pl: [
    "Tool2Day",
    "narzędzia online",
    "darmowe narzędzia",
    "konwerter plików",
    "edytor wideo online",
    "narzędzia PDF za darmo",
    "bez znaku wodnego",
  ],
  tr: [
    "Tool2Day",
    "çevrimiçi araçlar",
    "ücretsiz online araçlar",
    "dosya dönüştürücü",
    "online video editörü",
    "ücretsiz PDF araçları",
    "filigransız",
  ],
  id: [
    "Tool2Day",
    "alat online",
    "alat gratis",
    "konverter file",
    "editor video online",
    "alat PDF gratis",
    "tanpa watermark",
  ],
  ja: [
    "Tool2Day",
    "オンラインツール",
    "無料オンラインツール",
    "ファイル変換",
    "動画編集 オンライン",
    "PDFツール 無料",
    "透かしなし",
  ],
  ko: [
    "Tool2Day",
    "온라인 도구",
    "무료 온라인 도구",
    "파일 변환",
    "온라인 영상 편집",
    "무료 PDF 도구",
    "워터마크 없음",
  ],
  "zh-CN": [
    "Tool2Day",
    "在线工具",
    "免费在线工具",
    "文件转换",
    "在线视频编辑",
    "免费PDF工具",
    "无水印",
  ],
  fa: [
    "Tool2Day",
    "ابزارهای آنلاین",
    "ابزار رایگان",
    "مبدل فایل",
    "ویرایشگر ویدیو آنلاین",
    "ابزار PDF رایگان",
    "بدون واترمارک",
  ],
  "zh-TW": [
    "Tool2Day",
    "線上工具",
    "免費線上工具",
    "檔案轉換",
    "線上影片編輯",
    "免費PDF工具",
    "無浮水印",
  ],
  vi: [
    "Tool2Day",
    "công cụ trực tuyến",
    "công cụ miễn phí",
    "chuyển đổi tệp",
    "chỉnh sửa video online",
    "công cụ PDF miễn phí",
    "không watermark",
  ],
  ar: [
    "Tool2Day",
    "tool2day",
    "tool2day.com",
    "أدوات أونلاين",
    "أدوات مجانية",
    "أدوات مجانية أونلاين",
    "تحويل ملفات",
    "محرر فيديو أونلاين",
    "أدوات PDF مجانية",
    "بدون علامة مائية",
  ],
  he: [
    "Tool2Day",
    "כלים אונליין",
    "כלים בחינם",
    "ממיר קבצים",
    "עורך וידאו אונליין",
    "כלי PDF בחינם",
    "ללא סימן מים",
  ],
  hi: [
    "Tool2Day",
    "ऑनलाइन टूल",
    "मुफ़्त ऑनलाइन टूल",
    "फ़ाइल कन्वर्टर",
    "ऑनलाइन वीडियो एडिटर",
    "मुफ़्त PDF टूल",
    "बिना वॉटरमार्क",
  ],
  th: [
    "Tool2Day",
    "เครื่องมือออนไลน์",
    "เครื่องมือฟรี",
    "แปลงไฟล์",
    "ตัดต่อวิดีโอออนไลน์",
    "เครื่องมือ PDF ฟรี",
    "ไม่มีลายน้ำ",
  ],
};

export const siteSeoByLocale: Record<
  LocaleCode,
  { title: string; description: string }
> = {
  en: {
    title: "Tool2Day | Free online file conversion & editing tools",
    description:
      "Free online tools for video, audio, PDF, and files — no watermark. Video editor, converters, PDF tools, AI utilities, and more on Tool2Day.",
  },
  de: {
    title: "Tool2Day | Kostenlose Online-Tools für Dateien & Bearbeitung",
    description:
      "Kostenlose Online-Tools für Video, Audio, PDF und Dateien — ohne Wasserzeichen. Video-Editor, Konverter, PDF-Tools und mehr.",
  },
  es: {
    title: "Tool2Day | Herramientas online gratis para archivos y edición",
    description:
      "Herramientas online gratis para video, audio, PDF y archivos — sin marca de agua. Editor de video, convertidores, PDF y más.",
  },
  pt: {
    title: "Tool2Day | Ferramentas online grátis para arquivos e edição",
    description:
      "Ferramentas online grátis para vídeo, áudio, PDF e arquivos — sem marca d'água. Editor de vídeo, conversores, PDF e mais.",
  },
  it: {
    title: "Tool2Day | Strumenti online gratis per file e editing",
    description:
      "Strumenti online gratis per video, audio, PDF e file — senza filigrana. Editor video, convertitori, PDF e altro.",
  },
  fr: {
    title: "Tool2Day | Outils en ligne gratuits pour fichiers et édition",
    description:
      "Outils en ligne gratuits pour vidéo, audio, PDF et fichiers — sans filigrane. Éditeur vidéo, convertisseurs, PDF et plus.",
  },
  ru: {
    title: "Tool2Day | Бесплатные онлайн-инструменты для файлов",
    description:
      "Бесплатные онлайн-инструменты для видео, аудио, PDF и файлов — без водяного знака. Видеоредактор, конвертеры, PDF и другое.",
  },
  pl: {
    title: "Tool2Day | Darmowe narzędzia online do plików i edycji",
    description:
      "Darmowe narzędzia online do wideo, audio, PDF i plików — bez znaku wodnego. Edytor wideo, konwertery, PDF i więcej.",
  },
  tr: {
    title: "Tool2Day | Ücretsiz online dosya dönüştürme ve düzenleme",
    description:
      "Video, ses, PDF ve dosyalar için ücretsiz online araçlar — filigransız. Video editörü, dönüştürücüler, PDF ve daha fazlası.",
  },
  id: {
    title: "Tool2Day | Alat online gratis untuk file dan pengeditan",
    description:
      "Alat online gratis untuk video, audio, PDF, dan file — tanpa watermark. Editor video, konverter, PDF, dan lainnya.",
  },
  ja: {
    title: "Tool2Day | 無料のオンラインファイル変換・編集ツール",
    description:
      "動画・音声・PDF・ファイル向けの無料オンラインツール。透かしなし。動画編集、変換、PDFなど。",
  },
  ko: {
    title: "Tool2Day | 무료 온라인 파일 변환 및 편집 도구",
    description:
      "동영상, 오디오, PDF, 파일을 위한 무료 온라인 도구 — 워터마크 없음. 영상 편집, 변환, PDF 등.",
  },
  "zh-CN": {
    title: "Tool2Day | 免费在线文件转换与编辑工具",
    description:
      "免费在线视频、音频、PDF 与文件工具 — 无水印。视频编辑、转换器、PDF 等尽在 Tool2Day。",
  },
  fa: {
    title: "Tool2Day | ابزارهای رایگان آنلاین تبدیل و ویرایش فایل",
    description:
      "ابزارهای رایگان آنلاین برای ویدیو، صدا، PDF و فایل‌ها — بدون واترمارک. ویرایشگر ویدیو، مبدل‌ها، PDF و بیشتر.",
  },
  "zh-TW": {
    title: "Tool2Day | 免費線上檔案轉換與編輯工具",
    description:
      "免費線上影片、音訊、PDF 與檔案工具 — 無浮水印。影片編輯、轉換器、PDF 等。",
  },
  vi: {
    title: "Tool2Day | Công cụ trực tuyến miễn phí chuyển đổi & chỉnh sửa",
    description:
      "Công cụ miễn phí cho video, âm thanh, PDF và tệp — không watermark. Trình chỉnh sửa video, chuyển đổi, PDF và hơn thế.",
  },
  ar: {
    title: "Tool2Day | أدوات مجانية أونلاين لتحويل وتحرير الملفات",
    description:
      "أدوات مجانية للفيديو والصوت وPDF والملفات — بدون علامة مائية. محرر فيديو، محولات، أدوات PDF والمزيد على Tool2Day.",
  },
  he: {
    title: "Tool2Day | כלים אונליין בחינם להמרת ועריכת קבצים",
    description:
      "כלים בחינם לווידאו, אודיו, PDF וקבצים — ללא סימן מים. עורך וידאו, ממירים, כלי PDF ועוד.",
  },
  hi: {
    title: "Tool2Day | मुफ़्त ऑनलाइन फ़ाइल रूपांतरण और संपादन टूल",
    description:
      "वीडियो, ऑडियो, PDF और फ़ाइलों के लिए मुफ़्त ऑनलाइन टूल — बिना वॉटरमार्क। वीडियो एडिटर, कन्वर्टर, PDF और अधिक।",
  },
  th: {
    title: "Tool2Day | เครื่องมือออนไลน์ฟรีแปลงและแก้ไขไฟล์",
    description:
      "เครื่องมือฟรีสำหรับวิดีโอ เสียง PDF และไฟล์ — ไม่มีลายน้ำ ตัดต่อวิดีโอ แปลงไฟล์ PDF และอื่นๆ",
  },
};

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = item.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function withSuffixes(base: string, suffixes: string[]): string[] {
  return [base, ...suffixes.map((s) => `${base} ${s}`)];
}

/** Every localized title for a tool across all languages. */
export function getToolTitlesAllLocales(
  slug: string,
  arTitle: string,
): string[] {
  const titles: string[] = [arTitle];
  for (const loc of locales) {
    if (loc.code === "ar") continue;
    const t =
      toolTitlesByLocale[loc.code]?.[slug] ||
      toolTitlesEn[slug] ||
      arTitle;
    titles.push(t);
  }
  return unique(titles);
}

/** Keywords for one tool: all-language titles + intents + brand terms. */
export function buildMultilangToolKeywords(
  slug: string,
  arTitle: string,
  extras: string[] = [],
): string[] {
  const titles = getToolTitlesAllLocales(slug, arTitle);
  const out: string[] = [...extras];

  for (const loc of locales) {
    const title = getToolTitle(slug, loc.code, arTitle);
    const suffixes = intentSuffixesByLocale[loc.code];
    out.push(...withSuffixes(title, suffixes));
    out.push(...localizedTitleKeywords(title, loc.code, suffixes));
    out.push(...brandKeywordsByLocale[loc.code]);
  }

  for (const title of titles) {
    out.push(title);
  }

  return unique(out);
}

/** Full site keyword bank in every supported language. */
export function buildAllSiteKeywordsMultilang(
  existing: string[] = [],
): string[] {
  const out = [...existing];
  for (const loc of locales) {
    out.push(...brandKeywordsByLocale[loc.code]);
    out.push(siteSeoByLocale[loc.code].title);
    out.push(siteSeoByLocale[loc.code].description);
  }
  for (const tool of tools) {
    out.push(
      ...buildMultilangToolKeywords(tool.slug, tool.title),
    );
  }
  return unique(out);
}

export function getLocalizedMetaTitle(
  slug: string,
  locale: LocaleCode,
  arTitle: string,
): string {
  const title = getToolTitle(slug, locale, arTitle);
  const free = intentSuffixesByLocale[locale][0] || "free";
  // Arabic: lead with the searchable tool name people type in Google
  if (locale === "ar") return `${title} مجاناً أونلاين`;
  if (locale === "en") return `${title} — Free online tool`;
  return `${title} — ${free}`;
}

export function getLocalizedMetaDescription(
  slug: string,
  locale: LocaleCode,
  arTitle: string,
  tagline?: string,
  toolDescription?: string,
): string {
  const title = getToolTitle(slug, locale, arTitle);
  const m = getMessages(locale);
  if (locale === "ar") {
    const core =
      toolDescription?.trim() ||
      tagline?.trim() ||
      `${title} مجاناً مباشرة من المتصفح`;
    return `${title} مجاناً — ${core} بدون علامة مائية على Tool2Day.`;
  }
  if (tagline) {
    return `${title} — ${tagline}. ${m.completelyFree}. ${m.noWatermark}. Tool2Day.`;
  }
  return `${title} — ${m.freeInBrowser}. ${m.completelyFree}. ${m.noWatermark}. Tool2Day.`;
}

export function ogLocaleTag(locale: LocaleCode): string {
  const map: Partial<Record<LocaleCode, string>> = {
    en: "en_US",
    ar: "ar_AR",
    de: "de_DE",
    es: "es_ES",
    pt: "pt_BR",
    it: "it_IT",
    fr: "fr_FR",
    ru: "ru_RU",
    pl: "pl_PL",
    tr: "tr_TR",
    id: "id_ID",
    ja: "ja_JP",
    ko: "ko_KR",
    "zh-CN": "zh_CN",
    "zh-TW": "zh_TW",
    fa: "fa_IR",
    vi: "vi_VN",
    he: "he_IL",
    hi: "hi_IN",
    th: "th_TH",
  };
  return map[locale] || locale;
}

export function buildLanguageAlternateMap(
  path = "",
): Record<string, string> {
  const url = `https://www.tool2day.com${path}`;
  const map: Record<string, string> = { "x-default": url };
  for (const loc of locales) {
    map[loc.code] = url;
  }
  return map;
}

/** Self-referencing canonical + hreflang for any site path (e.g. `/pricing`). */
export function sitePageAlternates(path: string) {
  const normalized =
    !path || path === "/"
      ? ""
      : path.startsWith("/")
        ? path.replace(/\/$/, "")
        : `/${path.replace(/\/$/, "")}`;
  const url = `https://www.tool2day.com${normalized}`;
  return {
    canonical: url,
    languages: buildLanguageAlternateMap(normalized),
  };
}

export function buildToolJsonLd(opts: {
  tool: Tool;
  locale: LocaleCode;
  displayTitle: string;
  description: string;
  seo: ToolSeoContent;
}) {
  const { tool, locale, displayTitle, description, seo } = opts;
  const url = `https://www.tool2day.com/tools/${tool.slug}`;
  const alternateName = getToolTitlesAllLocales(tool.slug, tool.title).filter(
    (t) => t !== displayTitle,
  );

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: displayTitle,
      alternateName,
      url,
      description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: locales.map((l) => l.code),
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: {
        "@type": "Organization",
        name: "Tool2Day",
        url: "https://www.tool2day.com",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: seo.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Tool2Day",
          item: "https://www.tool2day.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: displayTitle,
          item: url,
        },
      ],
    },
  ];
}

export function buildHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tool2Day",
    alternateName: [
      "Tool2day Com",
      "tool2day",
      "tool2day.com",
      ...locales.map((l) => siteSeoByLocale[l.code].title),
    ],
    url: "https://www.tool2day.com",
    description: siteSeoByLocale.en.description,
    inLanguage: locales.map((l) => l.code),
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.tool2day.com/#converters",
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Tool2Day",
      url: "https://www.tool2day.com",
      logo: "https://www.tool2day.com/icon-512.png",
    },
    hasPart: tools.map((tool) => {
      const names = getToolTitlesAllLocales(tool.slug, tool.title);
      return {
        "@type": "WebApplication",
        name: names[0],
        alternateName: names.slice(1),
        url: `https://www.tool2day.com/tools/${tool.slug}`,
        applicationCategory: "MultimediaApplication",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      };
    }),
  };
}
