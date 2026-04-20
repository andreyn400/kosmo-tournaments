# 04 — Algorithms

All algorithms are pure functions in `lib/` with no side effects, fully typed, and unit-testable in isolation.

## Americano (pre-generated schedule)

### Inputs

- `playerIds: string[]` — the roster, length must be divisible by 4.

### Output

- `Round[]` — every round in the tournament. For N players there are **N − 1 rounds** at **N / 4 courts per round**. Every player plays every round; partners rotate so each player partners a different player in every round (standard Americano property).

### Algorithm

Standard fixed-player-0 rotation around a circle:

1. Number the players 0 through N − 1.
2. Fix player 0. The remaining N − 1 players sit around a circle.
3. For each round r = 0 ... N − 2:
   a. Rotate the non-fixed players clockwise by one position.
   b. Read off the circle in pairs: positions `0` and `1` form team 1 on court 1; positions `2` and `3` form team 2 on court 1; positions `4`, `5` form team 1 on court 2; and so on.
   c. Each court has 4 distinct players, and each player appears on exactly one court.
4. Emit N / 4 matches per round, labelled Court 1 ... Court N/4.

### Sanity checks (run in tests)

- With 8 players: 7 rounds × 2 courts = 14 matches.
- With 12 players: 11 rounds × 3 courts = 33 matches.
- No player appears twice in a single round.
- Each player plays in every round.

### Why pre-generate

Americano pairings only depend on the roster, not on scores. Generating the whole schedule at tournament start lets the UI show future matches, lets spectators plan, and removes a whole category of "what does the algorithm do if scores are missing" edge cases.

## Round Robin (pre-generated schedule, Phase 2A)

### Inputs

- `playerIds: string[]` — roster, length must be a positive multiple of 4 (N % 4 === 0).

### Output

- `ScheduledRound[]` — every round in the tournament. For N players there are **P − 1 rounds × P / 2 matches per round** where **P = N / 2** is the number of pairs. Total matches = C(P, 2).

### Pair formation

Players are grouped into pairs in input order: pair `i = [players[2i], players[2i+1]]` for `i = 0 … P − 1`. The caller controls ordering (e.g. registration order), so if balanced pairings are desired the caller can pre-sort. Phase 2A intentionally does not auto-balance — the director has the context.

### Schedule (classical circle method on pairs)

1. Label pairs `0 … P − 1`. Since N is a multiple of 4, P is even.
2. Fix pair 0. Treat the remaining `P − 1` pairs as a rotating ring.
3. For each round `r = 0 … P − 2`:
   a. Read the circle as `[pair 0, rotating[0], rotating[1], …, rotating[P − 2]]`.
   b. Emit `P / 2` matches: `(circle[0] vs circle[P − 1])`, `(circle[1] vs circle[P − 2])`, … `(circle[P/2 − 1] vs circle[P/2])`.
   c. Rotate the non-fixed ring: last element moves to the front.
4. Every pair meets every other pair exactly once (`C(P, 2)` total matches).

### Sanity checks

- N = 8 (P = 4): 3 rounds × 2 matches = 6 = C(4, 2) ✓
- N = 12 (P = 6): 5 rounds × 3 matches = 15 = C(6, 2) ✓
- N = 16 (P = 8): 7 rounds × 4 matches = 28 = C(8, 2) ✓

### Ranking

Round Robin uses a different sort than Americano: **wins desc → point differential desc → matches played desc → name asc**. A "win" is a completed match where the player's team out-scored the opposing team. Draws don't count as wins but still contribute to +/−. ELO finalization is unchanged (same per-match team-average formula).

## Mexicano (dynamic per-round generation, Phase 2B)

### Inputs and outputs

- `generateMexicanoRound(orderedPlayerIds: string[], roundNumber: number): ScheduledRound` — one round only.
- Caller chooses the ordering:
  - Round 1: the roster in registration order (the "seeded" first round).
  - Round R > 1: roster sorted by the live leaderboard (points desc → +/− desc → matches desc → name asc).

### Pairing rule (classical individual Mexicano)

For each quartet `[k, k+1, k+2, k+3]` in the ordered list, emit a match:

```
team1 = [p[k],   p[k+3]]   // top + bottom of the quartet
team2 = [p[k+1], p[k+2]]   // the two middles
```

