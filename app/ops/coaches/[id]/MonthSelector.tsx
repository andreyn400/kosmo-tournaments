"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatMonthStr } from "@/lib/i18n/format";

function shiftMonth(monthStr: string, delta: number): string {
  const [yStr, mStr] = monthStr.split("-");
  let y = Number.parseInt(yStr, 10);
  let m = Number.parseInt(mStr, 10) + delta;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function MonthSelector({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const { t, lang } = useTranslation();

  function go(next: string) {
    const params = new URLSearchParams(search.toString());
    params.set("month", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => go(shiftMonth(month, -1))}
        aria-label={t("coach.month_selector.aria.prev")}
        className="inline-flex h-8 w-8 items-center justify-center text-muted hover:text-black hover:bg-subtle rounded-l-md"
      >
        ◀
      </button>
      <span className="px-3 h-8 inline-flex items-center text-xs font-semibold text-black tabular-nums">
        {formatMonthStr(month, lang)}
      </span>
      <button
        type="button"
        onClick={() => go(shiftMonth(month, 1))}
        aria-label={t("coach.month_selector.aria.next")}
        className="inline-flex h-8 w-8 items-center justify-center text-muted hover:text-black hover:bg-subtle rounded-r-md"
      >
        ▶
      </button>
    </div>
  );
}
