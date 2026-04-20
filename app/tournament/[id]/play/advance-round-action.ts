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
import type { Court, Match, Player, Tournament } from "@/lib/types";

export async function advanceRoundAction(input: {
  tournamentId: string;
  sessionId: string;
  currentRoundId: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: matches, error: matchesErr } = await supabase
    .from("matches")
    .select("id, status")
    .eq("round_id", input.currentRoundId);
  if (matchesErr) return { error: matchesErr.message };
  if (!matches || matches.some((m) => m.status !== "completed"))
    return { error: "Ещё не все матчи раунда завершены" };

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

  const { error: completeErr } = await supabase
    .from("rounds")
    .update({ status: "completed" })
    .eq("id", input.currentRoundId);
  if (completeErr) return { error: completeErr.message };

  const nextRoundNumber = currentRound.round_number + 1;

  const { data: nextRound, error: nextErr } = await supabase
    .from("rounds")
    .select("id")
    .eq("session_id", input.sessionId)
    .eq("round_number", nextRoundNumber)
    .maybeSingle();
  if (nextErr) return { error: nextErr.message };

  if (nextRound) {
    const { error: startNextErr } = await supabase
      .from("rounds")
      .update({ status: "in_progress" })
      .eq("id", nextRound.id);
    if (startNextErr) return { error: startNextErr.message };
    revalidatePath(`/tournament/${input.tournamentId}/play`);
    return {};
  }

  if (t.format === "mexicano") {
    const generated = await generateNextIndividualMexicanoRound({
      supabase,
      tournament: t,
      sessionId: input.sessionId,
      nextRoundNumber,
    });
    if (generated.error) return { error: generated.error };
    if (generated.generated) {
      revalidatePath(`/tournament/${input.tournamentId}/play`);
      return {};
    }
  }

  if (t.format === "team_mexicano") {
    const generated = await generateNextTeamMexicanoRound({
      supabase,
      tournament: t,
      sessionId: input.sessionId,
      nextRoundNumber,
    });
    if (generated.error) return { error: generated.error };
    if (generated.generated) {
      revalidatePath(`/tournament/${input.tournamentId}/play`);
      return {};
    }
  }

  const { error: sessionErr } = await supabase
    .from("tournament_sessions")
    .update({ status: "completed" })
    .eq("id", input.sessionId);
  if (sessionErr) return { error: sessionErr.message };

  revalidatePath(`/tournament/${input.tournamentId}/play`);
  return {};
}

async function loadRoundAndMatchData({
  supabase,
  tournament,
  sessionId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tournament: Tournament;
  sessionId: string;
}): Promise<{
  regs: Array<{ player_id: string; partner_id: string | null }>;
  matches: Match[];
  players: Player[];
  error?: string;
}> {
  const { data: regs, error: regsErr } = await supabase
    .from("tournament_registrations")
    .select("player_id, partner_id")
    .eq("tournament_id", tournament.id)
    .neq("status", "cancelled");
  if (regsErr)
    return { regs: [], matches: [], players: [], error: regsErr.message };

  const { data: allRounds, error: allRoundsErr } = await supabase
    .from("rounds")
    .select("id")
    .eq("session_id", sessionId);
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
  tournament,
  sessionId,
  roundNumber,
  matches,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tournament: Tournament;
  sessionId: string;
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
      round_number: roundNumber,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (roundErr) return { error: roundErr.message };

  const tournamentCourts = await loadTournamentCourts(tournament);
  const matchRows = matches.map((m) => {
    const court = tournamentCourts[m.courtIndex] ?? null;
    return {
      round_id: createdRound.id,
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

async function loadTournamentCourts(tournament: Tournament): Promise<Court[]> {
  if (!tournament.court_ids || tournament.court_ids.length === 0) return [];
  return await listCourtsByIds(tournament.court_ids);
}

async function generateNextIndividualMexicanoRound({
  supabase,
  tournament,
  sessionId,
  nextRoundNumber,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tournament: Tournament;
  sessionId: string;
  nextRoundNumber: number;
}): Promise<{ generated: boolean; error?: string }> {
  const loaded = await loadRoundAndMatchData({
    supabase,
    tournament,
    sessionId,
  });
  if (loaded.error) return { generated: false, error: loaded.error };

  const playerCount = loaded.regs.length;
  const maxRounds = totalRoundsFor(tournament.format, playerCount);
  if (maxRounds === 0) {
    return {
      generated: false,
      error: "Не удалось определить общее число раундов",
    };
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
      error: `Ожидалось ${playerCount} игроков в таблице, получено ${orderedPlayerIds.length}`,
    };
  }

  const scheduled = generateMexicanoRound(orderedPlayerIds, nextRoundNumber);
  const inserted = await insertGeneratedRound({
    supabase,
    tournament,
    sessionId,
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
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tournament: Tournament;
  sessionId: string;
  nextRoundNumber: number;
}): Promise<{ generated: boolean; error?: string }> {
  const loaded = await loadRoundAndMatchData({
    supabase,
    tournament,
    sessionId,
  });
  if (loaded.error) return { generated: false, error: loaded.error };

  const playerCount = loaded.regs.length;
  const maxRounds = totalRoundsFor(tournament.format, playerCount);
  if (maxRounds === 0) {
    return {
      generated: false,
      error: "Не удалось определить общее число раундов",
    };
  }
  if (nextRoundNumber > maxRounds) return { generated: false };

  const pairs = pairsFromRegistrations(loaded.regs);
  if (pairs.length !== playerCount / 2) {
    return {
      generated: false,
      error: "Не удалось собрать пары для следующего раунда",
    };
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
    tournament,
    sessionId,
    roundNumber: nextRoundNumber,
    matches: scheduled.matches,
  });
  if (inserted.error) return { generated: false, error: inserted.error };
  return { generated: true };
}
