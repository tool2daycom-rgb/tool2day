import { categoryMeta, tools, type Tool, type ToolCategory } from "@/lib/tools";

/** كلمات العلامة والنية العامة */
export const brandKeywords = [
  "Tool2Day",
  "tool2day",
  "Tool2day Com",
  "tool2day.com",
  "tool",
  "day",
  "٢",
  "أدوات تحويل وتحرير الملفات",
  "الأدوات الإلكترونية لتحويل الفيديو والصوت وPDF والملفات",
  "أدوات أونلاين",
  "أدوات مجانية",
  "أدوات مجانية أونلاين",
  "أدوات بدون تثبيت",
  "أدوات في المتصفح",
  "مجاناً",
  "مجاني",
  "مجاني بالكامل",
  "بدون علامة مائية",
  "بدون علامات مائية",
  "بدون تسجيل",
  "بدون تحميل برامج",
  "بدون اشتراك",
  "الفيديو",
  "الصوت",
  "PDF",
  "المحولات",
  "النص",
  "أدوات يومية",
  "مولدات",
  "أدوات الفيديو",
  "أدوات الصوت",
  "أدوات PDF",
  "محرر ملفات",
  "تحويل ملفات",
  "تحرير ملفات أونلاين",
  "online tools",
  "free online tools",
  "no watermark",
  "browser tools",
] as const;

/** كلمات إضافية لكل فئة */
const categoryExtraKeywords: Record<ToolCategory, string[]> = {
  generators: [
    "مولدات",
    "مولد نصوص",
    "مولد سيرة ذاتية",
    "زخرفة أسماء",
    "مولد رسائل",
    "مولد CSS",
    "generators",
    "fancy text",
    "cv builder",
    "email generator",
    "css generator",
  ],
  video: [
    "تحرير فيديو",
    "محرر فيديو أونلاين",
    "تحرير فيديو مجاني",
    "أدوات فيديو مجانية",
    "video editor online",
    "free video editor",
    "edit video online",
    "MP4",
    "MOV",
    "WebM",
    "AVI",
    "قص فيديو أونلاين",
    "دمج فيديو",
    "تسجيل شاشة أونلاين",
    "تسجيل شاشة مجاني",
    "screen recorder online",
    "online video tools",
    "بدون علامة مائية فيديو",
  ],
  audio: [
    "تحرير صوت",
    "محرر صوت أونلاين",
    "أدوات صوت مجانية",
    "audio editor online",
    "free audio editor",
    "MP3",
    "WAV",
    "AAC",
    "OGG",
    "M4A",
    "قص صوت أونلاين",
    "دمج صوت",
    "تسجيل صوت أونلاين",
    "voice recorder online",
    "online audio tools",
  ],
  pdf: [
    "أدوات PDF مجانية",
    "تحرير PDF أونلاين",
    "محرر PDF مجاني",
    "تحويل PDF",
    "PDF tools free",
    "edit PDF online",
    "compress PDF online",
    "merge PDF free",
    "split PDF online",
    "PDF to Word free",
    "Word to PDF free",
    "JPG to PDF",
    "PDF إلى صورة",
    "حماية PDF",
    "فك قفل PDF",
    "online PDF editor",
  ],
  converters: [
    "محولات ملفات",
    "محول ملفات أونلاين",
    "تحويل صيغ",
    "file converter online",
    "free file converter",
    "convert files online",
    "محول MP3",
    "محول MP4",
    "محول صور",
    "تحويل ZIP",
    "تحويل EPUB",
    "تحويل خطوط",
    "TTF إلى WOFF",
    "font converter online",
  ],
  text: [
    "أدوات النص",
    "تلاعب بالنص",
    "عداد كلمات",
    "تحويل أحرف",
    "text tools",
    "word counter",
    "case converter",
    "find and replace",
  ],
  utilities: [
    "أدوات يومية",
    "فحص سرعة الإنترنت",
    "كاشف أخطاء",
    "speed test",
    "json validator",
    "internet speed test",
    "error detector",
  ],
};

/**
 * مرادفات وبحث شائع لكل أداة (عربي + إنجليزي + صيغ ملفات)
 * تُضاف تلقائياً مع صيغ: مجاناً / مجاني / أونلاين
 */
