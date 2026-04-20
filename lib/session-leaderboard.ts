import type { Match, Player, TournamentFormat } from "./types";
import type { Pair } from "./algorithms/teamAmericano";
import {
  computeLiveLeaderboard,
  computePairLeaderboard,
  sortStrategyForFormat,
} from "./leaderboard";

export interface SessionFinishingEntry {
  playerId: string;
  position: number;
}

export function computeSessionFinishingOrder(
  matches: Match[],
  players: Player[],
  format: TournamentFormat,
  pairs?: ReadonlyArray<Pair>,
): SessionFinishingEntry[] {
  const strategy = sortStrategyForFormat(format);
  const isTeamFormat =
    (format === "team_americano" || format === "team_mexicano") &&
    pairs &&
    pairs.length > 0;

  if (isTeamFormat) {
    const rows = computePairLeaderboard(matches, players, pairs!, strategy);
    const out: SessionFinishingEntry[] = [];
    rows.forEach((row, idx) => {
      const position = idx + 1;
      out.push({ playerId: row.playerIds[0], position });
      out.push({ playerId: row.playerIds[1], position });
    });
    return out;
  }

  const rows = computeLiveLeaderboard(matches, players, strategy);
  return rows.map((row, idx) => ({
    playerId: row.playerId,
    position: idx + 1,
  }));
}
