/** عملات العالم الشائعة + معادن + علم الدولة */

export type WorldCurrency = {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  kind: "fiat" | "metal" | "crypto";
};

export const WORLD_CURRENCIES: WorldCurrency[] = [
  { code: "USD", nameAr: "دولار أمريكي", nameEn: "US Dollar", flag: "🇺🇸", kind: "fiat" },
  { code: "EUR", nameAr: "يورو", nameEn: "Euro", flag: "🇪🇺", kind: "fiat" },
  { code: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound", flag: "🇬🇧", kind: "fiat" },
  { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", flag: "🇸🇦", kind: "fiat" },
  { code: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", flag: "🇦🇪", kind: "fiat" },
  { code: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal", flag: "🇶🇦", kind: "fiat" },
  { code: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", flag: "🇰🇼", kind: "fiat" },
  { code: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", flag: "🇧🇭", kind: "fiat" },
  { code: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial", flag: "🇴🇲", kind: "fiat" },
  { code: "EGP", nameAr: "جنيه مصري", nameEn: "Egyptian Pound", flag: "🇪🇬", kind: "fiat" },
  { code: "JOD", nameAr: "دينار أردني", nameEn: "Jordanian Dinar", flag: "🇯🇴", kind: "fiat" },
  { code: "IQD", nameAr: "دينار عراقي", nameEn: "Iraqi Dinar", flag: "🇮🇶", kind: "fiat" },
  { code: "LBP", nameAr: "ليرة لبنانية", nameEn: "Lebanese Pound", flag: "🇱🇧", kind: "fiat" },
  { code: "SYP", nameAr: "ليرة سورية", nameEn: "Syrian Pound", flag: "🇸🇾", kind: "fiat" },
  { code: "MAD", nameAr: "درهم مغربي", nameEn: "Moroccan Dirham", flag: "🇲🇦", kind: "fiat" },
  { code: "TND", nameAr: "دينار تونسي", nameEn: "Tunisian Dinar", flag: "🇹🇳", kind: "fiat" },
  { code: "DZD", nameAr: "دينار جزائري", nameEn: "Algerian Dinar", flag: "🇩🇿", kind: "fiat" },
  { code: "LYD", nameAr: "دينار ليبي", nameEn: "Libyan Dinar", flag: "🇱🇾", kind: "fiat" },
  { code: "SDG", nameAr: "جنيه سوداني", nameEn: "Sudanese Pound", flag: "🇸🇩", kind: "fiat" },
  { code: "TRY", nameAr: "ليرة تركية", nameEn: "Turkish Lira", flag: "🇹🇷", kind: "fiat" },
  { code: "IRR", nameAr: "ريال إيراني", nameEn: "Iranian Rial", flag: "🇮🇷", kind: "fiat" },
  { code: "ILS", nameAr: "شيكل", nameEn: "Israeli Shekel", flag: "🇮🇱", kind: "fiat" },
  { code: "CHF", nameAr: "فرنك سويسري", nameEn: "Swiss Franc", flag: "🇨🇭", kind: "fiat" },
  { code: "JPY", nameAr: "ين ياباني", nameEn: "Japanese Yen", flag: "🇯🇵", kind: "fiat" },
  { code: "CNY", nameAr: "يوان صيني", nameEn: "Chinese Yuan", flag: "🇨🇳", kind: "fiat" },
  { code: "HKD", nameAr: "دولار هونغ كونغ", nameEn: "Hong Kong Dollar", flag: "🇭🇰", kind: "fiat" },
  { code: "TWD", nameAr: "دولار تايواني", nameEn: "Taiwan Dollar", flag: "🇹🇼", kind: "fiat" },
  { code: "KRW", nameAr: "وون كوري", nameEn: "South Korean Won", flag: "🇰🇷", kind: "fiat" },
  { code: "INR", nameAr: "روبية هندية", nameEn: "Indian Rupee", flag: "🇮🇳", kind: "fiat" },
  { code: "PKR", nameAr: "روبية باكستانية", nameEn: "Pakistani Rupee", flag: "🇵🇰", kind: "fiat" },
  { code: "BDT", nameAr: "تاكا بنغلاديشي", nameEn: "Bangladeshi Taka", flag: "🇧🇩", kind: "fiat" },
  { code: "IDR", nameAr: "روبية إندونيسية", nameEn: "Indonesian Rupiah", flag: "🇮🇩", kind: "fiat" },
  { code: "MYR", nameAr: "رينغيت ماليزي", nameEn: "Malaysian Ringgit", flag: "🇲🇾", kind: "fiat" },
  { code: "SGD", nameAr: "دولار سنغافوري", nameEn: "Singapore Dollar", flag: "🇸🇬", kind: "fiat" },
  { code: "THB", nameAr: "باهت تايلندي", nameEn: "Thai Baht", flag: "🇹🇭", kind: "fiat" },
  { code: "VND", nameAr: "دونغ فيتنامي", nameEn: "Vietnamese Dong", flag: "🇻🇳", kind: "fiat" },
  { code: "PHP", nameAr: "بيزو فلبيني", nameEn: "Philippine Peso", flag: "🇵🇭", kind: "fiat" },
  { code: "AUD", nameAr: "دولار أسترالي", nameEn: "Australian Dollar", flag: "🇦🇺", kind: "fiat" },
  { code: "NZD", nameAr: "دولار نيوزيلندي", nameEn: "New Zealand Dollar", flag: "🇳🇿", kind: "fiat" },
  { code: "CAD", nameAr: "دولار كندي", nameEn: "Canadian Dollar", flag: "🇨🇦", kind: "fiat" },
  { code: "MXN", nameAr: "بيزو مكسيكي", nameEn: "Mexican Peso", flag: "🇲🇽", kind: "fiat" },
  { code: "BRL", nameAr: "ريال برازيلي", nameEn: "Brazilian Real", flag: "🇧🇷", kind: "fiat" },
  { code: "ARS", nameAr: "بيزو أرجنتيني", nameEn: "Argentine Peso", flag: "🇦🇷", kind: "fiat" },
  { code: "CLP", nameAr: "بيزو تشيلي", nameEn: "Chilean Peso", flag: "🇨🇱", kind: "fiat" },
  { code: "COP", nameAr: "بيزو كولومبي", nameEn: "Colombian Peso", flag: "🇨🇴", kind: "fiat" },
  { code: "PEN", nameAr: "سول بيروفي", nameEn: "Peruvian Sol", flag: "🇵🇪", kind: "fiat" },
  { code: "ZAR", nameAr: "راند جنوب أفريقي", nameEn: "South African Rand", flag: "🇿🇦", kind: "fiat" },
  { code: "NGN", nameAr: "نيرة نيجيرية", nameEn: "Nigerian Naira", flag: "🇳🇬", kind: "fiat" },
  { code: "KES", nameAr: "شلن كيني", nameEn: "Kenyan Shilling", flag: "🇰🇪", kind: "fiat" },
  { code: "GHS", nameAr: "سيدي غاني", nameEn: "Ghanaian Cedi", flag: "🇬🇭", kind: "fiat" },
  { code: "ETB", nameAr: "بير إثيوبي", nameEn: "Ethiopian Birr", flag: "🇪🇹", kind: "fiat" },
  { code: "RUB", nameAr: "روبل روسي", nameEn: "Russian Ruble", flag: "🇷🇺", kind: "fiat" },
  { code: "UAH", nameAr: "هريفنيا أوكرانية", nameEn: "Ukrainian Hryvnia", flag: "🇺🇦", kind: "fiat" },
  { code: "PLN", nameAr: "زلوتي بولندي", nameEn: "Polish Zloty", flag: "🇵🇱", kind: "fiat" },
  { code: "CZK", nameAr: "كرونة تشيكية", nameEn: "Czech Koruna", flag: "🇨🇿", kind: "fiat" },
  { code: "HUF", nameAr: "فورنت مجري", nameEn: "Hungarian Forint", flag: "🇭🇺", kind: "fiat" },
  { code: "RON", nameAr: "ليو روماني", nameEn: "Romanian Leu", flag: "🇷🇴", kind: "fiat" },
  { code: "SEK", nameAr: "كرونة سويدية", nameEn: "Swedish Krona", flag: "🇸🇪", kind: "fiat" },
  { code: "NOK", nameAr: "كرونة نرويجية", nameEn: "Norwegian Krone", flag: "🇳🇴", kind: "fiat" },
  { code: "DKK", nameAr: "كرونة دنماركية", nameEn: "Danish Krone", flag: "🇩🇰", kind: "fiat" },
  { code: "ISK", nameAr: "كرونة آيسلندية", nameEn: "Icelandic Krona", flag: "🇮🇸", kind: "fiat" },
  { code: "XAU", nameAr: "ذهب (أونصة)", nameEn: "Gold Ounce", flag: "🥇", kind: "metal" },
  { code: "XAG", nameAr: "فضة (أونصة)", nameEn: "Silver Ounce", flag: "🥈", kind: "metal" },
  { code: "XPT", nameAr: "بلاتين (أونصة)", nameEn: "Platinum Ounce", flag: "⚪", kind: "metal" },
  { code: "XPD", nameAr: "بلاديوم (أونصة)", nameEn: "Palladium Ounce", flag: "🔘", kind: "metal" },
  { code: "BTC", nameAr: "بيتكوين", nameEn: "Bitcoin", flag: "₿", kind: "crypto" },
  { code: "ETH", nameAr: "إيثريوم", nameEn: "Ethereum", flag: "Ξ", kind: "crypto" },
  { code: "USDT", nameAr: "تيثر", nameEn: "Tether", flag: "₮", kind: "crypto" },
  { code: "BNB", nameAr: "بينانس كوين", nameEn: "BNB", flag: "🟡", kind: "crypto" },
  { code: "XRP", nameAr: "ريبل", nameEn: "XRP", flag: "✕", kind: "crypto" },
  { code: "SOL", nameAr: "سولانا", nameEn: "Solana", flag: "◎", kind: "crypto" },
  { code: "DOGE", nameAr: "دوجكوين", nameEn: "Dogecoin", flag: "Ð", kind: "crypto" },
  { code: "ADA", nameAr: "كاردانو", nameEn: "Cardano", flag: "₳", kind: "crypto" },
];

export const POPULAR_PAIRS: [string, string][] = [
  ["USD", "SAR"],
  ["USD", "EUR"],
  ["EUR", "USD"],
  ["USD", "AED"],
  ["USD", "EGP"],
  ["USD", "TRY"],
  ["USD", "GBP"],
  ["XAU", "USD"],
  ["XAU", "SAR"],
  ["XAG", "USD"],
  ["BTC", "USD"],
  ["ETH", "USD"],
];

export function getCurrency(code: string): WorldCurrency {
  const upper = code.toUpperCase();
  return (
    WORLD_CURRENCIES.find((c) => c.code === upper) || {
      code: upper,
      nameAr: upper,
      nameEn: upper,
      flag: "💱",
      kind: "fiat",
    }
  );
}

export function currencyLabel(code: string): string {
  const c = getCurrency(code);
  return `${c.flag} ${c.code} — ${c.nameAr}`;
}
