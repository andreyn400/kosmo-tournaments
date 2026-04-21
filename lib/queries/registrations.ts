import { createClient } from "../supabase/server";
import type { Player, TournamentRegistration } from "../types";

export interface RegistrationWithPlayer extends TournamentRegistration {
  player: Player;
}

export interface RegisteredPlayerSummary {
  id: string;
  name: string;
  photo_url: string | null;
}

export async function listRegisteredPlayersByTournaments(
  tournamentIds: string[],
): Promise<Map<string, RegisteredPlayerSummary[]>> {
  const out = new Map<string, RegisteredPlayerSummary[]>();
  if (tournamentIds.length === 0) return out;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("tournament_id, registered_at, player:player_id(id, name, photo_url)")
    .in("tournament_id", tournamentIds)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: true });

  if (error) throw new Error(error.message);

  type Row = {
    tournament_id: string;
    player: RegisteredPlayerSummary | null;
  };
  const seen = new Map<string, Set<string>>();
  for (const row of (data ?? []) as unknown as Row[]) {
    if (!row.player) continue;
    const seenForTournament = seen.get(row.tournament_id) ?? new Set<string>();
    if (seenForTournament.has(row.player.id)) continue;
    seenForTournament.add(row.player.id);
    seen.set(row.tournament_id, seenForTournament);
    const list = out.get(row.tournament_id) ?? [];
    list.push({
      id: row.player.id,
      name: row.player.name,
      photo_url: row.player.photo_url,
    });
    out.set(row.tournament_id, list);
  }
  return out;
}

export async function listRegistrations(
  tournamentId: string,
): Promise<RegistrationWithPlayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*, player:player_id(*)")
    .eq("tournament_id", tournamentId)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RegistrationWithPlayer[];
}

export async function listRegistrationsByDivision(
  divisionId: string,
): Promise<RegistrationWithPlayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*, player:player_id(*)")
    .eq("division_id", divisionId)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RegistrationWithPlayer[];
}

export async function createRegistration(input: {
  tournament_id: string;
  player_id: string;
  division_id?: string | null;
}): Promise<TournamentRegistration> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .insert({
      tournament_id: input.tournament_id,
      division_id: input.division_id ?? null,
      player_id: input.player_id,
      status: "registered",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as TournamentRegistration;
}

export async function createRegistrationPair(input: {
  tournament_id: string;
  player_a: string;
  player_b: string;
  division_id?: string | null;
}): Promise<void> {
  if (input.player_a === input.player_b) {
    throw new Error("Игрок не может быть в паре сам с собой");
  }
  const divisionId = input.division_id ?? null;
  const supabase = await createClient();
  const { error } = await supabase.from("tournament_registrations").insert([
    {
      tournament_id: input.tournament_id,
      division_id: divisionId,
      player_id: input.player_a,
      partner_id: input.player_b,
      status: "registered",
    },
    {
      tournament_id: input.tournament_id,
      division_id: divisionId,
      player_id: input.player_b,
      partner_id: input.player_a,
      status: "registered",
    },
  ]);
  if (error) throw new Error(error.message);
}

export async function deleteRegistration(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_registrations")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteRegistrationWithPartner(
  registrationId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: reg, error: fetchErr } = await supabase
    .from("tournament_registrations")
    .select("id, partner_id, tournament_id")
    .eq("id", registrationId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const ids: string[] = [reg.id];
  if (reg.partner_id) {
    const { data: partnerReg, error: partnerErr } = await supabase
      .from("tournament_registrations")
      .select("id")
      .eq("tournament_id", reg.tournament_id)
      .eq("player_id", reg.partner_id)
      .maybeSingle();
    if (partnerErr) throw new Error(partnerErr.message);
    if (partnerReg) ids.push(partnerReg.id);
  }

  const { error } = await supabase
    .from("tournament_registrations")
    .delete()
    .in("id", ids);
  if (error) throw new Error(error.message);
}
