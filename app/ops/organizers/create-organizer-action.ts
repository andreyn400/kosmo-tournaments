"use server";

import { revalidatePath } from "next/cache";
import { createOrganizer } from "@/lib/queries/organizers";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateOrganizerInput, type RawOrganizerInput } from "./organizer-input";

export async function createOrganizerAction(
  raw: RawOrganizerInput,
): Promise<{ id?: string; error?: string }> {
  const dict = await getServerDict();
  const v = validateOrganizerInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    const org = await createOrganizer(v.value);
    revalidatePath("/ops/organizers");
    return { id: org.id };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.create.organizer"],
    };
  }
}
