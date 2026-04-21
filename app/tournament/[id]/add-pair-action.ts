"use server";

import { revalidatePath } from "next/cache";
import {
  createRegistrationPair,
  listRegistrationsByDivision,
} from "@/lib/queries/registrations";
import { getDivision } from "@/lib/queries/divisions";

export async function addPairAction(input: {
  tournamentId: string;
  playerAId: string;
  playerBId: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  if (!input.playerAId || !input.playerBId) {
    return { error: "Выберите обоих игроков" };
  }
  if (input.playerAId === input.playerBId) {
    return { error: "Игрок не может быть в паре сам с собой" };
  }
  try {
    if (input.divisionId) {
      const div = await getDivision(input.divisionId);
      if (!div) return { error: "Дивизион не найден" };
      if (div.max_players) {
        const existing = await listRegistrationsByDivision(input.divisionId);
        if (existing.length + 2 > div.max_players) {
          return {
            error: `Нельзя добавить пару: лимит ${div.max_players} игроков`,
          };
        }
      }
    }
    await createRegistrationPair({
      tournament_id: input.tournamentId,
      player_a: input.playerAId,
      player_b: input.playerBId,
      division_id: input.divisionId ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось добавить пару: ${msg}` };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  if (input.divisionId) {
    revalidatePath(
      `/tournament/${input.tournamentId}/division/${input.divisionId}`,
    );
  }
  return {};
}
