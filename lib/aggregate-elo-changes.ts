import type { RatingHistoryEntry } from "./types";

export interface EloChangeSummary {
  playerId: string;
  eloBefore: number;
  eloAfter: number;
  change: number;
  matches: number;
}

export function aggregateEloChanges(
  entries: RatingHistoryEntry[],
): Map<string, EloChangeSummary> {
  const sorted = [...entries].sort(
    (a, b) => a.recorded_at.localeCompare(b.recorded_at),
  );
  const map = new Map<string, EloChangeSummary>();

  for (const e of sorted) {
    const prev = map.get(e.player_id);
    if (!prev) {
      map.set(e.player_id, {
        playerId: e.player_id,
        eloBefore: e.elo_before,
        eloAfter: e.elo_after,
        change: e.change,
        matches: 1,
      });
    } else {
      prev.eloAfter = e.elo_after;
      prev.change += e.change;
      prev.matches += 1;
    }
  }

  return map;
}
