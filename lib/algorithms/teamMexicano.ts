import type { ScheduledRound, ScheduledMatch } from "../americano";
import type { Pair } from "./teamAmericano";

export function generateTeamMexicanoRound(
  orderedPairs: ReadonlyArray<Pair>,
  roundNumber: number,
): ScheduledRound {
  const P = orderedPairs.length;
  if (P < 2 || P % 2 !== 0) {
    throw new Error(
      `Team Mexicano requires an even number of pairs >= 2 (got ${P}).`,
    );
  }
  if (roundNumber < 1) {
    throw new Error(`roundNumber must be >= 1 (got ${roundNumber}).`);
  }

  const matches: ScheduledMatch[] = [];
  for (let court = 0; court < P / 2; court++) {
    const base = court * 2;
    const a = orderedPairs[base];
    const b = orderedPairs[base + 1];
    matches.push({
      courtIndex: court,
      team1: [a[0], a[1]],
      team2: [b[0], b[1]],
    });
  }

  return { roundNumber, matches };
}

export function teamMexicanoTotalRounds(playerCount: number): number {
  if (playerCount < 4 || playerCount % 4 !== 0) {
    throw new Error(
      `Team Mexicano requires a multiple of 4 players (got ${playerCount}).`,
    );
  }
  return playerCount / 2;
}
