import { createClient } from "../supabase/server";
import type { RatingHistoryEntry } from "../types";

export async function listRatingHistoryByTournament(
  tournamentId: string,
): Promise<RatingHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rating_history")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("recorded_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as RatingHistoryEntry[];
}

export async function listRatingHistoryByPlayer(
  playerId: string,
): Promise<RatingHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rating_history")
    .select("*")
    .eq("player_id", playerId)
    .order("recorded_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as RatingHistoryEntry[];
}
