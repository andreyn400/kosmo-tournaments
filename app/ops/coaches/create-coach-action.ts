"use server";

import { revalidatePath } from "next/cache";
import { createCoach } from "@/lib/queries/coaches";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateCoachInput, type RawCoachInput } from "./coach-input";

export async function createCoachAction(
  raw: RawCoachInput,
): Promise<{ id?: string; error?: string }> {
  const dict = await getServerDict();
  const v = validateCoachInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    const coach = await createCoach(v.value);
    revalidatePath("/ops/coaches");
    return { id: coach.id };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.create.coach"],
    };
  }
}
