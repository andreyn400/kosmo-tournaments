import { listEventDates } from "@/lib/queries/calendar";
import { MiniCalendar } from "./MiniCalendar";

export async function SidebarMiniCalendar() {
  const dates = await listEventDates();
  return <MiniCalendar eventDates={dates} />;
}
