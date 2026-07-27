import type { LocaleCode } from "@/lib/i18n/locales";
import { getMessages, type UiMessages } from "@/lib/i18n/messages";

export type ToolLike = { slug: string; title: string };

export type ToolFaq = { q: string; a: string };

export type ToolSeoContent = {
  /** سطر تحت العنوان */
  tagline: string;
  /** عنوان قسم المقدمة */
  introTitle: string;
  intro: string;
  howTitle: string;
  howIntro: string;
  steps: { title: string; body: string }[];
  moreTitle?: string;
  moreBody?: string;
  whyTitle: string;
  why: { title: string; body: string }[];
  faqs: ToolFaq[];
};

const FREE_WHY_AR = [
  {
    title: "سهل الاستخدام",
    body: "واجهة بسيطة بالعربية تتيح لك البدء ببضع نقرات دون تعقيد.",
  },
  {
    title: "لا حاجة للتحميلات",
    body: "كل شيء يعمل في المتصفح — بدون تثبيت برامج أو إضافات.",
  },
  {
    title: "مجاني بالكامل",
    body: "الأداة مجانية 100٪ للاستخدام دون اشتراك إجباري.",
  },
  {
    title: "بدون علامة مائية",
    body: "الملفات المُصدَّرة نظيفة — لا نضيف شعار Tool2Day على نتيجتك.",
  },
  {
    title: "يعمل على أجهزتك",
    body: "متوافق مع الكمبيوتر والهاتف عبر متصفح حديث.",
  },
  {
    title: "آمن وخاص",
    body: "المعالجة تتم غالباً داخل متصفحك؛ نحترم خصوصية ملفاتك.",
  },
] as const;

function whyFromMessages(m: UiMessages): ToolSeoContent["why"] {
  return [
    { title: m.easyUse, body: m.easyUseBody },
    { title: m.noDownloads, body: m.noDownloadsBody },
    { title: m.completelyFree, body: m.freeBody },
    { title: m.noWatermark, body: m.noWatermarkBody },
    { title: m.worksDevices, body: m.worksDevicesBody },
    { title: m.safePrivate, body: m.safePrivateBody },
  ];
}

function localizedContent(name: string, m: UiMessages): ToolSeoContent {
  return {
    tagline: `${name} — ${m.freeInBrowser}`,
    introTitle: `${name} ${m.onlineTool}`,
    intro: `${name} ${m.onlineIntro}`,
    howTitle: `${m.howUse} ${name}?`,
    howIntro: m.howIntro,
    steps: [
      { title: m.stepOpen, body: m.stepOpenBody },
      { title: m.stepUpload, body: m.stepUploadBody },
      { title: m.stepSettings, body: m.stepSettingsBody },
      { title: m.stepExport, body: m.stepExportBody },
    ],
    moreTitle: m.moreTitle,
    moreBody: m.moreBody,
    whyTitle: m.whyUs,
    why: whyFromMessages(m),
    faqs: [
      { q: m.faqFreeQ.replace("{{tool}}", name), a: m.faqFreeA },
      { q: m.faqWaterQ, a: m.faqWaterA },
      { q: m.faqInstallQ, a: m.faqInstallA },
      { q: m.faqWhereQ, a: m.faqWhereA },
      { q: m.faqFailQ, a: m.faqFailA },
    ],
  };
}

