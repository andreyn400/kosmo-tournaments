"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateMexicanoRound } from "@/lib/algorithms/mexicano";
import { generateTeamMexicanoRound } from "@/lib/algorithms/teamMexicano";
import type { Pair } from "@/lib/algorithms/teamAmericano";
import {
  computeLiveLeaderboard,
  computePairLeaderboard,
} from "@/lib/leaderboard";
import { pairsFromRegistrations } from "@/lib/pairs-from-registrations";
import { listCourtsByIds } from "@/lib/queries/courts";
import { totalRoundsFor } from "@/lib/total-rounds";
import { getServerDict } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/ru";
import type { Court, Division, Match, Player, Tournament } from "@/lib/types";

export async function advanceRoundAction(input: {
  tournamentId: string;
  sessionId: string;
  currentRoundId: string;
  divisionId?: string | null;
}): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const supabase = await createClient();

  const { data: matches, error: matchesErr } = await supabase
    .from("matches")
    .select("id, status")
    .eq("round_id", input.currentRoundId);
  if (matchesErr) return { error: matchesErr.message };
  if (!matches || matches.some((m) => m.status !== "completed"))
    return { error: dict["error.state.matches_not_complete"] };

  const { data: currentRound, error: currentErr } = await supabase
    .from("rounds")
    .select("round_number")
    .eq("id", input.currentRoundId)
    .single();
  if (currentErr) return { error: currentErr.message };

  const { data: tournament, error: tournamentErr } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", input.tournamentId)
    .single();
  if (tournamentErr) return { error: tournamentErr.message };
  const t = tournament as Tournament;

  let division: Division | null = null;
  if (input.divisionId) {
    const { data: divData, error: divErr } = await supabase
      .from("divisions")
      .select("*")
      .eq("id", input.divisionId)
      .single();
    if (divErr) return { error: divErr.message };
    division = divData as Division;
  }

  const format = division?.format ?? t.format;
  const courtIds = division?.court_ids ?? t.court_ids ?? [];

  const revalidate = () => {
    revalidatePath(`/tournament/${input.tournamentId}/play`);
    if (input.divisionId) {
      revalidatePath(
        `/tournament/${input.tournamentId}/division/${input.divisionId}/play`,
      );
    }
  };

  const { error: completeErr } = await supabase
    .from("rounds")
    .update({ status: "completed" })
    .eq("id", input.currentRoundId);
  if (completeErr) return { error: completeErr.message };

  const nextRoundNumber = currentRound.round_number + 1;

  let nextRoundQuery = supabase
    .from("rounds")
    .select("id")
    .eq("session_id", input.sessionId)
    .eq("round_number", nextRoundNumber);
  if (input.divisionId) {
    nextRoundQuery = nextRoundQuery.eq("division_id", input.divisionId);
  } else {
    nextRoundQuery = nextRoundQuery.is("division_id", null);
  }
  const { data: nextRound, error: nextErr } = await nextRoundQuery.maybeSingle();
  if (nextErr) return { error: nextErr.message };

  if (nextRound) {
    const { error: startNextErr } = await supabase
      .from("rounds")
      .update({ status: "in_progress" })
      .eq("id", nextRound.id);
    if (startNextErr) return { error: startNextErr.message };
    revalidate();
    return {};
  }

  if (format === "mexicano") {
    const generated = await generateNextIndividualMexicanoRound({
      supabase,
      tournament: t,
      sessionId: input.sessionId,
      nextRoundNumber,
      divisionId: input.divisionId ?? null,
      courtIds,
      dict,
    });
    if (generated.error) return { error: generated.error };
    if (generated.generated) {
      revalidate();
      return {};
    }
  }

  if (format === "team_mexicano") {
    const generated = await generateNextTeamMexicanoRound({
      supabase,
      tournament: t,
      sessionId: input.sessionId,
      nextRoundNumber,
      divisionId: input.divisionId ?? null,
      courtIds,
      dict,
    });
    if (generated.error) return { error: generated.error };
    if (generated.generated) {
      revalidate();
      return {};
    }
  }

  if (!input.divisionId) {
    const { error: sessionErr } = await supabase
      .from("tournament_sessions")
      .update({ status: "completed" })
      .eq("id", input.sessionId);
    if (sessionErr) return { error: sessionErr.message };
  }

  revalidate();
  return {};
}

async function loadRoundAndMatchData({
  supabase,
  tournament,
  sessionId,
  divisionId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tournament: Tournament;
  sessionId: string;
  divisionId: string | null;
}): Promise<{
  regs: Array<{ player_id: string; partner_id: string | null }>;
  matches: Match[];
  players: Player[];
  error?: string;
}> {
  let regsQuery = supabase
    .from("tournament_registrations")
    .select("player_id, partner_id")
    .eq("tournament_id", tournament.id)
    .neq("status", "cancelled");
  if (divisionId) regsQuery = regsQuery.eq("division_id", divisionId);
  const { data: regs, error: regsErr } = await regsQuery;
  if (regsErr)
    return { regs: [], matches: [], players: [], error: regsErr.message };

  let roundsQuery = supabase
    .from("rounds")
    .select("id")
    .eq("session_id", sessionId);
  if (divisionId) roundsQuery = roundsQuery.eq("division_id", divisionId);
  const { data: allRounds, error: allRoundsErr } = await roundsQuery;
  if (allRoundsErr)
    return { regs: [], matches: [], players: [], error: allRoundsErr.message };
  const roundIds = (allRounds ?? []).map((r) => r.id);

  const { data: allMatches, error: allMatchesErr } = await supabase
    .from("matches")
    .select("*")
    .in("round_id", roundIds)
    .eq("status", "completed");
  if (allMatchesErr)
    return {
      regs: [],
      matches: [],
      players: [],
      error: allMatchesErr.message,
    };

  const { data: playerRows, error: playersErr } = await supabase
    .from("players")
    .select("*")
    .in(
      "id",
      (regs ?? []).map((r) => r.player_id),
    );
  if (playersErr)
    return { regs: [], matches: [], players: [], error: playersErr.message };

  return {
    regs: (regs ?? []) as Array<{
      player_id: string;
      partner_id: string | null;
    }>,
    matches: (allMatches ?? []) as Match[],
    players: (playerRows ?? []) as Player[],
  };
}

