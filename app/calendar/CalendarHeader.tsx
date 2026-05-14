"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatDate, formatDateRange, formatMonth, getWeekdayLongLabels } from "@/lib/i18n/format";
import { CALENDAR_VIEW_LABEL_KEY } from "@/lib/i18n/calendar-keys";
import type { Lang } from "@/lib/i18n/types";
import {
  isSameDay,
  isValidIsoDate,
  todayIso,
  weekRange,
  weekdayMonIndex,
} from "@/lib/calendar-range";
import { CALENDAR_VIEWS, type CalendarView } from "./view";

function headerLabel(
  view: CalendarView,
  date: string,
  lang: Lang,
  weekPrefix: (range: string) => string,
): string {
  if (view === "day") {
    const weekdayList = getWeekdayLongLabels(lang);
    const weekdayLabel = weekdayList[weekdayMonIndex(date)];
    const dayName = lang === "ru" ? weekdayLabel.toLowerCase() : weekdayLabel;
    return `${formatDate(date, lang)}, ${dayName}`;
  }
  if (view === "week") {
    const { start, end } = weekRange(date);
    return weekPrefix(formatDateRange(start, end, lang));
  }
  const [y, m] = date.split("-").map(Number);
  return formatMonth(y, m - 1, lang);
}

function todayDisabled(view: CalendarView, date: string): boolean {
  const t = todayIso();
  if (view === "day") return isSameDay(date, t);
  if (view === "week") {
    const { start, end } = weekRange(date);
    return t >= start && t <= end;
  }
  const [y, m] = date.split("-").map(Number);
  const [ty, tm] = t.split("-").map(Number);
  return y === ty && m === tm;
}

export function CalendarHeader({
  view,
  date,
  onPrev,
  onNext,
  onToday,
  onJumpDate,
  onChangeView,
}: {
  view: CalendarView;
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onJumpDate: (iso: string) => void;
  onChangeView: (v: CalendarView) => void;
}) {
  const { t, lang } = useTranslation();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  const weekPrefix = (range: string) =>
    t("calendar.week_label", { range });

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex rounded-[var(--radius-button)] border border-border overflow-hidden bg-surface">
          <button
            type="button"
            onClick={onPrev}
            aria-label={t("calendar.aria.prev")}
            className="h-9 w-9 inline-flex items-center justify-center text-muted hover:text-black hover:bg-subtle"
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
            onClick={onNext}
            aria-label={t("calendar.aria.next")}
            className="h-9 w-9 inline-flex items-center justify-center text-muted hover:text-black hover:bg-subtle border-l border-border"
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
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onToday}
          disabled={todayDisabled(view, date)}
        >
          {t("calendar.today_cta")}
        </Button>
        <button
          type="button"
          onClick={openPicker}
          className="text-sm md:text-base font-semibold text-black px-2.5 py-1.5 rounded-[var(--radius-button)] hover:bg-subtle"
          aria-label={t("calendar.aria.open_date_picker")}
        >
          {headerLabel(view, date, lang, weekPrefix)}
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          onChange={(e) => {
            const v = e.target.value;
            if (v && isValidIsoDate(v)) onJumpDate(v);
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      <div
        role="tablist"
        aria-label={t("calendar.aria.view_picker")}
        className="inline-flex rounded-[var(--radius-button)] border border-border bg-subtle p-0.5 self-start"
      >
        {CALENDAR_VIEWS.map((v) => {
          const active = v === view;
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeView(v)}
              className={`h-8 px-3 text-sm rounded-[calc(var(--radius-button)-2px)] transition-colors ${
                active
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-muted hover:text-black"
              }`}
            >
              {t(CALENDAR_VIEW_LABEL_KEY[v])}
            </button>
          );
        })}
      </div>
    </div>
  );
}