So rank 1 partners rank 4 against rank 2 + rank 3 on the top court; rank 5 + rank 8 vs rank 6 + rank 7 on the next; and so on. This is the classical Mexicano pairing — pairing top with bottom within each quartet mechanically prevents adjacent-ranked players from partnering in consecutive rounds. Partners visibly rotate even when the leaderboard clusters teammates together (which always happens after a shared match, since teammates accrue identical points and +/−).

### Why not strength-matched (k, k+1) vs (k+2, k+3)

A strength-matched quartet rule packs the top two ranks onto the same team. After one round together those two players share identical points and +/−, so the leaderboard tiebreak keeps them in consecutive positions and the quartet rule re-pairs them in the next round. Over a short tournament, partners appear frozen — effectively turning individual Mexicano into a fixed-pair format by accident. Classical (top + bottom) pairing avoids this entirely.

### Number of rounds

Fixed at tournament start: `totalRounds = N / 2`. So:

- N = 8 → 4 rounds, 2 matches per round, 8 matches total.
- N = 12 → 6 rounds, 3 matches per round, 18 matches total.
- N = 16 → 8 rounds, 4 matches per round, 32 matches total.

(For reference, Americano uses `N − 1` rounds in our implementation; Round Robin uses `N/2 − 1`. Mexicano is intentionally shorter than Americano — each player plays fewer matches but pairings dynamically track standings.)

### When each round is materialized

