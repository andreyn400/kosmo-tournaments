import { Card } from "@/components/ui/Card";
import type { WeeklyReport } from "@/lib/queries/report";
import { formatRub } from "./format";

export function CoachPayoutsTable({
  payouts,
}: {
  payouts: WeeklyReport["coachPayouts"];
}) {
  return (
    <Card padded={false} className="overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Выплаты тренерам
      </div>
      {payouts.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">
          Нет сессий тренеров за эту неделю.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className="text-left px-5 py-2">Тренер</th>
              <th className="text-right px-3 py-2">Сессий</th>
              <th className="text-right px-3 py-2">Сбор</th>
              <th className="text-right px-5 py-2">Выплата</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr
                key={p.coach_id}
                className="border-t border-border h-11 hover:bg-subtle/50"
              >
                <td className="px-5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: p.coach_color }}
                    />
                    <span className="text-black font-medium truncate">
                      {p.coach_name}
                    </span>
                  </div>
                </td>
                <td className="px-3 text-right text-secondary tabular-nums">
                  {p.sessions}
                </td>
                <td className="px-3 text-right text-secondary tabular-nums">
                  {formatRub(p.gross_revenue_rub)}
                </td>
                <td className="px-5 text-right text-black font-semibold tabular-nums">
                  {formatRub(p.payout_rub)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
