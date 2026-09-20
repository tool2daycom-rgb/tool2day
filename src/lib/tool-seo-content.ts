import type { LocaleCode } from "@/lib/i18n/locales";
import { getMessages, type UiMessages } from "@/lib/i18n/messages";
import { findToolFaqByLocale } from "@/lib/seo-tool-phrases";
import { getTool } from "@/lib/tools";

export type ToolLike = {
  slug: string;
  title: string;
  accept?: string;
  description?: string;
};

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
  formatsTitle?: string;
  formatsIntro?: string;
  formats: { label: string; note: string }[];
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
    title: "بدون شعار منا على الملف",
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

/** Derive human-readable supported formats from the tool accept string. */
export function formatsFromAccept(accept?: string): { label: string; note: string }[] {
  const a = (accept || "").toLowerCase();
  if (!a || a === "text/plain") {
    return [
      { label: "نص", note: "إدخال مباشر في الصفحة — لا يلزم رفع ملف." },
      { label: "المتصفح", note: "يعمل على Chrome وEdge وFirefox وSafari الحديثة." },
    ];
  }
  const rows: { label: string; note: string }[] = [];
  if (a.includes("video")) {
    rows.push({
      label: "فيديو",
      note: "MP4 وWebM وMOV والصيغ الشائعة التي يقبلها المتصفح.",
    });
  }
  if (a.includes("audio")) {
    rows.push({
      label: "صوت",
      note: "MP3 وWAV وM4A وOGG حسب دعم المتصفح.",
    });
  }
  if (a.includes("image") || a.includes(".png") || a.includes(".jpg")) {
    rows.push({
      label: "صور",
      note: a.includes("png") && !a.includes("jpeg") && !a.includes("jpg")
        ? "PNG شفاف أو عادي."
        : "JPG وPNG وWebP والصيغ الشائعة.",
    });
  }
  if (a.includes("pdf") || a.includes("application/pdf")) {
    rows.push({
      label: "PDF",
      note: "ملفات PDF قياسية للمعالجة أو التحويل.",
    });
  }
  if (a.includes("epub")) {
    rows.push({
      label: "EPUB",
      note: "كتب إلكترونية غير محمية فقط — لا دعم لتجاوز DRM.",
    });
  }
  if (a.includes("zip") || a.includes("archive")) {
    rows.push({
      label: "أرشيف",
      note: "ZIP والحزم المرتبطة به حسب الأداة.",
    });
  }
  if (a.includes(".doc") || a.includes("word") || a.includes("sheet") || a.includes("ppt")) {
    rows.push({
      label: "مستندات مكتبية",
      note: "صيغ Office الشائعة حسب ما تدعمه الأداة.",
    });
  }
  if (!rows.length) {
    rows.push({
      label: "ملفات مدعومة",
      note: "راجع خيارات الرفع في صفحة الأداة للامتدادات المقبولة.",
    });
  }
  rows.push({
    label: "حدود الاستخدام",
    note: "الملفات الكبيرة جداً قد تفشل في المتصفح؛ جرّب ملفاً أصغر عند الحاجة.",
  });
  return rows;
}

