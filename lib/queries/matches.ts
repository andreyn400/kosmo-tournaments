import { createClient } from "../supabase/server";
import type { Match } from "../types";

export async function createMatch(input: {
  round_id: string;
  court_number: number;
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
}): Promise<Match> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({
      round_id: input.round_id,
      court_number: input.court_number,
      team1_player1_id: input.team1_player1_id,
      team1_player2_id: input.team1_player2_id,
      team2_player1_id: input.team2_player1_id,
      team2_player2_id: input.team2_player2_id,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Match;
}

export async function listMatchesByRound(roundId: string): Promise<Match[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("round_id", roundId)
    .order("court_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Match[];
}

export async function listMatchesByTournament(
  tournamentId: string,
): Promise<Match[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*, round:round_id!inner(session:session_id!inner(tournament_id))")
    .eq("round.session.tournament_id", tournamentId);

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Match[]).map((m) => ({
    id: m.id,
    round_id: m.round_id,
    court_number: m.court_number,
    court_id: m.court_id,
    team1_player1_id: m.team1_player1_id,
    team1_player2_id: m.team1_player2_id,
    team2_player1_id: m.team2_player1_id,
    team2_player2_id: m.team2_player2_id,
    team1_score: m.team1_score,
    team2_score: m.team2_score,
    score_detail: m.score_detail,
    status: m.status,
    created_at: m.created_at,
  }));
}

export async function updateMatchScore(input: {
  id: string;
  team1_score: number;
  team2_score: number;
  score_detail?: unknown | null;
}): Promise<void> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    team1_score: input.team1_score,
    team2_score: input.team2_score,
    status: "completed",
  };
  if (input.score_detail !== undefined) {
    update.score_detail = input.score_detail;
  }
  const { error } = await supabase
    .from("matches")
    .update(update)
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}
