import { listEventKindsByDate } from "@/lib/queries/calendar";
import { addMonths, todayIso } from "@/lib/calendar-range";
import { MiniCalendar } from "./MiniCalendar";

export async function SidebarMiniCalendar() {
  const today = todayIso();
  const fromIso = addMonths(today, -1);
  const toIso = addMonths(today, 12);
  const eventKindsByDate = await listEventKindsByDate(fromIso, toIso);
  return <MiniCalendar eventKindsByDate={eventKindsByDate} />;
}
