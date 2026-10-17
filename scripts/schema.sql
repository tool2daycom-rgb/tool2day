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
);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_type_idx ON inquiries (type);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries (status);
CREATE INDEX IF NOT EXISTS inquiries_email_idx ON inquiries (email);
