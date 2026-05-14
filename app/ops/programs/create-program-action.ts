"use server";

import { revalidatePath } from "next/cache";
import { createProgram } from "@/lib/queries/programs";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateProgramInput, type RawProgramInput } from "./program-input";

export async function createProgramAction(
  raw: RawProgramInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const v = validateProgramInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    await createProgram(v.value);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.create.program"],
    };
  }

  revalidatePath("/ops/programs");
  return {};
}
