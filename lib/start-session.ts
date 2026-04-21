import { generateAmericanoSchedule } from "./americano";
import { generateRoundRobinSchedule } from "./algorithms/roundRobin";
import { generateMexicanoRound } from "./algorithms/mexicano";
import { generateTeamAmericanoSchedule } from "./algorithms/teamAmericano";
import { generateTeamMexicanoRound } from "./algorithms/teamMexicano";
import type { Pair } from "./algorithms/teamAmericano";
import { createClient } from "./supabase/server";
import { listCourtsByIds } from "./queries/courts";
import type { ScheduledRound } from "./americano";
import type { Court, Division, Tournament, TournamentFormat } from "./types";

const SUPPORTED_FORMATS = new Set<TournamentFormat>([
  "americano",
  "round_robin",
  "mexicano",
  "team_americano",
  "team_mexicano",
]);

export async function startSession(input: {
  tournament: Tournament;
  sessionId: string;
  playerIds: string[];
  pairs?: ReadonlyArray<Pair>;
  division?: Division;
}): Promise<{ firstRoundId: string }> {
  const { tournament, sessionId, playerIds, pairs, division } = input;

  const format: TournamentFormat = division?.format ?? tournament.format;
  const courtIds = division?.court_ids ?? tournament.court_ids ?? [];
  const divisionId = division?.id ?? null;

  if (!SUPPORTED_FORMATS.has(format)) {
    throw new Error(
      "Этот формат пока не поддерживается. Доступны: Американо, Круговой, Мексикано, Командное американо, Командное мексикано.",
    );
  }
  if (playerIds.length < 4 || playerIds.length % 4 !== 0) {
    throw new Error(
      `Число игроков должно быть кратно 4 (текущее: ${playerIds.length}).`,
    );
  }

  const isTeamFormat = format === "team_americano" || format === "team_mexicano";

  if (isTeamFormat) {
    if (!pairs || pairs.length !== playerIds.length / 2) {
      throw new Error(
        "Для командного формата необходимо задать пары для всех игроков.",
      );
    }
    const seen = new Set<string>();
    for (const [a, b] of pairs) {
      if (a === b) throw new Error("Игрок не может быть в паре сам с собой.");
      if (seen.has(a) || seen.has(b)) {
        throw new Error("Игрок указан в нескольких парах.");
      }
      seen.add(a);
      seen.add(b);
    }
  }

  const schedule: ScheduledRound[] = (() => {
    switch (format) {
      case "round_robin":
        return generateRoundRobinSchedule(playerIds);
      case "mexicano":
        return [generateMexicanoRound(playerIds, 1)];
      case "team_americano":
        return generateTeamAmericanoSchedule(pairs!);
      case "team_mexicano":
        return [generateTeamMexicanoRound(pairs!, 1)];
      default:
        return generateAmericanoSchedule(playerIds);
    }
  })();

  const supabase = await createClient();
  let firstRoundId = "";

  const courts = await loadCourts(courtIds);

  for (const [idx, round] of schedule.entries()) {
    const isFirst = idx === 0;
    const { data: createdRound, error: roundErr } = await supabase
      .from("rounds")
      .insert({
        session_id: sessionId,
        division_id: divisionId,
        round_number: round.roundNumber,
        status: isFirst ? "in_progress" : "pending",
      })
      .select("*")
      .single();
    if (roundErr) throw new Error(roundErr.message);

    if (isFirst) firstRoundId = createdRound.id;

    const matchRows = round.matches.map((m) => {
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

    const { error: matchErr } = await supabase
      .from("matches")
      .insert(matchRows);
    if (matchErr) throw new Error(matchErr.message);
  }

  const { error: sessionErr } = await supabase
    .from("tournament_sessions")
    .update({ status: "in_progress" })
    .eq("id", sessionId);
  if (sessionErr) throw new Error(sessionErr.message);

  return { firstRoundId };
}

async function loadCourts(courtIds: string[]): Promise<Court[]> {
  if (!courtIds || courtIds.length === 0) return [];
  return await listCourtsByIds(courtIds);
}
