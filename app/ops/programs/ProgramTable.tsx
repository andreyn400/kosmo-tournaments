"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import type { Program } from "@/lib/types";
import { ProgramRow } from "./ProgramRow";

interface ProgramTableProps {
  programs: Program[];
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
}

export function ProgramTable({
  programs,
  expandedId,
  onToggleExpand,
}: ProgramTableProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card border border-border bg-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
            <th
              className="pl-4 pr-2 py-2 text-left"
              style={{ width: 28 }}
              aria-label={t("programs.col.aria.type")}
            />
            <th className="px-2 py-2 text-left">{t("programs.col.name")}</th>
            <th className="px-2 py-2 text-right whitespace-nowrap">
              {t("programs.col.duration_short")}
            </th>
            <th
              className="px-2 py-2 text-right"
              title={t("programs.col.courts_long")}
            >
              {t("programs.col.courts_short")}
            </th>
            <th
              className="px-2 py-2 text-right"
              title={t("programs.col.players_long")}
            >
              {t("programs.col.players_short")}
            </th>
            <th className="px-2 py-2 text-right whitespace-nowrap">
              {t("programs.col.off_peak")}
            </th>
            <th className="px-2 py-2 text-right">{t("programs.col.peak")}</th>
            <th
              className="pl-2 pr-4 py-2 text-right whitespace-nowrap"
              title={t("programs.col.per_player_aria")}
            >
              {t("programs.col.per_player")}
            </th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p, i) => (
            <ProgramRow
              key={p.id}
              program={p}
              expanded={expandedId === p.id}
              onToggle={() =>
                onToggleExpand(expandedId === p.id ? null : p.id)
              }
              zebra={i % 2 === 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
