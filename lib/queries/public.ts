import { createClient } from "../supabase/server";
import { listRegistrations } from "./registrations";
import { listSessionsByTournament } from "./sessions";
import { listRoundsBySession } from "./rounds";
import { listMatchesByRound } from "./matches";
import { listPlayers } from "./players";
import { getLeagueSeason, type LeagueSeason } from "./league-seasons";
import { listRatingHistoryByTournament } from "./rating-history";
import type {
  Match,
  Player,
  RatingHistoryEntry,
  Round,
  Tournament,
  TournamentSession,
} from "../types";
import type { RegistrationWithPlayer } from "./registrations";

export async function getTournamentByShortCode(
  code: string,
): Promise<Tournament | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("short_code", code)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Tournament | null) ?? null;
}

export interface PublicTournamentView {
  tournament: Tournament;
  registrations: RegistrationWithPlayer[];
  sessions: TournamentSession[];
  activeSession: TournamentSession | null;
  activeRounds: Round[];
  activeMatches: Match[];
  allCompletedMatches: Match[];
  players: Player[];
  ratingHistory: RatingHistoryEntry[];
  leagueSeason: LeagueSeason | null;
  leagueSessionMatches: Array<{
    session: TournamentSession;
    matches: Match[];
  }>;
}

export async function getPublicTournamentView(
  tournament: Tournament,
): Promise<PublicTournamentView> {
  const [registrations, sessions, leagueSeason, ratingHistory, players] =
    await Promise.all([
      listRegistrations(tournament.id),
      listSessionsByTournament(tournament.id),
      tournament.type === "league_season"
        ? getLeagueSeason(tournament.id)
        : Promise.resolve(null),
      tournament.status === "completed"
        ? listRatingHistoryByTournament(tournament.id)
        : Promise.resolve([]),
      listPlayers(),
    ]);

  const activeSession =
    sessions.find((s) => s.status === "in_progress") ??
    (tournament.type === "one_day"
      ? (sessions[sessions.length - 1] ?? null)
      : null);

  const activeRounds = activeSession
    ? await listRoundsBySession(activeSession.id)
    : [];
  const activeMatches = activeRounds.length
    ? (await Promise.all(activeRounds.map((r) => listMatchesByRound(r.id)))).flat()
    : [];

  let leagueSessionMatches: Array<{ session: TournamentSession; matches: Match[] }> = [];
  let allCompletedMatches: Match[] = [];

  if (tournament.type === "league_season") {
    const perSession = await Promise.all(
      sessions.map(async (session) => {
        const rounds = await listRoundsBySession(session.id);
        const matches = rounds.length
          ? (await Promise.all(rounds.map((r) => listMatchesByRound(r.id)))).flat()
          : [];
        return { session, matches };
      }),
    );
    leagueSessionMatches = perSession;
    allCompletedMatches = perSession
      .flatMap(({ matches }) => matches)
      .filter((m) => m.status === "completed");
  } else if (tournament.status === "completed" || tournament.status === "in_progress") {
    allCompletedMatches = activeMatches.filter((m) => m.status === "completed");
  }

  return {
    tournament,
    registrations,
    sessions,
    activeSession,
    activeRounds,
    activeMatches,
    allCompletedMatches,
    players,
    ratingHistory,
    leagueSeason,
    leagueSessionMatches,
  };
}
