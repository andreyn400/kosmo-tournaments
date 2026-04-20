# 03 — Architecture

## Stack choices

### Next.js 16 (App Router)

Chosen because:

- **Server Components by default** — pages fetch data on the server close to Supabase, no waterfall to the client.
- **Server Actions** — mutations go directly from a form to a server-run function, no hand-rolled API layer.
- **File-based routing** matches the mental model (one folder per feature: `/tournament/[id]/play/`).
- **Mobile performance** — streaming, prefetching, and instant navigation are first-class.

Next.js 16 ships version-matched documentation in `node_modules/next/dist/docs/`. The repo's `AGENTS.md` points agents there so we don't rely on stale training data.

Key Next 16 behaviors that matter for this app:

- `params` and `searchParams` in pages are `Promise` — always `await` them.
- `fetch` is not cached by default. Use the `'use cache'` directive when a page is safe to cache.
- `PageProps<'/route'>` and `LayoutProps<'/route'>` are globally generated types — prefer them over hand-typed prop shapes.

### React 19

Comes with Next 16. Gives us `useActionState`, async Server Components, the `use()` hook for consuming Server-passed promises in Client Components, and native form action support.

### TypeScript

No `any`. Full typing. Types live next to the code that uses them, except for shared shapes in `lib/types.ts`.

### Tailwind CSS 4

Tokens live in `app/globals.css` inside an `@theme` block. No `tailwind.config.ts`. The design system tokens (`--color-accent`, `--color-border`, `--radius-card`, ...) become Tailwind utilities automatically (`bg-accent`, `border-border`, `rounded-[var(--radius-card)]`).

### Supabase

- **Postgres** for all persistent data.
- **Realtime** for the live leaderboard — the `matches` and `rounds` tables have Replication enabled, and the live-play page subscribes to changes.
- **Auth and RLS** are deferred to Phase 3. Phase 1 assumes a single trusted operator.

Why Supabase over a DIY Postgres + websocket stack: Realtime, auth, and storage are first-class, the hosted database needs no operator, and the migration path if we outgrow it is just "switch the client library — the SQL is ours".

## Folder structure

```
app/                              App Router — pages and layouts only
  layout.tsx                      Root layout (lang=ru, Inter, light theme)
  page.tsx                        / — tournament list
  tournament/
    new/page.tsx                  /tournament/new — create form
    [id]/
      page.tsx                    /tournament/[id] — detail and registration
      play/page.tsx               /tournament/[id]/play — live play
      results/page.tsx            /tournament/[id]/results — final standings
  players/
    page.tsx                      /players — player database
    [id]/page.tsx                 /players/[id] — profile + history

components/
  ui/                             Design system primitives (one component per file)
    Button.tsx, Card.tsx, Badge.tsx, Input.tsx, Select.tsx, Textarea.tsx
  site/                           App chrome
    Logo.tsx, SidebarNav.tsx, MobileNav.tsx, PageShell.tsx, navLinks.ts
  tournament/                     Tournament-specific UI (added in later phases)

lib/
  supabase/
    client.ts                     Browser Supabase client
    server.ts                     Server Supabase client (with cookies handler)
  queries/                        All Supabase queries — one file per table
    tournaments.ts, players.ts, matches.ts, rounds.ts, registrations.ts, ...
  elo.ts                          Pure ELO math
  americano.ts                    Pure Americano schedule generator
  leaderboard.ts                  Pure live-standings computation
  tournament-elo.ts               Server-side tournament finalization (applies ELO)
  types.ts                        Shared TS types mirroring the DB schema
  constants.ts                    Padel levels, default ELO per level, RU labels

supabase/
  schema.sql                      Full Phase 1 schema

docs/                             Product and technical docs
tasks/                            todo.md (plan) and lessons.md (corrections log)
```

### Conventions

- **One function or component per file.** No exceptions.
- **No file exceeds 600 lines.** If a file approaches 500 lines, stop and split.
- **Group by feature, not by type.** A tournament-play thing goes in `app/tournament/[id]/play/` or `components/tournament/`, not in a generic `components/` bucket.
- **All Supabase queries live in `lib/queries/`.** Pages and components import query functions; they never write raw Supabase calls inline. This keeps data access centrally auditable and typable.
- **Business logic is pure functions in `lib/`.** No side effects, no implicit `Date.now()`, fully typed. Algorithms (Americano, ELO, leaderboard) must be testable in isolation.

## Data model overview

Nine tables, conceptually grouped:

- **People:** `players` (global, not per-club) with name, phone, level, ELO, notes.
- **Events:** `tournaments` (format, type, status, date, level range, fee, prize) and `league_seasons` (the extra config for `type=league_season`).
- **Participation:** `tournament_registrations` — who's in a tournament, with optional partner.
- **Play:** `tournament_sessions` (one per day of league play, or one for a one-day tournament) → `rounds` → `matches` (two teams of two, scores).
- **Outcomes:** `season_leaderboard` (cumulative across sessions for leagues), `rating_history` (every ELO change).

Referential integrity is enforced by foreign keys with `on delete cascade` from the top down (deleting a tournament drops all its rounds, matches, etc.).

See `supabase/schema.sql` for the authoritative schema.

## Realtime

The live-play page subscribes to Supabase Realtime for two tables:

- **`matches`** — so scores entered on any device propagate to every viewer within ~100ms.
- **`rounds`** — so advancing a round updates the UI for spectators.

The subscription is scoped to the current session's round ids, to avoid receiving unrelated match updates. The initial data comes from a server-rendered snapshot; Realtime only delivers deltas after mount.

The leaderboard is **not a materialized view** — it is recomputed on the client from the match list each time a match update lands. This keeps the server simpler and the update latency lower (no additional round-trip to refetch a derived table).

The architectural fork — server actions vs. route handlers for mutations, and the exact shape of the Realtime subscription — is revisited in plan mode when §8 is implemented.

## Deferred for later phases

- **Authentication and RLS** — Phase 3. Operators, directors, and players will each authenticate; RLS policies will gate write access.
- **Multi-club** — Phase 4+. Add `clubs` table, `club_id` FK on `tournaments`, and a `players_clubs` many-to-many for home-club affiliation.
- **Payments** — out of scope.
- **Additional formats** — Phase 2 adds Mexicano (dynamic pairings), team Americano, round robin, escalera. Phase 1 is Americano only.
