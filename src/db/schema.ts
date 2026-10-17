import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const inquiryTypes = ["contact", "project"] as const;
export type InquiryType = (typeof inquiryTypes)[number];

export const inquiryStatuses = [
  "new",
  "in_progress",
  "replied",
  "archived",
] as const;
export type InquiryStatus = (typeof inquiryStatuses)[number];

export const inquiries = pgTable(
  "inquiries",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull().$type<InquiryType>(),
    status: text("status").notNull().default("new").$type<InquiryStatus>(),
    locale: text("locale").notNull().default("de"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    internalNote: text("internal_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("inquiries_created_at_idx").on(table.createdAt),
    index("inquiries_type_idx").on(table.type),
    index("inquiries_status_idx").on(table.status),
    index("inquiries_email_idx").on(table.email),
  ],
);

export const inquiryReplies = pgTable(
  "inquiry_replies",
  {
    id: text("id").primaryKey(),
    inquiryId: text("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    toEmail: text("to_email").notNull(),
    fromEmail: text("from_email").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("inquiry_replies_inquiry_id_idx").on(table.inquiryId),
    index("inquiry_replies_sent_at_idx").on(table.sentAt),
  ],
);

export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
export type InquiryReply = typeof inquiryReplies.$inferSelect;
