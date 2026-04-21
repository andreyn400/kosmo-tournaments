import { createClient } from "./supabase/server";
import { expectedScore, newRating } from "./elo";
import { eloToLevel } from "./elo-to-level";
import type { Player } from "./types";

export const FINALS_K_FACTOR = 48;

export interface FinalsEloChange {
  player_id: string;
  elo_before: number;
  elo_after: number;
  change: number;
}

export function computeFinalsEloChanges(input: {
  team1: Array<{ id: string; rating: number }>;
  team2: Array<{ id: string; rating: number }>;
  winner: 1 | 2;
  k?: number;
}): FinalsEloChange[] {
  const { team1, team2, winner, k = FINALS_K_FACTOR } = input;
  if (team1.length !== 2 || team2.length !== 2) {
    throw new Error("Finals ELO requires exactly 2 players per team");
  }
  const r1 = (team1[0].rating + team1[1].rating) / 2;
  const r2 = (team2[0].rating + team2[1].rating) / 2;
  const e1 = expectedScore(r1, r2);
  const e2 = 1 - e1;
  const a1 = winner === 1 ? 1 : 0;
  const a2 = 1 - a1;

  const rows: FinalsEloChange[] = [];
  for (const p of team1) {
    const after = newRating(p.rating, a1, e1, k);
    rows.push({
      player_id: p.id,
      elo_before: p.rating,
      elo_after: after,
      change: after - p.rating,
    });
  }
  for (const p of team2) {
    const after = newRating(p.rating, a2, e2, k);
    rows.push({
      player_id: p.id,
      elo_before: p.rating,
      elo_after: after,
      change: after - p.rating,
    });
  }
  return rows;
}

export async function applyFinalsEloForMatch(input: {
  tournamentId: string;
  team1PlayerIds: [string, string];
  team2PlayerIds: [string, string];
  winner: 1 | 2;
}): Promise<void> {
  const playerIds = [...input.team1PlayerIds, ...input.team2PlayerIds];
  const supabase = await createClient();
  const { data: playerRows, error: playersErr } = await supabase
    .from("players")
    .select("*")
    .in("id", playerIds);
  if (playersErr) throw new Error(playersErr.message);

  const ratingById = new Map<string, number>();
  for (const p of (playerRows ?? []) as Player[]) {
    ratingById.set(p.id, p.elo_rating);
  }
  for (const id of playerIds) {
    if (!ratingById.has(id)) {
      throw new Error(`Игрок ${id} не найден`);
    }
  }

  const changes = computeFinalsEloChanges({
    team1: input.team1PlayerIds.map((id) => ({ id, rating: ratingById.get(id)! })),
    team2: input.team2PlayerIds.map((id) => ({ id, rating: ratingById.get(id)! })),
    winner: input.winner,
  });

  const historyRows = changes.map((c) => ({
    player_id: c.player_id,
    tournament_id: input.tournamentId,
    session_id: null,
    elo_before: c.elo_before,
    elo_after: c.elo_after,
    change: c.change,
  }));
  const { error: histErr } = await supabase
    .from("rating_history")
    .insert(historyRows);
  if (histErr) throw new Error(histErr.message);

  for (const c of changes) {
    const { error: upErr } = await supabase
      .from("players")
      .update({
        elo_rating: c.elo_after,
        level: eloToLevel(c.elo_after),
      })
      .eq("id", c.player_id);
    if (upErr) throw new Error(upErr.message);
  }
}
