"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTournament } from "@/lib/queries/tournaments";
import { checkCourtConflicts, listActiveCourts } from "@/lib/queries/courts";
import { normalizeTime } from "@/lib/time-slots";
import { PADEL_LEVELS } from "@/lib/constants";
import {
  DEFAULT_SCORING_SYSTEM,
  SCORING_SYSTEMS,
} from "@/lib/scoring-systems";
import type {
  PadelLevel,
  ScoringSystem,
  TournamentFormat,
  TournamentType,
} from "@/lib/types";

export interface CreateTournamentState {
  error?: string;
}

const FORMATS: TournamentFormat[] = [
  "americano",
  "team_americano",
  "mexicano",
  "team_mexicano",
  "round_robin",
  "escalera",
];

const TYPES: TournamentType[] = ["one_day", "league_season"];

function asInt(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function asLevel(raw: FormDataEntryValue | null): PadelLevel | null {
  if (!raw) return null;
  const s = String(raw);
  return (PADEL_LEVELS as string[]).includes(s) ? (s as PadelLevel) : null;
}

export async function createTournamentAction(
  _prev: CreateTournamentState,
  formData: FormData,
): Promise<CreateTournamentState> {
  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "one_day");
  const formatRaw = String(formData.get("format") ?? "americano");
  const scoringRaw = String(
    formData.get("scoring_system") ?? DEFAULT_SCORING_SYSTEM,
  );
  const date_start = String(formData.get("date_start") ?? "").trim();
  const date_end_raw = String(formData.get("date_end") ?? "").trim();
  const level_min = asLevel(formData.get("level_min"));
  const level_max = asLevel(formData.get("level_max"));
  const max_players = asInt(formData.get("max_players"));
  const duration_hours = asInt(formData.get("duration_hours")) ?? 2;
  const entry_fee = asInt(formData.get("entry_fee")) ?? 0;
  const prize = String(formData.get("prize_description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const court_ids = formData.getAll("court_ids").map((v) => String(v));
  const start_time_raw = String(formData.get("start_time") ?? "").trim();
  const start_time = start_time_raw ? normalizeTime(start_time_raw) : null;
  if (start_time_raw && start_time === null)
    return { error: "Неверное время начала" };

  if (!name) return { error: "Введите название турнира" };
  if (!TYPES.includes(typeRaw as TournamentType))
    return { error: "Неизвестный тип турнира" };
  if (!FORMATS.includes(formatRaw as TournamentFormat))
    return { error: "Неизвестный формат" };
  if (!SCORING_SYSTEMS.includes(scoringRaw as ScoringSystem))
    return { error: "Неизвестная система счёта" };
  if (!date_start) return { error: "Выберите дату начала" };
  if (date_end_raw && date_end_raw < date_start)
    return { error: "Дата окончания раньше даты начала" };
  if (max_players != null && max_players < 4)
    return { error: "Минимум 4 игрока" };
  if (max_players != null && max_players % 4 !== 0)
    return { error: "Число игроков должно быть кратно 4" };
  if (duration_hours < 1 || duration_hours > 12)
    return { error: "Длительность должна быть от 1 до 12 часов" };

  if (court_ids.length === 0)
    return { error: "Выберите хотя бы один корт" };

  const activeCourts = await listActiveCourts();
  const activeIds = new Set(activeCourts.map((c) => c.id));
  const validCourtIds = court_ids.filter((id) => activeIds.has(id));
  if (validCourtIds.length === 0)
    return { error: "Выбранные корты больше не активны" };

  if (max_players != null) {
    const courtsNeeded = Math.ceil(max_players / 4);
    if (validCourtIds.length < courtsNeeded) {
      return {
        error: `Для ${max_players} игроков необходимо минимум ${courtsNeeded} ${courtsNeeded === 1 ? "корт" : courtsNeeded < 5 ? "корта" : "кортов"}`,
      };
    }
  }

  if (start_time) {
    const conflicts = await checkCourtConflicts({
      courtIds: validCourtIds,
      date: date_start,
      startTime: start_time,
      durationHours: duration_hours,
    });
    if (conflicts.length > 0) {
      const c = conflicts[0];
      const courtLabel = c.courtNumbers.map((n) => `К${n}`).join(", ");
      return {
        error: `Конфликт кортов: ${courtLabel} уже занят турниром «${c.tournamentName}» в это время`,
      };
    }
  }

  let created;
  try {
    created = await createTournament({
      name,
      type: typeRaw as TournamentType,
      format: formatRaw as TournamentFormat,
      date_start,
      date_end: date_end_raw || null,
      level_min,
      level_max,
      max_players,
      entry_fee,
      prize_description: prize || null,
      notes: notes || null,
      court_ids: validCourtIds,
      start_time,
      scoring_system: scoringRaw as ScoringSystem,
      duration_hours,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Ошибка сохранения: ${msg}` };
  }

  revalidatePath("/");
  redirect(`/tournament/${created.id}`);
}
