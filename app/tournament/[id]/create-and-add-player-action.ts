"use server";

import { revalidatePath } from "next/cache";
import { createPlayer } from "@/lib/queries/players";
import {
  createRegistration,
  listRegistrationsByDivision,
} from "@/lib/queries/registrations";
import { getDivision } from "@/lib/queries/divisions";
import { PADEL_LEVELS } from "@/lib/constants";
import type { PadelLevel } from "@/lib/types";

export async function createAndAddPlayerAction(input: {
  tournamentId: string;
  name: string;
  level: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Введите имя игрока" };
  if (!(PADEL_LEVELS as string[]).includes(input.level))
    return { error: "Неизвестный уровень" };

  try {
    if (input.divisionId) {
      const div = await getDivision(input.divisionId);
      if (!div) return { error: "Дивизион не найден" };
      if (div.max_players) {
        const existing = await listRegistrationsByDivision(input.divisionId);
        if (existing.length >= div.max_players) {
          return {
            error: `Достигнут лимит игроков (${div.max_players}) в дивизионе`,
          };
        }
      }
    }
    const player = await createPlayer({
      name,
      level: input.level as PadelLevel,
    });
    await createRegistration({
      tournament_id: input.tournamentId,
      player_id: player.id,
      division_id: input.divisionId ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось создать игрока: ${msg}` };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  if (input.divisionId) {
    revalidatePath(
      `/tournament/${input.tournamentId}/division/${input.divisionId}`,
    );
  }
  return {};
}