function defaultContentAr(tool: ToolLike): ToolSeoContent {
  const name = tool.title;
  const short = name
    .replace(
      /^(مولد|محوّل|محول|حاسبة|أداة|أدوات|محرر|منسّق|منسق|مستخرج|كاشف|فحص)\s+/u,
      "",
    )
    .trim();
  const searchHint =
    short && short !== name ? `إذا بحثت عن ${short} فأنت في المكان الصحيح. ` : "";
  return {
    tagline: `${name} مجاناً مباشرة من المتصفح`,
    introTitle: `${name} عبر الإنترنت`,
    intro: `${searchHint}${name} على Tool2Day أداة مجانية بالكامل تساعدك على إنجاز مهمتك بسرعة دون تثبيت برامج. ارفع ملفك أو ابدأ مباشرة من المتصفح، ثم صدّر النتيجة بدون أي علامة مائية. مناسب للعمل والدراسة والمحتوى اليومي.`,
    howTitle: `كيف أستخدم ${name}؟`,
    howIntro: "اتبع الخطوات التالية:",
    steps: [
      {
        title: "افتح الأداة",
        body: `ادخل إلى صفحة ${name} على Tool2Day من أي متصفح حديث.`,
      },
      {
        title: "ارفع الملف أو ابدأ",
        body: "اختر ملفك أو استخدم خيارات الأداة الظاهرة في الصفحة حسب نوع المهمة.",
      },
      {
        title: "اضبط الإعدادات",
        body: "حدّد الخيارات المناسبة (الجودة، المدة، الصفحات، الصيغة…) ثم راجعها قبل التشغيل.",
      },
      {
        title: "صدّر مجاناً بدون علامة مائية",
        body: "اضغط ابدأ المعالجة ونزّل النتيجة إلى جهازك — مجاناً وبدون شعار على الملف.",
      },
    ],
    moreTitle: `استخدم ${name} وأنشئ محتوى أفضل`,
    moreBody: `بجانب ${name} ستجد على Tool2Day أدوات فيديو وصوت وPDF ومحولات مجانية تساعدك على إكمال مشروعك من مكان واحد، مع نفس المبدأ: مجاني وبدون علامة مائية.`,
    whyTitle: "لماذا تختارنا",
    why: [...FREE_WHY_AR],
    faqs: [
      {
        q: `هل ${name} مجاني؟`,
        a: "نعم. أداة Tool2Day مجانية بالكامل للاستخدام الأساسي دون إجبارك على باقة مدفوعة.",
      },
      {
        q: short
          ? `أين أجد ${short} أونلاين مجاناً؟`
          : `أين أجد ${name} أونلاين مجاناً؟`,
        a: `على Tool2Day: افتح صفحة ${name} وابدأ مباشرة من المتصفح بدون تسجيل وبدون علامة مائية.`,
      },
      {
        q: "هل تضعون علامة مائية على الملف؟",
        a: "لا. لا نضيف علامة مائية على ملفاتك المُصدَّرة.",
      },
      {
        q: "هل أحتاج تثبيت برنامج؟",
        a: "لا. يكفي متصفح حديث مثل Chrome أو Edge أو Firefox أو Safari.",
      },
      {
        q: "أين تتم المعالجة؟",
        a: "غالباً داخل المتصفح على جهازك قدر الإمكان، لسرعة أعلى وخصوصية أفضل.",
      },
    ],
  };
}

