import { createClient } from "./supabase/server";
import { finalizeSessionElo } from "./session-finalization";

export async function finalizeTournamentElo(
  tournamentId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: sessionRows, error: sessionErr } = await supabase
    .from("tournament_sessions")
    .select("id")
    .eq("tournament_id", tournamentId)
    .order("session_number", { ascending: true });
  if (sessionErr) throw new Error(sessionErr.message);
  const sessions = sessionRows ?? [];
  if (sessions.length === 0) return;

  for (const s of sessions) {
    await finalizeSessionElo({ sessionId: s.id, tournamentId });
  }
}
