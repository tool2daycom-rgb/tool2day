import {
  type CvLang,
} from "@/lib/processors/cv-languages";

export type { CvLang } from "@/lib/processors/cv-languages";
export {
  CV_UI_LANGUAGES,
  cvLangLabel,
  getCvUiLanguage,
  isCvRtl,
} from "@/lib/processors/cv-languages";

export type CvTemplateId =
  | "navy-sidebar"
  | "grey-ribbon"
  | "blue-circle"
  | "soft-blue"
  | "navy-orange"
  | "cream-modern";

export type CvExperience = {
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  details: string;
};

export type CvEducation = {
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
  note: string;
};

export type CvRatedItem = {
  name: string;
  level: number; // 1-5
};

export type CvData = {
  photoDataUrl: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  phone2: string;
  address: string;
  website: string;
  city: string;
  age: string;
  maritalStatus: string;
  children: string;
  summary: string;
  skills: string;
  languages: string;
  hobbies: string;
  experience: CvExperience[];
  education: CvEducation[];
  hardSkills: CvRatedItem[];
  softSkills: CvRatedItem[];
  courses: string;
  certificates: string;
};

/** لغات شائعة عالمياً لإضافتها بسرعة */
export const WORLD_LANGUAGES = [
  "العربية",
  "English",
  "Français",
  "Deutsch",
  "Español",
  "Português",
  "Italiano",
  "Türkçe",
  "Русский",
  "中文",
  "日本語",
  "한국어",
  "हिन्दी",
  "اردو",
  "فارسی",
  "Bahasa Indonesia",
  "Bahasa Melayu",
  "ไทย",
  "Tiếng Việt",
  "Polski",
  "Nederlands",
  "Svenska",
  "Norsk",
  "Dansk",
  "Suomi",
  "Ελληνικά",
  "Čeština",
  "Română",
  "Magyar",
  "Українська",
  "עברית",
  "Kiswahili",
] as const;

export const MARITAL_OPTIONS_AR = [
  "",
  "أعزب / عزباء",
  "متزوج / متزوجة",
  "مطلق / مطلقة",
  "أرمل / أرملة",
];

export const MARITAL_OPTIONS_EN = [
  "",
  "Single",
  "Married",
  "Divorced",
  "Widowed",
];

export const CV_TEMPLATES: Array<{
  id: CvTemplateId;
  labelAr: string;
  labelEn: string;
}> = [
  { id: "navy-sidebar", labelAr: "كحلي جانبي", labelEn: "Navy Sidebar" },
  { id: "grey-ribbon", labelAr: "رمادي شرائط", labelEn: "Grey Ribbon" },
  { id: "blue-circle", labelAr: "أزرق دائري", labelEn: "Blue Circle" },
  { id: "soft-blue", labelAr: "أزرق ناعم", labelEn: "Soft Blue" },
  { id: "navy-orange", labelAr: "كحلي وبرتقالي", labelEn: "Navy & Orange" },
  { id: "cream-modern", labelAr: "كريمي حديث", labelEn: "Cream Modern" },
];

export function emptyExperience(): CvExperience {
  return {
    role: "",
    company: "",
    location: "",
    start: "",
    end: "",
    details: "",
  };
}

export function emptyEducation(): CvEducation {
  return {
    degree: "",
    school: "",
    location: "",
    start: "",
    end: "",
    note: "",
  };
}

export function emptyCv(): CvData {
  return {
    photoDataUrl: "",
    fullName: "",
    title: "",
    email: "",
    phone: "",
    phone2: "",
    address: "",
    website: "",
    city: "",
    age: "",
    maritalStatus: "",
    children: "",
    summary: "",
    skills: "",
    languages: "",
    hobbies: "",
    experience: [emptyExperience()],
    education: [emptyEducation()],
    hardSkills: [{ name: "", level: 4 }],
    softSkills: [{ name: "", level: 4 }],
    courses: "",
    certificates: "",
  };
}

