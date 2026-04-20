import { createClient } from "../supabase/server";
import type { TournamentSession, SessionStatus } from "../types";

export async function createSession(input: {
  tournament_id: string;
  session_date: string;
  session_number?: number;
  status?: SessionStatus;
}): Promise<TournamentSession> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_sessions")
    .insert({
      tournament_id: input.tournament_id,
      session_date: input.session_date,
      session_number: input.session_number ?? 1,
      status: input.status ?? "in_progress",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as TournamentSession;
}

export async function createSessionsForDates(input: {
  tournament_id: string;
  dates: string[];
  default_start_time?: string | null;
}): Promise<TournamentSession[]> {
  if (input.dates.length === 0) return [];
  const supabase = await createClient();
  const rows = input.dates.map((date, idx) => ({
    tournament_id: input.tournament_id,
    session_date: date,
    session_number: idx + 1,
    status: "scheduled" as const,
    start_time: input.default_start_time ?? null,
  }));
  const { data, error } = await supabase
    .from("tournament_sessions")
    .insert(rows)
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as TournamentSession[];
}

export async function updateSessionStartTime(
  sessionId: string,
  startTime: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_sessions")
    .update({ start_time: startTime })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function getSession(
  sessionId: string,
): Promise<TournamentSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TournamentSession | null) ?? null;
}

export async function listSessionsByTournament(
  tournamentId: string,
): Promise<TournamentSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_sessions")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("session_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TournamentSession[];
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_sessions")
    .update({ status })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}
