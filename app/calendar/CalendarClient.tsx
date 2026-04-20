"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addMonths, todayIso } from "@/lib/calendar-range";
import type { CalendarEvent } from "@/lib/queries/calendar";
import type { Court } from "@/lib/types";
import { CalendarHeader } from "./CalendarHeader";
import { DayView } from "./DayView";
import { EventPopover } from "./EventPopover";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { type CalendarView } from "./view";

export function CalendarClient({
  view,
  date,
  events,
  courts,
}: {
  view: CalendarView;
  date: string;
  events: CalendarEvent[];
  courts: Court[];
}) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const navigate = useCallback(
    (next: { view?: CalendarView; date?: string }) => {
      const nextView = next.view ?? view;
      const nextDate = next.date ?? date;
      router.push(`/calendar?view=${nextView}&date=${nextDate}`);
    },
    [router, view, date],
  );

  const onPrev = () => {
    if (view === "day") navigate({ date: addDays(date, -1) });
    else if (view === "week") navigate({ date: addDays(date, -7) });
    else navigate({ date: addMonths(date, -1) });
  };

  const onNext = () => {
    if (view === "day") navigate({ date: addDays(date, 1) });
    else if (view === "week") navigate({ date: addDays(date, 7) });
    else navigate({ date: addMonths(date, 1) });
  };

  const onToday = () => navigate({ date: todayIso() });
  const onJumpDate = (nextDate: string) => navigate({ date: nextDate });
  const onChangeView = (nextView: CalendarView) =>
    navigate({ view: nextView });

  return (
    <div className="flex flex-col gap-5">
      <CalendarHeader
        view={view}
        date={date}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        onJumpDate={onJumpDate}
        onChangeView={onChangeView}
      />
      {view === "day" ? (
        <DayView
          date={date}
          events={events}
          courts={courts}
          onSelectEvent={setSelectedEvent}
        />
      ) : view === "week" ? (
        <WeekView
          date={date}
          events={events}
          onSelectEvent={setSelectedEvent}
          onNavigateToDay={(iso) => navigate({ view: "day", date: iso })}
        />
      ) : (
        <MonthView
          date={date}
          events={events}
          onSelectEvent={setSelectedEvent}
          onNavigateToDay={(iso) => navigate({ view: "day", date: iso })}
        />
      )}
      <EventPopover
        event={selectedEvent}
        courts={courts}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