async function insertGeneratedRound({
  supabase,
  sessionId,
  divisionId,
  courtIds,
  roundNumber,
  matches,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  sessionId: string;
  divisionId: string | null;
  courtIds: string[];
  roundNumber: number;
  matches: Array<{
    courtIndex: number;
    team1: [string, string];
    team2: [string, string];
  }>;
}): Promise<{ error?: string }> {
  const { data: createdRound, error: roundErr } = await supabase
    .from("rounds")
    .insert({
      session_id: sessionId,
      division_id: divisionId,
      round_number: roundNumber,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (roundErr) return { error: roundErr.message };

  const courts = await loadCourts(courtIds);
  const matchRows = matches.map((m) => {
    const court = courts[m.courtIndex] ?? null;
    return {
      round_id: createdRound.id,
      division_id: divisionId,
      court_id: court?.id ?? null,
      court_number: court?.number ?? m.courtIndex + 1,
      team1_player1_id: m.team1[0],
      team1_player2_id: m.team1[1],
      team2_player1_id: m.team2[0],
      team2_player2_id: m.team2[1],
      status: "pending" as const,
    };
  });

  const { error: insertMatchesErr } = await supabase
    .from("matches")
    .insert(matchRows);
  if (insertMatchesErr) return { error: insertMatchesErr.message };

  return {};
}

async function loadCourts(courtIds: string[]): Promise<Court[]> {
  if (!courtIds || courtIds.length === 0) return [];
  return await listCourtsByIds(courtIds);
}

async function generateNextIndividualMexicanoRound({
  supabase,
  tournament,
  sessionId,
  nextRoundNumber,
  divisionId,
  courtIds,
  dict,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tournament: Tournament;
  sessionId: string;
  nextRoundNumber: number;
  divisionId: string | null;
  courtIds: string[];
  dict: Dictionary;
}): Promise<{ generated: boolean; error?: string }> {
  const loaded = await loadRoundAndMatchData({
    supabase,
    tournament,
    sessionId,
    divisionId,
  });
  if (loaded.error) return { generated: false, error: loaded.error };

  const playerCount = loaded.regs.length;
  const maxRounds = totalRoundsFor("mexicano", playerCount);
  if (maxRounds === 0) {
    return { generated: false, error: dict["error.failed.total_rounds"] };
  }
  if (nextRoundNumber > maxRounds) return { generated: false };

  const leaderboard = computeLiveLeaderboard(
    loaded.matches,
    loaded.players,
    "points",
  );
  const leaderboardIds = leaderboard.map((r) => r.playerId);
  const missing = loaded.regs
    .map((r) => r.player_id)
    .filter((id) => !leaderboardIds.includes(id));
  const orderedPlayerIds = [...leaderboardIds, ...missing];

  if (orderedPlayerIds.length !== playerCount) {
    return {
      generated: false,
      error: dict["error.failed.expected_players_in_table"]
        .replace("{expected}", String(playerCount))
        .replace("{actual}", String(orderedPlayerIds.length)),
    };
  }

  const scheduled = generateMexicanoRound(orderedPlayerIds, nextRoundNumber);
  const inserted = await insertGeneratedRound({
    supabase,
    sessionId,
    divisionId,
    courtIds,
    roundNumber: nextRoundNumber,
    matches: scheduled.matches,
  });
  if (inserted.error) return { generated: false, error: inserted.error };
  return { generated: true };
}

async function generateNextTeamMexicanoRound({
  supabase,
  tournament,
  sessionId,
  nextRoundNumber,
  divisionId,
  courtIds,
  dict,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tournament: Tournament;
  sessionId: string;
  nextRoundNumber: number;
  divisionId: string | null;
  courtIds: string[];
  dict: Dictionary;
}): Promise<{ generated: boolean; error?: string }> {
  const loaded = await loadRoundAndMatchData({
    supabase,
    tournament,
    sessionId,
    divisionId,
  });
  if (loaded.error) return { generated: false, error: loaded.error };

  const playerCount = loaded.regs.length;
  const maxRounds = totalRoundsFor("team_mexicano", playerCount);
  if (maxRounds === 0) {
    return { generated: false, error: dict["error.failed.total_rounds"] };
  }
  if (nextRoundNumber > maxRounds) return { generated: false };

  const pairs = pairsFromRegistrations(loaded.regs);
  if (pairs.length !== playerCount / 2) {
    return { generated: false, error: dict["error.failed.next_round_pairs"] };
  }

  const pairLeaderboard = computePairLeaderboard(
    loaded.matches,
    loaded.players,
    pairs,
    "points",
  );

  const orderedPairs: Pair[] = pairLeaderboard.map((r) => r.playerIds);

  const scheduled = generateTeamMexicanoRound(orderedPairs, nextRoundNumber);
  const inserted = await insertGeneratedRound({
    supabase,
    sessionId,
    divisionId,
    courtIds,
    roundNumber: nextRoundNumber,
    matches: scheduled.matches,
  });
  if (inserted.error) return { generated: false, error: inserted.error };
  return { generated: true };
}
