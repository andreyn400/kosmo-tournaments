"use server";

import { revalidatePath } from "next/cache";
import { updateProgram } from "@/lib/queries/programs";
import { validateProgramInput, type RawProgramInput } from "./program-input";

export async function updateProgramAction(
  id: string,
  raw: RawProgramInput,
): Promise<{ error?: string }> {
  if (!id) return { error: "Программа не найдена." };
  const v = validateProgramInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    await updateProgram(id, v.value);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось сохранить программу.",
    };
  }

  revalidatePath("/ops/programs");
  return {};
}
