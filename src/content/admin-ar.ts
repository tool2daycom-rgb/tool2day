import type { InquiryStatus, InquiryType } from "@/db/schema";

export const adminAr = {
  brand: "tool2day — الإدارة",
  loginTitle: "تسجيل دخول الإدارة",
  loginLead: "الوصول مخصص لإدارة طلبات العملاء فقط.",
  username: "اسم المستخدم",
  password: "كلمة المرور",
  login: "دخول",
  logout: "خروج",
  setupTitle: "الإعداد غير مكتمل",
  setupLead:
    "أضف DATABASE_URL وADMIN_USERNAME وADMIN_PASSWORD_HASH وSESSION_SECRET في إعدادات البيئة ثم أعد النشر.",
  homeTitle: "الرئيسية",
  homeLead: "بانتظار إجراء",
  listTitle: "الطلبات",
  listEmpty: "لا توجد طلبات مطابقة.",
  search: "بحث بالاسم أو البريد",
  searchBtn: "بحث",
  allTypes: "كل الأنواع",
  allStatuses: "كل الحالات",
  typeContact: "تواصل",
  typeProject: "استفسار مشروع",
  statusNew: "جديد",
  statusInProgress: "قيد المتابعة",
  statusReplied: "تم الرد",
  statusArchived: "مؤرشف",
  open: "فتح",
  openSection: "فتح القسم ←",
  cardAll: "جميع الطلبات",
  cardNewProjects: "طلبات المشاريع الجديدة",
  cardNewContacts: "رسائل Contact الجديدة",
  cardInProgress: "طلبات قيد المتابعة",
  cardReplied: "تم الرد عليها",
  cardArchived: "الطلبات المؤرشفة",
  cardThisWeek: "إجمالي الطلبات خلال هذا الأسبوع",
  weekBadge: "خلال هذا الأسبوع",
  detailsTitle: "تفاصيل الطلب",
  back: "عودة للقائمة",
  backHome: "الرئيسية",
  saved: "تم حفظ التغييرات.",
  meta: "البيانات الأساسية",
  answers: "الإجابات",
  note: "ملاحظة داخلية",
  notePlaceholder: "ملاحظاتك الخاصة — لا تظهر للعميل",
  status: "الحالة",
  save: "حفظ",
  reply: "الرد عبر البريد",
  replyComposerTitle: "محرر الرد",
  replyTo: "إلى",
  replyFrom: "من",
  replySubject: "الموضوع",
  replyBody: "نص الرسالة",
  replyUseTemplate: "استخدام قالب الرد",
  replyContactTemplate: "Contact reply / Kontaktantwort",
  replySend: "إرسال الرد",
  replySending: "جارٍ الإرسال…",
  replySent: "تم إرسال الرد وتحديث الحالة إلى «تم الرد».",
  conversation: "المحادثة",
  conversationCustomer: "رسالة العميل",
  conversationAdmin: "رد الإدارة",
  conversationEmpty: "لا توجد ردود مرسلة بعد.",
  mailSetupTitle: "إرسال Zoho غير مهيأ",
  mailSetupLead:
    "أضف متغيرات البيئة التالية في Vercel (Production) ثم أعد النشر. لا تضع كلمة المرور في الكود.",
  mailSetupAfter:
    "في Zoho Mail: فعّل SMTP وأنشئ App Password لصندوق support@tool2day.com. المرسل وReply-To سيكونان support@tool2day.com.",
  createdAt: "وقت الإرسال",
  locale: "لغة النموذج",
  name: "الاسم",
  email: "البريد",
  phone: "الهاتف",
  company: "الشركة",
  service: "الخدمة المطلوبة",
  message: "الرسالة",
  projectTypes: "نوع المشروع",
  goals: "الأهداف",
  websiteFeatures: "ميزات الموقع",
  webappFeatures: "ميزات تطبيق الويب",
  mobileFeatures: "ميزات تطبيق الموبايل",
  hostingFeatures: "الاستضافة",
  timeline: "موعد الإطلاق",
  details: "التفاصيل",
  contactMethod: "طريقة التواصل المفضلة",
  otherProjectNote: "ملاحظة نوع المشروع",
  otherGoalNote: "ملاحظة الأهداف",
  empty: "—",
  dbMissing: "قاعدة البيانات غير متصلة. أضف DATABASE_URL ثم أعد المحاولة.",
};

export function typeLabel(type: InquiryType) {
  return type === "contact" ? adminAr.typeContact : adminAr.typeProject;
}

export function statusLabel(status: InquiryStatus) {
  switch (status) {
    case "new":
      return adminAr.statusNew;
    case "in_progress":
      return adminAr.statusInProgress;
    case "replied":
      return adminAr.statusReplied;
    case "archived":
      return adminAr.statusArchived;
  }
}
