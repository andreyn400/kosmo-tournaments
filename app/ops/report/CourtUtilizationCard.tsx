"use client";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { WeeklyReport } from "@/lib/queries/report";

export function CourtUtilizationCard({
  utilization,
}: {
  utilization: WeeklyReport["courtUtilization"];
}) {
  const { t } = useTranslation();
  return (
    <Card padded={false} className="p-5 flex flex-col gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {t("report.utilization.title")}
      </div>
      {utilization.length === 0 ? (
        <p className="text-sm text-muted">{t("report.utilization.no_active")}</p>
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
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 shrink-0 text-sm font-medium text-black">
        {t("report.utilization.court_label", { n: u.court_number })}
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
        {t("report.utilization.row", {
          booked: u.booked_hours,
          available: u.available_hours,
          pct: u.pct,
        })}
      </div>
    </div>
  );
}
