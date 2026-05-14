"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import type { BracketMatch, ScoringSystem } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";
import { BracketMatchCard } from "./BracketMatchCard";

const COLUMN_WIDTH = 240;
const COLUMN_GAP = 56;
const UNIT_SPACING = 128;
const CHAMPION_WIDTH = 240;
const LINE_COLOR = "var(--color-border-strong)";

function roundLabelKey(round: number, totalRounds: number): {
  key: TranslationKey;
  vars?: Record<string, string | number>;
} {
  const remaining = totalRounds - round;
  if (remaining === 0) return { key: "finals.final" };
  if (remaining === 1) return { key: "finals.semifinal" };
  if (remaining === 2) return { key: "finals.quarterfinal" };
  if (remaining === 3) return { key: "finals.eighth_final" };
  if (remaining === 4) return { key: "finals.sixteenth_final" };
  return { key: "finals.round_n", vars: { n: round } };
}

function centerY(round: number, position: number): number {
  return (position + 0.5) * UNIT_SPACING * Math.pow(2, round - 1);
}

function columnLeft(round: number): number {
  return (round - 1) * (COLUMN_WIDTH + COLUMN_GAP);
}

export function Bracket({
  tournamentId,
  matches,
  scoringSystem,
  playerNameById,
  courtLabelById,
  readOnly = false,
}: {
  tournamentId: string;
  matches: BracketMatch[];
  scoringSystem: ScoringSystem;
  playerNameById: Record<string, string>;
  courtLabelById: Record<string, string>;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();

  if (matches.length === 0) {
    return <p className="text-sm text-muted">{t("finals.bracket_empty")}</p>;
  }

  const rounds = Array.from(new Set(matches.map((m) => m.round_number))).sort(
    (a, b) => a - b,
  );
  const totalRounds = rounds.length;
  const r1Count = matches.filter((m) => m.round_number === 1).length;
  const bracketHeight = r1Count * UNIT_SPACING;
  const championLeft = totalRounds * (COLUMN_WIDTH + COLUMN_GAP);
  const bracketWidth = championLeft + CHAMPION_WIDTH;

  const finalMatch =
    matches.find(
      (m) => m.round_number === totalRounds && m.position === 0,
    ) ?? null;

  const championP1Id =
    finalMatch && finalMatch.winner_team
      ? finalMatch.winner_team === 1
        ? finalMatch.team1_player1_id
        : finalMatch.team2_player1_id
      : null;
  const championP2Id =
    finalMatch && finalMatch.winner_team
      ? finalMatch.winner_team === 1
        ? finalMatch.team1_player2_id
        : finalMatch.team2_player2_id
      : null;
  const championLabel =
    championP1Id && championP2Id
      ? `${playerNameById[championP1Id] ?? "—"} / ${playerNameById[championP2Id] ?? "—"}`
      : null;

  const connectors = matches
    .filter((m) => m.round_number < totalRounds)
    .map((m) => {
      const x1 = columnLeft(m.round_number) + COLUMN_WIDTH;
      const y1 = centerY(m.round_number, m.position);
      const nextRound = m.round_number + 1;
      const nextPos = Math.floor(m.position / 2);
      const x2 = columnLeft(nextRound);
      const y2 = centerY(nextRound, nextPos);
      const midX = x1 + (x2 - x1) / 2;
      return {
        id: m.id,
        d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`,
      };
    });

  const championLine = finalMatch
    ? `M ${columnLeft(totalRounds) + COLUMN_WIDTH} ${centerY(totalRounds, 0)} L ${championLeft} ${centerY(totalRounds, 0)}`
    : null;

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-4">
      <div style={{ width: bracketWidth, minWidth: bracketWidth }}>
        <div className="relative mb-4" style={{ width: bracketWidth, height: 16 }}>
          {rounds.map((r) => {
            const lbl = roundLabelKey(r, totalRounds);
            return (
              <div
                key={`label-${r}`}
                className="absolute text-[11px] font-semibold text-muted uppercase tracking-[0.1em]"
                style={{ left: columnLeft(r), width: COLUMN_WIDTH }}
              >
                {t(lbl.key, lbl.vars)}
              </div>
            );
          })}
          <div
            className="absolute text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ left: championLeft, width: CHAMPION_WIDTH, color: "#b45309" }}
          >
            {t("finals.champion")}
          </div>
        </div>

        <div
          className="relative"
          style={{ width: bracketWidth, height: bracketHeight }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            width={bracketWidth}
            height={bracketHeight}
          >
            {connectors.map((c) => (
              <path
                key={c.id}
                d={c.d}
                stroke={LINE_COLOR}
                strokeWidth={1.5}
                fill="none"
              />
            ))}
            {championLine ? (
              <path
                d={championLine}
                stroke={LINE_COLOR}
                strokeWidth={1.5}
                fill="none"
              />
            ) : null}
          </svg>

          {matches.map((m) => (
            <div
              key={m.id}
              className="absolute"
              style={{
                left: columnLeft(m.round_number),
                top: centerY(m.round_number, m.position),
                width: COLUMN_WIDTH,
                transform: "translateY(-50%)",
              }}
            >
              <BracketMatchCard
                tournamentId={tournamentId}
                match={m}
                scoringSystem={scoringSystem}
                playerNameById={playerNameById}
                courtLabelById={courtLabelById}
                readOnly={readOnly}
              />
            </div>
          ))}

          {finalMatch ? (
            <div
              className="absolute"
              style={{
                left: championLeft,
                top: centerY(totalRounds, 0),
                width: CHAMPION_WIDTH,
                transform: "translateY(-50%)",
              }}
            >
              <ChampionCard label={championLabel} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ChampionCard({ label }: { label: string | null }) {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-lg bg-white px-4 py-5 flex flex-col items-center gap-2 text-center"
      style={{
        border: "2px solid #eab308",
        boxShadow:
          "0 0 0 4px rgba(234, 179, 8, 0.10), 0 4px 12px rgba(234, 179, 8, 0.18)",
      }}
    >
      <span className="text-3xl leading-none">🏆</span>
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "#b45309" }}
      >
        {t("finals.champion")}
      </span>
      {label ? (
        <span className="text-base font-bold text-black leading-tight">
          {label}
        </span>
      ) : (
        <span className="text-sm text-muted">{t("finals.awaiting")}</span>
      )}
    </div>
  );
}
