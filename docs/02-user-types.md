# 02 — User types

Four user types, each with a distinct workflow and a distinct set of screens. Phase 1 builds the Club Operator and Tournament Director flows end-to-end; Player and Spectator flows are scaffolded but deepen in later phases.

## Club Operator

**Who:** the person at the club responsible for programming — deciding which tournaments run, who's invited, which levels play, and what the entry fee is.

**Core tasks:**

- Create a tournament (format, dates, level range, court count, fee, prize description).
- Open registration; add players from the database or create new ones inline.
- Adjust player metadata (level, phone, ELO) when something needs correction.
- Close registration and hand the tournament off to the director when the event starts.
- After the tournament, review the results, share the leaderboard link, and confirm rating updates.

**Primary surfaces:** `/` (tournament list), `/tournament/new`, `/tournament/[id]` (detail + registration).

**Devices:** desktop and tablet, usually at the club.

## Tournament Director

**Who:** the person running the event live on the day — often the same human as the Club Operator, but in a different mode. On-court, walking between courts, holding a phone.

**Core tasks:**

- Start the tournament (triggers schedule generation).
- For each round: walk between courts, enter scores as matches finish, confirm, advance to the next round.
- Resolve edge cases: a player no-shows, a match score is mis-entered, a match needs to be redone.
- Finalize the tournament at the end (triggers ELO updates and the results page).

**Primary surface:** `/tournament/[id]/play`. This page is the most important screen in the app. It must work under real conditions — bright sun, sweaty hands, 4G, a phone balanced on a court divider.

**Devices:** phone (primary) and tablet (secondary). Never desktop.

**Design implications:** large tap targets on score inputs, unambiguous "commit" action, round-complete state crystal-clear, no modal dialogs that swallow the current context.

## Player

**Who:** the padel player participating in tournaments. Casual to competitive, levels D through A.

**Core tasks (Phase 1):**

- See what tournament they're registered in today and what court/opponent they're on in the current round.
- Watch the live leaderboard during the event.
- See their final standing, ELO change, and updated level after the tournament.

**Core tasks (Phase 2+):**

- See their personal history: tournaments played, matches won/lost, ELO over time.
- Browse upcoming tournaments at their level and request to register.
- Track a league season — cumulative points, position, qualification status.

**Primary surfaces:** `/tournament/[id]/play` (view-only mode — not yet implemented in Phase 1), `/players/[id]` (profile), `/tournament/[id]/results`.

**Devices:** phone almost exclusively.

## Spectator

**Who:** a friend, partner, club member, or scout watching the tournament without being registered themselves.

**Core tasks:**

- Open the tournament's live page (shared link) and watch the leaderboard in real time.
- Check who's leading, what the final results were, who's on which court.

**Primary surfaces:** `/tournament/[id]/play` (read-only), `/tournament/[id]/results`. The same URLs as Player and Director — the difference is they don't sign in (Phase 1: nobody signs in).

**Devices:** phone.

**Design implications:** the live-play and results pages must be shareable with no auth. The share button on the results page copies the current URL.

## Cross-cutting principles

- **Single-operator Phase 1.** No auth yet. Every surface is public. RLS is disabled and tracked as a Phase 3 item.
- **Mobile-first on the live surfaces.** Director and Spectator flows must feel native on a phone.
- **Russian-language everywhere.** Do not mix English into user-facing copy unless it's a padel term of art already used in Russian (e.g., "Americano").
