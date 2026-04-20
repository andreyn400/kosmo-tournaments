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

export interface StartSessionState {
  error?: string;
}

export async function startSessionAction(
  _prev: StartSessionState,
  formData: FormData,
): Promise<StartSessionState> {
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const rawIds = formData.getAll("player_ids").map((v) => String(v));
  const startTimeRaw = String(formData.get("start_time") ?? "").trim();
  const startTime = startTimeRaw ? normalizeTime(startTimeRaw) : null;
  if (startTimeRaw && startTime === null) {
    return { error: "Неверное время начала" };
  }

  if (!tournamentId || !sessionId) {
    return { error: "Не хватает идентификаторов" };
  }

  const tournament = await getTournament(tournamentId);
  if (!tournament) return { error: "Турнир не найден" };
  if (tournament.type !== "league_season") {
    return { error: "Этот экран только для лиги" };
  }

  const session = await getSession(sessionId);
  if (!session) return { error: "Сессия не найдена" };
  if (session.tournament_id !== tournamentId) {
    return { error: "Сессия не принадлежит этой лиге" };
  }
  if (session.status !== "scheduled") {
    return { error: "Сессия уже запущена или завершена" };
  }

  const playerIds = [...new Set(rawIds.filter(Boolean))];
  if (playerIds.length < 4 || playerIds.length % 4 !== 0) {
    return {
      error: `Выберите игроков, кратно 4 (сейчас: ${playerIds.length})`,
    };
  }

  const registrations = await listRegistrations(tournamentId);
  const registered = new Set(registrations.map((r) => r.player_id));
  for (const id of playerIds) {
    if (!registered.has(id)) {
      return { error: "Выбран игрок, не состоящий в лиге" };
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
      const courtLabel = c.courtNumbers.map((n) => `К${n}`).join(", ");
      return {
        error: `Конфликт кортов: ${courtLabel} уже занят турниром «${c.tournamentName}» в это время`,
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
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось запустить сессию: ${msg}` };
  }

  revalidatePath("/");
  revalidatePath(`/tournament/${tournamentId}`);
  redirect(`/tournament/${tournamentId}/play`);
}
