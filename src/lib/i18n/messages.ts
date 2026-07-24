import type { ToolCategory } from "@/lib/tools";
import type { LocaleCode } from "./locales";

export type UiMessages = {
  login: string;
  myAccount: string;
  logout: string;
  selectLanguage: string;
  search: string;
  translationFeedback: string;
  free: string;
  completelyFree: string;
  heroLine: string;
  freeWord: string;
  noWatermark: string;
  backTo: string;
  categories: Record<
    ToolCategory,
    { label: string; sectionTitle: string }
  >;
};

const en: UiMessages = {
  login: "Log in",
  myAccount: "My account",
  logout: "Log out",
  selectLanguage: "Select language",
  search: "Search",
  translationFeedback: "Found a translation issue? Tell us",
  free: "Free",
  completelyFree: "Completely free",
  heroLine:
    "Online tools for video, audio, PDF, and files — free and without watermark",
  freeWord: "free",
  noWatermark: "without watermark",
  backTo: "Back to",
  categories: {
    generators: { label: "Generators", sectionTitle: "Generators" },
    calculators: {
      label: "Calculators",
      sectionTitle: "Math & converters",
    },
    ai: { label: "AI", sectionTitle: "Quick AI tools" },
    "social-dev": {
      label: "Social",
      sectionTitle: "Social media & developer tools",
    },
    video: { label: "Video", sectionTitle: "Video tools" },
    audio: { label: "Audio", sectionTitle: "Audio tools" },
    pdf: { label: "PDF", sectionTitle: "PDF tools" },
    converters: { label: "Converters", sectionTitle: "Converters" },
    utilities: { label: "Daily", sectionTitle: "Daily tools" },
  },
};

const ar: UiMessages = {
  login: "تسجيل الدخول",
  myAccount: "حسابي",
  logout: "تسجيل الخروج",
  selectLanguage: "اختر لغة",
  search: "بحث",
  translationFeedback: "أخبرنا هل وجدت خطأ في الترجمة؟",
  free: "مجاناً",
  completelyFree: "مجاني بالكامل",
  heroLine:
    "الأدوات الإلكترونية لتحويل الفيديو والصوت وPDF والملفات — مجاناً وبدون علامة مائية",
  freeWord: "مجاناً",
  noWatermark: "بدون علامة مائية",
  backTo: "العودة إلى",
  categories: {
    generators: { label: "مولدات", sectionTitle: "المولدات" },
    calculators: {
      label: "حسابات",
      sectionTitle: "التحويل الرياضي والحسابي",
    },
    ai: {
      label: "ذكاء اصطناعي",
      sectionTitle: "أدوات الذكاء الاصطناعي السريعة",
    },
    "social-dev": {
      label: "سوشيال",
      sectionTitle: "أدوات المطورين والسوشيال ميديا",
    },
    video: { label: "الفيديو", sectionTitle: "أدوات الفيديو" },
    audio: { label: "الصوت", sectionTitle: "أدوات الصوت" },
    pdf: { label: "PDF", sectionTitle: "أدوات PDF" },
    converters: { label: "المحولات", sectionTitle: "المحولات" },
    utilities: { label: "يومية", sectionTitle: "أدوات يومية" },
  },
};

