import type { Match, Player, ScoringSystem } from "./types";
import type { Pair } from "./algorithms/teamAmericano";
import {
  isSetsDetail,
  scoringGroup,
  setsGameDifferential,
} from "./scoring-systems";

export type LeaderboardSortStrategy = "points" | "wins";

function diffsForMatch(
  m: Match,
  scoringSystem: ScoringSystem | undefined,
): { t1Diff: number; t2Diff: number } {
  const t1 = m.team1_score ?? 0;
  const t2 = m.team2_score ?? 0;
  if (
    scoringSystem &&
    scoringGroup(scoringSystem) === "sets" &&
    isSetsDetail(m.score_detail)
  ) {
    const [t1Games, t2Games] = setsGameDifferential(m.score_detail);
    return { t1Diff: t1Games - t2Games, t2Diff: t2Games - t1Games };
  }
  return { t1Diff: t1 - t2, t2Diff: t2 - t1 };
}

export interface LeaderboardRow {
  playerId: string;
  playerName: string;
  points: number;
  wins: number;
  matchesPlayed: number;
  plusMinus: number;
}

export interface PairLeaderboardRow {
  pairKey: string;
  playerIds: [string, string];
  playerNames: [string, string];
  displayName: string;
  points: number;
  wins: number;
  matchesPlayed: number;
  plusMinus: number;
}

export function computeLiveLeaderboard(
  matches: Match[],
  players: Player[],
  strategy: LeaderboardSortStrategy = "points",
  scoringSystem?: ScoringSystem,
): LeaderboardRow[] {
  const byId = new Map(players.map((p) => [p.id, p]));
  const stats = new Map<
    string,
    { points: number; wins: number; matchesPlayed: number; plusMinus: number }
  >();

  const bump = (
    id: string | null,
    pointsFor: number,
    pointsAgainst: number,
    diffFor: number,
  ) => {
    if (!id) return;
    const row = stats.get(id) ?? {
      points: 0,
      wins: 0,
      matchesPlayed: 0,
      plusMinus: 0,
    };
    row.points += pointsFor;
    row.matchesPlayed += 1;
    row.plusMinus += diffFor;
    if (pointsFor > pointsAgainst) row.wins += 1;
    stats.set(id, row);
  };

  for (const m of matches) {
    if (m.status !== "completed") continue;
    if (m.team1_score == null || m.team2_score == null) continue;

    const { t1Diff, t2Diff } = diffsForMatch(m, scoringSystem);
    bump(m.team1_player1_id, m.team1_score, m.team2_score, t1Diff);
    bump(m.team1_player2_id, m.team1_score, m.team2_score, t1Diff);
    bump(m.team2_player1_id, m.team2_score, m.team1_score, t2Diff);
    bump(m.team2_player2_id, m.team2_score, m.team1_score, t2Diff);
  }

  const rows: LeaderboardRow[] = [];
  for (const [id, s] of stats) {
    const name = byId.get(id)?.name ?? "—";
    rows.push({
      playerId: id,
      playerName: name,
      points: s.points,
      wins: s.wins,
      matchesPlayed: s.matchesPlayed,
      plusMinus: s.plusMinus,
    });
  }

  rows.sort((a, b) => {
    if (strategy === "wins") {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.plusMinus !== a.plusMinus) return b.plusMinus - a.plusMinus;
    } else {
      if (b.points !== a.points) return b.points - a.points;
      if (b.plusMinus !== a.plusMinus) return b.plusMinus - a.plusMinus;
    }
    if (b.matchesPlayed !== a.matchesPlayed)
      return b.matchesPlayed - a.matchesPlayed;
    return a.playerName.localeCompare(b.playerName, "ru");
  });

  return rows;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function computePairLeaderboard(
  matches: Match[],
  players: Player[],
  pairs: ReadonlyArray<Pair>,
  strategy: LeaderboardSortStrategy = "points",
  scoringSystem?: ScoringSystem,
): PairLeaderboardRow[] {
  const byPlayerId = new Map(players.map((p) => [p.id, p]));
  const keyByPlayer = new Map<string, string>();
  const pairDefs: Array<{ key: string; playerIds: [string, string] }> = pairs
    .map((p) => {
      const key = pairKey(p[0], p[1]);
      keyByPlayer.set(p[0], key);
      keyByPlayer.set(p[1], key);
      return { key, playerIds: [p[0], p[1]] as [string, string] };
    });

  const stats = new Map<
    string,
    { points: number; wins: number; matchesPlayed: number; plusMinus: number }
  >();

  const bump = (
    key: string | undefined,
    pointsFor: number,
    pointsAgainst: number,
    diffFor: number,
  ) => {
    if (!key) return;
    const row = stats.get(key) ?? {
      points: 0,
      wins: 0,
      matchesPlayed: 0,
      plusMinus: 0,
    };
    row.points += pointsFor;
    row.matchesPlayed += 1;
    row.plusMinus += diffFor;
    if (pointsFor > pointsAgainst) row.wins += 1;
    stats.set(key, row);
  };

  for (const m of matches) {
    if (m.status !== "completed") continue;
    if (m.team1_score == null || m.team2_score == null) continue;
    const t1Key = keyByPlayer.get(m.team1_player1_id ?? "");
    const t2Key = keyByPlayer.get(m.team2_player1_id ?? "");
    const { t1Diff, t2Diff } = diffsForMatch(m, scoringSystem);
    bump(t1Key, m.team1_score, m.team2_score, t1Diff);
    bump(t2Key, m.team2_score, m.team1_score, t2Diff);
  }

  const rows: PairLeaderboardRow[] = pairDefs.map((pd) => {
    const s = stats.get(pd.key) ?? {
      points: 0,
      wins: 0,
      matchesPlayed: 0,
      plusMinus: 0,
    };
    const n1 = byPlayerId.get(pd.playerIds[0])?.name ?? "—";
    const n2 = byPlayerId.get(pd.playerIds[1])?.name ?? "—";
    return {
      pairKey: pd.key,
      playerIds: pd.playerIds,
      playerNames: [n1, n2],
      displayName: `${n1} / ${n2}`,
      points: s.points,
      wins: s.wins,
      matchesPlayed: s.matchesPlayed,
      plusMinus: s.plusMinus,
    };
  });

  rows.sort((a, b) => {
    if (strategy === "wins") {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.plusMinus !== a.plusMinus) return b.plusMinus - a.plusMinus;
    } else {
      if (b.points !== a.points) return b.points - a.points;
      if (b.plusMinus !== a.plusMinus) return b.plusMinus - a.plusMinus;
    }
    if (b.matchesPlayed !== a.matchesPlayed)
      return b.matchesPlayed - a.matchesPlayed;
    return a.displayName.localeCompare(b.displayName, "ru");
  });

  return rows;
}

export function sortStrategyForFormat(
  format: string,
): LeaderboardSortStrategy {
  return format === "round_robin" || format === "team_americano"
    ? "wins"
    : "points";
}
