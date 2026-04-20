import { startSession } from "./start-session";
import type { Pair } from "./algorithms/teamAmericano";
import { createClient } from "./supabase/server";
import type { Tournament } from "./types";

export async function startTournament(
  tournament: Tournament,
  playerIds: string[],
  pairs?: ReadonlyArray<Pair>,
): Promise<{ sessionId: string; firstRoundId: string }> {
  const supabase = await createClient();

  const { data: session, error: sessionErr } = await supabase
    .from("tournament_sessions")
    .insert({
      tournament_id: tournament.id,
      session_date: tournament.date_start,
      session_number: 1,
      status: "scheduled",
    })
    .select("*")
    .single();
  if (sessionErr) throw new Error(sessionErr.message);

  const { firstRoundId } = await startSession({
    tournament,
    sessionId: session.id,
    playerIds,
    pairs,
  });

  const { error: tournamentErr } = await supabase
    .from("tournaments")
    .update({ status: "in_progress" })
    .eq("id", tournament.id);
  if (tournamentErr) throw new Error(tournamentErr.message);

  return { sessionId: session.id, firstRoundId };
}
