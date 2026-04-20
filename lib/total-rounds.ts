import type { TournamentFormat } from "./types";

export function totalRoundsFor(
  format: TournamentFormat,
  playerCount: number,
): number {
  if (playerCount < 4 || playerCount % 4 !== 0) return 0;
  switch (format) {
    case "americano":
      return playerCount - 1;
    case "round_robin":
    case "team_americano":
      return playerCount / 2 - 1;
    case "mexicano":
    case "team_mexicano":
      return playerCount / 2;
    default:
      return 0;
  }
}
