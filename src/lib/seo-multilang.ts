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
import { localizedTitleKeywords, shortenLocalizedTitle } from "@/lib/seo-tool-phrases";

/** High-intent suffixes appended to tool names per language (SEO). */
export const intentSuffixesByLocale: Record<LocaleCode, string[]> = {
  en: [
    "free",
    "online",
    "free online",
    "in browser",
    "online free",
    "no install",
    "web app",
  ],
  de: [
    "kostenlos",
    "online",
    "kostenlos online",
    "im Browser",
    "ohne Installation",
    "Web-App",
  ],
  es: [
    "gratis",
    "online",
    "gratis online",
    "en el navegador",
    "sin instalar",
    "app web",
  ],
  pt: [
    "grátis",
    "online",
    "grátis online",
    "no navegador",
    "sem instalar",
    "app web",
  ],
  it: [
    "gratis",
    "online",
    "gratis online",
    "nel browser",
    "senza installazione",
    "app web",
  ],
  fr: [
    "gratuit",
    "en ligne",
    "gratuit en ligne",
    "dans le navigateur",
    "sans installation",
    "application web",
  ],
  ru: [
    "бесплатно",
    "онлайн",
    "бесплатно онлайн",
    "в браузере",
    "без установки",
    "веб-приложение",
  ],
  pl: [
    "za darmo",
    "online",
    "za darmo online",
    "w przeglądarce",
    "bez instalacji",
    "aplikacja web",
  ],
  tr: [
    "ücretsiz",
    "çevrimiçi",
    "ücretsiz online",
    "tarayıcıda",
    "kurulumsuz",
    "web uygulaması",
  ],
  id: [
    "gratis",
    "online",
    "gratis online",
    "di browser",
    "tanpa instalasi",
    "aplikasi web",
  ],
  ja: [
    "無料",
    "オンライン",
    "無料オンライン",
    "ブラウザ",
    "インストール不要",
    "ウェブアプリ",
  ],
  ko: [
    "무료",
    "온라인",
    "무료 온라인",
    "브라우저",
    "설치 없음",
    "웹앱",
  ],
  "zh-CN": [
    "免费",
    "在线",
    "免费在线",
    "浏览器",
    "无需安装",
    "网页工具",
  ],
  fa: [
    "رایگان",
    "آنلاین",
    "رایگان آنلاین",
    "در مرورگر",
    "بدون نصب",
    "وب‌اپ",
  ],
  "zh-TW": [
    "免費",
    "線上",
    "免費線上",
    "瀏覽器",
    "免安裝",
    "網頁工具",
  ],
  vi: [
    "miễn phí",
    "trực tuyến",
    "miễn phí online",
    "trên trình duyệt",
    "không cần cài",
    "ứng dụng web",
  ],
  ar: [
    "مجاناً",
    "مجاني",
    "أونلاين",
    "مجاني أونلاين",
    "بدون تحميل",
    "في المتصفح",
    "بدون تثبيت",
    "بدون تسجيل",
  ],
  he: [
    "בחינם",
    "אונליין",
    "בחינם אונליין",
    "בדפדפן",
    "בלי התקנה",
    "אפליקציית ווב",
  ],
  hi: [
    "मुफ़्त",
    "ऑनलाइन",
    "मुफ़्त ऑनलाइन",
    "ब्राउज़र में",
    "बिना इंस्टॉल",
    "वेब ऐप",
  ],
  th: [
    "ฟรี",
    "ออนไลน์",
    "ฟรีออนไลน์",
    "ในเบราว์เซอร์",
    "ไม่ต้องติดตั้ง",
    "เว็บแอป",
  ],
};

