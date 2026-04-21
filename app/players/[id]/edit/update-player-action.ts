"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updatePlayer } from "@/lib/queries/players";
import type { PlayerFormValues } from "../../PlayerFields";
import { parsePlayerForm } from "../../parse-player-form";

export async function updatePlayerAction(
  id: string,
  input: PlayerFormValues,
): Promise<{ error?: string }> {
  const parsed = parsePlayerForm(input);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await updatePlayer(id, parsed.value);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось сохранить: ${msg}` };
  }

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  redirect(`/players/${id}`);
}
