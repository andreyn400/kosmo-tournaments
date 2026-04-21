import { createClient } from "../supabase/server";
import type { Round } from "../types";

export async function createRound(input: {
  session_id: string;
  round_number: number;
  division_id?: string | null;
  status?: Round["status"];
}): Promise<Round> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rounds")
    .insert({
      session_id: input.session_id,
      division_id: input.division_id ?? null,
      round_number: input.round_number,
      status: input.status ?? "pending",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Round;
}

export async function listRoundsBySession(sessionId: string): Promise<Round[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("session_id", sessionId)
    .order("round_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Round[];
}

export async function listRoundsByDivision(
  divisionId: string,
): Promise<Round[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("division_id", divisionId)
    .order("round_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Round[];
}

export async function updateRoundStatus(
  id: string,
  status: Round["status"],
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rounds")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
