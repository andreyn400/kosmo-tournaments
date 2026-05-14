"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { addDays, startOfWeekMon, todayIso } from "@/lib/calendar-range";
import { formatDateRu } from "@/lib/format-date";

export function ReportWeekHeader({
  weekStartIso,
  weekEndIso,
}: {
  weekStartIso: string;
  weekEndIso: string;
}) {
  const router = useRouter();
  const navigate = (iso: string) => router.push(`/ops/report?week=${iso}`);

  const thisWeek = startOfWeekMon(todayIso());
  const isThisWeek = weekStartIso === thisWeek;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Предыдущая неделя"
          onClick={() => navigate(addDays(weekStartIso, -7))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-secondary hover:bg-subtle hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Следующая неделя"
          onClick={() => navigate(addDays(weekStartIso, 7))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-secondary hover:bg-subtle hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigate(thisWeek)}
          disabled={isThisWeek}
        >
          Эта неделя
        </Button>
      </div>
      <div className="text-sm text-secondary tabular-nums">
        {formatDateRu(weekStartIso)} — {formatDateRu(weekEndIso)}
      </div>
    </div>
  );
}
