"use server";

import { revalidatePath } from "next/cache";
import { deleteProgram } from "@/lib/queries/programs";
import { getServerDict } from "@/lib/i18n/server";

export async function deleteProgramAction(
  id: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  if (!id) return { error: dict["error.not_found.program"] };
  try {
    await deleteProgram(id);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.delete.program"],
    };
  }

  revalidatePath("/ops/programs");
  return {};
}
