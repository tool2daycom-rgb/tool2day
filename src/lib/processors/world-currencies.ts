/** عملات العالم الشائعة + معادن + علم الدولة + رمز العملة */

export type WorldCurrency = {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  /** Currency symbol shown next to the code (e.g. $, €, ﷼) */
  symbol: string;
  kind: "fiat" | "metal" | "crypto";
};

export const WORLD_CURRENCIES: WorldCurrency[] = [
  { code: "USD", nameAr: "دولار أمريكي", nameEn: "US Dollar", flag: "🇺🇸", symbol: "$", kind: "fiat" },
  { code: "EUR", nameAr: "يورو", nameEn: "Euro", flag: "🇪🇺", symbol: "€", kind: "fiat" },
  { code: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound", flag: "🇬🇧", symbol: "£", kind: "fiat" },
  { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", flag: "🇸🇦", symbol: "﷼", kind: "fiat" },
  { code: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", flag: "🇦🇪", symbol: "د.إ", kind: "fiat" },
  { code: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal", flag: "🇶🇦", symbol: "ر.ق", kind: "fiat" },
  { code: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", flag: "🇰🇼", symbol: "د.ك", kind: "fiat" },
  { code: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", flag: "🇧🇭", symbol: "د.ب", kind: "fiat" },
  { code: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial", flag: "🇴🇲", symbol: "ر.ع", kind: "fiat" },
  { code: "EGP", nameAr: "جنيه مصري", nameEn: "Egyptian Pound", flag: "🇪🇬", symbol: "ج.م", kind: "fiat" },
  { code: "JOD", nameAr: "دينار أردني", nameEn: "Jordanian Dinar", flag: "🇯🇴", symbol: "د.أ", kind: "fiat" },
  { code: "IQD", nameAr: "دينار عراقي", nameEn: "Iraqi Dinar", flag: "🇮🇶", symbol: "د.ع", kind: "fiat" },
  { code: "LBP", nameAr: "ليرة لبنانية", nameEn: "Lebanese Pound", flag: "🇱🇧", symbol: "ل.ل", kind: "fiat" },
  { code: "SYP", nameAr: "ليرة سورية", nameEn: "Syrian Pound", flag: "🇸🇾", symbol: "ل.س", kind: "fiat" },
  { code: "MAD", nameAr: "درهم مغربي", nameEn: "Moroccan Dirham", flag: "🇲🇦", symbol: "د.م", kind: "fiat" },
  { code: "TND", nameAr: "دينار تونسي", nameEn: "Tunisian Dinar", flag: "🇹🇳", symbol: "د.ت", kind: "fiat" },
  { code: "DZD", nameAr: "دينار جزائري", nameEn: "Algerian Dinar", flag: "🇩🇿", symbol: "د.ج", kind: "fiat" },
  { code: "LYD", nameAr: "دينار ليبي", nameEn: "Libyan Dinar", flag: "🇱🇾", symbol: "د.ل", kind: "fiat" },
  { code: "SDG", nameAr: "جنيه سوداني", nameEn: "Sudanese Pound", flag: "🇸🇩", symbol: "ج.س", kind: "fiat" },
  { code: "TRY", nameAr: "ليرة تركية", nameEn: "Turkish Lira", flag: "🇹🇷", symbol: "₺", kind: "fiat" },
  { code: "IRR", nameAr: "ريال إيراني", nameEn: "Iranian Rial", flag: "🇮🇷", symbol: "﷼", kind: "fiat" },
  { code: "ILS", nameAr: "شيكل", nameEn: "Israeli Shekel", flag: "🇮🇱", symbol: "₪", kind: "fiat" },
  { code: "CHF", nameAr: "فرنك سويسري", nameEn: "Swiss Franc", flag: "🇨🇭", symbol: "Fr", kind: "fiat" },
  { code: "JPY", nameAr: "ين ياباني", nameEn: "Japanese Yen", flag: "🇯🇵", symbol: "¥", kind: "fiat" },
  { code: "CNY", nameAr: "يوان صيني", nameEn: "Chinese Yuan", flag: "🇨🇳", symbol: "¥", kind: "fiat" },
  { code: "HKD", nameAr: "دولار هونغ كونغ", nameEn: "Hong Kong Dollar", flag: "🇭🇰", symbol: "HK$", kind: "fiat" },
  { code: "TWD", nameAr: "دولار تايواني", nameEn: "Taiwan Dollar", flag: "🇹🇼", symbol: "NT$", kind: "fiat" },
  { code: "KRW", nameAr: "وون كوري", nameEn: "South Korean Won", flag: "🇰🇷", symbol: "₩", kind: "fiat" },
  { code: "INR", nameAr: "روبية هندية", nameEn: "Indian Rupee", flag: "🇮🇳", symbol: "₹", kind: "fiat" },
  { code: "PKR", nameAr: "روبية باكستانية", nameEn: "Pakistani Rupee", flag: "🇵🇰", symbol: "₨", kind: "fiat" },
  { code: "BDT", nameAr: "تاكا بنغلاديشي", nameEn: "Bangladeshi Taka", flag: "🇧🇩", symbol: "৳", kind: "fiat" },
  { code: "IDR", nameAr: "روبية إندونيسية", nameEn: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp", kind: "fiat" },
  { code: "MYR", nameAr: "رينغيت ماليزي", nameEn: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM", kind: "fiat" },
  { code: "SGD", nameAr: "دولار سنغافوري", nameEn: "Singapore Dollar", flag: "🇸🇬", symbol: "S$", kind: "fiat" },
  { code: "THB", nameAr: "باهت تايلندي", nameEn: "Thai Baht", flag: "🇹🇭", symbol: "฿", kind: "fiat" },
  { code: "VND", nameAr: "دونغ فيتنامي", nameEn: "Vietnamese Dong", flag: "🇻🇳", symbol: "₫", kind: "fiat" },
  { code: "PHP", nameAr: "بيزو فلبيني", nameEn: "Philippine Peso", flag: "🇵🇭", symbol: "₱", kind: "fiat" },
  { code: "AUD", nameAr: "دولار أسترالي", nameEn: "Australian Dollar", flag: "🇦🇺", symbol: "A$", kind: "fiat" },
  { code: "NZD", nameAr: "دولار نيوزيلندي", nameEn: "New Zealand Dollar", flag: "🇳🇿", symbol: "NZ$", kind: "fiat" },
  { code: "CAD", nameAr: "دولار كندي", nameEn: "Canadian Dollar", flag: "🇨🇦", symbol: "C$", kind: "fiat" },
  { code: "MXN", nameAr: "بيزو مكسيكي", nameEn: "Mexican Peso", flag: "🇲🇽", symbol: "Mex$", kind: "fiat" },
  { code: "BRL", nameAr: "ريال برازيلي", nameEn: "Brazilian Real", flag: "🇧🇷", symbol: "R$", kind: "fiat" },
  { code: "ARS", nameAr: "بيزو أرجنتيني", nameEn: "Argentine Peso", flag: "🇦🇷", symbol: "AR$", kind: "fiat" },
  { code: "CLP", nameAr: "بيزو تشيلي", nameEn: "Chilean Peso", flag: "🇨🇱", symbol: "CLP$", kind: "fiat" },
  { code: "COP", nameAr: "بيزو كولومبي", nameEn: "Colombian Peso", flag: "🇨🇴", symbol: "COL$", kind: "fiat" },
  { code: "PEN", nameAr: "سول بيروفي", nameEn: "Peruvian Sol", flag: "🇵🇪", symbol: "S/", kind: "fiat" },
  { code: "ZAR", nameAr: "راند جنوب أفريقي", nameEn: "South African Rand", flag: "🇿🇦", symbol: "R", kind: "fiat" },
  { code: "NGN", nameAr: "نيرة نيجيرية", nameEn: "Nigerian Naira", flag: "🇳🇬", symbol: "₦", kind: "fiat" },
  { code: "KES", nameAr: "شلن كيني", nameEn: "Kenyan Shilling", flag: "🇰🇪", symbol: "KSh", kind: "fiat" },
  { code: "GHS", nameAr: "سيدي غاني", nameEn: "Ghanaian Cedi", flag: "🇬🇭", symbol: "GH₵", kind: "fiat" },
  { code: "ETB", nameAr: "بير إثيوبي", nameEn: "Ethiopian Birr", flag: "🇪🇹", symbol: "Br", kind: "fiat" },
  { code: "RUB", nameAr: "روبل روسي", nameEn: "Russian Ruble", flag: "🇷🇺", symbol: "₽", kind: "fiat" },
  { code: "UAH", nameAr: "هريفنيا أوكرانية", nameEn: "Ukrainian Hryvnia", flag: "🇺🇦", symbol: "₴", kind: "fiat" },
  { code: "PLN", nameAr: "زلوتي بولندي", nameEn: "Polish Zloty", flag: "🇵🇱", symbol: "zł", kind: "fiat" },
  { code: "CZK", nameAr: "كرونة تشيكية", nameEn: "Czech Koruna", flag: "🇨🇿", symbol: "Kč", kind: "fiat" },
  { code: "HUF", nameAr: "فورنت مجري", nameEn: "Hungarian Forint", flag: "🇭🇺", symbol: "Ft", kind: "fiat" },
  { code: "RON", nameAr: "ليو روماني", nameEn: "Romanian Leu", flag: "🇷🇴", symbol: "lei", kind: "fiat" },
  { code: "SEK", nameAr: "كرونة سويدية", nameEn: "Swedish Krona", flag: "🇸🇪", symbol: "kr", kind: "fiat" },
  { code: "NOK", nameAr: "كرونة نرويجية", nameEn: "Norwegian Krone", flag: "🇳🇴", symbol: "kr", kind: "fiat" },
  { code: "DKK", nameAr: "كرونة دنماركية", nameEn: "Danish Krone", flag: "🇩🇰", symbol: "kr", kind: "fiat" },
  { code: "ISK", nameAr: "كرونة آيسلندية", nameEn: "Icelandic Krona", flag: "🇮🇸", symbol: "kr", kind: "fiat" },
  { code: "XAU", nameAr: "ذهب (أونصة)", nameEn: "Gold Ounce", flag: "🥇", symbol: "Au", kind: "metal" },
  { code: "XAG", nameAr: "فضة (أونصة)", nameEn: "Silver Ounce", flag: "🥈", symbol: "Ag", kind: "metal" },
  { code: "XPT", nameAr: "بلاتين (أونصة)", nameEn: "Platinum Ounce", flag: "⚪", symbol: "Pt", kind: "metal" },
  { code: "XPD", nameAr: "بلاديوم (أونصة)", nameEn: "Palladium Ounce", flag: "🔘", symbol: "Pd", kind: "metal" },
  { code: "BTC", nameAr: "بيتكوين", nameEn: "Bitcoin", flag: "₿", symbol: "₿", kind: "crypto" },
  { code: "ETH", nameAr: "إيثريوم", nameEn: "Ethereum", flag: "Ξ", symbol: "Ξ", kind: "crypto" },
  { code: "USDT", nameAr: "تيثر", nameEn: "Tether", flag: "₮", symbol: "₮", kind: "crypto" },
  { code: "BNB", nameAr: "بينانس كوين", nameEn: "BNB", flag: "🟡", symbol: "BNB", kind: "crypto" },
  { code: "XRP", nameAr: "ريبل", nameEn: "XRP", flag: "✕", symbol: "XRP", kind: "crypto" },
  { code: "SOL", nameAr: "سولانا", nameEn: "Solana", flag: "◎", symbol: "SOL", kind: "crypto" },
  { code: "DOGE", nameAr: "دوجكوين", nameEn: "Dogecoin", flag: "Ð", symbol: "Ð", kind: "crypto" },
  { code: "ADA", nameAr: "كاردانو", nameEn: "Cardano", flag: "₳", symbol: "₳", kind: "crypto" },
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
      symbol: upper,
      kind: "fiat",
    }
  );
}

export function currencySymbol(code: string): string {
  return getCurrency(code).symbol;
}

/** Label for selects: 🇺🇸 $ USD — دولار أمريكي */
export function currencyLabel(code: string): string {
  const c = getCurrency(code);
  return `${c.flag} ${c.symbol} ${c.code} — ${c.nameAr}`;
}

/** Short label with symbol for rates: $ USD */
export function currencyCodeWithSymbol(code: string): string {
  const c = getCurrency(code);
  return `${c.symbol} ${c.code}`;
}
