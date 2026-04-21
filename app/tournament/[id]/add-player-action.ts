"use server";

import { revalidatePath } from "next/cache";
import {
  createRegistration,
  listRegistrationsByDivision,
} from "@/lib/queries/registrations";
import { getDivision } from "@/lib/queries/divisions";

export async function addPlayerAction(input: {
  tournamentId: string;
  playerId: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
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
    await createRegistration({
      tournament_id: input.tournamentId,
      player_id: input.playerId,
      division_id: input.divisionId ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось добавить игрока: ${msg}` };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  if (input.divisionId) {
    revalidatePath(
      `/tournament/${input.tournamentId}/division/${input.divisionId}`,
    );
  }
  return {};
}
