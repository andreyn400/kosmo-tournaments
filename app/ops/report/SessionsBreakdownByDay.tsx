import { Card } from "@/components/ui/Card";
import { programTypeColor } from "@/lib/program-colors";
import type { WeeklyReport } from "@/lib/queries/report";
import { formatDateRu, formatTimeRu } from "@/lib/format-date";
import { formatRub } from "./format";

const WEEKDAYS_RU = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
];

function weekdayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const jsDow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const monDow = (jsDow + 6) % 7;
  const name = WEEKDAYS_RU[monDow];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function SessionsBreakdownByDay({
  sessionsByDay,
}: {
  sessionsByDay: WeeklyReport["sessionsByDay"];
}) {
  return (
    <Card padded={false} className="overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Все сессии
      </div>
      {sessionsByDay.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">
          В этой неделе нет сессий.
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
  return (
    <section className="border-t border-border">
      <header className="px-5 py-2.5 bg-subtle/50 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-black">
          {weekdayLabel(day.date)}, {formatDateRu(day.date)}
        </h3>
        <span className="text-[11px] text-muted">
          {day.rows.length} {sessionsLabel(day.rows.length)}
        </span>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            <th className="text-left px-5 py-2 w-[100px]">Время</th>
            <th className="text-left px-3 py-2">Программа</th>
            <th className="text-left px-3 py-2">Тренеры</th>
            <th className="text-left px-3 py-2 w-[90px]">Корты</th>
            <th className="text-right px-3 py-2 w-[60px]">Игр.</th>
            <th className="text-right px-5 py-2 w-[110px]">Доход</th>
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
                  {formatTimeRu(row.start_time)}–{formatTimeRu(row.end_time)}
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
                  {formatRub(row.revenue_rub)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function sessionsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "сессия";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сессии";
  return "сессий";
}