export type CvLabels = {
  fullName: string;
  title: string;
  photo: string;
  email: string;
  phone: string;
  phone2: string;
  address: string;
  website: string;
  city: string;
  age: string;
  maritalStatus: string;
  children: string;
  summary: string;
  about: string;
  contact: string;
  skills: string;
  hardSkills: string;
  softSkills: string;
  languages: string;
  hobbies: string;
  experience: string;
  education: string;
  courses: string;
  certificates: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  details: string;
  degree: string;
  school: string;
  note: string;
  level: string;
  addExperience: string;
  addEducation: string;
  addSkill: string;
  addLanguage: string;
  template: string;
  language: string;
  preview: string;
  downloadPdf: string;
  downloadTxt: string;
  placeholderName: string;
  placeholderTitle: string;
  pickLanguages: string;
  uploadPhoto: string;
  removePhoto: string;
};

const EN_LABELS: CvLabels = {
  fullName: "Full name",
  title: "Job title",
  photo: "Profile photo",
  email: "Email",
  phone: "Phone",
  phone2: "Phone 2 (optional)",
  address: "Address",
  website: "Website",
  city: "City / Country",
  age: "Age",
  maritalStatus: "Marital status",
  children: "Children (if any)",
  summary: "Professional summary",
  about: "About me",
  contact: "Contact",
  skills: "Skills",
  hardSkills: "Hard skills",
  softSkills: "Soft skills",
  languages: "Languages",
  hobbies: "Hobbies",
  experience: "Work experience",
  education: "Education",
  courses: "Courses / Training",
  certificates: "Certificates",
  role: "Role / Position",
  company: "Company",
  location: "Location",
  start: "From",
  end: "To",
  details: "Tasks / Achievements (one per line)",
  degree: "Degree / Major",
  school: "School / University",
  note: "Grade / Notes",
  level: "Level",
  addExperience: "Add experience",
  addEducation: "Add education",
  addSkill: "Add skill",
  addLanguage: "Add language",
  template: "Template",
  language: "CV language",
  preview: "Live preview",
  downloadPdf: "Download PDF",
  downloadTxt: "Download TXT",
  placeholderName: "Your name",
  placeholderTitle: "Your title",
  pickLanguages: "Quick-add world languages",
  uploadPhoto: "Upload photo",
  removePhoto: "Remove",
};

