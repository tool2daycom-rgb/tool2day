/** أدوات المطورين والسوشيال ميديا */

export type SocialPlatform = "instagram" | "tiktok" | "youtube" | "x";

export function extractYoutubeId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=|youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{6,})/i,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m?.[1]) return m[1];
  }
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const v = u.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{6,}$/.test(v)) return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function youtubeThumbnailUrls(id: string): {
  label: string;
  url: string;
}[] {
  return [
    { label: "أقصى جودة (maxres)", url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg` },
    { label: "عالية (sd)", url: `https://img.youtube.com/vi/${id}/sddefault.jpg` },
    { label: "متوسطة (hq)", url: `https://img.youtube.com/vi/${id}/hqdefault.jpg` },
    { label: "صغيرة (mq)", url: `https://img.youtube.com/vi/${id}/mqdefault.jpg` },
    { label: "افتراضية", url: `https://img.youtube.com/vi/${id}/default.jpg` },
  ];
}

export function looksLikeInstagram(raw: string): boolean {
  return /instagram\.com\//i.test(raw.trim());
}

const topicTagMap: Record<string, string[]> = {
  تطوير: ["webdev", "programming", "coding", "frontend", "backend", "javascript", "react"],
  ويب: ["webdevelopment", "html", "css", "javascript", "codinglife"],
  ربح: ["makemoneyonline", "sidehustle", "entrepreneur", "business", "passiveincome"],
  تسويق: ["digitalmarketing", "marketing", "socialmediamarketing", "seo", "contentmarketing"],
  طبخ: ["food", "cooking", "recipes", "homecooking", "foodie"],
  سفر: ["travel", "wanderlust", "travelblogger", "explore", "vacation"],
  لياقة: ["fitness", "gym", "workout", "health", "motivation"],
  تقنية: ["tech", "technology", "gadgets", "ai", "innovation"],
  تعليم: ["education", "learning", "study", "tips", "howto"],
  جمال: ["beauty", "makeup", "skincare", "fashion"],
};

function slugifyTag(s: string): string {
  return s
    .trim()
    .replace(/[#\s]+/g, "")
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .slice(0, 40);
}

export function generateHashtags(
  topic: string,
  platform: SocialPlatform,
  count = 30,
): { tag: string; group: string }[] {
  const t = topic.trim();
  if (!t) return [];

  const base = slugifyTag(t);
  const arBase = t.replace(/\s+/g, "");
  const out: { tag: string; group: string }[] = [];
  const seen = new Set<string>();

  const push = (raw: string, group: string) => {
    const tag = slugifyTag(raw);
    if (!tag || seen.has(tag.toLowerCase())) return;
    seen.add(tag.toLowerCase());
    out.push({ tag: `#${tag}`, group });
  };

  push(base, "أساسي");
  push(arBase, "أساسي");
  push(`${base}tips`, "أساسي");
  push(`${base}2026`, "تريند");
  push(`${arBase}نصائح`, "عربي");

  for (const [key, tags] of Object.entries(topicTagMap)) {
    if (t.includes(key) || key.includes(t.slice(0, 3))) {
      for (const x of tags) push(x, "مرتبط");
    }
  }

  const platformExtras: Record<SocialPlatform, string[]> = {
    instagram: [
      "instagood",
      "photooftheday",
      "reels",
      "explorepage",
      "viral",
      "instadaily",
      "love",
      "follow",
    ],
    tiktok: [
      "fyp",
      "foryou",
      "foryoupage",
      "viral",
      "tiktok",
      "trending",
      "xyzbca",
      "capcut",
    ],
    youtube: [
      "youtube",
      "youtuber",
      "subscribe",
      "viralvideo",
      "newvideo",
      "tutorial",
      "howto",
      "shorts",
    ],
    x: ["trending", "news", "thread", "viral", "update", "tips"],
  };

  for (const x of platformExtras[platform]) push(x, "منصة");

  const fillers = [
    "motivation",
    "success",
    "tips",
    "life",
    "daily",
    "community",
    "growth",
    "learn",
    "creator",
    "content",
    "digital",
    "online",
    "free",
    "guide",
    "beginner",
    "pro",
    "hack",
    "strategy",
  ];
  for (const x of fillers) push(`${base}${x}`, "توسيع");

  const arFill = [
    "السعودية",
    "مصر",
    "الخليج",
    "العرب",
    "تعلم",
    "مجاني",
    "نصائح",
    "شرح",
    "دليل",
  ];
  for (const x of arFill) push(`${arBase}${x}`, "عربي");

  return out.slice(0, count);
}

export function formatJson(input: string, pretty = true): string {
  const parsed = JSON.parse(input);
  return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
}

export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

export function encodeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function decodeHtml(input: string): string {
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x27;": "'",
    "&apos;": "'",
  };
  return input.replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&apos;/g,
    (m) => map[m] || m,
  );
}

export type ContentIdeas = {
  topic: string;
  questions: string[];
  comparisons: string[];
  alphabetical: { letter: string; ideas: string[] }[];
  titles: string[];
};

const arabicLetters = "أابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");

