import type { BracketMatch } from "./types";
import type { BracketMatchPatch } from "./queries/bracket-matches";

export interface AdvancementPatch {
  nextMatchId: string;
  patch: BracketMatchPatch;
}

export function advanceWinnerPatch(
  match: BracketMatch,
): AdvancementPatch | null {
  if (match.winner_team !== 1 && match.winner_team !== 2) return null;
  if (!match.next_match_id || !match.next_match_slot) return null;

  const winnerP1 =
    match.winner_team === 1
      ? match.team1_player1_id
      : match.team2_player1_id;
  const winnerP2 =
    match.winner_team === 1
      ? match.team1_player2_id
      : match.team2_player2_id;

  const patch: BracketMatchPatch =
    match.next_match_slot === 1
      ? { team1_player1_id: winnerP1, team1_player2_id: winnerP2 }
      : { team2_player1_id: winnerP1, team2_player2_id: winnerP2 };

  return { nextMatchId: match.next_match_id, patch };
}
