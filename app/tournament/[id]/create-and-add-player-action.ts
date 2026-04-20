"use server";

import { revalidatePath } from "next/cache";
import { createPlayer } from "@/lib/queries/players";
import { createRegistration } from "@/lib/queries/registrations";
import { PADEL_LEVELS } from "@/lib/constants";
import type { PadelLevel } from "@/lib/types";

export async function createAndAddPlayerAction(input: {
  tournamentId: string;
  name: string;
  level: string;
}): Promise<{ error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Введите имя игрока" };
  if (!(PADEL_LEVELS as string[]).includes(input.level))
    return { error: "Неизвестный уровень" };

  try {
    const player = await createPlayer({
      name,
      level: input.level as PadelLevel,
    });
    await createRegistration({
      tournament_id: input.tournamentId,
      player_id: player.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось создать игрока: ${msg}` };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
