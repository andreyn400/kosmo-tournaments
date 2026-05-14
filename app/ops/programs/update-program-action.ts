"use server";

import { revalidatePath } from "next/cache";
import { updateProgram } from "@/lib/queries/programs";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateProgramInput, type RawProgramInput } from "./program-input";

export async function updateProgramAction(
  id: string,
  raw: RawProgramInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  if (!id) return { error: dict["error.not_found.program"] };
  const v = validateProgramInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    await updateProgram(id, v.value);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.save.program"],
    };
  }

  revalidatePath("/ops/programs");
  return {};
}
