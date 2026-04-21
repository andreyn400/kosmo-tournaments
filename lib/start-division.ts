import { startSession } from "./start-session";
import type { Pair } from "./algorithms/teamAmericano";
import { createClient } from "./supabase/server";
import type { Division, Tournament, TournamentSession } from "./types";

export async function startDivision(input: {
  tournament: Tournament;
  division: Division;
  playerIds: string[];
  pairs?: ReadonlyArray<Pair>;
}): Promise<{ sessionId: string; firstRoundId: string }> {
  const { tournament, division, playerIds, pairs } = input;
  const supabase = await createClient();

  const { data: existing, error: existingErr } = await supabase
    .from("tournament_sessions")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("session_number", { ascending: true })
    .limit(1);
  if (existingErr) throw new Error(existingErr.message);

  let session: TournamentSession | null =
    (existing?.[0] as TournamentSession | undefined) ?? null;

  if (!session) {
    const { data: created, error: createErr } = await supabase
      .from("tournament_sessions")
      .insert({
        tournament_id: tournament.id,
        session_date: tournament.date_start,
        session_number: 1,
        status: "scheduled",
      })
      .select("*")
      .single();
    if (createErr) throw new Error(createErr.message);
    session = created as TournamentSession;
  }

  const { firstRoundId } = await startSession({
    tournament,
    sessionId: session.id,
    playerIds,
    pairs,
    division,
  });

  const { error: divErr } = await supabase
    .from("divisions")
    .update({ status: "in_progress" })
    .eq("id", division.id);
  if (divErr) throw new Error(divErr.message);

  if (tournament.status !== "in_progress") {
    const { error: tErr } = await supabase
      .from("tournaments")
      .update({ status: "in_progress" })
      .eq("id", tournament.id);
    if (tErr) throw new Error(tErr.message);
  }

  return { sessionId: session.id, firstRoundId };
}
