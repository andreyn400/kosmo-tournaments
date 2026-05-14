"use server";

import { revalidatePath } from "next/cache";
import seedData from "@/lib/seed/padel-ops-programs.json";
import {
  bulkInsertPrograms,
  countPrograms,
} from "@/lib/queries/programs";
import { getServerDict } from "@/lib/i18n/server";
import type { ProgramInput } from "@/lib/types";

interface SeedRow {
  name: string;
  type: string;
  duration_minutes: number;
  price_peak_rub: number;
  price_offpeak_rub: number;
  courts_needed: number;
  max_players: number;
  description: string;
}

export async function seedProgramsAction(): Promise<{
  inserted?: number;
  error?: string;
}> {
  const dict = await getServerDict();
  try {
    const existing = await countPrograms();
    if (existing > 0) {
      return {
        error: dict["error.programs_already_seeded"].replace(
          "{n}",
          String(existing),
        ),
      };
    }

    const rows = (seedData as SeedRow[]).map<ProgramInput>((r) => ({
      name: r.name,
      type: r.type,
      duration_minutes: r.duration_minutes,
      price_peak_rub: r.price_peak_rub,
      price_offpeak_rub: r.price_offpeak_rub,
      courts_needed: r.courts_needed,
      max_players: r.max_players,
      description: r.description || null,
      is_active: true,
    }));

    const inserted = await bulkInsertPrograms(rows);
    revalidatePath("/ops/programs");
    return { inserted };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : dict["error.failed.load_dataset"],
    };
  }
}
