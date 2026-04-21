import { createClient } from "../supabase/server";
import { DEFAULT_ELO_BY_LEVEL } from "../constants";
import type {
  DominantHand,
  Gender,
  MembershipStatus,
  PadelLevel,
  Player,
} from "../types";

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

export interface PlayerProfileInput {
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  photo_url?: string | null;
  membership_status?: MembershipStatus;
  dominant_hand?: DominantHand | null;
}

export async function createPlayer(
  input: { name: string; level: PadelLevel } & PlayerProfileInput,
): Promise<Player> {
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
      gender: input.gender ?? null,
      date_of_birth: input.date_of_birth ?? null,
      nationality: input.nationality ?? null,
      photo_url: input.photo_url ?? null,
      membership_status: input.membership_status ?? "guest",
      dominant_hand: input.dominant_hand ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Player;
}

export async function updatePlayer(
  id: string,
  input: { name: string; level: PadelLevel } & PlayerProfileInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("players")
    .update({
      name: input.name,
      level: input.level,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      gender: input.gender ?? null,
      date_of_birth: input.date_of_birth ?? null,
      nationality: input.nationality ?? null,
      photo_url: input.photo_url ?? null,
      membership_status: input.membership_status ?? "guest",
      dominant_hand: input.dominant_hand ?? null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
