import { Card } from "@/components/ui/Card";
import { programTypeColor } from "@/lib/program-colors";
import type { WeeklyReport } from "@/lib/queries/report";
import { formatRub } from "./format";

const MAX_ROWS = 5;

export function TopProgramsCard({
  programs,
}: {
  programs: WeeklyReport["topPrograms"];
}) {
  const top = programs.slice(0, MAX_ROWS);
  return (
    <Card padded={false} className="p-5 flex flex-col gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Топ программ
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted">Нет данных за эту неделю.</p>
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
                    {p.program_name}
                  </div>
                  <div className="text-[11px] text-muted">
                    {p.sessions} {sessionsLabel(p.sessions)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-black tabular-nums whitespace-nowrap">
                  {formatRub(p.revenue_rub)}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function sessionsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "сессия";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сессии";
  return "сессий";
}
