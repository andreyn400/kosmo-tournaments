"use server";

import { revalidatePath } from "next/cache";
import { updateTournamentStatus } from "@/lib/queries/tournaments";

export async function openRegistrationAction(tournamentId: string) {
  await updateTournamentStatus(tournamentId, "registration_open");
  revalidatePath(`/tournament/${tournamentId}`);
  revalidatePath("/");
}
