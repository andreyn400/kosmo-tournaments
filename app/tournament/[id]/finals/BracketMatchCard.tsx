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

  const t1Name1 = match.team1_player1_id
    ? (playerNameById[match.team1_player1_id] ?? "—")
    : null;
  const t1Name2 = match.team1_player2_id
    ? (playerNameById[match.team1_player2_id] ?? "—")
    : null;
  const t2Name1 = match.team2_player1_id
    ? (playerNameById[match.team2_player1_id] ?? "—")
    : null;
  const t2Name2 = match.team2_player2_id
    ? (playerNameById[match.team2_player2_id] ?? "—")
    : null;

  const team1Label = t1Name1 && t1Name2 ? `${t1Name1} / ${t1Name2}` : "—";
  const team2Label = t2Name1 && t2Name2 ? `${t2Name1} / ${t2Name2}` : "—";

  const isSets = scoringGroup(scoringSystem) === "sets";
  const setsDetail: SetsDetail | null =
    isSets && isSetsDetail(match.score_detail)
      ? (match.score_detail as SetsDetail)
      : null;

  const isBye = match.status === "bye";
  const isCompleted = match.status === "completed";
  const hasBothSides = t1Name1 && t2Name1;
  const canEdit = !readOnly && !isBye && hasBothSides;

  const winner = match.winner_team;
  const courtLabel = match.court_id ? courtLabelById[match.court_id] : null;

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-white overflow-hidden text-sm">
      <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-muted uppercase tracking-[0.08em]">
        <span>
          R{match.round_number}·M{match.position + 1}
        </span>
        <span className="flex items-center gap-2">
          {courtLabel ? <span>К{courtLabel}</span> : null}
          {isBye ? (
            <span className="text-accent font-semibold">BYE</span>
          ) : isCompleted ? (
            <span className="text-[var(--color-success)] font-semibold">
              Сыгран
            </span>
          ) : hasBothSides ? (
            <span>Ожидает</span>
          ) : (
            <span>Ждёт соперников</span>
          )}
        </span>
      </div>

      <TeamRow
        seed={match.seed1}
        label={team1Label}
        winning={isCompleted && winner === 1}
        losing={isCompleted && winner === 2}
        bye={isBye && winner === 2 && !t1Name1}
        score={match.team1_score}
        isSets={isSets}
      />
      <div className="border-t border-border/60" />
      <TeamRow
        seed={match.seed2}
        label={team2Label}
        winning={isCompleted && winner === 2}
        losing={isCompleted && winner === 1}
        bye={isBye && winner === 1 && !t2Name1}
        score={match.team2_score}
        isSets={isSets}
      />

      {setsDetail && isCompleted ? (
        <div className="px-3 py-1.5 text-[11px] text-muted border-t border-border bg-subtle/40">
          {setsSummary(setsDetail)}
        </div>
      ) : null}

      {editing ? (
        <div className="px-3 py-3 border-t border-border bg-subtle/30">
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
          className="w-full text-left px-3 py-1.5 border-t border-border text-xs text-accent hover:bg-accent-soft/40"
        >
          {isCompleted ? "Изменить счёт" : "Ввести счёт"}
        </button>
      ) : null}
    </div>
  );
}

function TeamRow({
  seed,
  label,
  winning,
  losing,
  bye,
  score,
  isSets,
}: {
  seed: number | null;
  label: string;
  winning: boolean;
  losing: boolean;
  bye: boolean;
  score: number | null;
  isSets: boolean;
}) {
  const nameClass = winning
    ? "font-bold text-black"
    : losing
      ? "text-muted"
      : "text-black";
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="w-5 text-[11px] text-muted tabular-nums text-right">
        {seed != null ? seed : ""}
      </span>
      <span className={`flex-1 truncate ${nameClass}`} title={label}>
        {bye ? <span className="text-muted italic">—</span> : label}
      </span>
      {score != null ? (
        <span className={`tabular-nums font-bold ${winning ? "text-black" : "text-muted"}`}>
          {isSets ? score : score}
        </span>
      ) : null}
    </div>
  );
}
