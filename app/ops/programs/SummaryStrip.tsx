"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import {
  PEAK_LABEL,
  PROGRAM_GROUPS,
  groupForType,
} from "@/lib/program-groups";
import type { Program } from "@/lib/types";

export function SummaryStrip({ programs }: { programs: Program[] }) {
  const { t, tPlural } = useTranslation();
  const total = programs.length;
  const active = programs.filter((p) => p.is_active).length;

  const countByGroup = new Map<string, number>();
  for (const p of programs) {
    const g = groupForType(p.type);
    countByGroup.set(g.key, (countByGroup.get(g.key) ?? 0) + 1);
  }
  const groupsPresent = PROGRAM_GROUPS.filter(
    (g) => (countByGroup.get(g.key) ?? 0) > 0,
  );

  const programsWord = tPlural(total, {
    one: "programs.summary.programs_one",
    few: "programs.summary.programs_few",
    many: "programs.summary.programs_many",
  });
  const catsWord = tPlural(groupsPresent.length, {
    one: "programs.cats.one",
    few: "programs.cats.few",
    many: "programs.cats.many",
  });

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
      <div className="flex items-center gap-3 text-secondary">
        <span>
          <strong className="text-black font-semibold tabular-nums">
            {total}
          </strong>{" "}
          {programsWord}
        </span>
        <span aria-hidden className="text-fade">
          ·
        </span>
        <span>
          <strong className="text-black font-semibold tabular-nums">
            {active}
          </strong>{" "}
          {t("programs.summary.active_lower")}
        </span>
        <span aria-hidden className="text-fade">
          ·
        </span>
        <span>
          <strong className="text-black font-semibold tabular-nums">
            {groupsPresent.length}
          </strong>{" "}
          {catsWord}
        </span>
        <span aria-hidden className="text-fade">
          ·
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]"
          />
          {t("programs.summary.peak_label", { window: PEAK_LABEL })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
        {groupsPresent.map((g) => {
          const n = countByGroup.get(g.key) ?? 0;
          return (
            <span
              key={g.key}
              title={t(g.labelKey)}
              className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] font-semibold tabular-nums"
              style={{ background: g.colorSoft, color: g.color }}
            >
              <span aria-hidden>{g.icon}</span>
              <span>{n}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
