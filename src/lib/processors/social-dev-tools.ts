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
  // خانة واحدة فقط — أقصى جودة (maxres)
  return [
    {
      label: "أقصى جودة (maxres)",
      url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    },
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

export type YoutubeTrendVideo = {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail: string | null;
  url: string;
  order: "relevance" | "viewCount" | "date";
};

export type ContentIdeas = {
  topic: string;
  questions: string[];
  comparisons: string[];
  alphabetical: { letter: string; ideas: string[] }[];
  titles: string[];
  youtube: YoutubeTrendVideo[];
  source: "google" | "local" | "google+youtube";
};

const arabicLetters = "أابتثجحخدذرزسشصضطظعغفقكلمنهوي".split("");

/** بادئات استفهام تُدمَج مع الكلمة ثم تُرسل لـ Google Suggest */
export const QUESTION_PREFIXES = [
  "كيف",
  "ما هو",
  "ما هي",
  "أين",
  "متى",
  "لماذا",
  "أفضل",
  "هل",
  "من",
  "طريقة",
  "شرح",
  "أخطاء",
] as const;

export const COMPARISON_PREFIXES = [
  "مقارنة بين",
  "مقابل",
  "الفرق بين",
  "أفضل من",
  "بدون",
  "للمبتدئين",
  "vs",
] as const;

export function buildSuggestQueries(topic: string): string[] {
  const t = topic.trim();
  if (!t) return [];
  const qs: string[] = [t];

  // إذا بدأ الموضوع بأداة استفهام لا نضاعفها
  const startsWithQ = /^(كيف|ما\s*هو|ما\s*هي|أين|متى|لماذا|هل|من|أفضل)\b/i.test(
    t,
  );

  if (!startsWithQ) {
    for (const p of QUESTION_PREFIXES) qs.push(`${p} ${t}`);
  } else {
    // الموضوع أصلاً سؤال — نقترح تكملات مباشرة
    qs.push(t, `${t} `, `أفضل ${t}`, `شرح ${t}`);
  }

  for (const p of COMPARISON_PREFIXES) qs.push(`${p} ${t}`);

  // أبجدية عربية: حرف + الموضوع
  for (const letter of arabicLetters.slice(0, 14)) {
    qs.push(`${t} ${letter}`);
  }
  // حروف إنجليزية شائعة للعناوين
  for (const letter of "ABCDEFGHIJ") {
    qs.push(`${t} ${letter}`);
  }

  return [...new Set(qs)].slice(0, 36);
}

function uniqKeepOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.replace(/\s+/g, " ").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function capitalizeTitle(s: string): string {
  const t = s.trim();
  if (!t) return t;
  // عناوين فيديو خفيفة من اقتراح البحث
  if (/[؟?]$/.test(t)) return t;
  if (t.length < 40) return `${t} — شرح كامل`;
  return t;
}

export function assembleContentIdeasFromSuggest(
  topic: string,
  results: Record<string, string[]>,
): ContentIdeas {
  const t = topic.trim() || "موضوعك";
  const all = uniqKeepOrder(Object.values(results).flat());

  const questionHints =
    /^(كيف|ما\s*هو|ما\s*هي|أين|متى|لماذا|هل|من|طريقة|شرح|أخطاء|أفضل)/i;
  const compareHints = /(مقارنة|مقابل|الفرق|vs|بدون|للمبتدئين|أفضل من)/i;

  const questions = uniqKeepOrder([
    ...all.filter((s) => questionHints.test(s) || /[؟?]/.test(s)),
    ...QUESTION_PREFIXES.flatMap((p) => results[`${p} ${t}`] || []),
  ]).slice(0, 40);

  const comparisons = uniqKeepOrder([
    ...all.filter((s) => compareHints.test(s)),
    ...COMPARISON_PREFIXES.flatMap((p) => results[`${p} ${t}`] || []),
  ]).slice(0, 25);

  const alphabetical: { letter: string; ideas: string[] }[] = [];
  for (const letter of [...arabicLetters, ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]) {
    const fromKey = results[`${t} ${letter}`] || [];
    const startsWithLetter = all.filter((s) => {
      const cleaned = s.replace(/^[#\s]+/, "");
      return cleaned.startsWith(letter) || cleaned.includes(` ${letter}`);
    });
    const ideas = uniqKeepOrder([...fromKey, ...startsWithLetter]).slice(0, 8);
    if (ideas.length) alphabetical.push({ letter, ideas });
  }

  const titles = uniqKeepOrder([
    ...(results[t] || []).map(capitalizeTitle),
    ...all
      .filter((s) => !questionHints.test(s) && s.length >= 12)
      .map(capitalizeTitle),
  ]).slice(0, 35);

  const hasGoogle = all.length > 0;
  if (!hasGoogle) {
    return {
      ...generateVideoContentIdeasLocal(t),
      source: "local",
      youtube: [],
    };
  }

  // املأ الأقسام الناقصة باحتياطي محلي خفيف
  const local = generateVideoContentIdeasLocal(t);
  return {
    topic: t,
    questions: questions.length ? questions : local.questions,
    comparisons: comparisons.length ? comparisons : local.comparisons,
    alphabetical: alphabetical.length ? alphabetical : local.alphabetical,
    titles: titles.length ? titles : local.titles,
    youtube: [],
    source: "google",
  };
}

/** دمج عناوين وترندات يوتيوب مع نتائج Suggest */
export function mergeYoutubeTrends(
  ideas: ContentIdeas,
  videos: YoutubeTrendVideo[],
): ContentIdeas {
  if (!videos.length) return ideas;
  const ytTitles = uniqKeepOrder(videos.map((v) => v.title));
  return {
    ...ideas,
    youtube: videos,
    titles: uniqKeepOrder([...ytTitles, ...ideas.titles]).slice(0, 45),
    source: ideas.source === "local" ? "google+youtube" : "google+youtube",
  };
}

/** احتياطي محلي إذا تعذّر Google Suggest */
export function generateVideoContentIdeasLocal(topic: string): ContentIdeas {
  const t = topic.trim() || "موضوعك";
  const startsWithQ = /^(كيف|ما\s*هو|ما\s*هي|أين|متى|لماذا|هل|من|أفضل)\b/i.test(
    t,
  );

  const questions = startsWithQ
    ? [
        t,
        `${t}؟`,
        `شرح ${t}`,
        `أفضل إجابة عن: ${t}`,
        `${t} للمبتدئين`,
        `${t} بالتفصيل`,
      ]
    : [
        `ما هو ${t}؟`,
        `كيف تبدأ في ${t} من الصفر؟`,
        `لماذا ${t} مهم في 2026؟`,
        `أين تتعلم ${t} مجاناً؟`,
        `متى يكون الوقت مناسباً لبدء ${t}؟`,
        `كيف تحترف ${t} بسرعة؟`,
        `ما أخطاء المبتدئين في ${t}؟`,
        `كيف تربح من ${t}؟`,
        `ما أفضل أدوات ${t}؟`,
        `هل ${t} مناسب للمبتدئين؟`,
      ];

  const comparisons = [
    `مقارنة بين ${t} والبدائل`,
    `${t} مقابل الطرق التقليدية`,
    `الفرق بين ${t} للمبتدئين والمحترفين`,
    `أفضل أدوات ${t} — مقارنة`,
    `${t} بدون رأس مال`,
    `${t} للمبتدئين`,
  ];

  const alphabetical = arabicLetters.slice(0, 12).map((letter) => ({
    letter,
    ideas: [`${t} ${letter}`, `أفكار ${t} بحرف ${letter}`],
  }));

  const titles = [
    `${t} للمبتدئين: الدليل الكامل`,
    `كيف تبدأ ${t} اليوم`,
    `أسرار ${t} التي لا يخبرك بها أحد`,
    `${t} من صفر إلى احتراف`,
    `أفضل نصائح في ${t}`,
    `أخطاء شائعة في ${t}`,
  ];

  return {
    topic: t,
    questions,
    comparisons,
    alphabetical,
    titles,
    youtube: [],
    source: "local",
  };
}

/** @deprecated استخدم assembleContentIdeasFromSuggest أو المحلي */
export function generateVideoContentIdeas(topic: string): ContentIdeas {
  return generateVideoContentIdeasLocal(topic);
}

export function contentIdeasToSeoText(ideas: ContentIdeas): string {
  const lines: string[] = [];
  lines.push(`مولد أفكار فيديو: ${ideas.topic}`);
  lines.push(
    `المصدر: ${
      ideas.source === "google+youtube"
        ? "Google Suggest + YouTube"
        : ideas.source === "google"
          ? "Google Suggest"
          : "محلي"
    }`,
  );
  lines.push("");
  if (ideas.youtube.length) {
    lines.push("## ترندات يوتيوب (عناوين رائجة)");
    for (const v of ideas.youtube) {
      lines.push(`- ${v.title} — ${v.channel} — ${v.url}`);
    }
    lines.push("");
  }
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
