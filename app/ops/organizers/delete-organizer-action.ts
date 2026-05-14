"use server";

import { revalidatePath } from "next/cache";
import { deleteOrganizer } from "@/lib/queries/organizers";
import { getServerDict } from "@/lib/i18n/server";

export async function deleteOrganizerAction(
  id: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deleteOrganizer(id);
    revalidatePath("/ops/organizers");
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.delete.organizer"],
    };
  }
}
