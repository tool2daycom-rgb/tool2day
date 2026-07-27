/** Client-only helpers for daily utility tools. */

function randInt(max: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % max;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(arr.length)]!;
}

function uniq(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function seedWord(input: string) {
  const cleaned = input
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .split(/\s+/)
    .filter(Boolean)[0];
  return cleaned || "Nova";
}

// ── Password ───────────────────────────────────────────────────────────────

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

export type PasswordOptions = {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
};

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  percent: number;
};

export function generatePassword(opts: PasswordOptions): string {
  let pool = "";
  const required: string[] = [];
  if (opts.lower) {
    pool += LOWER;
    required.push(LOWER[randInt(LOWER.length)]!);
  }
  if (opts.upper) {
    pool += UPPER;
    required.push(UPPER[randInt(UPPER.length)]!);
  }
  if (opts.digits) {
    pool += DIGITS;
    required.push(DIGITS[randInt(DIGITS.length)]!);
  }
  if (opts.symbols) {
    pool += SYMBOLS;
    required.push(SYMBOLS[randInt(SYMBOLS.length)]!);
  }
  if (!pool) pool = LOWER + DIGITS;

  const length = Math.min(128, Math.max(4, opts.length || 16));
  const chars: string[] = [];
  for (let i = 0; i < length; i++) {
    chars.push(pool[randInt(pool.length)]!);
  }
  for (let i = 0; i < required.length && i < length; i++) {
    chars[i] = required[i]!;
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const tmp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }
  return chars.join("");
}

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["ضعيف جداً", "ضعيف", "متوسط", "قوي", "قوي جداً"] as const;
  return {
    score: clamped,
    label: labels[clamped],
    percent: (clamped / 4) * 100,
  };
}

// ── JWT (display only) ─────────────────────────────────────────────────────

function base64UrlToJson(part: string): unknown {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const json = atob(padded + pad);
  return JSON.parse(json);
}

export type JwtDecodeResult =
  | {
      ok: true;
      header: unknown;
      payload: unknown;
      signature: string;
      headerJson: string;
      payloadJson: string;
      notes: string[];
    }
  | { ok: false; error: string };

export function decodeJwt(token: string): JwtDecodeResult {
  const raw = token.trim().replace(/^Bearer\s+/i, "");
  if (!raw) return { ok: false, error: "الصق رمز JWT أولاً." };
  const parts = raw.split(".");
  if (parts.length !== 3) {
    return { ok: false, error: "رمز JWT غير صالح — يجب أن يحتوي على 3 أجزاء." };
  }
  try {
    const header = base64UrlToJson(parts[0]!);
    const payload = base64UrlToJson(parts[1]!);
    const notes: string[] = [
      "العرض فقط — لا يتم التحقق من التوقيع ولا يُرسل الرمز إلى أي خادم.",
      "لا تلصق توكنات حساسة على جهاز مشترك.",
    ];
    const exp =
      payload &&
      typeof payload === "object" &&
      "exp" in payload &&
      typeof (payload as { exp: unknown }).exp === "number"
        ? (payload as { exp: number }).exp
        : null;
    if (exp) {
      const date = new Date(exp * 1000);
      notes.push(
        `انتهاء الصلاحية (exp): ${date.toISOString()} — ${
          date.getTime() < Date.now() ? "منتهٍ" : "ساري"
        }`,
      );
    }
    return {
      ok: true,
      header,
      payload,
      signature: parts[2]!,
      headerJson: JSON.stringify(header, null, 2),
      payloadJson: JSON.stringify(payload, null, 2),
      notes,
    };
  } catch {
    return { ok: false, error: "تعذّر فك الترميز — تأكد أن الرمز Base64URL صالح." };
  }
}

// ── Random / dice ──────────────────────────────────────────────────────────

