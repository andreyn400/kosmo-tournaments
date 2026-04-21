# Kosmo Tournaments — Phase 1 Plan (One-Day Americano)

Goal: build the complete one-day Americano flow end-to-end. Create tournament → add players → start → enter live scores → live leaderboard → complete tournament → ELO updates → results page. Stop after this and check in.

Workflow (Chernoy): plan first (this file), then execute task-by-task, verify in browser after each phase, log corrections to `tasks/lessons.md`.

---

## 0. Project bootstrap

- [ ] 0.1 Run `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` in `/Users/nem/Desktop/kosmo-tournaments`.
- [ ] 0.2 `npm install @supabase/supabase-js @supabase/ssr`.
- [ ] 0.3 Ask the user for Supabase project URL + anon key, create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] 0.4 Add `.env.local` to `.gitignore` (Next's template already does this — verify).
- [ ] 0.5 Run `npm run dev`, verify blank Next.js app loads at http://localhost:3000.

## 1. Database

- [ ] 1.1 Give the user the SQL schema (players, tournaments, league_seasons, tournament_registrations, tournament_sessions, rounds, matches, season_leaderboard, rating_history) to paste into Supabase SQL Editor.
- [ ] 1.2 Instruct user to enable Realtime on `matches` and `rounds` tables (Table Editor → Replication tab).
- [ ] 1.3 RLS: for Phase 1, leave RLS disabled on all tables (single operator, no auth yet). Note as a follow-up.
- [ ] 1.4 Smoke-test connection: a throwaway server component that selects `count(*)` from `players` and renders it.

## 2. Design system and layout

- [ ] 2.1 Configure Tailwind theme tokens in `tailwind.config.ts`:
  - `bg` #080d14, `card` #0d1420, `border` #1e2d42, `accent` #00e676, `text` #e8f0fe, `muted` #8899aa
  - Inter font via `next/font/google`
- [ ] 2.2 Apply base styles in `app/globals.css` + `app/layout.tsx` (dark theme, full-height body, mobile-first).
- [ ] 2.3 Set app title "Kosmo Tournaments", lang=ru, viewport meta for mobile.
- [ ] 2.4 Build small reusable UI primitives in `components/ui/`:
  - `Card` (dark panel with border)
  - `Button` (primary accent, secondary, ghost, disabled)
  - `Input`, `Select`, `Textarea` (dark-themed)
  - `Badge` (for format, status, level)
  - `Modal` (for add-player flow)
  - `Table` (for leaderboard / players)
- [ ] 2.5 Badge color rules:
  - Format: americano=accent, others=muted (greyed)
  - Status: draft=muted, registration_open=amber, in_progress=accent, completed=blue
  - Level: single palette, level code in bold

## 3. Supabase client + types

- [ ] 3.1 `lib/supabase/client.ts` (browser client via `@supabase/ssr` createBrowserClient).
- [ ] 3.2 `lib/supabase/server.ts` (server client with cookies handler).
- [ ] 3.3 `lib/types.ts` — hand-written TS types mirroring the schema (Player, Tournament, Registration, Session, Round, Match, SeasonLeaderboardRow, RatingHistoryRow). Can regenerate via `supabase gen types` later.
- [ ] 3.4 `lib/constants.ts` — padel levels array, level→default-ELO map, ELO→level threshold function, courts list [1..5], Russian status/format labels.

## 4. Core algorithms (pure, unit-testable)

- [ ] 4.1 `lib/elo.ts`:
  - `expectedScore(ratingA, ratingB)` — `1 / (1 + 10^((B-A)/400))`
  - `kFactor(playerCount)` — 16→32, 12→24, 8→16, 4→8 (round up for in-between)
  - `updateElo(ratingA, ratingB, actualScoreA, k)` — returns new rating A
  - `eloToLevel(elo)` — per threshold table
  - `levelToDefaultElo(level)` — midpoint of each band for new player creation
- [ ] 4.2 `lib/americano.ts`:
  - `generateAmericanoSchedule(playerIds: string[]): Round[]` — fixed-player-0 rotation, N/2 rounds, N/4 courts each round
  - Assert N is divisible by 4, throw otherwise
  - Include sanity tests (comment block or separate `__tests__/americano.test.ts`): with 8 players produces 4 rounds × 2 courts; with 12 players produces 6 rounds × 3 courts; no player plays twice in the same round; every pair of players meets at most expected number of times
- [ ] 4.3 `lib/leaderboard.ts`:
  - `computeLiveLeaderboard(matches, players)` — sum of raw points scored by each player across completed matches; matches played count; +/- differential; sorted desc by points then diff
- [ ] 4.4 `lib/tournament-elo.ts`:
  - `finalizeTournamentElo(tournamentId)` — server-side: loads all completed matches, for each match computes per-match ELO updates (team avg vs team avg, K by tournament size), applies sequentially in match order, writes `rating_history` rows, updates `players.elo_rating` and `players.level`

## 5. Home `/`

- [ ] 5.1 Server component that fetches tournaments ordered by `date_start` desc.
- [ ] 5.2 Header: "KOSMO TOURNAMENTS" (accent, bold, large).
- [ ] 5.3 Tournament cards: name, format badge, date (ru locale), status badge, registered/max count. Click → `/tournament/[id]`.
- [ ] 5.4 Empty state: "Нет турниров. Создайте первый." + CTA to `/tournament/new`.
- [ ] 5.5 "+ Новый турнир" button in top right of header.

## 6. Create tournament `/tournament/new`

- [ ] 6.1 Client form component with fields: Название, Формат (only americano active; team_americano/mexicano/team_mexicano/round_robin/escalera disabled with "скоро" suffix), Дата, Уровень мин/макс (two selects from padel levels), Макс. игроков (number, live validation: must be divisible by 4 for americano), Корты (checkboxes K1–K5, default all), Взнос ₽, Призы (textarea), Заметки (textarea).
- [ ] 6.2 Submit → server action that inserts into `tournaments` with `status='draft'`, `type='one_day'`. Redirect to `/tournament/[id]`.
- [ ] 6.3 Inline validation + disabled submit until valid.

## 7. Tournament detail `/tournament/[id]`

- [ ] 7.1 Server component loads tournament + registrations (joined with players) + player count.
- [ ] 7.2 Info card: name, format badge, date, level range, courts, fee, prizes, notes.
- [ ] 7.3 Status bar: current status label + primary action button (state machine below).
- [ ] 7.4 Registered players list: row per registration — name, level badge, ELO, status. Show `count / max`.
- [ ] 7.5 "Добавить игрока" → modal:
  - Search input (debounced, queries `players` by `name ilike`)
  - Result rows: name, level, ELO, click to add (creates a `tournament_registrations` row)
  - "+ Новый игрок" toggle → inline form (name, phone optional, level select) → on submit creates `players` row with ELO = `levelToDefaultElo(level)`, then registers to tournament
  - Prevent duplicates (unique constraint already enforces)
- [ ] 7.6 Action button state machine:
  - `draft` → "Открыть регистрацию" (sets status to `registration_open`)
  - `registration_open` → "Начать турнир"; disabled if player count not divisible by 4 with tooltip "Нужно кратное 4 игроков". On click: create `tournament_sessions` row (session_number=1, date=tournament.date_start), generate schedule via `generateAmericanoSchedule`, insert `rounds` + `matches`, set tournament status to `in_progress`, redirect to `/tournament/[id]/play`.
  - `in_progress` → "Перейти к турниру →" link to `/play`
  - `completed` → "Результаты →" link to `/results`

## 8. Live play `/tournament/[id]/play`

Most important screen. Mobile-first.

- [ ] 8.1 Server component loads tournament, current session, all rounds + matches + registered players.
- [ ] 8.2 Determine "current round" = first round with status `pending` or `in_progress`. If all rounds completed, show "Завершить турнир" instead.
- [ ] 8.3 Top bar: tournament name, "Раунд X из Y", status.
- [ ] 8.4 Match cards (one per court in the current round): "Корт N", team1 names, "vs", team2 names, two score input fields, "Записать" button. On submit: update `matches` row with `team1_score`, `team2_score`, `status='completed'`.
- [ ] 8.5 Card shows green check + locked scores when completed.
- [ ] 8.6 When all matches of current round are completed, show "Завершить раунд и сгенерировать следующий" button; on click marks round `completed`, advances to next round. (All rounds are pre-generated at tournament start, so this is just a visual advance — no regeneration needed for Americano with fixed roster. Confirm this reading of the spec in todo note.)
- [ ] 8.7 Live leaderboard component:
  - Columns: #, Имя, Очки, Матчи, +/-
  - Subscribes via Supabase Realtime to `matches` table filtered by `round_id in (...)`; on any change, recomputes with `computeLiveLeaderboard`
  - Leader row highlighted in accent
  - Mobile: below matches; desktop: sticky right sidebar
- [ ] 8.8 Last round + all matches completed → "Завершить турнир" button: calls `finalizeTournamentElo`, sets tournament `status='completed'`, session `status='completed'`, redirects to `/results`.

## 9. Results `/tournament/[id]/results`

- [ ] 9.1 Server component loads tournament, all matches, all players, and `rating_history` rows for this tournament per player.
- [ ] 9.2 Podium for top 3 (🥇🥈🥉, name, points).
- [ ] 9.3 Standings table: rank, name, level, ELO change (+12 green / -5 red), total points, matches played.
- [ ] 9.4 "Поделиться результатами" — client button that copies `window.location.href` to clipboard, shows "Скопировано".
- [ ] 9.5 "← Назад к турнирам" link to `/`.

## 10. Players `/players` + `/players/[id]`

- [ ] 10.1 `/players`: search (name ilike), table of name, level badge, ELO, tournaments played (count of distinct tournaments via registrations), last active (max `rating_history.recorded_at` or registrations).
- [ ] 10.2 `/players/[id]`: profile card (name, level, ELO, contact), ELO history chart (simple line — can start as a list of changes), match history list (most recent matches with opponents, score, tournament, date).

## 11. End-to-end verification

- [ ] 11.1 Manual run-through in browser with 8 players:
  - Create tournament
  - Add 8 players (mix of existing + new)
  - Open registration → Start tournament
  - Enter scores for all matches in round 1, advance
  - Repeat for rounds 2–4
  - Live leaderboard updates correctly as scores are saved
  - Finalize tournament → results page shows podium + correct ELO changes
  - ELO values in `players` table match manual calculation on one sample match
- [ ] 11.2 Second run with 12 players to exercise a different K-factor and court count.
- [ ] 11.3 Log anything that needed correction to `tasks/lessons.md`.
- [ ] 11.4 Stop and check in with user before starting Phase 2.

---

## Architectural notes (to revisit before Phase 2)

- Multi-club: every tournament-scoped table already keyed by `tournament_id`; players are global. When Phase N adds clubs, add `club_id` to `tournaments` and `players.clubs` many-to-many — no restructuring needed.
- Auth: deferred. Add Supabase auth + RLS policies as Phase ≥3. For now single-operator flow.
- Realtime: only `matches` and `rounds` need it in Phase 1. Don't over-subscribe.
- Server actions vs route handlers: prefer server actions for mutations; route handlers only if needed by Realtime/client flows.
- Testing: no framework in Phase 1; assertions inside `lib/americano.ts` + `lib/elo.ts` as inline sanity checks or a minimal `vitest` setup if it stays cheap. Will revisit.

## Open questions for the user before coding

1. Supabase project URL + anon key?
2. Is there already a Supabase project created, or do I instruct you to create one first?
3. Confirm: for Phase 1, no authentication — anyone on the URL can create tournaments and enter scores. OK?
4. Confirm: "Завершить раунд" in §8.6 is just an advance button (rounds pre-generated), not a regeneration step. OK?

---

# Phase 2 — Additional formats

## 2A. Round Robin (current)

- [ ] 2A.1 `lib/algorithms/roundRobin.ts` — `generateRoundRobinSchedule(playerIds): ScheduledRound[]`. Pair formation: consecutive pairs in input order (pair i = [players[2i], players[2i+1]]). Classical circle method on pair indices: P = N/2 pairs → P−1 rounds × P/2 matches per round. Validate N % 4 === 0. Total matches = C(P,2).
- [ ] 2A.2 `lib/leaderboard.ts` — add `wins` field; add `sortStrategy: "points" | "wins"` parameter (default "points"). RR uses "wins": sort by wins desc → +/− desc → matches desc → name asc.
- [ ] 2A.3 `lib/start-tournament.ts` — dispatch on `tournament.format`: "americano" → existing, "round_robin" → new algorithm. Same N%4 validation, same session/rounds/matches insertion logic.
- [ ] 2A.4 Remove "формат пока не поддерживается" gating in create form — `round_robin` becomes selectable. Validation message for max_players says "кратно 4".
- [ ] 2A.5 Thread `tournament.format` through play + results pages so leaderboard uses the correct sort strategy. Add a "В" (wins) column visible only for wins-sorted formats.
- [ ] 2A.6 Update `docs/04-algorithms.md` with a Round Robin section covering pair formation, circle rotation, ranking rules.
- [ ] 2A.7 `npm run build` clean. Check in with user for browser verification.

## 2B. Mexicano (current)

- [ ] 2B.1 `lib/algorithms/mexicano.ts` — `generateMexicanoRound(orderedPlayerIds, roundNumber): ScheduledRound`. Pair each quartet [0,1] vs [2,3], [4,5] vs [6,7], .... Also export `mexicanoTotalRounds(n) = n/2`.
- [ ] 2B.2 `lib/total-rounds.ts` — `totalRoundsFor(format, playerCount)` shared helper (americano = N−1, round_robin = N/2−1, mexicano = N/2).
- [ ] 2B.3 `lib/start-tournament.ts` — mexicano branch inserts session + round 1 only (first-round pairings from registration order).
- [ ] 2B.4 `app/tournament/[id]/play/advance-round-action.ts` — when next round doesn't exist in DB and format is mexicano, compute live leaderboard, derive ordered player list, generate + insert next round, mark in_progress. Bounded by totalRoundsFor.
- [ ] 2B.5 Thread `totalRounds` through `play/page.tsx` → `LivePlayBoard` — header shows "Раунд N из totalRounds", dots pre-render all future round slots, `isLast` keyed by round_number not array index.
- [ ] 2B.6 Update `docs/04-algorithms.md` with Mexicano algorithm, round count policy, dynamic-generation flow.
- [ ] 2B.7 `npm run build` clean. Check in with user for browser verification.

## 2C. Team formats (current)

Goals: director registers pairs; partners fixed across all rounds; points/ELO per individual but leaderboard groups by pair; Team Americano = classical circle on pairs; Team Mexicano = dynamic per-round matching rank 1 pair vs rank 2 pair, rank 3 vs rank 4, etc.

- [ ] 2C.1 `lib/algorithms/teamAmericano.ts` — `generateTeamAmericanoSchedule(pairs: Array<[string, string]>): ScheduledRound[]`. Classical circle on pair indices, P−1 rounds × P/2 matches per round.
- [ ] 2C.2 `lib/algorithms/teamMexicano.ts` — `generateTeamMexicanoRound(orderedPairs, roundNumber): ScheduledRound` + `teamMexicanoTotalRounds(n) = n/2`.
- [ ] 2C.3 `lib/total-rounds.ts` — add `team_americano` (N/2 − 1), `team_mexicano` (N/2).
- [ ] 2C.4 `lib/leaderboard.ts` — add `computePairLeaderboard(matches, players, pairs, strategy)`; extend `sortStrategyForFormat` so `team_americano` uses `"wins"`.
- [ ] 2C.5 `lib/queries/registrations.ts` — `createRegistrationPair(tournamentId, a, b)`, `deleteRegistrationWithPartner(id)`.
- [ ] 2C.6 `lib/start-tournament.ts` — accept optional `pairs`; dispatch `team_americano` (full schedule) and `team_mexicano` (first round only).
- [ ] 2C.7 `app/tournament/[id]/start-tournament-action.ts` — for team formats, derive `pairs` from `registrations.partner_id` pairings before calling `startTournament`.
- [ ] 2C.8 `app/tournament/[id]/add-pair-action.ts` — new action: atomic insert of two reciprocal registrations.
- [ ] 2C.9 `app/tournament/[id]/AddPairPanel.tsx` — new client component with two player selects.
- [ ] 2C.10 `app/tournament/[id]/remove-player-action.ts` — when registration has `partner_id`, delete both halves.
- [ ] 2C.11 `app/tournament/[id]/RegistrationRow.tsx` — display partner name when set.
- [ ] 2C.12 `app/tournament/[id]/page.tsx` — render AddPairPanel for team formats; pass partner names into rows.
- [ ] 2C.13 `app/tournament/[id]/play/advance-round-action.ts` — `team_mexicano` branch generates next round from pair-leaderboard order.
- [ ] 2C.14 `app/tournament/[id]/play/LeaderboardPanel.tsx` — pair grouping when `pairs` prop is present.
- [ ] 2C.15 `app/tournament/[id]/play/LivePlayBoard.tsx` + `play/page.tsx` — thread pairs through.
- [ ] 2C.16 `app/tournament/[id]/results/page.tsx` — pair leaderboard for team formats.
- [ ] 2C.17 `docs/04-algorithms.md` — document Team Americano + Team Mexicano.
- [ ] 2C.18 `npm run build` clean. Hand off to user for browser verification of both formats together.

## 2D. League seasons — checkpoint 1

Scope: create league + run first session end-to-end, cumulative leaderboard after session completion. Individual formats only (americano, round_robin, mexicano). Team formats in leagues deferred. No finals, no points-table editing UI, no persisted season_leaderboard writes.

- [x] 2D.1 `lib/league-points.ts` — `pointsForPosition(table, playerCount, position)` pure lookup, handles unknown buckets.
- [x] 2D.2 `lib/session-leaderboard.ts` — `computeSessionFinishingOrder(matches, players, format, pairs?)` returns ordered player IDs with per-player "position points" (pair members share the pair's position).
- [x] 2D.3 `lib/season-leaderboard.ts` — `computeSeasonLeaderboard(sessions, matchesBySession, tournament, leagueSeason, players)` aggregates per-player total, sessions played, best finish, avg. Qualification flag for top N.
- [x] 2D.4 `lib/start-session.ts` — factor session creation out of `start-tournament.ts`.
- [x] 2D.5 `lib/start-tournament.ts` — one-day path creates the session row first then calls `start-session`.
- [x] 2D.6 `lib/session-finalization.ts` — per-session ELO. `finalizeTournamentElo` now loops sessions.
- [x] 2D.7 `lib/queries/league-seasons.ts` — `createLeagueSeason`, `getLeagueSeason`.
- [x] 2D.8 `lib/queries/sessions.ts` — `updateSessionStatus`, `getSession`, `createSessionsForDates` batch insert.
- [x] 2D.9 `app/league/new/page.tsx` + `CreateLeagueForm.tsx` + `action.ts` — league creation form.
- [x] 2D.10 `app/tournament/[id]/page.tsx` — league branch rendering sessions list + top-5 season panel + league members.
- [x] 2D.11 `app/tournament/[id]/SessionsList.tsx` — one row per session with contextual action button.
- [x] 2D.12 `app/tournament/[id]/season/page.tsx` — full season leaderboard table.
- [x] 2D.13 `app/tournament/[id]/session/[sessionId]/select/page.tsx` + `SelectPlayersForm.tsx` + `start-session-action.ts`.
- [x] 2D.14 `app/tournament/[id]/play/page.tsx` — resolves active session by status.
- [x] 2D.15 `app/tournament/[id]/play/finalize-tournament-action.ts` — league branch finalizes only current session, stays in `in_progress`, redirects to tournament detail.
- [x] 2D.16 `app/page.tsx` — "+ Новая лига" next to "+ Новый турнир".
- [x] 2D.17 `npm run build` + `npm run lint` clean.

---

# Phase 4 — Courts, time, scoring systems, calendar

Scope: 4 independent features. Execute in the order listed. `npm run build` clean after each feature; check in with user for browser verification before starting the next. No batching.

All SQL migrations are written in `supabase/schema.sql` as a new **"-- Phase 4 migrations"** block appended at the bottom of the file, AND handed to the user as a copy/pasteable snippet to run in Supabase SQL Editor. Claude does not run DB migrations directly.

---

## 4A. Courts management

Move from hardcoded `[1,2,3,4,5]` in `tournaments.courts jsonb` → a real `courts` table, with per-court metadata (surface, status, notes) and tournaments referencing court UUIDs.

### 4A.0 Migration (hand to user)

- [ ] 4A.0.1 Append to `supabase/schema.sql` — Phase 4 migration block:
  ```sql
  create table courts (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    number int not null,
    surface text check (surface in ('artificial_grass','grass','concrete','carpet')) default 'artificial_grass',
    status text check (status in ('active','maintenance')) default 'active',
    notes text,
    created_at timestamptz default now()
  );
  alter table tournaments add column court_ids uuid[] default '{}';
  alter table matches add column court_id uuid references courts(id);
  ```
  Keep legacy `tournaments.courts jsonb` column untouched for now (it's dead weight — new code reads `court_ids`). Remove in a follow-up once all live tournaments are migrated. Same for `matches.court_number` — kept for ordering; new inserts populate both.
- [ ] 4A.0.2 Tell user to paste this block into Supabase SQL Editor. Confirm success before moving on.

### 4A.1 Types + queries

- [ ] 4A.1.1 `lib/types.ts` — add `CourtSurface`, `CourtStatus`, `Court` types; extend `Tournament` with `court_ids: string[]`; extend `Match` with `court_id: string | null`.
- [ ] 4A.1.2 `lib/queries/courts.ts` — new file: `listCourts`, `listActiveCourts`, `getCourt`, `createCourt`, `updateCourt`, `deleteCourt`.
- [ ] 4A.1.3 `lib/queries/tournaments.ts` — `createTournament` accepts `court_ids`; `getTournament` / `listTournaments` already `select("*")` so no change there.
- [ ] 4A.1.4 `lib/constants.ts` — add `COURT_SURFACE_LABEL_RU`, `COURT_STATUS_LABEL_RU`. Remove `DEFAULT_COURTS` (no longer hardcoded).

### 4A.2 /courts page

- [ ] 4A.2.1 `components/site/navLinks.ts` — add `{ href: "/courts", label: "Корты", icon: "🎾" }` between `/players` and `/analytics`.
- [ ] 4A.2.2 `app/courts/page.tsx` — server component, `listCourts`, render `<CourtsPanel>`. Empty state card if zero courts.
- [ ] 4A.2.3 `app/courts/CourtsPanel.tsx` — client component. Grid of `CourtCard`s. "+ Добавить корт" button opens `<CourtModal>`. No file over 600 lines.
- [ ] 4A.2.4 `app/courts/CourtCard.tsx` — one card per court: name + number, surface badge, status badge (green=active, amber=maintenance), actions (edit, delete).
- [ ] 4A.2.5 `app/courts/CourtModal.tsx` — modal dialog (`<dialog>` element with backdrop). Used for both create and edit. Fields: name, number (1–10), surface dropdown, status dropdown, notes. Validates name non-empty, number 1–10, surface/status in enum. Per the project's "no modals" convention I'm overriding only because the user explicitly asked for modals on this screen.
- [ ] 4A.2.6 `app/courts/create-court-action.ts` — server action `createCourtAction(input)`, `revalidatePath("/courts")`.
- [ ] 4A.2.7 `app/courts/update-court-action.ts` — server action `updateCourtAction(id, input)`, `revalidatePath`.
- [ ] 4A.2.8 `app/courts/delete-court-action.ts` — server action. Blocks if any tournament references the court; returns `{ error }`.

### 4A.3 Tournament creation uses courts

- [ ] 4A.3.1 `app/tournament/new/page.tsx` — server component: `listActiveCourts()`. If zero courts, render empty-state card "Добавьте корты прежде чем создавать турниры" with link to `/courts` (block the form entirely).
- [ ] 4A.3.2 `app/tournament/new/CreateTournamentForm.tsx` — accepts `courts: Court[]` prop. Add "Корты" field: checkbox list of active courts with court name + surface badge. Default: all selected. Hidden input `court_ids` as comma-separated UUIDs.
- [ ] 4A.3.3 `app/tournament/new/action.ts` — parse `court_ids`, validate each is a valid UUID in active courts, require at least one, save.
- [ ] 4A.3.4 `app/league/new/page.tsx` + `CreateLeagueForm.tsx` + `action.ts` — same treatment for leagues.

### 4A.4 Play screen uses real court names

- [ ] 4A.4.1 `lib/start-session.ts` — replace `courts[m.courtIndex] ?? m.courtIndex + 1` logic with: fetch `listCourts()` where `id in tournament.court_ids`, sort by `number`, map `courtIndex` to `court.id` and `court.number`. Insert both `court_id` (UUID) and `court_number` (int) on each match.
- [ ] 4A.4.2 `app/tournament/[id]/play/advance-round-action.ts` — same replacement in the mexicano next-round branch.
- [ ] 4A.4.3 `app/tournament/[id]/play/page.tsx` — fetch `listCourts()` for the tournament's `court_ids`, pass as `courts` prop to `LivePlayBoard`.
- [ ] 4A.4.4 `app/tournament/[id]/play/LivePlayBoard.tsx` — accept `courts` prop, build `courtById: Map<string, Court>`, pass through `RoundPanel` → `MatchCard`.
- [ ] 4A.4.5 `app/tournament/[id]/play/RoundPanel.tsx` — pass `courtById` down.
- [ ] 4A.4.6 `app/tournament/[id]/play/MatchCard.tsx` — "Корт {court.name}" if `match.court_id` present and found in map, fallback to "Корт {court_number ?? '—'}".
- [ ] 4A.4.7 `app/tournament/[id]/play/scoreboard/page.tsx` + `Scoreboard.tsx` — same courts prop + display change.

### 4A.5 Verification

- [ ] 4A.5.1 `npm run build` clean, zero TS errors.
- [ ] 4A.5.2 Hand off to user: create 3 courts at `/courts`, create a new tournament selecting 2 of 3, start session, verify match cards show real court names. Delete a court referenced by a tournament → error surfaced.

---

## 4B. Time for tournaments and sessions

### 4B.0 Migration (hand to user)

- [ ] 4B.0.1 Append to `supabase/schema.sql`:
  ```sql
  alter table tournaments add column start_time time;
  alter table tournament_sessions add column start_time time;
  ```
- [ ] 4B.0.2 User pastes + runs.

### 4B.1 Types + pure helpers

- [ ] 4B.1.1 `lib/types.ts` — add `start_time: string | null` (stored as `"HH:MM"`) on `Tournament` and `TournamentSession`.
- [ ] 4B.1.2 `lib/time-slots.ts` (new) — pure: `generateTimeSlots(startMin = "07:00", endMin = "23:00", stepMin = 30): string[]` → `["07:00","07:30",...,"23:00"]`.
- [ ] 4B.1.3 `lib/format-date.ts` — add `formatDateTimeRu(dateISO: string, time: string | null): string` → `"19 апреля 2026 · 19:00"` if time present, otherwise just the date.

### 4B.2 Form updates

- [ ] 4B.2.1 `app/tournament/new/CreateTournamentForm.tsx` — new field "Время начала" `<Select name="start_time">` populated from `generateTimeSlots()`. Default `""` (empty → null). Placed next to "Дата начала".
- [ ] 4B.2.2 `app/tournament/new/action.ts` — validate `start_time` matches `/^[0-2]\d:[0-5]\d$/` or empty; save.
- [ ] 4B.2.3 `lib/queries/tournaments.ts` — thread `start_time` through `createTournament`.
- [ ] 4B.2.4 `app/league/new/CreateLeagueForm.tsx` — new field "Время начала сессий по умолчанию". Applied to all generated sessions on creation.
- [ ] 4B.2.5 `app/league/new/action.ts` — pass `default_start_time` to `createSessionsForDates`.
- [ ] 4B.2.6 `lib/queries/sessions.ts` — `createSessionsForDates(tournament_id, dates, default_start_time)` writes `start_time` on each new row. Add `updateSessionStartTime(sessionId, time)`.
- [ ] 4B.2.7 `app/tournament/[id]/session/[sessionId]/select/SelectPlayersForm.tsx` — add "Время начала" time picker above the candidates list, defaulting to the session's current `start_time` (or the league default).
- [ ] 4B.2.8 `app/tournament/[id]/session/[sessionId]/select/start-session-action.ts` — accept `start_time` from form and persist via `updateSessionStartTime` before creating rounds.

### 4B.3 Display

- [ ] 4B.3.1 `app/tournament/[id]/page.tsx` — info card "Даты" row uses `formatDateTimeRu(t.date_start, t.start_time)` for start, fallback for end.
- [ ] 4B.3.2 `app/tournament/[id]/SessionsList.tsx` — each session row shows `formatDateTimeRu(session.session_date, session.start_time)`.
- [ ] 4B.3.3 `components/tournament/TournamentCard.tsx` — append ` · HH:MM` after date range if `start_time` set.

### 4B.4 Verification

- [ ] 4B.4.1 `npm run build` clean.
- [ ] 4B.4.2 Hand off: create tournament with time 19:00 → shown as "19 апреля 2026 · 19:00" on home card + detail. League: default time propagates to sessions; per-session override on select page works.

---

## 4C. Scoring systems

Replace the current "two ints per match" model with a scoring-system-aware one. 8 systems across 3 groups (points, games, sets). `matches.score_detail jsonb` holds the detail for sets-based; `team1_score`/`team2_score` always store a comparable scalar (sets won for sets-based; direct points/games otherwise).

### 4C.0 Migration (hand to user)

- [ ] 4C.0.1 Append to `supabase/schema.sql`:
  ```sql
  alter table tournaments add column scoring_system text
    check (scoring_system in ('points_16','points_21','points_32','games_16','games_24','games_32','sets_best3','sets_supertiebreak'))
    default 'games_24';
  alter table matches add column score_detail jsonb;
  ```
- [ ] 4C.0.2 User pastes + runs.

### 4C.1 Types + pure helpers

- [ ] 4C.1.1 `lib/types.ts` — add `ScoringSystem` union; `scoring_system: ScoringSystem` on `Tournament`; `score_detail: unknown` on `Match` (typed narrower in the scoring module).
- [ ] 4C.1.2 `lib/scoring-systems.ts` (new) — pure helpers:
  - `SCORING_SYSTEM_LABEL_RU` — `{ points_16: "До 16 очков", games_24: "До 24 геймов (рекомендуется)", sets_best3: "3 сета (с тай-брейком)", ... }`
  - `SCORING_SYSTEM_GROUP_RU` — `{ points: "— Очки —", games: "— Геймы —", sets: "— Сеты —" }`
  - `scoringGroup(s)` → `"points" | "games" | "sets"`
  - `SCORING_SYSTEM_HELPER_RU` — one-sentence description per system for the create-form helper.
  - `scoringTarget(s)` → `16|21|32|24|null`
  - `SetsDetail` type — `{ sets: Array<[number, number]>; supertiebreak?: [number, number] }`
  - `validatePointsScore(system, a, b)` — strict: winner ≥ target, loser < target, loser < winner.
  - `validateGamesScore(system, a, b)` — `a + b ∈ [target-2, target+2]`, `a ≠ b`.
  - `validateSetsScore(system, detail)` — per spec; sets of 6 (allow 7-5, 7-6 tiebreak), super-tiebreak to 10 only when sets split 1–1.
  - `setsSummary(detail)` → `"6–3, 6–4"` or with super-tiebreak `"6–3, 3–6, 10–7"`.
  - `setsWon(detail)` → `[team1SetsWon, team2SetsWon]`.
  - `setsGameDifferential(detail)` → `[team1GamesTotal, team2GamesTotal]` for +/− calculation.
- [ ] 4C.1.3 `lib/leaderboard.ts` — extend `computeLiveLeaderboard` / `computePairLeaderboard` to accept `scoring_system`. For sets-based, sum games across sets+super-tiebreak for +/−; non-sets sum raw scores as today.

### 4C.2 Create form

- [ ] 4C.2.1 `app/tournament/new/CreateTournamentForm.tsx` — new "Система счёта" `<select>` with `<optgroup label="— Очки —">...</optgroup>` × 3 groups. Client-side state tracks selection; helper text under select shows `SCORING_SYSTEM_HELPER_RU[selected]`. Default `games_24`.
- [ ] 4C.2.2 `app/tournament/new/action.ts` — validate scoring_system in enum; save.
- [ ] 4C.2.3 `lib/queries/tournaments.ts` — thread through.

### 4C.3 Play screen score input

- [ ] 4C.3.1 `app/tournament/[id]/play/PointsScoreInput.tsx` (new) — two number inputs side-by-side; label "До {target} {очков|геймов}"; returns `{ team1, team2 }` ints.
- [ ] 4C.3.2 `app/tournament/[id]/play/SetsScoreInput.tsx` (new) — sets row 1 + row 2 always visible; row 3 rendered when both previous rows are filled AND sets are split 1–1; for `sets_supertiebreak`, row 3 is super-tiebreak labeled "Супер тай-брейк · до 10". Returns `{ sets: [...], supertiebreak?: [...] }`.
- [ ] 4C.3.3 `app/tournament/[id]/play/MatchCard.tsx` — dispatches to PointsScoreInput (points/games) or SetsScoreInput (sets) based on `tournament.scoring_system`. Accepts new `scoringSystem` prop.
- [ ] 4C.3.4 `app/tournament/[id]/play/submit-score-action.ts` — accept either `{ team1Score, team2Score }` or `{ scoreDetail }`. Compute validated `team1_score` / `team2_score` + optional `score_detail` based on system and save via `updateMatchScore`.
- [ ] 4C.3.5 `lib/queries/matches.ts` — `updateMatchScore` accepts optional `score_detail`.
- [ ] 4C.3.6 `app/tournament/[id]/play/LivePlayBoard.tsx` / `RoundPanel.tsx` — thread `scoringSystem` down.
- [ ] 4C.3.7 Completed-match display inside MatchCard: points/games → `"21 – 14"`; sets → `setsSummary(detail)`.

### 4C.4 Downstream display

- [ ] 4C.4.1 `app/tournament/[id]/play/scoreboard/Scoreboard.tsx` — if sets-based, show `setsSummary` in any per-match display (current scoreboard only shows leaderboard — leave unchanged unless we add match-block display; verify no regression).
- [ ] 4C.4.2 `app/tournament/[id]/results/page.tsx` — same match-display logic for sets if we surface per-match rows (current page only shows leaderboard, so skip if no per-match UI exists).
- [ ] 4C.4.3 `lib/leaderboard.ts` — use `setsGameDifferential` for +/− when sets-based.

### 4C.5 Verification

- [ ] 4C.5.1 `npm run build` clean.
- [ ] 4C.5.2 Hand off: create a points_21 tournament, verify inputs; create a sets_supertiebreak tournament; enter 6–3, 3–6 → super-tiebreak row appears; enter 10–7; match completes; leaderboard totals correct.

---

## 4D. Calendar — mini widget + full page

Two sub-features: 4D.1 is sidebar widget (small, no DB), 4D.2 is the full page (largest single piece of the phase — confirm design before building views).

### 4D.1 Mini calendar in sidebar (Feature 4A in spec)

- [ ] 4D.1.1 `lib/calendar-grid.ts` (new) — pure: `monthGrid(year, month)` returns `Array<{ date: string; inMonth: boolean; isToday: boolean }>` of 42 cells (6 × 7), Mon-start.
- [ ] 4D.1.2 `components/site/MiniCalendar.tsx` (new) — client component:
  - State: displayed `year`, `month` (default: current)
  - Renders header `◀  Апрель 2026  ▶` + weekday row (Пн Вт Ср Чт Пт Сб Вс) + grid
  - Adjacent-month days: `text-fade`
  - Today: `bg-accent text-white` rounded
  - Click a cell → `router.push("/calendar?view=day&date=YYYY-MM-DD")`
  - Fits in 240px sidebar: font `text-[11px]`, padding ≤ 2
- [ ] 4D.1.3 `components/site/PageShell.tsx` — add `<MiniCalendar />` above the `© Kosmo Padel` footer, inside the aside. Desktop only (`hidden md:block` wrapper).

### 4D.2 Full calendar page (Feature 4B in spec) — plan finalized 2026-04-19

Full page at `/calendar` with three views (Day / Week / Month). Read-only for Phase 1 — no drag-to-reschedule, no click-to-create, no conflict detection. Russian UI, mobile-first.

#### In scope
- Three views with URL-driven state
- Day view: time × courts grid
- Week view: time × days grid (Mon-start)
- Month view: 6×7 day grid with event pills
- Event block click → popover with link to `/tournament/[id]`
- Navigation: prev/next (step matches current view), "Сегодня", jump-to-date, view switcher
- Mini-calendar day cells become clickable and navigate to `/calendar?view=day&date=...`
- Tournaments and leagues get a `duration_hours` field (new migration)

#### Out of scope (documented, not built)
- Drag-to-reschedule or click-empty-slot-to-create
- Conflict detection (two tournaments on same court/time)
- Multi-day event spanning in views (we render on `date_start`; a session on `session_date`)
- Search / filters (by format, level, status)
- iCal / Google Calendar export
- Mobile Day view with all 5 courts side-by-side → horizontal scroll acceptable, not a grid redesign

#### 4D.2.0 Migration — hand to user first

- [ ] 4D.2.0.1 Append to `supabase/schema.sql`:
  ```sql
  alter table tournaments add column duration_hours int not null default 2;
  alter table tournaments add constraint duration_hours_range
    check (duration_hours between 1 and 12);
  ```
- [ ] 4D.2.0.2 Hand to user for paste + run. Stop. Resume after confirmation.

#### 4D.2.1 URL state (the architectural spine)

Route: `/calendar?view={day|week|month}&date=YYYY-MM-DD`

- **Server component** (`app/calendar/page.tsx`) owns parsing: reads `searchParams`, coerces invalid/missing values (default `view=day`, `date=today`), computes the visible range via `lib/calendar-range.ts`, fetches data, passes both params + fetched data to `<CalendarClient>`.
- **Client component** (`app/calendar/CalendarClient.tsx`) never owns `view` / `date` state locally. Every navigation action calls `router.push("/calendar?view=X&date=Y")` — the URL *is* the state. This keeps back/forward working and makes shareable links trivial.
  - `push` (not `replace`) so browser back returns to the previous day/view. Same convention as Google Calendar. Exception: the date-input jump uses `push` too; it's an intentional user action.
- **Step sizes for prev/next**:
  - Day view: ±1 day
  - Week view: ±7 days (keeps the Monday anchor)
  - Month view: ±1 calendar month (not 30 days — handles Feb/leap correctly via `new Date(y, m ± 1, 1)`)
- **View switch** preserves `date`. If switching from week/month to day with today inside the range, keep today; otherwise keep `date` param as-is.
- **Guardrails**: invalid `view` → default `day`; invalid `date` (not YYYY-MM-DD or unparseable) → today. Done server-side before data fetch so the client always receives valid inputs.

#### 4D.2.2 Data layer

- [ ] 4D.2.2.1 `lib/types.ts` — add `duration_hours: number` to `Tournament`.
- [ ] 4D.2.2.2 `lib/queries/tournaments.ts` — `createTournament` input accepts optional `duration_hours` (defaults to DB default 2 if omitted).
- [ ] 4D.2.2.3 `lib/queries/calendar.ts` — extend (keep existing `listEventDates` for the mini-calendar; add `listCalendarEventsInRange`):

  ```ts
  export interface CalendarEvent {
    key: string;                       // stable React key: `${tournamentId}:${sessionId ?? date}`
    kind: "session" | "tournament_pending";
    date: string;                       // YYYY-MM-DD (session.session_date OR tournament.date_start)
    startTime: string | null;           // HH:MM (session.start_time ?? tournament.start_time)
    durationHours: number;              // tournament.duration_hours (sessions inherit parent)
    tournamentId: string;
    tournamentName: string;
    tournamentType: TournamentType;
    tournamentStatus: TournamentStatus;
    format: TournamentFormat;
    courtIds: string[];                 // tournament.court_ids
    sessionId?: string;
    sessionNumber?: number;
    sessionStatus?: SessionStatus;
  }

  export async function listCalendarEventsInRange(
    startIso: string, endIso: string,
  ): Promise<CalendarEvent[]>
  ```

  Implementation (two queries, in parallel):

  1. **Sessions** in `[startIso, endIso]`, joined to their tournament for name/format/status/court_ids/duration/type. Emit one `CalendarEvent` per session (kind: `"session"`).
  2. **Tournaments** where `date_start` is in range AND the tournament has zero sessions — draft/registration_open tournaments that haven't been launched yet. Emit kind: `"tournament_pending"`. Uses a left-join-style filter or a separate "no session exists" check.

  No dedup needed: step 1 covers every launched tournament's session; step 2 covers only never-launched ones. They're disjoint by construction.

  Not in V1: `player_count`. Two extra subqueries per row for a nice-to-have number — defer to V2. The popover can say "Игроки: по клику" pointing to `/tournament/[id]`.

- [ ] 4D.2.2.4 `lib/queries/calendar.ts` — types exported from here, not from `lib/types.ts` (calendar-specific, not a DB mirror).

#### 4D.2.3 Pure helpers

- [ ] 4D.2.3.1 `lib/calendar-range.ts` — dates always as YYYY-MM-DD strings (no `Date` objects crossing boundaries):
  - `parseIso(s)`, `toIso(date)`
  - `todayIso()` — local wall-clock today
  - `addDays(iso, n)`, `addMonths(iso, n)` — return new ISO string
  - `startOfWeekMon(iso)`, `endOfWeekSun(iso)` — Mon-anchored
  - `startOfMonth(iso)`, `endOfMonth(iso)`
  - `dayRange(iso)`, `weekRange(iso)`, `monthRange(iso)` — each returns `{ start, end }`
  - `isSameDay(a, b)`, `isoDateList(start, end)` — inclusive list of ISO dates
- [ ] 4D.2.3.2 `lib/calendar-layout.ts` — event positioning math:
  - `GRID_START_MIN = 7 * 60` (07:00), `GRID_END_MIN = 23 * 60` (23:00), `ROW_MIN = 30` → 32 rows for the 16-hour day
  - `minutesFromHHMM(s)` → number
  - `eventRowStart(startTime)` → row index (0..31) clamped; events before 07:00 clamp to 0, after 23:00 clipped
  - `eventRowSpan(durationHours)` → `max(1, durationHours * 2)` clamped to `32 - rowStart`
  - `topPct(rowStart)`, `heightPct(rowSpan)` — CSS percentages for absolute-positioned blocks
  - `eventsWithoutTime(events)` / `eventsWithTime(events)` — partition helper for "all-day" rendering

#### 4D.2.4 Page shell + client composition

- [ ] 4D.2.4.1 `components/site/navLinks.ts` — insert `{ href: "/calendar", label: "Календарь", icon: "📅" }` between `/courts` and `/analytics`.
- [ ] 4D.2.4.2 `app/calendar/page.tsx` — server component:
  - `searchParams` is a Promise in Next 16 — `await` it.
  - Sanitize `view` and `date`. Compute `range` via calendar-range helpers.
  - `await Promise.all([listCalendarEventsInRange(range.start, range.end), listActiveCourts()])`.
  - Render via `<PageShell title="Календарь">` + `<CalendarClient view={view} date={date} events={events} courts={courts} />`.
- [ ] 4D.2.4.3 `app/calendar/CalendarClient.tsx` — client:
  - Receives `view`, `date`, `events`, `courts` as props; no local state for view/date.
  - Navigation helper `navigate(next: { view?; date? })` builds the next URL and calls `router.push`.
  - Renders `<CalendarHeader>` + one of `<DayView>` / `<WeekView>` / `<MonthView>` based on `view`.
  - Keeps file slim (≤ 120 lines); view components own their layout.

#### 4D.2.5 Header + navigation

- [ ] 4D.2.5.1 `app/calendar/CalendarHeader.tsx` — client:
  - Row 1 (wraps on mobile): `[◀] [Сегодня] [▶]` · human-readable label (clickable → opens a native `<input type="date">` that jumps to that date on change) · spacer · `[День | Неделя | Месяц]` segmented tabs.
  - Human-readable labels:
    - Day: `"19 апреля 2026, суббота"` — reuse `formatDateRu` + weekday map.
    - Week: `"Неделя 13–19 апр 2026"` — inline formatter using genitive months.
    - Month: `"Апрель 2026"` — capitalized nominative months list (new, small export in `format-date.ts`).
  - Segmented view switcher: pill bg with accent-filled active state (reuse Button variants — `variant="secondary"` for inactive, `variant="primary"` for active).
  - Today button is disabled when already viewing today (day view: date === today; week: today in week range; month: today in month).
  - Date picker: small icon-button next to the label opens a hidden `<input type="date">` (or the label itself triggers it via `showPicker()` on click if supported).

#### 4D.2.6 Day view (time × courts)

- [ ] 4D.2.6.1 `app/calendar/DayView.tsx` — client:
  - **Columns**: one per active court (sorted by `number` asc) + a trailing "Без корта" column for events with empty `courtIds` (not expected in practice but defensive).
  - Court header: compact cell showing `Корт №{number}` with name underneath truncated. Height ~48px, sticky top on vertical scroll within the view.
  - **Rows**: 32 half-hour rows from 07:00 to 23:00, labeled on the left every hour (every even row); 30-min ticks are unlabeled gridlines.
  - **Grid**: CSS grid with `grid-template-columns: 56px repeat(N, minmax(100px, 1fr))` where N = courts.length + (hasUncourted ? 1 : 0). Each row is `48px` (2 rows = 1h, matches common calendar density).
  - **Event rendering**: each event emits one block PER court in its `courtIds`. For a tournament using 3 courts we render 3 separate `<EventBlock>` elements. Blocks are absolute-positioned inside their court column via `top`/`height` computed from `eventRowStart` + `eventRowSpan`.
  - **All-day row**: events with `startTime === null` go in a thin banner above the time grid, one row tall, spanning the full courts area, showing event name only.
  - **Today tint**: if `date === todayIso()`, apply a subtle `bg-accent-soft/30` wash to all court columns (not the time axis).
  - **Mobile**: when courts.length > 3, the grid overflows horizontally with touch scroll. Court headers and left-axis remain sticky.
  - **Empty state**: if no events and no courts, render a `Card` with "Нет событий в этот день."

#### 4D.2.7 Week view (time × days, Mon–Sun)

- [ ] 4D.2.7.1 `app/calendar/WeekView.tsx` — client:
  - **Columns**: 7 day columns (Mon first). Header cell: `"Пн"` + `"13"` in a stacked layout. Today's column: accent-tinted header background + column body.
  - **Rows**: same 32 half-hour rows as day view.
  - **Grid**: `grid-template-columns: 56px repeat(7, minmax(0, 1fr))`.
  - **Event rendering**: each event appears once in its day's column (no court split — week view collapses courts). If a day has multiple overlapping events, they render side-by-side via a simple lane-packing algorithm in `calendar-layout.ts` (`assignLanes(events) → { laneIndex, laneCount }`), blocks get `width: 100%/laneCount` and `left: laneIndex * width`. Good-enough greedy packing for Phase 1.
  - **All-day row**: one per-day cell above the grid for events with `startTime === null`.
  - **Click a day header or day column background** → navigate to `view=day&date=<that day>`.

#### 4D.2.8 Month view (6 × 7 day grid)

- [ ] 4D.2.8.1 `app/calendar/MonthView.tsx` — client:
  - Reuse `lib/calendar-grid.ts` (already created for mini-calendar) — if it exists, reuse; otherwise extend. (Check during implementation; if we used local math in `MiniCalendar`, extract it here.)
  - Mon-start 42-cell grid. Adjacent-month days: `text-fade`, muted border.
  - **Day cell**: min-height 96px. Top-left: day number (bold if today, accent bg if today). Below: up to 3 event pills stacked, each one line, truncated. If > 3: `+ ещё N` clickable link.
  - **Event pill**: compact bar, colored by status (see §4D.2.9). Click → opens popover anchored to the pill.
  - **`+ ещё N` link** → navigates to `view=day&date=<that day>`.
  - **Day-number click** → navigates to `view=day&date=<that day>`.
  - **Today cell**: day-number chip gets `bg-accent text-white`.
  - Mobile: grid stays 7 columns. Cells shrink; pill text truncates aggressively. Cell min-height drops to 72px.

#### 4D.2.9 Event block + popover

- [ ] 4D.2.9.1 `app/calendar/EventBlock.tsx` — shared by Day and Week views:
  - Color by `tournamentStatus`:
    - `draft` / `registration_open` → neutral: `bg-surface border-border text-secondary`
    - `in_progress` → accent: `bg-accent/15 border-accent/40 text-black` with a 3px left accent stripe
    - `completed` → muted green: `bg-[var(--color-success-soft)] border-[var(--color-success)]/30 text-secondary`
  - Pill variant (used by Month view): same palette, flat 20-24px height, truncated text.
  - Content (block variant): line 1 bold tournament name (truncate), line 2 time range `"18:00–20:00"`, line 3 format badge.
  - `as="button"` — onClick opens popover.
- [ ] 4D.2.9.2 `app/calendar/EventPopover.tsx`:
  - Native `<dialog>` element (Next 16 + React 19 both handle it cleanly; less code than a custom popover).
  - Content: tournament name (h2), date + time + duration (`"19 апреля · 18:00–20:00"`), format badge, status badge, court list (`"Корты: №1, №3, №5"`), session info if applicable (`"Сессия 3 из 5"`), primary button `[Открыть турнир]` → `/tournament/{id}`, secondary `[Закрыть]`.
  - Open via `dialogRef.current?.showModal()` on EventBlock click; close via `<form method="dialog">` or `dialog.close()`.
  - One dialog instance per calendar page — selected event lifted to CalendarClient state (`selectedEvent: CalendarEvent | null`).
  - ESC and backdrop click close. Body scroll locked while open (dialog handles natively).

#### 4D.2.10 Form updates (tournament + league)

- [ ] 4D.2.10.1 `app/tournament/new/CreateTournamentForm.tsx` — add "Длительность, часов" `<Input type="number" min={1} max={12} step={1} defaultValue={2} />` in the same row as "Время начала". Helper: "Используется для отображения в календаре".
- [ ] 4D.2.10.2 `app/tournament/new/action.ts` — parse `duration_hours`, validate integer in `[1, 12]`, pass to `createTournament`.
- [ ] 4D.2.10.3 `app/league/new/CreateLeagueForm.tsx` — same field, same constraints. Applied to every session via the single `tournaments.duration_hours` column (leagues use one tournament row for the whole season).
- [ ] 4D.2.10.4 `app/league/new/action.ts` — parse + pass through.
- [ ] 4D.2.10.5 `lib/queries/tournaments.ts` — add `duration_hours?: number` to `createTournament` input. Defaults to DB default when omitted.

#### 4D.2.11 Mini-calendar click-through

- [ ] 4D.2.11.1 `components/site/MiniCalendar.tsx` — make day cells clickable via `<Link href={`/calendar?view=day&date=${iso}`}>` wrapping each day cell. Adjacent-month cells stay as-is (non-clickable spans). Preserves keyboard accessibility via default `<a>` semantics.
- [ ] 4D.2.11.2 Hover state on clickable cells: `hover:bg-subtle`. Today cell keeps its accent fill + bold.

#### Build + verification order

Each sub-stage ends with `npm run build` clean + hand-off to user for browser check. No stages batched.

1. **Stage A** — Migration + `duration_hours` field
   4D.2.0 → 4D.2.2.1 → 4D.2.2.2 → 4D.2.10 (all form/action changes). User runs SQL, verifies the field in tournament + league forms, creates one tournament with `duration=2`.
2. **Stage B** — Data + pure helpers + empty shell
   4D.2.2.3 / 4D.2.2.4 / 4D.2.3 / 4D.2.4. Route `/calendar` renders a working shell with the header but views are placeholder cards. Verify URL state: change `?view=` and `?date=` by hand, see header update.
3. **Stage C** — Day view
   4D.2.6 + 4D.2.9.1 (block variant). Verify: today shows today's events in correct court columns, prev/next moves 1 day, event click opens popover (4D.2.9.2 below).
4. **Stage D** — Event popover
   4D.2.9.2. Verify popover from day view. (Popover is shared with month/week so lands before those.)
5. **Stage E** — Week view
   4D.2.7. Verify lane packing with two overlapping events on the same day.
6. **Stage F** — Month view + mini-calendar click-through
   4D.2.8 + 4D.2.11. Verify pill overflow on a busy day, `+ ещё N` navigates to day view, mini-calendar day click navigates correctly.

### 4D.3 Verification

- [ ] 4D.3.1 `npm run build` clean after 4D.1.
- [ ] 4D.3.2 Hand off for mini-calendar browser check before starting 4D.2.
- [ ] 4D.3.3 `npm run build` clean after each 4D.2 view is added (one view at a time).
- [ ] 4D.3.4 Hand off after all three views: open `/calendar`, verify day/week/month navigation, click a tournament block → popover → link, mini-calendar click navigates to day view for that date.

---

## Execution order (strict)

1. 4A Courts — stop, browser verify, commit
2. 4B Time — stop, browser verify, commit
3. 4C Scoring — stop, browser verify, commit
4. 4D.1 Mini calendar — stop, browser verify, commit
5. 4D.2 Full calendar page — plan-mode re-confirmation, then build one view at a time, stop after all three views

`npm run build` clean before every hand-off. No feature batched with another.
- [ ] 2D.18 Hand to user for browser verification: create league with 2 dates, run session 1 end-to-end, confirm cumulative leaderboard.

---

# Phase 5 — TV Lobby Display (`/display`)

Dedicated fullscreen page for a TV in the club entrance. Shows everything happening at the club today. No sidebar, no nav chrome — standalone. Auto-refreshes every 30s. Readable from 3m away. No auth required (public display).

This is different from the existing Табло (which shows one tournament's live leaderboard). The lobby display aggregates **all** events for today.

## Scope
- Three zones: top bar (logo + live clock + date), main content (event cards), bottom ticker (next 7 days).
- Event cards colored by status: amber СКОРО, green ИДЁТ, gray ЗАВЕРШЁН.
- For ИДЁТ: pulsing dot + top-3 mini leaderboard.
- For СКОРО: registered player avatar circles (initials, hash-colored bg).
- For ЗАВЕРШЁН: winner with 🥇, muted overlay.
- 2 columns on wide screens, 1 column otherwise.
- Sidebar nav gets a "📺 Дисплей" link at the bottom, separated by a divider.

## Out of scope
- Player photos (spec says "initials only for now — photo when available in future").
- Auth.
- Realtime subscriptions — `router.refresh()` every 30s is the refresh mechanism.

## 5.1 Data layer

- [ ] 5.1.1 `lib/queries/display.ts` (new) — two functions:
  - `listTodayDisplayEvents(today: string): Promise<DisplayEvent[]>` — sessions where `session_date = today` + tournament join, AND one-day tournaments where `date_start = today` without a session (draft/registration_open/in_progress). For ИДЁТ events, include matches (for leaderboard) and registered players. For СКОРО events, include registrations (for avatars).
  - `listUpcomingTickerEvents(today: string, daysAhead = 7): Promise<TickerEvent[]>` — sessions + tournaments in the window `(today, today + 7 days]`, summarized with name, format, date, startTime, courtNumbers.
- [ ] 5.1.2 Types:
  ```ts
  export interface DisplayEvent {
    key: string;
    tournamentId: string;
    sessionId?: string;
    name: string;
    format: TournamentFormat;
    startTime: string | null;
    status: "upcoming" | "in_progress" | "completed";
    courtNumbers: number[];
    registeredPlayers: Array<{ id: string; name: string }>;
    maxPlayers: number | null;
    leaderboard?: Array<{ playerId: string; name: string; points: number }>; // top 3 for in_progress
    winner?: { name: string } | null;
  }
  export interface TickerEvent {
    key: string;
    name: string;
    format: TournamentFormat;
    date: string;
    startTime: string | null;
    courtNumbers: number[];
  }
  ```
- [ ] 5.1.3 Status derivation (tournament-level, not session-level):
  - `upcoming`: tournament.status in {draft, registration_open} OR tournament.status=in_progress but no session is in_progress/completed today yet.
  - `in_progress`: any session for today has status `in_progress`.
  - `completed`: tournament.status === "completed", or today's session.status === "completed".
  - Keep it pragmatic: if there's a session row for today and its status is `in_progress`, use ИДЁТ. If completed → ЗАВЕРШЁН. Otherwise СКОРО.
- [ ] 5.1.4 Leaderboard for ИДЁТ: fetch completed matches joined through rounds→session, reuse `computeLiveLeaderboard` from `lib/leaderboard.ts` with the tournament's format+scoring. Take top 3.

## 5.2 Route + layout

- [ ] 5.2.1 `app/display/page.tsx` — server component. Fetches `todayIso()` via pure helper; calls `listTodayDisplayEvents` + `listUpcomingTickerEvents`. Passes to `<DisplayClient>`. No PageShell.
- [ ] 5.2.2 `app/display/DisplayClient.tsx` — client component. Owns:
  - Live clock via `useEffect` + `setInterval(1000)` — only the clock re-renders, not the whole tree.
  - Auto-refresh via `useEffect` + `setInterval(30_000)` that calls `router.refresh()` from `useRouter()` — no flash because Next streams the new server render in place.
  - Receives `events`, `tickerEvents`, `todayIso` as props.
- [ ] 5.2.3 Layout: no custom `app/display/layout.tsx` needed — root layout already supplies `<html>`/`<body>`. The page's outermost `<div>` sets `min-h-screen bg-[#0a1628] text-white`, overriding the page background.
- [ ] 5.2.4 Force dynamic rendering: `export const dynamic = "force-dynamic"` on `page.tsx` so `router.refresh()` actually re-fetches.

## 5.3 Components

- [ ] 5.3.1 `app/display/TopBar.tsx` (client child of DisplayClient) — fixed height ~15vh, bg `#0f1923`. Left: logo mark + "KOSMO PADEL". Center: huge clock (text-[6rem] font-bold tabular-nums). Right: weekday + full date.
- [ ] 5.3.2 `app/display/EventGrid.tsx` — grid of EventCard in a 1/2 column responsive layout (`grid-cols-1 lg:grid-cols-2`). Empty state: centered Kosmo logo + "Сегодня нет запланированных мероприятий".
- [ ] 5.3.3 `app/display/EventCard.tsx` — the main card. Props: `event: DisplayEvent`. Subcomponents inside:
  - Status stripe (6px left) with color by status.
  - Header: event name (text-3xl bold), format badge, time badge.
  - Middle: court pills row.
  - Body: switches by status.
- [ ] 5.3.4 `app/display/UpcomingBody.tsx` — player avatar circles (up to 8 + "+N"), "X / Y игроков зарегистрировано".
- [ ] 5.3.5 `app/display/LiveBody.tsx` — pulsing green dot next to ИДЁТ badge, mini leaderboard table (#, name, points) for top 3.
- [ ] 5.3.6 `app/display/CompletedBody.tsx` — winner name big with 🥇, muted overlay.
- [ ] 5.3.7 `app/display/Avatar.tsx` — circle with initials; bg generated from hash of name; 8 fixed palette colors.
- [ ] 5.3.8 `app/display/Ticker.tsx` — fixed bottom ~5vh strip. Horizontal scroll animation via CSS `@keyframes` if content exceeds width; static otherwise.

## 5.4 Sidebar update

- [ ] 5.4.1 `components/site/navLinks.ts` — extend `NavLink` type with optional `dividerBefore?: boolean`. Add `{ href: "/display", label: "Дисплей", icon: "📺", dividerBefore: true }` at the end.
- [ ] 5.4.2 `components/site/SidebarNav.tsx` — render a `<hr className="my-2 border-border" />` (or a styled spacer) before any item with `dividerBefore: true`.

## 5.5 Build + verify

- [ ] 5.5.1 `npm run build` clean, zero TS errors.
- [ ] 5.5.2 Hand off to user for browser test at `/display`. Expect to iterate before finalizing.

---

# Phase 6 — Extended player profile

Scope: add 6 new player fields (gender, DOB, nationality, photo_url as plain URL, membership status, dominant hand). Update create + edit forms and the profile page. Photo upload via Supabase Storage deferred.

## 6.0 SQL (hand to user first)

- [ ] 6.0.1 Append to `supabase/schema.sql` as a new `-- Phase 6` block. Same SQL given in chat for the user to paste.

## 6.1 Types + labels + queries

- [ ] 6.1.1 `lib/types.ts` — add `Gender`, `MembershipStatus`, `DominantHand` unions; extend `Player` with `gender`, `date_of_birth`, `nationality`, `photo_url`, `membership_status`, `dominant_hand` — all nullable except `membership_status` (non-null with DB default `guest`).
- [ ] 6.1.2 `lib/constants.ts` — `GENDER_LABEL_RU`, `MEMBERSHIP_LABEL_RU`, `DOMINANT_HAND_LABEL_RU`.
- [ ] 6.1.3 `lib/queries/players.ts` — extend `createPlayer` to accept new optional fields. Add `updatePlayer(id, input)` that writes all editable columns (not `elo_rating` — ELO changes only via rating history). Level change may later trigger ELO recalculation; for now allow direct edit without ELO change.

## 6.2 Shared form component

- [ ] 6.2.1 `app/players/PlayerFields.tsx` — controlled client component rendering the full field grid (existing 3 + 6 new). Props: values + setters + disabled flag. Used by create and edit.

## 6.3 Create — expanded form

- [ ] 6.3.1 `app/players/PlayersPanel.tsx` — keep minimal quick-add row (name / level / phone / button). Below, collapsible `<details>` "Дополнительно" containing gender, DOB, nationality, email, photo URL, membership, dominant hand, notes. All optional — quick-add still works with just name + level.
- [ ] 6.3.2 `app/players/create-player-action.ts` — accept + validate new fields. Validate enums (gender, membership_status, dominant_hand). DOB must be valid YYYY-MM-DD if provided. Photo URL: non-empty string if provided, no URL validation beyond that (operator paste).

## 6.4 Edit — new route

- [ ] 6.4.1 `app/players/[id]/edit/page.tsx` — server component, fetches player via `getPlayer`, renders `<PlayerEditForm>` with initial values.
- [ ] 6.4.2 `app/players/[id]/edit/PlayerEditForm.tsx` — client form using `PlayerFields`, plus Save / Cancel. On submit calls `updatePlayerAction`.
- [ ] 6.4.3 `app/players/[id]/edit/update-player-action.ts` — server action, validates, calls `updatePlayer`, `revalidatePath("/players")` + `/players/[id]`, redirects to `/players/[id]`.

## 6.5 Profile display

- [ ] 6.5.1 `app/players/[id]/page.tsx` — add photo avatar at top (img if `photo_url`, else hash-colored initials circle reusing display `Avatar` pattern). Show new fields: gender, DOB + computed age, nationality, membership badge, dominant hand. Layout: grid of label/value rows. Add "Редактировать" button linking to `/players/[id]/edit`.
- [ ] 6.5.2 Helper `ageFromDob(dob)` — simple pure function; returns null if no DOB.

## 6.6 Build + verify

- [ ] 6.6.1 `npm run build` clean.
- [ ] 6.6.2 Hand off. User runs the SQL in Supabase, then tests create + edit + profile.

---

# Phase 7 — Divisions within tournaments

Scope: one tournament event can host multiple divisions running in parallel — e.g. "Мужчины Д1 Американо" on К1–К2 and "Женщины Американо" on К3–К4. Each division owns its own registrations, format, scoring, courts, bracket, matches, and leaderboard. Tournaments without divisions keep working unchanged (legacy mode).

Design principles:
- Divisions are **additive**: a tournament either has 0 divisions (legacy single-format play, unchanged) or ≥1 (division mode).
- `tournament_registrations.division_id`, `rounds.division_id`, `matches.division_id` are nullable for backward compat. Null = legacy/tournament-wide.
- When divisions exist, tournament-level `format`, `scoring_system`, `court_ids`, `max_players`, `level_min/max` become ignored for play — divisions override. The tournament row still carries them as defaults shown in the division create form.
- One player ↔ one division per tournament (current `unique(tournament_id, player_id)` kept).

## 7.0 SQL (hand to user first — already done)

- [ ] 7.0.1 `divisions` table created in Supabase.
- [ ] 7.0.2 `ALTER TABLE` on `tournament_registrations`, `rounds`, `matches` to add nullable `division_id` + indexes.
- [ ] 7.0.3 Append both SQL blocks to `supabase/schema.sql` as a new `-- Phase 7` section for reproducibility.

## 7.1 Types + constants + queries

- [ ] 7.1.1 `lib/types.ts` — add `DivisionCategory = "mens" | "womens" | "mixed" | "open"`, `DivisionStatus = "draft" | "registration_open" | "in_progress" | "completed"`, and `Division` interface (all columns). Extend `TournamentRegistration`, `Round`, `Match` with optional `division_id: string | null`.
- [ ] 7.1.2 `lib/constants.ts` — `DIVISION_CATEGORY_LABEL_RU` (mens=Мужчины, womens=Женщины, mixed=Микст, open=Открытый). Reuse existing `STATUS_LABEL_RU` for DivisionStatus (same string set).
- [ ] 7.1.3 `lib/queries/divisions.ts` — new module:
  - `listDivisions(tournamentId)` — ordered by `created_at`.
  - `getDivision(id)`.
  - `createDivision(input)` — validates format + scoring_system enums; defaults status to `draft`.
  - `updateDivision(id, input)`.
  - `deleteDivision(id)` — cascade handles registrations/rounds/matches.
- [ ] 7.1.4 `lib/queries/registrations.ts` — extend existing functions to accept optional `divisionId` filter. Add `listRegistrationsByDivision(divisionId)`. `createRegistration` takes optional `division_id`. `listRegisteredPlayersByTournaments` stays tournament-wide for home-page avatar row (aggregates across divisions — correct behavior).
- [ ] 7.1.5 `lib/queries/matches.ts`, `lib/queries/rounds.ts` — add `division_id` filters where bracket generation / results queries occur. Pass through on insert.

## 7.2 Division management UI (on tournament page)

- [ ] 7.2.1 `app/tournament/[id]/page.tsx` — detect `divisions.length > 0`. If zero divisions, render existing legacy UI (registrations + play button). If ≥1 division, render new division-mode UI (see 7.2.2).
- [ ] 7.2.2 `app/tournament/[id]/DivisionsPanel.tsx` — section listing divisions as cards. Each card: name, category badge, format, level range, court pills, registered/max count, status badge, "Управлять" link → `/tournament/[id]/division/[divisionId]`. Button "+ Добавить дивизион" at top.
- [ ] 7.2.3 Empty-state promoter: on a fresh tournament (0 registrations, 0 divisions), tournament page shows a callout: "Добавить дивизионы или продолжить как один турнир?" with two buttons. Choosing "Добавить дивизионы" opens the create-division form; otherwise legacy mode remains.
- [ ] 7.2.4 `app/tournament/[id]/DivisionForm.tsx` (client) — controlled form for create/edit: name, category, level_min/max (reuse existing level selector), format, scoring_system, max_players, court_ids (multi-select from tournament's court_ids, not all courts). Defaults prefilled from tournament's own values on create.
- [ ] 7.2.5 Server actions: `app/tournament/[id]/division/create-division-action.ts`, `update-division-action.ts`, `delete-division-action.ts`. Each validates + revalidates `/tournament/[id]` and `/display`.
- [ ] 7.2.6 Guard: can't delete a division that has matches recorded (status `in_progress` or `completed`). Show confirm + clear error.

## 7.3 Per-division registrations

- [ ] 7.3.1 `app/tournament/[id]/division/[divisionId]/page.tsx` — server component. Division detail: header with name + category + format, registrations list, "Начать игру" / "Play" button when eligible.
- [ ] 7.3.2 Registrations panel: reuse as much of existing `RegistrationsPanel` as possible but scoped to `divisionId`. `createRegistration` passes `division_id`. Enforce division `max_players` cap, then `level_min/max` warning (soft).
- [ ] 7.3.3 When a tournament has divisions, **remove** the tournament-wide registration form from `app/tournament/[id]/page.tsx` — registrations only happen inside a division.

## 7.4 Per-division bracket generation

- [ ] 7.4.1 `lib/scheduler/*` — audit entry points (`generateAmericano`, `generateMexicano`, etc.). Each scheduler takes `(tournamentId, sessionId, registeredPlayers, courts, format, scoring)`. Refactor: add optional `divisionId` parameter; when present, insert rounds/matches with `division_id` set.
- [ ] 7.4.2 Scheduling call sites: `app/tournament/[id]/play/*`, any "start tournament" server action — route through `divisionId` when a division is being started.
- [ ] 7.4.3 Court allocation: scheduler uses the **division's** `court_ids`, not the tournament's. If multiple divisions run simultaneously, prevent double-booking: before generating, check for overlapping courts across other divisions on the same session and warn (don't hard-block — operator may know courts free up in sequence).

## 7.5 Per-division play view

- [ ] 7.5.1 New route `app/tournament/[id]/division/[divisionId]/play/page.tsx` — mirror of `app/tournament/[id]/play/page.tsx` but filtered to one division. Leaderboard uses only this division's matches.
- [ ] 7.5.2 Scoreboard (`.../play/scoreboard`) — accept optional `?division=<id>` query param; when present, scope all data to that division.
- [ ] 7.5.3 Legacy play view (`app/tournament/[id]/play`) remains for tournaments with zero divisions. When divisions exist, the tournament-level "Играть" button is hidden/replaced by the per-division link.

## 7.6 Per-division leaderboard + results

- [ ] 7.6.1 `lib/leaderboard.ts` — `computeLiveLeaderboard` already takes `matches` + `players`; no change needed, just pass per-division matches/players in.
- [ ] 7.6.2 `app/tournament/[id]/results/page.tsx` — when divisions exist, render one results section per division (name heading + table). When no divisions, current single table.
- [ ] 7.6.3 Rating history (`rating_history`): currently links to `tournament_id` + `session_id`. Leave alone for now — ELO applied per-match is still correct. Later phase may add `division_id` column if needed for per-division rating filtering.

## 7.7 Display page — divisions as separate cards

- [ ] 7.7.1 `lib/queries/display.ts` — `listTodayDisplayEvents` currently emits one `DisplayEvent` per tournament/session. Refactor: when a tournament has divisions, emit one event **per division** (sharing the tournament's session/time). Keys become `d:<divisionId>` to stay unique alongside `s:<sessionId>` and `t:<tournamentId>`.
- [ ] 7.7.2 `DisplayEvent` gets optional `divisionId: string | null` and the `name` becomes `"Tournament · Division"` (or just division name if visually cleaner — decide in UI review). `registeredPlayers` scoped to the division. `leaderboard` / `winner` computed from division's matches only. `courtNumbers` from division's court_ids.
- [ ] 7.7.3 `UpcomingBody` / `LiveBody` / `CompletedBody` — no changes; they consume `DisplayEvent` which now represents a division when applicable.

## 7.8 Tournament card (home page) — divisions summary

- [ ] 7.8.1 `components/tournament/TournamentCard.tsx` — when a tournament has divisions, show a small "2 дивизиона" chip below the title in place of the single format badge. Click-through still goes to `/tournament/[id]`. Avatar row aggregates across all divisions (already does via tournament-wide query).
- [ ] 7.8.2 `app/page.tsx` — fetch `division_count_by_tournament` in one batched query (select `tournament_id, count(*)` grouped). Pass count to `TournamentCard`.

## 7.9 Build + verify

- [ ] 7.9.1 `npm run build` clean.
- [ ] 7.9.2 Manual test path: create tournament → add 2 divisions (Мужчины Д1 Американо / Женщины Американо) with distinct court sets → register 8 players in each → start one division → verify display page shows two cards → start second division → verify both live leaderboards update independently → complete first division → verify winner on display while second still ИДЁТ.

## 7.10 Open questions / decisions (resolve before coding each sub-phase)

- [ ] 7.10.1 Does league_season tournament type support divisions in v1, or one_day only? (Recommend: one_day only in v1; revisit league later.)
- [ ] 7.10.2 Does the tournament's `date_start` / `start_time` apply to all divisions, or can divisions have their own start time? (Recommend: shared for v1; add `start_time` on division later if needed.)
- [ ] 7.10.3 When no divisions exist, keep legacy mode **permanently** or force-migrate existing tournaments into a single "default" division? (Recommend: permanent legacy path; null `division_id` is a valid state forever.)
- [ ] 7.10.4 Calendar page (`/calendar`): does a tournament with divisions show as one event or N events? (Recommend: one event, since time/date/venue are shared.)

