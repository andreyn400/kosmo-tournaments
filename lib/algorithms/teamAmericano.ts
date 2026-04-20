import type { ScheduledRound, ScheduledMatch } from "../americano";

export type Pair = readonly [string, string];

export function generateTeamAmericanoSchedule(
  pairs: ReadonlyArray<Pair>,
): ScheduledRound[] {
  const P = pairs.length;
  if (P < 2 || P % 2 !== 0) {
    throw new Error(
      `Team Americano requires an even number of pairs >= 2 (got ${P}).`,
    );
  }

  const fixed: Pair = pairs[0];
  const rotating: Pair[] = pairs.slice(1).map((p) => [p[0], p[1]] as Pair);
  const rounds: ScheduledRound[] = [];

  for (let r = 0; r < P - 1; r++) {
    const circle: Pair[] = [fixed, ...rotating];
    const matches: ScheduledMatch[] = [];

    for (let i = 0; i < P / 2; i++) {
      const a = circle[i];
      const b = circle[P - 1 - i];
      matches.push({
        courtIndex: i,
        team1: [a[0], a[1]],
        team2: [b[0], b[1]],
      });
    }

    rounds.push({ roundNumber: r + 1, matches });

    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  return rounds;
}