const LABEL_PACKS: Record<string, Partial<CvLabels>> = {
  ar: {
    fullName: "الاسم الكامل",
    title: "المسمى الوظيفي",
    photo: "الصورة الشخصية",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    phone2: "هاتف إضافي (اختياري)",
    address: "العنوان",
    website: "الموقع الإلكتروني",
    city: "المدينة / البلد",
    age: "العمر",
    maritalStatus: "الحالة الاجتماعية",
    children: "الأطفال (إن وُجد)",
    summary: "نبذة مهنية",
    about: "نبذة عني",
    contact: "معلومات الاتصال",
    skills: "المهارات",
    hardSkills: "مهارات تقنية",
    softSkills: "مهارات شخصية",
    languages: "اللغات",
    hobbies: "الهوايات",
    experience: "الخبرة المهنية",
    education: "التعليم",
    courses: "دورات / تدريب",
    certificates: "الشهادات",
    role: "المنصب",
    company: "الشركة",
    location: "الموقع",
    start: "من",
    end: "إلى",
    details: "المهام والإنجازات (سطر لكل نقطة)",
    degree: "الشهادة / التخصص",
    school: "الجامعة / المعهد",
    note: "التقدير / ملاحظات",
    level: "المستوى",
    addExperience: "إضافة خبرة",
    addEducation: "إضافة تعليم",
    addSkill: "إضافة مهارة",
    addLanguage: "إضافة لغة",
    template: "القالب",
    language: "لغة السيرة",
    preview: "معاينة مباشرة",
    downloadPdf: "تنزيل PDF",
    downloadTxt: "تنزيل TXT",
    placeholderName: "اسمك هنا",
    placeholderTitle: "المسمى الوظيفي",
    pickLanguages: "إضافة سريعة للغات العالم",
    uploadPhoto: "رفع صورة",
    removePhoto: "إزالة",
  },
  fr: {
    fullName: "Nom complet",
    title: "Titre du poste",
    photo: "Photo de profil",
    email: "E-mail",
    phone: "Téléphone",
    phone2: "Téléphone 2 (optionnel)",
    address: "Adresse",
    website: "Site web",
    city: "Ville / Pays",
    age: "Âge",
    maritalStatus: "Situation familiale",
    children: "Enfants (le cas échéant)",
    summary: "Résumé professionnel",
    about: "À propos de moi",
    contact: "Contact",
    skills: "Compétences",
    hardSkills: "Compétences techniques",
    softSkills: "Soft skills",
    languages: "Langues",
    hobbies: "Loisirs",
    experience: "Expérience professionnelle",
    education: "Formation",
    courses: "Cours / Formations",
    certificates: "Certificats",
    role: "Poste",
    company: "Entreprise",
    location: "Lieu",
    start: "De",
    end: "À",
    details: "Tâches / Réalisations (une par ligne)",
    degree: "Diplôme / Spécialité",
    school: "École / Université",
    note: "Mention / Notes",
    level: "Niveau",
    addExperience: "Ajouter une expérience",
    addEducation: "Ajouter une formation",
    addSkill: "Ajouter une compétence",
    addLanguage: "Ajouter une langue",
    template: "Modèle",
    language: "Langue du CV",
    preview: "Aperçu en direct",
    downloadPdf: "Télécharger PDF",
    downloadTxt: "Télécharger TXT",
    placeholderName: "Votre nom",
    placeholderTitle: "Votre titre",
    pickLanguages: "Ajout rapide des langues du monde",
    uploadPhoto: "Téléverser une photo",
    removePhoto: "Supprimer",
  },
  de: {
    fullName: "Vollständiger Name",
    title: "Berufsbezeichnung",
    photo: "Profilfoto",
    email: "E-Mail",
    phone: "Telefon",
    phone2: "Telefon 2 (optional)",
    address: "Adresse",
    website: "Website",
    city: "Stadt / Land",
    age: "Alter",
    maritalStatus: "Familienstand",
    children: "Kinder (falls vorhanden)",
    summary: "Berufliches Profil",
    about: "Über mich",
    contact: "Kontakt",
    skills: "Fähigkeiten",
    hardSkills: "Fachkenntnisse",
    softSkills: "Soziale Kompetenzen",
    languages: "Sprachen",
    hobbies: "Hobbys",
    experience: "Berufserfahrung",
    education: "Ausbildung",
    courses: "Kurse / Weiterbildung",
    certificates: "Zertifikate",
    role: "Position",
    company: "Unternehmen",
    location: "Ort",
    start: "Von",
    end: "Bis",
    details: "Aufgaben / Erfolge (eine pro Zeile)",
    degree: "Abschluss / Fach",
    school: "Schule / Universität",
    note: "Note / Bemerkungen",
    level: "Niveau",
    addExperience: "Erfahrung hinzufügen",
    addEducation: "Ausbildung hinzufügen",
    addSkill: "Fähigkeit hinzufügen",
    addLanguage: "Sprache hinzufügen",
    template: "Vorlage",
    language: "CV-Sprache",
    preview: "Live-Vorschau",
    downloadPdf: "PDF herunterladen",
    downloadTxt: "TXT herunterladen",
    placeholderName: "Ihr Name",
    placeholderTitle: "Ihr Titel",
    pickLanguages: "Weltsprachen schnell hinzufügen",
    uploadPhoto: "Foto hochladen",
    removePhoto: "Entfernen",
  },
  es: {
    fullName: "Nombre completo",
    title: "Puesto",
    photo: "Foto de perfil",
    email: "Correo",
    phone: "Teléfono",
    phone2: "Teléfono 2 (opcional)",
    address: "Dirección",
    website: "Sitio web",
    city: "Ciudad / País",
    age: "Edad",
    maritalStatus: "Estado civil",
    children: "Hijos (si aplica)",
    summary: "Resumen profesional",
    about: "Sobre mí",
    contact: "Contacto",
    skills: "Habilidades",
    hardSkills: "Habilidades técnicas",
    softSkills: "Habilidades blandas",
    languages: "Idiomas",
    hobbies: "Pasatiempos",
    experience: "Experiencia laboral",
    education: "Educación",
    courses: "Cursos / Formación",
    certificates: "Certificados",
    role: "Cargo",
    company: "Empresa",
    location: "Ubicación",
    start: "Desde",
    end: "Hasta",
    details: "Tareas / Logros (uno por línea)",
    degree: "Título / Especialidad",
    school: "Escuela / Universidad",
    note: "Nota / Observaciones",
    level: "Nivel",
    addExperience: "Añadir experiencia",
    addEducation: "Añadir educación",
    addSkill: "Añadir habilidad",
    addLanguage: "Añadir idioma",
    template: "Plantilla",
    language: "Idioma del CV",
    preview: "Vista previa",
    downloadPdf: "Descargar PDF",
    downloadTxt: "Descargar TXT",
    placeholderName: "Tu nombre",
    placeholderTitle: "Tu título",
    pickLanguages: "Añadir idiomas del mundo",
    uploadPhoto: "Subir foto",
    removePhoto: "Eliminar",
  },
  tr: {
    fullName: "Ad Soyad",
    title: "Ünvan",
    photo: "Profil fotoğrafı",
    email: "E-posta",
    phone: "Telefon",
    phone2: "Telefon 2 (isteğe bağlı)",
    address: "Adres",
    website: "Web sitesi",
    city: "Şehir / Ülke",
    age: "Yaş",
    maritalStatus: "Medeni durum",
    children: "Çocuklar (varsa)",
    summary: "Profesyonel özet",
    about: "Hakkımda",
    contact: "İletişim",
    skills: "Yetenekler",
    hardSkills: "Teknik beceriler",
    softSkills: "Kişisel beceriler",
    languages: "Diller",
    hobbies: "Hobiler",
    experience: "İş deneyimi",
    education: "Eğitim",
    courses: "Kurslar / Eğitimler",
    certificates: "Sertifikalar",
    role: "Pozisyon",
    company: "Şirket",
    location: "Konum",
    start: "Başlangıç",
    end: "Bitiş",
    details: "Görevler / Başarılar (her satır bir madde)",
    degree: "Derece / Bölüm",
    school: "Okul / Üniversite",
    note: "Not",
    level: "Seviye",
    addExperience: "Deneyim ekle",
    addEducation: "Eğitim ekle",
    addSkill: "Yetenek ekle",
    addLanguage: "Dil ekle",
    template: "Şablon",
    language: "CV dili",
    preview: "Canlı önizleme",
    downloadPdf: "PDF indir",
    downloadTxt: "TXT indir",
    placeholderName: "Adınız",
    placeholderTitle: "Ünvanınız",
    pickLanguages: "Dünya dillerini hızlı ekle",
    uploadPhoto: "Fotoğraf yükle",
    removePhoto: "Kaldır",
  },
  ru: {
    fullName: "ФИО",
    title: "Должность",
    photo: "Фото",
    email: "Эл. почта",
    phone: "Телефон",
    phone2: "Телефон 2 (необяз.)",
    address: "Адрес",
    website: "Сайт",
    city: "Город / Страна",
    age: "Возраст",
    maritalStatus: "Семейное положение",
    children: "Дети (если есть)",
    summary: "О себе",
    about: "Обо мне",
    contact: "Контакты",
    skills: "Навыки",
    hardSkills: "Проф. навыки",
    softSkills: "Личные качества",
    languages: "Языки",
    hobbies: "Хобби",
    experience: "Опыт работы",
    education: "Образование",
    courses: "Курсы",
    certificates: "Сертификаты",
    role: "Должность",
    company: "Компания",
    location: "Место",
    start: "С",
    end: "По",
    details: "Обязанности / Достижения",
    degree: "Степень / Специальность",
    school: "Учебное заведение",
    note: "Примечание",
    level: "Уровень",
    addExperience: "Добавить опыт",
    addEducation: "Добавить образование",
    addSkill: "Добавить навык",
    addLanguage: "Добавить язык",
    template: "Шаблон",
    language: "Язык резюме",
    preview: "Предпросмотр",
    downloadPdf: "Скачать PDF",
    downloadTxt: "Скачать TXT",
    placeholderName: "Ваше имя",
    placeholderTitle: "Ваша должность",
    pickLanguages: "Быстро добавить языки мира",
    uploadPhoto: "Загрузить фото",
    removePhoto: "Удалить",
  },
  zh: {
    fullName: "姓名",
    title: "职位",
    photo: "头像",
    email: "邮箱",
    phone: "电话",
    phone2: "备用电话",
    address: "地址",
    website: "网站",
    city: "城市 / 国家",
    age: "年龄",
    maritalStatus: "婚姻状况",
    children: "子女（如有）",
    summary: "个人简介",
    about: "关于我",
    contact: "联系方式",
    skills: "技能",
    hardSkills: "专业技能",
    softSkills: "软技能",
    languages: "语言",
    hobbies: "爱好",
    experience: "工作经历",
    education: "教育背景",
    courses: "培训课程",
    certificates: "证书",
    role: "职位",
    company: "公司",
    location: "地点",
    start: "开始",
    end: "结束",
    details: "职责 / 成就（每行一条）",
    degree: "学历 / 专业",
    school: "学校 / 大学",
    note: "备注",
    level: "水平",
    addExperience: "添加经历",
    addEducation: "添加教育",
    addSkill: "添加技能",
    addLanguage: "添加语言",
    template: "模板",
    language: "简历语言",
    preview: "实时预览",
    downloadPdf: "下载 PDF",
    downloadTxt: "下载 TXT",
    placeholderName: "您的姓名",
    placeholderTitle: "您的职位",
    pickLanguages: "快速添加世界语言",
    uploadPhoto: "上传照片",
    removePhoto: "移除",
  },
  "zh-TW": {
    fullName: "姓名",
    title: "職稱",
    photo: "大頭照",
    email: "電子郵件",
    phone: "電話",
    language: "履歷語言",
    experience: "工作經歷",
    education: "學歷",
    skills: "技能",
    contact: "聯絡方式",
    downloadPdf: "下載 PDF",
    uploadPhoto: "上傳照片",
  },
  ja: {
    fullName: "氏名",
    title: "職種",
    photo: "写真",
    email: "メール",
    phone: "電話",
    language: "履歴書の言語",
    experience: "職歴",
    education: "学歴",
    skills: "スキル",
    contact: "連絡先",
    languages: "語学",
    downloadPdf: "PDFをダウンロード",
    uploadPhoto: "写真をアップロード",
  },
  ko: {
    fullName: "이름",
    title: "직함",
    photo: "사진",
    email: "이메일",
    phone: "전화",
    language: "이력서 언어",
    experience: "경력",
    education: "학력",
    skills: "기술",
    contact: "연락처",
    languages: "언어",
    downloadPdf: "PDF 다운로드",
    uploadPhoto: "사진 업로드",
  },
  hi: {
    fullName: "पूरा नाम",
    title: "पदनाम",
    photo: "फ़ोटो",
    email: "ईमेल",
    phone: "फ़ोन",
    language: "सीवी भाषा",
    experience: "कार्य अनुभव",
    education: "शिक्षा",
    skills: "कौशल",
    contact: "संपर्क",
    languages: "भाषाएँ",
    downloadPdf: "PDF डाउनलोड",
    uploadPhoto: "फ़ोटो अपलोड",
  },
  ur: {
    fullName: "پورا نام",
    title: "عہدہ",
    photo: "تصویر",
    email: "ای میل",
    phone: "فون",
    language: "سی وی کی زبان",
    experience: "تجربہ",
    education: "تعلیم",
    skills: "مہارتیں",
    contact: "رابطہ",
    languages: "زبانیں",
    downloadPdf: "PDF ڈاؤن لوڈ",
    uploadPhoto: "تصویر اپ لوڈ",
  },
  fa: {
    fullName: "نام کامل",
    title: "عنوان شغلی",
    photo: "عکس",
    email: "ایمیل",
    phone: "تلفن",
    language: "زبان رزومه",
    experience: "سوابق کاری",
    education: "تحصیلات",
    skills: "مهارت‌ها",
    contact: "تماس",
    languages: "زبان‌ها",
    downloadPdf: "دانلود PDF",
    uploadPhoto: "بارگذاری عکس",
  },
  he: {
    fullName: "שם מלא",
    title: "תפקיד",
    photo: "תמונה",
    email: "אימייל",
    phone: "טלפון",
    language: "שפת קורות החיים",
    experience: "ניסיון תעסוקתי",
    education: "השכלה",
    skills: "כישורים",
    contact: "יצירת קשר",
    languages: "שפות",
    downloadPdf: "הורדת PDF",
    uploadPhoto: "העלאת תמונה",
  },
  pt: {
    fullName: "Nome completo",
    title: "Cargo",
    photo: "Foto",
    email: "E-mail",
    phone: "Telefone",
    language: "Idioma do CV",
    experience: "Experiência",
    education: "Educação",
    skills: "Competências",
    contact: "Contato",
    languages: "Idiomas",
    downloadPdf: "Baixar PDF",
    uploadPhoto: "Enviar foto",
  },
  it: {
    fullName: "Nome completo",
    title: "Titolo",
    photo: "Foto",
    email: "Email",
    phone: "Telefono",
    language: "Lingua del CV",
    experience: "Esperienza",
    education: "Istruzione",
    skills: "Competenze",
    contact: "Contatti",
    languages: "Lingue",
    downloadPdf: "Scarica PDF",
    uploadPhoto: "Carica foto",
  },
  nl: {
    fullName: "Volledige naam",
    title: "Functie",
    photo: "Profielfoto",
    email: "E-mail",
    phone: "Telefoon",
    language: "CV-taal",
    experience: "Werkervaring",
    education: "Opleiding",
    skills: "Vaardigheden",
    contact: "Contact",
    languages: "Talen",
    downloadPdf: "PDF downloaden",
    uploadPhoto: "Foto uploaden",
  },
  id: {
    fullName: "Nama lengkap",
    title: "Jabatan",
    photo: "Foto",
    email: "Email",
    phone: "Telepon",
    language: "Bahasa CV",
    experience: "Pengalaman kerja",
    education: "Pendidikan",
    skills: "Keterampilan",
    contact: "Kontak",
    languages: "Bahasa",
    downloadPdf: "Unduh PDF",
    uploadPhoto: "Unggah foto",
  },
  "pt-BR": {
    fullName: "Nome completo",
    title: "Cargo",
    language: "Idioma do currículo",
    downloadPdf: "Baixar PDF",
    uploadPhoto: "Enviar foto",
  },
  "fr-CA": {
    language: "Langue du CV",
    downloadPdf: "Télécharger PDF",
  },
  "es-MX": {
    language: "Idioma del CV",
    downloadPdf: "Descargar PDF",
  },
  "es-AR": {
    language: "Idioma del CV",
  },
  "ar-EG": {},
  "ar-MA": {},
  "ar-AE": {},
  "en-US": {},
  "en-AU": {},
  "en-CA": {},
};

