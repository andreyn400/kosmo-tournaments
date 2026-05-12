"use server";

import { revalidatePath } from "next/cache";
import { createProgram } from "@/lib/queries/programs";
import { validateProgramInput, type RawProgramInput } from "./program-input";

export async function createProgramAction(
  raw: RawProgramInput,
): Promise<{ error?: string }> {
  const v = validateProgramInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    await createProgram(v.value);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось создать программу.",
    };
  }

  revalidatePath("/ops/programs");
  return {};
}
