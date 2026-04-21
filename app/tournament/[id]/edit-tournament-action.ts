"use server";

import { revalidatePath } from "next/cache";
import {
  getTournament,
  updateTournament,
} from "@/lib/queries/tournaments";
import { listActiveCourts } from "@/lib/queries/courts";
import { normalizeTime } from "@/lib/time-slots";
import { PADEL_LEVELS } from "@/lib/constants";
import type { PadelLevel } from "@/lib/types";

export interface EditTournamentInput {
  tournamentId: string;
  name: string;
  courtIds: string[];
  startTime: string | null;
  durationHours: number;
  levelMin: string | null;
  levelMax: string | null;
  maxPlayers: number | null;
  entryFee: number;
  prizeDescription: string | null;
  notes: string | null;
}

function parseLevel(v: string | null): PadelLevel | null {
  if (!v) return null;
  return (PADEL_LEVELS as string[]).includes(v) ? (v as PadelLevel) : null;
}

export async function editTournamentAction(
  input: EditTournamentInput,
): Promise<{ error?: string }> {
  const tournament = await getTournament(input.tournamentId);
  if (!tournament) return { error: "Турнир не найден" };

  const name = input.name.trim();
  if (!name) return { error: "Введите название" };
  if (name.length > 120) return { error: "Название слишком длинное" };

  if (input.courtIds.length === 0)
    return { error: "Выберите хотя бы один корт" };

  const activeCourts = await listActiveCourts();
  const activeIds = new Set(activeCourts.map((c) => c.id));
  const validCourtIds = input.courtIds.filter((id) => activeIds.has(id));
  if (validCourtIds.length === 0)
    return { error: "Выбранные корты больше не активны" };

  let startTime: string | null = null;
  if (input.startTime) {
    const normalized = normalizeTime(input.startTime);
    if (!normalized) return { error: "Неверное время начала" };
    startTime = normalized;
  }

  if (
    !Number.isFinite(input.durationHours) ||
    input.durationHours < 1 ||
    input.durationHours > 12
  ) {
    return { error: "Длительность должна быть от 1 до 12 часов" };
  }

  if (!Number.isFinite(input.entryFee) || input.entryFee < 0) {
    return { error: "Взнос не может быть отрицательным" };
  }

  if (input.maxPlayers != null) {
    if (
      !Number.isFinite(input.maxPlayers) ||
      input.maxPlayers < 4 ||
      input.maxPlayers % 4 !== 0
    ) {
      return { error: "Макс. игроков должно быть кратно 4 и не меньше 4" };
    }
  }

  const level_min = parseLevel(input.levelMin);
  const level_max = parseLevel(input.levelMax);

  try {
    await updateTournament(input.tournamentId, {
      name,
      court_ids: validCourtIds,
      start_time: startTime,
      duration_hours: input.durationHours,
      level_min,
      level_max,
      max_players: input.maxPlayers,
      entry_fee: input.entryFee,
      prize_description:
        input.prizeDescription && input.prizeDescription.trim()
          ? input.prizeDescription.trim()
          : null,
      notes: input.notes && input.notes.trim() ? input.notes.trim() : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось сохранить: ${msg}` };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
