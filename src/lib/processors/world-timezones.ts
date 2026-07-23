/** مدن العالم مع مناطق زمنية IANA */

export type WorldCity = {
  id: string;
  cityAr: string;
  countryAr: string;
  flag: string;
  tz: string;
};

export const WORLD_CITIES: WorldCity[] = [
  { id: "riyadh", cityAr: "الرياض", countryAr: "السعودية", flag: "🇸🇦", tz: "Asia/Riyadh" },
  { id: "dubai", cityAr: "دبي", countryAr: "الإمارات", flag: "🇦🇪", tz: "Asia/Dubai" },
  { id: "doha", cityAr: "الدوحة", countryAr: "قطر", flag: "🇶🇦", tz: "Asia/Qatar" },
  { id: "kuwait", cityAr: "الكويت", countryAr: "الكويت", flag: "🇰🇼", tz: "Asia/Kuwait" },
  { id: "manama", cityAr: "المنامة", countryAr: "البحرين", flag: "🇧🇭", tz: "Asia/Bahrain" },
  { id: "muscat", cityAr: "مسقط", countryAr: "عُمان", flag: "🇴🇲", tz: "Asia/Muscat" },
  { id: "cairo", cityAr: "القاهرة", countryAr: "مصر", flag: "🇪🇬", tz: "Africa/Cairo" },
  { id: "amman", cityAr: "عمّان", countryAr: "الأردن", flag: "🇯🇴", tz: "Asia/Amman" },
  { id: "baghdad", cityAr: "بغداد", countryAr: "العراق", flag: "🇮🇶", tz: "Asia/Baghdad" },
  { id: "beirut", cityAr: "بيروت", countryAr: "لبنان", flag: "🇱🇧", tz: "Asia/Beirut" },
  { id: "damascus", cityAr: "دمشق", countryAr: "سوريا", flag: "🇸🇾", tz: "Asia/Damascus" },
  { id: "casablanca", cityAr: "الدار البيضاء", countryAr: "المغرب", flag: "🇲🇦", tz: "Africa/Casablanca" },
  { id: "tunis", cityAr: "تونس", countryAr: "تونس", flag: "🇹🇳", tz: "Africa/Tunis" },
  { id: "algiers", cityAr: "الجزائر", countryAr: "الجزائر", flag: "🇩🇿", tz: "Africa/Algiers" },
  { id: "istanbul", cityAr: "إسطنبول", countryAr: "تركيا", flag: "🇹🇷", tz: "Europe/Istanbul" },
  { id: "london", cityAr: "لندن", countryAr: "بريطانيا", flag: "🇬🇧", tz: "Europe/London" },
  { id: "paris", cityAr: "باريس", countryAr: "فرنسا", flag: "🇫🇷", tz: "Europe/Paris" },
  { id: "berlin", cityAr: "برلين", countryAr: "ألمانيا", flag: "🇩🇪", tz: "Europe/Berlin" },
  { id: "madrid", cityAr: "مدريد", countryAr: "إسبانيا", flag: "🇪🇸", tz: "Europe/Madrid" },
  { id: "rome", cityAr: "روما", countryAr: "إيطاليا", flag: "🇮🇹", tz: "Europe/Rome" },
  { id: "moscow", cityAr: "موسكو", countryAr: "روسيا", flag: "🇷🇺", tz: "Europe/Moscow" },
  { id: "new-york", cityAr: "نيويورك", countryAr: "أمريكا", flag: "🇺🇸", tz: "America/New_York" },
  { id: "chicago", cityAr: "شيكاغو", countryAr: "أمريكا", flag: "🇺🇸", tz: "America/Chicago" },
  { id: "los-angeles", cityAr: "لوس أنجلوس", countryAr: "أمريكا", flag: "🇺🇸", tz: "America/Los_Angeles" },
  { id: "toronto", cityAr: "تورونتو", countryAr: "كندا", flag: "🇨🇦", tz: "America/Toronto" },
  { id: "sao-paulo", cityAr: "ساو باولو", countryAr: "البرازيل", flag: "🇧🇷", tz: "America/Sao_Paulo" },
  { id: "mexico-city", cityAr: "مكسيكو سيتي", countryAr: "المكسيك", flag: "🇲🇽", tz: "America/Mexico_City" },
  { id: "tokyo", cityAr: "طوكيو", countryAr: "اليابان", flag: "🇯🇵", tz: "Asia/Tokyo" },
  { id: "seoul", cityAr: "سيول", countryAr: "كوريا", flag: "🇰🇷", tz: "Asia/Seoul" },
  { id: "shanghai", cityAr: "شنغهاي", countryAr: "الصين", flag: "🇨🇳", tz: "Asia/Shanghai" },
  { id: "hong-kong", cityAr: "هونغ كونغ", countryAr: "الصين", flag: "🇭🇰", tz: "Asia/Hong_Kong" },
  { id: "singapore", cityAr: "سنغافورة", countryAr: "سنغافورة", flag: "🇸🇬", tz: "Asia/Singapore" },
  { id: "bangkok", cityAr: "بانكوك", countryAr: "تايلند", flag: "🇹🇭", tz: "Asia/Bangkok" },
  { id: "jakarta", cityAr: "جاكرتا", countryAr: "إندونيسيا", flag: "🇮🇩", tz: "Asia/Jakarta" },
  { id: "mumbai", cityAr: "مومباي", countryAr: "الهند", flag: "🇮🇳", tz: "Asia/Kolkata" },
  { id: "karachi", cityAr: "كراتشي", countryAr: "باكستان", flag: "🇵🇰", tz: "Asia/Karachi" },
  { id: "sydney", cityAr: "سيدني", countryAr: "أستراليا", flag: "🇦🇺", tz: "Australia/Sydney" },
  { id: "auckland", cityAr: "أوكلاند", countryAr: "نيوزيلندا", flag: "🇳🇿", tz: "Pacific/Auckland" },
  { id: "johannesburg", cityAr: "جوهانسبرغ", countryAr: "جنوب أفريقيا", flag: "🇿🇦", tz: "Africa/Johannesburg" },
  { id: "nairobi", cityAr: "نairobi", countryAr: "كينيا", flag: "🇰🇪", tz: "Africa/Nairobi" },
];

export function cityLabel(c: WorldCity): string {
  return `${c.flag} ${c.cityAr} — ${c.countryAr}`;
}

export function formatInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("ar", {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function offsetHours(aTz: string, bTz: string, at = new Date()): number {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
      hour: "2-digit",
    });
  const parse = (tz: string) => {
    const parts = fmt(tz).formatToParts(at);
    const name = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
    const m = name.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const h = Number(m[1]);
    const min = Number(m[2] || 0);
    return h + (h < 0 ? -min : min) / 60;
  };
  return parse(bTz) - parse(aTz);
}

export function describeOffset(hours: number): string {
  if (Math.abs(hours) < 0.01) return "نفس التوقيت";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  const body =
    m === 0 ? `${h} ساعة` : h === 0 ? `${m} دقيقة` : `${h} ساعة و ${m} دقيقة`;
  return hours > 0 ? `متقدم بـ ${body}` : `متأخر بـ ${body}`;
}
