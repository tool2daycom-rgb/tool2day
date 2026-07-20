import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  Clapperboard,
  Combine,
  Crop,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  FlipHorizontal2,
  Gauge,
  ImagePlus,
  Lock,
  LockOpen,
  Merge,
  Mic,
  Monitor,
  Music2,
  PencilLine,
  FilePen,
  Presentation,
  RefreshCcw,
  Repeat2,
  RotateCw,
  Scissors,
  SlidersHorizontal,
  FolderOpen,
  Speaker,
  Split,
  Type,
  Video,
  Volume2,
  WandSparkles,
} from "lucide-react";

export type ToolCategory = "video" | "audio" | "pdf" | "converters";

export type Tool = {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  accept: string;
  icon: LucideIcon;
};

export const categoryMeta: Record<
  ToolCategory,
  { label: string; sectionTitle: string; anchor: string }
> = {
  video: {
    label: "الفيديو",
    sectionTitle: "أدوات الفيديو",
    anchor: "video",
  },
  audio: {
    label: "الصوت",
    sectionTitle: "أدوات الصوت",
    anchor: "audio",
  },
  pdf: {
    label: "PDF",
    sectionTitle: "أدوات PDF",
    anchor: "pdf",
  },
  converters: {
    label: "المحولات",
    sectionTitle: "المحولات",
    anchor: "converters",
  },
};

export const navCategories: ToolCategory[] = [
  "converters",
  "pdf",
  "audio",
  "video",
];

