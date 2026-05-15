import { createClient } from "../supabase/server";
import { generateShortCode } from "../short-code";
import type { ScoringSystem, Tournament } from "../types";

const SHORT_CODE_MAX_RETRIES = 5;

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

  for (let attempt = 0; attempt < SHORT_CODE_MAX_RETRIES; attempt++) {
    const short_code = generateShortCode();
    const { data, error } = await supabase
      .from("tournaments")
      .insert({ ...input, status: "draft", short_code })
      .select("*")
      .single();

    if (!error) return data as Tournament;
    const isShortCodeCollision =
      error.code === "23505" &&
      (error.message.includes("short_code") ||
        error.details?.includes("short_code"));
    if (!isShortCodeCollision) throw new Error(error.message);
  }

  throw new Error("short_code collision after max retries");
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