function localizedContent(
  name: string,
  m: UiMessages,
  locale: LocaleCode,
  tool: ToolLike,
): ToolSeoContent {
  const find = findToolFaqByLocale[locale] || findToolFaqByLocale.en;
  const formats = formatsFromAccept(tool.accept);
  const desc = tool.description?.trim();
  return {
    tagline: `${name} — ${m.freeInBrowser}`,
    introTitle: `${name} ${m.onlineTool}`,
    intro: [
      `${name} ${m.onlineIntro} Tool2Day.`,
      desc ? ` ${desc}` : "",
      ` This page explains what the tool does, how to use it step by step, and which formats are supported so you can finish the job without installing desktop software.`,
      ` Keep your own files ready, follow the numbered steps below, and export when processing completes.`,
    ].join(""),
    howTitle: `${m.howUse} ${name}?`,
    howIntro: m.howIntro,
    steps: [
      { title: `1. ${m.stepOpen}`, body: m.stepOpenBody },
      { title: `2. ${m.stepUpload}`, body: m.stepUploadBody },
      { title: `3. ${m.stepSettings}`, body: m.stepSettingsBody },
      { title: `4. ${m.stepExport}`, body: m.stepExportBody },
    ],
    formatsTitle: locale === "en" ? "Supported formats" : "الصيغ المدعومة",
    formatsIntro:
      locale === "en"
        ? "Use this checklist before you upload so the tool can process your file successfully."
        : "راجع هذا الجدول قبل الرفع للتأكد أن ملفك ضمن الصيغ المدعومة.",
    formats,
    moreTitle: m.moreTitle,
    moreBody: m.moreBody,
    whyTitle: m.whyUs,
    why: whyFromMessages(m),
    faqs: [
      { q: m.faqFreeQ.replace(/\{\{tool\}\}/g, name), a: m.faqFreeA },
      {
        q: find.q.replace(/\{\{tool\}\}/g, name),
        a: find.a.replace(/\{\{tool\}\}/g, name),
      },
      { q: m.faqWaterQ, a: m.faqWaterA },
      { q: m.faqInstallQ, a: m.faqInstallA },
      { q: m.faqWhereQ, a: m.faqWhereA },
      { q: m.faqFailQ, a: m.faqFailA },
      {
        q:
          locale === "en"
            ? `Which formats does ${name} support?`
            : `ما الصيغ التي تدعمها ${name}؟`,
        a:
          locale === "en"
            ? formats.map((f) => `${f.label}: ${f.note}`).join(" ")
            : formats.map((f) => `${f.label}: ${f.note}`).join(" "),
      },
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
  const desc = tool.description?.trim() || "";
  const formats = formatsFromAccept(tool.accept);

  return {
    tagline: `${name} مجاناً مباشرة من المتصفح`,
    introTitle: `${name} عبر الإنترنت`,
    intro: [
      searchHint,
      `${name} على Tool2Day أداة مجانية تساعدك على إنجاز مهمتك بسرعة دون تثبيت برامج على جهازك. `,
      desc ? `${desc} ` : "",
      `صُمّمت هذه الصفحة لتوضيح فائدة الأداة وطريقة استخدامها خطوة بخطوة، مع جدول بالصيغ المدعومة وقسم أسئلة شائعة حتى تعرف مسبقاً ما يمكن رفعه وكيف تحصل على أفضل نتيجة. `,
      `ابدأ من المتصفح، راجع الإعدادات والمعاينة إن وُجدت، ثم صدّر الملف إلى جهازك عند اكتمال المعالجة. مناسب للعمل والدراسة وإنتاج المحتوى اليومي مع احترام خصوصية ملفاتك قدر الإمكان. `,
      `إذا احتجت أدوات مرتبطة مثل التحويل أو التحرير أو الضغط، ستجدها أيضاً ضمن دليل Tool2Day دون مغادرة المنصة.`,
    ].join(""),
    howTitle: `كيف أستخدم ${name}؟`,
    howIntro: "اتبع الخطوات بالترتيب:",
    steps: [
      {
        title: "1. افتح الأداة",
        body: `ادخل إلى صفحة ${name} على Tool2Day من أي متصفح حديث وتأكد من اتصال الإنترنت إن كانت الأداة تحتاج موارد خارجية.`,
      },
      {
        title: "2. ارفع الملف أو أدخل البيانات",
        body: "اختر ملفك من الجهاز أو املأ الحقول الظاهرة حسب نوع المهمة، ثم راجع أن الامتداد ضمن الصيغ المدعومة في الجدول أدناه.",
      },
      {
        title: "3. اضبط الإعدادات",
        body: "حدّد الجودة أو المدة أو الصفحات أو الصيغة النهائية إن وُجدت خيارات، ثم راجع المعاينة قبل التشغيل.",
      },
      {
        title: "4. ابدأ المعالجة وصدّر النتيجة",
        body: "اضغط زر البدء وانتظر اكتمال المعالجة داخل المتصفح، ثم نزّل الملف النهائي إلى جهازك.",
      },
    ],
    formatsTitle: "الصيغ المدعومة",
    formatsIntro:
      "استخدم الجدول التالي كمرجع سريع قبل الرفع. إن كان ملفك خارج هذه الصيغ، حوّله أولاً بأداة مناسبة ثم عد إلى هذه الصفحة.",
    formats,
    moreTitle: `نصائح لاستخدام ${name} بشكل أفضل`,
    moreBody: [
      `للحصول على أفضل نتيجة من ${name}، استخدم ملفاً واضحاً وبحجم معقول، وتجنب الملفات التالفة أو الناقصة. `,
      `إن فشلت المعالجة، جرّب متصفحاً محدَّثاً أو ملفاً أصغر أو أعد المحاولة بعد إغلاق التبويبات الثقيلة. `,
      `بجانب هذه الأداة ستجد على Tool2Day محولات وحاسبات ومولدات وأدوات PDF وصوت وفيديو تساعدك على إكمال المشروع من مكان واحد.`,
    ].join(""),
    whyTitle: "لماذا تختارنا",
    why: [...FREE_WHY_AR],
    faqs: [
      {
        q: `هل ${name} مجاني؟`,
        a: "نعم. أداة Tool2Day مجانية للاستخدام الأساسي دون إجبارك على باقة مدفوعة.",
      },
      {
        q: short
          ? `أين أجد ${short} أونلاين مجاناً؟`
          : `أين أجد ${name} أونلاين مجاناً؟`,
        a: `على Tool2Day: افتح صفحة ${name} واتبع الخطوات في هذه الصفحة مباشرة من المتصفح.`,
      },
      {
        q: "هل تضعون شعاراً على الملف الناتج؟",
        a: "لا. لا نضيف شعار Tool2Day على ملفاتك المُصدَّرة.",
      },
      {
        q: "هل أحتاج تثبيت برنامج؟",
        a: "لا. يكفي متصفح حديث مثل Chrome أو Edge أو Firefox أو Safari.",
      },
      {
        q: "أين تتم المعالجة؟",
        a: "غالباً داخل المتصفح على جهازك قدر الإمكان، لسرعة أعلى وخصوصية أفضل.",
      },
      {
        q: `ما الصيغ التي تدعمها ${name}؟`,
        a: formats.map((f) => `${f.label}: ${f.note}`).join(" "),
      },
      {
        q: "ماذا أفعل إذا فشلت المعالجة؟",
        a: "جرّب ملفاً أصغر أو متصفحاً محدَّثاً أو شبكة أخرى، أو تواصل معنا من صفحة المساعدة.",
      },
    ],
  };
}

const overrides: Record<string, ToolSeoContent> = {
  "fancy-text": {
    tagline: "زخرفة الأسماء والنصوص مجاناً — يونيكود وإطارات عربية",
    introTitle: "مولد زخرفة الأسماء أونلاين",
    intro:
      "مولد زخرفة الأسماء على Tool2Day يحوّل اسمك أو أي نص إلى أنماط يونيكود جاهزة للنسخ للاستخدام في الألعاب والملفات الشخصية والتعليقات والبايو. الأداة مجانية وتعمل في المتصفح دون تثبيت برامج. هذه الصفحة تشرح فائدة الزخرفة وخطوات الاستخدام والصيغ المدعومة (إدخال نصي فقط) مع أسئلة شائعة حتى تعرف كيف تختار النمط المناسب قبل النسخ. يمكنك تجربة عشرات الأشكال ومقارنة النتيجة، ثم لصق النص المزخرف حيث تحتاج مع مراعاة أن بعض المنصات قد لا تعرض كل الرموز.",
    howTitle: "كيف أستخدم مولد زخرفة الأسماء؟",
    howIntro: "اتبع الخطوات بالترتيب:",
    steps: [
      {
        title: "1. اكتب الاسم أو النص",
        body: "أدخل الاسم أو الجملة التي تريد زخرفتها في الخانة أعلى الصفحة. يمكنك استخدام العربية أو الإنجليزية حسب النمط.",
      },
      {
        title: "2. اختر النمط",
        body: "تصفّح أنماط الزخرفة: عريض، مائل، خط يد، مربعات، دوائر، إطارات عربية والمزيد، واختر الشكل الأوضح لجمهورك.",
      },
      {
        title: "3. انسخ والصق",
        body: "اضغط «نسخ» ثم الصق الاسم المزخرف في المكان المطلوب. إن لم يظهر الشكل، جرّب نمطاً أبسط يدعمه التطبيق المستهدف.",
      },
      {
        title: "4. جرّب أكثر من شكل",
        body: "ولّد عدة أشكال من نفس النص وقارنها قبل النشر حتى تختار الأنسب للعرض.",
      },
    ],
    formatsTitle: "الصيغ المدعومة",
    formatsIntro: "هذه الأداة نصية بالكامل ولا تتطلب رفع ملفات.",
    formats: [
      { label: "نص عربي/إنجليزي", note: "أي جملة أو اسم تدخله في الحقل." },
      { label: "يونيكود", note: "الأنماط تعتمد رموز يونيكود التي تدعمها معظم المنصات." },
      { label: "بدون ملفات", note: "لا رفع فيديو أو صور — النسخ فقط." },
      { label: "المتصفح", note: "يعمل على Chrome وEdge وFirefox وSafari الحديثة." },
    ],
    moreTitle: "زخرفة الأسماء للاستخدام اليومي",
    moreBody:
      "استخدم الزخرفة لأسماء العرض والألعاب والبايو والتعليقات. احرص على وضوح الاسم حتى يبقى مقروءاً. بجانب هذه الأداة ستجد مولدات نص ومحتوى أخرى على Tool2Day مثل مولد الهاشتاغات ومولد الوصف. إن احتجت مساعدة إضافية راجع صفحة المساعدة أو راسل support@tool2day.com.",
    whyTitle: "لماذا تختارنا",
    why: [...FREE_WHY_AR],
    faqs: [
      {
        q: "هل زخرفة الأسماء مجانية؟",
        a: "نعم. مجانية ويمكنك النسخ مباشرة من المتصفح دون اشتراك إجباري.",
      },
      {
        q: "هل أحتاج تحميل تطبيق؟",
        a: "لا. يعمل بالكامل في المتصفح على الجوال والكمبيوتر.",
      },
      {
        q: "هل تدعم العربية والإنجليزية؟",
        a: "نعم حسب النمط المتاح في القائمة. بعض الأنماط أوضح مع اللاتينية وبعضها مع العربية.",
      },
      {
        q: "لماذا لا يظهر الشكل في تطبيق معيّن؟",
        a: "بعض التطبيقات تقيد رموز يونيكود. جرّب نمطاً أبسط أو تطبيقاً يدعم الرموز.",
      },
      {
        q: "هل تضيفون شعاراً على النص؟",
        a: "لا. النص المنسوخ ملكك دون إضافة شعار Tool2Day.",
      },
    ],
  },
  "social-media-caption": {
    tagline: "مولد وصف للفيديو والمنشورات الاجتماعية — مجاناً",
    introTitle: "مولد وصف الفيديو والسوشيال ميديا",
    intro:
      "هذه الأداة تولّد مسودات أوصاف للمنشورات ومقاطع الفيديو حسب موضوعك. الاسم عام عمداً لتجنب الاعتماد على علامات تجارية في عنوان الصفحة. راجع النص وعدّله قبل النشر ليناسب جمهورك وأسلوبك. الصفحة تشرح الفائدة وخطوات الاستخدام وما تدعمه الأداة (إدخال نصي فقط) مع أسئلة شائعة. استخدم المسودات كنقطة انطلاق ثم أضف تفاصيل محتواك الحقيقي حتى يبقى الوصف أصلياً وواضحاً وغير مكرر.",
    howTitle: "كيف أولّد وصفاً؟",
    howIntro: "اتبع الخطوات بالترتيب:",
    steps: [
      {
        title: "1. اكتب الموضوع",
        body: "أدخل فكرة المنشور أو عنوان الفيديو باختصار وواضح.",
      },
      {
        title: "2. اختر نوع المنصة العام",
        body: "حدد إن كان المنشور قصيراً أو وصف فيديو أطول من القائمة العامة دون الاعتماد على أسماء علامات تجارية في الواجهة.",
      },
      {
        title: "3. ولّد النص",
        body: "اضغط التوليد واقرأ المسودات المقترحة بعناية.",
      },
      {
        title: "4. انسخ وعدّل",
        body: "انسخ النص ثم عدّله يدوياً قبل النشر ليبدو طبيعياً ويعكس محتواك.",
      },
    ],
    formatsTitle: "ما الذي تدعمه الأداة؟",
    formatsIntro: "إدخال نصي فقط — لا رفع ملفات وسائط.",
    formats: [
      { label: "نص الموضوع", note: "كلمة مفتاحية أو جملة قصيرة." },
      { label: "مسودات وصف", note: "نصوص جاهزة للنسخ والتعديل." },
      { label: "بدون وسائط", note: "لا تحميل فيديو أو صور داخل هذه الأداة." },
      { label: "المتصفح", note: "يعمل محلياً في المتصفح دون تثبيت." },
    ],
    moreTitle: "استخدام مسؤول",
    moreBody:
      "لا تستخدم الأداة لانتحال محتوى الغير. اكتب وصفاً يعكس محتواك الحقيقي وتجنب الوعود المضللة. للمزيد من أدوات المحتوى جرّب المولدات الأخرى على Tool2Day، أو تواصل عبر support@tool2day.com إن احتجت مساعدة.",
    whyTitle: "لماذا تختارنا",
    why: [...FREE_WHY_AR],
    faqs: [
      {
        q: "هل الأداة مرتبطة بمنصة معينة؟",
        a: "لا. الاسم عام ويغطي أوصاف الفيديو والمنشورات الاجتماعية بشكل عام.",
      },
      {
        q: "هل النص جاهز للنشر كما هو؟",
        a: "يُفضّل التعديل اليدوي ليناسب نبرتك وجمهورك ويمنع التكرار.",
      },
      {
        q: "هل الاستخدام مجاني؟",
        a: "نعم من المتصفح دون تثبيت أو اشتراك إجباري.",
      },
      {
        q: "هل تحفظون نصوص الموضوع؟",
        a: "المعالجة تتم في المتصفح قدر الإمكان؛ لا نطلب رفع فيديوهاتك هنا.",
      },
      {
        q: "أين أجد المساعدة؟",
        a: "من صفحة المساعدة أو نموذج اتصل بنا على الموقع.",
      },
    ],
  },
  "enhance-video": {
    tagline: "حسّن جودة الفيديو وكبّره حتى 4K — مجاناً في المتصفح",
    introTitle: "تحسين الفيديو عبر الإنترنت",
    intro:
      "أداة تحسين الفيديو على Tool2Day ترفع الدقة حتى 4K مع تنعيم الضوضاء وتوضيح الحواف، والمعالجة داخل المتصفح. الصفحة تشرح الخطوات والصيغ المدعومة قبل الرفع حتى تعرف حدود الأداة: النتيجة أفضل من التكبير العادي في كثير من الحالات، لكنها ليست مولّداً يعيد رسم المشهد من الصفر. استخدم مقطعاً واضحاً وبحجم معقول للحصول على أفضل توازن بين الجودة والسرعة.",
    howTitle: "كيف أحسّن فيديو؟",
    howIntro: "اتبع الخطوات بالترتيب:",
    steps: [
      {
        title: "1. ارفع الفيديو",
        body: "اختر مقطع MP4 أو WebM أو MOV من جهازك وتأكد أنه غير تالف.",
      },
      {
        title: "2. اختر الدقة وقوة التحسين",
        body: "حدد 1080p أو 1440p أو 4K، ثم اختر قوة التحسين المناسبة لجهازك.",
      },
      {
        title: "3. ابدأ المعالجة",
        body: "اضغط ابدأ وانتظر اكتمال التحسين والترميز داخل المتصفح دون إغلاق الصفحة.",
      },
      {
        title: "4. نزّل النتيجة",
        body: "يُحفظ ملف MP4 محسّن على جهازك لمراجعته واستخدامه.",
      },
    ],
    formatsTitle: "الصيغ المدعومة",
    formatsIntro: "ارفع فيديو شائع الصيغة قبل بدء التحسين.",
    formats: [
      { label: "MP4 / WebM / MOV", note: "الصيغ الأكثر توافقاً مع المتصفح." },
      { label: "إخراج", note: "عادةً MP4 بعد المعالجة." },
      { label: "حدود", note: "المقاطع الطويلة جداً قد تكون بطيئة على الأجهزة الضعيفة." },
      { label: "الخصوصية", note: "المعالجة تتم غالباً محلياً في المتصفح." },
    ],
    moreTitle: "بعد التحسين",
    moreBody:
      "يمكنك قص الفيديو أو دمجه أو مواصلة المونتاج في محرر الفيديو على Tool2Day. إن فشلت المعالجة جرّب مقطعاً أقصر أو قوة متوسطة أو متصفحاً محدَّثاً. للمساعدة راسل support@tool2day.com.",
    whyTitle: "لماذا تختارنا",
    why: [...FREE_WHY_AR],
    faqs: [
      {
        q: "هل يحسّن الجودة فعلاً؟",
        a: "يجمع رفع الدقة مع تنعيم الضوضاء وتوضيح الحواف؛ ليس مولّداً يرسم المشهد من الصفر.",
      },
      {
        q: "ما أقصى دقة؟",
        a: "حتى 4K على الجانب الأطول تقريباً حسب إعدادك.",
      },
      {
        q: "لماذا المعالجة بطيئة؟",
        a: "الترميز عالي الجودة ثقيل في المتصفح — جرّب مقطعاً أقصر أو قوة متوسطة.",
      },
      {
        q: "هل تضيفون شعاراً على الفيديو؟",
        a: "لا. لا نضيف شعار Tool2Day على ملفك المُصدَّر.",
      },
      {
        q: "هل الأداة مجانية؟",
        a: "نعم للاستخدام الأساسي من المتصفح.",
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
  const catalog = getTool(tool.slug);
  const enriched: ToolLike = {
    slug: tool.slug,
    title: tool.title,
    accept: tool.accept ?? catalog?.accept,
    description: tool.description ?? catalog?.description,
  };

  if (locale === "ar") {
    return overrides[tool.slug] ?? defaultContentAr(enriched);
  }

  const base = localizedContent(title, getMessages(locale), locale, enriched);
  const arOverride = overrides[tool.slug];
  if (arOverride?.formats?.length) {
    return {
      ...base,
      formatsTitle: locale === "en" ? "Supported formats" : base.formatsTitle,
      formatsIntro: arOverride.formatsIntro || base.formatsIntro,
      formats: arOverride.formats,
    };
  }
  return base;
}
