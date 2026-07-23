export type CvData = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
};

export const emptyCv = (): CvData => ({
  fullName: "",
  title: "",
  email: "",
  phone: "",
  city: "",
  summary: "",
  experience: "",
  education: "",
  skills: "",
  languages: "",
});

export function buildCvText(d: CvData): string {
  const line = (label: string, value: string) =>
    value.trim() ? `${label}: ${value.trim()}` : "";
  const block = (title: string, value: string) =>
    value.trim() ? `\n${title}\n${"─".repeat(24)}\n${value.trim()}\n` : "";

  const header = [
    d.fullName.trim() || "الاسم",
    d.title.trim(),
    [d.city, d.phone, d.email].filter((x) => x.trim()).join(" · "),
  ]
    .filter(Boolean)
    .join("\n");

  return [
    header,
    block("نبذة", d.summary),
    block("الخبرة", d.experience),
    block("التعليم", d.education),
    block("المهارات", d.skills),
    line("اللغات", d.languages),
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}
