import { Card } from "@/components/ui/Card";
import type { WeeklyReport } from "@/lib/queries/report";

export function CourtUtilizationCard({
  utilization,
}: {
  utilization: WeeklyReport["courtUtilization"];
}) {
  return (
    <Card padded={false} className="p-5 flex flex-col gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Загрузка кортов
      </div>
      {utilization.length === 0 ? (
        <p className="text-sm text-muted">Нет активных кортов.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {utilization.map((u) => (
            <CourtRow key={u.court_id} u={u} />
          ))}
        </div>
      )}
    </Card>
  );
}

function CourtRow({
  u,
}: {
  u: WeeklyReport["courtUtilization"][number];
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 shrink-0 text-sm font-medium text-black">
        Корт {u.court_number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${u.pct}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 text-[12px] text-secondary tabular-nums whitespace-nowrap">
        {u.booked_hours} ч / {u.available_hours} ч · {u.pct} %
      </div>
    </div>
  );
}