export const tools: Tool[] = [
  // Video
  {
    slug: "video-editor",
    title: "محرر الفيديو",
    description:
      "محرر احترافي بتايملاين ومعاينة: قص، سرعة، تدوير، صوت، قماش، نص وصور ثم تصدير.",
    category: "video",
    accept: "video/*",
    icon: Clapperboard,
  },
  {
    slug: "screen-recorder",
    title: "مسجل الشاشة",
    description: "سجّل الشاشة مباشرة من متصفحك — مجاناً وبدون علامة مائية.",
    category: "video",
    accept: "video/*",
    icon: Monitor,
  },
  {
    slug: "text-to-speech",
    title: "التحويل من النص إلى كلام",
    description: "حوّل النص إلى صوت طبيعي.",
    category: "video",
    accept: "text/plain",
    icon: Type,
  },
  {
    slug: "merge-videos",
    title: "دمج الفيديوهات",
    description: "ادمج عدة مقاطع في فيديو واحد.",
    category: "video",
    accept: "video/*",
    icon: Combine,
  },
  {
    slug: "trim-video",
    title: "قص الفيديو",
    description: "قص البداية والنهاية بدقة.",
    category: "video",
    accept: "video/*",
    icon: Scissors,
  },
  {
    slug: "add-audio-to-video",
    title: "إضافة الصوت إلى الفيديو",
    description: "أضف موسيقى أو تعليق صوتي لفيديوك.",
    category: "video",
    accept: "video/*,audio/*",
    icon: Music2,
  },
  {
    slug: "add-image-to-video",
    title: "أضف صورة إلى الفيديو",
    description: "ادمج صوراً داخل المقطع.",
    category: "video",
    accept: "video/*,image/*",
    icon: ImagePlus,
  },
  {
    slug: "add-text-to-video",
    title: "إضافة نص إلى الفيديو",
    description: "أضف عناوين وترجمات على الفيديو.",
    category: "video",
    accept: "video/*",
    icon: PencilLine,
  },
  {
    slug: "remove-logo",
    title: "إزالة الشعار من الفيديو",
    description: "أخفِ الشعارات والعناصر غير المرغوبة.",
    category: "video",
    accept: "video/*",
    icon: WandSparkles,
  },
  {
    slug: "crop-video",
    title: "قص إطار الفيديو",
    description: "اقطع جزء من إطار الفيديو.",
    category: "video",
    accept: "video/*",
    icon: Crop,
  },
  {
    slug: "rotate-video",
    title: "تدوير الفيديو",
    description: "دوّر الفيديو بالزاوية المناسبة.",
    category: "video",
    accept: "video/*",
    icon: RotateCw,
  },
  {
    slug: "flip-video",
    title: "قلب الفيديو",
    description: "اقلب الفيديو أفقياً أو عمودياً.",
    category: "video",
    accept: "video/*",
    icon: FlipHorizontal2,
  },
  {
    slug: "resize-video",
    title: "تغيير حجم الفيديو",
    description: "غيّر أبعاد الفيديو للمنصات المختلفة.",
    category: "video",
    accept: "video/*",
    icon: Film,
  },
  {
    slug: "loop-video",
    title: "تكرار الفيديو",
    description: "اجعل الفيديو يعيد نفسه بلا توقف.",
    category: "video",
    accept: "video/*",
    icon: Repeat2,
  },
  {
    slug: "change-video-volume",
    title: "تغيير مستوى صوت الفيديو",
    description: "ارفع أو اخفض صوت المقطع.",
    category: "video",
    accept: "video/*",
    icon: Volume2,
  },
  {
    slug: "change-video-speed",
    title: "تغيير سرعة الفيديو",
    description: "سرّع أو أبطئ تشغيل الفيديو.",
    category: "video",
    accept: "video/*",
    icon: Gauge,
  },
  {
    slug: "stabilize-video",
    title: "تثبيت الفيديو",
    description: "قلّل الاهتزاز وثبات الصورة.",
    category: "video",
    accept: "video/*",
    icon: Video,
  },
  {
    slug: "video-recorder",
    title: "مسجل الفيديو",
    description: "سجّل فيديو مباشرة من الكاميرا.",
    category: "video",
    accept: "video/*",
    icon: Video,
  },

  // Audio
  {
    slug: "trim-audio",
    title: "قص الصوت",
    description: "قص المقاطع الصوتية بدقة.",
    category: "audio",
    accept: "audio/*",
    icon: Scissors,
  },
  {
    slug: "change-audio-volume",
    title: "تغيير مستوى الصوت",
    description: "اضبط ارتفاع الصوت بسهولة.",
    category: "audio",
    accept: "audio/*",
    icon: Speaker,
  },
  {
    slug: "change-audio-speed",
    title: "تغيير سرعة الصوت",
    description: "غيّر سرعة التشغيل مع الحفاظ على الجودة.",
    category: "audio",
    accept: "audio/*",
    icon: Gauge,
  },
  {
    slug: "change-pitch",
    title: "تغيير طبقة الصوت",
    description: "ارفع أو اخفض طبقة الصوت.",
    category: "audio",
    accept: "audio/*",
    icon: AudioLines,
  },
  {
    slug: "equalizer",
    title: "المعادل الصوتي",
    description: "عدّل الترددات حسب ذوقك.",
    category: "audio",
    accept: "audio/*",
    icon: SlidersHorizontal,
  },
  {
    slug: "reverse-audio",
    title: "عكس الصوت",
    description: "شغّل الصوت بالعكس.",
    category: "audio",
    accept: "audio/*",
    icon: RefreshCcw,
  },
  {
    slug: "voice-recorder",
    title: "مسجل الصوت",
    description: "سجّل صوتك مباشرة من المتصفح.",
    category: "audio",
    accept: "audio/*",
    icon: Mic,
  },
  {
    slug: "audio-joiner",
    title: "دمج الصوت",
    description: "ادمج عدة ملفات صوتية في ملف واحد.",
    category: "audio",
    accept: "audio/*",
    icon: Combine,
  },

  // PDF
  {
    slug: "pdf-editor",
    title: "محرر PDF",
    description: "أضف نصاً وصوراً، احذف صفحات، ودوّر وعدّل مستند PDF.",
    category: "pdf",
    accept: "application/pdf",
    icon: FilePen,
  },
  {
    slug: "pdf-split",
    title: "تقسيم PDF",
    description: "افصل صفحات PDF إلى ملفات منفصلة.",
    category: "pdf",
    accept: "application/pdf",
    icon: Split,
  },
  {
    slug: "pdf-merge",
    title: "دمج PDF",
    description: "اجمع عدة ملفات PDF في ملف واحد.",
    category: "pdf",
    accept: "application/pdf",
    icon: Merge,
  },
  {
    slug: "pdf-compress",
    title: "ضغط PDF",
    description: "صغّر حجم ملف PDF.",
    category: "pdf",
    accept: "application/pdf",
    icon: FileArchive,
  },
  {
    slug: "pdf-unlock",
    title: "فتح قفل PDF",
    description: "أزل كلمة المرور عن ملف PDF.",
    category: "pdf",
    accept: "application/pdf",
    icon: LockOpen,
  },
  {
    slug: "pdf-protect",
    title: "حماية PDF",
    description: "أضف كلمة مرور لحماية المستند.",
    category: "pdf",
    accept: "application/pdf",
    icon: Lock,
  },
  {
    slug: "pdf-rotate",
    title: "تدوير PDF",
    description: "دوّر صفحات PDF بالزاوية المطلوبة.",
    category: "pdf",
    accept: "application/pdf",
    icon: RotateCw,
  },
  {
    slug: "pdf-page-numbers",
    title: "إضافة أرقام الصفحات",
    description: "أضف ترقيم صفحات لمستند PDF.",
    category: "pdf",
    accept: "application/pdf",
    icon: FileText,
  },
  {
    slug: "pdf-to-word",
    title: "PDF إلى Word",
    description: "حوّل PDF إلى مستند Word قابل للتعديل.",
    category: "pdf",
    accept: "application/pdf",
    icon: FileText,
  },
  {
    slug: "pdf-to-excel",
    title: "PDF إلى Excel",
    description: "استخرج الجداول إلى Excel.",
    category: "pdf",
    accept: "application/pdf",
    icon: FileSpreadsheet,
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF إلى JPG",
    description: "حوّل صفحات PDF إلى صور JPG.",
    category: "pdf",
    accept: "application/pdf",
    icon: FileImage,
  },
  {
    slug: "pdf-to-png",
    title: "PDF إلى PNG",
    description: "حوّل صفحات PDF إلى صور PNG.",
    category: "pdf",
    accept: "application/pdf",
    icon: FileImage,
  },
  {
    slug: "word-to-pdf",
    title: "Word إلى PDF",
    description: "حوّل مستندات Word إلى PDF.",
    category: "pdf",
    accept:
      ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileText,
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG إلى PDF",
    description: "حوّل الصور إلى ملف PDF.",
    category: "pdf",
    accept: "image/jpeg,image/jpg,image/png",
    icon: FileImage,
  },
  {
    slug: "excel-to-pdf",
    title: "Excel إلى PDF",
    description: "حوّل جداول Excel إلى PDF.",
    category: "pdf",
    accept:
      ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    icon: FileSpreadsheet,
  },
  {
    slug: "ppt-to-pdf",
    title: "PPT إلى PDF",
    description: "حوّل عروض PowerPoint إلى PDF.",
    category: "pdf",
    accept:
      ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    icon: Presentation,
  },

  // Converters
  {
    slug: "audio-converter",
    title: "محوّل الصوت",
    description: "حوّل بين صيغ الصوت الشائعة.",
    category: "converters",
    accept: "audio/*",
    icon: AudioLines,
  },
  {
    slug: "video-converter",
    title: "محوّل الفيديو",
    description: "حوّل بين صيغ الفيديو المختلفة.",
    category: "converters",
    accept: "video/*",
    icon: Film,
  },
  {
    slug: "image-converter",
    title: "محوّل الصور",
    description: "حوّل بين JPG وPNG وWebP والمزيد.",
    category: "converters",
    accept: "image/*",
    icon: FileImage,
  },
  {
    slug: "document-converter",
    title: "محوّل المستندات",
    description: "حوّل بين صيغ المستندات.",
    category: "converters",
    accept: ".doc,.docx,.txt,.odt,application/pdf",
    icon: FileText,
  },
  {
    slug: "archive-converter",
    title: "محوّل الأرشيف",
    description: "حوّل بين ZIP وRAR و7Z.",
    category: "converters",
    accept: ".zip,.rar,.7z,application/zip",
    icon: FileArchive,
  },
  {
    slug: "ebook-converter",
    title: "محوّل الكتب الإلكترونية",
    description: "حوّل بين EPUB وMOBI وPDF.",
    category: "converters",
    accept: ".epub,.mobi,application/pdf",
    icon: FileText,
  },
  {
    slug: "archive-extractor",
    title: "استخراج الأرشيف",
    description: "فك ضغط الملفات المضغوطة.",
    category: "converters",
    accept: ".zip,.rar,.7z,application/zip",
    icon: FolderOpen,
  },
  {
    slug: "font-converter",
    title: "محوّل الخطوط",
    description: "حوّل بين صيغ ملفات الخطوط.",
    category: "converters",
    accept: ".ttf,.otf,.woff,.woff2",
    icon: Type,
  },
];

export const categoryOrder: ToolCategory[] = [
  "video",
  "audio",
  "pdf",
  "converters",
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory) {
  return tools.filter((tool) => tool.category === category);
}

/** Kept for older imports */
export const categoryLabels = Object.fromEntries(
  Object.entries(categoryMeta).map(([key, value]) => [key, value.label]),
) as Record<ToolCategory, string>;