export function parseListItems(text: string): string[] {
  return uniq(
    text
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function pickRandom(items: string[]): string | null {
  if (!items.length) return null;
  return items[randInt(items.length)]!;
}

export function rollDice(sides = 6): number {
  const n = Math.min(100, Math.max(2, sides));
  return randInt(n) + 1;
}

// ── Company / slogan ───────────────────────────────────────────────────────

const PREFIXES = [
  "Nova",
  "Prime",
  "Bright",
  "Swift",
  "Clear",
  "Peak",
  "Forge",
  "Pulse",
  "Orbit",
  "Aura",
  "Vertex",
  "Nexus",
  "Spark",
  "Lumen",
  "Core",
];
const SUFFIXES = [
  "Lab",
  "Hub",
  "Works",
  "Studio",
  "Co",
  "Apps",
  "Soft",
  "Tech",
  "Digital",
  "Media",
  "Group",
  "Base",
  "Flow",
  "Stack",
  "Craft",
];
const AR_PREFIXES = [
  "نبض",
  "أفق",
  "صُنع",
  "رؤية",
  "مسار",
  "لمعة",
  "ركيزة",
  "مدار",
  "نواة",
  "ومضة",
];
const AR_SUFFIXES = [
  "تك",
  "ديجيتال",
  "ستوديو",
  "هاب",
  "لَب",
  "ميديا",
  "جروب",
  "سوليوشنز",
];

export function generateCompanyNames(keyword: string, count = 12): string[] {
  const base = seedWord(keyword);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const style = i % 5;
    if (style === 0) out.push(`${pick(PREFIXES)}${base}`);
    else if (style === 1) out.push(`${base}${pick(SUFFIXES)}`);
    else if (style === 2) out.push(`${pick(PREFIXES)} ${base}`);
    else if (style === 3) out.push(`${pick(AR_PREFIXES)} ${base}`);
    else out.push(`${base} ${pick(AR_SUFFIXES)}`);
  }
  return uniq(out).slice(0, count);
}

export function generateSlogans(keyword: string, count = 10): string[] {
  const topic = keyword.trim() || "منتجك";
  const templates = [
    `${topic} — أسهل مما تتخيّل.`,
    `ابنِ مستقبلك مع ${topic}.`,
    `${topic}: سرعة، وضوح، نتائج.`,
    `من الفكرة إلى الإطلاق مع ${topic}.`,
    `${topic} يصنع الفرق كل يوم.`,
    `Smart. Simple. ${seedWord(topic)}.`,
    `Built for people who ship — ${seedWord(topic)}.`,
    `${seedWord(topic)}: clarity in every click.`,
    `أقل تعقيداً، أكثر إنجازاً — ${topic}.`,
    `حيث تلتقي الفكرة بالتنفيذ: ${topic}.`,
    `${topic} بدون ضجيج — فقط نتائج.`,
    `Your next move starts with ${seedWord(topic)}.`,
  ];
  const shuffled = [...templates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const t = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = t;
  }
  return shuffled.slice(0, count);
}

// ── Bio / username ─────────────────────────────────────────────────────────

export function generateUsernames(seed: string, count = 16): string[] {
  const base = seedWord(seed)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
  const safe = base || "user";
  const extras = ["hq", "lab", "pro", "daily", "official", "studio", "now", "hub"];
  const out: string[] = [
    safe,
    `${safe}_`,
    `the${safe}`,
    `${safe}hq`,
    `${safe}.daily`,
    `${safe}_${pick(["01", "24", "99", "x"])}`,
    `${pick(["i", "im", "just"])}${safe}`,
    `${safe}${pick(["ly", "ify", "able"])}`,
  ];
  for (let i = 0; i < count; i++) {
    out.push(`${safe}${pick(extras)}${randInt(90) + 10}`);
    out.push(`${pick(extras)}_${safe}`);
  }
  return uniq(out).slice(0, count);
}

export function generateBios(seed: string, niche: string, count = 8): string[] {
  const name = seed.trim() || "أنا";
  const focus = niche.trim() || "محتوى";
  return [
    `${name} | أصنع محتوى عن ${focus} يومياً.`,
    `${name} — نصائح ${focus} بدون تعقيد.`,
    `مرحباً، أنا ${name}. أشارك رحلة ${focus}.`,
    `${name} ✦ ${focus} · تعلّم · إلهام`,
    `${name} | ${focus} creator · أدوات · أفكار`,
    `Building in public · ${focus} · ${name}`,
    `${name} — helping you grow with ${focus}.`,
    `Coffee, code & ${focus}. — ${name}`,
    `${name} · صانع محتوى ${focus} · تواصل للتعاون`,
    `من الصفر إلى الاحتراف في ${focus} | ${name}`,
  ].slice(0, count);
}

// ── Social captions ────────────────────────────────────────────────────────

export type CaptionPlatform = "youtube" | "instagram" | "tiktok";

export function generateSocialCaptions(
  topic: string,
  platform: CaptionPlatform,
  count = 6,
): string[] {
  const t = topic.trim() || "موضوعك";
  if (platform === "youtube") {
    return [
      `في هذا الفيديو نشرح ${t} خطوة بخطوة — للمتابعة اشترك وفعّل الجرس.\n\n⏱️ الفصول في الوصف\n👍 إذا استفدت لا تنسَ الإعجاب\n💬 اكتب سؤالك في التعليقات\n\n#${seedWord(t)} #شرح #تعليمي`,
      `${t} بطريقة أبسط مما تتوقع.\n\nفي الفيديو:\n• الفكرة الأساسية\n• الأخطاء الشائعة\n• تطبيق عملي\n\nاشترك للمزيد 🔔`,
      `دليل سريع عن ${t} للمبتدئين والمحترفين.\n\nروابط مفيدة في الوصف.\nشاركنا تجربتك مع ${t} 👇`,
      `كل ما تحتاجه عن ${t} في فيديو واحد.\n\nلا تنسَ الحفظ للمراجعة لاحقاً.\n#${seedWord(t)} #يوتيوب`,
      `لماذا يفشل كثيرون في ${t}؟ الجواب داخل الفيديو.\n\nاشترك لدروس أسبوعية.`,
      `${t} — نصائح عملية بدون حشو.\n\n📌 احفظ الفيديو\n🔁 شاركه مع صديق يحتاجها`,
    ].slice(0, count);
  }
  if (platform === "tiktok") {
    return [
      `${t} في أقل من دقيقة 🔥 احفظ الفيديو\n#${seedWord(t)} #نصائح #فيد`,
      `لو بتبدأ بـ ${t}… شاهد للنهاية\n#fyp #${seedWord(t)}`,
      `خطأ يكرره الكل في ${t} ❌\n#نصيحة #ترند`,
      `${t} بثلاث خطوات فقط ✅\nتابعني للمزيد`,
      `قبل ما تنشر عن ${t} شوف هاد\n#محتوى #صناع_محتوى`,
      `سر بسيط يغيّر نتيجتك في ${t}\n#تيك_توك`,
    ].slice(0, count);
  }
  return [
    `${t} ✨\n\nشاركت اليوم أهم النقاط بشكل مختصر.\nاحفظ المنشور وارجع له لاحقاً.\n\n#${seedWord(t)} #انستغرام #محتوى`,
    `دليلك السريع لـ ${t}.\n\n• نقطة 1\n• نقطة 2\n• نقطة 3\n\nأي سؤال؟ اكتبه في التعليقات 💬`,
    `لو مهتم بـ ${t} هذا المنشور لك.\n\nاحفظ · شارك · تابع للمزيد يومياً.`,
    `${t} بدون تعقيد — جرّب اليوم وأخبرنا بالنتيجة.\n\n#نصائح #تطوير`,
    `صُنّاع المحتوى: كيف تطوّر ${t}؟\nاكتب «أريد» وسأرد عليك.`,
    `منشور سريع عن ${t} يستحق الحفظ 📌\n\nتابعني لمزيد من الأفكار.`,
  ].slice(0, count);
}

// ── QR payloads ────────────────────────────────────────────────────────────

export type QrMode = "url" | "whatsapp" | "wifi" | "text";

export function buildQrPayload(
  mode: QrMode,
  fields: {
    url?: string;
    phone?: string;
    message?: string;
    ssid?: string;
    password?: string;
    wifiType?: "WPA" | "WEP" | "nopass";
    text?: string;
  },
): string {
  if (mode === "url") {
    const u = (fields.url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u}`;
  }
  if (mode === "whatsapp") {
    const phone = (fields.phone || "").replace(/[^\d]/g, "");
    const msg = encodeURIComponent(fields.message || "");
    if (!phone) return "";
    return msg
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/${phone}`;
  }
  if (mode === "wifi") {
    const ssid = (fields.ssid || "").replace(/([\\;,:"])/g, "\\$1");
    const pass = (fields.password || "").replace(/([\\;,:"])/g, "\\$1");
    const type = fields.wifiType || "WPA";
    if (!ssid) return "";
    if (type === "nopass") return `WIFI:T:nopass;S:${ssid};;`;
    return `WIFI:T:${type};S:${ssid};P:${pass};;`;
  }
  return (fields.text || "").trim();
}
