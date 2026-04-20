"use server";

import { revalidatePath } from "next/cache";
import { createRegistration } from "@/lib/queries/registrations";

export async function addPlayerAction(input: {
  tournamentId: string;
  playerId: string;
}): Promise<{ error?: string }> {
  try {
    await createRegistration({
      tournament_id: input.tournamentId,
      player_id: input.playerId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось добавить игрока: ${msg}` };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
