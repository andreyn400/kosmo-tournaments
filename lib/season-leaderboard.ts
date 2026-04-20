import { pointsForPosition, type PointsTable } from "./league-points";
import { computeSessionFinishingOrder } from "./session-leaderboard";
import { pairsFromRegistrations } from "./pairs-from-registrations";
import type { Match, Player, Tournament, TournamentSession } from "./types";

export interface SessionInput {
  session: TournamentSession;
  matches: Match[];
  registrations: Array<{ player_id: string; partner_id: string | null }>;
}

export interface SeasonLeaderboardRow {
  playerId: string;
  playerName: string;
  totalPoints: number;
  sessionsPlayed: number;
  bestPosition: number | null;
  averagePoints: number;
  qualified: boolean;
}

export function computeSeasonLeaderboard(
  tournament: Tournament,
  sessions: SessionInput[],
  players: Player[],
  pointsTable: PointsTable,
  qualificationSpots: number,
): SeasonLeaderboardRow[] {
  const byId = new Map(players.map((p) => [p.id, p]));
  const stats = new Map<
    string,
    {
      total: number;
      sessions: number;
      best: number | null;
    }
  >();

  const bump = (
    playerId: string,
    points: number,
    position: number,
  ) => {
    const row = stats.get(playerId) ?? {
      total: 0,
      sessions: 0,
      best: null as number | null,
    };
    row.total += points;
    row.sessions += 1;
    row.best = row.best == null ? position : Math.min(row.best, position);
    stats.set(playerId, row);
  };

  for (const s of sessions) {
    if (s.session.status !== "completed") continue;
    const completed = s.matches.filter((m) => m.status === "completed");
    if (completed.length === 0) continue;

    const sessionPlayerIds = new Set<string>();
    for (const m of completed) {
      for (const id of [
        m.team1_player1_id,
        m.team1_player2_id,
        m.team2_player1_id,
        m.team2_player2_id,
      ]) {
        if (id) sessionPlayerIds.add(id);
      }
    }
    const sessionPlayers = players.filter((p) => sessionPlayerIds.has(p.id));
    const pairs = pairsFromRegistrations(
      s.registrations.filter((r) => sessionPlayerIds.has(r.player_id)),
    );

    const finishing = computeSessionFinishingOrder(
      completed,
      sessionPlayers,
      tournament.format,
      pairs,
    );

    for (const entry of finishing) {
      const pts = pointsForPosition(
        pointsTable,
        sessionPlayerIds.size,
        entry.position,
      );
      bump(entry.playerId, pts, entry.position);
    }
  }

  const rows: SeasonLeaderboardRow[] = [];
  for (const [playerId, s] of stats) {
    rows.push({
      playerId,
      playerName: byId.get(playerId)?.name ?? "—",
      totalPoints: s.total,
      sessionsPlayed: s.sessions,
      bestPosition: s.best,
      averagePoints: s.sessions === 0 ? 0 : s.total / s.sessions,
      qualified: false,
    });
  }

  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.sessionsPlayed !== a.sessionsPlayed)
      return b.sessionsPlayed - a.sessionsPlayed;
    const ba = b.bestPosition == null ? Number.MAX_SAFE_INTEGER : b.bestPosition;
    const aa = a.bestPosition == null ? Number.MAX_SAFE_INTEGER : a.bestPosition;
    if (aa !== ba) return aa - ba;
    return a.playerName.localeCompare(b.playerName, "ru");
  });

  for (let i = 0; i < rows.length; i++) {
    rows[i].qualified = i < qualificationSpots;
  }

  return rows;
}
