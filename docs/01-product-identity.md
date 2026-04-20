# 01 — Product identity

## What Kosmo Tournaments is

Kosmo Tournaments is a **tournament and league management system for padel clubs**, starting with Kosmo Padel (5 courts, Moscow).

Operators create tournaments, register players, generate match schedules, and run live events from a phone or tablet on-court. Players see their schedule, follow live scores, and track how their ELO rating and season standing change over time.

Core capabilities:

- **Formats:** Americano (individual points), team Americano, Mexicano (standings-driven pairings), team Mexicano, round robin, escalera.
- **Event shapes:** one-day tournaments and multi-session league seasons with cumulative points and a finals qualification.
- **Rating:** ELO-based, scaled by tournament size, with level bands matching the `padel.ru` standard (D, D+, C-, C, C+, B-, B, B+, A, OPEN).
- **Live play:** round-by-round score entry on mobile, with a live leaderboard that updates for everyone watching via Supabase Realtime.

## The problem it solves

Small padel clubs currently run tournaments with paper brackets, spreadsheets, and group chats. This means:

- Draws and schedules are manually computed and error-prone.
- Results are re-typed multiple times (on-court sheet → ops spreadsheet → club chat).
- Players don't see a live leaderboard; they ask the director.
- No cross-tournament rating or season context — every event restarts from zero.

Kosmo Tournaments replaces all of that with one system: the director enters scores once on a tablet, and everything else (leaderboard, ELO updates, season standings, shareable results link) follows automatically.

## What makes it different

- **Mobile-first, on-court UX.** The live-play screen is built for a tournament director holding a phone between matches, not for a desktop admin panel.
- **Russian-language, Moscow-padel conventions.** UI text, level names (C+, B-), and the default point tables are what Russian padel players already use — no translation layer.
- **One system for tournaments, leagues, and ratings.** Points flow from match → round → session → tournament → season → ELO without re-entry.
- **Multi-club ready without being a multi-club product yet.** Players are a global table; clubs will be added as a top-level scope when it's actually needed, not before.

## What it is NOT

- **Not a general booking or membership system.** Court reservation, membership dues, and class scheduling are out of scope. The app assumes a tournament is already on the club's calendar.
- **Not a social network.** There is no feed, no friending, no DMs. Players see tournaments, leaderboards, and their own rating.
- **Not a federation-grade rating system.** ELO here is a club-level rating for fair matchmaking, not an officially sanctioned ranking.
- **Not a payment processor.** Entry fees are displayed and tracked, but collection happens outside the app (cash, card terminal, bank transfer).
- **Not multi-tenant (yet).** Phase 1 is single-club. The schema is shaped so a `club_id` can be added later without restructuring, but there is no club switcher.
- **Not public-facing marketing.** The home page is the tournament dashboard, not a landing page.