/** Full UI packs — others fall back to English */
const packs: Partial<Record<LocaleCode, UiMessages>> = {
  en,
  ar,
  de: {
    ...en,
    login: "Anmelden",
    myAccount: "Mein Konto",
    logout: "Abmelden",
    selectLanguage: "Sprache wählen",
    search: "Suchen",
    free: "Kostenlos",
    completelyFree: "Völlig kostenlos",
    heroLine:
      "Online-Tools für Video, Audio, PDF und Dateien — kostenlos und ohne Wasserzeichen",
    categories: {
      generators: { label: "Generatoren", sectionTitle: "Generatoren" },
      calculators: { label: "Rechner", sectionTitle: "Rechner & Umrechner" },
      ai: { label: "KI", sectionTitle: "Schnelle KI-Tools" },
      "social-dev": {
        label: "Social",
        sectionTitle: "Social Media & Entwickler-Tools",
      },
      video: { label: "Video", sectionTitle: "Video-Tools" },
      audio: { label: "Audio", sectionTitle: "Audio-Tools" },
      pdf: { label: "PDF", sectionTitle: "PDF-Tools" },
      converters: { label: "Konverter", sectionTitle: "Konverter" },
      utilities: { label: "Alltag", sectionTitle: "Alltags-Tools" },
    },
  },
  es: {
    ...en,
    login: "Iniciar sesión",
    myAccount: "Mi cuenta",
    logout: "Cerrar sesión",
    selectLanguage: "Elegir idioma",
    search: "Buscar",
    free: "Gratis",
    completelyFree: "Totalmente gratis",
    heroLine:
      "Herramientas online para video, audio, PDF y archivos — gratis y sin marca de agua",
    categories: {
      generators: { label: "Generadores", sectionTitle: "Generadores" },
      calculators: { label: "Cálculos", sectionTitle: "Matemáticas y conversiones" },
      ai: { label: "IA", sectionTitle: "Herramientas de IA" },
      "social-dev": {
        label: "Social",
        sectionTitle: "Redes y herramientas para desarrolladores",
      },
      video: { label: "Video", sectionTitle: "Herramientas de video" },
      audio: { label: "Audio", sectionTitle: "Herramientas de audio" },
      pdf: { label: "PDF", sectionTitle: "Herramientas PDF" },
      converters: { label: "Convertidores", sectionTitle: "Convertidores" },
      utilities: { label: "Diario", sectionTitle: "Herramientas diarias" },
    },
  },
  fr: {
    ...en,
    login: "Connexion",
    myAccount: "Mon compte",
    logout: "Déconnexion",
    selectLanguage: "Choisir la langue",
    search: "Rechercher",
    free: "Gratuit",
    completelyFree: "Entièrement gratuit",
    heroLine:
      "Outils en ligne pour vidéo, audio, PDF et fichiers — gratuits et sans filigrane",
    categories: {
      generators: { label: "Générateurs", sectionTitle: "Générateurs" },
      calculators: { label: "Calculs", sectionTitle: "Maths et convertisseurs" },
      ai: { label: "IA", sectionTitle: "Outils IA rapides" },
      "social-dev": {
        label: "Social",
        sectionTitle: "Réseaux & outils développeurs",
      },
      video: { label: "Vidéo", sectionTitle: "Outils vidéo" },
      audio: { label: "Audio", sectionTitle: "Outils audio" },
      pdf: { label: "PDF", sectionTitle: "Outils PDF" },
      converters: { label: "Convertisseurs", sectionTitle: "Convertisseurs" },
      utilities: { label: "Quotidien", sectionTitle: "Outils du quotidien" },
    },
  },
  pt: {
    ...en,
    login: "Entrar",
    myAccount: "Minha conta",
    logout: "Sair",
    selectLanguage: "Escolher idioma",
    search: "Pesquisar",
    free: "Grátis",
    completelyFree: "Totalmente grátis",
    heroLine:
      "Ferramentas online para vídeo, áudio, PDF e arquivos — grátis e sem marca d'água",
  },
  it: {
    ...en,
    login: "Accedi",
    myAccount: "Il mio account",
    logout: "Esci",
    selectLanguage: "Scegli lingua",
    search: "Cerca",
    free: "Gratis",
    completelyFree: "Completamente gratis",
    heroLine:
      "Strumenti online per video, audio, PDF e file — gratis e senza filigrana",
  },
  ru: {
    ...en,
    login: "Войти",
    myAccount: "Мой аккаунт",
    logout: "Выйти",
    selectLanguage: "Выберите язык",
    search: "Поиск",
    free: "Бесплатно",
    completelyFree: "Полностью бесплатно",
    heroLine:
      "Онлайн-инструменты для видео, аудио, PDF и файлов — бесплатно и без водяного знака",
  },
  tr: {
    ...en,
    login: "Giriş yap",
    myAccount: "Hesabım",
    logout: "Çıkış",
    selectLanguage: "Dil seçin",
    search: "Ara",
    free: "Ücretsiz",
    completelyFree: "Tamamen ücretsiz",
    heroLine:
      "Video, ses, PDF ve dosyalar için çevrimiçi araçlar — ücretsiz ve filigransız",
  },
  fa: {
    ...ar,
    login: "ورود",
    myAccount: "حساب من",
    logout: "خروج",
    selectLanguage: "انتخاب زبان",
    search: "جستجو",
    free: "رایگان",
    completelyFree: "کاملاً رایگان",
    heroLine:
      "ابزارهای آنلاین برای ویدیو، صدا، PDF و فایل‌ها — رایگان و بدون واترمارک",
  },
  he: {
    ...en,
    login: "התחברות",
    myAccount: "החשבון שלי",
    logout: "התנתקות",
    selectLanguage: "בחירת שפה",
    search: "חיפוש",
    free: "חינם",
    completelyFree: "חינם לגמרי",
    heroLine:
      "כלים מקוונים לווידאו, אודיו, PDF וקבצים — בחינם וללא סימן מים",
  },
};

export function getMessages(locale: LocaleCode): UiMessages {
  return packs[locale] || en;
}
