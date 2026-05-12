"use server";

import { revalidatePath } from "next/cache";
import { createOrganizer } from "@/lib/queries/organizers";
import { validateOrganizerInput, type RawOrganizerInput } from "./organizer-input";

export async function createOrganizerAction(
  raw: RawOrganizerInput,
): Promise<{ id?: string; error?: string }> {
  const v = validateOrganizerInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    const org = await createOrganizer(v.value);
    revalidatePath("/ops/organizers");
    return { id: org.id };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Не удалось создать организатора.",
    };
  }
}
