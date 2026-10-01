# Lost & Found — Reunite what matters

Elegant worldwide portal to report lost/found items, search by category + location, message safely (IG-style DMs bound to listings), and verify claims with proof questions + hand-off codes.

## Run locally
```bash
npm install
npm run dev   # http://localhost:5174
```

## Cloud upgrade (Google login + Postgres + realtime)
1. Create a Supabase project, run `supabase/migrations/001_schema.sql` in the SQL editor.
2. Supabase Auth → Providers → Google → add OAuth Client ID/Secret (redirect: `https://<proj>.supabase.co/auth/v1/callback`).
3. Storage → new public bucket `item-photos` (5MB, jpg/png/webp).
4. Set env vars locally (`.env.local`) and in Vercel:
   - `VITE_SUPABASE_URL=`
   - `VITE_SUPABASE_ANON_KEY=`
5. Without env vars the app runs in polished **demo mode** (localStorage) so Vercel deploys never crash.

## Deploy
Push to GitHub → Import in Vercel (Framework: Vite) → add env vars → Deploy.

## Trust model
No public phone/email. Per-item threads, stranger Requests inbox, proof Q&A, 6-digit hand-off code, public meetups, 90-day auto-archive.
