/** دول لاختيار ملف المستخدم — علم + اسم */

export type ProfileCountry = {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
};

export const PROFILE_COUNTRIES: ProfileCountry[] = [
  { code: "SA", nameAr: "السعودية", nameEn: "Saudi Arabia", flag: "🇸🇦" },
  { code: "AE", nameAr: "الإمارات", nameEn: "United Arab Emirates", flag: "🇦🇪" },
  { code: "QA", nameAr: "قطر", nameEn: "Qatar", flag: "🇶🇦" },
  { code: "KW", nameAr: "الكويت", nameEn: "Kuwait", flag: "🇰🇼" },
  { code: "BH", nameAr: "البحرين", nameEn: "Bahrain", flag: "🇧🇭" },
  { code: "OM", nameAr: "عُمان", nameEn: "Oman", flag: "🇴🇲" },
  { code: "EG", nameAr: "مصر", nameEn: "Egypt", flag: "🇪🇬" },
  { code: "JO", nameAr: "الأردن", nameEn: "Jordan", flag: "🇯🇴" },
  { code: "IQ", nameAr: "العراق", nameEn: "Iraq", flag: "🇮🇶" },
  { code: "LB", nameAr: "لبنان", nameEn: "Lebanon", flag: "🇱🇧" },
  { code: "SY", nameAr: "سوريا", nameEn: "Syria", flag: "🇸🇾" },
  { code: "PS", nameAr: "فلسطين", nameEn: "Palestine", flag: "🇵🇸" },
  { code: "YE", nameAr: "اليمن", nameEn: "Yemen", flag: "🇾🇪" },
  { code: "MA", nameAr: "المغرب", nameEn: "Morocco", flag: "🇲🇦" },
  { code: "TN", nameAr: "تونس", nameEn: "Tunisia", flag: "🇹🇳" },
  { code: "DZ", nameAr: "الجزائر", nameEn: "Algeria", flag: "🇩🇿" },
  { code: "LY", nameAr: "ليبيا", nameEn: "Libya", flag: "🇱🇾" },
  { code: "SD", nameAr: "السودان", nameEn: "Sudan", flag: "🇸🇩" },
  { code: "TR", nameAr: "تركيا", nameEn: "Turkey", flag: "🇹🇷" },
  { code: "DE", nameAr: "ألمانيا", nameEn: "Germany", flag: "🇩🇪" },
  { code: "FR", nameAr: "فرنسا", nameEn: "France", flag: "🇫🇷" },
  { code: "GB", nameAr: "بريطانيا", nameEn: "United Kingdom", flag: "🇬🇧" },
  { code: "US", nameAr: "أمريكا", nameEn: "United States", flag: "🇺🇸" },
  { code: "CA", nameAr: "كندا", nameEn: "Canada", flag: "🇨🇦" },
  { code: "ES", nameAr: "إسبانيا", nameEn: "Spain", flag: "🇪🇸" },
  { code: "IT", nameAr: "إيطاليا", nameEn: "Italy", flag: "🇮🇹" },
  { code: "NL", nameAr: "هولندا", nameEn: "Netherlands", flag: "🇳🇱" },
  { code: "SE", nameAr: "السويد", nameEn: "Sweden", flag: "🇸🇪" },
  { code: "RU", nameAr: "روسيا", nameEn: "Russia", flag: "🇷🇺" },
  { code: "BR", nameAr: "البرازيل", nameEn: "Brazil", flag: "🇧🇷" },
  { code: "MX", nameAr: "المكسيك", nameEn: "Mexico", flag: "🇲🇽" },
  { code: "IN", nameAr: "الهند", nameEn: "India", flag: "🇮🇳" },
  { code: "PK", nameAr: "باكستان", nameEn: "Pakistan", flag: "🇵🇰" },
  { code: "ID", nameAr: "إندونيسيا", nameEn: "Indonesia", flag: "🇮🇩" },
  { code: "MY", nameAr: "ماليزيا", nameEn: "Malaysia", flag: "🇲🇾" },
  { code: "CN", nameAr: "الصين", nameEn: "China", flag: "🇨🇳" },
  { code: "JP", nameAr: "اليابان", nameEn: "Japan", flag: "🇯🇵" },
  { code: "KR", nameAr: "كوريا", nameEn: "South Korea", flag: "🇰🇷" },
  { code: "AU", nameAr: "أستراليا", nameEn: "Australia", flag: "🇦🇺" },
  { code: "NZ", nameAr: "نيوزيلندا", nameEn: "New Zealand", flag: "🇳🇿" },
  { code: "ZA", nameAr: "جنوب أفريقيا", nameEn: "South Africa", flag: "🇿🇦" },
];

export function findCountry(code: string | undefined | null) {
  if (!code) return null;
  return PROFILE_COUNTRIES.find((c) => c.code === code) || null;
}

export function countryFromAuthMeta(meta: Record<string, unknown> | undefined | null) {
  if (!meta) return { code: "", flag: "" };
  const code =
    typeof meta.country_code === "string" ? meta.country_code.trim().toUpperCase() : "";
  const fromList = findCountry(code);
  const flag =
    (typeof meta.country_flag === "string" && meta.country_flag.trim()) ||
    fromList?.flag ||
    "";
  return { code: fromList?.code || code.slice(0, 2), flag };
}
