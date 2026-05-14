"use server";

import { revalidatePath } from "next/cache";
import { updateOrganizer } from "@/lib/queries/organizers";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateOrganizerInput, type RawOrganizerInput } from "./organizer-input";

export async function updateOrganizerAction(
  id: string,
  raw: RawOrganizerInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const v = validateOrganizerInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    await updateOrganizer(id, v.value);
    revalidatePath("/ops/organizers");
    revalidatePath(`/ops/organizers/${id}`);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.update.organizer"],
    };
  }
}
