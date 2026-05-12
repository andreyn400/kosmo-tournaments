"use server";

import { revalidatePath } from "next/cache";
import { deleteOrganizer } from "@/lib/queries/organizers";

export async function deleteOrganizerAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    await deleteOrganizer(id);
    revalidatePath("/ops/organizers");
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Не удалось удалить организатора.",
    };
  }
}
