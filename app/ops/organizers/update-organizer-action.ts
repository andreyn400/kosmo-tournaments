"use server";

import { revalidatePath } from "next/cache";
import { updateOrganizer } from "@/lib/queries/organizers";
import { validateOrganizerInput, type RawOrganizerInput } from "./organizer-input";

export async function updateOrganizerAction(
  id: string,
  raw: RawOrganizerInput,
): Promise<{ error?: string }> {
  const v = validateOrganizerInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    await updateOrganizer(id, v.value);
    revalidatePath("/ops/organizers");
    revalidatePath(`/ops/organizers/${id}`);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Не удалось обновить организатора.",
    };
  }
}
