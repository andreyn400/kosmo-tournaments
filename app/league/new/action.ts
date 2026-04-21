"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTournament } from "@/lib/queries/tournaments";
import { listActiveCourts } from "@/lib/queries/courts";
import { createLeagueSeason } from "@/lib/queries/league-seasons";
import { createSessionsForDates } from "@/lib/queries/sessions";
import { normalizeTime } from "@/lib/time-slots";
import {
  DEFAULT_POINTS_TABLE,
  type PointsTable,
} from "@/lib/league-points";
import { PADEL_LEVELS } from "@/lib/constants";
import {
  DEFAULT_SCORING_SYSTEM,
  SCORING_SYSTEMS,
} from "@/lib/scoring-systems";
import type {
  PadelLevel,
  ScoringSystem,
  TournamentFormat,
} from "@/lib/types";

export interface CreateLeagueState {
  error?: string;
}

const INDIVIDUAL_FORMATS: TournamentFormat[] = [
  "americano",
  "mexicano",
  "round_robin",
];

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

function parseDates(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((d) => d.trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
}

export async function createLeagueAction(
  _prev: CreateLeagueState,
  formData: FormData,
): Promise<CreateLeagueState> {
  const name = String(formData.get("name") ?? "").trim();
  const formatRaw = String(formData.get("format") ?? "americano");
  const scoringRaw = String(
    formData.get("scoring_system") ?? DEFAULT_SCORING_SYSTEM,
  );
  const sessionDates = parseDates(formData.get("session_dates"));
  const finalsDateRaw = String(formData.get("finals_date") ?? "").trim();
  const level_min = asLevel(formData.get("level_min"));
  const level_max = asLevel(formData.get("level_max"));
  const max_players = asInt(formData.get("max_players"));
  const qualification_spots =
    asInt(formData.get("qualification_spots")) ?? 8;
  const duration_hours = asInt(formData.get("duration_hours")) ?? 2;
  const entry_fee = asInt(formData.get("entry_fee")) ?? 0;
  const prize = String(formData.get("prize_description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const court_ids = formData.getAll("court_ids").map((v) => String(v));
  const default_start_time_raw = String(
    formData.get("default_start_time") ?? "",
  ).trim();
  const default_start_time = default_start_time_raw
    ? normalizeTime(default_start_time_raw)
    : null;
  if (default_start_time_raw && default_start_time === null)
    return { error: "Неверное время начала сессий" };

  if (!name) return { error: "Введите название лиги" };
  if (!INDIVIDUAL_FORMATS.includes(formatRaw as TournamentFormat)) {
    return {
      error:
        "Для лиги сейчас доступны только индивидуальные форматы (Американо, Мексикано, Круговой).",
    };
  }
  if (!SCORING_SYSTEMS.includes(scoringRaw as ScoringSystem))
    return { error: "Неизвестная система счёта" };
  if (sessionDates.length < 1)
    return { error: "Добавьте хотя бы одну дату сессии" };
  if (max_players != null && (max_players < 4 || max_players % 4 !== 0))
    return { error: "Макс. игроков должно быть кратно 4" };
  if (![2, 4, 8, 16, 32].includes(qualification_spots))
    return {
      error: "Квалификационных мест должно быть степенью двойки: 2, 4, 8, 16 или 32",
    };
  if (duration_hours < 1 || duration_hours > 12)
    return { error: "Длительность должна быть от 1 до 12 часов" };

  if (court_ids.length === 0)
    return { error: "Выберите хотя бы один корт" };

  const activeCourts = await listActiveCourts();
  const activeIds = new Set(activeCourts.map((c) => c.id));
  const validCourtIds = court_ids.filter((id) => activeIds.has(id));
  if (validCourtIds.length === 0)
    return { error: "Выбранные корты больше не активны" };

  const sortedDates = [...sessionDates].sort();
  const date_start = sortedDates[0];
  const date_end = sortedDates[sortedDates.length - 1] ?? null;

  const pointsTable: PointsTable = DEFAULT_POINTS_TABLE;

  let tournament;
  try {
    tournament = await createTournament({
      name,
      type: "league_season",
      format: formatRaw as TournamentFormat,
      date_start,
      date_end,
      level_min,
      level_max,
      max_players,
      entry_fee,
      prize_description: prize || null,
      notes: notes || null,
      court_ids: validCourtIds,
      start_time: default_start_time,
      scoring_system: scoringRaw as ScoringSystem,
      duration_hours,
    });

    await createLeagueSeason({
      tournament_id: tournament.id,
      session_dates: sortedDates,
      points_table: pointsTable,
      qualification_spots,
      finals_date: finalsDateRaw || null,
    });

    await createSessionsForDates({
      tournament_id: tournament.id,
      dates: sortedDates,
      default_start_time,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Ошибка сохранения: ${msg}` };
  }

  revalidatePath("/");
  redirect(`/tournament/${tournament.id}`);
}
