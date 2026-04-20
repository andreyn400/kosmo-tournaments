export interface ScheduledMatch {
  courtIndex: number;
  team1: [string, string];
  team2: [string, string];
}

export interface ScheduledRound {
  roundNumber: number;
  matches: ScheduledMatch[];
}

export function generateAmericanoSchedule(
  playerIds: string[],
): ScheduledRound[] {
  const n = playerIds.length;
  if (n < 4 || n % 4 !== 0) {
    throw new Error(
      `Americano requires a multiple of 4 players (got ${n}).`,
    );
  }

  const rotating = playerIds.slice(1);
  const rounds: ScheduledRound[] = [];

  for (let r = 0; r < n - 1; r++) {
    const circle = [playerIds[0], ...rotating];
    const matches: ScheduledMatch[] = [];

    for (let court = 0; court < n / 4; court++) {
      const base = court * 4;
      matches.push({
        courtIndex: court,
        team1: [circle[base], circle[base + 1]],
        team2: [circle[base + 2], circle[base + 3]],
      });
    }

    rounds.push({ roundNumber: r + 1, matches });

    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  return rounds;
}
