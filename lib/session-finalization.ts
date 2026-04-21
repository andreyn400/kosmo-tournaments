import { createClient } from "./supabase/server";
import { expectedScore, kFactorForSize, newRating } from "./elo";
import { eloToLevel } from "./elo-to-level";
import type { Match, Player } from "./types";

export async function finalizeSessionElo(input: {
  sessionId: string;
  tournamentId: string;
  divisionId?: string | null;
}): Promise<void> {
  const { sessionId, tournamentId, divisionId } = input;
  const supabase = await createClient();

  let roundQuery = supabase.from("rounds").select("id").eq("session_id", sessionId);
  if (divisionId) roundQuery = roundQuery.eq("division_id", divisionId);
  const { data: roundRows, error: roundErr } = await roundQuery;
  if (roundErr) throw new Error(roundErr.message);
  const roundIds = (roundRows ?? []).map((r) => r.id);
  if (roundIds.length === 0) return;

  const { data: matchRows, error: matchErr } = await supabase
    .from("matches")
    .select("*")
    .in("round_id", roundIds)
    .eq("status", "completed")
    .order("created_at", { ascending: true });
  if (matchErr) throw new Error(matchErr.message);
  const matches = (matchRows ?? []) as Match[];
  if (matches.length === 0) return;

  const playerIdSet = new Set<string>();
  for (const m of matches) {
    for (const id of [
      m.team1_player1_id,
      m.team1_player2_id,
      m.team2_player1_id,
      m.team2_player2_id,
    ]) {
      if (id) playerIdSet.add(id);
    }
  }
  const playerIds = [...playerIdSet];

  const { data: playerRows, error: playersErr } = await supabase
    .from("players")
    .select("*")
    .in("id", playerIds);
  if (playersErr) throw new Error(playersErr.message);
  const currentElo = new Map<string, number>();
  for (const p of (playerRows ?? []) as Player[]) {
    currentElo.set(p.id, p.elo_rating);
  }

  const k = kFactorForSize(playerIds.length);
  const historyRows: Array<{
    player_id: string;
    tournament_id: string;
    session_id: string;
    elo_before: number;
    elo_after: number;
    change: number;
  }> = [];

  for (const m of matches) {
    const t1 = [m.team1_player1_id, m.team1_player2_id].filter(
      (x): x is string => !!x,
    );
    const t2 = [m.team2_player1_id, m.team2_player2_id].filter(
      (x): x is string => !!x,
    );
    if (t1.length !== 2 || t2.length !== 2) continue;
    if (m.team1_score == null || m.team2_score == null) continue;

    const r1 = (currentElo.get(t1[0])! + currentElo.get(t1[1])!) / 2;
    const r2 = (currentElo.get(t2[0])! + currentElo.get(t2[1])!) / 2;
    const e1 = expectedScore(r1, r2);
    const e2 = 1 - e1;
    const a1 =
      m.team1_score > m.team2_score
        ? 1
        : m.team1_score < m.team2_score
          ? 0
          : 0.5;
    const a2 = 1 - a1;

    for (const id of t1) {
      const before = currentElo.get(id)!;
      const after = newRating(before, a1, e1, k);
      currentElo.set(id, after);
      historyRows.push({
        player_id: id,
        tournament_id: tournamentId,
        session_id: sessionId,
        elo_before: before,
        elo_after: after,
        change: after - before,
      });
    }
    for (const id of t2) {
      const before = currentElo.get(id)!;
      const after = newRating(before, a2, e2, k);
      currentElo.set(id, after);
      historyRows.push({
        player_id: id,
        tournament_id: tournamentId,
        session_id: sessionId,
        elo_before: before,
        elo_after: after,
        change: after - before,
      });
    }
  }

  if (historyRows.length > 0) {
    const { error: histErr } = await supabase
      .from("rating_history")
      .insert(historyRows);
    if (histErr) throw new Error(histErr.message);
  }

  for (const [id, elo] of currentElo) {
    const { error: updateErr } = await supabase
      .from("players")
      .update({ elo_rating: elo, level: eloToLevel(elo) })
      .eq("id", id);
    if (updateErr) throw new Error(updateErr.message);
  }
}
