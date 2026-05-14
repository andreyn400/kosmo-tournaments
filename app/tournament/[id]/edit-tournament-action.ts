"use server";

import { revalidatePath } from "next/cache";
import {
  getTournament,
  updateTournament,
} from "@/lib/queries/tournaments";
import { listActiveCourts } from "@/lib/queries/courts";
import { normalizeTime } from "@/lib/time-slots";
import { PADEL_LEVELS } from "@/lib/constants";
import { getServerDict } from "@/lib/i18n/server";
import type { PadelLevel } from "@/lib/types";

export interface EditTournamentInput {
  tournamentId: string;
  name: string;
  courtIds: string[];
  startTime: string | null;
  durationHours: number;
  levelMin: string | null;
  levelMax: string | null;
  maxPlayers: number | null;
  entryFee: number;
  prizeDescription: string | null;
  notes: string | null;
}

function parseLevel(v: string | null): PadelLevel | null {
  if (!v) return null;
  return (PADEL_LEVELS as string[]).includes(v) ? (v as PadelLevel) : null;
}

export async function editTournamentAction(
  input: EditTournamentInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const tournament = await getTournament(input.tournamentId);
  if (!tournament) return { error: dict["error.not_found.tournament"] };

  const name = input.name.trim();
  if (!name) return { error: dict["error.required.name"] };
  if (name.length > 120) return { error: dict["error.too_long.name"] };

  if (input.courtIds.length === 0)
    return { error: dict["error.courts.at_least_one"] };

  const activeCourts = await listActiveCourts();
  const activeIds = new Set(activeCourts.map((c) => c.id));
  const validCourtIds = input.courtIds.filter((id) => activeIds.has(id));
  if (validCourtIds.length === 0)
    return { error: dict["error.courts.no_longer_active"] };

  let startTime: string | null = null;
  if (input.startTime) {
    const normalized = normalizeTime(input.startTime);
    if (!normalized) return { error: dict["error.invalid.start_time"] };
    startTime = normalized;
  }

  if (
    !Number.isFinite(input.durationHours) ||
    input.durationHours < 1 ||
    input.durationHours > 12
  ) {
    return { error: dict["error.invalid.duration_hours_1_12"] };
  }

  if (!Number.isFinite(input.entryFee) || input.entryFee < 0) {
    return { error: dict["error.invalid.entry_fee_negative"] };
  }

  if (input.maxPlayers != null) {
    if (
      !Number.isFinite(input.maxPlayers) ||
      input.maxPlayers < 4 ||
      input.maxPlayers % 4 !== 0
    ) {
      return { error: dict["error.invalid.max_players_multiple_of_4"] };
    }
  }

  const level_min = parseLevel(input.levelMin);
  const level_max = parseLevel(input.levelMax);

  try {
    await updateTournament(input.tournamentId, {
      name,
      court_ids: validCourtIds,
      start_time: startTime,
      duration_hours: input.durationHours,
      level_min,
      level_max,
      max_players: input.maxPlayers,
      entry_fee: input.entryFee,
      prize_description:
        input.prizeDescription && input.prizeDescription.trim()
          ? input.prizeDescription.trim()
          : null,
      notes: input.notes && input.notes.trim() ? input.notes.trim() : null,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : dict["error.unknown"];
    return {
      error: dict["error.failed.save_with_reason"].replace(
        "{reason}",
        reason,
      ),
    };
  }

  revalidatePath(`/tournament/${input.tournamentId}`);
  return {};
}