const toolExtraKeywords: Record<string, string[]> = {
  "video-editor": [
    "محرر فيديو",
    "تعديل فيديو",
    "video editor",
    "timeline video editor",
    "محرر فيديو أونلاين مجاني",
    "كاب كات بديل",
  ],
  "screen-recorder": [
    "تسجيل الشاشة",
    "تسجيل شاشة الكمبيوتر",
    "screen recorder",
    "record screen online",
    "تسجيل شاشة بدون برامج",
    "مسجل شاشة أونلاين",
    "capture screen",
  ],
  "text-to-speech": [
    "تحويل النص إلى كلام",
    "نص إلى صوت",
    "text to speech",
    "TTS",
    "قراءة النص",
    "تحويل كتابة إلى صوت",
    "text to speech arabic",
  ],
  "media-downloader": [
    "تحميل فيديو من رابط",
    "تحميل صورة من رابط",
    "استخراج وسائط",
    "media downloader",
    "download video from url",
    "تحميل ميديا",
    "حفظ فيديو من صفحة",
  ],
  "video-to-text": [
    "تحويل فيديو إلى نص",
    "تفريغ فيديو",
    "كلام الفيديو إلى كتابة",
    "video to text",
    "speech to text",
    "transcription",
    "whisper",
    "تفريغ صوت",
  ],
  "text-tools": [
    "أدوات النص",
    "عداد كلمات أونلاين",
    "تحويل حروف كبيرة صغيرة",
    "استبدال نص",
    "تنظيف نص",
  ],
  "error-detector": [
    "كاشف أخطاء JSON",
    "فحص JSON",
    "json lint",
    "التحقق من رابط",
    "فحص كود",
  ],
  "speed-test": [
    "فحص سرعة الإنترنت",
    "اختبار سرعة النت",
    "speed test",
    "قياس سرعة التحميل",
    "ping",
  ],
  "cv-builder": [
    "مولد سيرة ذاتية",
    "سيرة ذاتية أونلاين",
    "cv builder",
    "resume generator",
    "كتابة CV",
  ],
  "fancy-text": [
    "زخرفة أسماء",
    "زخرفة نص",
    "أسماء ألعاب",
    "fancy text",
    "nickname generator",
    "أسماء انستغرام",
  ],
  "email-generator": [
    "مولد رسائل بريد",
    "رسالة تقديم وظيفة",
    "رسالة اعتذار",
    "email templates",
    "cover email",
  ],
  "css-generator": [
    "مولد CSS",
    "مولد أزرار CSS",
    "تدرج لوني CSS",
    "box shadow generator",
    "css button generator",
  ],
  "merge-videos": [
    "دمج فيديوهات",
    "جمع فيديوهات",
    "merge videos",
    "video joiner",
    "دمج MP4",
    "لصق فيديوهات",
  ],
  "trim-video": [
    "قص فيديو",
    "تشذيب فيديو",
    "قطع فيديو",
    "trim video",
    "cut video online",
    "قص مقطع فيديو",
  ],
  "add-audio-to-video": [
    "إضافة موسيقى للفيديو",
    "دمج صوت مع فيديو",
    "add audio to video",
    "إضافة تعليق صوتي",
    "موسيقى خلفية فيديو",
  ],
  "add-image-to-video": [
    "إضافة صورة للفيديو",
    "دمج صورة مع فيديو",
    "add image to video",
    "overlay image video",
  ],
  "add-text-to-video": [
    "إضافة كتابة على الفيديو",
    "ترجمة على الفيديو",
    "add text to video",
    "عناوين فيديو",
    "caption video",
  ],
  "remove-logo": [
    "إزالة لوجو من فيديو",
    "حذف شعار فيديو",
    "remove watermark from video",
    "إزالة علامة مائية من فيديو",
    "remove logo video",
  ],
  "crop-video": [
    "قص إطار فيديو",
    "اقتصاص فيديو",
    "crop video",
    "قص نسبة الفيديو",
    "9:16 فيديو",
  ],
  "rotate-video": [
    "تدوير فيديو",
    "قلب اتجاه فيديو",
    "rotate video",
    "فيديو بالعرض",
    "فيديو بالطول",
  ],
  "flip-video": [
    "مرآة فيديو",
    "عكس فيديو",
    "flip video",
    "mirror video",
  ],
  "resize-video": [
    "تغيير أبعاد فيديو",
    "تصغير فيديو",
    "resize video",
    "1080p",
    "720p",
    "حجم فيديو لإنستغرام",
    "فيديو تيك توك",
  ],
  "loop-video": [
    "تكرار فيديو",
    "فيديو لوب",
    "loop video",
    "إعادة تشغيل فيديو",
  ],
  "change-video-volume": [
    "رفع صوت فيديو",
    "تخفيض صوت فيديو",
    "change video volume",
    "volume booster video",
  ],
  "change-video-speed": [
    "تسريع فيديو",
    "تبطيء فيديو",
    "change video speed",
    "slow motion video",
    "speed up video",
  ],
  "stabilize-video": [
    "تثبيت اهتزاز فيديو",
    "stabilize video",
    "video stabilizer",
    "فيديو ثابت",
  ],
  "enhance-video": [
    "تحسين جودة الفيديو",
    "رفع جودة فيديو",
    "فيديو 4K",
    "upscale video 4k",
    "enhance video quality",
    "تحسين وضوح فيديو",
    "video enhancer online",
    "رفع دقة فيديو",
  ],
  "video-recorder": [
    "تسجيل فيديو من الكاميرا",
    "webcam recorder",
    "record video online",
    "مسجل كاميرا",
  ],
  "trim-audio": [
    "قص صوت",
    "قص MP3",
    "trim audio",
    "cut mp3",
    "تشذيب صوت",
  ],
  "change-audio-volume": [
    "رفع الصوت",
    "تخفيض الصوت",
    "audio volume booster",
    "تغيير مستوى MP3",
  ],
  "change-audio-speed": [
    "تسريع صوت",
    "تبطيء صوت",
    "change audio speed",
    "speed up mp3",
  ],
  "change-pitch": [
    "تغيير طبقة الصوت",
    "pitch changer",
    "رفع طبقة الصوت",
    "voice pitch",
  ],
  equalizer: [
    "إيكوالايزر",
    "equalizer online",
    "معادل صوتي أونلاين",
    "bass booster",
  ],
  "reverse-audio": [
    "عكس MP3",
    "reverse audio",
    "تشغيل صوت بالعكس",
  ],
  "voice-recorder": [
    "تسجيل صوت",
    "مسجل مايك",
    "voice recorder",
    "record voice online",
    "تسجيل ميكروفون",
  ],
  "audio-joiner": [
    "دمج MP3",
    "جمع ملفات صوتية",
    "merge audio",
    "audio joiner",
    "لصق أصوات",
  ],
  "pdf-editor": [
    "تعديل PDF",
    "edit PDF",
    "PDF editor free",
    "كتابة على PDF",
    "إضافة صورة لـ PDF",
  ],
  "pdf-split": [
    "فصل صفحات PDF",
    "split PDF",
    "تقسيم ملف PDF",
    "استخراج صفحات PDF",
  ],
  "pdf-merge": [
    "جمع ملفات PDF",
    "merge PDF",
    "دمج ملفات PDF",
    "PDF joiner",
  ],
  "pdf-compress": [
    "تصغير حجم PDF",
    "compress PDF",
    "ضغط ملف PDF",
    "reduce PDF size",
  ],
  "pdf-unlock": [
    "فك قفل PDF",
    "unlock PDF",
    "إزالة كلمة مرور PDF",
    "remove PDF password",
  ],
  "pdf-protect": [
    "قفل PDF",
    "protect PDF",
    "كلمة مرور PDF",
    "encrypt PDF",
  ],
  "pdf-rotate": [
    "تدوير صفحات PDF",
    "rotate PDF",
    "قلب صفحة PDF",
  ],
  "pdf-page-numbers": [
    "ترقيم صفحات PDF",
    "add page numbers PDF",
    "أرقام صفحات PDF",
  ],
  "pdf-to-word": [
    "تحويل PDF إلى وورد",
    "PDF to DOCX",
    "PDF to Word converter",
    "pdf الى word",
  ],
  "pdf-to-excel": [
    "تحويل PDF إلى إكسل",
    "PDF to XLSX",
    "PDF to Excel converter",
    "pdf الى excel",
  ],
  "pdf-to-jpg": [
    "تحويل PDF إلى صورة",
    "PDF to JPG converter",
    "pdf الى jpg",
    "PDF to JPEG",
  ],
  "pdf-to-png": [
    "تحويل PDF إلى PNG",
    "PDF to PNG converter",
    "pdf الى png",
  ],
  "word-to-pdf": [
    "تحويل وورد إلى PDF",
    "DOCX to PDF",
    "Word to PDF converter",
    "word الى pdf",
  ],
  "jpg-to-pdf": [
    "تحويل صورة إلى PDF",
    "JPG to PDF converter",
    "PNG to PDF",
    "صور إلى PDF",
  ],
  "excel-to-pdf": [
    "تحويل إكسل إلى PDF",
    "XLSX to PDF",
    "Excel to PDF converter",
    "excel الى pdf",
  ],
  "ppt-to-pdf": [
    "تحويل باوربوينت إلى PDF",
    "PPTX to PDF",
    "PowerPoint to PDF",
    "ppt الى pdf",
  ],
  "audio-converter": [
    "تحويل صوت",
    "MP3 converter",
    "WAV to MP3",
    "M4A to MP3",
    "محول MP3 مجاني",
    "audio converter free",
  ],
  "video-converter": [
    "تحويل فيديو",
    "MP4 converter",
    "MOV to MP4",
    "AVI to MP4",
    "محول فيديو مجاني",
    "video converter free",
  ],
  "image-converter": [
    "تحويل صور",
    "JPG to PNG",
    "PNG to JPG",
    "WebP converter",
    "محول صور مجاني",
    "image converter free",
  ],
  "document-converter": [
    "تحويل مستندات",
    "DOC to PDF",
    "document converter",
    "تحويل ملفات أوفيس",
  ],
  "archive-converter": [
    "تحويل أرشيف",
    "ZIP to RAR",
    "RAR to ZIP",
    "7z converter",
    "archive converter",
  ],
  "ebook-converter": [
    "تحويل كتب إلكترونية",
    "EPUB to PDF",
    "MOBI to EPUB",
    "ebook converter",
    "تحويل EPUB",
  ],
  "archive-extractor": [
    "فك ضغط",
    "استخراج ZIP",
    "unzip online",
    "extract RAR",
    "فتح ملف مضغوط",
    "فك ضغط 7z",
  ],
  "font-converter": [
    "تحويل خطوط",
    "TTF to WOFF",
    "OTF to TTF",
    "WOFF2 converter",
    "font converter free",
    "محول خطوط مجاني",
    "تحويل خط",
  ],
};

