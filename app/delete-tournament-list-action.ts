"use server";

import { revalidatePath } from "next/cache";
import { deleteTournament } from "@/lib/queries/tournaments";
import { getServerDict } from "@/lib/i18n/server";

export async function deleteTournamentListAction(
  tournamentId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deleteTournament(tournamentId);
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.delete_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }

  revalidatePath("/");
  return {};
}
