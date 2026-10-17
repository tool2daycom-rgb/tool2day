# tool2day

Independent studio website for tool2day.com — German (default) and English.

## Commands

```bash
npm install
npm run dev
npm run build
```

- German: [http://localhost:3000/de](http://localhost:3000/de)
- English: [http://localhost:3000/en](http://localhost:3000/en)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- `/` redirects to `/de`

## Inquiries + admin setup

Contact and Start a Project forms post to `/api/inquiries` and store rows in Postgres. The Arabic admin UI at `/admin` requires login.

1. Create a Postgres database (Neon, Vercel Postgres, or similar).
2. Copy `.env.example` to `.env.local` (local) and set the same keys in Vercel → Project → Settings → Environment Variables.
3. Set `DATABASE_URL`.
4. Generate an admin password hash:

```bash
node scripts/hash-admin-password.mjs "your-strong-password"
```

5. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and a long random `SESSION_SECRET` (≥ 32 chars).
6. Optional: set SMTP vars to email `support@tool2day.com` on each new inquiry. Inquiries are still saved if mail fails.
7. Redeploy. Open `/admin`, sign in, and confirm new form submissions appear.

The table is created automatically on first successful request (`CREATE TABLE IF NOT EXISTS`). You can also run `scripts/schema.sql` manually.

Without `DATABASE_URL`, forms return a clear error (no fake success). Without admin env vars, `/admin/login` shows a setup message.

## Edit content

| File | What to change |
|------|----------------|
| `src/content/site.ts` | Email, social links, legal URLs |
| `src/content/de.ts` / `en.ts` | Site copy |
| `src/content/work.ts` | Portfolio projects |
| `public/` | Images and assets |
