"use server";

import { revalidatePath } from "next/cache";
import { createPlayer } from "@/lib/queries/players";
import type { PlayerFormValues } from "./PlayerFields";
import { parsePlayerForm } from "./parse-player-form";

export async function createPlayerAction(
  input: PlayerFormValues,
): Promise<{ error?: string }> {
  const parsed = parsePlayerForm(input);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await createPlayer(parsed.value);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось создать игрока: ${msg}` };
  }

  revalidatePath("/players");
  return {};
}
