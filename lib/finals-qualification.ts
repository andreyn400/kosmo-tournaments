import type { SeasonLeaderboardRow } from "./season-leaderboard";
import type { Player, TournamentFormat } from "./types";
import { pairsFromRegistrations } from "./pairs-from-registrations";
import type { QualifiedPair } from "./finals-bracket";
import type { SeededIndividual } from "./finals-pair-formation";

export function isTeamLeagueFormat(f: TournamentFormat): boolean {
  return f === "team_americano" || f === "team_mexicano";
}

export interface TeamQualification {
  kind: "team";
  pairs: QualifiedPair[];
}

export interface IndividualQualification {
  kind: "individual";
  individuals: SeededIndividual[];
}

export type Qualification = TeamQualification | IndividualQualification;

export function computeQualification(input: {
  format: TournamentFormat;
  leaderboard: SeasonLeaderboardRow[];
  registrations: Array<{ player_id: string; partner_id: string | null }>;
  players: Player[];
}): Qualification {
  const nameById = new Map(input.players.map((p) => [p.id, p.name]));
  const rankByPlayer = new Map<string, number>();
  const pointsByPlayer = new Map<string, number>();
  input.leaderboard.forEach((row, idx) => {
    rankByPlayer.set(row.playerId, idx + 1);
    pointsByPlayer.set(row.playerId, row.totalPoints);
  });

  if (isTeamLeagueFormat(input.format)) {
    const registrationPairs = pairsFromRegistrations(input.registrations);
    const ranked = registrationPairs.map(([p1, p2]) => {
      const r1 = rankByPlayer.get(p1) ?? Number.MAX_SAFE_INTEGER;
      const r2 = rankByPlayer.get(p2) ?? Number.MAX_SAFE_INTEGER;
      const best = Math.min(r1, r2);
      const points =
        Math.max(pointsByPlayer.get(p1) ?? 0, pointsByPlayer.get(p2) ?? 0);
      return { p1, p2, best, points };
    });
    ranked.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.best - b.best;
    });
    const pairs: QualifiedPair[] = ranked.map((r, idx) => ({
      pairSeed: idx + 1,
      player1_id: r.p1,
      player2_id: r.p2,
    }));
    return { kind: "team", pairs };
  }

  const individuals: SeededIndividual[] = input.leaderboard.map((row, idx) => ({
    playerId: row.playerId,
    name: nameById.get(row.playerId) ?? row.playerName,
    seed: idx + 1,
  }));
  return { kind: "individual", individuals };
}

export function largestPow2AtMost(n: number): number {
  if (n < 2) return 0;
  let s = 1;
  while (s * 2 <= n) s *= 2;
  return s;
}

export function smallestPow2AtLeast(n: number): number {
  if (n < 2) return 2;
  let s = 1;
  while (s < n) s *= 2;
  return s;
}

export function allowedBracketSizesForTeam(pairCount: number): number[] {
  const out: number[] = [];
  for (const s of [2, 4, 8, 16, 32]) {
    if (pairCount >= s / 2) out.push(s);
  }
  return out;
}

export function allowedBracketSizesForIndividual(
  individualCount: number,
): number[] {
  const out: number[] = [];
  for (const s of [2, 4, 8, 16, 32]) {
    if (individualCount >= s * 2) out.push(s);
  }
  return out;
}
