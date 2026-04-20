import { PageShell } from "@/components/site/PageShell";
import { listActiveCourts } from "@/lib/queries/courts";
import { listCalendarEventsInRange } from "@/lib/queries/calendar";
import {
  dayRange,
  isValidIsoDate,
  monthGridRange,
  todayIso,
  weekRange,
} from "@/lib/calendar-range";
import { CalendarClient } from "./CalendarClient";
import {
  CALENDAR_VIEWS,
  type CalendarView,
} from "./view";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;

  const view: CalendarView = CALENDAR_VIEWS.includes(
    params.view as CalendarView,
  )
    ? (params.view as CalendarView)
    : "day";
  const date =
    params.date && isValidIsoDate(params.date) ? params.date : todayIso();

  const range =
    view === "day"
      ? dayRange(date)
      : view === "week"
        ? weekRange(date)
        : monthGridRange(date);

  const [events, courts] = await Promise.all([
    listCalendarEventsInRange(range.start, range.end),
    listActiveCourts(),
  ]);

  return (
    <PageShell title="Календарь">
      <CalendarClient
        view={view}
        date={date}
        events={events}
        courts={courts}
      />
    </PageShell>
  );
}
