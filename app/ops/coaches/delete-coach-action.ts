"use server";

import { revalidatePath } from "next/cache";
import { deleteCoach } from "@/lib/queries/coaches";

export async function deleteCoachAction(
  id: string,
): Promise<{ error?: string }> {
  if (!id) return { error: "Тренер не найден." };
  try {
    await deleteCoach(id);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить тренера.",
    };
  }
  revalidatePath("/ops/coaches");
  return {};
}