/** Brand / category discovery terms per locale. */
export const brandKeywordsByLocale: Record<LocaleCode, string[]> = {
  en: [
    "Tool2Day",
    "tool2day",
    "tool2day.com",
    "online tools",
    "free online tools",
    "browser tools",
    "file converter",
    "video editor online",
    "audio editor online",
    "PDF tools free",
    "image converter free",
    "AI tools online",
    "online calculators",
    "generators free",
    "trim video online",
    "compress PDF online",
    "remove background online",
    "text to speech online",
  ],
  de: [
    "Tool2Day",
    "Online-Tools",
    "kostenlose Online-Tools",
    "Browser-Tools",
    "Dateikonverter",
    "Video-Editor online",
    "Audio-Editor online",
    "PDF-Tools kostenlos",
    "Bildkonverter kostenlos",
    "KI-Tools online",
    "Online-Rechner",
    "Video schneiden online",
    "PDF komprimieren online",
    "Hintergrund entfernen online",
  ],
  es: [
    "Tool2Day",
    "herramientas online",
    "herramientas gratis",
    "herramientas en el navegador",
    "convertidor de archivos",
    "editor de video online",
    "editor de audio online",
    "herramientas PDF gratis",
    "convertidor de imágenes gratis",
    "herramientas IA online",
    "calculadoras online",
    "recortar video online",
    "comprimir PDF online",
    "quitar fondo online",
  ],
  pt: [
    "Tool2Day",
    "ferramentas online",
    "ferramentas grátis",
    "ferramentas no navegador",
    "conversor de arquivos",
    "editor de vídeo online",
    "editor de áudio online",
    "ferramentas PDF grátis",
    "conversor de imagens grátis",
    "ferramentas IA online",
    "calculadoras online",
    "cortar vídeo online",
    "comprimir PDF online",
    "remover fundo online",
  ],
  it: [
    "Tool2Day",
    "strumenti online",
    "strumenti gratis",
    "strumenti nel browser",
    "convertitore file",
    "editor video online",
    "editor audio online",
    "strumenti PDF gratis",
    "convertitore immagini gratis",
    "strumenti IA online",
    "calcolatrici online",
    "taglia video online",
    "comprimi PDF online",
    "rimuovi sfondo online",
  ],
  fr: [
    "Tool2Day",
    "outils en ligne",
    "outils gratuits",
    "outils navigateur",
    "convertisseur de fichiers",
    "éditeur vidéo en ligne",
    "éditeur audio en ligne",
    "outils PDF gratuits",
    "convertisseur d'images gratuit",
    "outils IA en ligne",
    "calculateurs en ligne",
    "couper vidéo en ligne",
    "compresser PDF en ligne",
    "supprimer arrière-plan en ligne",
  ],
  ru: [
    "Tool2Day",
    "онлайн инструменты",
    "бесплатные онлайн инструменты",
    "инструменты в браузере",
    "конвертер файлов",
    "видеоредактор онлайн",
    "аудиоредактор онлайн",
    "PDF инструменты бесплатно",
    "конвертер изображений бесплатно",
    "ИИ инструменты онлайн",
    "онлайн калькуляторы",
    "обрезать видео онлайн",
    "сжать PDF онлайн",
    "удалить фон онлайн",
  ],
  pl: [
    "Tool2Day",
    "narzędzia online",
    "darmowe narzędzia",
    "narzędzia w przeglądarce",
    "konwerter plików",
    "edytor wideo online",
    "edytor audio online",
    "narzędzia PDF za darmo",
    "konwerter obrazów za darmo",
    "narzędzia AI online",
    "kalkulatory online",
    "przytnij wideo online",
    "skompresuj PDF online",
    "usuń tło online",
  ],
  tr: [
    "Tool2Day",
    "çevrimiçi araçlar",
    "ücretsiz online araçlar",
    "tarayıcı araçları",
    "dosya dönüştürücü",
    "online video editörü",
    "online ses editörü",
    "ücretsiz PDF araçları",
    "ücretsiz görsel dönüştürücü",
    "online yapay zeka araçları",
    "online hesap makineleri",
    "online video kırpma",
    "online PDF sıkıştırma",
    "online arka plan silme",
  ],
  id: [
    "Tool2Day",
    "alat online",
    "alat gratis",
    "alat di browser",
    "konverter file",
    "editor video online",
    "editor audio online",
    "alat PDF gratis",
    "konverter gambar gratis",
    "alat AI online",
    "kalkulator online",
    "potong video online",
    "kompres PDF online",
    "hapus background online",
  ],
  ja: [
    "Tool2Day",
    "オンラインツール",
    "無料オンラインツール",
    "ブラウザツール",
    "ファイル変換",
    "動画編集 オンライン",
    "音声編集 オンライン",
    "PDFツール 無料",
    "画像変換 無料",
    "AIツール オンライン",
    "オンライン計算機",
    "動画トリミング オンライン",
    "PDF圧縮 オンライン",
    "背景削除 オンライン",
  ],
  ko: [
    "Tool2Day",
    "온라인 도구",
    "무료 온라인 도구",
    "브라우저 도구",
    "파일 변환",
    "온라인 영상 편집",
    "온라인 오디오 편집",
    "무료 PDF 도구",
    "무료 이미지 변환",
    "온라인 AI 도구",
    "온라인 계산기",
    "온라인 영상 자르기",
    "온라인 PDF 압축",
    "온라인 배경 제거",
  ],
  "zh-CN": [
    "Tool2Day",
    "在线工具",
    "免费在线工具",
    "浏览器工具",
    "文件转换",
    "在线视频编辑",
    "在线音频编辑",
    "免费PDF工具",
    "免费图片转换",
    "在线AI工具",
    "在线计算器",
    "在线裁剪视频",
    "在线压缩PDF",
    "在线抠图",
  ],
  fa: [
    "Tool2Day",
    "ابزارهای آنلاین",
    "ابزار رایگان",
    "ابزار مرورگر",
    "مبدل فایل",
    "ویرایشگر ویدیو آنلاین",
    "ویرایشگر صدا آنلاین",
    "ابزار PDF رایگان",
    "مبدل تصویر رایگان",
    "ابزار هوش مصنوعی آنلاین",
    "ماشین‌حساب آنلاین",
    "برش ویدیو آنلاین",
    "فشرده‌سازی PDF آنلاین",
    "حذف پس‌زمینه آنلاین",
  ],
  "zh-TW": [
    "Tool2Day",
    "線上工具",
    "免費線上工具",
    "瀏覽器工具",
    "檔案轉換",
    "線上影片編輯",
    "線上音訊編輯",
    "免費PDF工具",
    "免費圖片轉換",
    "線上AI工具",
    "線上計算機",
    "線上裁剪影片",
    "線上壓縮PDF",
    "線上去背",
  ],
  vi: [
    "Tool2Day",
    "công cụ trực tuyến",
    "công cụ miễn phí",
    "công cụ trình duyệt",
    "chuyển đổi tệp",
    "chỉnh sửa video online",
    "chỉnh sửa âm thanh online",
    "công cụ PDF miễn phí",
    "chuyển đổi ảnh miễn phí",
    "công cụ AI online",
    "máy tính online",
    "cắt video online",
    "nén PDF online",
    "xóa nền online",
  ],
  ar: [
    "Tool2Day",
    "tool2day",
    "tool2day.com",
    "أدوات أونلاين",
    "أدوات مجانية",
    "أدوات مجانية أونلاين",
    "أدوات في المتصفح",
    "تحويل ملفات",
    "محرر فيديو أونلاين",
    "محرر صوت أونلاين",
    "أدوات PDF مجانية",
    "محول صور مجاني",
    "أدوات ذكاء اصطناعي",
    "حاسبات أونلاين",
    "قص فيديو أونلاين",
    "ضغط PDF أونلاين",
    "إزالة خلفية أونلاين",
    "تحويل نص إلى كلام",
  ],
  he: [
    "Tool2Day",
    "כלים אונליין",
    "כלים בחינם",
    "כלים בדפדפן",
    "ממיר קבצים",
    "עורך וידאו אונליין",
    "עורך אודיו אונליין",
    "כלי PDF בחינם",
    "ממיר תמונות בחינם",
    "כלי AI אונליין",
    "מחשבונים אונליין",
    "חיתוך וידאו אונליין",
    "דחיסת PDF אונליין",
    "הסרת רקע אונליין",
  ],
  hi: [
    "Tool2Day",
    "ऑनलाइन टूल",
    "मुफ़्त ऑनलाइन टूल",
    "ब्राउज़र टूल",
    "फ़ाइल कन्वर्टर",
    "ऑनलाइन वीडियो एडिटर",
    "ऑनलाइन ऑडियो एडिटर",
    "मुफ़्त PDF टूल",
    "मुफ़्त इमेज कन्वर्टर",
    "ऑनलाइन AI टूल",
    "ऑनलाइन कैलकुलेटर",
    "ऑनलाइन वीडियो ट्रिम",
    "ऑनलाइन PDF कंप्रेस",
    "ऑनलाइन बैकग्राउंड रिमूव",
  ],
  th: [
    "Tool2Day",
    "เครื่องมือออนไลน์",
    "เครื่องมือฟรี",
    "เครื่องมือในเบราว์เซอร์",
    "แปลงไฟล์",
    "ตัดต่อวิดีโอออนไลน์",
    "ตัดต่อเสียงออนไลน์",
    "เครื่องมือ PDF ฟรี",
    "แปลงรูปภาพฟรี",
    "เครื่องมือ AI ออนไลน์",
    "เครื่องคิดเลขออนไลน์",
    "ตัดวิดีโอออนไลน์",
    "บีบอัด PDF ออนไลน์",
    "ลบพื้นหลังออนไลน์",
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
    // Lean brand slice per locale — avoid dumping full discovery bank on every tool.
    out.push(...brandKeywordsByLocale[loc.code].slice(0, 6));
  }

  for (const title of titles) {
    out.push(title);
  }

  return unique(out);
}

/**
 * Lean multilang keywords for <meta name="keywords"> on tool pages:
 * every locale title + top intent suffixes (no full brand dump).
 */
export function buildLeanMultilangToolKeywords(
  slug: string,
  arTitle: string,
  extras: string[] = [],
): string[] {
  const out: string[] = [...extras, arTitle];
  for (const loc of locales) {
    const title = getToolTitle(slug, loc.code, arTitle);
    out.push(title);
    const suffixes = intentSuffixesByLocale[loc.code].slice(0, 4);
    for (const s of suffixes) {
      out.push(`${title} ${s}`);
    }
    out.push(...shortenLocalizedTitle(title, loc.code));
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

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: displayTitle,
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
    alternateName: ["Tool2day Com", "tool2day", "tool2day.com"],
    url: "https://www.tool2day.com",
    description: siteSeoByLocale.en.description,
    inLanguage: "en",
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
    hasPart: tools
      .filter((tool) => !tool.hidden)
      .map((tool) => ({
        "@type": "WebApplication",
        name: getToolTitle(tool.slug, "en", tool.title),
        url: `https://www.tool2day.com/tools/${tool.slug}`,
        applicationCategory: "MultimediaApplication",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      })),
  };
}
