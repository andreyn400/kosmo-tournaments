"use server";

import { listDivisions } from "@/lib/queries/divisions";
import { listCourtsByIds } from "@/lib/queries/courts";

export type DivisionCourtConflict = {
  courtNumber: number | null;
  divisionName: string;
};

export async function checkDivisionCourtConflictsAction(input: {
  tournamentId: string;
  divisionId?: string;
  courtIds: string[];
}): Promise<{ conflicts: DivisionCourtConflict[] }> {
  if (input.courtIds.length === 0) return { conflicts: [] };

  const siblings = await listDivisions(input.tournamentId);
  const courtIdSet = new Set(input.courtIds);

  const overlaps: { courtId: string; divisionName: string }[] = [];
  for (const d of siblings) {
    if (input.divisionId && d.id === input.divisionId) continue;
    if (d.status !== "in_progress") continue;
    for (const cid of d.court_ids) {
      if (courtIdSet.has(cid)) overlaps.push({ courtId: cid, divisionName: d.name });
    }
  }
  if (overlaps.length === 0) return { conflicts: [] };

  const uniqueCourtIds = Array.from(new Set(overlaps.map((o) => o.courtId)));
  const courts = await listCourtsByIds(uniqueCourtIds);
  const numberById = new Map(courts.map((c) => [c.id, c.number]));

  const conflicts = overlaps.map((o) => ({
    courtNumber: numberById.get(o.courtId) ?? null,
    divisionName: o.divisionName,
  }));

  return { conflicts };
}
