export type ToolCategory = "video" | "audio" | "pdf" | "files" | "edit";

export type Tool = {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  accept: string;
};

export const categoryLabels: Record<ToolCategory, string> = {
  video: "فيديو",
  audio: "صوت",
  pdf: "PDF",
  files: "ملفات",
  edit: "تحرير",
};

export const tools: Tool[] = [
  {
    slug: "video-converter",
    title: "محوّل الفيديو",
    description: "حوّل بين MP4 وMOV وWebM وAVI بجودة عالية.",
    category: "video",
    accept: "video/*",
  },
  {
    slug: "video-compress",
    title: "ضغط الفيديو",
    description: "قلّل حجم الفيديو مع الحفاظ على الوضوح.",
    category: "video",
    accept: "video/*",
  },
  {
    slug: "audio-converter",
    title: "محوّل الصوت",
    description: "حوّل MP3 وWAV وAAC وOGG بسهولة.",
    category: "audio",
    accept: "audio/*",
  },
  {
    slug: "audio-extract",
    title: "استخراج الصوت",
    description: "اسحب الصوت من أي فيديو خلال ثوانٍ.",
    category: "audio",
    accept: "video/*",
  },
  {
    slug: "pdf-merge",
    title: "دمج PDF",
    description: "اجمع عدة ملفات PDF في ملف واحد مرتّب.",
    category: "pdf",
    accept: "application/pdf",
  },
  {
    slug: "pdf-split",
    title: "تقسيم PDF",
    description: "افصل الصفحات أو استخرج جزءاً من المستند.",
    category: "pdf",
    accept: "application/pdf",
  },
  {
    slug: "pdf-to-image",
    title: "PDF إلى صورة",
    description: "حوّل صفحات PDF إلى PNG أو JPG.",
    category: "pdf",
    accept: "application/pdf",
  },
  {
    slug: "image-convert",
    title: "تحويل الصور",
    description: "حوّل بين JPG وPNG وWebP وSVG.",
    category: "files",
    accept: "image/*",
  },
  {
    slug: "file-compress",
    title: "ضغط الملفات",
    description: "صغّر حجم الملفات للرفع والمشاركة بسرعة.",
    category: "files",
    accept: "*/*",
  },
  {
    slug: "video-trim",
    title: "قص الفيديو",
    description: "قص البداية والنهاية بدقة إطار بإطار.",
    category: "edit",
    accept: "video/*",
  },
  {
    slug: "video-subtitle",
    title: "ترجمة الفيديو",
    description: "أضف ترجمات واضحة جاهزة للنشر.",
    category: "edit",
    accept: "video/*",
  },
  {
    slug: "ugc-editor",
    title: "محرّر فيديو ترويجي",
    description: "أنشئ فيديوهات قصيرة جاهزة للمنصات بدون مونتاج معقّد.",
    category: "edit",
    accept: "video/*,image/*",
  },
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory) {
  return tools.filter((tool) => tool.category === category);
}
