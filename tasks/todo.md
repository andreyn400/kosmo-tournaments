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


---

# Phase 8 — Finals bracket (single-elimination playoff)

Goal: after all league sessions are complete and the leaderboard is settled, the director creates a single-elimination finals bracket from the top N qualified players/pairs. Visual bracket, per-match score entry, winner advances, ELO updates, champion crowned.

Scope: finals apply to **league_season** tournaments only. One-day tournaments already end at `/results`. Divisions (Phase 7) are out of scope for Phase 8 — finals belong to the league as a whole, not per-division.

---

## 8.0 Architectural decisions (answer before writing any code)

Each question below has a **recommendation**. Confirm or override before starting 8.1.

### 8.0.1 Database schema — separate `bracket_matches` table or reuse `matches`?

**Recommendation: new `bracket_matches` table. Do NOT reuse `matches` / `rounds`.**

Rationale:
- `rounds` implies round-robin semantics (all matches in a round happen simultaneously, every player plays every round). Bracket rounds don't behave that way — round 2 only runs after round 1 resolves, and each round has half the matches of the previous.
- Bracket matches need a **next-match pointer** for winner propagation, which has no analogue in `matches`.
- Mixing bracket state into `matches` would require a bunch of nullable bracket-only columns (`bracket_slot`, `next_match_id`, `seed1`, `seed2`) and make every query against `matches` filter them out.
- Separate table isolates the two flows cleanly. ELO can still write to `rating_history` with a new nullable `bracket_match_id` column (or keep using `tournament_id` alone, which already works).

Proposed schema:
```sql
create table bracket_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  league_season_id uuid references league_seasons(id) on delete cascade,
  round_number int not null,              -- 1 = first round, N = final
  position int not null,                  -- slot within the round, 0-indexed left-to-right
  seed1 int,                              -- leaderboard rank (1 = top seed)
  seed2 int,
  team1_player1_id uuid references players(id),
  team1_player2_id uuid references players(id),  -- null for singles
  team2_player1_id uuid references players(id),
  team2_player2_id uuid references players(id),  -- null for singles
  team1_score int,
  team2_score int,
  score_detail jsonb,                     -- same shape as matches.score_detail
  winner_team int check (winner_team in (1, 2)),
  next_match_id uuid references bracket_matches(id) on delete set null,
  next_match_slot int check (next_match_slot in (1, 2)),  -- which team slot the winner fills
  court_id uuid references courts(id),
  scheduled_at timestamptz,
  status text check (status in ('pending','in_progress','completed','bye')) default 'pending',
  created_at timestamptz default now(),
  unique (league_season_id, round_number, position)
);

create index idx_bracket_matches_league on bracket_matches(league_season_id);
create index idx_bracket_matches_next on bracket_matches(next_match_id);

-- Finals config on the league
alter table league_seasons add column finals_bracket_size int;              -- 4, 8, 16, 32
alter table league_seasons add column finals_scoring_system text
  check (finals_scoring_system in (
    'points_16','points_21','points_32',
    'games_16','games_24','games_32',
    'sets_best3','sets_supertiebreak'
  ));
alter table league_seasons add column finals_status text
  check (finals_status in ('not_created','in_progress','completed')) default 'not_created';
alter table league_seasons add column finals_champion_player_ids uuid[] default '{}';
```

### 8.0.2 Seeding — standard snake draw, halves split so 1 and 2 only meet in final

**Recommendation: standard tournament seeding with mirrored halves.**

For bracket size B (power of 2):
- Top half positions: `[1, B, 4, B-3, 5, B-4, ...]`
- Bottom half positions: `[3, B-2, 2, B-1, ...]` (mirrored so seed 2 is in the opposite half from seed 1)
- Classic pairings: seed 1 vs B, seed 2 vs B-1, seed 3 vs B-2, seed 4 vs B-3; seed 1's half contains seeds {1,8,4,5} for B=8, {1,16,8,9,4,13,5,12} for B=16; seed 2's half contains the rest. This guarantees seeds 1 and 2 only collide in the final, and 1/3 and 2/4 collide in the semifinals.
- **BYEs**: when `qualification_spots < bracket_size`, top seeds get BYEs. A BYE is a bracket match with one slot filled, status='bye', auto-advancing the seeded player.

Bracket size: smallest power of 2 ≥ qualification_spots. For default qualification_spots=16, bracket is 16 with no BYEs. For 12, bracket is 16 with 4 BYEs for seeds 1-4. Allowed sizes: 4, 8, 16, 32.

### 8.0.3 Formats — both individual and team leagues supported in v1 (OVERRIDE 2026-04-21)

**Decision: v1 supports both individual and team leagues. Bracket is always pair-based (doubles — padel reality). Individual leagues form pairs at finals-setup time from the individual leaderboard; team leagues reuse the existing pair identity from the season.**

**Team leagues (`team_americano`, `team_mexicano`):**
- Leaderboard ranks pairs (already how season scoring works for team formats).
- Each bracket slot holds the pre-existing pair (identity preserved from `tournament_registrations.player_id` + `partner_id`).
- Seed = pair's rank on the season leaderboard.

**Individual leagues (`americano`, `mexicano`, `round_robin`):**
- Leaderboard ranks individuals.
- For bracket size B (pairs), qualify **top 2B individuals** and form B pairs via canonical **strong-with-weak snake pairing**:
  - Bracket size 2 (final-only): (seed1 + seed4) vs (seed2 + seed3).
  - Bracket size 4: pairs = (1,8), (4,5), (2,7), (3,6).
  - Bracket size 8: pairs = (1,16), (8,9), (4,13), (5,12), (2,15), (7,10), (3,14), (6,11).
  - Bracket size 16: top 32 individuals, same extension.
- Pair seeding in the bracket = the pair's top-individual's rank (so pair (1,8) is seed 1, pair (4,5) is seed 4, etc), preserving the 8.0.2 mirror-half rule.
- **Operator override in the setup wizard**: preview the auto-pairs, allow manual swaps (pair two specific individuals, lock in) before committing. Implement as a simple list with "Swap" buttons between adjacent pairs, plus one explicit "сбросить к авто" action.
- `qualification_spots` for individual leagues is interpreted as **qualifying individuals**; bracket size derived as `qualification_spots / 2` rounded up to the nearest power of 2. (E.g. `qualification_spots=16` → 8-pair bracket; `qualification_spots=32` → 16-pair bracket.)

**Implementation notes:**
- `bracket_matches` schema (8.0.1) already supports both shapes — individual leagues fill all 4 player slots per team once pairs are formed; team leagues fill them from registration pairs. No schema change needed.
- Pair formation lives in a pure lib: `lib/finals-pair-formation.ts` with `snakePairsForBracket(individuals: Seeded[], bracketSize): Pair[]`.
- Qualification validation (8.7.1 guard) becomes: team league requires ≥ bracket_size qualified pairs; individual league requires ≥ 2×bracket_size qualified individuals.
- Setup wizard (8.4) grows a "Пары" step for individual leagues showing the auto-formed pairs with a swap/reset UI. Team leagues skip this step.

**Guard kept:** button still disabled if leaderboard has fewer qualified entries than the minimum bracket needs (4 pairs / 8 individuals).

### 8.0.4 Visual bracket — how does it render?

**Recommendation: CSS Grid horizontal tree, mobile horizontally scrollable.**

Layout:
- One column per round; column width fixed (~220px desktop, ~180px mobile).
- Matches stack vertically within a column, spaced so each match aligns to the midpoint of the two feeding matches in the previous column.
- Match card: two rows (top team / bottom team), each with seed badge + name(s) + score. Winner row has `font-semibold text-black` + left border `bg-accent`. Loser row is `text-muted`. `bye` matches show only the seeded pair, "BYE" label on the other row.
- Connectors between rounds: thin CSS borders drawn as horizontal lines from each match to the midpoint, then vertical line joining the pair, then horizontal into the next match. Implement as pseudo-elements or inline SVG.
- Click a match → inline score-entry drawer (desktop) or bottom sheet (mobile), similar to `RoundPanel.tsx`.
- Champion card at the far right of the final column: trophy icon + pair name + "Чемпион".

Mobile (<640px): entire bracket inside `overflow-x-auto` wrapper with sticky first column. At 32-slot bracket this is a 5-column grid — fine horizontally scrolled.

### 8.0.5 Score entry — which scoring system?

**Recommendation: default to `sets_best3`, operator can override during finals creation; stored on `league_seasons.finals_scoring_system` (separate from session scoring).**

Why:
- Session games use a fast points-based system (games_24 default) because you play many of them in a session.
- Finals are single elimination — one match determines who continues. Best-of-3 sets is the padel convention for knockout play.
- Making it separate from the league's session scoring system lets the director pick `sets_best3` for a real final even if the league played `points_24` all season.

On the finals creation wizard: "Система счёта финала" select, default `sets_best3`, options grouped as in the tournament form.

### 8.0.6 ELO updates — yes, with higher K-factor

**Recommendation: yes, finals matches affect ELO. Use K=48 for finals regardless of bracket size.**

Why:
- Finals are higher-stakes than session matches → bigger rating swing makes sense.
- Constant K=48 is simpler than a per-round K ramp (K for quarterfinals < K for final). Extra complexity with no clear gameplay benefit.

Application:
- Each bracket match, on completion, immediately writes a `rating_history` row and updates `players.elo_rating` — same pattern as session matches in `session-finalization.ts`, but with the different K.
- Alternative: batch at end of bracket. Rejected because in-session flow already updates ELO live, and directors will want to see "игрок выбыл из турнира, +25 ELO" immediately.
- Use **team-average vs team-average** expected score (same as session ELO), applied to each player on the team.

### 8.0.7 URL structure

**Recommendation: `/tournament/[id]/finals`** (sibling to `/play`, `/season`, `/results`).

Why:
- All league routes already live under `/tournament/[id]` — no `/league/[id]` exists. Keeping finals under the same path is consistent.
- `/tournament/[id]/finals` — bracket view (read + score entry)
- `/tournament/[id]/finals/setup` — creation wizard (bracket size, pairs, scoring system, scheduled date/time, courts)

### 8.0.8 Entry point — "Создать финальную сетку" button

**Recommendation: button appears on `/tournament/[id]` (the league detail page) when all four conditions are true:**
1. `tournament.type === 'league_season'`
2. All `tournament_sessions` have `status='completed'`
3. `league.qualification_spots` is set AND the leaderboard has ≥ `qualification_spots` qualified rows
4. `league.finals_status === 'not_created'`

When `finals_status === 'in_progress'` → button becomes "Перейти к финалу →" linking to `/tournament/[id]/finals`. When `'completed'` → "Итоги финала →".

For individual leagues (per 8.0.3), the button is disabled with the tooltip explaining v2 deferral.

---

## 8.1 Database migration

- [ ] 8.1.1 Write SQL migration block in `supabase/schema.sql` under a new `-- Phase 8 — Finals bracket` header:
  - `create table bracket_matches (...)` per 8.0.1
  - `alter table league_seasons add column finals_bracket_size int`
  - `alter table league_seasons add column finals_scoring_system text check (...)`
  - `alter table league_seasons add column finals_status text check (...) default 'not_created'`
  - `alter table league_seasons add column finals_champion_player_ids uuid[] default '{}'`
  - Indexes on `league_season_id` and `next_match_id`
- [ ] 8.1.2 Ask user to paste migration into Supabase SQL editor, confirm success.

## 8.2 Types + queries

- [ ] 8.2.1 `lib/types.ts` — add `BracketMatch`, `BracketStatus` types.
- [ ] 8.2.2 `lib/queries/bracket-matches.ts` — `listBracketMatches(leagueSeasonId)`, `getBracketMatch(id)`, `createBracketMatches(rows)`, `updateBracketMatch(id, patch)`, `setMatchScore(id, team1Score, team2Score, scoreDetail, winnerTeam)`.
- [ ] 8.2.3 `lib/queries/league-seasons.ts` — extend `LeagueSeason` type with `finals_bracket_size`, `finals_scoring_system`, `finals_status`, `finals_champion_player_ids`. Add `updateFinalsConfig(id, patch)`.

## 8.3 Seeding + bracket generation (pure lib)

- [ ] 8.3.1 `lib/finals-seeding.ts`:
  - `seedingOrderForSize(size: 4 | 8 | 16 | 32): number[]` — returns array where `arr[i]` is the seed at bracket position `i` (0-indexed). Uses standard snake placement so seeds 1 and 2 land in opposite halves.
  - Unit test (comment block): for size=8, returns `[1,8,4,5,2,7,3,6]`. Seed 1 at position 0 plays seed 8 at position 1, etc.
  - For size=16: `[1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11]`.
- [ ] 8.3.2 `lib/finals-bracket.ts`:
  - `generateBracket(params: { leagueSeasonId, tournamentId, size, qualified: Array<{seed: number; playerIds: string[]}>, scoringSystem, scheduledAt? }): BracketMatchInsert[]`
  - Generates matches for all rounds up-front. Round 1 has `size/2` matches with players filled in. Rounds 2+ have matches created with empty player slots and `next_match_id` / `next_match_slot` pointers from round N-1 matches.
  - When `qualified.length < size`, fills only top-seeded slots; remaining round-1 matches with one seeded team become `status='bye'` and auto-advance the seed (prefill the corresponding round-2 slot). Double-BYEs (both slots empty) shouldn't occur if we size the bracket as smallest power of 2 ≥ qualification count — assert otherwise.
- [ ] 8.3.3 `lib/finals-advance.ts`:
  - `advanceWinner(bracketMatch, allMatches): BracketMatchInsert | null` — given a just-completed match, writes winner into the next match's correct slot. Returns the updated next match, or null if this was the final.
  - Idempotent: running it twice on the same match doesn't double-advance.

## 8.4 Finals setup wizard `/tournament/[id]/finals/setup`

- [ ] 8.4.1 Server component page:
  - Load tournament, league_season, season leaderboard (reuse `computeSeasonLeaderboard`).
  - Guard: `type='league_season'`, all sessions completed, `finals_status='not_created'`, team format (per 8.0.3). Otherwise redirect back to `/tournament/[id]` with notice.
