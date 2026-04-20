# Kosmo Tournaments

Tournament and league management system for Kosmo Padel — a 5-court padel club in Moscow. Operators run tournaments and leagues; players see their schedule, live results, ratings, and season standings. Built to scale to multiple clubs in the future without over-engineering now.

All user-facing text is in Russian. Prices are in ₽. The interface is mobile-first — tournament directors run live events on a phone or tablet on-court.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4** (`@theme` tokens in `app/globals.css`)
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) — Postgres + Realtime
- **Inter** font with Cyrillic subset

## Run locally

Prerequisite: Node.js 20+.

```bash
npm install
npm run dev
# open http://localhost:3000
```

The dev server runs on port 3000 by default.

## Environment variables

Create `.env.local` at the project root:

```
NEXT_PUBLIC_SUPABASE_URL=<your supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your supabase anon key>
```

Both variables are required. `.env.local` is gitignored.

## Database setup

1. Create a Supabase project (or use the existing `kosmo-tournaments` project).
2. Open the SQL Editor and run the contents of `supabase/schema.sql`.
3. In Table Editor, enable **Realtime** on the `matches` and `rounds` tables (Replication tab → toggle on).

Row Level Security is intentionally disabled for Phase 1 (single operator, no auth). It will be enabled in Phase 3 when player accounts and multi-club support are added.

## Scripts

- `npm run dev` — start the dev server on http://localhost:3000
- `npm run build` — production build (must pass with zero errors before any check-in)
- `npm run start` — start the production server after a build
- `npm run lint` — run ESLint

## Project structure

```
app/                         App Router pages and layouts
  page.tsx                   / — tournament list
  tournament/[id]/           Tournament detail, live play, results
  players/                   Player database
components/
  ui/                        Design system primitives (Card, Button, Badge, ...)
  site/                      Chrome: PageShell, SidebarNav, Logo, MobileNav
lib/
  queries/                   Supabase data access — one file per table
  (pure business logic lives at the top level — elo, americano, leaderboard)
supabase/
  schema.sql                 Full DB schema for Phase 1
docs/                        Product and technical documentation
tasks/                       todo.md and lessons.md for the Chernoy workflow
```

See `docs/03-architecture.md` for a fuller description.

## Deployment

Vercel is the recommended host (first-party Next.js support).

1. Push the repo to GitHub.
2. Import it in Vercel (New → Project → GitHub repo).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Project Settings → Environment Variables.
4. Deploy.

## Documentation

- `docs/01-product-identity.md` — what the product is and is not
- `docs/02-user-types.md` — personas and what they need
- `docs/03-architecture.md` — stack choices, folder layout, data model, Realtime flow
- `docs/04-algorithms.md` — Americano, Mexicano, Round Robin, ELO specs

These docs must be kept up to date as features are added.
