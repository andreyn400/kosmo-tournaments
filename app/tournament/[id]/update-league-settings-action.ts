"use server";

import { revalidatePath } from "next/cache";
import {
  getLeagueSeason,
  updateFinalsConfig,
} from "@/lib/queries/league-seasons";
import { SCORING_SYSTEMS } from "@/lib/scoring-systems";
import type { ScoringSystem } from "@/lib/types";

export interface UpdateLeagueSettingsInput {
  tournamentId: string;
  qualificationSpots: number;
  finalsDate: string | null;
  finalsScoringSystem: string;
}

export async function updateLeagueSettingsAction(
  input: UpdateLeagueSettingsInput,
): Promise<{ error?: string }> {
  const league = await getLeagueSeason(input.tournamentId);
  if (!league) return { error: "Сезон лиги не найден" };

  if (![2, 4, 8, 16, 32].includes(input.qualificationSpots)) {
    return {
      error: "Квалификационных мест должно быть степенью двойки: 2, 4, 8, 16 или 32",
    };
  }

  if (!SCORING_SYSTEMS.includes(input.finalsScoringSystem as ScoringSystem)) {
    return { error: "Неизвестная система счёта финала" };
  }

  if (
    input.finalsDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(input.finalsDate)
  ) {
    return { error: "Неверный формат даты финала" };
  }

  try {
    await updateFinalsConfig(league.id, {
      qualification_spots: input.qualificationSpots,
      finals_date: input.finalsDate,
      finals_scoring_system: input.finalsScoringSystem as ScoringSystem,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось сохранить: ${msg}` };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
