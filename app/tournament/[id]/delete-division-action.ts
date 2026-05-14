"use server";

import { revalidatePath } from "next/cache";
import { deleteDivision, getDivision } from "@/lib/queries/divisions";
import { getServerDict } from "@/lib/i18n/server";

export async function deleteDivisionAction(input: {
  tournamentId: string;
  divisionId: string;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    const div = await getDivision(input.divisionId);
    if (!div) return { error: dict["error.not_found.division"] };
    if (div.status === "in_progress" || div.status === "completed") {
      return {
        error: dict["error.state.cant_delete_division_with_matches"],
      };
    }
    await deleteDivision(input.divisionId);
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.delete_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }
  revalidatePath(`/tournament/${input.tournamentId}`);
  revalidatePath("/display");
  return {};
}
