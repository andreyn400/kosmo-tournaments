"use server";

import { revalidatePath } from "next/cache";
import { createRegistrationPair } from "@/lib/queries/registrations";

export async function addPairAction(input: {
  tournamentId: string;
  playerAId: string;
  playerBId: string;
}): Promise<{ error?: string }> {
  if (!input.playerAId || !input.playerBId) {
    return { error: "Выберите обоих игроков" };
  }
  if (input.playerAId === input.playerBId) {
    return { error: "Игрок не может быть в паре сам с собой" };
  }
  try {
    await createRegistrationPair({
      tournament_id: input.tournamentId,
      player_a: input.playerAId,
      player_b: input.playerBId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось добавить пару: ${msg}` };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
