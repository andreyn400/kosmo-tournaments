"use server";

import { revalidatePath } from "next/cache";
import {
  getLeagueSeason,
  updateFinalsConfig,
} from "@/lib/queries/league-seasons";
import { SCORING_SYSTEMS } from "@/lib/scoring-systems";
import { getServerDict } from "@/lib/i18n/server";
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
  const dict = await getServerDict();
  const league = await getLeagueSeason(input.tournamentId);
  if (!league) return { error: dict["error.not_found.league_season"] };

  if (![2, 4, 8, 16, 32].includes(input.qualificationSpots)) {
    return { error: dict["error.invalid.qualification_spots_power_of_2"] };
  }

  if (!SCORING_SYSTEMS.includes(input.finalsScoringSystem as ScoringSystem)) {
    return { error: dict["error.invalid.finals_scoring_unknown"] };
  }

  if (
    input.finalsDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(input.finalsDate)
  ) {
    return { error: dict["error.invalid.finals_date_format"] };
  }

  try {
    await updateFinalsConfig(league.id, {
      qualification_spots: input.qualificationSpots,
      finals_date: input.finalsDate,
      finals_scoring_system: input.finalsScoringSystem as ScoringSystem,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.save_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
