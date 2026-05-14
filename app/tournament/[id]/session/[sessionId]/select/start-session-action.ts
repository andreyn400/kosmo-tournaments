"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getTournament,
  updateTournamentStatus,
} from "@/lib/queries/tournaments";
import { checkCourtConflicts } from "@/lib/queries/courts";
import { getSession, updateSessionStartTime } from "@/lib/queries/sessions";
import { listRegistrations } from "@/lib/queries/registrations";
import { startSession } from "@/lib/start-session";
import { normalizeTime } from "@/lib/time-slots";
import { getServerDict } from "@/lib/i18n/server";

export interface StartSessionState {
  error?: string;
}

export async function startSessionAction(
  _prev: StartSessionState,
  formData: FormData,
): Promise<StartSessionState> {
  const dict = await getServerDict();
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const rawIds = formData.getAll("player_ids").map((v) => String(v));
  const startTimeRaw = String(formData.get("start_time") ?? "").trim();
  const startTime = startTimeRaw ? normalizeTime(startTimeRaw) : null;
  if (startTimeRaw && startTime === null) {
    return { error: dict["error.invalid.start_time"] };
  }

  if (!tournamentId || !sessionId) {
    return { error: dict["error.missing_ids"] };
  }

  const tournament = await getTournament(tournamentId);
  if (!tournament) return { error: dict["error.not_found.tournament"] };
  if (tournament.type !== "league_season") {
    return { error: dict["error.state.league_only"] };
  }

  const session = await getSession(sessionId);
  if (!session) return { error: dict["error.not_found.session"] };
  if (session.tournament_id !== tournamentId) {
    return { error: dict["error.state.session_not_in_league"] };
  }
  if (session.status !== "scheduled") {
    return { error: dict["error.state.session_already_running"] };
  }

  const playerIds = [...new Set(rawIds.filter(Boolean))];
  if (playerIds.length < 4 || playerIds.length % 4 !== 0) {
    return {
      error: dict["error.players.choose_multiple_of_4"].replace(
        "{n}",
        String(playerIds.length),
      ),
    };
  }

  const registrations = await listRegistrations(tournamentId);
  const registered = new Set(registrations.map((r) => r.player_id));
  for (const id of playerIds) {
    if (!registered.has(id)) {
      return { error: dict["error.player.not_in_league"] };
    }
  }

  const effectiveStartTime = startTime ?? tournament.start_time;
  if (effectiveStartTime && tournament.court_ids.length > 0) {
    const conflicts = await checkCourtConflicts({
      courtIds: tournament.court_ids,
      date: session.session_date,
      startTime: effectiveStartTime,
      durationHours: tournament.duration_hours,
      excludeTournamentId: tournamentId,
    });
    if (conflicts.length > 0) {
      const c = conflicts[0];
      const courtPrefix = dict["tournament.card.court_short_prefix"];
      const courtLabel = c.courtNumbers
        .map((n) => `${courtPrefix}${n}`)
        .join(", ");
      return {
        error: dict["error.courts.conflict_with_tournament"]
          .replace("{courts}", courtLabel)
          .replace("{name}", c.tournamentName),
      };
    }
  }

  try {
    await updateSessionStartTime(sessionId, startTime);

    await startSession({
      tournament,
      sessionId,
      playerIds,
    });

    if (tournament.status !== "in_progress") {
      await updateTournamentStatus(tournamentId, "in_progress");
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.start_session_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }

  revalidatePath("/");
  revalidatePath(`/tournament/${tournamentId}`);
  redirect(`/tournament/${tournamentId}/play`);
}
