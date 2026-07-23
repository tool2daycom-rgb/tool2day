export type EmailKind = "work" | "job" | "apology" | "followup" | "thanks";

export type EmailFields = {
  kind: EmailKind;
  senderName: string;
  recipientName: string;
  company: string;
  role: string;
  topic: string;
  extra: string;
};

export const emailKinds: Array<{ id: EmailKind; label: string }> = [
  { id: "work", label: "رسالة عمل رسمية" },
  { id: "job", label: "التقدم لوظيفة" },
  { id: "apology", label: "اعتذار" },
  { id: "followup", label: "متابعة / Follow-up" },
  { id: "thanks", label: "شكر" },
];

export function buildEmail(f: EmailFields): { subject: string; body: string } {
  const name = f.senderName.trim() || "الاسم";
  const to = f.recipientName.trim() || "الأستاذ/ة";
  const company = f.company.trim() || "الشركة";
  const role = f.role.trim() || "المسمى الوظيفي";
  const topic = f.topic.trim() || "الموضوع";
  const extra = f.extra.trim();

  if (f.kind === "job") {
    return {
      subject: `طلب التقدم لوظيفة ${role} — ${name}`,
      body: `السلام عليكم ورحمة الله،
السيد/ة ${to} المحترم/ة،

أتشرّف بالتقدم لوظيفة ${role} لدى ${company}. أمتلك خبرة ومهارات مناسبة لهذا الدور، وأرغب في المساهمة ضمن فريقكم.

${extra ? `${extra}\n\n` : ""}أرفق سيرتي الذاتية للتفضل بالاطلاع، ويسعدني التواصل لأي مقابلة أو استفسار.

مع خالص التحية والتقدير،
${name}`,
    };
  }

  if (f.kind === "apology") {
    return {
      subject: `اعتذار بخصوص ${topic}`,
      body: `السلام عليكم،
${to} المحترم/ة،

أعتذر عن ${topic}. أقدّر تفهمكم وأؤكد حرصي على عدم تكرار ذلك، والعمل على تصحيح الأمر في أقرب وقت.

${extra ? `${extra}\n\n` : ""}شكراً لتفهمكم.
مع التقدير،
${name}`,
    };
  }

  if (f.kind === "followup") {
    return {
      subject: `متابعة بخصوص ${topic}`,
      body: `السلام عليكم،
${to} المحترم/ة،

أتابع معكم بخصوص ${topic}. إن احتجتم أي معلومات إضافية يسعدني تزويدكم بها.

${extra ? `${extra}\n\n` : ""}مع الشكر والتقدير،
${name}`,
    };
  }

  if (f.kind === "thanks") {
    return {
      subject: `شكر وتقدير — ${topic}`,
      body: `السلام عليكم،
${to} المحترم/ة،

أشكركم جزيل الشكر على ${topic}. قدّرتم جهودكم ووقتكم، وأتطلع لاستمرار التعاون.

${extra ? `${extra}\n\n` : ""}مع أطيب التحيات،
${name}`,
    };
  }

  // work
  return {
    subject: topic,
    body: `السلام عليكم ورحمة الله وبركاته،
${to} المحترم/ة،

أكتب إليكم بخصوص ${topic}.

${extra ? `${extra}\n\n` : ""}بانتظار ردكم الكريم.
مع خالص التحية،
${name}${company !== "الشركة" ? `\n${company}` : ""}`,
  };
}
