# t2 Toys v2

Rebuild of the t2 Toys second-hand toy marketplace (Hong Kong). Expo + Supabase.

- Product spec: [`docs/SPEC.md`](docs/SPEC.md)
- Conventions for Claude Code and humans: [`CLAUDE.md`](CLAUDE.md), [`AGENTS.md`](AGENTS.md)
- Database: [`supabase/migrations`](supabase/migrations), seed in [`supabase/seed.sql`](supabase/seed.sql)

## Run it

```bash
npm install
cp .env.example .env        # optional: without it, dev builds show sample listings
npx expo start              # i = iOS simulator, a = Android, w = web
```

## Checks

```bash
npm run typecheck
npx expo lint
npm test
```

## Database

```bash
supabase start              # local stack (Docker)
supabase db reset           # applies migrations + seed
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/tests/smoke.sql
```

`supabase/tests/smoke.sql` checks the core rules (compliance gate, moderation, chat privacy, blocking, reviews, credits) and must print `ALL PASS`.

## Status

Milestone M0 (foundations) done: schema + RLS, theme tokens, zh-HK/en i18n, Supabase client, five labelled tabs, listing card, home feed. Next: M1 auth & profiles.
