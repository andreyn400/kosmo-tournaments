import type { ScheduledRound, ScheduledMatch } from "../americano";

export function generateRoundRobinSchedule(
  playerIds: string[],
): ScheduledRound[] {
  const n = playerIds.length;
  if (n < 4 || n % 4 !== 0) {
    throw new Error(
      `Round Robin requires a multiple of 4 players (got ${n}).`,
    );
  }

  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < n; i += 2) {
    pairs.push([playerIds[i], playerIds[i + 1]]);
  }

  const P = pairs.length;
  const rotating = pairs.slice(1);
  const rounds: ScheduledRound[] = [];

  for (let r = 0; r < P - 1; r++) {
    const circle: Array<[string, string]> = [pairs[0], ...rotating];
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
