"use server";

import { checkCourtConflicts, type CourtConflict } from "@/lib/queries/courts";

export async function checkConflictsAction(input: {
  courtIds: string[];
  date: string;
  startTime: string | null;
  durationHours: number;
}): Promise<{ conflicts: CourtConflict[] }> {
  const conflicts = await checkCourtConflicts(input);
  return { conflicts };
}