function packKey(lang: string): string {
  if (LABEL_PACKS[lang]) return lang;
  const base = lang.split("-")[0] || lang;
  if (LABEL_PACKS[base]) return base;
  if (base === "zh") return "zh";
  return "en";
}

export function cvLabels(lang: CvLang): CvLabels {
  const key = packKey(lang);
  // العربية لهجات تستخدم حزمة ar كاملة
  if (key === "ar" || lang.startsWith("ar")) {
    return { ...EN_LABELS, ...LABEL_PACKS.ar };
  }
  if (key === "en" || lang.startsWith("en")) {
    return { ...EN_LABELS };
  }
  return { ...EN_LABELS, ...(LABEL_PACKS[key] || {}) };
}

export function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*◆❖]\s*/, "").trim())
    .filter(Boolean);
}

export function toggleLanguageLine(current: string, langName: string): string {
  const list = lines(current);
  const exists = list.some(
    (l) => l === langName || l.startsWith(`${langName} `) || l.startsWith(`${langName}(`),
  );
  if (exists) {
    return list
      .filter(
        (l) =>
          !(l === langName || l.startsWith(`${langName} `) || l.startsWith(`${langName}(`)),
      )
      .join("\n");
  }
  return [...list, langName].join("\n");
}

export function buildCvPlainText(d: CvData, lang: CvLang): string {
  const L = cvLabels(lang);
  const parts: string[] = [];
  parts.push(d.fullName || L.placeholderName);
  if (d.title) parts.push(d.title);
  parts.push(
    [d.phone, d.phone2, d.email, d.address || d.city, d.website]
      .filter(Boolean)
      .join(" · "),
  );
  const personal = [d.age && `${L.age}: ${d.age}`, d.maritalStatus, d.children && `${L.children}: ${d.children}`]
    .filter(Boolean)
    .join(" · ");
  if (personal) parts.push(personal);
  if (d.summary) parts.push(`\n${L.summary}\n${d.summary}`);
  if (d.experience.some((e) => e.role || e.company)) {
    parts.push(`\n${L.experience}`);
    for (const e of d.experience) {
      if (!e.role && !e.company) continue;
      parts.push(
        `${e.role} — ${e.company} (${e.start}${e.end ? ` – ${e.end}` : ""})`,
      );
      if (e.details) parts.push(e.details);
    }
  }
  if (d.education.some((e) => e.degree || e.school)) {
    parts.push(`\n${L.education}`);
    for (const e of d.education) {
      if (!e.degree && !e.school) continue;
      parts.push(
        `${e.degree} — ${e.school} (${e.start}${e.end ? ` – ${e.end}` : ""})`,
      );
    }
  }
  if (d.skills) parts.push(`\n${L.skills}\n${d.skills}`);
  if (d.languages) parts.push(`\n${L.languages}\n${d.languages}`);
  if (d.hobbies) parts.push(`\n${L.hobbies}\n${d.hobbies}`);
  return parts.filter(Boolean).join("\n");
}

