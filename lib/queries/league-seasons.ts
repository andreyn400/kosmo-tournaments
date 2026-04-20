import { createClient } from "../supabase/server";
import type { PointsTable } from "../league-points";

export interface LeagueSeason {
  id: string;
  tournament_id: string;
  session_dates: string[];
  points_table: PointsTable;
  qualification_spots: number;
  finals_date: string | null;
}

export async function createLeagueSeason(input: {
  tournament_id: string;
  session_dates: string[];
  points_table: PointsTable;
  qualification_spots: number;
  finals_date: string | null;
}): Promise<LeagueSeason> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("league_seasons")
    .insert({
      tournament_id: input.tournament_id,
      session_dates: input.session_dates,
      points_table: input.points_table,
      qualification_spots: input.qualification_spots,
      finals_date: input.finals_date,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as LeagueSeason;
}

export async function getLeagueSeason(
  tournamentId: string,
): Promise<LeagueSeason | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("league_seasons")
    .select("*")
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as LeagueSeason | null) ?? null;
}
