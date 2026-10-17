import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let ensured = false;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export async function ensureInquiryTable() {
  if (ensured) return;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");

  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id text PRIMARY KEY,
      type text NOT NULL,
      status text NOT NULL DEFAULT 'new',
      locale text NOT NULL DEFAULT 'de',
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      company text,
      payload jsonb NOT NULL,
      internal_note text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS inquiries_type_idx ON inquiries (type)`;
  await sql`CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries (status)`;
  await sql`CREATE INDEX IF NOT EXISTS inquiries_email_idx ON inquiries (email)`;
  ensured = true;
}