- [ ] 8.4.2 Client wizard form:
  - Bracket size select (4/8/16/32; default = smallest power of 2 ≥ qualification_spots).
  - Scoring system select (default `sets_best3`).
  - Scheduled date (default `league.finals_date` if set, else tournament's last session date + 7 days).
  - Start time + duration.
  - Court pick (checkboxes from tournament.court_ids).
  - Preview table: seed, pair name, qualification points — top N rows highlighted.
- [ ] 8.4.3 Server action `createFinalsAction`:
  - Call `generateBracket`, insert all `bracket_matches` rows.
  - Update `league_seasons.finals_*` columns to reflect config + `finals_status='in_progress'`.
  - `revalidatePath` `/tournament/[id]` and `/tournament/[id]/finals`.
  - `redirect('/tournament/[id]/finals')`.

## 8.5 Bracket view `/tournament/[id]/finals`

- [ ] 8.5.1 Server component: load `bracket_matches` for this league_season, player names, courts.
- [ ] 8.5.2 `components/finals/Bracket.tsx` client component — CSS Grid layout per 8.0.4.
- [ ] 8.5.3 `components/finals/BracketMatchCard.tsx` — two-row card; click opens score entry.
- [ ] 8.5.4 Score entry modal/drawer — reuse the scoring strategy layer (`lib/scoring-strategies/*`) so `sets_best3` gets a set-by-set UI, `games_24` gets a single number pair, etc.
- [ ] 8.5.5 Server action `submitBracketMatchAction({ matchId, team1Score, team2Score, scoreDetail })`:
  - Validate scores per scoring system.
  - Compute winner_team.
  - Update bracket match row.
  - Call `advanceWinner` → update next match.
  - Apply ELO (per 8.0.6): load current ELO for 4 players, compute team averages, update per the scoring system's win/loss interpretation, write `rating_history` rows, update `players.elo_rating` and `players.level`.
  - If this match was the final: set `league_seasons.finals_status='completed'` + `finals_champion_player_ids`.
  - `revalidatePath('/tournament/[id]/finals')`.
- [ ] 8.5.6 Mobile: sticky header with round labels, horizontal scroll for bracket body.

## 8.6 Finals results `/tournament/[id]/finals/results`

- [ ] 8.6.1 Shown when `finals_status='completed'`. Podium card: champion pair, runner-up, semifinalists.
- [ ] 8.6.2 Final bracket (read-only) below the podium.
- [ ] 8.6.3 Link back to `/tournament/[id]` and `/tournament/[id]/season`.

## 8.7 Entry points + league page

- [ ] 8.7.1 `app/tournament/[id]/page.tsx` — when `type='league_season'`:
  - All sessions complete + `finals_status='not_created'` → "Создать финальную сетку" button.
  - `finals_status='in_progress'` → "Перейти к финалу →".
  - `finals_status='completed'` → "Итоги финала →".
  - Individual leagues: button disabled with v2-deferral tooltip (per 8.0.3).
- [ ] 8.7.2 `/display` page (Phase 7 integration): add a "FINAL" display-event type when `finals_status='in_progress'` — one card per active bracket match with court assignment. Low priority; can defer to 8.9.

## 8.8 ELO for finals

- [ ] 8.8.1 `lib/finals-elo.ts`:
  - `applyBracketMatchElo({ bracketMatch, players, scoringSystem }): { updates: RatingUpdate[] }`
  - Uses K=48. Interprets `scoreDetail` per scoring strategy to determine `actualScore` in [0, 1] per team.
  - Returns new ELO per player; caller writes `rating_history` + updates `players`.
- [ ] 8.8.2 Wire into `submitBracketMatchAction` (see 8.5.5).

## 8.9 Build + verify

- [ ] 8.9.1 `npm run build` clean.
- [ ] 8.9.2 Manual e2e:
  - Create team league with 16 qualification_spots and 2+ sessions.
  - Play sessions to completion.
  - On league page: click "Создать финальную сетку" → wizard → confirm with 8-slot bracket + `sets_best3`.
  - Bracket renders with 4 R1 matches, seeds correct (1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6).
  - Submit R1 scores → winners advance to QF.
  - Play through SF and F.
  - Final completes → champion card shows + ELO updated (+bigger deltas than session matches) + `/tournament/[id]` shows "Итоги финала →".
  - Legacy tournaments without finals unaffected.

## 8.10 Open questions / decisions (resolve as encountered)

- [ ] 8.10.1 Should bracket matches show on `/display`? (Recommend defer to Phase 9; finals are usually a single-court event easily announced live.)
- [ ] 8.10.2 Third-place playoff (bronze match between SF losers)? (Recommend: skip in v1, add later with a `has_third_place_match` bool on league_seasons.)
- [ ] 8.10.3 Re-seeding after an upset — is seed 1's half reshuffled? (Recommend: no, classic fixed bracket.)
- [ ] 8.10.4 Editing/reverting a completed bracket match (operator typo). (Recommend: yes, but only if the next match hasn't started. Soft-block with confirm modal.)
- [ ] 8.10.5 Can a qualified pair decline to play? (Recommend: manual reseeding in setup wizard — operator can swap one pair for the next one down in the leaderboard before clicking Create.)

---

# Phase 10 — Unified Platform Merger (padel-ops → Kosmo Tournaments)

Goal: fold the old Flask **Kosmo Padel OPS** (Railway-deployed) into this Next.js app so there is one unified platform. Tournaments side stays untouched; a new "Операции" mode adds court scheduling, rental contracts, coaches, organizers, programs, and a weekly ops report. Data migration is the last step — Flask app keeps running on Railway until the new module is verified end-to-end.

Workflow: build one sub-phase at a time, run `npm run build` clean after each, check in before the next. Padel-ops Flask app must not be touched.

## 10.0 Architectural decisions — RESOLVED 2026-05-12

Answers from user:
1. **Peak/off-peak pricing** → keep both. `programs` has `price_peak_rub` + `price_offpeak_rub`.
2. **Weeks table** → drop. Sessions store `date` directly; reports aggregate on the fly.
3. **Coach rate model** → keep the split. `rate_type` ∈ {`flat`,`percent`}; percent coaches use `rate_court_percent` + `rate_coaching_percent`; flat coaches use `flat_rate_rub`.
4. **Rentals** → keep many slots per contract. `rental_contracts` + `rental_slots` (recurring weekly day-of-week + time).
5. **Attendees** → keep. `schedule_sessions.attendee_count` + new `session_attendees(session_id, player_id nullable, name, status)`. Drop `week_templates`. Keep `coach_availability`.
6. **Display page** → confirmed: unified feed, source badge per event.
7. **Mode switcher** → confirmed: `localStorage.kosmo_mode`, URL is authoritative (`/ops/*` → ops, `/tournament/*` → tournaments).
8. **Courts** → confirmed: reuse existing `courts` table; migrate by `courts.number`.

Font: DM Sans (already configured globally in `app/layout.tsx` via `--font-sans`).



### What I learned reading padel-ops

**File map**
- `~/Desktop/padel-ops/app.py` — single 1939-line Flask app. All routes, DB schema, helpers.
- `~/Desktop/padel-ops/templates/index.html` — single-page SPA with tab nav; pages: scheduler, report, analytics, programs, rentals, calendar, coaches.
- `~/Desktop/padel-ops/migrate.py` — exports/imports JSON between SQLite and Postgres. We'll write a Node equivalent for Supabase.

**Database tables in padel-ops** (with key columns, full DDL at lines 184-319):
- `programs` (id, **code unique**, type, name, **price_off_peak**, **price_peak**, duration, players, **courts**, coaches) — peak pricing baked into pricing model.
- `weeks` (id, start_date, name, status open/locked, report_json) — scheduler is week-scoped. Locking a week freezes its report.
- `sessions` (id, week_id, program_id, day_of_week 0-6, time_slot HH:MM, **court_start**, **courts_used**, **courts_list** "1,3,5", duration, is_peak, revenue, notes, source manual/crm_import) — week × day × time × court grid. Programs that need 2 courts (e.g. Турнир) store comma-separated court list.
- `attendees` (id, session_id, name, status registered/attended) — per-session player list, used for attendance %.
- `coaches` (id, name, color, phone, **rate_type fixed/pct**, flat_rate, **revenue_pct**, **coaching_fee_pct**, active, specialty, level, notes) — payout model: flat per session OR % of court revenue + % of coaching fee.
- `session_coaches` (session_id, coach_id) — many-to-many.
- `coach_availability` (coach_id, day_of_week, start_time, end_time) — recurring weekly availability.
- `rental_contracts` (id, client_name, client_type физлицо/юрлицо, client_contact, start_date, end_date, total_contract_value, **payment_type единовременно/ежемесячно/ежеквартально**, status активен/etc, notes).
- `rental_slots` (id, contract_id, court_number, day_of_week, start_time, end_time, coach_id, notes) — one contract → N recurring weekly slots.
- `rental_payments` (id, contract_id, period_label "Май 2026", amount_due, amount_paid, due_date, paid_date, status ожидается/оплачено) — auto-generated when contract is created (see `_generate_payments` at line 1181).
- `settings` (key, value) — only `weekly_target=2000000` used.
- `week_templates` (id, name, data_json, total_sessions, theoretical_revenue) — save/reapply a week's schedule.

**Key logic worth preserving**
- Peak hours = 17:00–22:00. `is_peak()` and `calc_revenue()` (lines 411-425): revenue = `price_per_player × players` using peak price if any minute overlaps peak window. **The user's Phase 10 spec uses a single `price_rub` field — this drops peak/off-peak pricing.** Flag in open questions.
- `check_collision()` (line 704): exact rectangle overlap on (day, time window, court set).
- `coach_monthly_summary` (line 817): walks every session a coach is assigned to in weeks that overlap the month, splits revenue into court_revenue (price_peak/off_peak × courts_used) and coaching_fee (session_revenue − court_revenue), pays `revenue_pct × court + coaching_fee_pct × fee` for pct coaches or flat_rate per session.
- `generate_week_report` (line 1485): total revenue, court utilization (% of 16h × 7d × 5 courts), attendance %, best/worst day, peak vs off-peak split, prev-week comparison, recommendation engine for empty slots.
- `calendar_events` API (line 1063): unified day/week/month feed merging sessions + rental slots. Our `/calendar` already merges tournaments + sessions; we extend it to add rentals and scheduler sessions.
- `_generate_payments` (line 1181): builds N payment periods for a contract based on `payment_type`. We may want this even though the user's spec describes manual payments.

**Program types from padel-ops (Excel import via `import_programs_from_excel`)**: 12 declared by user — Аренда, Тренировка персональная, Тренировка групповая, Американо, Мексикано, Детская тренировка, Корпоратив, Турнир, Клиника, Сплит-аренда, Абонемент, Прочее.

**UI patterns from index.html**
- Tabbed top nav with active state, single-page SPA, modals for create/edit forms.
- Scheduler is a fixed-grid table: Y-axis time slots 07:00–23:00 in 30-min rows, X-axis courts K1–K5. Day-of-week tabs above.
- Stats bar above grid (sessions count, theoretical revenue, utilization), color-coded legend below by program type.

### Decisions to confirm before coding

- [ ] 10.0.1 **Peak/off-peak pricing.** User's Phase 10 spec defines `programs.price_rub` (single price). Padel-ops uses peak+off-peak with peak being 17–22:00. Recommend: keep single `price_rub` for now (the spec is explicit), but add an open question — if peak pricing was actually used in production we'll need to migrate it. I'll check `data_export.json` during migration to see if both columns hold different values.
- [ ] 10.0.2 **Weekly grid (padel-ops `weeks` table) vs date-only scheduler (user spec).** Padel-ops models a schedule as `weeks(id) ← sessions(week_id, day_of_week)`. User's Phase 10 spec stores sessions directly with `date` (no weeks layer). The week layer powered locking, weekly reports, templates, week duplication. Recommend: **drop the weeks layer**, store `date` on each session, and compute the weekly report on-the-fly by aggregating `WHERE date BETWEEN ws AND we`. Templates and duplication become "copy sessions from week X to week Y" actions. Locking weeks is dropped (open weeks are now the only mode). Confirm.
- [ ] 10.0.3 **Mode switcher persistence.** localStorage key `kosmo_mode` = `tournaments` | `ops`. Default `tournaments`. The switcher is a client component inside `PageShell`. The nav links shown below depend on it. URL is the source of truth — visiting `/ops/...` should auto-set mode to `ops` regardless of localStorage so links from outside work. Confirm.
- [ ] 10.0.4 **Courts table reuse.** Kosmo Tournaments already has `courts` (uuid id, name, number, surface, status). Padel-ops uses int court numbers 1–5. We use the existing `courts` table; `schedule_sessions.court_id` references it. Migration step: map padel-ops integer `court_number` → uuid by looking up `courts.number`. Confirm.
- [ ] 10.0.5 **Coaches: no existing table.** Kosmo Tournaments has no `coaches` table. Padel-ops has a full one. User's spec says "expand the existing coaches concept" but in this codebase coaches don't exist yet. I'll create the table from scratch with the fields described in 10.3 (name, phone, rate_type, rate_value, specialization, bio) plus what's needed for migration: `color`, `active`. Padel-ops's split rate model (revenue_pct + coaching_fee_pct) is more nuanced than user's spec (single rate_value). Recommend: store both `rate_value` (the percentage for percent-type, the rubles for flat-type) AND `coaching_fee_pct` so we don't lose data from the old system. Confirm or simplify.
- [ ] 10.0.6 **Rentals model.** Padel-ops: one contract → many recurring weekly slots → auto-generated payment schedule. User's Phase 10.6 spec: one contract = one recurring slot (`day_of_week`, `start_time`, `end_time`, `price_rub`, `start_date`, `end_date`) with manual payments. **This is simpler but loses multi-slot contracts.** I'll go with the spec but warn that migrating from padel-ops will require expanding multi-slot contracts into multiple `rental_contracts` rows (one per slot). Confirm.
- [ ] 10.0.7 **Attendees, week_templates, coach_availability.** Padel-ops has these. User's Phase 10 doesn't mention them. Recommend: drop attendees (tournament side already handles registrations), drop week_templates (low-value with date-based sessions — duplicate a date range manually), drop coach_availability (operator knows their team's schedule). If user wants them, raise scope. Confirm.
- [ ] 10.0.8 **Organizers.** New concept, not in padel-ops. Standalone — no link to schedule sessions or tournaments. Just a ledger: who owes us money, history of payments. Confirm scope is "just a balance ledger, not booking integration".
- [ ] 10.0.9 **Display page.** Currently shows tournament events. Phase 10.9 says "also show rental sessions and scheduler sessions." Recommend: keep the same card design, add type tag (Аренда / Тренировка / etc), and source the feed from a unified query that merges tournaments + schedule_sessions + active rental slots for "today". Confirm.

## 10.1 Sub-phase: Top-level switcher + Ops shell

**Database**: none.

**Files to add/edit**
- [ ] 10.1.1 `components/site/ModeSwitcher.tsx` — client component, two pills "Турниры" / "Операции". Reads `localStorage.kosmo_mode`, falls back to inferring from pathname (`/ops/*` → ops). On click, navigates to the default page for that mode (`/` for tournaments, `/ops/schedule` for ops) and writes localStorage.
- [ ] 10.1.2 `components/site/navLinks.ts` — split into two arrays: `tournamentNavLinks` (existing 6 links) and `opsNavLinks` (Расписание, Аренда, Тренеры, Организаторы, Программы, Отчёт, План зала — last one is the Phase 10.8 placeholder).
- [ ] 10.1.3 `components/site/SidebarNav.tsx` — accept a `mode` prop; render the appropriate links array. Active matching unchanged.
- [ ] 10.1.4 `components/site/PageShell.tsx` — mount `ModeSwitcher` above `SidebarNav`. Compute mode from pathname (server-side) and pass down. MobileNav mirrors the same.
- [ ] 10.1.5 `app/ops/layout.tsx` — server component, just wraps children. Mode inference will use the pathname directly.
- [ ] 10.1.6 `app/ops/page.tsx` — redirect to `/ops/schedule`.
- [ ] 10.1.7 Placeholder pages: `app/ops/schedule/page.tsx`, `app/ops/rentals/page.tsx`, `app/ops/coaches/page.tsx`, `app/ops/organizers/page.tsx`, `app/ops/programs/page.tsx`, `app/ops/report/page.tsx`, `app/ops/floorplan/page.tsx`. Each renders `<PageShell title="…"><p className="text-muted">Скоро.</p></PageShell>`.
- [ ] 10.1.8 Verify: load `/`, see Tournaments mode active, click "Операции" pill → routes to `/ops/schedule`, ops nav links visible, refresh keeps you on ops, click "Турниры" → back to `/` with tournament links.

## 10.2 Sub-phase: Program library

**SQL** (hand to user first, save to `supabase/schema.sql` as Phase 10 section):
```sql
create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  duration_minutes int not null,
  price_peak_rub int not null default 0,
  price_offpeak_rub int not null default 0,
  courts_needed int default 1,
  max_players int,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index idx_programs_type on programs(type);
```
Peak window: 17:00–22:00 (port from padel-ops `PEAK_START/PEAK_END`).

- [ ] 10.2.1 Append migration to `supabase/schema.sql` under "Phase 10 — Operations module" header. Instruct user to run it.
- [ ] 10.2.2 `lib/types.ts` — add `Program` type; export `PROGRAM_TYPES` constant of the 12 strings.
- [ ] 10.2.3 `lib/queries/programs.ts` — `listPrograms({ search, type })`, `getProgram(id)`.
- [ ] 10.2.4 `app/ops/programs/page.tsx` — server component, table of programs with type filter + search box (both via URL search params).
- [ ] 10.2.5 `app/ops/programs/ProgramForm.tsx` — client component, used for create + edit (modal or inline panel). Fields per the schema, type as `<Select>` of the 12 values.
- [ ] 10.2.6 Server actions: `create-program-action.ts`, `update-program-action.ts`, `delete-program-action.ts`. Each `revalidatePath('/ops/programs')`.
- [ ] 10.2.7 Seed action / one-time button "Загрузить набор по умолчанию" that inserts the 12 program types with reasonable defaults (Аренда 60min 4000₽ 1 court, Тренировка персональная 60min 3500₽ 1 court coach, Американо 90min 1500₽/player 2 courts 8 players, etc). Use only if user wants quick start — otherwise skip.
- [ ] 10.2.8 Verify: create one of each type, edit a price, search by name, filter by type, soft-delete via `is_active=false` toggle.
- [ ] 10.2.9 `npm run build` clean.

## 10.3 Sub-phase: Coaches module

**SQL**:
```sql
create table coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  rate_type text check (rate_type in ('flat','percent')) default 'flat',
  flat_rate_rub int default 0,
  rate_court_percent numeric(5,2) default 0,
  rate_coaching_percent numeric(5,2) default 0,
  specialization text,
  bio text,
  color text default '#4fc3f7',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade,
  day_of_week int check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);
create index idx_coach_availability_coach on coach_availability(coach_id);
```

- [ ] 10.3.1 Append SQL to schema, instruct user to run.
- [ ] 10.3.2 `lib/types.ts` — `Coach` type.
- [ ] 10.3.3 `lib/queries/coaches.ts` — `listCoaches({ activeOnly })`, `getCoach(id)`, `coachMonthlyEarnings(coachId, yyyyMm)` — port the calculation from padel-ops line 817, simplified: walks `schedule_sessions` where `coach_id=?` and date is in month, computes earnings per rate_type.
- [ ] 10.3.4 `app/ops/coaches/page.tsx` — server component, list of active coaches with this-month-earnings cards.
- [ ] 10.3.5 `app/ops/coaches/[id]/page.tsx` — coach profile with monthly tabs, session log table for current month, totals.
- [ ] 10.3.6 `CoachForm.tsx` + create/update/delete server actions.
- [ ] 10.3.7 Verify: create coach with both rate types, set 70% percent for one, navigate to profile.
- [ ] 10.3.8 `npm run build` clean.

## 10.4 Sub-phase: Tournament organizer accounts

**SQL**:
```sql
create table organizers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);
create table organizer_payments (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references organizers(id) on delete cascade,
  date date not null,
  amount_rub int not null,
  type text check (type in ('deposit','payment','refund')) default 'payment',
  courts_booked int,
  hours_booked numeric(4,1),
  notes text,
  created_at timestamptz default now()
);
create index idx_organizer_payments_org on organizer_payments(organizer_id);
```

- [ ] 10.4.1 Append SQL.
- [ ] 10.4.2 `lib/queries/organizers.ts` — `listOrganizers()` returns each with balance = SUM(payment) − SUM(deposit) − SUM(refund) computed in SQL. `getOrganizer(id)`, `listPaymentsForOrganizer(id)`.
- [ ] 10.4.3 `app/ops/organizers/page.tsx` — list with outstanding balance column (red if >0).
- [ ] 10.4.4 `app/ops/organizers/[id]/page.tsx` — profile + payment ledger table + "Добавить платёж" button (modal form).
- [ ] 10.4.5 Server actions: create/update/delete organizer, add/edit/delete payment.
- [ ] 10.4.6 Verify: create organizer, add deposit, add several payments (different types), balance updates.
- [ ] 10.4.7 `npm run build` clean.

## 10.5 Sub-phase: Weekly court scheduler

**Status of the world (post-10.3):** `schedule_sessions` and `session_coaches` tables already exist. Coach module already writes sessions through `createSessionWithCoach` (`lib/queries/schedule-sessions.ts`). 10.5 is **view + interaction, no new tables** — a Google-Calendar-style grid over the same data, plus an unscoped create flow (a session you place from the scheduler may or may not have a coach).

What padel-ops did, audited from `~/Desktop/padel-ops/`:

- **Grid shape**: vertical axis = time (32 × 30-min rows, 07:00–23:00, row height 32 px), horizontal = courts (K1–K5). Peak rows (17:00–22:00) shaded; hour-start rows have a heavier top border.
- **One day at a time**: state.currentDay flips between Пн…Вс. No multi-day view.
- **Session block**: absolute-positioned, `height = duration_h × 2 × 32 − 2`. Multi-court programs render one block per court (not one wide block).
- **Color**: 12 program-type colors via `data-type` attribute → CSS. Optional "coach view" toggle re-colors blocks by coach.color.
- **Click empty cell** → program picker modal (search + type chips + peak/off-peak prices). No drag, no resize, no inline edit; just click empty → modal create, click filled → detail modal.
- **Rentals overlay**: pulled separately via `/api/rentals/for-week`, expanded from `rental_slots` × contract-active date range. Rendered as a separate `.rental-block` style. Tooltip with "Открыть контракт →".
- **Current time indicator**: horizontal 2 px cyan line at `(now−07:00)/30 × 32` px from header, only on today & current-week.
- **Collision detection (server)**: time-rectangle intersect on minutes × court-set intersect (`check_collision`, app.py:704).

The user's brief: "Google Calendar meets a professional sports facility management tool" — i.e. significantly richer than padel-ops's day-only Excel-style grid.

### 10.5.0 Architectural decisions — confirm before any code

Each question below has a **recommendation**. Confirm or override before starting 10.5.1.

**10.5.0.1 Primary view: day-of-courts (padel-ops style) or week-of-one-court?**

5 active courts × 7 days × 32 rows = 1 120 cells, plus session blocks. A literal "all of it" week view doesn't fit on a laptop.

**Recommendation**: ship **two views, day primary**.
- **Day view** (default) — columns = courts (5), rows = 30-min slots. Same shape as padel-ops, but richer styling, current-time line, drag, resize, in-place edit, multi-block per session-with-multi-courts.
- **Week view** — columns = days (7), rows = 30-min slots, but **for one selected court at a time** (court tab strip at top). Useful for "which day of next week is this court free at 19:00?". Sessions on multi-court programs appear in each court's week view.
- View toggle in the top bar: `[ День | Неделя ]`. Persist last choice in localStorage.

**10.5.0.2 Drag-to-reschedule / resize handles?**

Padel-ops had neither. A pro tool should have both. But it adds material complexity (pointer handlers, optimistic update + rollback on collision, autoscroll near edges).

**Recommendation**: **yes, both — but only in day view, and only Phase-2 of 10.5**.
- Sub-phase 10.5a: read-only render + click-to-create + click-to-edit drawer. Ship and verify.
- Sub-phase 10.5b: add drag-to-move (within day) + resize bottom handle (snap to 30-min). Layered on top.

**10.5.0.3 Editing UX — drawer (10.3 pattern) or popover / modal?**

The 10.3 in-line drawer expands below the row in a table. Inside a grid cell that doesn't work — the cell is too narrow and a drawer would shove the rest of the grid down.

**Recommendation**: **floating popover anchored to the session block**, with the same fields as `LogSessionForm` (program, date, time range, courts, attendees, status, optional coach, optional revenue override, notes). Click outside or `Esc` closes. Popover positions itself to stay in viewport.

**10.5.0.4 Coach assignment — required, optional, or zero?**

10.3's coach-page form requires a coach because it's coach-scoped. The scheduler is unscoped — court rentals and tournaments have no coach.

**Recommendation**: **optional, zero-or-many**. Multi-select. Empty = no coach (a court rental or an open booking). Reuse the `session_coaches` join.

**10.5.0.5 Multi-court session blocks — one wide block or one block per court?**

Padel-ops did one block per court (each court's column shows the same session independently). A wide block spanning columns is visually clearer but interrupts column scanning.

**Recommendation**: **one wide block spanning the courts it occupies**, with a small "К1+К2" label in the meta line. Easier to read at a glance, makes multi-court tournaments visually distinct.

**10.5.0.6 Rental overlay — show or defer to 10.6?**

10.6 builds `rental_contracts` + `rental_slots`. 10.5 is its prerequisite display surface.

**Recommendation**: **defer rendering to 10.6**. 10.5 ships scheduler over `schedule_sessions` only; 10.6 adds the rental layer and the "click contract" tooltip. Leaves the grid cleaner during 10.5 verification.

**10.5.0.7 Program-type color palette — adopt padel-ops's 12 or design our own?**

Padel-ops's colors (`#e53935` red for ТУРНИР etc.) are tuned for SQLite-era Russian uppercase. We use Cyrillic still but with our own design system.

**Recommendation**: **derive from our existing accent / status tokens** plus eight more harmonised hues. Define `PROGRAM_TYPE_COLORS` in `lib/program-colors.ts` keyed by the lowercase program `type` field. Each color has a 600 (block bg) and 50 (peak-row tint) variant.

**10.5.0.8 Operating hours and slot size**

Padel-ops hardcoded `07:00–23:00` and 30-min slots.

**Recommendation**: **same defaults**, but expose `OPS_OPEN_HOUR=7`, `OPS_CLOSE_HOUR=23`, `OPS_SLOT_MINUTES=30` constants in `lib/ops-constants.ts` so they're tweakable later without grepping. Peak window already lives there.

---

### 10.5a — Read-only scheduler + click-to-create + click-to-edit

**Dependencies**: none new. Uses existing `schedule_sessions`, `session_coaches`, `programs`, `courts`, `coaches`.

- [ ] 10.5a.1 `lib/ops-constants.ts` — `OPS_OPEN_HOUR`, `OPS_CLOSE_HOUR`, `OPS_SLOT_MINUTES`, `SLOTS_PER_DAY` derived. Re-export `PEAK_START_HOUR`/`PEAK_END_HOUR` from `lib/program-groups.ts` for ergonomic single import.
- [ ] 10.5a.2 `lib/program-colors.ts` — `PROGRAM_TYPE_COLORS: Record<string, { block: string; soft: string; ink: string }>`. Stable order; a default fallback `{ block: var(--color-accent), soft: var(--color-accent-soft), ink: white }` for unknown types.
- [ ] 10.5a.3 `lib/queries/schedule.ts` (new) — `listSessionsForRange(fromIso, toIso)` returning `ScheduleSessionWithMeta & { coach_chips: Array<{id, name, color}> }`. Single batched query that left-joins `session_coaches` → `coaches` and groups in JS. Order by date, start_time.
- [ ] 10.5a.4 `lib/schedule-collisions.ts` (pure) — `detectCollision(existing, candidate): string | null`. Time-rectangle intersect (minute granularity) **× court-set intersect**. Skip `candidate.id` when present (edit mode). Used both client-side (preview) and server-side (final check).
- [ ] 10.5a.5 `app/ops/schedule/page.tsx` — server component. Reads `?view=day|week`, `?date=YYYY-MM-DD` (defaults to today), and for week view `?court=<uuid>`. Fetches `listSessionsForRange`, `listActiveCourts`, `listActivePrograms`, `listCoaches({activeOnly:true})`.
- [ ] 10.5a.6 `app/ops/schedule/SchedulerShell.tsx` — client. Top bar: date label, ◀ ▶ Сегодня, view-toggle (`День | Неделя`), court selector visible only in week view. Persists view choice to localStorage. Renders `<DayGrid>` or `<WeekGrid>`.
- [ ] 10.5a.7 `app/ops/schedule/DayGrid.tsx` — CSS grid. Columns = `[time-header] [court1] [court2] …`. Rows = `SLOTS_PER_DAY`. Time column sticky-left when scrolled horizontally. Peak rows tinted; hour-start rows with heavier top border. Current-time indicator (red 2 px line) absolutely positioned, only shown when `date === today`. Today's column header gets `bg-accent-soft`.
- [ ] 10.5a.8 `app/ops/schedule/WeekGrid.tsx` — analogous, columns = 7 days, rows = same. One court at a time.
- [ ] 10.5a.9 `app/ops/schedule/SessionBlock.tsx` — absolute-positioned block. Background from `PROGRAM_TYPE_COLORS[session.program_type].block`. Spans court columns when multi-court (uses grid-column span computed by parent). Inside: program name, time range, court labels if multi, coach color dots row, attendee count if set. Status `cancelled` gets striped/desaturated.
- [ ] 10.5a.10 `app/ops/schedule/EmptyCell.tsx` — clickable empty 30-min cell. Hover state: subtle accent-soft + plus icon. Click opens `<SessionPopover anchor=cell mode="create" date=... start_time=... court_ids=[col] />`.
- [ ] 10.5a.11 `app/ops/schedule/SessionPopover.tsx` — floating panel (use `@floating-ui/react` if already in deps; else hand-rolled absolute positioning with viewport clamp). Mode `create` or `edit`. Form fields: Program (search-select with type chips, like padel-ops's picker — port the UX), Date / Start / End / Duration auto-derived from program but editable in 30-min steps, Courts (multi-select chips, default = program's `courts_needed` starting from the clicked column), Coaches (multi-select chips, **optional zero-or-many**), Attendees, Status, Manual revenue override (same `manualRevenue=false` default as 10.3), Notes. Live preview cards same as 10.3. Server submit goes through actions below.
- [ ] 10.5a.12 `app/ops/schedule/create-schedule-action.ts` — validates input, runs `detectCollision` against the existing day's sessions, inserts into `schedule_sessions`, then inserts the (zero-or-many) `session_coaches` links. Rolls back the session insert if coach-link insert fails. `revalidatePath('/ops/schedule')` + `revalidatePath('/ops/coaches')` (so coach-page monthly stats reflect new sessions).
- [ ] 10.5a.13 `app/ops/schedule/update-schedule-action.ts` — same plus delete-and-reinsert `session_coaches` rows (simplest concurrent-safe update). Collision check excludes the session being edited.
- [ ] 10.5a.14 `app/ops/schedule/delete-schedule-action.ts` — cascade-deletes session_coaches via FK. Revalidate both paths.
- [ ] 10.5a.15 `npm run build` clean.
- [ ] 10.5a.16 Browser verify: open `/ops/schedule`, today highlights; click an empty 19:00 cell → popover; pick Клиника 4 игрока, K1 default, save; block appears with the type color; click block → edit popover; change time to 20:00, save; try to overlap with existing → server error toast; cancel session → block becomes striped; switch to Week view, select a court, navigate weeks.

### 10.5b — Drag to move + resize handles

(Layered on after 10.5a is verified.)

- [ ] 10.5b.1 `app/ops/schedule/useDragSession.ts` — pointer-events based: capture pointer on `<SessionBlock>` body (excluding resize handle and child controls), track delta in slots/columns, render a ghost block, on pointerup call `update-schedule-action` with the new `start_time`/`end_time`/`court_ids`. If `detectCollision` fails client-side, snap back. Touch devices: 150 ms long-press initiates drag.
- [ ] 10.5b.2 Resize handle on south edge of `<SessionBlock>` — drag down/up snaps to 30-min steps, minimum one slot. Same collision check.
- [ ] 10.5b.3 Drag from week-view does not change court (court is locked to the column tab); from day view, horizontal drag changes court.
- [ ] 10.5b.4 Subtle "drop target" outline on cells under the ghost during drag.
- [ ] 10.5b.5 `npm run build` clean + browser verify.

### Visual reference (the "significantly better" part)

The non-obvious upgrades over padel-ops's grid:

1. **Coach color dots row** inside each block — a thin strip of 4-px dots at the top of every block, one per assigned coach, sourced from `coach.color`. Avoids the all-or-nothing "color by coach" toggle that hides the program-type signal.
2. **Multi-court wide blocks** (10.5.0.5) instead of N parallel blocks. A tournament that spans K1+K2 renders as one bar across both columns with a "К1+К2" badge — looks like a single event, behaves like one click target.
3. **Today's column accent**, current-time line — both standard Google Calendar tropes, both absent in padel-ops.
4. **Hover-on-empty-cell** with a soft plus icon — discoverable "click here to add" without explaining it.
5. **Type-coded peak shading** — peak rows (17:00–22:00) get the type's `soft` color when occupied, generic `--color-warning-soft` when empty. Visually anchors the "this slot is premium time" without screaming yellow.
6. **Sticky time gutter** — left column stays put when you scroll the grid horizontally on smaller screens.
7. **Status semantics** — cancelled sessions render with hatched stripes and 60 % opacity; completed sessions get a small ✓ glyph corner. The block still occupies the cell so collision math is honest.
8. **Keyboard nav** — `←/→` shifts day, `Shift+←/→` shifts week, `T` jumps to today, `Esc` closes popover. Not in padel-ops at all.
9. **One-click "Дублировать на следующую неделю"** in the edit popover — re-creates the same session 7 days later. Saves operators a click for recurring events; serves as a "drag-without-dragging" alternative before 10.5b ships.

## 10.6 Sub-phase: Court rental contracts

**SQL** (multi-slot model — one contract → many recurring weekly slots):
```sql
create table rental_contracts (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_type text check (client_type in ('физлицо','юрлицо')) default 'физлицо',
  client_contact text,
  start_date date not null,
  end_date date,
  total_contract_value_rub int default 0,
  payment_type text check (payment_type in ('единовременно','ежемесячно','ежеквартально')) default 'ежемесячно',
  status text check (status in ('active','paused','ended')) default 'active',
  notes text,
  created_at timestamptz default now()
);
create table rental_slots (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references rental_contracts(id) on delete cascade,
  court_id uuid references courts(id),
  day_of_week int check (day_of_week between 0 and 6) not null,
  start_time time not null,
  end_time time not null,
  coach_id uuid references coaches(id),
  notes text
);
create table rental_payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references rental_contracts(id) on delete cascade,
  date date not null,
  amount_rub int not null,
  method text check (method in ('cash','card','transfer')),
  period_label text,
  notes text,
  created_at timestamptz default now()
);
create index idx_rental_slots_contract on rental_slots(contract_id);
create index idx_rental_payments_contract on rental_payments(contract_id);
```

- [ ] 10.6.1 Append SQL.
- [ ] 10.6.2 `lib/queries/rentals.ts` — `listContracts()` with per-contract balance (sum of expected periods × price minus payments), `getContract(id)`, `listPaymentsForContract(id)`.
- [ ] 10.6.3 `app/ops/rentals/page.tsx` — list of active contracts, status filter, outstanding balance column.
- [ ] 10.6.4 `app/ops/rentals/[id]/page.tsx` — contract detail: slot info, payment history table, add-payment button.
- [ ] 10.6.5 `RentalForm.tsx`, `PaymentForm.tsx`.
- [ ] 10.6.6 Server actions: create/update/delete contract, add/edit/delete payment.
- [ ] 10.6.7 **Scheduler integration**: extend `app/ops/schedule/page.tsx` to also query active rental contracts whose `day_of_week` and `start_date..end_date` cover days in the current week. Render them as teal-tinted blocks behind/below schedule_sessions on the matching court column. Click → opens the contract detail page in a new tab; no edit-from-grid (contracts edited only from `/ops/rentals/[id]`).
- [ ] 10.6.8 Verify: create a Mon 19:00-20:30 contract for a year, see it appear on every Monday in scheduler, log a few payments, balance updates.
- [ ] 10.6.9 `npm run build` clean.

## 10.7 Sub-phase: Weekly report

- [ ] 10.7.1 `lib/queries/weekly-report.ts` — `generateWeeklyReport(monday)`: revenue by source (sum schedule_sessions.revenue_rub + sum tournament entry_fee × registrations for tournaments dated in this week + sum rental_payments.amount in this week), per-court utilization (sum of session minutes ÷ available open-hours minutes), top 5 programs by revenue, coach totals (sessions count + earnings), comparison vs prev week.
- [ ] 10.7.2 `app/ops/report/page.tsx` — server component, week selector at top, all sections rendered.
- [ ] 10.7.3 Configurable weekly target: read from `localStorage` or a single-row `ops_settings` table — defer to a simple input on the report page that persists to localStorage for now (no new table).
- [ ] 10.7.4 Verify with seeded data.
- [ ] 10.7.5 `npm run build` clean.

## 10.8 Sub-phase: Floor plan placeholder

- [ ] 10.8.1 `app/ops/floorplan/page.tsx` — single PageShell with heading "План зала" and body "Скоро."
- [ ] 10.8.2 Already linked from nav (10.1.2). No build verification beyond load.

## 10.9 Sub-phase: Display page integration

- [ ] 10.9.1 Read `app/display/page.tsx` to understand current data source.
- [ ] 10.9.2 Extend the events query to merge in: today's `schedule_sessions` (non-cancelled) + active rental_contracts whose `day_of_week === today.dow`. Tag each event with `source: 'tournament' | 'schedule' | 'rental'`.
- [ ] 10.9.3 Update `EventCard.tsx` to render a small badge per source. Color rentals teal, schedule sessions by program type, tournaments keep current style.
- [ ] 10.9.4 Verify on `/display` with at least one of each type scheduled for today.
- [ ] 10.9.5 `npm run build` clean.

## 10.10 Sub-phase: Data migration (final step, only after 10.1–10.9 verified)

- [ ] 10.10.1 Ask user to run `DATABASE_URL=<railway-postgres-url> python3 ~/Desktop/padel-ops/migrate.py export`, producing `data_export.json` in `~/Desktop/padel-ops/`.
- [ ] 10.10.2 `scripts/migrate-from-padel-ops.ts` — Node script that reads `data_export.json` and uses the Supabase service-role key from `.env.local`:
  - **programs**: map padel-ops row → new schema. `name`, `type`, `duration_minutes = round(duration × 60)`, `price_rub = round((price_peak + price_off_peak) / 2 × players)` (or just `price_peak × players` — confirm with user during 10.0.1 resolution), `courts_needed = courts`, `max_players = players`, `description = code`, `is_active = true`. Keep old `code` in description so users recognize them.
  - **coaches**: name, phone, color, rate_type (`fixed`→`flat`, `pct`→`percent`), rate_value (flat_rate for flat, revenue_pct for percent), coaching_fee_pct, specialty→specialization, notes→bio.
  - **courts**: padel-ops uses int 1–5; look up our existing `courts.number` to get uuid mapping. If counts don't match, abort with a message asking user to ensure 5 courts exist in this app first.
  - **schedule_sessions** (from padel-ops `sessions` + `weeks`): for each session, compute `date = week.start_date + day_of_week`, end_time = start + duration, court_id from courts_list[0] (drop multi-court sessions to the first court; emit a warning to console for any session with `courts_used > 1` — those will need manual review).
  - **rental_contracts** (from padel-ops `rental_contracts` + `rental_slots`): expand each contract×slot pair into a new `rental_contracts` row (since our model is one-slot-per-contract). Price = total_contract_value ÷ slot_count (rough; flag in console for manual review).
  - **rental_payments**: map period payments to dated payments. Padel-ops `paid_date` becomes `date`; rows with no paid_date are dropped (they're future expected payments, not actual payments).
  - **organizers**: no source data, skip.
  - Skip: weeks, sessions/attendees, week_templates, coach_availability, settings.
- [ ] 10.10.3 Run script with `--dry-run` first, log row counts per table.
- [ ] 10.10.4 Run script for real. Spot-check 5 programs, 3 coaches, 5 schedule sessions, 2 rental contracts in the UI.
- [ ] 10.10.5 Verify weekly report on a known-good week matches the old Railway report visually.
- [ ] 10.10.6 User confirms data integrity → shuts down Railway service, archives the GitHub repo. Done.

---

## Implementation order summary

1. Resolve open questions in 10.0 (user decisions)
2. 10.1 shell + nav (no DB)
3. 10.2 programs
4. 10.3 coaches
5. 10.4 organizers
6. 10.5 scheduler (depends on programs + coaches + courts)
7. 10.6 rentals (depends on courts; integrates into scheduler)
8. 10.7 weekly report
9. 10.8 floor plan placeholder
10. 10.9 display integration
11. 10.10 migration (last)

After every sub-phase: `npm run build` clean + browser verification + check-in with user.

---

# Phase 11 — Unified sidebar navigation

Goal: remove the Турниры/Операции mode toggle entirely. Replace with one unified, sectioned sidebar. No database changes. No URL changes. Purely navigation restructure.

Workflow: write plan (this section) → confirm with user → build top-to-bottom → `npm run build` + `npm run lint` clean → browser verification → single commit.

## 11.0 Open decisions (resolved before planning)

- [x] Home route `/` appears under **ТУРНИРЫ** only as «Турниры и лиги». No separate ГЛАВНАЯ section.
- [x] `/ops/report` (weekly report) keeps its route and is surfaced under **КОРТЫ** in the new sidebar. (Floor plan placeholder from old Phase 10.8 is not added — out of scope.)
- [x] Icons stripped from every nav item except 📺 «Дисплей». Section headers carry visual structure instead.
- [x] Section-header active state = color shift only (`--text-muted` → `--accent`). No dot, no background.

## 11.1 Sub-phase: navLinks shape rewrite

Pure data + helpers, no UI yet.

- [ ] 11.1.1 In `components/site/navLinks.ts`, delete: `AppMode`, `tournamentNavLinks`, `opsNavLinks`, `MODE_DEFAULT_PATH`, `getModeFromPathname`, `getNavLinksForMode`, the `dividerBefore` field on `NavLink`.
- [ ] 11.1.2 Replace `NavLink` with:
  ```ts
  export type NavLink = {
    href: string;
    label: string;
    icon?: string; // only Дисплей uses this in v1
  };
  export type NavSection = {
    title: string;        // small-caps header text
    dividerAbove?: boolean; // only true for СИСТЕМА
    links: NavLink[];
  };
  ```
- [ ] 11.1.3 Export `NAV_SECTIONS: NavSection[]` in this order:
  - КОРТЫ — Расписание /ops/schedule, Аренда /ops/rentals, Календарь /calendar, Корты /courts, Отчёт /ops/report
  - ТУРНИРЫ — Турниры и лиги /, Игроки /players, Аналитика /analytics
  - ПЕРСОНАЛ — Тренеры /ops/coaches, Организаторы /ops/organizers
  - ПРОГРАММЫ — Программы /ops/programs
  - СИСТЕМА (dividerAbove: true) — 📺 Дисплей /display (only item with `icon: "📺"`)
- [ ] 11.1.4 Export `isLinkActive(pathname: string, href: string): boolean`:
  - if `href === "/"` → active only when `pathname === "/"` (exact match)
  - else → `pathname === href || pathname.startsWith(href + "/")`
- [ ] 11.1.5 Export `isSectionActive(pathname: string, section: NavSection): boolean` — true when any of `section.links` is active.

## 11.2 Sub-phase: SidebarNav rewrite

- [ ] 11.2.1 Rewrite `components/site/SidebarNav.tsx` to consume `NAV_SECTIONS`. Iterate sections, then links inside each.
- [ ] 11.2.2 Section header rendering:
  - `<div>` (not a button — not clickable)
  - classes: `px-4 pt-1 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] select-none transition-colors`
  - color: `text-muted` by default, `text-[var(--color-accent)]` when `isSectionActive(pathname, section)` is true
- [ ] 11.2.3 Section spacing: each section gets `mt-4` (16 px) except the first; sections with `dividerAbove` also render `<hr aria-hidden className="my-3 mx-3 border-0 border-t border-border" />` BEFORE the header.
- [ ] 11.2.4 Link rendering — preserve current active styling exactly:
  - 40 px row height (`h-10`), `pl-4 pr-3`, rounded
  - active: `text-black bg-subtle font-semibold` + 3 px left bar in `bg-accent`
  - inactive: `text-muted hover:text-black hover:bg-subtle font-medium`
  - icon span only renders when `link.icon` truthy (preserves Дисплей's 📺)
- [ ] 11.2.5 Nav wrapper: `<nav className="flex flex-col p-3">` — replaces the current `gap-0.5` flat layout because sections handle their own spacing.
- [ ] 11.2.6 Keep the `onNavigate?: () => void` prop and pass through to each Link's `onClick` (used by MobileNav for drawer-close-on-tap).

## 11.3 Sub-phase: Remove ModeSwitcher

- [ ] 11.3.1 Delete `components/site/ModeSwitcher.tsx`.
- [ ] 11.3.2 `components/site/PageShell.tsx` — remove `import { ModeSwitcher } …` and the `<ModeSwitcher />` line. Verify Logo sits directly above SidebarNav with no extra spacing weirdness; if needed, add `pt-1` to SidebarNav's `<nav>`.
- [ ] 11.3.3 `components/site/MobileNav.tsx` — remove `import { ModeSwitcher } …` and the `<ModeSwitcher onNavigate=… />` line.
- [ ] 11.3.4 Grep the repo for `kosmo_mode`, `ModeSwitcher`, `getModeFromPathname`, `getNavLinksForMode`, `tournamentNavLinks`, `opsNavLinks`, `MODE_DEFAULT_PATH`, `AppMode` — confirm zero remaining references outside the files already changed.

## 11.4 Sub-phase: Mobile drawer

Mostly free — the rewritten `SidebarNav` is shared. Only confirm the drawer still scrolls when nav grows.

- [ ] 11.4.1 Open drawer on a small viewport; confirm all five sections + Дисплей render with headers and the active section's header is tinted accent.
- [ ] 11.4.2 Confirm 240 px desktop sidebar still fits all nav within `min-h-screen` without crowding the mini calendar — section headers add ~110 px of vertical space, calendar is `mt-auto`, sidebar is `overflow-y-auto` so scrolling is OK if it overflows.

## 11.5 Sub-phase: Verify, polish, commit

- [ ] 11.5.1 `npm run build` clean (Turbopack).
- [ ] 11.5.2 `npm run lint` exits 0.
- [ ] 11.5.3 Manual browser sweep: visit `/`, `/players`, `/analytics`, `/courts`, `/calendar`, `/ops/schedule`, `/ops/rentals`, `/ops/coaches`, `/ops/organizers`, `/ops/programs`, `/ops/report`, `/display`. For each: confirm the right link is highlighted (3 px accent bar + background) AND the right section header is tinted accent.
- [ ] 11.5.4 Edge case: `/` is the only route that should match exactly — visiting `/tournament/123` must NOT mark «Турниры и лиги» active (the `href === "/"` exact-match branch in `isLinkActive` covers this). Verify in browser.
- [ ] 11.5.5 No file exceeds 600 lines (none of the touched files come close).
- [ ] 11.5.6 Single commit: `Phase 11: unified sidebar nav (remove mode toggle)` with HEREDOC body listing the rename, deletion, and behavior change. Push to `origin/main`.

---

## Out of scope for Phase 11

- No database changes.
- No URL changes — every existing route keeps its current path.
- No new pages, no copy changes to non-nav strings.
- No styling changes outside the sidebar component tree.
- No mobile-vs-desktop divergence — both render `<SidebarNav />`.

## Files touched (expected)

- `components/site/navLinks.ts` — rewrite
- `components/site/SidebarNav.tsx` — rewrite
- `components/site/PageShell.tsx` — 2 lines removed
- `components/site/MobileNav.tsx` — 2 lines removed
- `components/site/ModeSwitcher.tsx` — **deleted**

Total surface: 5 files, 1 deletion, ~150 lines net change.

---

# Phase 12A — Calendar unification (4 event types)

Goal: `/calendar` shows all 4 event sources side-by-side — tournaments, tournament/league sessions, rental contract instances, and ops scheduler sessions. Mini calendar in the sidebar reflects all four with colored dots. No DB changes. No URL changes. Read-only.

Workflow: write plan (this section) → confirm with user → build top-to-bottom → `npm run build` + `npm run lint` clean → browser verification → single commit.

## 12A.0 Open decisions (resolved before planning)

- [x] `CalendarEvent` becomes a discriminated union with kinds `tournament` (renamed from `tournament_pending`), `league_session` (renamed from `session`), `rental` (new), `schedule_session` (new). Per-kind fields are precisely typed.
- [x] Mini calendar shows up to 4 small colored dots per date — one per kind present that day. Fixed palette: rose=tournament, green=league_session, teal=rental, amber=schedule_session.
- [x] Coach names in block subtitle = comma-joined with CSS `truncate`; full list in the popover.
- [x] Rental popover offers two destinations: «Открыть контракт» → `/ops/rentals/[contract_id]` and «Открыть в расписании» → `/ops/schedule?view=day&date=[date]`.

## 12A.1 Sub-phase: CalendarEvent discriminated union

- [ ] 12A.1.1 In `lib/queries/calendar.ts`, replace the current `CalendarEvent` interface with a discriminated union:
  ```ts
  export type EventKind =
    | "tournament"
    | "league_session"
    | "rental"
    | "schedule_session";

  interface BaseCalendarEvent {
    key: string;
    date: string;
    startTime: string | null;
    durationHours: number;
    courtIds: string[];
  }

  export interface TournamentCalendarEvent extends BaseCalendarEvent {
    kind: "tournament";
    tournamentId: string;
    tournamentName: string;
    tournamentType: TournamentType;
    tournamentStatus: TournamentStatus;
    format: TournamentFormat;
  }

  export interface LeagueSessionCalendarEvent extends BaseCalendarEvent {
    kind: "league_session";
    tournamentId: string;
    tournamentName: string;
    tournamentType: TournamentType;
    tournamentStatus: TournamentStatus;
    format: TournamentFormat;
    sessionId: string;
    sessionNumber: number;
    sessionStatus: SessionStatus;
  }

  export interface RentalCalendarEvent extends BaseCalendarEvent {
    kind: "rental";
    contractId: string;
    slotId: string;
    clientName: string;
    contractNumber: string | null;
    slotNotes: string | null;
  }

  export interface ScheduleSessionCalendarEvent extends BaseCalendarEvent {
    kind: "schedule_session";
    sessionId: string;
    programName: string | null;
    programType: string | null;
    coachNames: string[]; // canonical order, comma-joinable
  }

  export type CalendarEvent =
    | TournamentCalendarEvent
    | LeagueSessionCalendarEvent
    | RentalCalendarEvent
    | ScheduleSessionCalendarEvent;
  ```
- [ ] 12A.1.2 Create new file `lib/calendar-events.ts` with pure display helpers (no I/O):
  - `eventTitle(e: CalendarEvent): string`
  - `eventSubtitle(e: CalendarEvent): string | null` — for blocks (one-line, truncatable)
  - `eventDetailLines(e: CalendarEvent): string[]` — for popover body
  - `eventBlockStyle(e: CalendarEvent): { background: string; ink: string; stripe?: boolean; badge?: string }` — returns the per-kind visual recipe (teal+stripe+АРЕНДА for rental, programTypeColor+ОПС for schedule_session, falls back for tournament/league)
  - `eventLinks(e: CalendarEvent): Array<{ label: string; href: string; primary: boolean }>` — for popover actions
  - `MINI_CALENDAR_KIND_COLOR: Record<EventKind, string>` — fixed palette for mini-cal dots:
    - tournament: `#e11d48` (rose, matches existing tournament event tone)
    - league_session: `var(--color-accent)` (green)
    - rental: `#0d9488` (teal, matches RentalBlock)
    - schedule_session: `#d97706` (amber, distinct from tournaments/league/rentals)
- [ ] 12A.1.3 No `any` types anywhere. Each kind narrowed via `switch (e.kind)` exhaustively.

## 12A.2 Sub-phase: extend `listCalendarEventsInRange`

- [ ] 12A.2.1 Update `lib/queries/calendar.ts` `listCalendarEventsInRange(from, to)` to call four sources in parallel:
  - existing tournaments query → `kind: "tournament"`
  - existing tournament_sessions query → `kind: "league_session"`
  - `listRentalBlocksForRange(from, to)` (import from `lib/queries/rentals`) → `kind: "rental"`
  - `listSessionsForRange(from, to)` (import from `lib/queries/schedule`) → `kind: "schedule_session"`
- [ ] 12A.2.2 Convert rental blocks to `RentalCalendarEvent`:
  - `key = "r:" + block.id`
  - `startTime = block.start_time`
  - `durationHours = (parseTime(end_time) − parseTime(start_time)) / 60` — write a tiny inline `hhmmToMinutes(s: string): number` helper since the existing layout code expects fractional hours.
  - `courtIds = block.court_ids`
  - per-kind fields from block
- [ ] 12A.2.3 Convert schedule sessions to `ScheduleSessionCalendarEvent`:
  - `key = "ss:" + session.id`
  - same time arithmetic
  - `coachNames = session.coach_chips.map(c => c.name)`
  - `programName`, `programType` from session
- [ ] 12A.2.4 Tournaments + league_session conversion: keep current shape, only rename `kind`.
- [ ] 12A.2.5 Return concatenated array (caller groups/sorts as needed).

## 12A.3 Sub-phase: `listEventKindsByDate` for mini calendar

- [ ] 12A.3.1 Replace `listEventDates(): Promise<string[]>` with `listEventKindsByDate(fromIso: string, toIso: string): Promise<Record<string, EventKind[]>>`.
- [ ] 12A.3.2 Query dates from:
  - `tournaments.date_start` (and `date_end` if different) within range → mark `tournament`
  - `tournament_sessions.session_date` within range → mark `league_session`
  - `schedule_sessions.date` within range → mark `schedule_session` (only the date column needed — single SELECT)
  - `listRentalBlocksForRange(from, to)` for each block's `.date` → mark `rental`
- [ ] 12A.3.3 Fold into `Map<string, Set<EventKind>>`, then JSON-friendly `Record<string, EventKind[]>` preserving canonical kind order.
- [ ] 12A.3.4 Old `listEventDates` removed (only caller is `SidebarMiniCalendar`, refactored in 12A.7).

## 12A.4 Sub-phase: EventBlock per-kind rendering

- [ ] 12A.4.1 Rewrite `app/calendar/EventBlock.tsx`:
  - Compute `style = eventBlockStyle(event)`
  - Compute `title = eventTitle(event)`, `subtitle = eventSubtitle(event)`
  - For `rental` and `schedule_session` kinds → render filled background using `style.background`, white `style.ink` text, badge in top-right (`style.badge` is `АРЕНДА` or `ОПС`)
  - For `rental` → add inline `style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 14px)" }}` over the teal
  - For `tournament` + `league_session` → keep existing `statusClass(event.tournamentStatus)` logic (status-driven colors)
  - All three densities (pill, compact, comfortable) work for all four kinds
- [ ] 12A.4.2 No file over 600 lines. Estimated ~150 lines after rewrite.

## 12A.5 Sub-phase: EventPopover per-kind body + actions

- [ ] 12A.5.1 Rewrite `app/calendar/EventPopover.tsx`. Top-level structure stays the same (`<dialog>`, header with close, body, footer with buttons), but the body and footer dispatch on `event.kind`.
- [ ] 12A.5.2 Per-kind body content:
  - `tournament` / `league_session` → current layout: name, when, badges (format/status/type), courts, session number+status if league_session. **No changes from today** except switching to `eventTitle` / `eventDetailLines` helpers.
  - `rental` → title = `clientName`, when = `formatDateRu + start–end`, detail lines: contract number, slot notes. No status badges.
  - `schedule_session` → title = `programName ?? "Сессия"`, when = `formatDateRu + start–end`, detail lines: program type, coach list (full, comma-joined), courts.
- [ ] 12A.5.3 Per-kind footer actions (right-aligned, primary button = solid accent):
  - `tournament` / `league_session` → secondary «Закрыть», primary «Открыть турнир» → `/tournament/[tournamentId]`
  - `rental` → secondary «Закрыть», secondary «Открыть в расписании» → `/ops/schedule?view=day&date=[date]`, primary «Открыть контракт» → `/ops/rentals/[contractId]`
  - `schedule_session` → secondary «Закрыть», primary «Открыть в расписании» → `/ops/schedule?view=day&date=[date]`
- [ ] 12A.5.4 File estimated ~250 lines, well under 600 cap.

## 12A.6 Sub-phase: MiniCalendar dot row

- [ ] 12A.6.1 Update `components/site/MiniCalendar.tsx`:
  - Prop changes from `eventDates: string[]` to `eventKindsByDate: Record<string, EventKind[]>`
  - For each date cell, if the date has entries, render a `flex flex-row gap-0.5` row of up to 4 dots (`w-1 h-1 rounded-full`), color from `MINI_CALENDAR_KIND_COLOR`
  - Dot row sits below the date number, takes ~6 px vertical
- [ ] 12A.6.2 Confirm cell height accommodates date number + dot row without breaking layout. Adjust grid template if needed.

## 12A.7 Sub-phase: SidebarMiniCalendar fetch range

- [ ] 12A.7.1 Update `components/site/SidebarMiniCalendar.tsx`:
  - Compute `fromIso = today − 1 month` and `toIso = today + 12 months` using existing helpers in `lib/calendar-range.ts`
  - Call `listEventKindsByDate(fromIso, toIso)`
  - Pass result to `<MiniCalendar eventKindsByDate=… />`
- [ ] 12A.7.2 If `lib/calendar-range.ts` lacks an `addMonths` helper, import the one already in use elsewhere in the app.

## 12A.8 Sub-phase: verify, polish, commit

- [ ] 12A.8.1 `npm run build` clean (Turbopack).
- [ ] 12A.8.2 `npm run lint` exits 0.
- [ ] 12A.8.3 Browser sweep on `/calendar`:
  - Day view: each of the 4 event kinds renders with the right color/badge; click each → correct popover content + buttons
  - Week view: same, in compact density
  - Month view: pill density for all 4 kinds
- [ ] 12A.8.4 Mini calendar sidebar: dates with multiple kinds show multi-colored dot row; single-kind dates show one dot.
- [ ] 12A.8.5 Popover button checks: «Открыть турнир» → tournament page; «Открыть контракт» → rental detail; «Открыть в расписании» → scheduler day view with correct date in URL.
- [ ] 12A.8.6 No file over 600 lines. Run `wc -l app/calendar/*.tsx components/site/MiniCalendar.tsx lib/queries/calendar.ts lib/calendar-events.ts` to confirm.
- [ ] 12A.8.7 Single commit: `Phase 12A: unified calendar (4 event types)`. Push to `origin/main`.

---

## Out of scope for Phase 12A

- No DB schema changes.
- No URL changes on `/calendar`.
- No event creation/editing from the calendar — still read-only.
- No new sources beyond the 4 listed (e.g., no court-blocked-for-maintenance type).
- No scheduler-page changes (it already handles the same event types from its own queries).
- No mobile-specific design tweaks beyond what the existing calendar layout already does.

## Files touched (expected)

- `lib/queries/calendar.ts` — major refactor (union type, four-source fold, mini-cal date-kinds query)
- `lib/calendar-events.ts` — **new** (display helpers + mini-cal palette)
- `app/calendar/page.tsx` — minor (new return type already inferred)
- `app/calendar/EventBlock.tsx` — rewrite for 4 kinds
- `app/calendar/EventPopover.tsx` — rewrite for 4 kinds
- `app/calendar/DayView.tsx`, `WeekView.tsx`, `MonthView.tsx` — replace direct `event.tournamentName` reads with helper calls
- `components/site/MiniCalendar.tsx` — prop shape + dot-row rendering
- `components/site/SidebarMiniCalendar.tsx` — switch to range-aware query

Total surface: ~9 files, 1 new, no deletions, expected ~500–700 lines net change.

---

# Phase 12B — Weekly report at /ops/report

Goal: replace the placeholder at `/ops/report` with a real weekly operations report. Single page, single commit. Adds one small DB table (`app_settings`) so the SQL handoff comes first.

Workflow: write plan → confirm with user → SQL handoff → wait for "ran clean" → build top-to-bottom → `npm run build` + `npm run lint` clean → browser verification → single commit.

## 12B.0 Open decisions (resolved before planning)

- [x] Tournament fees included as «Турниры (расчётно)» with a small inline note explaining the value is computed from `entry_fee × registrations` for tournaments whose `date_start` falls in the week, not from confirmed payments.
- [x] ~~Weekly revenue target~~ — **REMOVED from scope.** No `app_settings` table, no target card, no SQL migration. Report shows revenue, utilization, payouts, top programs, and sessions breakdown only.
- [x] Court utilization counts each court independently — a multi-court session contributes its full duration to each of its courts (operator-intuitive view).
- [x] Sessions breakdown renders as one date-headed sub-table per day with sessions. Days without sessions are skipped.

## 12B.1 Sub-phase: SQL — app_settings table (USER RUNS)

- [ ] 12B.1.1 Append to `supabase/schema.sql`:
  ```sql
  create table app_settings (
    id int primary key default 1,
    weekly_revenue_target_rub int not null default 200000,
    updated_at timestamptz default now(),
    constraint single_row check (id = 1)
  );
  insert into app_settings (id) values (1) on conflict do nothing;
  ```
- [ ] 12B.1.2 Hand the SQL to the user; wait for "SQL ran clean" before any UI code.

## 12B.2 Sub-phase: Types + fallback constant

- [ ] 12B.2.1 In `lib/types.ts`, add:
  ```ts
  export interface AppSettings {
    id: number;
    weekly_revenue_target_rub: number;
    updated_at: string;
  }
  ```
- [ ] 12B.2.2 In `lib/ops-constants.ts`, export `WEEKLY_REVENUE_TARGET_FALLBACK_RUB = 200_000` (used when the settings row is missing — defensive, the migration inserts the row).

## 12B.3 Sub-phase: Query layer

- [ ] 12B.3.1 `lib/queries/settings.ts` — `getAppSettings(): Promise<AppSettings>` (returns fallback if missing); `updateWeeklyRevenueTarget(rub: number): Promise<void>` (UPDATE app_settings set weekly_revenue_target_rub = … where id = 1).
- [ ] 12B.3.2 `lib/queries/report.ts` — `getWeeklyReport(weekStartIso: string): Promise<WeeklyReport>`. Single parallel batch of queries, then in-memory aggregation:
  - `schedule_sessions` for the week with nested program + session_coaches → coaches (exclude `cancelled`)
  - `rental_blocks` via `listRentalBlocksForRange(weekStart, weekEnd)` plus the rental_slots table for slot revenue (rental contracts store an effective hourly rate? — if no per-slot rate exists, use the rental_payments amounts within the week instead; confirm during implementation)
  - `tournaments` with `date_start` within the week + their `tournament_registrations` (count only)
  - `coaches` (all active) — reused for the payout table
  - `courts` (all active) — for utilization rows + court-number labels
- [ ] 12B.3.3 The returned `WeeklyReport` shape:
  ```ts
  export interface WeeklyReport {
    weekStartIso: string;
    weekEndIso: string;
    revenue: {
      rentals_rub: number;
      scheduler_rub: number;
      tournaments_estimated_rub: number;
      total_rub: number;
    };
    target: { target_rub: number; pct: number };
    courtUtilization: Array<{
      court_id: string;
      court_number: number;
      booked_hours: number;
      available_hours: number; // 112 = 16h × 7d
      pct: number;
    }>;
    coachPayouts: Array<{
      coach_id: string;
      coach_name: string;
      coach_color: string;
      sessions: number;
      gross_revenue_rub: number;
      payout_rub: number;
    }>;
    topPrograms: Array<{
      program_name: string;
      program_type: string | null;
      sessions: number;
      revenue_rub: number;
    }>;
    sessionsByDay: Array<{
      date: string;
      rows: Array<{
        id: string;
        start_time: string;
        end_time: string;
        program_name: string | null;
        program_type: string | null;
        coach_names: string[];
        court_numbers: number[];
        attendees: number;
        revenue_rub: number;
      }>;
    }>;
  }
  ```
- [ ] 12B.3.4 Coach payout calculation reuses `computeEarnings` from `lib/queries/coaches.ts` — flat-rate coaches get `flat_rate_rub × sessions`; percent coaches get `court_revenue × court_pct + coaching_fee × coaching_pct`.

## 12B.4 Sub-phase: page shell

- [ ] 12B.4.1 `app/ops/report/page.tsx`:
  - `searchParams: { week?: string }`
  - Validate `week` as YYYY-MM-DD; fall back to `startOfWeekMon(todayIso())` from `lib/calendar-range.ts`
  - Parallel fetch: `getWeeklyReport(weekStart)` + `getAppSettings()`
  - Pass to client components; PageShell title = «Отчёт».

## 12B.5 Sub-phase: week navigation header

- [ ] 12B.5.1 `ReportWeekHeader.tsx` — ◀ ▶ arrows (prev/next week via `addDays(weekStart, ±7)`), «Эта неделя» button (jumps to `startOfWeekMon(todayIso())`), date-range label «12–18 мая 2026» using `formatDateRu` for the start/end.
- [ ] 12B.5.2 Client component, navigates via `useRouter().push('/ops/report?week=…')`.

## 12B.6 Sub-phase: revenue summary card

- [ ] 12B.6.1 `RevenueSummaryCard.tsx` — title «Доход за неделю», large total ₽ number, then three breakdown rows: «Аренда», «Сессии», «Турниры (расчётно)».
- [ ] 12B.6.2 The «Турниры (расчётно)» row has a small `(i)` icon with a `title=` tooltip: «Сумма entry_fee × число регистраций для турниров с датой начала в этой неделе. Не учитывает фактическую оплату.»

## 12B.7 Sub-phase: revenue target card (with inline edit)

- [ ] 12B.7.1 `RevenueTargetCard.tsx` — client component. Renders horizontal progress bar (CSS bar 8 px tall) colored by threshold:
  - `< 50 %` → `--color-danger`
  - `50 % – 90 %` → `--color-warning`
  - `≥ 90 %` → `--color-success`
- [ ] 12B.7.2 Label: «Цель: ₽200 000 · Факт: ₽184 250 · 92 %». Small pencil button on the right opens an inline number input + Save/Cancel buttons.
- [ ] 12B.7.3 `app/ops/report/update-target-action.ts` — `'use server'`, validates positive integer, calls `updateWeeklyRevenueTarget`, `revalidatePath('/ops/report')`.

## 12B.8 Sub-phase: court utilization card

- [ ] 12B.8.1 `CourtUtilizationCard.tsx` — title «Загрузка кортов», one row per active court: «Корт 1» label, percentage bar (filled `pct%`, accent color), and right-aligned «48 ч / 112 ч · 43 %».
- [ ] 12B.8.2 Rows sorted by court number asc.

## 12B.9 Sub-phase: coach payouts table

- [ ] 12B.9.1 `CoachPayoutsTable.tsx` — compact 44 px-row table. Columns: coach (with color dot), sessions, gross revenue ₽, payout ₽.
- [ ] 12B.9.2 Sorted by payout desc. Coaches with zero sessions this week are excluded.
- [ ] 12B.9.3 Server-rendered (no interactivity beyond the table).

## 12B.10 Sub-phase: top programs card

- [ ] 12B.10.1 `TopProgramsCard.tsx` — title «Топ программ», top 5 rows: small program-type color dot (from `programTypeColor(type).block`) + program name + small «12 сессий» count + right-aligned revenue ₽.
- [ ] 12B.10.2 Sorted by revenue desc. Empty state: «Нет данных за эту неделю.»

## 12B.11 Sub-phase: sessions breakdown by day

- [ ] 12B.11.1 `SessionsBreakdownByDay.tsx` — title «Все сессии». For each day with sessions, render:
  - Date header «Понедельник, 11 мая» (use `formatDateRu` + weekday name)
  - Compact 44 px-row table: time («10:30–12:00»), program (with color dot + name + ОПС/program-type if applicable), coaches (comma-joined names), courts («№1, №3»), attendees, revenue ₽
- [ ] 12B.11.2 Days with no sessions are skipped entirely (no empty headers).

## 12B.12 Sub-phase: verify, polish, commit

- [ ] 12B.12.1 `npm run build` clean (Turbopack).
- [ ] 12B.12.2 `npm run lint` exits 0.
- [ ] 12B.12.3 Browser sweep on `/ops/report`:
  - Default load shows current week with correct title
  - ◀ ▶ navigate to ±1 week with URL updating
  - «Эта неделя» jumps back to current week
  - Target inline edit works (open input, change to 250000, save → bar recomputes pct)
  - Coach payouts table shows expected coaches with non-zero sessions
  - Sessions breakdown groups correctly by day, skips empty days
- [ ] 12B.12.4 No file over 600 lines. Confirm with `wc -l app/ops/report/*.tsx lib/queries/report.ts lib/queries/settings.ts`.
- [ ] 12B.12.5 Single commit: `Phase 12B: weekly report at /ops/report`. Push to `origin/main`.

---

## Out of scope for Phase 12B

- No per-court drill-down page.
- No export to CSV / PDF.
- No week-over-week comparisons.
- No operator-configurable peak window (still uses `PEAK_START_HOUR` / `PEAK_END_HOUR` constants).
- No edits to underlying session/payment data from the report — read-only except for the target.
- No new event source on the calendar from report data — already covered in Phase 12A.

## Files touched (expected)

- `supabase/schema.sql` — append `app_settings` table
- `lib/types.ts` — `AppSettings` interface
- `lib/ops-constants.ts` — fallback constant
- `lib/queries/settings.ts` — **new**
- `lib/queries/report.ts` — **new** (~250 lines, the heavy fold)
- `app/ops/report/page.tsx` — rewrite (~60 lines)
- `app/ops/report/ReportWeekHeader.tsx` — **new**
- `app/ops/report/RevenueSummaryCard.tsx` — **new**
- `app/ops/report/RevenueTargetCard.tsx` — **new** (client)
- `app/ops/report/CourtUtilizationCard.tsx` — **new**
- `app/ops/report/CoachPayoutsTable.tsx` — **new**
- `app/ops/report/TopProgramsCard.tsx` — **new**
- `app/ops/report/SessionsBreakdownByDay.tsx` — **new**
- `app/ops/report/update-target-action.ts` — **new**

Total surface: ~12 files (10 new + 1 rewrite + 3 small edits), 0 deletions, expected ~1100 lines net change.

---

# Phase 13 — English language support (RU/EN)

Goal: every piece of UI chrome — labels, buttons, headings, status badges, empty states, validation messages, public TV display — can render in English. Operators flip a toggle in the sidebar; the choice persists across sessions and across server/client renders. URLs do not change. Database content (player names, program names, tournament names, notes, etc.) is never translated.

Workflow: write plan (this section) → confirm with user → build section-by-section (each section runs `npm run build` + `npm run lint` clean before the next) → final browser sweep across RU and EN → single commit.

## 13.0 Open decisions (resolve with user before code)

- [ ] 13.0.1 **Toggle placement.** Sidebar, between Logo and the first nav section. Two equal-width pills (40 px wide each) joined as a segmented control: `RU` on the left, `EN` on the right. Active pill = `bg-subtle text-black font-semibold` + 3 px left bar in accent; inactive = `text-muted hover:text-black`. Same control appears in `MobileNav` header.
- [ ] 13.0.2 **Two locales only, no regional variants.** `lang = 'ru' | 'en'`. No `en-US`/`en-GB` split; no `ru-RU` namespacing. Default = `'ru'`.
- [ ] 13.0.3 **Cookie name + lifetime.** `kosmo_lang`, `maxAge = 60 * 60 * 24 * 365` (1 year), `path = "/"`, `sameSite = "lax"`, not `httpOnly` (client must read it for hydration parity), not `secure` (dev runs over http).
- [ ] 13.0.4 **No URL prefix.** App router stays flat — no `app/[lang]/…` restructure. The language is read from the cookie on every request. (User explicitly stated URLs stay the same.)
- [ ] 13.0.5 **Display page (`/display`) follows the cookie**, same as every other page. (Stadium TVs will set the cookie once via a one-off visit; no separate switch on the display itself.)
- [ ] 13.0.6 **`<html lang>` follows the active language** — set in the root layout from the cookie.
- [ ] 13.0.7 **Server actions still return Russian error strings for now** — server actions don't run inside the React tree, so they can't read the context. They CAN read the cookie. Sub-phase 13.18 covers wiring `getServerLang()` into every action that throws/returns user-facing copy; until then translated chrome co-exists with RU-only validation errors. Acceptable for the section-by-section rollout; the final sweep closes this gap.
- [ ] 13.0.8 **No machine translation in source** — every EN string is hand-written. Quality bar: short, idiomatic, padel/tennis-club-appropriate (e.g. «АМЕРИКАНО» → `AMERICANO`, «АРЕНДА» → `RENTAL`, «Сессии» → `Sessions`, «Игроки» → `Players`).

## 13.1 Sub-phase: i18n foundation

Pure infrastructure — no UI calls yet. After this section, `t('btn.save')` returns the right string in both locales but no component uses it.

- [ ] 13.1.1 Create `lib/i18n/types.ts`:
  ```ts
  export type Lang = 'ru' | 'en';
  export const LANGS: readonly Lang[] = ['ru', 'en'] as const;
  export const DEFAULT_LANG: Lang = 'ru';
  export const LANG_COOKIE = 'kosmo_lang';
  export function isLang(v: string | undefined | null): v is Lang {
    return v === 'ru' || v === 'en';
  }
  ```
- [ ] 13.1.2 Create `lib/i18n/ru.ts` — empty object skeleton `export const ru = { } as const;`. We populate it section by section in 13.3–13.17.
- [ ] 13.1.3 Create `lib/i18n/en.ts` — `import type { Dictionary } from './ru'; export const en: Dictionary = { } as const;`. Empty for now.
- [ ] 13.1.4 Create `lib/i18n/index.ts`:
  - `export type TranslationKey = keyof typeof ru;`
  - `export type Dictionary = Record<TranslationKey, string>;`
  - `export const DICTS: Record<Lang, Dictionary> = { ru, en };`
  - `export function translate(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>): string` — looks up the dict, falls back to `ru[key]` if missing in `en`, then to the literal key if both miss. Substitutes `{name}`-style placeholders from `vars`.
  - `export function tPlural(lang: Lang, count: number, keys: { one: TranslationKey; few?: TranslationKey; many: TranslationKey }): string` — RU rule (mod-10/mod-100) for `lang === 'ru'`; English `count === 1 ? one : many` for `lang === 'en'`.
- [ ] 13.1.5 Create `lib/i18n/server.ts`:
  - `import 'server-only';`
  - `export async function getServerLang(): Promise<Lang>` — reads `kosmo_lang` cookie via `cookies()` from `next/headers`, returns the parsed value or `DEFAULT_LANG`.
  - `export async function getServerDict(): Promise<Dictionary>` — `DICTS[await getServerLang()]`.
  - `export async function st(key: TranslationKey, vars?: …): Promise<string>` — convenience for one-off server lookups.
- [ ] 13.1.6 Create `lib/i18n/format.ts` — pure functions, no React. All RU output preserves current behavior (matches `lib/format-date.ts` + thin-space ₽). EN output uses comma grouping and `MMM D, YYYY` style.
  - `formatDate(iso: string, lang: Lang): string` — `'12 мая 2026'` vs `'May 12, 2026'`.
  - `formatDateShort(iso: string, lang: Lang): string` — `'12.05'` vs `'May 12'`.
  - `formatTime(hhmm: string, lang: Lang): string` — both `'14:30'`; reserved for future am/pm if requested.
  - `formatWeekday(iso: string, lang: Lang, opts?: { short?: boolean }): string` — Понедельник / Monday; Пн / Mon.
  - `formatMonth(year: number, monthIdx: number, lang: Lang): string` — «Май 2026» / «May 2026».
  - `formatRub(rub: number, lang: Lang, opts?: { signed?: boolean }): string` — `'₽1 200 000'` (RU, U+202F narrow no-break space) vs `'₽1,200,000'` (EN). Sign rules preserved.
  - `formatNumber(n: number, lang: Lang): string` — thin-space vs comma grouping.
  - Each function accepts `Lang` explicitly; no global state.
- [ ] 13.1.7 Create `components/i18n/LanguageProvider.tsx` (client):
  - Context value `{ lang: Lang; setLang: (l: Lang) => void; t: (k: TranslationKey, vars?) => string; tPlural: (count, keys) => string; }`.
  - Props: `initialLang: Lang` (provided by root layout from the cookie).
  - On `setLang(l)`: optimistically update state, write cookie via `document.cookie = …` (1-year expiry, path=/, samesite=lax), call the `setLangAction(l)` server action to keep the cookie source-of-truth aligned for the next server render, then `router.refresh()` to re-render server components in the new language without a full reload.
- [ ] 13.1.8 Create `components/i18n/useTranslation.ts` (client) — thin hook re-exporting context fields: `const { t, tPlural, lang, setLang } = useContext(LanguageContext)`.
- [ ] 13.1.9 Create `app/(actions)/set-lang-action.ts` (or `lib/actions/set-lang.ts` — match existing convention): `'use server'`, accepts `lang: Lang`, validates with `isLang`, writes the cookie with the options from 13.0.3, calls `revalidatePath('/', 'layout')` to refresh every server-rendered tree.
- [ ] 13.1.10 Wire `app/layout.tsx`: read `lang` server-side, set `<html lang={lang}>`, wrap children in `<LanguageProvider initialLang={lang}>`. This is the only place the provider is mounted.
- [ ] 13.1.11 Section gate: `npm run build` + `npm run lint` clean. No visible UI change yet.

## 13.2 Sub-phase: language toggle in sidebar and mobile nav

After this section, the user can flip RU↔EN. Nothing else changes — the entire UI is still hardcoded Russian — but the toggle is reachable and persists.

- [ ] 13.2.1 Create `components/site/LanguageToggle.tsx` (client): segmented pill control. Uses `useTranslation()` for `lang` + `setLang`. Renders `RU` / `EN` as two buttons; active = `bg-subtle text-black font-semibold` with a 2 px accent left bar (visible only on the active pill). `aria-pressed` on each button.
- [ ] 13.2.2 Insert `<LanguageToggle />` in `components/site/PageShell.tsx` between `<Logo />` and `<SidebarNav />` with `px-3 pt-1 pb-2` so it sits under the logo with comfortable air.
- [ ] 13.2.3 Insert `<LanguageToggle />` in `components/site/MobileNav.tsx` inside the drawer header, right after the logo.
- [ ] 13.2.4 Manual verification: open `/`, click `EN`, page refreshes — `<html lang>` is now `en`, cookie is set, navigation labels still read in Russian (expected — translations land in 13.3+). Click `RU` again, returns to `ru`. Hard reload preserves selection.
- [ ] 13.2.5 Section gate: `npm run build` + `npm run lint` clean.

## 13.3 Sub-phase: navigation and shell

The first user-visible translation: sidebar section headers + nav link labels + mobile menu chrome + page-shell-level strings (e.g. «Меню», «Закрыть»). Locale files start filling up here.

- [ ] 13.3.1 Add keys to `lib/i18n/ru.ts` (and matching English to `lib/i18n/en.ts`). All keys are flat, dot-namespaced strings; pluralize via `tPlural`:
  - `nav.section.courts` КОРТЫ / COURTS
  - `nav.section.tournaments` ТУРНИРЫ / TOURNAMENTS
  - `nav.section.staff` ПЕРСОНАЛ / STAFF
  - `nav.section.programs` ПРОГРАММЫ / PROGRAMS
  - `nav.section.system` СИСТЕМА / SYSTEM
  - `nav.schedule` Расписание / Schedule
  - `nav.rentals` Аренда / Rental
  - `nav.calendar` Календарь / Calendar
  - `nav.courts` Корты / Courts
  - `nav.report` Отчёт / Report
  - `nav.tournaments_and_leagues` Турниры и лиги / Tournaments & leagues
  - `nav.players` Игроки / Players
  - `nav.analytics` Аналитика / Analytics
  - `nav.coaches` Тренеры / Coaches
  - `nav.organizers` Организаторы / Organizers
  - `nav.programs` Программы / Programs
  - `nav.display` Дисплей / Display
  - `nav.open_menu` Меню / Menu
  - `nav.close_menu` Закрыть / Close
- [ ] 13.3.2 Refactor `components/site/navLinks.ts`: change `label: string` to `labelKey: TranslationKey`. Update `NAV_SECTIONS` to use the keys above.
- [ ] 13.3.3 Refactor `components/site/SidebarNav.tsx`: read translations via `useTranslation()`, render `t(section.titleKey)` and `t(link.labelKey)`.
- [ ] 13.3.4 Refactor `components/site/MobileNav.tsx`: same — section headers, link labels, drawer chrome.
- [ ] 13.3.5 `components/site/Logo.tsx` — if it carries any Cyrillic text, route through `t()`. (Likely just the brand mark; brand names stay as-is per 13.0.8.)
- [ ] 13.3.6 Verify in browser: switch to EN, every nav label updates without a hard reload (server components re-render after `router.refresh()`).
- [ ] 13.3.7 Section gate: build + lint clean.

## 13.4 Sub-phase: home + tournament browse

Covers `/` and the tournament list/card chrome.

- [ ] 13.4.1 Inventory Russian text in `app/page.tsx`, `components/tournament/TournamentCard.tsx`, `app/delete-tournament-list-action.ts`. Expected keys (~25):
  - `home.title`, `home.empty`, `home.new_tournament_cta`
  - `tournament.status.draft` / `.registration_open` / `.in_progress` / `.completed` / `.cancelled`
  - `tournament.format.americano` / `.team_americano` / `.mexicano` / `.team_mexicano` / `.round_robin` / `.escalera` / `.king_of_court`
  - `tournament.format.soon_suffix` (the «скоро» annotation)
  - `tournament.type.one_day`, `tournament.type.league`
  - `tournament.players_count` with vars `{count}/{max}`
  - `tournament.fee` («Взнос» label) — used in card
  - `tournament.date_short` (used in card; routed through `formatDateShort`)
  - `tournament.no_date` («Без даты»)
- [ ] 13.4.2 Replace all hardcoded RU strings in these files with `t(…)` calls. For status/format badges, look up the key via a deterministic helper (`statusLabelKey(s)`, `formatLabelKey(f)`).
- [ ] 13.4.3 Browser sweep: `/` in RU, then EN — every card chip, header, button, empty state translates.
- [ ] 13.4.4 Section gate: build + lint clean.

## 13.5 Sub-phase: players page

`/players` + supporting forms / actions surface.

- [ ] 13.5.1 Inventory `app/players/page.tsx`, `app/players/PlayersPanel.tsx`, `app/players/PlayerFields.tsx`, `app/players/parse-player-form.ts`, `app/players/create-player-action.ts`. Plus level-display helpers if they live under `lib/`. Expected keys (~40):
  - `players.title`, `players.empty`, `players.search_placeholder`, `players.add_cta`, `players.count` (plural)
  - `players.field.name`, `.phone`, `.level`, `.elo`, `.notes`
  - `players.validation.name_required`, `.phone_invalid`, `.duplicate`
  - `level.label.<code>` for every padel level (extract from `lib/constants.ts`)
  - column headers for the players table
- [ ] 13.5.2 Replace hardcoded strings. Server actions: temporarily still return RU error strings (see 13.0.7) — track for 13.18.
- [ ] 13.5.3 Browser: switch languages on `/players`; add a player; verify level select / table / form all translate.
- [ ] 13.5.4 Section gate: build + lint clean.

## 13.6 Sub-phase: calendar

`/calendar` views + popovers + mini calendar.

- [ ] 13.6.1 Inventory `app/calendar/page.tsx`, `CalendarHeader.tsx`, `DayView.tsx`, `WeekView.tsx`, `MonthView.tsx`, `EventBlock.tsx`, `EventPopover.tsx`, `view.ts`, `lib/calendar-events.ts`, `components/site/MiniCalendar.tsx`, `components/site/SidebarMiniCalendar.tsx`. Expected keys (~30):
  - `calendar.title`, `calendar.view.day`, `.week`, `.month`, `.today_cta`, `.empty_week`
  - `event.kind.tournament`, `.league_session`, `.rental`, `.schedule_session`
  - `event.action.open_contract`, `.open_in_schedule`, `.open_tournament`, `.open_session`
  - `event.no_court`, `.no_program`, `.no_time`, `.no_coach`
  - Weekday short labels (Пн/Mon …) — routed through `formatWeekday(date, lang, { short: true })`.
- [ ] 13.6.2 Replace strings. Use `formatDate`, `formatWeekday`, `formatMonth` from `lib/i18n/format.ts` everywhere a date is rendered.
- [ ] 13.6.3 Browser: switch languages on `/calendar` (day/week/month). Popovers, KIND_LABEL chips, the «Сегодня» button, weekday headers all translate.
- [ ] 13.6.4 Section gate: build + lint clean.

## 13.7 Sub-phase: ops/coaches

- [ ] 13.7.1 Inventory `app/ops/coaches/page.tsx`, `CoachesPanel.tsx`, `CoachesSummary.tsx`, `CoachCard.tsx`, `CoachForm.tsx`, `coach-input.ts`, all action files, `app/ops/coaches/[id]/*`. Expected keys (~35):
  - `coaches.title`, `coaches.empty`, `coaches.add_cta`, `coaches.summary.total`, `.active`
  - `coaches.field.name`, `.color`, `.commission`, `.notes`, `.active`
  - `coaches.validation.name_required`, `.commission_invalid`
  - `coaches.stats.sessions`, `.revenue`, `.payout`, `.last_session`
- [ ] 13.7.2 Replace strings. Browser-verify list, detail page, create + edit forms.
- [ ] 13.7.3 Section gate: build + lint clean.

## 13.8 Sub-phase: ops/programs

- [ ] 13.8.1 Inventory `app/ops/programs/page.tsx`, all program*.tsx files, `seed-programs-action.ts`. Expected keys (~50):
  - `programs.title`, `programs.toolbar.search_placeholder`, `programs.group.<type>`
  - `programs.field.name`, `.price`, `.duration`, `.capacity`, `.coach_count`, `.type`
  - `programs.type.<value>` for every program type
  - `programs.seed.title`, `programs.seed.cta`, `programs.seed.success_count` (plural), `programs.seed.skipped` (plural)
  - `programs.empty.library`, `programs.empty.group`
- [ ] 13.8.2 Replace strings; route the table's program-type chip through the type key map.
- [ ] 13.8.3 Section gate: build + lint clean.

## 13.9 Sub-phase: ops/schedule

The largest single surface. Plan for ~80 keys.

- [ ] 13.9.1 Inventory every file under `app/ops/schedule/`. Common patterns:
  - Day/week toggles, view switchers, date nav
  - Session block content (program name + coach + time + court)
  - Session popover (everything: edit, attendees, coach assignment, payment status)
  - Program picker inline panel
  - Rental block + rental info popover
  - Validation strings in `schedule-input.ts`
- [ ] 13.9.2 Add keys + replace strings.
- [ ] 13.9.3 Section gate: build + lint clean.

## 13.10 Sub-phase: ops/rentals

- [ ] 13.10.1 Inventory `app/ops/rentals/page.tsx`, `RentalsPanel.tsx`, `RentalsSummary.tsx`, `app/ops/rentals/new/*`, `app/ops/rentals/[id]/*`. Expected keys (~50):
  - Contract list/empty/filter chrome
  - Status badges (active, draft, ended, cancelled)
  - New-contract wizard (client/court/dates/recurrence/price)
  - Validation strings from inputs
  - Payment history, refunds, instance overrides
- [ ] 13.10.2 Replace strings.
- [ ] 13.10.3 Section gate: build + lint clean.

## 13.11 Sub-phase: ops/organizers

- [ ] 13.11.1 Inventory `app/ops/organizers/*`. Smaller surface (~20 keys).
- [ ] 13.11.2 Replace strings.
- [ ] 13.11.3 Section gate: build + lint clean.

## 13.12 Sub-phase: ops/report

Already-rich Phase 12B page. Expected keys (~40).

- [ ] 13.12.1 Inventory `app/ops/report/page.tsx`, `ReportWeekHeader.tsx`, `RevenueSummaryCard.tsx`, `CourtUtilizationCard.tsx`, `CoachPayoutsTable.tsx`, `TopProgramsCard.tsx`, `SessionsBreakdownByDay.tsx`, `format.ts`.
- [ ] 13.12.2 Keys:
  - `report.this_week_cta`
  - `report.revenue.title`, `.rentals`, `.sessions`, `.tournaments_estimated`, `.tournaments_estimated_tooltip`
  - `report.utilization.title`, `.unit_hours`
  - `report.payouts.title`, `.empty`, columns
  - `report.top_programs.title`, `.empty`
  - `report.sessions.title`, `.empty`
  - `report.sessions.col.time`, `.program`, `.coaches`, `.courts`, `.attendees`, `.revenue`
  - Plural «N сессий / N sessions» via `tPlural`.
- [ ] 13.12.3 Replace `formatDateRu` calls with `formatDate(iso, lang)`; the existing `formatRub` helper in `app/ops/report/format.ts` gains a `lang` parameter and forwards to `lib/i18n/format.ts`.
- [ ] 13.12.4 Weekday labels in `SessionsBreakdownByDay` use `formatWeekday(iso, lang)`.
- [ ] 13.12.5 Section gate: build + lint clean.

## 13.13 Sub-phase: courts and analytics

- [ ] 13.13.1 Inventory `app/courts/*` and `app/analytics/*`. Translate chrome, headings, axis labels, empty states.
- [ ] 13.13.2 Replace strings.
- [ ] 13.13.3 Section gate: build + lint clean.

## 13.14 Sub-phase: tournament detail and sub-routes

`app/tournament/[id]/*` — the heaviest user-facing surface aside from schedule. Plan for ~120 keys.

- [ ] 13.14.1 Inventory tournament detail (`page.tsx`, `AddPlayerPanel`, `AddPairPanel`, `DivisionsPanel`, `EditTournamentPanel`, `LeagueSettingsPanel`, `RegistrationRow`, `SessionsList`, `OpenRegistrationButton`, `StartTournamentButton`, `DangerZone`, `DivisionForm`) + sub-routes (`play`, `finals`, `division`, `results`, `season`, `session`).
- [ ] 13.14.2 Keys cover: action button labels, state-machine transitions, validation messages, scoring chrome («В сетке не может быть ничьей», «Введите счёт», bye/forfeit labels), leaderboard headers, finals bracket labels («В финал», «Полуфинал», «Финал»), division/court conflict warnings.
- [ ] 13.14.3 Replace strings.
- [ ] 13.14.4 Section gate: build + lint clean.

## 13.15 Sub-phase: league pages

- [ ] 13.15.1 Inventory `app/league/*`. Smaller surface (~25 keys).
- [ ] 13.15.2 Replace strings.
- [ ] 13.15.3 Section gate: build + lint clean.

## 13.16 Sub-phase: display (`/display`)

Public TV view. Expected keys (~25).

- [ ] 13.16.1 Inventory `app/display/*`. Headlines, status chips, rotation hints, fallback / empty states.
- [ ] 13.16.2 Replace strings.
- [ ] 13.16.3 Verify in a browser on a wide viewport, switch languages via the sidebar, return to `/display` — the display reads the cookie and renders accordingly.
- [ ] 13.16.4 Section gate: build + lint clean.

## 13.17 Sub-phase: shared UI primitives + leftover edge cases

Anything not yet swept: ui components in `components/ui/*`, modal-free inline forms, breadcrumb chips, last-edit timestamps, etc.

- [ ] 13.17.1 Grep the repo for unswept Cyrillic: `find app components -name "*.tsx" -o -name "*.ts" | xargs grep -l -E '[А-ЯЁа-яё]'`. Expected: only `lib/i18n/ru.ts` and `lib/constants.ts` (level codes — those are stored as data; the labels go through `level.label.*` keys).
- [ ] 13.17.2 Address each surviving file.
- [ ] 13.17.3 Section gate: build + lint clean.

## 13.18 Sub-phase: server-action error messages

Closes the gap from 13.0.7. Server actions can read the cookie via `getServerLang()`.

- [ ] 13.18.1 Audit every `*-action.ts` file that returns or throws a user-visible string. Common error keys to add: `error.validation.required`, `.too_long`, `.invalid_format`, `.duplicate`, `.not_found`, `.conflict`, `.internal`, `error.generic`.
- [ ] 13.18.2 In each action, replace literal `"…"` strings with `(await getServerDict())['error.…']`. Keep technical/internal log strings as-is (English console.error messages don't need to change).
- [ ] 13.18.3 Validation libraries (e.g. zod refinements in `*-input.ts`): if a refinement returns a message string, change it to a key + resolve at call site. Alternative: refinements return a key and the calling action translates — pick whichever is cleaner per file.
- [ ] 13.18.4 Browser-verify by triggering at least 3 representative validation errors in EN.
- [ ] 13.18.5 Section gate: build + lint clean.

## 13.19 Sub-phase: final sweep, polish, commit

- [ ] 13.19.1 `npm run build` clean (Turbopack), no missing-key console warnings.
- [ ] 13.19.2 `npm run lint` exits 0.
- [ ] 13.19.3 Final grep: zero Cyrillic in any file under `app/` or `components/` except `lib/i18n/ru.ts` (the canonical RU dict). One residual `lib/format-date.ts` is acceptable only if it has been fully deprecated and re-exported from `lib/i18n/format.ts` — otherwise delete it.
- [ ] 13.19.4 Verify locale parity: a small script (one-liner in `package.json` or inline in CI later, not committed) — `node -e "const ru=require('./lib/i18n/ru');const en=require('./lib/i18n/en');const m=Object.keys(ru).filter(k=>!(k in en));if(m.length){console.error('MISSING EN:',m);process.exit(1)}"` — must exit 0. Run manually before committing.
- [ ] 13.19.5 Browser sweep — RU first, then EN — across every route from Phase 11.5.3 plus `/display`. For each: confirm zero Cyrillic remains visible in EN; numbers, dates, weekdays match locale; status badges and validation errors translate.
- [ ] 13.19.6 No file exceeds 600 lines. `lib/i18n/ru.ts` and `lib/i18n/en.ts` are checked specifically — if either approaches 600 lines, split by namespace (`lib/i18n/ru/nav.ts`, `lib/i18n/ru/tournament.ts`, etc.) and re-export from a barrel.
- [ ] 13.19.7 Single commit: `Phase 13: English language support (RU/EN)` with HEREDOC body listing the toggle, the i18n infra, the section-by-section migration, server-action error coverage. Push to `origin/main`.

---

## Out of scope for Phase 13

- No URL prefixes (`/en/...`) — language is cookie-only.
- No new languages beyond RU/EN; no infrastructure for adding a third locale (e.g. JSON-based dicts, ICU MessageFormat, plural-category tables for other languages). The current `tPlural` understands RU and EN rules only — that's acceptable for v1.
- No translation of user-entered content (player/program/tournament names, notes, free-text fields). These are always rendered as stored.
- No `Accept-Language` sniffing — the user must explicitly choose. (Default = `'ru'` matches the operator-language assumption.)
- No editor/CMS UI for the dictionaries; they are checked-in TypeScript constants.
- No analytics, no telemetry, no rollout flag — Phase 13 ships in one piece.
- No DB column for per-user language preference. (User mentioned «future»; deferred.)
- No translation of toast/snackbar libraries' fallback strings; we don't use a toast library that ships English-only chrome (verify during 13.19.3).

## Files touched (expected)

New:
- `lib/i18n/types.ts`
- `lib/i18n/ru.ts`
- `lib/i18n/en.ts`
- `lib/i18n/index.ts`
- `lib/i18n/server.ts`
- `lib/i18n/format.ts`
- `components/i18n/LanguageProvider.tsx`
- `components/i18n/useTranslation.ts`
- `components/site/LanguageToggle.tsx`
- `app/(actions)/set-lang-action.ts` (or `lib/actions/set-lang.ts`)

Modified (every file with chrome text — ~200 files across `app/**` and `components/**`):
- Root: `app/layout.tsx`
- Site shell: `components/site/PageShell.tsx`, `MobileNav.tsx`, `SidebarNav.tsx`, `navLinks.ts`, `Logo.tsx`, `MiniCalendar.tsx`, `SidebarMiniCalendar.tsx`
- Routes: every `app/**/*.tsx` and `app/**/*-action.ts` containing Cyrillic
- Library helpers: `lib/format-date.ts` (deprecate → re-export from `lib/i18n/format.ts`), validation modules

Deletions: ideally `lib/format-date.ts` (folded into `lib/i18n/format.ts`); confirm during 13.19.3.

Total surface: ~210 files modified + 10 new, ~600–800 translation keys, expected ~2000–3000 lines net change. Largest single phase to date; the section-by-section gate is the safety mechanism.

---
