"use server";

import { revalidatePath } from "next/cache";
import { deleteTournament } from "@/lib/queries/tournaments";

export async function deleteTournamentListAction(
  tournamentId: string,
): Promise<{ error?: string }> {
  try {
    await deleteTournament(tournamentId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось удалить: ${msg}` };
  }

  revalidatePath("/");
  return {};
}
