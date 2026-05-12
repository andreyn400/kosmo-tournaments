"use client";

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
  return (
    <div className="rounded-card border border-border bg-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
            <th
              className="pl-4 pr-2 py-2 text-left"
              style={{ width: 28 }}
              aria-label="Тип"
            />
            <th className="px-2 py-2 text-left">Название</th>
            <th className="px-2 py-2 text-right whitespace-nowrap">Длит.</th>
            <th className="px-2 py-2 text-right" title="Кортов нужно">
              К
            </th>
            <th className="px-2 py-2 text-right" title="Макс. игроков">
              И
            </th>
            <th className="px-2 py-2 text-right whitespace-nowrap">Вне пика</th>
            <th className="px-2 py-2 text-right">Пик</th>
            <th
              className="pl-2 pr-4 py-2 text-right whitespace-nowrap"
              title="Пик / Вне пика с игрока"
            >
              За игрока
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
