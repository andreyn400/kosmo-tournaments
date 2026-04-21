import {
  listTodayDisplayEvents,
  listUpcomingTickerEvents,
  todayIso,
} from "@/lib/queries/display";
import { DisplayClient } from "./DisplayClient";

export const dynamic = "force-dynamic";

export default async function DisplayPage() {
  const today = todayIso();
  const [events, ticker] = await Promise.all([
    listTodayDisplayEvents(today),
    listUpcomingTickerEvents(today, 7),
  ]);

  return <DisplayClient events={events} ticker={ticker} todayIso={today} />;
}
