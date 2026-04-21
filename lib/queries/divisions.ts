import { createClient } from "../supabase/server";
import type {
  Division,
  DivisionCategory,
  DivisionStatus,
  PadelLevel,
  ScoringSystem,
  TournamentFormat,
} from "../types";

export interface CreateDivisionInput {
  tournament_id: string;
  name: string;
  category: DivisionCategory;
  level_min: PadelLevel | null;
  level_max: PadelLevel | null;
  max_players: number | null;
  court_ids: string[];
  format: TournamentFormat;
  scoring_system: ScoringSystem;
}

export interface UpdateDivisionInput {
  name?: string;
  category?: DivisionCategory;
  level_min?: PadelLevel | null;
  level_max?: PadelLevel | null;
  max_players?: number | null;
  court_ids?: string[];
  format?: TournamentFormat;
  scoring_system?: ScoringSystem;
  status?: DivisionStatus;
}

export async function listDivisions(tournamentId: string): Promise<Division[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Division[];
}

export async function listDivisionsByTournaments(
  tournamentIds: string[],
): Promise<Map<string, Division[]>> {
  const out = new Map<string, Division[]>();
  if (tournamentIds.length === 0) return out;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .select("*")
    .in("tournament_id", tournamentIds)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  for (const d of (data ?? []) as Division[]) {
    const list = out.get(d.tournament_id) ?? [];
    list.push(d);
    out.set(d.tournament_id, list);
  }
  return out;
}

export async function getDivision(id: string): Promise<Division | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Division | null) ?? null;
}

export async function createDivision(
  input: CreateDivisionInput,
): Promise<Division> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .insert({ ...input, status: "draft" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Division;
}

export async function updateDivision(
  id: string,
  input: UpdateDivisionInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("divisions").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateDivisionStatus(
  id: string,
  status: DivisionStatus,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("divisions")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDivision(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("divisions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
