import { createClient } from "../supabase/server";
import type { BracketMatch, BracketMatchStatus } from "../types";

export interface BracketMatchInsert {
  tournament_id: string;
  league_season_id: string;
  round_number: number;
  position: number;
  seed1: number | null;
  seed2: number | null;
  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
  next_match_id?: string | null;
  next_match_slot?: 1 | 2 | null;
  court_id?: string | null;
  scheduled_at?: string | null;
  status?: BracketMatchStatus;
}

export interface BracketMatchPatch {
  team1_player1_id?: string | null;
  team1_player2_id?: string | null;
  team2_player1_id?: string | null;
  team2_player2_id?: string | null;
  team1_score?: number | null;
  team2_score?: number | null;
  score_detail?: unknown | null;
  winner_team?: 1 | 2 | null;
  status?: BracketMatchStatus;
  court_id?: string | null;
  scheduled_at?: string | null;
  next_match_id?: string | null;
  next_match_slot?: 1 | 2 | null;
}

export async function listBracketMatches(
  leagueSeasonId: string,
): Promise<BracketMatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bracket_matches")
    .select("*")
    .eq("league_season_id", leagueSeasonId)
    .order("round_number", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BracketMatch[];
}

export async function getBracketMatch(
  id: string,
): Promise<BracketMatch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bracket_matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BracketMatch | null) ?? null;
}

export async function createBracketMatches(
  rows: BracketMatchInsert[],
): Promise<BracketMatch[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bracket_matches")
    .insert(rows)
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as BracketMatch[];
}

export async function updateBracketMatch(
  id: string,
  patch: BracketMatchPatch,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bracket_matches")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBracketMatchesByLeagueSeason(
  leagueSeasonId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bracket_matches")
    .delete()
    .eq("league_season_id", leagueSeasonId);
  if (error) throw new Error(error.message);
}
