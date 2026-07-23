/** لغات واجهة/قالب السيرة مع الأعلام */

export type CvLang = string;

export type CvUiLanguage = {
  code: string;
  flag: string;
  native: string;
  english: string;
  dir: "rtl" | "ltr";
};

/** لغات العالم الشائعة لـ «لغة السيرة» مع الأعلام */
export const CV_UI_LANGUAGES: CvUiLanguage[] = [
  { code: "ar", flag: "🇸🇦", native: "العربية", english: "Arabic", dir: "rtl" },
  { code: "en", flag: "🇬🇧", native: "English", english: "English", dir: "ltr" },
  { code: "fr", flag: "🇫🇷", native: "Français", english: "French", dir: "ltr" },
  { code: "de", flag: "🇩🇪", native: "Deutsch", english: "German", dir: "ltr" },
  { code: "es", flag: "🇪🇸", native: "Español", english: "Spanish", dir: "ltr" },
  { code: "pt", flag: "🇵🇹", native: "Português", english: "Portuguese", dir: "ltr" },
  { code: "pt-BR", flag: "🇧🇷", native: "Português (Brasil)", english: "Portuguese (Brazil)", dir: "ltr" },
  { code: "it", flag: "🇮🇹", native: "Italiano", english: "Italian", dir: "ltr" },
  { code: "tr", flag: "🇹🇷", native: "Türkçe", english: "Turkish", dir: "ltr" },
  { code: "ru", flag: "🇷🇺", native: "Русский", english: "Russian", dir: "ltr" },
  { code: "uk", flag: "🇺🇦", native: "Українська", english: "Ukrainian", dir: "ltr" },
  { code: "pl", flag: "🇵🇱", native: "Polski", english: "Polish", dir: "ltr" },
  { code: "nl", flag: "🇳🇱", native: "Nederlands", english: "Dutch", dir: "ltr" },
  { code: "sv", flag: "🇸🇪", native: "Svenska", english: "Swedish", dir: "ltr" },
  { code: "no", flag: "🇳🇴", native: "Norsk", english: "Norwegian", dir: "ltr" },
  { code: "da", flag: "🇩🇰", native: "Dansk", english: "Danish", dir: "ltr" },
  { code: "fi", flag: "🇫🇮", native: "Suomi", english: "Finnish", dir: "ltr" },
  { code: "el", flag: "🇬🇷", native: "Ελληνικά", english: "Greek", dir: "ltr" },
  { code: "cs", flag: "🇨🇿", native: "Čeština", english: "Czech", dir: "ltr" },
  { code: "ro", flag: "🇷🇴", native: "Română", english: "Romanian", dir: "ltr" },
  { code: "hu", flag: "🇭🇺", native: "Magyar", english: "Hungarian", dir: "ltr" },
  { code: "bg", flag: "🇧🇬", native: "Български", english: "Bulgarian", dir: "ltr" },
  { code: "hr", flag: "🇭🇷", native: "Hrvatski", english: "Croatian", dir: "ltr" },
  { code: "sr", flag: "🇷🇸", native: "Српски", english: "Serbian", dir: "ltr" },
  { code: "sk", flag: "🇸🇰", native: "Slovenčina", english: "Slovak", dir: "ltr" },
  { code: "sl", flag: "🇸🇮", native: "Slovenščina", english: "Slovenian", dir: "ltr" },
  { code: "lt", flag: "🇱🇹", native: "Lietuvių", english: "Lithuanian", dir: "ltr" },
  { code: "lv", flag: "🇱🇻", native: "Latviešu", english: "Latvian", dir: "ltr" },
  { code: "et", flag: "🇪🇪", native: "Eesti", english: "Estonian", dir: "ltr" },
  { code: "zh", flag: "🇨🇳", native: "中文", english: "Chinese", dir: "ltr" },
  { code: "zh-TW", flag: "🇹🇼", native: "繁體中文", english: "Chinese (Traditional)", dir: "ltr" },
  { code: "ja", flag: "🇯🇵", native: "日本語", english: "Japanese", dir: "ltr" },
  { code: "ko", flag: "🇰🇷", native: "한국어", english: "Korean", dir: "ltr" },
  { code: "hi", flag: "🇮🇳", native: "हिन्दी", english: "Hindi", dir: "ltr" },
  { code: "bn", flag: "🇧🇩", native: "বাংলা", english: "Bengali", dir: "ltr" },
  { code: "ur", flag: "🇵🇰", native: "اردو", english: "Urdu", dir: "rtl" },
  { code: "fa", flag: "🇮🇷", native: "فارسی", english: "Persian", dir: "rtl" },
  { code: "he", flag: "🇮🇱", native: "עברית", english: "Hebrew", dir: "rtl" },
  { code: "id", flag: "🇮🇩", native: "Bahasa Indonesia", english: "Indonesian", dir: "ltr" },
  { code: "ms", flag: "🇲🇾", native: "Bahasa Melayu", english: "Malay", dir: "ltr" },
  { code: "th", flag: "🇹🇭", native: "ไทย", english: "Thai", dir: "ltr" },
  { code: "vi", flag: "🇻🇳", native: "Tiếng Việt", english: "Vietnamese", dir: "ltr" },
  { code: "tl", flag: "🇵🇭", native: "Filipino", english: "Filipino", dir: "ltr" },
  { code: "sw", flag: "🇰🇪", native: "Kiswahili", english: "Swahili", dir: "ltr" },
  { code: "am", flag: "🇪🇹", native: "አማርኛ", english: "Amharic", dir: "ltr" },
  { code: "ha", flag: "🇳🇬", native: "Hausa", english: "Hausa", dir: "ltr" },
  { code: "yo", flag: "🇳🇬", native: "Yorùbá", english: "Yoruba", dir: "ltr" },
  { code: "zu", flag: "🇿🇦", native: "isiZulu", english: "Zulu", dir: "ltr" },
  { code: "af", flag: "🇿🇦", native: "Afrikaans", english: "Afrikaans", dir: "ltr" },
  { code: "sq", flag: "🇦🇱", native: "Shqip", english: "Albanian", dir: "ltr" },
  { code: "ka", flag: "🇬🇪", native: "ქართული", english: "Georgian", dir: "ltr" },
  { code: "hy", flag: "🇦🇲", native: "Հայերեն", english: "Armenian", dir: "ltr" },
  { code: "az", flag: "🇦🇿", native: "Azərbaycan", english: "Azerbaijani", dir: "ltr" },
  { code: "kk", flag: "🇰🇿", native: "Қазақша", english: "Kazakh", dir: "ltr" },
  { code: "uz", flag: "🇺🇿", native: "Oʻzbekcha", english: "Uzbek", dir: "ltr" },
  { code: "ne", flag: "🇳🇵", native: "नेपाली", english: "Nepali", dir: "ltr" },
  { code: "si", flag: "🇱🇰", native: "සිංහල", english: "Sinhala", dir: "ltr" },
  { code: "ta", flag: "🇮🇳", native: "தமிழ்", english: "Tamil", dir: "ltr" },
  { code: "te", flag: "🇮🇳", native: "తెలుగు", english: "Telugu", dir: "ltr" },
  { code: "mr", flag: "🇮🇳", native: "मराठी", english: "Marathi", dir: "ltr" },
  { code: "gu", flag: "🇮🇳", native: "ગુજરાતી", english: "Gujarati", dir: "ltr" },
  { code: "pa", flag: "🇮🇳", native: "ਪੰਜਾਬੀ", english: "Punjabi", dir: "ltr" },
  { code: "my", flag: "🇲🇲", native: "မြန်မာ", english: "Burmese", dir: "ltr" },
  { code: "km", flag: "🇰🇭", native: "ខ្មែរ", english: "Khmer", dir: "ltr" },
  { code: "lo", flag: "🇱🇦", native: "ລາວ", english: "Lao", dir: "ltr" },
  { code: "mn", flag: "🇲🇳", native: "Монгол", english: "Mongolian", dir: "ltr" },
  { code: "ca", flag: "🇦🇩", native: "Català", english: "Catalan", dir: "ltr" },
  { code: "eu", flag: "🇪🇸", native: "Euskara", english: "Basque", dir: "ltr" },
  { code: "gl", flag: "🇪🇸", native: "Galego", english: "Galician", dir: "ltr" },
  { code: "is", flag: "🇮🇸", native: "Íslenska", english: "Icelandic", dir: "ltr" },
  { code: "ga", flag: "🇮🇪", native: "Gaeilge", english: "Irish", dir: "ltr" },
  { code: "cy", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", native: "Cymraeg", english: "Welsh", dir: "ltr" },
  { code: "mt", flag: "🇲🇹", native: "Malti", english: "Maltese", dir: "ltr" },
  { code: "bs", flag: "🇧🇦", native: "Bosanski", english: "Bosnian", dir: "ltr" },
  { code: "mk", flag: "🇲🇰", native: "Македонски", english: "Macedonian", dir: "ltr" },
  { code: "sq-XK", flag: "🇽🇰", native: "Shqip (Kosovë)", english: "Albanian (Kosovo)", dir: "ltr" },
  { code: "ku", flag: "🇮🇶", native: "Kurdî", english: "Kurdish", dir: "ltr" },
  { code: "ps", flag: "🇦🇫", native: "پښتو", english: "Pashto", dir: "rtl" },
  { code: "sd", flag: "🇵🇰", native: "سنڌي", english: "Sindhi", dir: "rtl" },
  { code: "so", flag: "🇸🇴", native: "Soomaali", english: "Somali", dir: "ltr" },
  { code: "rw", flag: "🇷🇼", native: "Kinyarwanda", english: "Kinyarwanda", dir: "ltr" },
  { code: "ig", flag: "🇳🇬", native: "Igbo", english: "Igbo", dir: "ltr" },
  { code: "en-US", flag: "🇺🇸", native: "English (US)", english: "English (US)", dir: "ltr" },
  { code: "en-AU", flag: "🇦🇺", native: "English (Australia)", english: "English (Australia)", dir: "ltr" },
  { code: "en-CA", flag: "🇨🇦", native: "English (Canada)", english: "English (Canada)", dir: "ltr" },
  { code: "fr-CA", flag: "🇨🇦", native: "Français (Canada)", english: "French (Canada)", dir: "ltr" },
  { code: "es-MX", flag: "🇲🇽", native: "Español (México)", english: "Spanish (Mexico)", dir: "ltr" },
  { code: "es-AR", flag: "🇦🇷", native: "Español (Argentina)", english: "Spanish (Argentina)", dir: "ltr" },
  { code: "ar-EG", flag: "🇪🇬", native: "العربية (مصر)", english: "Arabic (Egypt)", dir: "rtl" },
  { code: "ar-MA", flag: "🇲🇦", native: "العربية (المغرب)", english: "Arabic (Morocco)", dir: "rtl" },
  { code: "ar-AE", flag: "🇦🇪", native: "العربية (الإمارات)", english: "Arabic (UAE)", dir: "rtl" },
];

export function getCvUiLanguage(code: string): CvUiLanguage {
  return (
    CV_UI_LANGUAGES.find((l) => l.code === code) ||
    CV_UI_LANGUAGES.find((l) => l.code === "en")!
  );
}

export function isCvRtl(code: string): boolean {
  return getCvUiLanguage(code).dir === "rtl";
}

export function cvLangLabel(code: string): string {
  const l = getCvUiLanguage(code);
  return `${l.flag} ${l.native}`;
}
