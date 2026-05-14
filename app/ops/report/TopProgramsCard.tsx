"use client";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import { programTypeColor } from "@/lib/program-colors";
import type { WeeklyReport } from "@/lib/queries/report";

const MAX_ROWS = 5;

export function TopProgramsCard({
  programs,
}: {
  programs: WeeklyReport["topPrograms"];
}) {
  const { t, tPlural, lang } = useTranslation();
  const top = programs.slice(0, MAX_ROWS);
  return (
    <Card padded={false} className="p-5 flex flex-col gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {t("report.top_programs.title")}
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted">{t("report.top_programs.empty")}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {top.map((p) => {
            const color = programTypeColor(p.program_type).block;
            return (
              <li
                key={p.program_id ?? p.program_name}
                className="flex items-center gap-3"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ background: color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-black truncate">
                    {p.program_name ?? t("schedule.session.no_program")}
                  </div>
                  <div className="text-[11px] text-muted">
                    {p.sessions}{" "}
                    {tPlural(p.sessions, {
                      one: "report.sessions.count_one",
                      few: "report.sessions.count_few",
                      many: "report.sessions.count_many",
                    })}
                  </div>
                </div>
                <div className="text-sm font-semibold text-black tabular-nums whitespace-nowrap">
                  {formatRub(p.revenue_rub, lang)}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
