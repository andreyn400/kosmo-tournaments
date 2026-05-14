"use server";

import { revalidatePath } from "next/cache";
import { deleteCoach } from "@/lib/queries/coaches";
import { getServerDict } from "@/lib/i18n/server";

export async function deleteCoachAction(
  id: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  if (!id) return { error: dict["error.not_found.coach"] };
  try {
    await deleteCoach(id);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.delete.coach"],
    };
  }
  revalidatePath("/ops/coaches");
  return {};
}
