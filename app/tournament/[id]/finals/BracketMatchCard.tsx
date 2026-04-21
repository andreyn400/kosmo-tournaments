"use client";

import { useState } from "react";
import {
  isSetsDetail,
  scoringGroup,
  setsSummary,
  type SetsDetail,
} from "@/lib/scoring-systems";
import type { BracketMatch, ScoringSystem } from "@/lib/types";
import { BracketScoreInput } from "./BracketScoreInput";

export function BracketMatchCard({
  tournamentId,
  match,
  scoringSystem,
  playerNameById,
  courtLabelById,
  readOnly = false,
}: {
  tournamentId: string;
  match: BracketMatch;
  scoringSystem: ScoringSystem;
  playerNameById: Record<string, string>;
  courtLabelById: Record<string, string>;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const team1 = formatTeam(
    match.team1_player1_id,
    match.team1_player2_id,
    playerNameById,
  );
  const team2 = formatTeam(
    match.team2_player1_id,
    match.team2_player2_id,
    playerNameById,
  );

  const isSets = scoringGroup(scoringSystem) === "sets";
  const setsDetail: SetsDetail | null =
    isSets && isSetsDetail(match.score_detail)
      ? (match.score_detail as SetsDetail)
      : null;

  const isBye = match.status === "bye";
  const isCompleted = match.status === "completed";
  const bothKnown = Boolean(team1 && team2);
  const canEdit = !readOnly && !isBye && bothKnown;
  const courtLabel = match.court_id ? courtLabelById[match.court_id] : null;

  const statusText = isBye
    ? "Бай"
    : isCompleted
      ? "Сыгран"
      : bothKnown
        ? "Ожидает"
        : "Ждёт соперников";

  return (
    <div
      className="rounded-lg bg-white border border-border overflow-hidden text-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.08em] text-muted">
        <span>
          {courtLabel ? `Корт ${courtLabel}` : `M${match.position + 1}`}
        </span>
        <span
          className={
            isCompleted
              ? "text-[var(--color-success)] font-semibold"
              : isBye
                ? "text-accent font-semibold"
                : ""
          }
        >
          {statusText}
        </span>
      </div>

      {isBye ? (
        <ByeBody team={team1 ?? team2} seed={team1 ? match.seed1 : match.seed2} />
      ) : (
        <>
          <TeamRow
            seed={match.seed1}
            team={team1}
            isWinner={isCompleted && match.winner_team === 1}
            isLoser={isCompleted && match.winner_team === 2}
            score={match.team1_score}
            showScore={isCompleted}
          />
          <div className="border-t border-border/60 mx-3" />
          <TeamRow
            seed={match.seed2}
            team={team2}
            isWinner={isCompleted && match.winner_team === 2}
            isLoser={isCompleted && match.winner_team === 1}
            score={match.team2_score}
            showScore={isCompleted}
          />
        </>
      )}

      {setsDetail && isCompleted ? (
        <div className="px-3 py-1.5 text-[11px] text-muted border-t border-border bg-subtle/60 tabular-nums">
          {setsSummary(setsDetail)}
        </div>
      ) : null}

      {editing ? (
        <div className="px-3 py-3 border-t border-border bg-subtle/40">
          <BracketScoreInput
            tournamentId={tournamentId}
            matchId={match.id}
            scoringSystem={scoringSystem}
            initial={setsDetail}
            initialT1={match.team1_score}
            initialT2={match.team2_score}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : canEdit ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full px-3 py-2 border-t border-border text-xs font-semibold text-accent hover:bg-accent-soft text-center"
        >
          {isCompleted ? "Изменить счёт" : "Ввести счёт"}
        </button>
      ) : null}
    </div>
  );
}

function formatTeam(
  p1Id: string | null,
  p2Id: string | null,
  nameById: Record<string, string>,
): string | null {
  if (!p1Id || !p2Id) return null;
  return `${nameById[p1Id] ?? "—"} / ${nameById[p2Id] ?? "—"}`;
}

function TeamRow({
  seed,
  team,
  isWinner,
  isLoser,
  score,
  showScore,
}: {
  seed: number | null;
  team: string | null;
  isWinner: boolean;
  isLoser: boolean;
  score: number | null;
  showScore: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 pr-3 py-2 border-l-4 ${
        isWinner ? "border-accent" : "border-transparent"
      } ${isLoser ? "opacity-50" : ""}`}
      style={{ paddingLeft: "8px" }}
    >
      <span className="w-4 text-[10px] text-muted tabular-nums text-right flex-shrink-0">
        {seed != null ? seed : ""}
      </span>
      <span
        className={`flex-1 truncate ${isWinner ? "font-bold text-black" : "text-black"}`}
        title={team ?? undefined}
      >
        {team ?? <span className="text-muted italic">Ожидание</span>}
      </span>
      {showScore && score != null ? (
        <span
          className={`tabular-nums flex-shrink-0 ${
            isWinner ? "font-bold text-black" : "text-muted"
          }`}
        >
          {score}
        </span>
      ) : null}
    </div>
  );
}

function ByeBody({
  team,
  seed,
}: {
  team: string | null;
  seed: number | null;
}) {
  return (
    <>
      <div
        className="flex items-center gap-2 pr-3 py-2 border-l-4 border-accent"
        style={{ paddingLeft: "8px" }}
      >
        <span className="w-4 text-[10px] text-muted tabular-nums text-right flex-shrink-0">
          {seed != null ? seed : ""}
        </span>
        <span className="flex-1 truncate font-bold text-black" title={team ?? undefined}>
          {team ?? <span className="text-muted italic">—</span>}
        </span>
      </div>
      <div className="px-3 py-1.5 text-[11px] text-muted italic border-t border-border bg-subtle/60">
        Бай — авто-выход
      </div>
    </>
  );
}
