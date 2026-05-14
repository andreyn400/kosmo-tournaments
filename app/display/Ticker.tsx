"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { TOURNAMENT_FORMAT_KEY } from "@/lib/i18n/tournament-keys";
import { formatShortDateWithWeekday } from "@/lib/i18n/format";
import type { Lang } from "@/lib/i18n/types";
import type { TickerEvent } from "@/lib/queries/display";

function relativeDateLabel(
  iso: string,
  todayIso: string,
  tomorrowLabel: string,
  lang: Lang,
): string {
  if (iso === addDays(todayIso, 1)) return tomorrowLabel;
  return formatShortDateWithWeekday(iso, lang);
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function courtsSummary(nums: number[], prefix: string): string {
  if (nums.length === 0) return "";
  if (nums.length === 1) return `${prefix}${nums[0]}`;
  return `${prefix}${nums[0]}–${prefix}${nums[nums.length - 1]}`;
}

type TickerProps = {
  events: TickerEvent[];
  todayIso?: string;
};

function Dot() {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
    />
  );
}

export function Ticker({ events, todayIso: today }: TickerProps) {
  const { t, lang } = useTranslation();
  const anchor = today ?? new Date().toISOString().slice(0, 10);
  const tomorrowLabel = t("display.ticker.tomorrow");
  const courtPrefix = t("tournament.card.court_short_prefix");

  return (
    <div
      className="flex-shrink-0 bg-surface border-t border-border flex items-center overflow-hidden"
      style={{ height: "44px" }}
    >
      {events.length === 0 ? (
        <div className="px-8 text-sm text-muted">
          {t("display.ticker.empty")}
        </div>
      ) : (
        <div className="flex gap-8 whitespace-nowrap px-8 animate-[ticker_90s_linear_infinite]">
          {[...events, ...events].map((e, i) => (
            <span
              key={`${e.key}:${i}`}
              className="inline-flex items-center gap-3 text-sm text-muted"
            >
              <span className="font-semibold text-secondary">
                {relativeDateLabel(e.date, anchor, tomorrowLabel, lang)}:
              </span>
              <span className="text-black">{e.name}</span>
              <Dot />
              <span>{t(TOURNAMENT_FORMAT_KEY[e.format])}</span>
              {e.startTime && (
                <>
                  <Dot />
                  <span className="tabular-nums">{e.startTime.slice(0, 5)}</span>
                </>
              )}
              {e.courtNumbers.length > 0 && (
                <>
                  <Dot />
                  <span>{courtsSummary(e.courtNumbers, courtPrefix)}</span>
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