const INTENT_SUFFIXES = [
  "مجاناً",
  "مجاني",
  "أونلاين",
  "مجاني أونلاين",
  "بدون علامة مائية",
  "بدون تحميل",
] as const;

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

function withIntentVariants(base: string): string[] {
  return [
    base,
    ...INTENT_SUFFIXES.map((s) => `${base} ${s}`),
  ];
}

/** كل أداة + «مجاناً» — مثل: محوّل الخطوط مجاناً */
export function toolFreeKeyword(title: string) {
  return `${title} مجاناً`;
}

export function getToolKeywords(tool: Tool): string[] {
  const cat = categoryMeta[tool.category];
  const extras = toolExtraKeywords[tool.slug] ?? [];
  return unique([
    ...withIntentVariants(tool.title),
    ...extras.flatMap((k) => withIntentVariants(k)),
    cat.label,
    cat.sectionTitle,
    ...categoryExtraKeywords[tool.category],
    ...brandKeywords,
  ]);
}

export function getAllSiteKeywords(): string[] {
  const fromTools = tools.flatMap((tool) => {
    const extras = toolExtraKeywords[tool.slug] ?? [];
    return [
      tool.title,
      toolFreeKeyword(tool.title),
      `${tool.title} مجاني`,
      `${tool.title} أونلاين`,
      ...extras,
    ];
  });
  const fromCategories = (
    Object.keys(categoryExtraKeywords) as ToolCategory[]
  ).flatMap((c) => [
    categoryMeta[c].label,
    categoryMeta[c].sectionTitle,
    ...categoryExtraKeywords[c],
  ]);
  return unique([...brandKeywords, ...fromCategories, ...fromTools]);
}

export function getToolPageTitle(tool: Tool) {
  return toolFreeKeyword(tool.title);
}

export function getToolPageDescription(tool: Tool, tagline?: string) {
  const free = toolFreeKeyword(tool.title);
  const base =
    tagline?.trim() ||
    tool.description ||
    `${tool.title} أونلاين في المتصفح.`;
  return `${free} — ${base} مجاني بالكامل وبدون علامة مائية على Tool2Day.`;
}

export const siteSeo = {
  title: "Tool2Day | أدوات تحويل وتحرير الملفات مجاناً",
  description:
    "Tool2Day — الأدوات الإلكترونية لتحويل وتحرير الفيديو والصوت وPDF والملفات مجاناً وبدون علامة مائية. محرر فيديو، مسجل شاشة، محوّل خطوط، أدوات PDF والمزيد.",
} as const;
