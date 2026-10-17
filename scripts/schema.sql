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

CREATE TABLE IF NOT EXISTS inquiry_replies (
  id text PRIMARY KEY,
  inquiry_id text NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  to_email text NOT NULL,
  from_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiry_replies_inquiry_id_idx ON inquiry_replies (inquiry_id);
CREATE INDEX IF NOT EXISTS inquiry_replies_sent_at_idx ON inquiry_replies (sent_at);
