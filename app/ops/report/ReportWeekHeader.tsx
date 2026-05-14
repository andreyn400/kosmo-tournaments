"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatDate } from "@/lib/i18n/format";
import { addDays, startOfWeekMon, todayIso } from "@/lib/calendar-range";

export function ReportWeekHeader({
  weekStartIso,
  weekEndIso,
}: {
  weekStartIso: string;
  weekEndIso: string;
}) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const navigate = (iso: string) => router.push(`/ops/report?week=${iso}`);

  const thisWeek = startOfWeekMon(todayIso());
  const isThisWeek = weekStartIso === thisWeek;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t("report.aria.prev_week")}
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
          aria-label={t("report.aria.next_week")}
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
          {t("report.this_week_cta")}
        </Button>
      </div>
      <div className="text-sm text-secondary tabular-nums">
        {formatDate(weekStartIso, lang)} — {formatDate(weekEndIso, lang)}
      </div>
    </div>
  );
}
