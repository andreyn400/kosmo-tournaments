"use server";

import { revalidatePath } from "next/cache";
import { deleteProgram } from "@/lib/queries/programs";

export async function deleteProgramAction(
  id: string,
): Promise<{ error?: string }> {
  if (!id) return { error: "Программа не найдена." };
  try {
    await deleteProgram(id);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить программу.",
    };
  }

  revalidatePath("/ops/programs");
  return {};
}