export function generateVideoContentIdeas(topic: string): ContentIdeas {
  const t = topic.trim() || "موضوعك";

  const questions = [
    `ما هو ${t}؟`,
    `كيف تبدأ في ${t} من الصفر؟`,
    `لماذا ${t} مهم في 2026؟`,
    `أين تتعلم ${t} مجاناً؟`,
    `متى يكون الوقت مناسباً لبدء ${t}؟`,
    `من يحتاج إلى ${t} حقاً؟`,
    `كيف تحترف ${t} بسرعة؟`,
    `ما أخطاء المبتدئين في ${t}؟`,
    `كيف تربح من ${t}؟`,
    `ما أفضل أدوات ${t}؟`,
    `كيف تختار مسار ${t} المناسب لك؟`,
    `هل ${t} مناسب للمبتدئين؟`,
    `كيف تقيس نجاحك في ${t}؟`,
    `ما الفرق بين ${t} للمبتدئين والمحترفين؟`,
    `كيف تبني خطة أسبوعية لـ ${t}؟`,
  ];

  const comparisons = [
    `مقارنة بين ${t} والطريقة التقليدية`,
    `${t} مقابل البدائل الشائعة — أيهما أفضل؟`,
    `أفضل منصات لـ ${t} مقارنةً ببعضها`,
    `${t} للمبتدئين vs للمحترفين`,
    `مجاني أم مدفوع في عالم ${t}؟`,
    `العمل الحر في ${t} مقابل الوظيفة الثابتة`,
    `أدوات ${t} الرخيصة مقابل الاحترافية`,
    `${t} في الوطن العربي مقارنة بالعالم`,
    `قصير المدى أم طويل المدى في ${t}`,
    `تعلم ${t} وحدك أم مع كورس؟`,
  ];

  const alphabetical = arabicLetters.map((letter) => ({
    letter,
    ideas: [
      `${letter} — أفكار حول ${t} تبدأ بـ «${letter}»`,
      `${letter} — عنوان فيديو: «${letter}سرار ${t} التي لا يخبرك بها أحد»`,
      `${letter} — سؤال للجمهور عن ${t}`,
    ],
  }));

  // أيضاً حروف إنجليزية لأفكار لاتنتهي
  const en = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  for (const letter of en) {
    alphabetical.push({
      letter,
      ideas: [
        `${letter} — ${t} tips starting with ${letter}`,
        `${letter} — Video idea: "${letter} things about ${t}"`,
      ],
    });
  }

  const titles = [
    `${t} للمبتدئين: الدليل الكامل 2026`,
    `كيف تبدأ ${t} اليوم وتتجنّب أكبر 7 أخطاء`,
    `أسرار ${t} التي غيّرت نتائج صنّاع المحتوى`,
    `${t} من صفر إلى احتراف — خطوة بخطوة`,
    `هل يستحق ${t} وقتك؟ الإجابة الصريحة`,
    `أفضل 10 نصائح في ${t} جربتها بنفسي`,
    `${t}: ما لن يخبرك به الكورسات المدفوعة`,
    `خطة 30 يوماً لإتقان ${t}`,
    `تركت الوظائف وبدأت ${t} — هذه قصتي`,
    `${t} في 15 دقيقة فقط (شرح سريع)`,
    `أدوات مجانية لا غنى عنها في ${t}`,
    `لماذا فشل معظم الناس في ${t}؟`,
    `${t} للعرب: فرص حقيقية أم وهم؟`,
    `قبل أن تبدأ ${t} شاهد هذا الفيديو`,
    `أسئلة الجمهور عن ${t} — أجيب عليها كلها`,
    `مقارنة صادقة: طرق ${t} الشائعة`,
    `${t} بدون رأس مال — هل ممكن؟`,
    `روتيني اليومي مع ${t}`,
    `أخطاء قتلت تقدمي في ${t} وكيف أصلحتها`,
    `عنوان فيديو يوتيوب قوي عن ${t} يجلب مشاهدات`,
  ];

  return { topic: t, questions, comparisons, alphabetical, titles };
}

export function contentIdeasToSeoText(ideas: ContentIdeas): string {
  const lines: string[] = [];
  lines.push(`مولد أفكار فيديو: ${ideas.topic}`);
  lines.push("");
  lines.push("## الأسئلة");
  for (const q of ideas.questions) lines.push(`- ${q}`);
  lines.push("");
  lines.push("## المقارنات وحروف الجر");
  for (const c of ideas.comparisons) lines.push(`- ${c}`);
  lines.push("");
  lines.push("## عناوين جاهزة");
  for (const t of ideas.titles) lines.push(`- ${t}`);
  lines.push("");
  lines.push("## أفكار أبجدية");
  for (const block of ideas.alphabetical.slice(0, 40)) {
    lines.push(`### ${block.letter}`);
    for (const i of block.ideas) lines.push(`- ${i}`);
  }
  return lines.join("\n");
}
