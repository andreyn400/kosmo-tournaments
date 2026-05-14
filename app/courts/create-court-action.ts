"use server";

import { revalidatePath } from "next/cache";
import { createCourt } from "@/lib/queries/courts";
import type { CourtStatus, CourtSurface } from "@/lib/types";
import {
  COURT_STATUS_VALUES,
  COURT_SURFACE_VALUES,
} from "@/lib/i18n/court-keys";
import { getServerDict } from "@/lib/i18n/server";

export async function createCourtAction(input: {
  name: string;
  number: number;
  surface: string;
  status: string;
  notes: string;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const name = input.name.trim();
  if (!name) return { error: dict["error.required.court_name"] };
  if (!Number.isInteger(input.number) || input.number < 1 || input.number > 10) {
    return { error: dict["error.invalid.court_number_1_10"] };
  }
  if (!COURT_SURFACE_VALUES.includes(input.surface as CourtSurface)) {
    return { error: dict["error.invalid.surface_unknown"] };
  }
  if (!COURT_STATUS_VALUES.includes(input.status as CourtStatus)) {
    return { error: dict["error.invalid.status_unknown"] };
  }

  try {
    await createCourt({
      name,
      number: input.number,
      surface: input.surface as CourtSurface,
      status: input.status as CourtStatus,
      notes: input.notes.trim() || null,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : dict["error.failed.create.court"],
    };
  }

  revalidatePath("/courts");
  revalidatePath("/tournament/new");
  revalidatePath("/league/new");
  return {};
}
