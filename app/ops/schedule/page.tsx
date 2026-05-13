import { PageShell } from "@/components/site/PageShell";
import { listSessionsForRange } from "@/lib/queries/schedule";
import { listRentalBlocksForRange } from "@/lib/queries/rentals";
import { listActiveCourts } from "@/lib/queries/courts";
import { listActivePrograms } from "@/lib/queries/programs";
import { listCoaches } from "@/lib/queries/coaches";
import { SchedulerShell } from "./SchedulerShell";
import {
  isValidIsoDate,
  todayIso,
  weekMondayIso,
  weekSundayIso,
} from "./date-helpers";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  view?: string;
  date?: string;
  court?: string;
}>;

export default async function OpsSchedulePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const view = sp.view === "week" ? "week" : "day";
  const date = isValidIsoDate(sp.date) ? sp.date : todayIso();

  // Day view fetches one day; week view fetches Mon..Sun for the week
  // containing `date`.
  const rangeFrom = view === "day" ? date : weekMondayIso(date);
  const rangeTo = view === "day" ? date : weekSundayIso(date);

  const [sessions, rentalBlocks, courts, programs, coaches] = await Promise.all([
    listSessionsForRange(rangeFrom, rangeTo),
    listRentalBlocksForRange(rangeFrom, rangeTo),
    listActiveCourts(),
    listActivePrograms(),
    listCoaches({ activeOnly: true }),
  ]);

  // Week view needs a court selection — first active court if none in URL.
  const courtId =
    view === "week"
      ? courts.find((c) => c.id === sp.court)?.id ?? courts[0]?.id ?? null
      : null;

  return (
    <PageShell title="Расписание">
      <SchedulerShell
        view={view}
        date={date}
        courtId={courtId}
        sessions={sessions}
        rentalBlocks={rentalBlocks}
        courts={courts}
        programs={programs}
        coaches={coaches}
      />
    </PageShell>
  );
}
