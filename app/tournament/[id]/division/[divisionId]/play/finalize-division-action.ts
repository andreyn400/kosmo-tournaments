"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { finalizeSessionElo } from "@/lib/session-finalization";
import { getTournament, updateTournamentStatus } from "@/lib/queries/tournaments";
import {
  getDivision,
  listDivisions,
  updateDivisionStatus,
} from "@/lib/queries/divisions";
import {
  listSessionsByTournament,
  updateSessionStatus,
} from "@/lib/queries/sessions";
import { listRoundsByDivision } from "@/lib/queries/rounds";
import { getServerDict } from "@/lib/i18n/server";

export async function finalizeDivisionAction(input: {
  tournamentId: string;
  divisionId: string;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const { tournamentId, divisionId } = input;

  try {
    const [tournament, division] = await Promise.all([
      getTournament(tournamentId),
      getDivision(divisionId),
    ]);
    if (!tournament) return { error: dict["error.not_found.tournament"] };
    if (!division || division.tournament_id !== tournamentId) {
      return { error: dict["error.not_found.division"] };
    }
    if (division.status !== "in_progress") {
      return { error: dict["error.state.division_not_started"] };
    }

    const divisionRounds = await listRoundsByDivision(divisionId);
    const sessionId = divisionRounds[0]?.session_id ?? null;
    if (!sessionId) return { error: dict["error.state.no_division_rounds"] };

    await finalizeSessionElo({ sessionId, tournamentId, divisionId });
    await updateDivisionStatus(divisionId, "completed");

    const siblings = await listDivisions(tournamentId);
    const allComplete = siblings.every(
      (d) => d.id === divisionId || d.status === "completed",
    );
    if (allComplete) {
      await updateTournamentStatus(tournamentId, "completed");
      const sessions = await listSessionsByTournament(tournamentId);
      const active = sessions.find((s) => s.status === "in_progress");
      if (active) await updateSessionStatus(active.id, "completed");
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.finalize_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }

  revalidatePath("/");
  revalidatePath(`/tournament/${tournamentId}`);
  revalidatePath(`/tournament/${tournamentId}/play`);
  revalidatePath(`/tournament/${tournamentId}/results`);
  revalidatePath(`/tournament/${tournamentId}/division/${divisionId}`);
  revalidatePath(`/tournament/${tournamentId}/division/${divisionId}/play`);
  revalidatePath(`/tournament/${tournamentId}/division/${divisionId}/results`);
  redirect(`/tournament/${tournamentId}/division/${divisionId}/results`);
}

function isRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