/** إصلاح html2canvas مع ألوان oklab في Tailwind v4 */
export function hardenCloneColors(originalRoot: HTMLElement, cloneRoot: HTMLElement) {
  const colorProps = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "textDecorationColor",
    "columnRuleColor",
    "caretColor",
  ] as const;

  const walk = (orig: Element, clone: Element) => {
    if (orig instanceof HTMLElement && clone instanceof HTMLElement) {
      const cs = getComputedStyle(orig);
      for (const prop of colorProps) {
        const val = cs[prop];
        if (val && val !== "rgba(0, 0, 0, 0)" && !val.includes("oklab") && !val.includes("oklch")) {
          clone.style[prop] = val;
        } else if (val && (val.includes("oklab") || val.includes("oklch"))) {
          // احتياطي: شفافية أو لون آمن
          if (prop === "backgroundColor") clone.style.backgroundColor = "#ffffff";
          else if (prop === "color") clone.style.color = "#111111";
        }
      }
      // ظلال وحلقات قد تحتوي oklab — أزلها عند التصدير
      if (cs.boxShadow && (cs.boxShadow.includes("oklab") || cs.boxShadow.includes("oklch"))) {
        clone.style.boxShadow = "none";
      }
      clone.style.opacity = cs.opacity;
    }
    const oKids = Array.from(orig.children);
    const cKids = Array.from(clone.children);
    for (let i = 0; i < oKids.length; i++) {
      const o = oKids[i];
      const c = cKids[i];
      if (o && c) walk(o, c);
    }
  };
  walk(originalRoot, cloneRoot);
}
