# tool2day

Independent studio website for tool2day.com — German (default) and English.

## Commands

```bash
npm install --cache /tmp/npm-cache-tool2day
npm run dev
npm run build
```

- German: [http://localhost:3000/de](http://localhost:3000/de)
- English: [http://localhost:3000/en](http://localhost:3000/en)
- `/` redirects to `/de`

## Edit before launch

| File | What to change |
|------|----------------|
| `src/content/site.ts` | Email, social links, legal URLs |
| `src/content/de.ts` | German copy |
| `src/content/en.ts` | English copy |
| `public/logo.png` | Brand logo |

Contact form opens a `mailto:` draft — no server sending yet.
Legal pages `/impressum` and `/datenschutz` are placeholders for Germany.
