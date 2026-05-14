import { Card } from "@/components/ui/Card";
import type { WeeklyReport } from "@/lib/queries/report";
import { formatRub } from "./format";

const TOURNAMENT_NOTE =
  "Сумма entry_fee × число регистраций для турниров с датой начала в этой неделе. Не учитывает фактическую оплату.";

export function RevenueSummaryCard({
  revenue,
}: {
  revenue: WeeklyReport["revenue"];
}) {
  return (
    <Card padded={false} className="p-5 flex flex-col gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Доход за неделю
      </div>
      <div className="text-3xl font-semibold text-black tabular-nums">
        {formatRub(revenue.total_rub)}
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        <Row label="Аренда" value={formatRub(revenue.rentals_rub)} />
        <Row label="Сессии" value={formatRub(revenue.scheduler_rub)} />
        <Row
          label="Турниры (расчётно)"
          value={formatRub(revenue.tournaments_estimated_rub)}
          note={TOURNAMENT_NOTE}
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
