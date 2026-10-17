import { randomUUID } from "crypto";
import { and, asc, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { ensureInquiryTable, getDb, hasDatabaseUrl } from "@/db/client";
import {
  inquiries,
  inquiryReplies,
  type InquiryStatus,
  type InquiryType,
} from "@/db/schema";
import { sendInquiryNotification } from "@/lib/mail";

const emailSchema = z.string().trim().email().max(200);

export const contactInquirySchema = z.object({
  type: z.literal("contact"),
  locale: z.enum(["de", "en"]),
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  service: z.string().trim().min(1).max(120),
  message: z.string().trim().min(5).max(5000),
  privacy: z.literal(true),
  website: z.string().optional().default(""),
  formStartedAt: z.number().int().positive().optional(),
});

export const projectInquirySchema = z.object({
  type: z.literal("project"),
  locale: z.enum(["de", "en"]),
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(60).optional().default(""),
  company: z.string().trim().max(160).optional().default(""),
  contactMethod: z.string().trim().max(40).optional().default(""),
  projectTypes: z.array(z.string().max(40)).max(20),
  otherProjectNote: z.string().trim().max(500).optional().default(""),
  goals: z.array(z.string().max(40)).max(20),
  otherGoalNote: z.string().trim().max(500).optional().default(""),
  websiteFeatures: z.array(z.string().max(60)).max(40),
  webappFeatures: z.array(z.string().max(60)).max(40),
  mobileFeatures: z.array(z.string().max(60)).max(60),
  hostingFeatures: z.array(z.string().max(60)).max(40),
  timeline: z.string().trim().max(40).optional().default(""),
  details: z.string().trim().max(8000).optional().default(""),
  privacy: z.literal(true),
  website: z.string().optional().default(""),
  formStartedAt: z.number().int().positive().optional(),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
export type ProjectInquiryInput = z.infer<typeof projectInquirySchema>;

function emptyLabel(value: string | undefined | null) {
  const trimmed = (value || "").trim();
  return trimmed ? trimmed : "—";
}

export function displayValue(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "string") return emptyLabel(value);
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value.map(String).join(", ");
  }
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  return String(value);
}

export async function createInquiry(
  input: ContactInquiryInput | ProjectInquiryInput,
) {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  await ensureInquiryTable();
  const db = getDb();
  const id = randomUUID();
  const now = new Date();

  const base = {
    id,
    locale: input.locale,
    name: input.name,
    email: input.email.toLowerCase(),
    status: "new" as const,
    createdAt: now,
    updatedAt: now,
    internalNote: "",
  };

  if (input.type === "contact") {
    const row = {
      ...base,
      type: "contact" as const,
      phone: null,
      company: null,
      payload: {
        service: input.service,
        message: input.message,
        privacyAccepted: true,
      },
    };
    await db.insert(inquiries).values(row);

    try {
      await sendInquiryNotification({
        type: "contact",
        name: input.name,
        email: input.email,
        id,
        locale: input.locale,
        fields: [{ label: "الخدمة المطلوبة", value: input.service }],
        messagePreview: input.message,
      });
    } catch {
      // Inquiry stays saved even if notification fails.
    }

    return { id };
  }

  const row = {
    ...base,
    type: "project" as const,
    phone: emptyLabel(input.phone) === "—" ? null : input.phone.trim(),
    company: emptyLabel(input.company) === "—" ? null : input.company.trim(),
    payload: {
      contactMethod: input.contactMethod,
      projectTypes: input.projectTypes,
      otherProjectNote: input.otherProjectNote,
      goals: input.goals,
      otherGoalNote: input.otherGoalNote,
      websiteFeatures: input.websiteFeatures,
      webappFeatures: input.webappFeatures,
      mobileFeatures: input.mobileFeatures,
      hostingFeatures: input.hostingFeatures,
      timeline: input.timeline,
      details: input.details,
      privacyAccepted: true,
    },
  };
  await db.insert(inquiries).values(row);

  try {
    await sendInquiryNotification({
      type: "project",
      name: input.name,
      email: input.email,
      id,
      locale: input.locale,
      fields: [
        { label: "نوع المشروع", value: displayValue(input.projectTypes) },
        { label: "الأهداف", value: displayValue(input.goals) },
        { label: "موعد الإطلاق", value: displayValue(input.timeline) },
        { label: "الهاتف", value: displayValue(input.phone) },
        { label: "الشركة", value: displayValue(input.company) },
      ],
      messagePreview: input.details,
    });
  } catch {
    // Inquiry stays saved even if notification fails.
  }

  return { id };
}

function startOfCurrentWeekUtc(now = new Date()) {
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset),
  );
  return start;
}

