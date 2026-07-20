import { categoryMeta, tools, type Tool } from "@/lib/tools";

/** كلمات العلامة التجارية */
export const brandKeywords = [
  "Tool2Day",
  "tool2day",
  "Tool2day Com",
  "tool",
  "day",
  "أدوات تحويل وتحرير الملفات",
  "الأدوات الإلكترونية لتحويل الفيديو والصوت وPDF والملفات",
  "مجاناً",
  "بدون علامة مائية",
  "أدوات مجانية",
  "الفيديو",
  "الصوت",
  "PDF",
  "المحولات",
  "أدوات الفيديو",
  "أدوات الصوت",
  "أدوات PDF",
] as const;

/** كل أداة + «مجاناً» — مثل: محوّل الخطوط مجاناً */
export function toolFreeKeyword(title: string) {
  return `${title} مجاناً`;
}

export function getToolKeywords(tool: Tool): string[] {
  const cat = categoryMeta[tool.category];
  return [
    tool.title,
    toolFreeKeyword(tool.title),
    `${tool.title} أونلاين`,
    `${tool.title} مجاني`,
    cat.label,
    cat.sectionTitle,
    "Tool2Day",
    "مجاناً",
    "بدون علامة مائية",
  ];
}

export function getAllSiteKeywords(): string[] {
  const fromTools = tools.flatMap((tool) => [
    tool.title,
    toolFreeKeyword(tool.title),
  ]);
  return Array.from(new Set([...brandKeywords, ...fromTools]));
}

export function getToolPageTitle(tool: Tool) {
  return toolFreeKeyword(tool.title);
}

export function getToolPageDescription(tool: Tool, tagline?: string) {
  const free = toolFreeKeyword(tool.title);
  const base =
    tagline?.trim() ||
    tool.description ||
    `${tool.title} أونلاين في المتصفح.`;
  return `${free} — ${base} مجاني بالكامل وبدون علامة مائية على Tool2Day.`;
}

export const siteSeo = {
  title: "Tool2Day | أدوات تحويل وتحرير الملفات مجاناً",
  description:
    "Tool2Day — الأدوات الإلكترونية لتحويل وتحرير الفيديو والصوت وPDF والملفات مجاناً وبدون علامة مائية. محرر فيديو، مسجل شاشة، محوّل خطوط، أدوات PDF والمزيد.",
} as const;
