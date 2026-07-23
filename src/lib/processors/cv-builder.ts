export type CvLang = "ar" | "en";

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
};

export function cvLabels(lang: CvLang): CvLabels {
  if (lang === "en") {
    return {
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
    };
  }
  return {
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
  };
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
