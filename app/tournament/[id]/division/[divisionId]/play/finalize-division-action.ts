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

export async function finalizeDivisionAction(input: {
  tournamentId: string;
  divisionId: string;
}): Promise<{ error?: string }> {
  const { tournamentId, divisionId } = input;

  try {
    const [tournament, division] = await Promise.all([
      getTournament(tournamentId),
      getDivision(divisionId),
    ]);
    if (!tournament) return { error: "Турнир не найден" };
    if (!division || division.tournament_id !== tournamentId) {
      return { error: "Дивизион не найден" };
    }
    if (division.status !== "in_progress") {
      return { error: "Дивизион не запущен" };
    }

    const divisionRounds = await listRoundsByDivision(divisionId);
    const sessionId = divisionRounds[0]?.session_id ?? null;
    if (!sessionId) return { error: "Нет раундов в дивизионе" };

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
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось завершить: ${msg}` };
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
