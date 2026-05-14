"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTournament } from "@/lib/queries/tournaments";
import { getDivision, listDivisions } from "@/lib/queries/divisions";
import { listRegistrationsByDivision } from "@/lib/queries/registrations";
import { startDivision } from "@/lib/start-division";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import { getServerDict } from "@/lib/i18n/server";
import type { Pair } from "@/lib/algorithms/teamAmericano";

export async function startDivisionAction(input: {
  tournamentId: string;
  divisionId: string;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const [tournament, division, siblingDivisions] = await Promise.all([
    getTournament(input.tournamentId),
    getDivision(input.divisionId),
    listDivisions(input.tournamentId),
  ]);
  if (!tournament) return { error: dict["error.not_found.tournament"] };
  if (!division || division.tournament_id !== input.tournamentId) {
    return { error: dict["error.not_found.division"] };
  }
  if (division.status !== "draft" && division.status !== "registration_open") {
    return { error: dict["error.state.division_cant_start"] };
  }

  const courtIdSet = new Set(division.court_ids);
  const conflict = siblingDivisions.find(
    (d) =>
      d.id !== division.id &&
      d.status === "in_progress" &&
      d.court_ids.some((cid) => courtIdSet.has(cid)),
  );
  if (conflict) {
    return {
      error: dict["error.division.start_conflict_court"].replace(
        "{name}",
        conflict.name,
      ),
    };
  }

  const registrations = await listRegistrationsByDivision(input.divisionId);
  const playerIds = registrations.map((r) => r.player_id);

  const isTeamFormat =
    division.format === "team_americano" ||
    division.format === "team_mexicano";

  let pairs: Pair[] | undefined;
  if (isTeamFormat) {
    pairs = pairsFromRegistrations(registrations);
    if (pairs.length !== playerIds.length / 2) {
      return { error: dict["error.player.partner_some_missing"] };
    }
  }

  try {
    await startDivision({ tournament, division, playerIds, pairs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : dict["error.unknown"];
    return { error: msg };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  revalidatePath(
    `/tournament/${input.tournamentId}/division/${input.divisionId}`,
  );
  revalidatePath("/");
  redirect(`/tournament/${input.tournamentId}/division/${input.divisionId}`);
}
