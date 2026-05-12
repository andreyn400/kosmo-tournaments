"use server";

import { revalidatePath } from "next/cache";
import { updateCoach } from "@/lib/queries/coaches";
import { validateCoachInput, type RawCoachInput } from "./coach-input";

export async function updateCoachAction(
  id: string,
  raw: RawCoachInput,
): Promise<{ error?: string }> {
  if (!id) return { error: "Тренер не найден." };
  const v = validateCoachInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    await updateCoach(id, v.value);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось обновить тренера.",
    };
  }

  revalidatePath("/ops/coaches");
  revalidatePath(`/ops/coaches/${id}`);
  return {};
}
