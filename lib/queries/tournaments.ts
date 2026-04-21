import { createClient } from "../supabase/server";
import type { ScoringSystem, Tournament } from "../types";

export async function listTournaments(): Promise<Tournament[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("date_start", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Tournament[];
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Tournament | null) ?? null;
}

export async function createTournament(input: {
  name: string;
  type: Tournament["type"];
  format: Tournament["format"];
  date_start: string;
  date_end: string | null;
  level_min: Tournament["level_min"];
  level_max: Tournament["level_max"];
  max_players: number | null;
  entry_fee: number;
  prize_description: string | null;
  notes: string | null;
  court_ids: string[];
  start_time: string | null;
  scoring_system?: ScoringSystem;
  duration_hours?: number;
}): Promise<Tournament> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .insert({ ...input, status: "draft" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Tournament;
}

export async function updateTournamentStatus(
  id: string,
  status: Tournament["status"],
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournaments")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export interface UpdateTournamentInput {
  name: string;
  court_ids: string[];
  start_time: string | null;
  duration_hours: number;
  level_min: Tournament["level_min"];
  level_max: Tournament["level_max"];
  max_players: number | null;
  entry_fee: number;
  prize_description: string | null;
  notes: string | null;
}

export async function updateTournament(
  id: string,
  input: UpdateTournamentInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournaments")
    .update(input)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteTournament(id: string): Promise<void> {
  const supabase = await createClient();
  const { error: historyErr } = await supabase
    .from("rating_history")
    .delete()
    .eq("tournament_id", id);
  if (historyErr) throw new Error(historyErr.message);

  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
