import type { ScheduledRound, ScheduledMatch } from "../americano";

export function generateMexicanoRound(
  orderedPlayerIds: string[],
  roundNumber: number,
): ScheduledRound {
  const n = orderedPlayerIds.length;
  if (n < 4 || n % 4 !== 0) {
    throw new Error(
      `Mexicano requires a multiple of 4 players (got ${n}).`,
    );
  }
  if (roundNumber < 1) {
    throw new Error(`roundNumber must be >= 1 (got ${roundNumber}).`);
  }

  const matches: ScheduledMatch[] = [];
  for (let quartet = 0; quartet < n / 4; quartet++) {
    const base = quartet * 4;
    matches.push({
      courtIndex: quartet,
      team1: [orderedPlayerIds[base], orderedPlayerIds[base + 3]],
      team2: [orderedPlayerIds[base + 1], orderedPlayerIds[base + 2]],
    });
  }

  return { roundNumber, matches };
}

export function mexicanoTotalRounds(playerCount: number): number {
  if (playerCount < 4 || playerCount % 4 !== 0) {
    throw new Error(
      `Mexicano requires a multiple of 4 players (got ${playerCount}).`,
    );
  }
  return playerCount / 2;
}
