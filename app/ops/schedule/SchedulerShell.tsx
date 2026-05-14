"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  formatDateRange,
  formatDateWithWeekday,
} from "@/lib/i18n/format";
import type {
  Coach,
  Court,
  Program,
  RentalBlockForGrid,
  ScheduleSessionForGrid,
} from "@/lib/types";
import {
  shiftDays,
  todayIso,
  weekMondayIso,
  weekSundayIso,
} from "./date-helpers";
import { DayGrid } from "./DayGrid";
import { WeekGrid } from "./WeekGrid";
import { SessionPopover } from "./SessionPopover";
import { RentalInfoPopover } from "./RentalInfoPopover";
import { createScheduleAction } from "./create-schedule-action";
import { updateScheduleAction } from "./update-schedule-action";
import { deleteScheduleAction } from "./delete-schedule-action";
import type { RawScheduleInput } from "./schedule-input";

export type SchedulerView = "day" | "week";

interface SchedulerShellProps {
  view: SchedulerView;
  date: string;
  courtId: string | null;
  sessions: ScheduleSessionForGrid[];
  rentalBlocks: RentalBlockForGrid[];
  courts: Court[];
  programs: Program[];
  coaches: Coach[];
}

export function SchedulerShell({
  view,
  date,
  courtId,
  sessions,
  rentalBlocks,
  courts,
  programs,
  coaches,
}: SchedulerShellProps) {
  const router = useRouter();
  const { t, tPlural, lang } = useTranslation();
  const today = todayIso();
  const isToday = view === "day" && date === today;

  type PopoverState =
    | {
        mode: "create";
        anchor: DOMRect;
        date: string;
        time: string;
        courtId: string;
      }
    | { mode: "edit"; anchor: DOMRect; session: ScheduleSessionForGrid };
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [rentalPopover, setRentalPopover] = useState<{
    block: RentalBlockForGrid;
    anchor: DOMRect;
  } | null>(null);

  const handleEmptyCellClick = useCallback(
    (d: string, time: string, cid: string, anchor: DOMRect) => {
      setRentalPopover(null);
      setPopover({ mode: "create", anchor, date: d, time, courtId: cid });
    },
    [],
  );
  const handleSessionClick = useCallback(
    (s: ScheduleSessionForGrid, anchor: DOMRect) => {
      setRentalPopover(null);
      setPopover({ mode: "edit", anchor, session: s });
    },
    [],
  );
  const handleRentalClick = useCallback(
    (b: RentalBlockForGrid, anchor: DOMRect) => {
      setPopover(null);
      setRentalPopover({ block: b, anchor });
    },
    [],
  );

  const handleCreate = useCallback(
    async (raw: RawScheduleInput) => {
      const res = await createScheduleAction(raw);
      if (!res.error) router.refresh();
      return res;
    },
    [router],
  );
  const handleUpdate = useCallback(
    async (sessionId: string, raw: RawScheduleInput) => {
      const res = await updateScheduleAction(sessionId, raw);
      if (!res.error) router.refresh();
      return res;
    },
    [router],
  );
  const handleDelete = useCallback(
    async (sessionId: string) => {
      const res = await deleteScheduleAction(sessionId);
      if (!res.error) router.refresh();
      return res;
    },
    [router],
  );

  const navigate = useCallback(
    (next: { view?: SchedulerView; date?: string; courtId?: string | null }) => {
      const v = next.view ?? view;
      const d = next.date ?? date;
      const c = next.courtId !== undefined ? next.courtId : courtId;
      const params = new URLSearchParams();
      params.set("view", v);
      params.set("date", d);
      if (v === "week" && c) params.set("court", c);
      router.push(`/ops/schedule?${params.toString()}`);
    },
    [router, view, date, courtId],
  );

  const stepBack = useCallback(() => {
    navigate({ date: shiftDays(date, view === "day" ? -1 : -7) });
  }, [date, view, navigate]);

  const stepForward = useCallback(() => {
    navigate({ date: shiftDays(date, view === "day" ? 1 : 7) });
  }, [date, view, navigate]);

  const jumpToday = useCallback(() => {
    navigate({ date: today });
  }, [navigate, today]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) navigate({ date: shiftDays(date, -7) });
        else stepBack();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) navigate({ date: shiftDays(date, 7) });
        else stepForward();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        jumpToday();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, navigate, stepBack, stepForward, jumpToday]);

  const dateLabel = useMemo(() => {
    if (view === "day") return formatDateWithWeekday(date, lang);
    return formatDateRange(weekMondayIso(date), weekSundayIso(date), lang);
  }, [view, date, lang]);

  const sessionCount = sessions.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1.5">
          <NavArrow
            direction="left"
            onClick={stepBack}
            title={t("schedule.aria.prev")}
          />
          <NavArrow
            direction="right"
            onClick={stepForward}
            title={t("schedule.aria.next")}
          />
          <Button
            variant={isToday ? "primary" : "secondary"}
            size="sm"
            onClick={jumpToday}
            title={t("schedule.aria.today")}
          >
            {t("schedule.today_cta")}
          </Button>
        </div>

        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-base font-semibold text-black truncate">
            {dateLabel}
          </span>
          {isToday && (
            <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-accent flex-shrink-0">
              {t("schedule.today_chip")}
            </span>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {view === "week" && courts.length > 0 && (
            <label className="inline-flex items-center gap-2 text-xs">
              <span className="text-muted">{t("schedule.court_label")}</span>
              <Select
                value={courtId ?? ""}
                onChange={(e) => navigate({ courtId: e.target.value })}
                className="!h-9 !w-auto"
              >
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <ViewToggle view={view} onChange={(v) => navigate({ view: v })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
        <span>
          {view === "day" ? t("schedule.subtitle.day") : t("schedule.subtitle.week")} ·{" "}
          <span className="tabular-nums text-secondary font-semibold">
            {sessionCount}
          </span>{" "}
          {tPlural(sessionCount, {
            one: "schedule.sessions.one",
            few: "schedule.sessions.few",
            many: "schedule.sessions.many",
          })}
        </span>
        <span className="hidden sm:inline">
          {t("schedule.subtitle.shortcuts")}
        </span>
      </div>

      {view === "day" ? (
        <DayGrid
          date={date}
          courts={courts}
          sessions={sessions}
          rentalBlocks={rentalBlocks}
          onEmptyCellClick={handleEmptyCellClick}
          onSessionClick={handleSessionClick}
          onRentalClick={handleRentalClick}
        />
      ) : courtId ? (
        <WeekGrid
          date={date}
          courts={courts}
          courtId={courtId}
          sessions={sessions}
          rentalBlocks={rentalBlocks}
          onEmptyCellClick={handleEmptyCellClick}
          onSessionClick={handleSessionClick}
          onRentalClick={handleRentalClick}
        />
      ) : (
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">{t("schedule.no_courts_week")}</p>
        </div>
      )}

      {popover?.mode === "create" && (
        <SessionPopover
          mode="create"
          anchor={popover.anchor}
          prefillDate={popover.date}
          prefillTime={popover.time}
          prefillCourtId={popover.courtId}
          programs={programs}
          courts={courts}
          coaches={coaches}
          onClose={() => setPopover(null)}
          onSubmit={handleCreate}
        />
      )}
      {popover?.mode === "edit" && (
        <SessionPopover
          mode="edit"
          anchor={popover.anchor}
          session={popover.session}
          programs={programs}
          courts={courts}
          coaches={coaches}
          onClose={() => setPopover(null)}
          onSubmit={(raw) => handleUpdate(popover.session.id, raw)}
          onDelete={() => handleDelete(popover.session.id)}
        />
      )}
      {rentalPopover && (
        <RentalInfoPopover
          block={rentalPopover.block}
          anchor={rentalPopover.anchor}
          courts={courts}
          onClose={() => setRentalPopover(null)}
        />
      )}
    </div>
  );
}

function NavArrow({
  direction,
  onClick,
  title,
}: {
  direction: "left" | "right";
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-button)] bg-surface border border-border text-secondary hover:bg-subtle hover:border-border-strong transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        style={{
          transform: direction === "right" ? "rotate(180deg)" : undefined,
        }}
      >
        <path
          d="M15 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: SchedulerView;
  onChange: (v: SchedulerView) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t("schedule.aria.view_picker")}
      className="inline-flex p-0.5 rounded-md bg-subtle border border-border"
    >
      <ToggleButton
        active={view === "day"}
        onClick={() => onChange("day")}
        label={t("schedule.view.day")}
      />
      <ToggleButton
        active={view === "week"}
        onClick={() => onChange("week")}
        label={t("schedule.view.week")}
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "inline-flex items-center px-3 h-7 rounded text-[11.5px] font-semibold transition-colors",
        active
          ? "bg-surface text-black shadow-sm"
          : "text-muted hover:text-black",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
