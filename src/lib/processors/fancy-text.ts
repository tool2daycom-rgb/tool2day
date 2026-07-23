/** تحويل نص لاتيني إلى أنماط يونيكود للزخرفة */

const STYLES: Array<{
  id: string;
  label: string;
  map?: Record<string, string>;
  wrap?: (s: string) => string;
}> = [
  {
    id: "bold",
    label: "عريض Mathematical Bold",
    map: buildMap(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
    ),
  },
  {
    id: "italic",
    label: "مائل Italic",
    map: buildMap(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
    ),
  },
  {
    id: "script",
    label: "خط يد Script",
    map: buildMap(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      "𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏",
    ),
  },
  {
    id: "double",
    label: "مزدوج Double-struck",
    map: buildMap(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
    ),
  },
  {
    id: "mono",
    label: "آلة كاتبة Mono",
    map: buildMap(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
    ),
  },
  {
    id: "squared",
    label: "مربعات Squared",
    map: buildMap(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉",
    ),
  },
  {
    id: "circles",
    label: "دوائر Circled",
    map: buildMap(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ",
    ),
  },
  {
    id: "tiny",
    label: "صغير Superscript-ish",
    map: buildMap(
      "abcdefghijklmnopqrstuvwxyz",
      "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ",
    ),
  },
  {
    id: "stars",
    label: "نجوم ★ Arabic/EN",
    wrap: (s) => `★彡 ${s} 彡★`,
  },
  {
    id: "fire",
    label: "نار 🔥",
    wrap: (s) => `🔥⌜${s}⌟🔥`,
  },
  {
    id: "crown",
    label: "تاج 👑",
    wrap: (s) => `👑✧ ${s} ✧👑`,
  },
  {
    id: "sparkle",
    label: "لمعة ✦",
    wrap: (s) => `✦･ﾟ:* ${s} *:･ﾟ✦`,
  },
  {
    id: "arabic-frame",
    label: "إطار عربي ﴿ ﴾",
    wrap: (s) => `﴿ ${s} ﴾`,
  },
  {
    id: "brackets",
    label: "أقواس زخرفية",
    wrap: (s) => `『${s}』`,
  },
  {
    id: "bars",
    label: "أعمدة ║",
    wrap: (s) => `║ ${s} ║`,
  },
  {
    id: "waves",
    label: "موجات ≈",
    wrap: (s) => `≈✧ ${s} ✧≈`,
  },
  {
    id: "gamer",
    label: "قيمر ░▒▓",
    wrap: (s) => `░▒▓█ ${s} █▓▒░`,
  },
  {
    id: "social",
    label: "سوشيال ◆",
    wrap: (s) => `◆ ${s} ◆`,
  },
];

function buildMap(from: string, to: string): Record<string, string> {
  const map: Record<string, string> = {};
  const fromChars = [...from];
  const toChars = [...to];
  const n = Math.min(fromChars.length, toChars.length);
  for (let i = 0; i < n; i++) {
    map[fromChars[i]!] = toChars[i]!;
  }
  return map;
}

export function listFancyStyles() {
  return STYLES.map(({ id, label }) => ({ id, label }));
}

export function applyFancyStyle(text: string, styleId: string): string {
  const style = STYLES.find((s) => s.id === styleId);
  if (!style || !text.trim()) return text;
  let out = text;
  if (style.map) {
    out = [...text]
      .map((ch) => style.map![ch] ?? style.map![ch.toUpperCase()] ?? ch)
      .join("");
  }
  if (style.wrap) out = style.wrap(out);
  return out;
}

export function generateAllFancy(text: string) {
  return STYLES.map((s) => ({
    id: s.id,
    label: s.label,
    value: applyFancyStyle(text, s.id),
  }));
}
