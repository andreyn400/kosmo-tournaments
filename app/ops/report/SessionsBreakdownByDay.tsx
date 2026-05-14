"use client";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  formatDate,
  formatRub,
  formatTime,
  getWeekdayLongLabels,
} from "@/lib/i18n/format";
import { programTypeColor } from "@/lib/program-colors";
import type { Lang } from "@/lib/i18n/types";
import type { WeeklyReport } from "@/lib/queries/report";

function weekdayLabel(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  const jsDow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const monDow = (jsDow + 6) % 7;
  const list = getWeekdayLongLabels(lang);
  const name = list[monDow];
  return lang === "ru"
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : name;
}

export function SessionsBreakdownByDay({
  sessionsByDay,
}: {
  sessionsByDay: WeeklyReport["sessionsByDay"];
}) {
  const { t } = useTranslation();
  return (
    <Card padded={false} className="overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {t("report.sessions.title")}
      </div>
      {sessionsByDay.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">
          {t("report.sessions.empty")}
        </p>
      ) : (
        <div className="flex flex-col">
          {sessionsByDay.map((day) => (
            <DayTable key={day.date} day={day} />
          ))}
        </div>
      )}
    </Card>
  );
}

function DayTable({
  day,
}: {
  day: WeeklyReport["sessionsByDay"][number];
}) {
  const { t, tPlural, lang } = useTranslation();
  return (
    <section className="border-t border-border">
      <header className="px-5 py-2.5 bg-subtle/50 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-black">
          {weekdayLabel(day.date, lang)}, {formatDate(day.date, lang)}
        </h3>
        <span className="text-[11px] text-muted">
          {day.rows.length}{" "}
          {tPlural(day.rows.length, {
            one: "report.sessions.count_one",
            few: "report.sessions.count_few",
            many: "report.sessions.count_many",
          })}
        </span>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            <th className="text-left px-5 py-2 w-[100px]">
              {t("report.sessions.col.time")}
            </th>
            <th className="text-left px-3 py-2">
              {t("report.sessions.col.program")}
            </th>
            <th className="text-left px-3 py-2">
              {t("report.sessions.col.coaches")}
            </th>
            <th className="text-left px-3 py-2 w-[90px]">
              {t("report.sessions.col.courts")}
            </th>
            <th className="text-right px-3 py-2 w-[60px]">
              {t("report.sessions.col.attendees")}
            </th>
            <th className="text-right px-5 py-2 w-[110px]">
              {t("report.sessions.col.revenue")}
            </th>
          </tr>
        </thead>
        <tbody>
          {day.rows.map((row) => {
            const color = programTypeColor(row.program_type).block;
            return (
              <tr
                key={row.id}
                className="border-t border-border h-11 hover:bg-subtle/50"
              >
                <td className="px-5 text-secondary tabular-nums whitespace-nowrap">
                  {formatTime(row.start_time)}–{formatTime(row.end_time)}
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-sm shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-black font-medium truncate">
                      {row.program_name ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-3 text-secondary">
                  <span className="block truncate" title={row.coach_names.join(", ")}>
                    {row.coach_names.length > 0
                      ? row.coach_names.join(", ")
                      : "—"}
                  </span>
                </td>
                <td className="px-3 text-secondary tabular-nums whitespace-nowrap">
                  {row.court_numbers.length > 0
                    ? row.court_numbers.map((n) => `№${n}`).join(", ")
                    : "—"}
                </td>
                <td className="px-3 text-right text-secondary tabular-nums">
                  {row.attendees}
                </td>
                <td className="px-5 text-right text-black font-semibold tabular-nums">
                  {formatRub(row.revenue_rub, lang)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
