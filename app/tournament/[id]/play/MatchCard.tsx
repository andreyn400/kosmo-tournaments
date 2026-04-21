"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  isSetsDetail,
  scoringGroup,
} from "@/lib/scoring-systems";
import type {
  Court,
  Match,
  Player,
  ScoringSystem,
} from "@/lib/types";
import { PointsScoreInput } from "./PointsScoreInput";
import { SetsScoreInput } from "./SetsScoreInput";

export function MatchCard({
  tournamentId,
  divisionId,
  match,
  playerById,
  courtById,
  scoringSystem,
  editable,
}: {
  tournamentId: string;
  divisionId?: string | null;
  match: Match;
  playerById: Map<string, Player>;
  courtById: Map<string, Court>;
  scoringSystem: ScoringSystem;
  editable: boolean;
}) {
  const court = match.court_id ? courtById.get(match.court_id) : null;
  const courtLabel = court
    ? court.name
    : `Корт ${match.court_number ?? "—"}`;
  const isCompleted = match.status === "completed";

  const team1Players = [match.team1_player1_id, match.team1_player2_id]
    .map((id) => (id ? (playerById.get(id)?.name ?? "—") : "—"))
    .join(" / ");
  const team2Players = [match.team2_player1_id, match.team2_player2_id]
    .map((id) => (id ? (playerById.get(id)?.name ?? "—") : "—"))
    .join(" / ");

  const completedAccent = isCompleted
    ? "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--color-success)] before:rounded-l-[var(--radius-card)] relative"
    : "";

  const isSets = scoringGroup(scoringSystem) === "sets";
  const setsInitial = isSetsDetail(match.score_detail)
    ? match.score_detail
    : null;

  return (
    <Card
      padded={false}
      className={`flex flex-col ${completedAccent}`.trim()}
    >
      <div className="px-5 pt-4 flex items-center justify-between">
        <Badge tone="neutral" className="!px-2.5">
          {courtLabel}
        </Badge>
        {isCompleted ? (
          <Badge tone="status-completed">Завершён</Badge>
        ) : (
          <Badge tone="status-progress">Идёт</Badge>
        )}
      </div>

      {isSets ? (
        <SetsScoreInput
          tournamentId={tournamentId}
          divisionId={divisionId ?? null}
          matchId={match.id}
          scoringSystem={scoringSystem}
          team1Players={team1Players}
          team2Players={team2Players}
          initial={setsInitial}
          isCompleted={isCompleted}
          editable={editable}
        />
      ) : (
        <PointsScoreInput
          tournamentId={tournamentId}
          divisionId={divisionId ?? null}
          matchId={match.id}
          scoringSystem={scoringSystem}
          team1Players={team1Players}
          team2Players={team2Players}
          initialT1={match.team1_score}
          initialT2={match.team2_score}
          isCompleted={isCompleted}
          editable={editable}
        />
      )}
    </Card>
  );
}
