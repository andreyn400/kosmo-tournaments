import { createClient } from "../supabase/server";
import type { Player, TournamentRegistration } from "../types";

export interface RegistrationWithPlayer extends TournamentRegistration {
  player: Player;
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

export async function createRegistration(input: {
  tournament_id: string;
  player_id: string;
}): Promise<TournamentRegistration> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .insert({
      tournament_id: input.tournament_id,
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
}): Promise<void> {
  if (input.player_a === input.player_b) {
    throw new Error("Игрок не может быть в паре сам с собой");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("tournament_registrations").insert([
    {
      tournament_id: input.tournament_id,
      player_id: input.player_a,
      partner_id: input.player_b,
      status: "registered",
    },
    {
      tournament_id: input.tournament_id,
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
