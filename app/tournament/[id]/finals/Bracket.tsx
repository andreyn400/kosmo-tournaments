"use client";

import type { BracketMatch, ScoringSystem } from "@/lib/types";
import { BracketMatchCard } from "./BracketMatchCard";

const ROUND_LABEL_RU: Record<string, string> = {
  "1/16": "1/16",
  "1/8": "1/8",
  "1/4": "Четвертьфиналы",
  "1/2": "Полуфиналы",
  final: "Финал",
};

function roundLabel(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  if (remaining === 0) return ROUND_LABEL_RU.final;
  if (remaining === 1) return ROUND_LABEL_RU["1/2"];
  if (remaining === 2) return ROUND_LABEL_RU["1/4"];
  if (remaining === 3) return ROUND_LABEL_RU["1/8"];
  if (remaining === 4) return ROUND_LABEL_RU["1/16"];
  return `Раунд ${round}`;
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
  if (matches.length === 0) {
    return <p className="text-sm text-muted">Сетка пуста.</p>;
  }

  const rounds = Array.from(new Set(matches.map((m) => m.round_number))).sort(
    (a, b) => a - b,
  );
  const totalRounds = rounds.length;
  const r1Count = matches.filter((m) => m.round_number === 1).length;
  const totalRows = r1Count * 2;

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div
        className="grid gap-x-6 min-w-max"
        style={{
          gridTemplateColumns: `repeat(${totalRounds}, minmax(220px, 260px))`,
          gridTemplateRows: `auto repeat(${totalRows}, minmax(36px, auto))`,
        }}
      >
        {rounds.map((r, idx) => (
          <div
            key={`label-${r}`}
            className="text-xs font-semibold text-muted uppercase tracking-[0.08em] pb-2"
            style={{ gridColumn: idx + 1, gridRow: 1 }}
          >
            {roundLabel(r, totalRounds)}
          </div>
        ))}

        {matches.map((m) => {
          const colIndex = rounds.indexOf(m.round_number) + 1;
          const span = 1 << m.round_number;
          const rowStart = m.position * span + 2;
          return (
            <div
              key={m.id}
              className="flex flex-col justify-center"
              style={{
                gridColumn: colIndex,
                gridRow: `${rowStart} / span ${span}`,
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
          );
        })}
      </div>
    </div>
  );
}