- Round 1 is created in the DB at tournament start by `startTournament`.
- Rounds 2 … N/2 are created one at a time by `advanceRoundAction` when the director clicks "Следующий раунд →". The action:
  1. Verifies all matches of the current round are `completed`.
  2. Marks the current round `completed`.
  3. Looks up the tournament registration count to compute `totalRounds`.
  4. If `nextRoundNumber ≤ totalRounds`, recomputes the live leaderboard from all completed matches so far, derives the ordered player list, calls `generateMexicanoRound`, inserts the new round + its matches, and marks the new round `in_progress`.
  5. Otherwise marks the session `completed` (awaiting the director's "Завершить турнир" button for ELO finalization).

### Why dynamic, not pre-generated

Mexicano's whole point is that pairings react to standings. If we pre-generated rounds 2+ at tournament start we'd lock the bracket to the initial order, which is neither Mexicano nor useful. ELO finalization is unchanged — same per-match team-average formula applied at the end.

## Team Americano (pre-generated schedule, Phase 2C)

### Inputs

- `pairs: Array<[string, string]>` — fixed partner pairs, derived from `tournament_registrations.partner_id`. Total player count must be a multiple of 4 (so pair count `P` is even).

### Output

- `ScheduledRound[]` — `P − 1` rounds × `P / 2` matches per round, covering every pair-vs-pair matchup exactly once. Same combinatorial shape as Round Robin, but pairs come from explicit partner selection rather than registration adjacency.

### Algorithm

Identical to Round Robin on pairs (classical circle method):

1. Fix pair 0. Treat the remaining `P − 1` pairs as a rotating ring.
2. For each round `r = 0 … P − 2`, read the circle as `[pair 0, rotating[0], …, rotating[P − 2]]`. Emit `P / 2` matches `(circle[i] vs circle[P − 1 − i])` for `i = 0 … P/2 − 1`. Rotate the ring by one.

### Registration & pair bookkeeping

Each pair is stored as **two reciprocal `tournament_registrations` rows**: row A has `player_id = A, partner_id = B`; row B has `player_id = B, partner_id = A`. Inserts and deletes are atomic — removing one half removes the other. This keeps the single-player queries, ELO pipeline, and realtime subscriptions untouched.

### Ranking

Team Americano ranks **pairs**, using the same strategy as Round Robin: **wins desc → +/− desc → matches desc → pair name asc**. Individual ELO still updates per player via the standard team-average formula — partners of a winning pair both gain; partners of a losing pair both lose.

### Sanity checks

- 8 players (4 pairs): 3 rounds × 2 matches = 6 = C(4, 2) ✓
- 12 players (6 pairs): 5 rounds × 3 matches = 15 = C(6, 2) ✓
- 16 players (8 pairs): 7 rounds × 4 matches = 28 = C(8, 2) ✓

## Team Mexicano (dynamic per-round generation, Phase 2C)

### Inputs and outputs

- `generateTeamMexicanoRound(orderedPairs, roundNumber): ScheduledRound` — one round only.
- Caller orders the pairs:
  - Round 1: registration order (first pair vs second pair, third vs fourth, …).
  - Round R > 1: pairs sorted by the pair leaderboard (points desc → +/− desc → matches desc → pair name asc).

### Pairing rule

For each consecutive pair of pairs `[p[2k], p[2k+1]]` in the ordered list, emit a match on court `k`:

```
team1 = p[2k]      // pair at rank 2k
team2 = p[2k+1]    // pair at rank 2k+1
```

So rank 1 pair plays rank 2 pair on the top court, rank 3 plays rank 4 on the next, and so on. This is the classical Mexicano idea applied at the pair level: winners keep playing winners, losers keep playing losers, and the "final-court" effect surfaces naturally.

### Why strength-matched pairs are fine (unlike individual Mexicano)

Individual Mexicano can't pair adjacent ranks as partners — they'd freeze together because tied teammates stay adjacent on the leaderboard. In Team Mexicano partners are **already fixed**, so there's no partner-freezing hazard. Strength-matched matches are the whole point.

### Number of rounds

Fixed at tournament start: `totalRounds = N / 2` (same as individual Mexicano). So 8 players = 4 pairs → 4 rounds; 12 players = 6 pairs → 6 rounds; 16 players = 8 pairs → 8 rounds. With only P − 1 rounds needed for a complete round robin on pairs, Team Mexicano deliberately allows a handful of rematches — standings drive who plays whom.

### When each round is materialized

- Round 1 is inserted at tournament start by `startTournament`.
- Rounds 2 … N/2 are generated by `advanceRoundAction`: compute the pair leaderboard over all completed matches so far, order pairs by standings, call `generateTeamMexicanoRound`, insert round + matches, mark `in_progress`.

### Why dynamic, not pre-generated

Same reason as individual Mexicano: pairings react to standings. Pre-generating would lock the bracket to the starting order and defeat the format. ELO finalization is unchanged.

## ELO rating

### Formula

Standard ELO:

```
expectedScore(A, B) = 1 / (1 + 10^((B - A) / 400))
newRating(A)        = A + K * (actualScore - expectedScore)
```

Where `actualScore` is `1` for a win, `0.5` for a draw, `0` for a loss. In padel a "win" means your team's match score was higher than the opponent team's.

### K-factor — scales with tournament size

A win against 16 players in a real tournament is worth more than a win against 4 players in an exhibition. So K scales:

| Tournament size | K |
|-----------------|---|
| 16 players      | 32 |
| 12 players      | 24 |
| 8 players       | 16 |
| 4 players       | 8 |

For in-between sizes, round up to the nearest bucket (6 players → K = 16 using the 8-player bucket; 10 players → K = 24).

### When ELO is applied

ELO is applied **once, at tournament finalization**. The server function `finalizeTournamentElo(tournamentId)`:

1. Loads every completed match in the tournament, in match-creation order.
2. For each match: compute team 1 average rating vs. team 2 average rating, determine the `actualScore` from the match score, and compute the delta with the tournament's K-factor.
3. Apply the delta to all four players on that match simultaneously (each player of the winning team gains, each player of the losing team loses).
4. Persist one `rating_history` row per player per match with `elo_before`, `elo_after`, `change`.
5. After all matches processed, update `players.elo_rating` and `players.level` for every affected player.

Applying match-by-match (rather than batching by tournament outcome) gives players credit for early wins even if they finish poorly, which matches how padel players understand rating movement.

### Rationale for single-finalization vs. live ELO

We could update ELO after every match during the tournament, but that would mean:

- Mid-tournament leaderboard shows live ELO that could be rolled back if a score is corrected.
- Players whose matches are called first "lock in" their K-factor before everyone else has finished.

Applying at finalization means the K-factor reflects the actual tournament size, any mid-tournament score corrections are absorbed for free, and a tournament the director aborts doesn't leave ghost rating changes.

## ELO-to-level thresholds

Levels follow the `padel.ru` standard.

| ELO range     | Level |
|---------------|-------|
| < 800         | D     |
| 800 – 899     | D+    |
| 900 – 999     | C-    |
| 1000 – 1099   | C     |
| 1100 – 1199   | C+    |
| 1200 – 1349   | B-    |
| 1350 – 1499   | B     |
| 1500 – 1699   | B+    |
| 1700 – 1999   | A     |
| 2000+         | OPEN  |

### Default ELO per level (new player creation)

When a player is added with a declared level but no match history, their starting ELO is the **midpoint of the band**:

| Level | Default ELO |
|-------|-------------|
| D     | 750         |
| D+    | 850         |
| C-    | 950         |
| C     | 1050        |
| C+    | 1150        |
| B-    | 1275        |
| B     | 1425        |
| B+    | 1600        |
| A     | 1850        |
| OPEN  | 2050        |

This lets a new OPEN-level player behave correctly against a new C-level player in the very first tournament they play together, without making everyone start at 1000 and churn for weeks to separate.

## Live leaderboard

A pure function `computeLiveLeaderboard(matches, players)` that produces a ranked array:

- **Points:** sum of the player's team score across every completed match the player was in. Padel scoring is cumulative in Americano — if your team won 24–18, you personally score 24, regardless of how many games your partner contributed.
- **Matches played:** count of completed matches the player was on either team of.
- **+/−:** total team points for minus total team points against across completed matches.

Sort order: points desc → +/− desc → matches played desc → name asc (stable).

This function is called every time a Realtime update for the `matches` table lands. It is pure, stateless, and idempotent — recomputing from scratch is fast enough at tournament scales (≤ 32 players, ≤ 200 matches) that there's no need for incremental maintenance.

## League seasons

A league (`tournaments.type = 'league_season'`) is a chain of independent sessions. Each session runs end-to-end like a one-day tournament — schedule, rounds, scores, per-session ELO update — but each player also earns **season points** based on where they finished in that session. Points accumulate across sessions; top-N at the end qualify for the finals (finals themselves are out of scope in the current phase).

### Points table (`lib/league-points.ts`)

Points are awarded by finishing position, bucketed by session player count. The default table is:

| Session size | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th |
|--------------|-----|-----|-----|-----|-----|-----|-----|-----|
| 16 players   | 14  | 12  | 10  | 8   | 6   | 4   | 2   | 1   |
| 12 players   | 10  | 8   | 6   | 4   | 2   | 1   | —   | —   |
| 8 players    | 6   | 4   | 2   | 1   | —   | —   | —   | —   |
| 4 players    | 2   | 1   | —   | —   | —   | —   | —   | —   |

Positions not listed receive **0** points (e.g., 5th in an 8-player session, 9th in a 12-player session). This keeps the tail from diluting the reward for making the podium.

`pointsForPosition(table, playerCount, position)` picks the smallest bucket that is ≥ `playerCount`. If a session has a size not directly covered (e.g., 6 players), it falls through to the next larger bucket (8). Positions outside the bucket's keyset return 0.

### Session finishing order

When a session completes, `computeSessionFinishingOrder(matches, players, format, pairs?)` returns an ordered list of `{ playerId, position }`:

- For individual formats (`americano`, `mexicano`, `round_robin`) it reuses the same ranking rules as the live leaderboard (points desc → +/− desc → matches played desc → name asc).
- For team formats in leagues (deferred to a later phase), both members of a pair share the pair's finishing position.

### Season aggregation

`computeSeasonLeaderboard(tournament, sessions, players, pointsTable, qualificationSpots)` iterates completed sessions, looks up each player's position points, and produces one row per player:

- `totalPoints` — sum of points across sessions played
- `sessionsPlayed` — how many sessions the player appeared in
- `bestPosition` — best (lowest) finishing position across all sessions
- `averagePoints` — `totalPoints / sessionsPlayed` (display only)
- `qualified` — `true` for the top `qualificationSpots` rows

Sort: `totalPoints` desc → `sessionsPlayed` desc → `bestPosition` asc → name asc. The `sessionsPlayed` tiebreak rewards consistency over a single strong appearance; `bestPosition` is the final disambiguator.

Only sessions with `status = 'completed'` contribute. The cumulative leaderboard is computed on demand from match data — there is no stored `season_leaderboard` table in this phase.

### ELO in leagues

Each session is an **independent ELO event**. Finalizing a session:

1. Loads only that session's completed matches.
2. Loads current player ratings for the players who appeared.
3. Runs the standard match-by-match ELO update (see above) with `K = kFactorForSize(sessionPlayerCount)`.
4. Writes one `rating_history` row per player per match, tagged with both `tournament_id` and `session_id`.
5. Updates `players.elo_rating` and `players.level` in place.

Running a second session does not re-evaluate matches from earlier sessions. Ratings carry forward, so a player who climbed in session 1 enters session 2 at the new rating.
