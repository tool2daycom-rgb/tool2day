/** تحويل ألوان واستخراج لوحة وتدرجات CSS */

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };
export type Cmyk = { c: number; m: number; y: number; k: number };

export function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n));
}

export function parseHex(input: string): Rgb | null {
  let s = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) =>
    clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: +(l * 100).toFixed(1) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case R:
      h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
      break;
    case G:
      h = ((B - R) / d + 2) / 6;
      break;
    default:
      h = ((R - G) / d + 4) / 6;
  }
  return {
    h: Math.round(h * 360),
    s: +(s * 100).toFixed(1),
    l: +(l * 100).toFixed(1),
  };
}

function hue2rgb(p: number, q: number, t: number) {
  let T = t;
  if (T < 0) T += 1;
  if (T > 1) T -= 1;
  if (T < 1 / 6) return p + (q - p) * 6 * T;
  if (T < 1 / 2) return q;
  if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
  return p;
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const H = ((h % 360) + 360) % 360 / 360;
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  if (S === 0) {
    const v = Math.round(L * 255);
    return { r: v, g: v, b: v };
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  return {
    r: Math.round(hue2rgb(p, q, H + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, H) * 255),
    b: Math.round(hue2rgb(p, q, H - 1 / 3) * 255),
  };
}

export function rgbToCmyk({ r, g, b }: Rgb): Cmyk {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const k = 1 - Math.max(R, G, B);
  if (k >= 1 - 1e-9) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: +(((1 - R - k) / (1 - k)) * 100).toFixed(1),
    m: +(((1 - G - k) / (1 - k)) * 100).toFixed(1),
    y: +(((1 - B - k) / (1 - k)) * 100).toFixed(1),
    k: +(k * 100).toFixed(1),
  };
}

export function cmykToRgb({ c, m, y, k }: Cmyk): Rgb {
  const C = clamp(c, 0, 100) / 100;
  const M = clamp(m, 0, 100) / 100;
  const Y = clamp(y, 0, 100) / 100;
  const K = clamp(k, 0, 100) / 100;
  return {
    r: Math.round(255 * (1 - C) * (1 - K)),
    g: Math.round(255 * (1 - M) * (1 - K)),
    b: Math.round(255 * (1 - Y) * (1 - K)),
  };
}

export type ColorFormats = {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  cmyk: Cmyk;
  cssRgb: string;
  cssHsl: string;
};

export function formatsFromRgb(rgb: Rgb): ColorFormats {
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  return {
    hex,
    rgb,
    hsl,
    cmyk,
    cssRgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    cssHsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  };
}

/** استخراج ألوان أساسية بتجميع تقريبي للبكسلات */
export async function extractPaletteFromImage(
  file: File,
  count = 8,
): Promise<ColorFormats[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("تعذر قراءة الصورة"));
      el.src = url;
    });

    const maxSide = 160;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("تعذر فتح محرر الصور");
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    // buckets 5 bits لكل قناة (~32^3)
    const freq = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]!;
      if (a < 200) continue;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      // تجاهل شبه الأبيض/الأسود المتطرف لتقليل الضوضاء
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 250 && min > 245) continue;
      if (max < 12) continue;
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const cur = freq.get(key);
      if (cur) {
        cur.n++;
        cur.r += r;
        cur.g += g;
        cur.b += b;
      } else {
        freq.set(key, { n: 1, r, g, b });
      }
    }

    const ranked = [...freq.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, Math.max(count * 3, 24));

    // تنويع: تخطّ الألوان القريبة جداً
    const picked: Rgb[] = [];
    for (const c of ranked) {
      const rgb = {
        r: Math.round(c.r / c.n),
        g: Math.round(c.g / c.n),
        b: Math.round(c.b / c.n),
      };
      const tooClose = picked.some((p) => {
        const dr = p.r - rgb.r;
        const dg = p.g - rgb.g;
        const db = p.b - rgb.b;
        return dr * dr + dg * dg + db * db < 45 * 45;
      });
      if (!tooClose) picked.push(rgb);
      if (picked.length >= count) break;
    }

    while (picked.length < Math.min(count, ranked.length)) {
      const c = ranked[picked.length]!;
      picked.push({
        r: Math.round(c.r / c.n),
        g: Math.round(c.g / c.n),
        b: Math.round(c.b / c.n),
      });
    }

    return picked.map(formatsFromRgb);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type GradientStop = { color: string; pos: number };

export function buildCssGradient(opts: {
  type: "linear" | "radial";
  angle: number;
  stops: GradientStop[];
}): string {
  const stops = [...opts.stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.color} ${Math.round(s.pos)}%`)
    .join(", ");
  if (opts.type === "radial") {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${Math.round(opts.angle)}deg, ${stops})`;
}
