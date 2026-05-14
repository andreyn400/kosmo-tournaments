"use server";

import { revalidatePath } from "next/cache";
import { updateCoach } from "@/lib/queries/coaches";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateCoachInput, type RawCoachInput } from "./coach-input";

export async function updateCoachAction(
  id: string,
  raw: RawCoachInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  if (!id) return { error: dict["error.not_found.coach"] };
  const v = validateCoachInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    await updateCoach(id, v.value);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.update.coach"],
    };
  }

  revalidatePath("/ops/coaches");
  revalidatePath(`/ops/coaches/${id}`);
  return {};
}
