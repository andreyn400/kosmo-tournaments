"use server";

import { revalidatePath } from "next/cache";
import { createCoach } from "@/lib/queries/coaches";
import { validateCoachInput, type RawCoachInput } from "./coach-input";

export async function createCoachAction(
  raw: RawCoachInput,
): Promise<{ id?: string; error?: string }> {
  const v = validateCoachInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    const coach = await createCoach(v.value);
    revalidatePath("/ops/coaches");
    return { id: coach.id };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось создать тренера.",
    };
  }
}
