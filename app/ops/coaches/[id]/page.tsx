import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { getCoach, listAvailability } from "@/lib/queries/coaches";
import { listSessionsForCoach } from "@/lib/queries/schedule-sessions";
import { listActivePrograms } from "@/lib/queries/programs";
import { listActiveCourts } from "@/lib/queries/courts";
import { CoachProfileCard } from "./CoachProfileCard";
import { AvailabilityPanel } from "./AvailabilityPanel";
import { SessionLogPanel } from "./SessionLogPanel";
import { currentMonthStr } from "../format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ month?: string }>;

export default async function CoachDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const month =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : currentMonthStr();

  const coach = await getCoach(id);
  if (!coach) notFound();

  const [availability, sessions, programs, courts] = await Promise.all([
    listAvailability(id),
    listSessionsForCoach(id, month),
    listActivePrograms(),
    listActiveCourts(),
  ]);

  return (
    <PageShell title={coach.name}>
      <div className="flex flex-col gap-5">
        <CoachProfileCard coach={coach} />
        <SessionLogPanel
          coach={coach}
          sessions={sessions}
          programs={programs}
          courts={courts}
          month={month}
        />
        <AvailabilityPanel coachId={coach.id} windows={availability} />
      </div>
    </PageShell>
  );
}
