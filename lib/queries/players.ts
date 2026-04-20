import { createClient } from "../supabase/server";
import { DEFAULT_ELO_BY_LEVEL } from "../constants";
import type { PadelLevel, Player } from "../types";

export async function listPlayers(): Promise<Player[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Player[];
}

export async function getPlayer(id: string): Promise<Player | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Player | null) ?? null;
}

export async function createPlayer(input: {
  name: string;
  level: PadelLevel;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}): Promise<Player> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .insert({
      name: input.name,
      level: input.level,
      elo_rating: DEFAULT_ELO_BY_LEVEL[input.level],
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Player;
}
