"use client";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import type { WeeklyReport } from "@/lib/queries/report";

export function RevenueSummaryCard({
  revenue,
}: {
  revenue: WeeklyReport["revenue"];
}) {
  const { t, lang } = useTranslation();
  return (
    <Card padded={false} className="p-5 flex flex-col gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {t("report.revenue.title")}
      </div>
      <div className="text-3xl font-semibold text-black tabular-nums">
        {formatRub(revenue.total_rub, lang)}
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        <Row
          label={t("report.revenue.rentals")}
          value={formatRub(revenue.rentals_rub, lang)}
        />
        <Row
          label={t("report.revenue.sessions")}
          value={formatRub(revenue.scheduler_rub, lang)}
        />
        <Row
          label={t("report.revenue.tournaments_estimated")}
          value={formatRub(revenue.tournaments_estimated_rub, lang)}
          note={t("report.revenue.tournaments_estimated_tooltip")}
        />
      </dl>
    </Card>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1 text-secondary">
        <span>{label}</span>
        {note && (
          <span
            aria-label={note}
            title={note}
            className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-border text-[10px] font-semibold text-muted cursor-help"
          >
            i
          </span>
        )}
      </dt>
      <dd className="text-black font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