const overrides: Record<string, ToolSeoContent> = {
  "fancy-text": {
    tagline: "زخرفة الأسماء والنصوص مجاناً — يونيكود وإطارات عربية",
    introTitle: "مولد زخرفة الأسماء أونلاين",
    intro:
      "ابحثت عن زخرفة الأسماء؟ مولد زخرفة الأسماء على Tool2Day يحوّل اسمك أو أي نص إلى أنماط يونيكود جاهزة للنسخ — للألعاب، انستغرام، تيك توك، يوتيوب والدسكورد. مجاناً أونلاين وبدون تحميل برامج وبدون علامة مائية.",
    howTitle: "كيف أستخدم مولد زخرفة الأسماء؟",
    howIntro: "ثلاث خطوات فقط:",
    steps: [
      {
        title: "اكتب الاسم أو النص",
        body: "أدخل الاسم الذي تريد زخرفته في الخانة أعلى الصفحة.",
      },
      {
        title: "اختر النمط",
        body: "تصفّح أنماط الزخرفة: عريض، مائل، خط يد، مربعات، دوائر، إطارات عربية والمزيد.",
      },
      {
        title: "انسخ والصق",
        body: "اضغط «نسخ» ثم الصق الاسم المزخرف في اللعبة أو السوشيال ميديا فوراً.",
      },
      {
        title: "جرّب أكثر من شكل",
        body: "يمكنك توليد عشرات الأشكال من نفس الاسم ومقارنة النتيجة قبل النشر.",
      },
    ],
    moreTitle: "زخرفة الأسماء لكل المنصات",
    moreBody:
      "استخدم زخرفة الأسماء لملفّك الشخصي، أسماء الألعاب، البايو، والتعليقات. بجانب مولد زخرفة الأسماء ستجد على Tool2Day أدوات نص ومحتوى مجانية أخرى بدون علامة مائية.",
    whyTitle: "لماذا تختارنا",
    why: [...FREE_WHY_AR],
    faqs: [
      {
        q: "ما أفضل موقع لزخرفة الأسماء؟",
        a: "Tool2Day يقدّم مولد زخرفة الأسماء مجاناً أونلاين مع أنماط يونيكود وإطارات عربية، بدون تسجيل وبدون علامة مائية.",
      },
      {
        q: "هل زخرفة الأسماء مجانية؟",
        a: "نعم. زخرفة الأسماء على Tool2Day مجانية بالكامل ويمكنك النسخ مباشرة من المتصفح.",
      },
      {
        q: "هل تعمل الزخرفة في الألعاب وانستغرام؟",
        a: "معظم الأنماط تعتمد يونيكود وتعمل في الألعاب والمنصات التي تدعم هذه الرموز. إن لم يظهر شكل معيّن، جرّب نمطاً آخر من القائمة.",
      },
      {
        q: "هل أحتاج تحميل تطبيق لزخرفة النص؟",
        a: "لا. مولد زخرفة الأسماء يعمل بالكامل في المتصفح على الجوال والكمبيوتر.",
      },
      {
        q: "هل تدعم الزخرفة العربية والإنجليزية؟",
        a: "نعم. يمكنك زخرفة الأسماء والنصوص بالعربية والإنجليزية والرموز حسب النمط المتاح.",
      },
    ],
  },
  "enhance-video": {
    tagline: "حسّن جودة الفيديو وكبّره حتى 4K — مجاناً في المتصفح",
    introTitle: "تحسين الفيديو عبر الإنترنت",
    intro:
      "أداة تحسين الفيديو على Tool2Day ترفع الدقة حتى 4K مع تنعيم الضوضاء وتوضيح الحواف — مجاناً وبدون علامة مائية، والمعالجة داخل المتصفح.",
    howTitle: "كيف أحسّن فيديو؟",
    howIntro: "اتبع الخطوات التالية:",
    steps: [
      {
        title: "ارفع الفيديو",
        body: "اختر مقطع MP4 أو WebM أو MOV من جهازك.",
      },
      {
        title: "اختر الدقة وقوة التحسين",
        body: "حدد 1080p أو 1440p أو 4K، ثم اختر قوة التحسين — «قوي» يعطي أفضل نتيجة وأبطأ معالجة.",
      },
      {
        title: "ابدأ المعالجة",
        body: "اضغط ابدأ وانتظر حتى يكتمل التحسين والترميز داخل المتصفح.",
      },
      {
        title: "نزّل النتيجة",
        body: "يُحفظ ملف MP4 محسّن على جهازك — مجاناً وبدون علامة مائية.",
      },
    ],
    moreTitle: "بعد التحسين",
    moreBody:
      "يمكنك قص الفيديو أو دمجه أو مواصلة المونتاج في محرر الفيديو على Tool2Day — كل ذلك مجاناً وبدون علامة مائية.",
    whyTitle: "لماذا تختارنا",
    why: [...FREE_WHY_AR],
    faqs: [
      {
        q: "هل يحسّن فعلاً الجودة أم يكبّر الصورة فقط؟",
        a: "الأداة تجمع رفع الدقة مع تنعيم الضوضاء وتوضيح الحواف وتحسين الألوان وترميز عالي الجودة. النتيجة أفضل من التكبير العادي، لكنها ليست ذكاءً اصطناعياً توليدياً يعيد رسم المشهد من الصفر.",
      },
      {
        q: "ما أقصى دقة؟",
        a: "حتى 4K على الجانب الأطول من الإطار (مثلاً 3840 للفيديو الأفقي أو 3840 للارتفاع في العمودي).",
      },
      {
        q: "هل الأداة مجانية وبدون علامة مائية؟",
        a: "نعم. مجانية بالكامل ولا نضع علامة مائية على ملفك.",
      },
      {
        q: "لماذا المعالجة بطيئة؟",
        a: "الترميز عالي الجودة ورفع الدقة إلى 4K ثقيلان داخل المتصفح. جرّب مقطعاً أقصر أو قوة «متوسط» إن احتجت سرعة أكبر.",
      },
    ],
  },
};

export function getToolSeoContent(
  tool: ToolLike,
  opts?: { locale?: LocaleCode; title?: string },
): ToolSeoContent {
  const locale = opts?.locale ?? "en";
  const title = opts?.title ?? tool.title;

  if (locale === "ar") {
    return overrides[tool.slug] ?? defaultContentAr(tool);
  }

  return localizedContent(title, getMessages(locale));
}