export async function listInquiries(filters: {
  type?: InquiryType | "all";
  status?: InquiryStatus | "all";
  q?: string;
  period?: "week" | "all";
}) {
  await ensureInquiryTable();
  const db = getDb();
  const clauses = [];

  if (filters.type && filters.type !== "all") {
    clauses.push(eq(inquiries.type, filters.type));
  }
  if (filters.status && filters.status !== "all") {
    clauses.push(eq(inquiries.status, filters.status));
  }
  if (filters.period === "week") {
    clauses.push(gte(inquiries.createdAt, startOfCurrentWeekUtc()));
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim()}%`;
    clauses.push(or(ilike(inquiries.name, q), ilike(inquiries.email, q)));
  }

  const where = clauses.length ? and(...clauses) : undefined;
  return db
    .select()
    .from(inquiries)
    .where(where)
    .orderBy(desc(inquiries.createdAt))
    .limit(200);
}

export type InquiryDashboardStats = {
  total: number;
  newProjects: number;
  newContacts: number;
  inProgress: number;
  replied: number;
  archived: number;
  thisWeek: number;
};

export async function getInquiryDashboardStats(): Promise<InquiryDashboardStats> {
  await ensureInquiryTable();
  const db = getDb();
  const weekStart = startOfCurrentWeekUtc();

  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      newProjects: sql<number>`count(*) filter (where type = 'project' and status = 'new')::int`,
      newContacts: sql<number>`count(*) filter (where type = 'contact' and status = 'new')::int`,
      inProgress: sql<number>`count(*) filter (where status = 'in_progress')::int`,
      replied: sql<number>`count(*) filter (where status = 'replied')::int`,
      archived: sql<number>`count(*) filter (where status = 'archived')::int`,
      thisWeek: sql<number>`count(*) filter (where created_at >= ${weekStart})::int`,
    })
    .from(inquiries);

  return {
    total: row?.total ?? 0,
    newProjects: row?.newProjects ?? 0,
    newContacts: row?.newContacts ?? 0,
    inProgress: row?.inProgress ?? 0,
    replied: row?.replied ?? 0,
    archived: row?.archived ?? 0,
    thisWeek: row?.thisWeek ?? 0,
  };
}

export async function getInquiry(id: string) {
  await ensureInquiryTable();
  const db = getDb();
  const rows = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateInquiry(
  id: string,
  patch: { status?: InquiryStatus; internalNote?: string },
) {
  await ensureInquiryTable();
  const db = getDb();
  await db
    .update(inquiries)
    .set({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.internalNote != null ? { internalNote: patch.internalNote } : {}),
      updatedAt: new Date(),
    })
    .where(eq(inquiries.id, id));
}

export async function countByStatus() {
  await ensureInquiryTable();
  const db = getDb();
  const rows = await db
    .select({
      status: inquiries.status,
      count: sql<number>`count(*)::int`,
    })
    .from(inquiries)
    .groupBy(inquiries.status);
  return rows;
}

export async function listInquiryReplies(inquiryId: string) {
  await ensureInquiryTable();
  const db = getDb();
  return db
    .select()
    .from(inquiryReplies)
    .where(eq(inquiryReplies.inquiryId, inquiryId))
    .orderBy(asc(inquiryReplies.sentAt));
}

export async function saveInquiryReply(input: {
  inquiryId: string;
  subject: string;
  body: string;
  toEmail: string;
  fromEmail: string;
}) {
  await ensureInquiryTable();
  const db = getDb();
  const id = randomUUID();
  const sentAt = new Date();
  await db.insert(inquiryReplies).values({
    id,
    inquiryId: input.inquiryId,
    subject: input.subject,
    body: input.body,
    toEmail: input.toEmail,
    fromEmail: input.fromEmail,
    sentAt,
  });
  await updateInquiry(input.inquiryId, { status: "replied" });
  return { id, sentAt };
}

