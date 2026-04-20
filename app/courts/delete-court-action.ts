"use server";

import { revalidatePath } from "next/cache";
import { countTournamentsUsingCourt, deleteCourt } from "@/lib/queries/courts";

export async function deleteCourtAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    const refs = await countTournamentsUsingCourt(id);
    if (refs > 0) {
      return {
        error: `Корт используется в ${refs} ${refs === 1 ? "турнире" : "турнирах"}. Удаление недоступно.`,
      };
    }
    await deleteCourt(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось удалить корт." };
  }

  revalidatePath("/courts");
  revalidatePath("/tournament/new");
  revalidatePath("/league/new");
  return {};
}
